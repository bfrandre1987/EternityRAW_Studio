import React, { useState } from 'react';
import { CloudSyncState, exportCloudBackupBundle } from '../utils/storage';
import { PhotoItem, PresetItem } from '../types';
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  Laptop, 
  Smartphone, 
  Monitor, 
  Download, 
  Upload, 
  X, 
  ShieldCheck, 
  Layers, 
  Copy, 
  Check 
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudState: CloudSyncState;
  onUpdateCloudState: (newState: CloudSyncState) => void;
  photos: PhotoItem[];
  customPresets: PresetItem[];
  onRestoreBackup: (photos: PhotoItem[], customPresets: PresetItem[]) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  cloudState,
  onUpdateCloudState,
  photos,
  customPresets,
  onRestoreBackup,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onUpdateCloudState({
        ...cloudState,
        lastSyncedTimestamp: Date.now(),
        status: 'synced',
      });
      setIsSyncing(false);
    }, 1200);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(cloudState.syncPairCode);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed?.data?.photos && Array.isArray(parsed.data.photos)) {
          onRestoreBackup(parsed.data.photos, parsed.data.customPresets || []);
          alert('Berhasil memulihkan katalog dan pengeditan dari cadangan cloud!');
          onClose();
        } else {
          alert('Format berkas cadangan tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas cadangan JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#171a22] border border-[#2b313d] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#232832] flex items-center justify-between bg-[#191d26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Sinkronisasi Cloud Lumina</h3>
              <p className="text-[11px] text-slate-400">Sinkronisasi non-destruktif antar perangkat Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#252c38]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Status banner */}
          <div className="bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-transparent p-3.5 rounded-xl border border-sky-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">Katalog Tersinkronisasi Penuh</span>
                <span className="text-[10px] text-slate-400">
                  Sinkronisasi terakhir: {new Date(cloudState.lastSyncedTimestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-[#222834] hover:bg-[#2b3342] text-slate-200 border border-[#2e3646] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkron...' : 'Sinkronkan'}</span>
            </button>
          </div>

          {/* Pairing Code for multi-device sync */}
          <div className="bg-[#12151c] p-3 rounded-xl border border-[#242a36] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">Kode Pasangan Perangkat (Sync Code)</span>
              <span className="text-[10px] text-slate-500">ID: {cloudState.deviceId}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#191d27] border border-[#2b313d] rounded-lg px-3 py-1.5 font-mono text-sm tracking-wider text-amber-300 font-bold text-center">
                {cloudState.syncPairCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-[#252c38] hover:bg-[#303847] text-white flex items-center gap-1"
                title="Salin kode sinkronisasi"
              >
                {hasCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopiedCode ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Masukkan kode ini pada perangkat lain (mis. laptop atau tablet) untuk menghubungkan seluruh katalog foto & preset secara langsung.
            </p>
          </div>

          {/* Connected Devices */}
          <div className="space-y-1.5">
            <span className="text-slate-400 font-medium block">Perangkat Terhubung ({cloudState.pairedDevicesCount}):</span>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141820] border border-[#222834]">
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-200 font-medium">Studio Workstation (Perangkat Ini)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Aktif Sekarang</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141820] border border-[#222834]">
                <div className="flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">MacBook Pro M3 Max</span>
                </div>
                <span className="text-[10px] text-slate-500">Tersinkron 15 menit lalu</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141820] border border-[#222834]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">iPad Pro 13" (Field Studio)</span>
                </div>
                <span className="text-[10px] text-slate-500">Tersinkron 2 jam lalu</span>
              </div>
            </div>
          </div>

          {/* Cloud Backup & Restore */}
          <div className="pt-2 border-t border-[#232832] flex items-center justify-between gap-3">
            <button
              onClick={() => exportCloudBackupBundle(photos, customPresets)}
              className="flex-1 py-2 px-3 rounded-lg bg-[#1e232d] hover:bg-[#282f3c] border border-[#2b313d] text-slate-200 font-medium flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Unduh Cadangan Cloud (.JSON)</span>
            </button>

            <label className="flex-1 py-2 px-3 rounded-lg bg-[#1e232d] hover:bg-[#282f3c] border border-[#2b313d] text-slate-200 font-medium flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Pulihkan Cadangan</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#232832] bg-[#191d26] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
