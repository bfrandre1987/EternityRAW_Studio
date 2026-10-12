import React, { useState } from 'react';
import { PhotoItem, BatchExportSettings } from '../types';
import { renderExportPhoto } from '../utils/rawProcessor';
import JSZip from 'jszip';
import { 
  Download, 
  X, 
  Check, 
  Layers, 
  Sparkles, 
  Image as ImageIcon, 
  FileArchive, 
  SlidersHorizontal 
} from 'lucide-react';

interface BatchExportModalProps {
  photosToExport: PhotoItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  photosToExport,
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<BatchExportSettings>({
    format: 'jpeg',
    quality: 92,
    scaleOption: 'original',
    customMaxDimension: 2560,
    namingTemplate: '{name}_lumina_pro',
    watermarkEnabled: false,
    watermarkText: '© Studio Photography',
    watermarkPosition: 'bottom-right',
    watermarkOpacity: 70,
    colorSpace: 'sRGB',
    exportAsZip: photosToExport.length > 1,
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [currentExportItem, setCurrentExportItem] = useState<string>('');

  if (!isOpen) return null;

  const handleStartExport = async () => {
    if (photosToExport.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);

    try {
      const zip = settings.exportAsZip ? new JSZip() : null;

      // Determine max dimension
      let maxDim: number | undefined = undefined;
      if (settings.scaleOption === '4k') maxDim = 3840;
      else if (settings.scaleOption === '2k') maxDim = 1920;
      else if (settings.scaleOption === 'social') maxDim = 1080;
      else if (settings.scaleOption === 'custom') maxDim = settings.customMaxDimension;

      for (let i = 0; i < photosToExport.length; i++) {
        const photo = photosToExport[i];
        setCurrentExportItem(`Memproses: ${photo.name} (${i + 1}/${photosToExport.length})`);

        // Load image into HTMLImageElement
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.onload = () => resolve(el);
          el.onerror = (e) => reject(e);
          el.src = photo.url;
        });

        // Render processed RAW image with adjustments and watermark
        const blob = await renderExportPhoto(
          img,
          photo.adjustments,
          settings.format,
          settings.quality,
          maxDim,
          settings.watermarkEnabled ? settings.watermarkText : undefined,
          settings.watermarkPosition
        );

        // Compute output filename
        const ext = settings.format === 'jpeg' ? 'jpg' : settings.format;
        const cleanBaseName = photo.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = settings.namingTemplate
          .replace('{name}', cleanBaseName)
          .replace('{project}', photo.collection || 'Export')
          .replace('{index}', String(i + 1).padStart(3, '0')) + `.${ext}`;

        if (zip) {
          zip.file(fileName, blob);
        } else {
          // Trigger individual file download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
          // Small pause between multiple browser downloads
          await new Promise((r) => setTimeout(r, 200));
        }

        setExportProgress(Math.round(((i + 1) / photosToExport.length) * 100));
      }

      if (zip) {
        setCurrentExportItem('Mengemas arsip berkas ZIP...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LuminaRAW_Batch_Export_${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export error:', err);
      alert('Terjadi kesalahan saat memproses ekspor batch.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#171a22] border border-[#2b313d] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#232832] flex items-center justify-between bg-[#191d26]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Ekspor Batch ({photosToExport.length} Foto)
              </h3>
              <p className="text-[11px] text-slate-400">
                Rendering presisi tinggi dengan pemrosesan RAW lengkap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#252c38] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Format & Quality */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Format Berkas</label>
              <select
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                className="w-full bg-[#11141a] border border-[#2b313d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="jpeg">JPEG (Kualitas Tinggi & Universal)</option>
                <option value="webp">WebP (Ukuran Ringan Modern)</option>
                <option value="png">PNG (Lossless Transparansi)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-slate-300 font-medium mb-1.5">
                <span>Kualitas Kompresi</span>
                <span className="font-mono text-sky-400">{settings.quality}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={settings.quality}
                onChange={(e) => setSettings({ ...settings, quality: parseInt(e.target.value) })}
                className="w-full mt-2"
              />
            </div>
          </div>

          {/* Scale Resolution */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Resolusi & Penskalaan</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'original', label: 'Asli (100%)' },
                { id: '4k', label: '4K (3840px)' },
                { id: '2k', label: 'Full HD (1920)' },
                { id: 'social', label: 'Sosial (1080px)' },
              ].map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, scaleOption: res.id as any })}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    settings.scaleOption === res.id
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-semibold'
                      : 'bg-[#11141a] border-[#2b313d] text-slate-400 hover:text-white'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>

          {/* File Naming Template */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Pola Penamaan Berkas</label>
            <input
              type="text"
              value={settings.namingTemplate}
              onChange={(e) => setSettings({ ...settings, namingTemplate: e.target.value })}
              placeholder="{name}_edited"
              className="w-full bg-[#11141a] border border-[#2b313d] rounded-lg px-3 py-1.5 text-white font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Gunakan variabel: <code className="text-slate-400">{'{name}'}</code> untuk nama foto, <code className="text-slate-400">{'{index}'}</code> untuk nomor urut, <code className="text-slate-400">{'{project}'}</code> untuk nama koleksi.
            </p>
          </div>

          {/* Watermark Section */}
          <div className="bg-[#12151c] p-3 rounded-xl border border-[#242a36] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.watermarkEnabled}
                  onChange={(e) => setSettings({ ...settings, watermarkEnabled: e.target.checked })}
                  className="rounded bg-[#1a1f28] border-[#2b313d] text-sky-500"
                />
                <span>Sertakan Watermark / Hak Cipta</span>
              </label>
              <span className="text-[10px] text-slate-500">Overlay Otomatis</span>
            </div>

            {settings.watermarkEnabled && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  value={settings.watermarkText}
                  onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                  placeholder="Teks Watermark"
                  className="bg-[#191d26] border border-[#2b313d] rounded-lg px-2.5 py-1 text-white"
                />
                <select
                  value={settings.watermarkPosition}
                  onChange={(e) => setSettings({ ...settings, watermarkPosition: e.target.value as any })}
                  className="bg-[#191d26] border border-[#2b313d] rounded-lg px-2.5 py-1 text-white"
                >
                  <option value="bottom-right">Pojok Kanan Bawah</option>
                  <option value="bottom-left">Pojok Kiri Bawah</option>
                  <option value="top-right">Pojok Kanan Atas</option>
                  <option value="center">Tengah (Proteksi)</option>
                </select>
              </div>
            )}
          </div>

          {/* Batch Zip Option */}
          {photosToExport.length > 1 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12151c] border border-[#242a36]">
              <div className="flex items-center gap-2 text-slate-200">
                <FileArchive className="w-4 h-4 text-amber-400" />
                <span>Kemas ke dalam satu file ZIP</span>
              </div>
              <input
                type="checkbox"
                checked={settings.exportAsZip}
                onChange={(e) => setSettings({ ...settings, exportAsZip: e.target.checked })}
                className="rounded bg-[#1a1f28] border-[#2b313d] text-sky-500"
              />
            </div>
          )}

          {/* Progress Bar when exporting */}
          {isExporting && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span className="truncate">{currentExportItem}</span>
                <span className="font-mono text-sky-400">{exportProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#232832] rounded-full overflow-hidden">
                <div
                  style={{ width: `${exportProgress}%` }}
                  className="h-full bg-gradient-to-r from-sky-500 to-amber-500 transition-all duration-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#232832] bg-[#191d26] flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isExporting || photosToExport.length === 0}
            onClick={handleStartExport}
            className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Memproses Ekspor...' : `Mulai Ekspor (${photosToExport.length})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
