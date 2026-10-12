import { EditAdjustments } from '../types';
import { generateMaskBitmap } from './aiMasking';

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
  shadowClippedPercent: number;
  highlightClippedPercent: number;
}

// Convert Kelvin temperature to RGB scaling factors (Tanner Helland algorithm)
function kelvinToRgbMultiplier(kelvin: number): [number, number, number] {
  const temp = Math.max(2000, Math.min(10000, kelvin)) / 100;
  let r = 255;
  let g = 255;
  let b = 255;

  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    if (temp <= 19) {
      b = 0;
    } else {
      b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    }
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    b = 255;
  }

  // Baseline at 5500K daylight
  const baseR = 255;
  const baseG = 249;
  const baseB = 239;

  return [
    Math.max(0.2, Math.min(2.5, r / baseR)),
    Math.max(0.2, Math.min(2.5, g / baseG)),
    Math.max(0.2, Math.min(2.5, b / baseB)),
  ];
}

// Convert RGB to HSL (H: 0-360, S: 0-1, L: 0-1)
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

// Convert HSL back to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/**
 * Capture One Auto Retouch Analyzer
 * Analyzes photo statistics and suggests intelligent adjustments:
 * - Smart auto exposure & dynamic range
 * - Color cast neutralization (Grey world)
 * - Contrast & Dehaze
 * - Auto Skin Retouching
 */
export function analyzeAndAutoRetouch(srcImageData: ImageData): Partial<EditAdjustments> {
  const data = srcImageData.data;
  const totalPixels = data.length / 4;
  let sumR = 0, sumG = 0, sumB = 0, sumLum = 0;
  let skinCount = 0;
  let minLum = 255, maxLum = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    sumR += r;
    sumG += g;
    sumB += b;
    sumLum += lum;

    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;

    // Skin detection
    if (r > 90 && g > 45 && b > 25 && r > g && r > b && (r - g) >= 15) {
      skinCount++;
    }
  }

  const sampleCount = totalPixels / 4;
  const avgR = sumR / sampleCount;
  const avgG = sumG / sampleCount;
  const avgB = sumB / sampleCount;
  const avgLum = sumLum / sampleCount;

  // Auto exposure: target ~128 midtone
  let autoExp = 0;
  if (avgLum < 90) autoExp = Math.min(1.8, (120 - avgLum) / 75);
  else if (avgLum > 165) autoExp = Math.max(-1.5, (135 - avgLum) / 80);

  // Auto White Balance Kelvin & Tint
  const tempShift = ((avgB - avgR) / 255) * 1200;
  const autoTemp = Math.round(Math.max(3800, Math.min(7500, 5500 + tempShift)));
  const autoTint = Math.round(Math.max(-25, Math.min(25, (avgR - avgG) * 0.4)));

  // Auto Dynamic Range (Shadows & Highlights)
  const isContrastLow = (maxLum - minLum) < 140;
  const autoContrast = isContrastLow ? 15 : 6;
  const autoHighlights = maxLum > 230 ? -30 : -15;
  const autoShadows = minLum < 30 ? 25 : 12;

  // Auto Skin Retouching
  const skinRatio = skinCount / sampleCount;
  const autoSkinSmooth = skinRatio > 0.08 ? 40 : 15;
  const autoSkinWarmth = skinRatio > 0.08 ? 8 : 0;

  return {
    exposure: Number(autoExp.toFixed(2)),
    contrast: autoContrast,
    highlights: autoHighlights,
    shadows: autoShadows,
    whites: 8,
    blacks: -6,
    temperature: autoTemp,
    tint: autoTint,
    vibrance: 14,
    saturation: 2,
    clarity: 10,
    dehaze: 8,
    autoSkinSmooth,
    autoSkinWarmth,
    highlightRecovery: 40,
    shadowLift: 25,
    sharpness: 45,
  };
}

/**
 * Main Raw Photo Processing Pipeline (32-bit float color simulation)
 */
