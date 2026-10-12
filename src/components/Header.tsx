import React from 'react';
import { 
  Sliders, 
  Grid3X3, 
  Wand2, 
  Undo2, 
  Redo2, 
  Cloud, 
  Download, 
  HelpCircle, 
  Zap, 
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { CloudSyncState } from '../utils/storage';

interface HeaderProps {
  currentTab: 'dam' | 'develop';
  onTabChange: (tab: 'dam' | 'develop') => void;
  isBeginnerMode: boolean;
  onToggleBeginnerMode: () => void;
  onSmartAutoRetouch: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  cloudState: CloudSyncState;
  onOpenCloudModal: () => void;
  onOpenBatchExportModal: () => void;
  onOpenGuideModal: () => void;
  activePhotoName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  isBeginnerMode,
  onToggleBeginnerMode,
  onSmartAutoRetouch,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  cloudState,
  onOpenCloudModal,
  onOpenBatchExportModal,
  onOpenGuideModal,
  activePhotoName,
}) => {
  return (
    <header className="h-14 bg-[#16191f] border-b border-[#232832] px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Brand & Mode Navigation */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-md shadow-amber-900/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">LuminaRAW</span>
              <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 tracking-wider">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none">Editor RAW & Retouch Cepat</p>
          </div>
        </div>

        {/* Workspace Segmented Switcher */}
        <div className="flex items-center bg-[#1d222b] p-0.5 rounded-lg border border-[#2b313d]">
          <button
            onClick={() => onTabChange('dam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === 'dam'
                ? 'bg-[#2b3342] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Digital Asset Management (Katalog Foto)"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Pustaka DAM</span>
          </button>

          <button
            onClick={() => onTabChange('develop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === 'develop'
                ? 'bg-[#2b3342] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Studio Pengeditan RAW & Retouch"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Editor Studio</span>
          </button>
        </div>

        {/* Current Active Photo Indicator */}
        {activePhotoName && currentTab === 'develop' && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 border-l border-[#2b313d] pl-4">
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="max-w-[200px] truncate text-slate-300 font-medium">{activePhotoName}</span>
          </div>
        )}
      </div>

      {/* Middle: Pro Auto Retouch & Undo/Redo */}
      <div className="flex items-center gap-2">
        {currentTab === 'develop' && (
          <>
            <button
              onClick={onSmartAutoRetouch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Auto-Retouch Cerdas ala Capture One (Skin, Exposure & WB)"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Smart Retouch</span>
            </button>

            <div className="h-4 w-[1px] bg-[#2b313d] mx-1" />

            <div className="flex items-center gap-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 rounded-md hover:bg-[#232833] text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Batalkan (Undo) [Ctrl+Z]"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 rounded-md hover:bg-[#232833] text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Ulangi (Redo) [Ctrl+Y]"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: Beginner/Pro Toggle, Cloud Sync, Batch Export, Help */}
      <div className="flex items-center gap-2.5">
        {/* Beginner vs Pro Mode Toggle */}
        <button
          onClick={onToggleBeginnerMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isBeginnerMode
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-[#1e232d] border-[#2b313d] text-slate-300 hover:text-white'
          }`}
          title={isBeginnerMode ? 'Beralih ke Mode Pro Studio' : 'Beralih ke Mode Pemula (Ramah & Ringan)'}
        >
          <Zap className={`w-3.5 h-3.5 ${isBeginnerMode ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>{isBeginnerMode ? 'Mode Pemula' : 'Mode Pro'}</span>
        </button>

        {/* Cloud Sync Status */}
        <button
          onClick={onOpenCloudModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e232d] hover:bg-[#262c38] border border-[#2b313d] text-xs font-medium text-slate-300 transition-colors"
          title="Sinkronisasi Cloud Antar-Perangkat"
        >
          <Cloud className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Cloud Sync</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Batch Export */}
        <button
          onClick={onOpenBatchExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          title="Ekspor Foto Sekaligus / Batch Export Zip"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Batch</span>
        </button>

        {/* Help & Shortcuts */}
        <button
          onClick={onOpenGuideModal}
          className="p-1.5 rounded-lg hover:bg-[#232833] text-slate-400 hover:text-slate-200 transition-colors"
          title="Panduan & Shortcut Keyboard"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
