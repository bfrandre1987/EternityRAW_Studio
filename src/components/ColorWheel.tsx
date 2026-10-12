import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ColorWheelGrade } from '../types';
import { RotateCcw } from 'lucide-react';

interface ColorWheelProps {
  label: string;
  grade: ColorWheelGrade;
  onChange: (newGrade: ColorWheelGrade, description: string) => void;
  size?: number; // diameter in pixels (e.g. 100 or 140)
  iconColor?: string;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  label,
  grade,
  onChange,
  size = 110,
  iconColor = 'text-amber-400',
}) => {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const radius = size / 2;
  const currentHue = grade.hue || 0;
  const currentSat = Math.max(0, Math.min(100, grade.saturation || 0));
  const currentLum = grade.luminance ?? 0;

  // Calculate puck (x, y) relative to center
  // 0 deg is right (East), 90 deg is bottom (South)
  const angleRad = (currentHue * Math.PI) / 180;
  const dist = (currentSat / 100) * (radius - 6);
  const puckX = radius + dist * Math.cos(angleRad);
  const puckY = radius + dist * Math.sin(angleRad);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const updateFromPointer = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    const d = Math.hypot(dx, dy);
    const maxR = radius - 6;

    // Calculate Hue in degrees [0, 360)
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;

    // Saturation [0, 100]
    const sat = Math.min(100, Math.round((d / maxR) * 100));

    onChange(
      {
        ...grade,
        hue: Math.round(deg),
        saturation: sat,
      },
      `Gradasi Warna ${label}`
    );
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(
      {
        hue: 0,
        saturation: 0,
        luminance: 0,
      },
      `Reset ${label}`
    );
  };

  const handleDoubleClick = () => {
    onChange(
      {
        ...grade,
        hue: 0,
        saturation: 0,
      },
      `Reset Tint ${label}`
    );
  };

  const hasAdjustment = currentSat > 0 || currentLum !== 0;

  return (
    <div className="flex flex-col items-center bg-[#181c24] p-2.5 rounded-xl border border-[#262c37] select-none group">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${hasAdjustment ? 'bg-amber-400' : 'bg-slate-600'}`} />
          <span className="font-semibold text-slate-200 text-[11px]">{label}</span>
        </div>
        <button
          onClick={handleReset}
          className={`p-1 rounded text-slate-500 hover:text-white hover:bg-[#232935] transition-colors ${
            hasAdjustment ? 'opacity-100 text-slate-400' : 'opacity-30 pointer-events-none'
          }`}
          title={`Reset ${label} ke netral`}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Chromatic Wheel Disc */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="relative rounded-full cursor-crosshair shadow-inner overflow-hidden border border-[#333a48] touch-none"
        title="Klik atau seret untuk memilih Hue & Saturasi. Klik dua kali untuk reset."
      >
        {/* Conic Hue spectrum */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              from 0deg,
              #ff0000 0deg,
              #ffff00 60deg,
              #00ff00 120deg,
              #00ffff 180deg,
              #0000ff 240deg,
              #ff00ff 300deg,
              #ff0000 360deg
            )`,
          }}
        />

        {/* Radial saturation gradient (white/desaturated center to transparent edge) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at center, rgba(128, 128, 128, 0.95) 0%, rgba(128, 128, 128, 0.35) 60%, transparent 100%)`,
          }}
        />

        {/* Dark vignette border for depth */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]" />

        {/* Reticle / Crosshair Guides */}
        <div className="absolute inset-x-0 top-1/2 -mt-[0.5px] h-[1px] bg-white/20 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 -ml-[0.5px] w-[1px] bg-white/20 pointer-events-none" />
        <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-white/10 pointer-events-none" />

        {/* Center neutral anchor dot */}
        <div className="absolute top-1/2 left-1/2 -mt-1 -ml-1 w-2 h-2 rounded-full bg-slate-400/80 pointer-events-none" />

        {/* Draggable Tint Puck */}
        <div
          style={{
            left: `${puckX}px`,
            top: `${puckY}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.9)] pointer-events-none transition-transform duration-75"
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: currentSat > 0 ? `hsl(${currentHue}, 85%, 50%)` : '#94a3b8',
            }}
          />
        </div>
      </div>

      {/* Numerical Readout */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
        <span>H: {currentHue}°</span>
        <span>S: {currentSat}%</span>
        <span>L: {currentLum > 0 ? `+${currentLum}` : currentLum}</span>
      </div>

      {/* Luminance Slider */}
      <div className="w-full mt-2 pt-1 border-t border-[#232934] space-y-1">
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>Luminansi</span>
          <span className="font-mono text-slate-300">{currentLum > 0 ? `+${currentLum}` : currentLum}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={currentLum}
          onChange={(e) =>
            onChange(
              {
                ...grade,
                luminance: parseInt(e.target.value),
              },
              `Luminansi ${label}`
            )
          }
          className="w-full h-1"
        />
      </div>
    </div>
  );
};
