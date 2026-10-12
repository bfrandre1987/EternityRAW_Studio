import React, { useState } from 'react';
import { 
  EditAdjustments, 
  MaskLayer, 
  MaskType, 
  ExifData,
  ColorWheelGrade 
} from '../types';
import { HistogramData } from '../utils/rawProcessor';
import { Histogram } from './Histogram';
import { ColorWheel } from './ColorWheel';
import { 
  Wand2, 
  Sun, 
  Sparkles, 
  Palette, 
  Layers, 
  Activity, 
  SlidersHorizontal, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  FlipHorizontal,
  Info,
  CircleDot,
  Compass,
  Check
} from 'lucide-react';

interface SidebarEditProps {
  adjustments: EditAdjustments;
  onChangeAdjustments: (newAdj: EditAdjustments, description: string) => void;
  histogramData: HistogramData | null;
  exif?: ExifData;
  isBeginnerMode: boolean;
  onSmartAutoRetouch: () => void;
  showMaskOverlay: boolean;
  onToggleMaskOverlay: () => void;
  activeMaskId?: string;
  onSelectMask: (id?: string) => void;
}

export const SidebarEdit: React.FC<SidebarEditProps> = ({
  adjustments,
  onChangeAdjustments,
  histogramData,
  exif,
  isBeginnerMode,
  onSmartAutoRetouch,
  showMaskOverlay,
  onToggleMaskOverlay,
  activeMaskId,
  onSelectMask,
}) => {
  // Panel expansion states
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    autoRetouch: true,
    tone: true,
    color: true,
    masks: true,
    curve: false,
    colorGrading: true,
    detail: false,
  });

  const [showClippingWarning, setShowClippingWarning] = useState<boolean>(false);
  const [curveChannel, setCurveChannel] = useState<'rgb' | 'red' | 'green' | 'blue'>('rgb');
  const [hslTab, setHslTab] = useState<'hue' | 'saturation' | 'luminance'>('saturation');
  const [colorGradingTab, setColorGradingTab] = useState<'3way' | 'shadows' | 'midtones' | 'highlights'>('3way');

  const togglePanel = (key: string) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = (field: keyof EditAdjustments, value: any, desc?: string) => {
    const updated = { ...adjustments, [field]: value };
    onChangeAdjustments(updated, desc || `Ubah ${String(field)}`);
  };

  // Mask management
  const handleAddMask = (type: MaskType) => {
    const typeNames: Record<MaskType, string> = {
      subject: 'AI Subjek Utama',
      sky: 'AI Langit',
      background: 'AI Latar Belakang',
      face: 'AI Wajah & Kulit',
      radial: 'Gradien Radial',
      linear: 'Gradien Linier',
      brush: 'Kuas Seleksi',
    };

    const newMask: MaskLayer = {
      id: 'mask-' + Date.now(),
      name: typeNames[type] || 'Masker Baru',
      type,
      enabled: true,
      inverted: false,
      feather: 40,
      adjustments: {
        exposure: 0.3,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        saturation: 10,
        temperature: 0,
        clarity: 15,
        sharpness: 20,
      },
      params: {
        centerX: 0.5,
        centerY: 0.5,
        radiusX: 0.35,
        radiusY: 0.35,
        startX: 0.5,
        startY: 0.2,
        endX: 0.5,
        endY: 0.8,
      },
    };

    const updatedMasks = [...adjustments.masks, newMask];
    updateField('masks', updatedMasks, `Tambah Masker ${newMask.name}`);
    onSelectMask(newMask.id);
  };

  const handleDeleteMask = (id: string) => {
    const updated = adjustments.masks.filter((m) => m.id !== id);
    updateField('masks', updated, 'Hapus Masker');
    if (activeMaskId === id) {
      onSelectMask(updated[0]?.id);
    }
  };

  const handleToggleMaskEnabled = (id: string) => {
    const updated = adjustments.masks.map((m) =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    updateField('masks', updated, 'Toggle Masker Aktif');
  };

  const handleToggleMaskInvert = (id: string) => {
    const updated = adjustments.masks.map((m) =>
      m.id === id ? { ...m, inverted: !m.inverted } : m
    );
    updateField('masks', updated, 'Balikkan Masker (Invert)');
  };

  const handleUpdateActiveMaskAdj = (field: keyof MaskLayer['adjustments'], val: number) => {
    if (!activeMaskId) return;
    const updated = adjustments.masks.map((m) => {
      if (m.id === activeMaskId) {
        return {
          ...m,
          adjustments: { ...m.adjustments, [field]: val },
        };
      }
      return m;
    });
    updateField('masks', updated, `Ubah Penyesuaian Masker`);
  };

  const activeMask = adjustments.masks.find((m) => m.id === activeMaskId);

  return (
    <div className="w-80 bg-[#14171d] border-l border-[#232832] flex flex-col h-full overflow-hidden select-none shrink-0">
      {/* Top: Live Histogram */}
      <Histogram
        histogramData={histogramData}
        exif={exif}
        showClippingWarning={showClippingWarning}
        onToggleClippingWarning={() => setShowClippingWarning(!showClippingWarning)}
      />

      {/* Adjustments Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#232832] text-xs">
        {/* ========================================================= */}
        {/* MODE PEMULA (EASY QUICK ASSIST)                           */}
        {/* ========================================================= */}
        {isBeginnerMode ? (
          <div className="p-4 space-y-5">
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-3.5 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Asisten Cepat Pemula</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Mode ramah pemula dengan kontrol esensial dan algoritma otomatisasi Capture One untuk hasil foto instan berkualitas tinggi.
              </p>
              <button
                onClick={onSmartAutoRetouch}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Jalankan Auto-Retouch Cerdas</span>
              </button>
            </div>

            {/* Beginner Quick Sliders */}
            <div className="space-y-4">
              {/* Exposure */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Kecerahan Foto
                  </span>
                  <span className="font-mono text-slate-400">
                    {adjustments.exposure > 0 ? `+${adjustments.exposure.toFixed(2)}` : adjustments.exposure.toFixed(2)} EV
                  </span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.05"
                  value={adjustments.exposure}
                  onChange={(e) => updateField('exposure', parseFloat(e.target.value), 'Kecerahan')}
                  className="w-full"
                />
              </div>

              {/* Skin Tone Glow & Retouch (Capture One) */}
              <div className="space-y-1.5 bg-[#1b2029] p-3 rounded-lg border border-[#2b313d]">
                <div className="flex justify-between items-center text-slate-200">
                  <span className="font-medium flex items-center gap-1.5 text-rose-300">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    Penyempurnaan Kulit (Skin Glow)
                  </span>
                  <span className="font-mono text-rose-300">+{adjustments.autoSkinSmooth}%</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Menghaluskan tekstur kulit wajah secara alami ala Capture One tanpa menghilangkan ketajaman mata atau rambut.
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.autoSkinSmooth}
                  onChange={(e) => updateField('autoSkinSmooth', parseInt(e.target.value), 'Skin Smoothing')}
                  className="w-full accent-rose-500"
                />
              </div>

              {/* Warmth / Color Temp */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-sky-400" />
                    Kehangatan Warna
                  </span>
                  <span className="font-mono text-slate-400">{adjustments.temperature}K</span>
                </div>
                <input
                  type="range"
                  min="2500"
                  max="9000"
                  step="50"
                  value={adjustments.temperature}
                  onChange={(e) => updateField('temperature', parseInt(e.target.value), 'Temperatur')}
                  className="w-full"
                />
              </div>

              {/* Clarity / Details */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">Ketajaman & Tekstur</span>
                  <span className="font-mono text-slate-400">{adjustments.clarity > 0 ? `+${adjustments.clarity}` : adjustments.clarity}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={adjustments.clarity}
                  onChange={(e) => updateField('clarity', parseInt(e.target.value), 'Clarity')}
                  className="w-full"
                />
              </div>

              {/* Dehaze */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">Hilangkan Kabut (Dehaze)</span>
                  <span className="font-mono text-slate-400">{adjustments.dehaze > 0 ? `+${adjustments.dehaze}` : adjustments.dehaze}</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="50"
                  value={adjustments.dehaze}
                  onChange={(e) => updateField('dehaze', parseInt(e.target.value), 'Dehaze')}
                  className="w-full"
                />
              </div>

              {/* Vibrance */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">Warna Hidup (Vibrance)</span>
                  <span className="font-mono text-slate-400">{adjustments.vibrance > 0 ? `+${adjustments.vibrance}` : adjustments.vibrance}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="70"
                  value={adjustments.vibrance}
                  onChange={(e) => updateField('vibrance', parseInt(e.target.value), 'Vibrance')}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* MODE PRO STUDIO (FULL LIGHTROOM / CAPTURE ONE PANELS)     */
          /* ========================================================= */
          <>
            {/* Panel 1: Auto Retouch Capture One Pro */}
            <div className="p-3">
              <button
                onClick={() => togglePanel('autoRetouch')}
                className="w-full flex items-center justify-between text-slate-200 font-semibold hover:text-white"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Auto Retouch (Capture One Pro)</span>
                </div>
                {openPanels.autoRetouch ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openPanels.autoRetouch && (
                <div className="mt-3 space-y-3 pt-1">
                  <button
                    onClick={onSmartAutoRetouch}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analisis & Retouch Otomatis</span>
                  </button>

                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Kehalusan Kulit (Skin Smoothing)</span>
                        <span className="font-mono text-slate-400">{adjustments.autoSkinSmooth}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={adjustments.autoSkinSmooth}
                        onChange={(e) => updateField('autoSkinSmooth', parseInt(e.target.value), 'Auto Skin')}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Rona Hangat Kulit (Skin Tone)</span>
                        <span className="font-mono text-slate-400">{adjustments.autoSkinWarmth > 0 ? `+${adjustments.autoSkinWarmth}` : adjustments.autoSkinWarmth}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={adjustments.autoSkinWarmth}
                        onChange={(e) => updateField('autoSkinWarmth', parseInt(e.target.value), 'Skin Tone Warmth')}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Highlight Recovery (Bayer RAW)</span>
                        <span className="font-mono text-slate-400">{adjustments.highlightRecovery}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={adjustments.highlightRecovery}
                        onChange={(e) => updateField('highlightRecovery', parseInt(e.target.value), 'Highlight Recovery')}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Shadow Lift (Dynamic Range)</span>
                        <span className="font-mono text-slate-400">{adjustments.shadowLift}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={adjustments.shadowLift}
                        onChange={(e) => updateField('shadowLift', parseInt(e.target.value), 'Shadow Lift')}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 2: Pencahayaan & Nada (Tone & Exposure) */}
            <div className="p-3">
              <button
                onClick={() => togglePanel('tone')}
                className="w-full flex items-center justify-between text-slate-200 font-semibold hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pencahayaan & Nada (Tone)</span>
                </div>
                {openPanels.tone ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openPanels.tone && (
                <div className="mt-3 space-y-2.5">
                  {/* Exposure */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Ekspos (Exposure)</span>
                      <span className="font-mono text-slate-400">{adjustments.exposure > 0 ? `+${adjustments.exposure.toFixed(2)}` : adjustments.exposure.toFixed(2)} EV</span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.05"
                      value={adjustments.exposure}
                      onChange={(e) => updateField('exposure', parseFloat(e.target.value), 'Exposure')}
                      className="w-full"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Kontras (Contrast)</span>
                      <span className="font-mono text-slate-400">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.contrast}
                      onChange={(e) => updateField('contrast', parseInt(e.target.value), 'Contrast')}
                      className="w-full"
                    />
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Sorotan (Highlights)</span>
                      <span className="font-mono text-slate-400">{adjustments.highlights > 0 ? `+${adjustments.highlights}` : adjustments.highlights}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.highlights}
                      onChange={(e) => updateField('highlights', parseInt(e.target.value), 'Highlights')}
                      className="w-full"
                    />
                  </div>

                  {/* Shadows */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Bayangan (Shadows)</span>
                      <span className="font-mono text-slate-400">{adjustments.shadows > 0 ? `+${adjustments.shadows}` : adjustments.shadows}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.shadows}
                      onChange={(e) => updateField('shadows', parseInt(e.target.value), 'Shadows')}
                      className="w-full"
                    />
                  </div>

                  {/* Whites */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Putih (Whites)</span>
                      <span className="font-mono text-slate-400">{adjustments.whites > 0 ? `+${adjustments.whites}` : adjustments.whites}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.whites}
                      onChange={(e) => updateField('whites', parseInt(e.target.value), 'Whites')}
                      className="w-full"
                    />
                  </div>

                  {/* Blacks */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Hitam (Blacks)</span>
                      <span className="font-mono text-slate-400">{adjustments.blacks > 0 ? `+${adjustments.blacks}` : adjustments.blacks}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.blacks}
                      onChange={(e) => updateField('blacks', parseInt(e.target.value), 'Blacks')}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Panel 3: White Balance & Warna */}
            <div className="p-3">
              <button
                onClick={() => togglePanel('color')}
                className="w-full flex items-center justify-between text-slate-200 font-semibold hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>White Balance & Warna</span>
                </div>
                {openPanels.color ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openPanels.color && (
                <div className="mt-3 space-y-2.5">
                  {/* WB Quick presets */}
                  <div className="flex items-center justify-between gap-1 pb-1">
                    {[
                      { name: 'Daylight', k: 5500 },
                      { name: 'Cloudy', k: 6500 },
                      { name: 'Shade', k: 7500 },
                      { name: 'Tungsten', k: 3200 },
                    ].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => updateField('temperature', item.k, `WB ${item.name}`)}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          adjustments.temperature === item.k
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-[#1e232d] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>

                  {/* Temperature */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Temperatur</span>
                      <span className="font-mono text-slate-400">{adjustments.temperature} K</span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="10000"
                      step="50"
                      value={adjustments.temperature}
                      onChange={(e) => updateField('temperature', parseInt(e.target.value), 'Temperatur')}
                      className="w-full"
                    />
                  </div>

                  {/* Tint */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Corak (Tint)</span>
                      <span className="font-mono text-slate-400">{adjustments.tint > 0 ? `+${adjustments.tint}` : adjustments.tint}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.tint}
                      onChange={(e) => updateField('tint', parseInt(e.target.value), 'Tint')}
                      className="w-full"
                    />
                  </div>

                  {/* Vibrance */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Vibrance</span>
                      <span className="font-mono text-slate-400">{adjustments.vibrance > 0 ? `+${adjustments.vibrance}` : adjustments.vibrance}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.vibrance}
                      onChange={(e) => updateField('vibrance', parseInt(e.target.value), 'Vibrance')}
                      className="w-full"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Saturasi</span>
                      <span className="font-mono text-slate-400">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.saturation}
                      onChange={(e) => updateField('saturation', parseInt(e.target.value), 'Saturation')}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Panel 4: AI Subject Masking & Seleksi Lokal */}
            <div className="p-3">
              <button
                onClick={() => togglePanel('masks')}
                className="w-full flex items-center justify-between text-slate-200 font-semibold hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  <span>AI Masking & Seleksi Lokal</span>
                </div>
                {openPanels.masks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openPanels.masks && (
                <div className="mt-3 space-y-3">
                  {/* Add Mask Dropdown Buttons */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Tambah Masker Cerdas:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleAddMask('subject')}
                        className="py-1 px-2 rounded bg-[#1e232d] hover:bg-[#282f3c] text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 border border-[#2b313d]"
                      >
                        <Plus className="w-3 h-3 text-rose-400" />
                        <span>Subjek Utama</span>
                      </button>
                      <button
                        onClick={() => handleAddMask('sky')}
                        className="py-1 px-2 rounded bg-[#1e232d] hover:bg-[#282f3c] text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 border border-[#2b313d]"
                      >
                        <Plus className="w-3 h-3 text-sky-400" />
                        <span>Langit (Sky)</span>
                      </button>
                      <button
                        onClick={() => handleAddMask('background')}
                        className="py-1 px-2 rounded bg-[#1e232d] hover:bg-[#282f3c] text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 border border-[#2b313d]"
                      >
                        <Plus className="w-3 h-3 text-emerald-400" />
                        <span>Latar Belakang</span>
                      </button>
                      <button
                        onClick={() => handleAddMask('face')}
                        className="py-1 px-2 rounded bg-[#1e232d] hover:bg-[#282f3c] text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 border border-[#2b313d]"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>Wajah & Kulit</span>
                      </button>
                      <button
                        onClick={() => handleAddMask('radial')}
                        className="py-1 px-2 rounded bg-[#1e232d] hover:bg-[#282f3c] text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 border border-[#2b313d]"
                      >
                        <Plus className="w-3 h-3 text-purple-400" />
                        <span>Gradien Radial</span>
                      </button>
                      <button
                        onClick={() => handleAddMask('linear')}
                        className="py-1 px-2 rounded bg-[#1e232d] hover:bg-[#282f3c] text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 border border-[#2b313d]"
                      >
                        <Plus className="w-3 h-3 text-cyan-400" />
                        <span>Gradien Linier</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Masks List */}
                  {adjustments.masks.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Lapisan Masker ({adjustments.masks.length}):</span>
                        <button
                          onClick={onToggleMaskOverlay}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            showMaskOverlay ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {showMaskOverlay ? 'Tutup Ruby Overlay' : 'Tampilkan Ruby'}
                        </button>
                      </div>

                      {adjustments.masks.map((mask) => (
                        <div
                          key={mask.id}
                          onClick={() => onSelectMask(mask.id)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            activeMaskId === mask.id
                              ? 'bg-[#1f2530] border-rose-500/40 text-white'
                              : 'bg-[#181c23] border-[#2b313d] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="font-medium truncate text-xs">{mask.name}</span>
                            {mask.inverted && (
                              <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded">Inverted</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleMaskInvert(mask.id)}
                              className="p-1 rounded hover:bg-[#2b313d] text-slate-400 hover:text-white"
                              title="Balikkan Area Masker"
                            >
                              <FlipHorizontal className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleToggleMaskEnabled(mask.id)}
                              className="p-1 rounded hover:bg-[#2b313d] text-slate-400 hover:text-white"
                              title={mask.enabled ? 'Sembunyikan Efek' : 'Aktifkan Efek'}
                            >
                              {mask.enabled ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                            </button>
                            <button
                              onClick={() => handleDeleteMask(mask.id)}
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                              title="Hapus Masker"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Mask Controls */}
                  {activeMask && (
                    <div className="bg-[#1a1f28] p-3 rounded-xl border border-[#2b313d] space-y-2 mt-2">
                      <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5 pb-1 border-b border-[#2b313d]">
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>Penyesuaian: {activeMask.name}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>Eksposur Lokal</span>
                          <span className="font-mono text-slate-400">{activeMask.adjustments.exposure > 0 ? `+${activeMask.adjustments.exposure.toFixed(2)}` : activeMask.adjustments.exposure.toFixed(2)} EV</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.05"
                          value={activeMask.adjustments.exposure}
                          onChange={(e) => handleUpdateActiveMaskAdj('exposure', parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>Saturasi Lokal</span>
                          <span className="font-mono text-slate-400">{activeMask.adjustments.saturation > 0 ? `+${activeMask.adjustments.saturation}` : activeMask.adjustments.saturation}</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={activeMask.adjustments.saturation}
                          onChange={(e) => handleUpdateActiveMaskAdj('saturation', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>Kehangatan (Temp)</span>
                          <span className="font-mono text-slate-400">{activeMask.adjustments.temperature > 0 ? `+${activeMask.adjustments.temperature}` : activeMask.adjustments.temperature}</span>
                        </div>
                        <input
                          type="range"
                          min="-40"
                          max="40"
                          value={activeMask.adjustments.temperature}
                          onChange={(e) => handleUpdateActiveMaskAdj('temperature', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>Clarity / Tekstur</span>
                          <span className="font-mono text-slate-400">{activeMask.adjustments.clarity > 0 ? `+${activeMask.adjustments.clarity}` : activeMask.adjustments.clarity}</span>
                        </div>
                        <input
                          type="range"
                          min="-40"
                          max="40"
                          value={activeMask.adjustments.clarity}
                          onChange={(e) => handleUpdateActiveMaskAdj('clarity', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel 5: Detail & Optik */}
            <div className="p-3">
              <button
                onClick={() => togglePanel('detail')}
                className="w-full flex items-center justify-between text-slate-200 font-semibold hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Detail, Ketajaman & Optik</span>
                </div>
                {openPanels.detail ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openPanels.detail && (
                <div className="mt-3 space-y-2.5">
                  {/* Sharpness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Ketajaman (Sharpening)</span>
                      <span className="font-mono text-slate-400">{adjustments.sharpness}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={adjustments.sharpness}
                      onChange={(e) => updateField('sharpness', parseInt(e.target.value), 'Sharpness')}
                      className="w-full"
                    />
                  </div>

                  {/* Noise Reduction */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Pengurangan Noise</span>
                      <span className="font-mono text-slate-400">{adjustments.noiseReduction}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={adjustments.noiseReduction}
                      onChange={(e) => updateField('noiseReduction', parseInt(e.target.value), 'Noise Reduction')}
                      className="w-full"
                    />
                  </div>

                  {/* Clarity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Kejelasan (Clarity)</span>
                      <span className="font-mono text-slate-400">{adjustments.clarity > 0 ? `+${adjustments.clarity}` : adjustments.clarity}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.clarity}
                      onChange={(e) => updateField('clarity', parseInt(e.target.value), 'Clarity')}
                      className="w-full"
                    />
                  </div>

                  {/* Dehaze */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Hilangkan Kabut (Dehaze)</span>
                      <span className="font-mono text-slate-400">{adjustments.dehaze > 0 ? `+${adjustments.dehaze}` : adjustments.dehaze}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.dehaze}
                      onChange={(e) => updateField('dehaze', parseInt(e.target.value), 'Dehaze')}
                      className="w-full"
                    />
                  </div>

                  {/* Vignette */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Vignette</span>
                      <span className="font-mono text-slate-400">{adjustments.vignette > 0 ? `+${adjustments.vignette}` : adjustments.vignette}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.vignette}
                      onChange={(e) => updateField('vignette', parseInt(e.target.value), 'Vignette')}
                      className="w-full"
                    />
                  </div>

                  {/* Grain */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Butiran Analog (Film Grain)</span>
                      <span className="font-mono text-slate-400">{adjustments.grain}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={adjustments.grain}
                      onChange={(e) => updateField('grain', parseInt(e.target.value), 'Grain')}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Panel 6: Gradasi Warna 3-Arah / 3-Way Color Wheels */}
            <div className="p-3">
              <button
                onClick={() => togglePanel('colorGrading')}
                className="w-full flex items-center justify-between text-slate-200 font-semibold hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  <span>Color Grading (Roda Warna 3-Arah)</span>
                  {((adjustments.shadowTint?.saturation || 0) > 0 ||
                    (adjustments.midtoneTint?.saturation || 0) > 0 ||
                    (adjustments.highlightTint?.saturation || 0) > 0 ||
                    (adjustments.shadowTint?.luminance || 0) !== 0 ||
                    (adjustments.midtoneTint?.luminance || 0) !== 0 ||
                    (adjustments.highlightTint?.luminance || 0) !== 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  )}
                </div>
                {openPanels.colorGrading ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openPanels.colorGrading && (
                <div className="mt-3 space-y-3.5">
                  {/* View Mode Selector Tabs */}
                  <div className="flex items-center bg-[#181c24] p-0.5 rounded-lg border border-[#262c37] text-[11px]">
                    {[
                      { id: '3way', label: '3-Roda (Semua)' },
                      { id: 'shadows', label: 'Bayangan' },
                      { id: 'midtones', label: 'Midtones' },
                      { id: 'highlights', label: 'Sorotan' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setColorGradingTab(tab.id as any)}
                        className={`flex-1 py-1 px-1 rounded-md text-center font-medium transition-all ${
                          colorGradingTab === tab.id
                            ? 'bg-[#293140] text-purple-300 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Pro Color Grading Presets Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Gaya Cepat (Pro Looks):</span>
                      <button
                        onClick={() => {
                          const updated = {
                            ...adjustments,
                            shadowTint: { hue: 0, saturation: 0, luminance: 0 },
                            midtoneTint: { hue: 0, saturation: 0, luminance: 0 },
                            highlightTint: { hue: 0, saturation: 0, luminance: 0 },
                            colorGradingBalance: 0,
                            colorGradingBlending: 50,
                          };
                          onChangeAdjustments(updated, 'Reset Semua Roda Warna');
                        }}
                        className="text-slate-500 hover:text-rose-400"
                        title="Reset semua roda warna ke netral"
                      >
                        Reset Roda
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        {
                          name: 'Teal & Orange',
                          desc: 'Sinematik',
                          shadows: { hue: 205, saturation: 36, luminance: -5 },
                          midtones: { hue: 35, saturation: 18, luminance: 0 },
                          highlights: { hue: 40, saturation: 28, luminance: 4 },
                          balance: 0,
                          blending: 55,
                        },
                        {
                          name: 'Golden Hour',
                          desc: 'Hangat',
                          shadows: { hue: 215, saturation: 22, luminance: 0 },
                          midtones: { hue: 38, saturation: 28, luminance: 2 },
                          highlights: { hue: 45, saturation: 35, luminance: 5 },
                          balance: 15,
                          blending: 60,
                        },
                        {
                          name: 'Cyberpunk',
                          desc: 'Neon Violet',
                          shadows: { hue: 270, saturation: 38, luminance: -6 },
                          midtones: { hue: 320, saturation: 22, luminance: 0 },
                          highlights: { hue: 175, saturation: 36, luminance: 6 },
                          balance: -10,
                          blending: 50,
                        },
                        {
                          name: 'Vintage Film',
                          desc: 'Analog',
                          shadows: { hue: 45, saturation: 18, luminance: 8 },
                          midtones: { hue: 55, saturation: 12, luminance: 0 },
                          highlights: { hue: 38, saturation: 20, luminance: -3 },
                          balance: 10,
                          blending: 65,
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            const updated = {
                              ...adjustments,
                              shadowTint: preset.shadows,
                              midtoneTint: preset.midtones,
                              highlightTint: preset.highlights,
                              colorGradingBalance: preset.balance,
                              colorGradingBlending: preset.blending,
                            };
                            onChangeAdjustments(updated, `Gaya: ${preset.name}`);
                          }}
                          className="py-1 px-2 rounded-lg bg-[#181c24] hover:bg-[#222834] border border-[#262c37] text-left transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-300 text-[11px] truncate">{preset.name}</span>
                          <span className="text-[9px] text-purple-400 font-mono shrink-0">{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3-WAY WHEELS VIEW (ALL 3 TOGETHER) */}
                  {colorGradingTab === '3way' && (
                    <div className="space-y-3 pt-1">
                      {/* Shadows Wheel */}
                      <ColorWheel
                        label="Bayangan (Shadows)"
                        grade={adjustments.shadowTint || { hue: 0, saturation: 0, luminance: 0 }}
                        onChange={(newGrade, desc) => updateField('shadowTint', newGrade, desc)}
                        size={96}
                      />

                      {/* Midtones Wheel */}
                      <ColorWheel
                        label="Midtones (Nada Tengah)"
                        grade={adjustments.midtoneTint || { hue: 0, saturation: 0, luminance: 0 }}
                        onChange={(newGrade, desc) => updateField('midtoneTint', newGrade, desc)}
                        size={96}
                      />

                      {/* Highlights Wheel */}
                      <ColorWheel
                        label="Sorotan (Highlights)"
                        grade={adjustments.highlightTint || { hue: 0, saturation: 0, luminance: 0 }}
                        onChange={(newGrade, desc) => updateField('highlightTint', newGrade, desc)}
                        size={96}
                      />
                    </div>
                  )}

                  {/* EXPANDED SINGLE WHEEL VIEW: SHADOWS */}
                  {colorGradingTab === 'shadows' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex justify-center">
                        <ColorWheel
                          label="Bayangan (Shadows / Lift)"
                          grade={adjustments.shadowTint || { hue: 0, saturation: 0, luminance: 0 }}
                          onChange={(newGrade, desc) => updateField('shadowTint', newGrade, desc)}
                          size={135}
                        />
                      </div>

                      {/* Fine-tuning Precision Sliders */}
                      <div className="bg-[#181c24] p-2.5 rounded-xl border border-[#262c37] space-y-2">
                        <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
                          Kontrol Presisi Bayangan
                        </span>
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Rona (Hue)</span>
                            <span className="font-mono text-purple-300">{adjustments.shadowTint?.hue || 0}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={adjustments.shadowTint?.hue || 0}
                            onChange={(e) =>
                              updateField(
                                'shadowTint',
                                { ...adjustments.shadowTint, hue: parseInt(e.target.value) },
                                'Shadow Tint Hue'
                              )
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Saturasi Tint</span>
                            <span className="font-mono text-purple-300">{adjustments.shadowTint?.saturation || 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={adjustments.shadowTint?.saturation || 0}
                            onChange={(e) =>
                              updateField(
                                'shadowTint',
                                { ...adjustments.shadowTint, saturation: parseInt(e.target.value) },
                                'Shadow Tint Saturation'
                              )
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Luminansi Bayangan</span>
                            <span className="font-mono text-purple-300">
                              {(adjustments.shadowTint?.luminance || 0) > 0
                                ? `+${adjustments.shadowTint?.luminance}`
                                : adjustments.shadowTint?.luminance || 0}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={adjustments.shadowTint?.luminance || 0}
                            onChange={(e) =>
                              updateField(
                                'shadowTint',
                                { ...adjustments.shadowTint, luminance: parseInt(e.target.value) },
                                'Shadow Tint Luminance'
                              )
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EXPANDED SINGLE WHEEL VIEW: MIDTONES */}
                  {colorGradingTab === 'midtones' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex justify-center">
                        <ColorWheel
                          label="Midtones (Gamma / Kulit)"
                          grade={adjustments.midtoneTint || { hue: 0, saturation: 0, luminance: 0 }}
                          onChange={(newGrade, desc) => updateField('midtoneTint', newGrade, desc)}
                          size={135}
                        />
                      </div>

                      {/* Fine-tuning Precision Sliders */}
                      <div className="bg-[#181c24] p-2.5 rounded-xl border border-[#262c37] space-y-2">
                        <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
                          Kontrol Presisi Midtones
                        </span>
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Rona (Hue)</span>
                            <span className="font-mono text-purple-300">{adjustments.midtoneTint?.hue || 0}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={adjustments.midtoneTint?.hue || 0}
                            onChange={(e) =>
                              updateField(
                                'midtoneTint',
                                { ...(adjustments.midtoneTint || { saturation: 0, luminance: 0 }), hue: parseInt(e.target.value) },
                                'Midtone Tint Hue'
                              )
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Saturasi Tint</span>
                            <span className="font-mono text-purple-300">{adjustments.midtoneTint?.saturation || 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={adjustments.midtoneTint?.saturation || 0}
                            onChange={(e) =>
                              updateField(
                                'midtoneTint',
                                { ...(adjustments.midtoneTint || { hue: 0, luminance: 0 }), saturation: parseInt(e.target.value) },
                                'Midtone Tint Saturation'
                              )
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Luminansi Midtones</span>
                            <span className="font-mono text-purple-300">
                              {(adjustments.midtoneTint?.luminance || 0) > 0
                                ? `+${adjustments.midtoneTint?.luminance}`
                                : adjustments.midtoneTint?.luminance || 0}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={adjustments.midtoneTint?.luminance || 0}
                            onChange={(e) =>
                              updateField(
                                'midtoneTint',
                                { ...(adjustments.midtoneTint || { hue: 0, saturation: 0 }), luminance: parseInt(e.target.value) },
                                'Midtone Tint Luminance'
                              )
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EXPANDED SINGLE WHEEL VIEW: HIGHLIGHTS */}
                  {colorGradingTab === 'highlights' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex justify-center">
                        <ColorWheel
                          label="Sorotan (Highlights / Gain)"
                          grade={adjustments.highlightTint || { hue: 0, saturation: 0, luminance: 0 }}
                          onChange={(newGrade, desc) => updateField('highlightTint', newGrade, desc)}
                          size={135}
                        />
                      </div>

                      {/* Fine-tuning Precision Sliders */}
                      <div className="bg-[#181c24] p-2.5 rounded-xl border border-[#262c37] space-y-2">
                        <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
                          Kontrol Presisi Sorotan
                        </span>
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Rona (Hue)</span>
                            <span className="font-mono text-purple-300">{adjustments.highlightTint?.hue || 0}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={adjustments.highlightTint?.hue || 0}
                            onChange={(e) =>
                              updateField(
                                'highlightTint',
                                { ...adjustments.highlightTint, hue: parseInt(e.target.value) },
                                'Highlight Tint Hue'
                              )
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Saturasi Tint</span>
                            <span className="font-mono text-purple-300">{adjustments.highlightTint?.saturation || 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={adjustments.highlightTint?.saturation || 0}
                            onChange={(e) =>
                              updateField(
                                'highlightTint',
                                { ...adjustments.highlightTint, saturation: parseInt(e.target.value) },
                                'Highlight Tint Saturation'
                              )
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Luminansi Sorotan</span>
                            <span className="font-mono text-purple-300">
                              {(adjustments.highlightTint?.luminance || 0) > 0
                                ? `+${adjustments.highlightTint?.luminance}`
                                : adjustments.highlightTint?.luminance || 0}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={adjustments.highlightTint?.luminance || 0}
                            onChange={(e) =>
                              updateField(
                                'highlightTint',
                                { ...adjustments.highlightTint, luminance: parseInt(e.target.value) },
                                'Highlight Tint Luminance'
                              )
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GLOBAL COLOR SCIENCE: BALANCE & BLENDING */}
                  <div className="bg-[#181c24] p-3 rounded-xl border border-[#262c37] space-y-2.5">
                    <span className="text-[11px] font-semibold text-slate-200 block">
                      Keseimbangan & Perpaduan Spektrum
                    </span>

                    {/* Balance */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Keseimbangan (Balance)</span>
                        <span className="font-mono text-slate-300">
                          {(adjustments.colorGradingBalance || 0) > 0
                            ? `+${adjustments.colorGradingBalance}`
                            : adjustments.colorGradingBalance || 0}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={adjustments.colorGradingBalance || 0}
                        onChange={(e) =>
                          updateField('colorGradingBalance', parseInt(e.target.value), 'Keseimbangan Warna')
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Fokus Bayangan</span>
                        <span>Netral</span>
                        <span>Fokus Sorotan</span>
                      </div>
                    </div>

                    {/* Blending */}
                    <div className="space-y-1 pt-1 border-t border-[#232934]">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Perpaduan Transisi (Blending)</span>
                        <span className="font-mono text-slate-300">
                          {adjustments.colorGradingBlending ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={adjustments.colorGradingBlending ?? 50}
                        onChange={(e) =>
                          updateField('colorGradingBlending', parseInt(e.target.value), 'Perpaduan Warna')
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