export function processRawPhoto(
  sourceCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adj: EditAdjustments,
  targetCtx: CanvasRenderingContext2D,
  activeMaskId?: string,
  showMaskOverlay?: boolean
): HistogramData {
  const srcImgData = sourceCtx.getImageData(0, 0, width, height);
  const srcData = srcImgData.data;

  const outImgData = targetCtx.createImageData(width, height);
  const outData = outImgData.data;

  // Precompute global multipliers
  const expFactor = Math.pow(2, adj.exposure);
  const [kwR, kwG, kwB] = kelvinToRgbMultiplier(adj.temperature);
  const tintR = 1 + adj.tint * 0.003;
  const tintG = 1 - adj.tint * 0.003;

  const contrastFactor = (259 * (adj.contrast + 255)) / (255 * (259 - adj.contrast));
  const satFactor = 1 + adj.saturation / 100;
  const vibFactor = adj.vibrance / 100;

  // Clarity / Texture boost factor
  const clarityCoeff = adj.clarity / 250;
  const dehazeOffset = adj.dehaze * 0.4;

  // Capture One Skin Retouch
  const skinSmoothVal = adj.autoSkinSmooth / 100;
  const skinWarmthVal = adj.autoSkinWarmth;

  // Generate masks bitmaps if masks are active
  const compiledMasks: { mask: Uint8Array; adj: EditAdjustments['masks'][0]['adjustments'] }[] = [];
  let activeMaskBitmap: Uint8Array | null = null;

  if (adj.masks && adj.masks.length > 0) {
    for (const m of adj.masks) {
      if (m.enabled) {
        const maskBmp = generateMaskBitmap(m, width, height, srcData);
        compiledMasks.push({ mask: maskBmp, adj: m.adjustments });
        if (activeMaskId && m.id === activeMaskId) {
          activeMaskBitmap = maskBmp;
        }
      }
    }
  }

  // Histogram buckets
  const histR = new Array(256).fill(0);
  const histG = new Array(256).fill(0);
  const histB = new Array(256).fill(0);
  const histLum = new Array(256).fill(0);
  let shadowClipped = 0;
  let highlightClipped = 0;

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.hypot(cx, cy);

  // Fast Pseudo-Random Grain table
  const grainAmp = (adj.grain / 100) * 22;

  // 3-Way Color Grading precomputations
  const hasShadowGrade = adj.shadowTint && (adj.shadowTint.saturation > 0 || !!(adj.shadowTint.luminance && adj.shadowTint.luminance !== 0));
  const [stR, stG, stB] = hasShadowGrade && adj.shadowTint.saturation > 0 ? hslToRgb(adj.shadowTint.hue, 0.85, 0.5) : [0, 0, 0];
  const shadowSatMul = hasShadowGrade ? (adj.shadowTint.saturation / 100) * 0.6 : 0;
  const shadowLumMul = hasShadowGrade && adj.shadowTint.luminance ? adj.shadowTint.luminance * 0.4 : 0;

  const midtoneTint = adj.midtoneTint || { hue: 0, saturation: 0, luminance: 0 };
  const hasMidtoneGrade = midtoneTint && (midtoneTint.saturation > 0 || !!(midtoneTint.luminance && midtoneTint.luminance !== 0));
  const [mtR, mtG, mtB] = hasMidtoneGrade && midtoneTint.saturation > 0 ? hslToRgb(midtoneTint.hue, 0.85, 0.5) : [0, 0, 0];
  const midtoneSatMul = hasMidtoneGrade ? (midtoneTint.saturation / 100) * 0.55 : 0;
  const midtoneLumMul = hasMidtoneGrade && midtoneTint.luminance ? midtoneTint.luminance * 0.4 : 0;

  const hasHighlightGrade = adj.highlightTint && (adj.highlightTint.saturation > 0 || !!(adj.highlightTint.luminance && adj.highlightTint.luminance !== 0));
  const [htR, htG, htB] = hasHighlightGrade && adj.highlightTint.saturation > 0 ? hslToRgb(adj.highlightTint.hue, 0.85, 0.5) : [0, 0, 0];
  const highlightSatMul = hasHighlightGrade ? (adj.highlightTint.saturation / 100) * 0.6 : 0;
  const highlightLumMul = hasHighlightGrade && adj.highlightTint.luminance ? adj.highlightTint.luminance * 0.4 : 0;

  const balanceOffset = (adj.colorGradingBalance || 0) * 0.002;
  const midCenter = Math.max(0.2, Math.min(0.8, 0.5 + balanceOffset));

  // Process pixel by pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = srcData[idx];
      let g = srcData[idx + 1];
      let b = srcData[idx + 2];

      // 1. Exposure EV Multiplier
      r *= expFactor;
      g *= expFactor;
      b *= expFactor;

      // 2. White Balance (Kelvin & Tint)
      r *= kwR * tintR;
      g *= kwG * tintG;
      b *= kwB;

      // 3. Highlight Recovery & Shadow Lift (Capture One Dynamic Range)
      const curLum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Highlights compression
      if (adj.highlights !== 0 || adj.highlightRecovery > 0) {
        const highWeight = Math.max(0, (curLum - 128) / 127);
        const comp = (adj.highlights * 0.5 - adj.highlightRecovery * 0.4) * highWeight;
        r += comp;
        g += comp;
        b += comp;
      }

      // Shadows lift
      if (adj.shadows !== 0 || adj.shadowLift > 0) {
        const shadowWeight = Math.max(0, (128 - curLum) / 128);
        const lift = (adj.shadows * 0.6 + adj.shadowLift * 0.4) * shadowWeight;
        r += lift;
        g += lift;
        b += lift;
      }

      // Whites & Blacks
      if (adj.whites !== 0) {
        const wWeight = Math.max(0, (curLum - 180) / 75);
        r += adj.whites * 0.5 * wWeight;
        g += adj.whites * 0.5 * wWeight;
        b += adj.whites * 0.5 * wWeight;
      }
      if (adj.blacks !== 0) {
        const bWeight = Math.max(0, (75 - curLum) / 75);
        r += adj.blacks * 0.5 * bWeight;
        g += adj.blacks * 0.5 * bWeight;
        b += adj.blacks * 0.5 * bWeight;
      }

      // 4. Contrast (S-Curve centering around 128)
      if (adj.contrast !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
      }

      // 5. Dehaze
      if (adj.dehaze !== 0) {
        r = r + dehazeOffset;
        g = g + dehazeOffset;
        b = b + dehazeOffset;
      }

      // 6. Capture One Auto Retouch: Skin Smoothing & Soft Glow
      if (skinSmoothVal > 0) {
        const isSkin = r > 85 && g > 40 && b > 20 && r > g && (r - g) > 12;
        if (isSkin) {
          // Soften micro-blemishes towards localized mean skin tone
          const skinTarget = (r * 0.5 + g * 0.35 + b * 0.15);
          r = r * (1 - skinSmoothVal * 0.35) + (skinTarget * 1.15) * (skinSmoothVal * 0.35);
          g = g * (1 - skinSmoothVal * 0.3) + (skinTarget * 0.95) * (skinSmoothVal * 0.3);
          b = b * (1 - skinSmoothVal * 0.25) + (skinTarget * 0.8) * (skinSmoothVal * 0.25);
          // Skin warmth
          if (skinWarmthVal !== 0) {
            r += skinWarmthVal * 0.4;
            g += skinWarmthVal * 0.15;
          }
        }
      }

      // 7. Clarity & Micro-texture
      if (clarityCoeff !== 0) {
        const midtoneWeight = 1 - Math.abs(curLum - 128) / 128;
        const cDelta = (curLum - 128) * clarityCoeff * midtoneWeight;
        r += cDelta;
        g += cDelta;
        b += cDelta;
      }

      // 8. Vibrance & Saturation
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const gray = (r + g + b) / 3;
      const currentSat = maxC > 0 ? (maxC - minC) / maxC : 0;

      // Vibrance: affects less saturated colors more
      if (vibFactor !== 0) {
        const vWeight = (1 - currentSat) * vibFactor;
        r = r + (r - gray) * vWeight;
        g = g + (g - gray) * vWeight;
        b = b + (b - gray) * vWeight;
      }
      // Global Saturation
      if (satFactor !== 1) {
        r = gray + (r - gray) * satFactor;
        g = gray + (g - gray) * satFactor;
        b = gray + (b - gray) * satFactor;
      }

      // 9. Professional 3-Way Color Grading (Shadows, Midtones, Highlights)
      const normLum = curLum / 255;

      // Shadows zone
      if (hasShadowGrade && normLum < midCenter) {
        const shadowWeight = (midCenter - normLum) / midCenter;
        if (shadowSatMul > 0) {
          const str = shadowWeight * shadowSatMul;
          r = r * (1 - str) + stR * str;
          g = g * (1 - str) + stG * str;
          b = b * (1 - str) + stB * str;
        }
        if (shadowLumMul !== 0) {
          const lumShift = shadowLumMul * shadowWeight;
          r += lumShift;
          g += lumShift;
          b += lumShift;
        }
      }

      // Midtones zone (bell-curve peak around midCenter)
      if (hasMidtoneGrade) {
        const distFromMid = Math.abs(normLum - midCenter);
        const midWeight = Math.max(0, 1 - distFromMid * 2.2);
        if (midWeight > 0.01) {
          if (midtoneSatMul > 0) {
            const str = midWeight * midtoneSatMul;
            r = r * (1 - str) + mtR * str;
            g = g * (1 - str) + mtG * str;
            b = b * (1 - str) + mtB * str;
          }
          if (midtoneLumMul !== 0) {
            const lumShift = midtoneLumMul * midWeight;
            r += lumShift;
            g += lumShift;
            b += lumShift;
          }
        }
      }

      // Highlights zone
      if (hasHighlightGrade && normLum > midCenter) {
        const highWeight = (normLum - midCenter) / (1 - midCenter);
        if (highlightSatMul > 0) {
          const str = highWeight * highlightSatMul;
          r = r * (1 - str) + htR * str;
          g = g * (1 - str) + htG * str;
          b = b * (1 - str) + htB * str;
        }
        if (highlightLumMul !== 0) {
          const lumShift = highlightLumMul * highWeight;
          r += lumShift;
          g += lumShift;
          b += lumShift;
        }
      }

      // 10. AI Masks application (Localized adjustments)
      const pixelIdx = y * width + x;
      for (const m of compiledMasks) {
        const maskAlpha = m.mask[pixelIdx] / 255;
        if (maskAlpha > 0.01) {
          const mAdj = m.adj;
          if (mAdj.exposure !== 0) {
            const mExp = Math.pow(2, mAdj.exposure);
            r = r * (1 - maskAlpha) + (r * mExp) * maskAlpha;
            g = g * (1 - maskAlpha) + (g * mExp) * maskAlpha;
            b = b * (1 - maskAlpha) + (b * mExp) * maskAlpha;
          }
          if (mAdj.saturation !== 0) {
            const mSat = 1 + mAdj.saturation / 100;
            const pGray = (r + g + b) / 3;
            const satR = pGray + (r - pGray) * mSat;
            const satG = pGray + (g - pGray) * mSat;
            const satB = pGray + (b - pGray) * mSat;
            r = r * (1 - maskAlpha) + satR * maskAlpha;
            g = g * (1 - maskAlpha) + satG * maskAlpha;
            b = b * (1 - maskAlpha) + satB * maskAlpha;
          }
          if (mAdj.temperature !== 0) {
            const tShift = mAdj.temperature * 0.6;
            r = r + tShift * maskAlpha;
            b = b - tShift * maskAlpha;
          }
          if (mAdj.clarity !== 0) {
            const cShift = mAdj.clarity * 0.4 * maskAlpha;
            r += cShift;
            g += cShift;
            b += cShift;
          }
        }
      }

      // 11. Vignette
      if (adj.vignette !== 0) {
        const dist = Math.hypot(x - cx, y - cy) / maxRadius;
        const vigFactor = 1 + (adj.vignette / 100) * Math.pow(dist, 1.8);
        r *= vigFactor;
        g *= vigFactor;
        b *= vigFactor;
      }

      // 12. Film Grain
      if (grainAmp > 0) {
        // High frequency pseudo random noise
        const n = (((x * 12.9898 + y * 78.233) % 1) * 2 - 1) * grainAmp;
        r += n;
        g += n;
        b += n;
      }

      // Clamp values
      r = Math.max(0, Math.min(255, Math.round(r)));
      g = Math.max(0, Math.min(255, Math.round(g)));
      b = Math.max(0, Math.min(255, Math.round(b)));

      // 13. Active Mask Overlay (Ruby Red translucent visualizer)
      if (showMaskOverlay && activeMaskBitmap) {
        const maskAlpha = activeMaskBitmap[pixelIdx] / 255;
        if (maskAlpha > 0.05) {
          // Ruby Red Lightroom mask color
          r = Math.round(r * (1 - maskAlpha * 0.5) + 235 * (maskAlpha * 0.5));
          g = Math.round(g * (1 - maskAlpha * 0.5) + 40 * (maskAlpha * 0.5));
          b = Math.round(b * (1 - maskAlpha * 0.5) + 70 * (maskAlpha * 0.5));
        }
      }

      outData[idx] = r;
      outData[idx + 1] = g;
      outData[idx + 2] = b;
      outData[idx + 3] = 255;

      // Histogram bins & clipping tracking
      histR[r]++;
      histG[g]++;
      histB[b]++;
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      histLum[lum]++;

      if (lum === 0) shadowClipped++;
      if (lum === 255) highlightClipped++;
    }
  }

  targetCtx.putImageData(outImgData, 0, 0);

  const totalPixels = width * height;
  return {
    r: histR,
    g: histG,
    b: histB,
    lum: histLum,
    shadowClippedPercent: Number(((shadowClipped / totalPixels) * 100).toFixed(1)),
    highlightClippedPercent: Number(((highlightClipped / totalPixels) * 100).toFixed(1)),
  };
}

