import React, { useState } from 'react';
import { 
  PhotoItem, 
  PresetItem, 
  EditAdjustments 
} from '../types';
import { BUILTIN_PRESETS } from '../utils/presets';
import { 
  Bookmark, 
  History, 
  Info, 
  Plus, 
  Download, 
  Upload, 
  Check, 
  Camera, 
  Tag, 
  Folder, 
  Sliders, 
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface SidebarLeftProps {
  activePhoto: PhotoItem;
  customPresets: PresetItem[];
  onApplyPreset: (preset: PresetItem) => void;
  onSaveCustomPreset: (preset: PresetItem) => void;
  onSelectHistoryStep: (historyIndex: number) => void;
  onResetToOriginal: () => void;
  onUpdatePhotoMetadata: (tags: string[], collection: string) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  activePhoto,
  customPresets,
  onApplyPreset,
  onSaveCustomPreset,
  onSelectHistoryStep,
  onResetToOriginal,
  onUpdatePhotoMetadata,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'history' | 'info'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSavePresetModal, setShowSavePresetModal] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetCategory, setNewPresetCategory] = useState<PresetItem['category']>('Custom');
  const [newPresetDesc, setNewPresetDesc] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');

  const allPresets = [...BUILTIN_PRESETS, ...customPresets];

  const filteredPresets = selectedCategory === 'All'
    ? allPresets
    : allPresets.filter((p) => p.category === selectedCategory || (selectedCategory === 'Custom' && p.isCustom));

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const preset: PresetItem = {
      id: 'custom-' + Date.now(),
      name: newPresetName.trim(),
      category: newPresetCategory,
      description: newPresetDesc.trim() || 'Preset kustom pengguna',
      isCustom: true,
      adjustments: { ...activePhoto.adjustments },
    };

    onSaveCustomPreset(preset);
    setShowSavePresetModal(false);
    setNewPresetName('');
    setNewPresetDesc('');
  };

  const handleExportPresetsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customPresets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `LuminaRAW_Custom_Presets_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportPresetsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => onSaveCustomPreset(p));
        }
      } catch (err) {
        alert('Gagal membaca file JSON preset');
      }
    };
    reader.readAsText(file);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const updated = Array.from(new Set([...activePhoto.tags, newTagInput.trim()]));
    onUpdatePhotoMetadata(updated, activePhoto.collection);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = activePhoto.tags.filter((t) => t !== tagToRemove);
    onUpdatePhotoMetadata(updated, activePhoto.collection);
  };

  return (
    <div className="w-72 bg-[#14171d] border-r border-[#232832] flex flex-col h-full overflow-hidden select-none shrink-0 text-xs">
      {/* Top Tabs */}
      <div className="h-10 border-b border-[#232832] flex items-center px-2 gap-1 bg-[#161920]">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'presets'
              ? 'bg-[#242b37] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Preset</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'history'
              ? 'bg-[#242b37] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'info'
              ? 'bg-[#242b37] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Metadata</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ========================================================= */}
        {/* TAB 1: PRESETS                                             */}
        {/* ========================================================= */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            {/* Action Bar: Create Custom & Export/Import */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSavePresetModal(true)}
                className="flex-1 py-1.5 px-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Preset Baru</span>
              </button>

              <button
                onClick={handleExportPresetsJson}
                className="p-1.5 rounded-lg bg-[#1e232d] hover:bg-[#282f3c] text-slate-300 border border-[#2b313d]"
                title="Ekspor Preset Kustom (.JSON)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <label
                className="p-1.5 rounded-lg bg-[#1e232d] hover:bg-[#282f3c] text-slate-300 border border-[#2b313d] cursor-pointer"
                title="Impor Preset (.JSON)"
              >
                <Upload className="w-3.5 h-3.5" />
                <input type="file" accept=".json" onChange={handleImportPresetsJson} className="hidden" />
              </label>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {['All', 'Portrait', 'Landscape', 'Cinematic', 'Vintage', 'Commercial', 'Custom'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-[#1b2029] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'All' ? 'Semua' : cat}
                </button>
              ))}
            </div>

            {/* Preset Cards List */}
            <div className="space-y-2 pt-1">
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  className="group p-2.5 rounded-xl bg-[#1a1f28] hover:bg-[#222834] border border-[#262c37] hover:border-amber-500/30 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 bg-[#252c38] px-1.5 py-0.5 rounded">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Save Preset */}
            {showSavePresetModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[#181c23] border border-[#2b313d] rounded-2xl p-5 max-w-sm w-full shadow-2xl">
                  <h3 className="font-semibold text-base text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Simpan Preset Kustom</span>
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    Simpan semua pengaturan aktif foto ini sebagai preset yang dapat digunakan berulang kali.
                  </p>

                  <form onSubmit={handleSavePresetSubmit} className="space-y-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Nama Preset</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Moody Autumn Glow"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        className="w-full bg-[#11141a] border border-[#2b313d] rounded-lg px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Kategori</label>
                      <select
                        value={newPresetCategory}
                        onChange={(e) => setNewPresetCategory(e.target.value as any)}
                        className="w-full bg-[#11141a] border border-[#2b313d] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Portrait">Portrait</option>
                        <option value="Landscape">Landscape</option>
                        <option value="Cinematic">Cinematic</option>
                        <option value="Vintage">Vintage</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Deskripsi Gaya</label>
                      <textarea
                        rows={2}
                        placeholder="Deskripsi singkat tone warna..."
                        value={newPresetDesc}
                        onChange={(e) => setNewPresetDesc(e.target.value)}
                        className="w-full bg-[#11141a] border border-[#2b313d] rounded-lg px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSavePresetModal(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg"
                      >
                        Simpan Preset
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RIWAYAT NON-DESTRUKTIF                              */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#232832]">
              <span className="text-[11px] font-semibold text-slate-300">
                Langkah Riwayat ({activePhoto.history.length})
              </span>
              <button
                onClick={onResetToOriginal}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
                title="Kembalikan semua slider ke kondisi awal RAW"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Asli</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {activePhoto.history.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectHistoryStep(idx)}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between border transition-all ${
                    idx === activePhoto.history.length - 1
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold'
                      : 'bg-[#181c23] border-[#252b36] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">{step.description}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: INFORMASI EXIF & RAW METADATA                       */}
        {/* ========================================================= */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Camera Details */}
            <div className="bg-[#191e27] p-3 rounded-xl border border-[#252b36] space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-[#252b36] pb-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Detail Kamera & Lensa</span>
              </div>

              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kamera:</span>
                  <span className="font-medium text-right">{activePhoto.exif.cameraMake} {activePhoto.exif.cameraModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lensa:</span>
                  <span className="font-medium text-right truncate max-w-[150px]" title={activePhoto.exif.lens}>
                    {activePhoto.exif.lens}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-mono text-amber-400">{activePhoto.exif.rawFormat} ({activePhoto.exif.bitDepth})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolusi:</span>
                  <span className="font-mono">{activePhoto.exif.dimensions.width} × {activePhoto.exif.dimensions.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ukuran Berkas:</span>
                  <span className="font-mono">{activePhoto.exif.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ruang Warna:</span>
                  <span className="font-mono text-sky-400">{activePhoto.exif.colorSpace}</span>
                </div>
              </div>
            </div>

            {/* Collection assignment */}
            <div className="bg-[#191e27] p-3 rounded-xl border border-[#252b36] space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-[#252b36] pb-1.5">
                <Folder className="w-3.5 h-3.5 text-sky-400" />
                <span>Koleksi / Album</span>
              </div>
              <input
                type="text"
                value={activePhoto.collection}
                onChange={(e) => onUpdatePhotoMetadata(activePhoto.tags, e.target.value)}
                placeholder="Nama Koleksi"
                className="w-full bg-[#11141a] border border-[#2b313d] rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>

            {/* Tags management */}
            <div className="bg-[#191e27] p-3 rounded-xl border border-[#252b36] space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-[#252b36] pb-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tagar & Kata Kunci</span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Tambah tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 bg-[#11141a] border border-[#2b313d] rounded-lg px-2 py-1 text-white"
                />
                <button
                  onClick={handleAddTag}
                  className="p-1 px-2.5 rounded-lg bg-[#252c38] hover:bg-[#313947] text-white"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {activePhoto.tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => handleRemoveTag(tag)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#252c38] text-slate-300 text-[11px] cursor-pointer hover:bg-rose-900/40 hover:text-rose-300"
                    title="Klik untuk menghapus"
                  >
                    #{tag} ×
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
