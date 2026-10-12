import React, { useEffect, useRef } from 'react';
import { HistogramData } from '../utils/rawProcessor';
import { ExifData } from '../types';
import { AlertTriangle, Camera, Cpu } from 'lucide-react';

interface HistogramProps {
  histogramData: HistogramData | null;
  exif?: ExifData;
  showClippingWarning: boolean;
  onToggleClippingWarning: () => void;
}

export const Histogram: React.FC<HistogramProps> = ({
  histogramData,
  exif,
  showClippingWarning,
  onToggleClippingWarning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#14171d';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = '#222731';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const x = (width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    if (!histogramData) return;

    // Find maximum bin count across RGB & Lum to scale properly
    let maxCount = 1;
    for (let i = 0; i < 256; i++) {
      if (histogramData.lum[i] > maxCount) maxCount = histogramData.lum[i];
      if (histogramData.r[i] > maxCount) maxCount = histogramData.r[i];
      if (histogramData.g[i] > maxCount) maxCount = histogramData.g[i];
      if (histogramData.b[i] > maxCount) maxCount = histogramData.b[i];
    }

    // Function to draw channel wave
    const drawChannel = (bins: number[], strokeColor: string, fillColor: string) => {
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const normalizedH = Math.min(height, (bins[i] / maxCount) * height * 1.05);
        const y = height - normalizedH;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const normalizedH = Math.min(height, (bins[i] / maxCount) * height * 1.05);
        const y = height - normalizedH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    // Draw channels with alpha blending
    ctx.globalCompositeOperation = 'screen';
    drawChannel(histogramData.r, 'rgba(239, 68, 68, 0.85)', 'rgba(239, 68, 68, 0.15)');
    drawChannel(histogramData.g, 'rgba(34, 197, 94, 0.85)', 'rgba(34, 197, 94, 0.15)');
    drawChannel(histogramData.b, 'rgba(59, 130, 246, 0.85)', 'rgba(59, 130, 246, 0.15)');

    // Draw luminance curve over
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * width;
      const normalizedH = Math.min(height, (histogramData.lum[i] / maxCount) * height * 1.05);
      const y = height - normalizedH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.7)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }, [histogramData]);

  const hasShadowClip = (histogramData?.shadowClippedPercent ?? 0) > 0.5;
  const hasHighlightClip = (histogramData?.highlightClippedPercent ?? 0) > 0.5;

  return (
    <div className="bg-[#171a21] border-b border-[#232832] p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          Histogram RGB
        </span>
        <button
          onClick={onToggleClippingWarning}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
            showClippingWarning
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Peringatan Kliping Bayangan & Sorotan (Shadow/Highlight Clipping)"
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Kliping</span>
          {(hasShadowClip || hasHighlightClip) && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Histogram Canvas */}
      <div className="relative rounded overflow-hidden border border-[#2b313d]">
        <canvas
          ref={canvasRef}
          width={280}
          height={96}
          className="w-full h-24 block"
        />

        {/* Shadow clipping tag */}
        {hasShadowClip && showClippingWarning && (
          <div className="absolute bottom-1 left-1 bg-blue-600/90 text-white text-[9px] px-1 py-0.5 rounded font-mono">
            Bayangan: {histogramData?.shadowClippedPercent}%
          </div>
        )}

        {/* Highlight clipping tag */}
        {hasHighlightClip && showClippingWarning && (
          <div className="absolute top-1 right-1 bg-rose-600/90 text-white text-[9px] px-1 py-0.5 rounded font-mono">
            Sorotan: {histogramData?.highlightClippedPercent}%
          </div>
        )}
      </div>

      {/* Camera EXIF quick strip */}
      {exif && (
        <div className="mt-2.5 pt-2 border-t border-[#232832] text-[11px] font-mono text-slate-400">
          <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
            <span className="truncate max-w-[170px]" title={exif.cameraModel}>
              {exif.cameraModel}
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-1 rounded border border-amber-500/20">
              {exif.rawFormat}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>ISO {exif.iso}</span>
            <span>{exif.aperture}</span>
            <span>{exif.shutterSpeed}</span>
            <span>{exif.focalLength}</span>
          </div>
        </div>
      )}
    </div>
  );
};