/**
 * Render an exported photo blob with optional watermark and scaling
 */
export async function renderExportPhoto(
  sourceImage: HTMLImageElement,
  adj: EditAdjustments,
  format: 'jpeg' | 'webp' | 'png',
  quality: number,
  maxDimension?: number,
  watermarkText?: string,
  watermarkPos: 'bottom-right' | 'bottom-left' | 'center' | 'top-right' = 'bottom-right'
): Promise<Blob> {
  let w = sourceImage.naturalWidth || sourceImage.width;
  let h = sourceImage.naturalHeight || sourceImage.height;

  if (maxDimension && (w > maxDimension || h > maxDimension)) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w);
      w = maxDimension;
    } else {
      w = Math.round((w * maxDimension) / h);
      h = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Draw source image scaled
  ctx.drawImage(sourceImage, 0, 0, w, h);

  // Process RAW pipeline
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = w;
  targetCanvas.height = h;
  const targetCtx = targetCanvas.getContext('2d')!;

  processRawPhoto(ctx, w, h, adj, targetCtx, undefined, false);

  // Apply Watermark if provided
  if (watermarkText && watermarkText.trim()) {
    targetCtx.save();
    const fontSize = Math.max(16, Math.round(w * 0.024));
    targetCtx.font = `600 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    targetCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    targetCtx.shadowBlur = 8;
    targetCtx.shadowOffsetX = 2;
    targetCtx.shadowOffsetY = 2;

    const padding = Math.round(w * 0.03);
    const textMetrics = targetCtx.measureText(watermarkText);
    const textWidth = textMetrics.width;

    let wx = padding;
    let wy = h - padding;

    if (watermarkPos === 'bottom-right') {
      wx = w - textWidth - padding;
      wy = h - padding;
    } else if (watermarkPos === 'top-right') {
      wx = w - textWidth - padding;
      wy = padding + fontSize;
    } else if (watermarkPos === 'center') {
      wx = (w - textWidth) / 2;
      wy = h / 2 + fontSize / 2;
    }

    targetCtx.fillText(watermarkText, wx, wy);
    targetCtx.restore();
  }

  const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  const q = Math.max(0.1, Math.min(1.0, quality / 100));

  return new Promise((resolve, reject) => {
    targetCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Export rendering failed'));
      },
      mimeType,
      q
    );
  });
}
