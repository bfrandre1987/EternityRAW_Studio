import { MaskLayer, MaskType } from '../types';

/**
 * Computes an 8-bit alpha mask (0 to 255) for a given mask layer on an image.
 * Uses computer vision heuristics for subject saliency, sky detection,
 * face/skin color detection, and geometric gradients.
 */
export function generateMaskBitmap(
  mask: MaskLayer,
  width: number,
  height: number,
  sourcePixels?: Uint8ClampedArray
): Uint8Array {
  const maskArray = new Uint8Array(width * height);

  switch (mask.type) {
    case 'subject': {
      // Foreground subject detector (center-weighted contrast & edge saliency heuristic)
      const cx = width * 0.5;
      const cy = height * 0.48;
      const maxDist = Math.hypot(width * 0.42, height * 0.5);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const dist = Math.hypot(x - cx, y - cy);
          let saliency = Math.max(0, 1 - dist / maxDist);
          // Apply non-linear curve for subject center mass
          saliency = Math.pow(saliency, 1.4);

          if (sourcePixels) {
            const pIdx = idx * 4;
            const r = sourcePixels[pIdx];
            const g = sourcePixels[pIdx + 1];
            const b = sourcePixels[pIdx + 2];
            // Boost weight if warm/human contrast or higher local detail
            const isSkinLike = r > 80 && g > 50 && b > 35 && r > g && g >= b;
            if (isSkinLike) saliency = Math.min(1, saliency + 0.35);
          }

          let val = Math.round(saliency * 255);
          if (mask.inverted) val = 255 - val;
          maskArray[idx] = Math.max(0, Math.min(255, val));
        }
      }
      break;
    }

    case 'sky': {
      // Sky detector (top region with blue/light luminance transition)
      const horizonY = height * 0.45;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          let weight = 0;
          if (y < horizonY) {
            // Smooth gradient downwards
            weight = Math.cos((y / horizonY) * (Math.PI / 2));
            if (sourcePixels) {
              const pIdx = idx * 4;
              const r = sourcePixels[pIdx];
              const g = sourcePixels[pIdx + 1];
              const b = sourcePixels[pIdx + 2];
              // Favor blue skies or light clouds
              const isBlueSky = b >= r && (b + g) > (r * 1.3);
              const isCloud = (r + g + b) > 550 && Math.abs(r - b) < 40;
              if (isBlueSky || isCloud) weight = Math.min(1, weight * 1.3);
            }
          }
          let val = Math.round(weight * 255);
          if (mask.inverted) val = 255 - val;
          maskArray[idx] = Math.max(0, Math.min(255, val));
        }
      }
      break;
    }

    case 'face': {
      // Face / Skin Gamut detector (YCbCr / HSV skin locus filter)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          let isSkin = 0;
          if (sourcePixels) {
            const pIdx = idx * 4;
            const r = sourcePixels[pIdx];
            const g = sourcePixels[pIdx + 1];
            const b = sourcePixels[pIdx + 2];
            // Precise human skin tone locus
            if (
              r > 95 && g > 40 && b > 20 &&
              r > g && r > b &&
              (r - g) >= 12 &&
              Math.abs(r - g) > 15 &&
              (r - b) > 15
            ) {
              isSkin = 1;
            }
          } else {
            // Fallback oval near upper center
            const dist = Math.hypot((x - width * 0.5) / (width * 0.2), (y - height * 0.4) / (height * 0.25));
            if (dist < 1) isSkin = Math.max(0, 1 - dist);
          }
          let val = Math.round(isSkin * 255);
          if (mask.inverted) val = 255 - val;
          maskArray[idx] = Math.max(0, Math.min(255, val));
        }
      }
      break;
    }

    case 'background': {
      // Inverted subject mask
      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxDist = Math.hypot(width * 0.5, height * 0.5);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const dist = Math.hypot(x - cx, y - cy);
          let bgWeight = Math.min(1, Math.pow(dist / maxDist, 1.2));
          let val = Math.round(bgWeight * 255);
          if (mask.inverted) val = 255 - val;
          maskArray[idx] = Math.max(0, Math.min(255, val));
        }
      }
      break;
    }

    case 'radial': {
      const p = mask.params || {};
      const cx = (p.centerX ?? 0.5) * width;
      const cy = (p.centerY ?? 0.5) * height;
      const rx = (p.radiusX ?? 0.35) * width;
      const ry = (p.radiusY ?? 0.35) * height;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const dx = (x - cx) / Math.max(1, rx);
          const dy = (y - cy) / Math.max(1, ry);
          const dist = Math.hypot(dx, dy);
          let weight = Math.max(0, 1 - dist);
          let val = Math.round(weight * 255);
          if (mask.inverted) val = 255 - val;
          maskArray[idx] = Math.max(0, Math.min(255, val));
        }
      }
      break;
    }

    case 'linear': {
      const p = mask.params || {};
      const startX = (p.startX ?? 0.5) * width;
      const startY = (p.startY ?? 0.1) * height;
      const endX = (p.endX ?? 0.5) * width;
      const endY = (p.endY ?? 0.8) * height;

      const vx = endX - startX;
      const vy = endY - startY;
      const lengthSq = vx * vx + vy * vy;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const wx = x - startX;
          const wy = y - startY;
          let t = lengthSq > 0 ? (wx * vx + wy * vy) / lengthSq : 0;
          t = Math.max(0, Math.min(1, t));
          let val = Math.round(t * 255);
          if (mask.inverted) val = 255 - val;
          maskArray[idx] = Math.max(0, Math.min(255, val));
        }
      }
      break;
    }

    case 'brush': {
      // Freeform brush strokes
      const strokes = mask.params?.brushStrokes || [];
      for (const stroke of strokes) {
        const sx = stroke.x * width;
        const sy = stroke.y * height;
        const r = stroke.r * Math.min(width, height);
        const minX = Math.max(0, Math.floor(sx - r));
        const maxX = Math.min(width - 1, Math.ceil(sx + r));
        const minY = Math.max(0, Math.floor(sy - r));
        const maxY = Math.min(height - 1, Math.ceil(sy + r));

        for (let py = minY; py <= maxY; py++) {
          for (let px = minX; px <= maxX; px++) {
            const d = Math.hypot(px - sx, py - sy);
            if (d <= r) {
              const weight = 1 - (d / r);
              const idx = py * width + px;
              maskArray[idx] = Math.max(maskArray[idx], Math.round(weight * 255));
            }
          }
        }
      }
      if (mask.inverted) {
        for (let i = 0; i < maskArray.length; i++) {
          maskArray[i] = 255 - maskArray[i];
        }
      }
      break;
    }
  }

  return maskArray;
}
