import React from 'react';
import { 
  X, 
  Sparkles, 
  Camera, 
  Layers, 
  Keyboard, 
  Wand2, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

interface QuickAssistGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAssistGuide: React.FC<QuickAssistGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#171a22] border border-[#2b313d] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col text-xs max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#232832] flex items-center justify-between bg-[#191d26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Panduan Cepat LuminaRAW Studio</h3>
              <p className="text-[11px] text-slate-400">Editor RAW ringan & ramah pemula dengan kekuatan Capture One Pro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#252c38]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Card 1: RAW Processing */}
          <div className="bg-[#14171f] p-4 rounded-xl border border-[#232833] space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Camera className="w-4 h-4" />
              <span>Dukungan Format RAW Berkecepatan Tinggi</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Berkas RAW menyimpan data sensor mentah (14-bit hingga 16-bit) tanpa kompresi permanen. Di LuminaRAW, Anda dapat memulihkan sorotan berlebih (Highlight Recovery) dan mengangkat bayangan gelap (Shadow Lift) dengan rentang dinamis penuh tanpa merusak kualitas foto.
            </p>
          </div>

          {/* Card 2: Capture One Auto Retouch */}
          <div className="bg-[#14171f] p-4 rounded-xl border border-[#232833] space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <Wand2 className="w-4 h-4" />
              <span>Auto-Retouch Cerdas (Capture One Pro Style)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Tombol <strong>Smart Retouch</strong> menganalisis histogram, warna kulit, dan kecerahan secara otomatis. Fitur <em>Skin Smoothing</em> mendeteksi spektrum warna kulit wajah dan menghaluskan bercak mikro tanpa menghilangkan detail mata, alis, atau rambut.
            </p>
          </div>

          {/* Card 3: AI Subject Masking */}
          <div className="bg-[#14171f] p-4 rounded-xl border border-[#232833] space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <Layers className="w-4 h-4" />
              <span>AI Subject & Sky Masking (Seleksi Otomatis)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Pilih <strong>AI Subjek Utama</strong> atau <strong>AI Langit</strong> di panel masker untuk mengisolasi area foto dalam sekejap. Aktifkan <em>Mask Overlay (Merah Ruby)</em> untuk melihat visualisasi seleksi, lalu sesuaikan kecerahan atau saturasi khusus untuk area tersebut.
            </p>
          </div>

          {/* Card 4: Keyboard Shortcuts */}
          <div className="bg-[#14171f] p-4 rounded-xl border border-[#232833] space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Keyboard className="w-4 h-4" />
              <span>Pintasan Keyboard (Shortcuts Pro)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>Klik Ganda</span>
                <span className="text-amber-300">Zoom 400% / Pas Layar</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>F</span>
                <span className="text-purple-300">Mode Full View (Layar Penuh)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>Esc</span>
                <span className="text-slate-400">Keluar dari Full View</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>1 – 5</span>
                <span className="text-slate-400">Beri Bintang Rating (1-5★)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>P / X</span>
                <span className="text-slate-400">Tandai Pilihan / Tolak</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>Y atau \</span>
                <span className="text-slate-400">Tahan: Lihat Sebelum/Sesudah</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>Ctrl + Z</span>
                <span className="text-slate-400">Batalkan Perubahan (Undo)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>Ctrl + Y</span>
                <span className="text-slate-400">Ulangi Perubahan (Redo)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>Scroll Mouse</span>
                <span className="text-amber-300">Zoom In & Zoom Out Kanvas</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#101319]">
                <span>Spasi + Drag</span>
                <span className="text-slate-400">Geser Kanvas (Pan)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#232832] bg-[#191d26] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all"
          >
            Mengerti & Mulai Mengedit
          </button>
        </div>
      </div>
    </div>
  );
};
