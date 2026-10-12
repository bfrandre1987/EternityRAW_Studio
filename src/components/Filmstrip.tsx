import React from 'react';
import { PhotoItem, ColorLabel, FlagStatus } from '../types';
import { Star, Flag, Check, X, ChevronUp, ChevronDown, Plus } from 'lucide-react';

interface FilmstripProps {
  photos: PhotoItem[];
  activePhotoId: string;
  onSelectPhoto: (photo: PhotoItem) => void;
  onRatePhoto: (id: string, rating: number) => void;
  onFlagPhoto: (id: string, flag: FlagStatus) => void;
  onOpenImport: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDoubleClickPhoto?: (photo: PhotoItem) => void;
}

export const Filmstrip: React.FC<FilmstripProps> = ({
  photos,
  activePhotoId,
  onSelectPhoto,
  onRatePhoto,
  onFlagPhoto,
  onOpenImport,
  isCollapsed,
  onToggleCollapse,
  onDoubleClickPhoto,
}) => {
  if (isCollapsed) {
    return (
      <div className="h-6 bg-[#161920] border-t border-[#232832] flex items-center justify-between px-3 select-none">
        <span className="text-[10px] text-slate-400 font-medium">Filmstrip ({photos.length} Foto)</span>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-0.5"
          title="Tampilkan Filmstrip"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-28 bg-[#15181f] border-t border-[#232832] flex flex-col select-none shrink-0 z-20">
      {/* Filmstrip Title Bar */}
      <div className="h-5 px-3 flex items-center justify-between border-b border-[#202530] text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Filmstrip Studio</span>
          <span>·</span>
          <span>{photos.length} item</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
          >
            <Plus className="w-3 h-3" />
            <span>Impor</span>
          </button>
          <button
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-white"
            title="Sembunyikan Filmstrip"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Thumbnails Scroll Bar */}
      <div className="flex-1 overflow-x-auto flex items-center gap-2 px-3 py-1.5 scrollbar-thin">
        {photos.map((item, idx) => {
          const isActive = item.id === activePhotoId;
          return (
            <div
              key={item.id}
              onClick={() => onSelectPhoto(item)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onSelectPhoto(item);
                onDoubleClickPhoto?.(item);
              }}
              title="Klik untuk memilih foto · Klik ganda untuk membuka Mode Full View"
              className={`relative h-20 w-24 shrink-0 rounded-lg overflow-hidden cursor-pointer group border transition-all ${
                isActive
                  ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                  : 'border-[#29303c] hover:border-slate-500 opacity-80 hover:opacity-100'
              }`}
            >
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />

              {/* Top Flag / RAW badge */}
              <div className="absolute top-1 inset-x-1 flex items-center justify-between pointer-events-none">
                <span className="text-[8px] font-mono bg-black/75 backdrop-blur-xs text-amber-300 px-1 rounded font-bold">
                  {item.exif.rawFormat}
                </span>

                {item.flag === 'picked' && (
                  <span className="bg-emerald-600 text-white p-0.5 rounded-full shadow">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
                {item.flag === 'rejected' && (
                  <span className="bg-rose-600 text-white p-0.5 rounded-full shadow">
                    <X className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Bottom Rating Stars Bar */}
              <div
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => onRatePhoto(item.id, item.rating === star ? 0 : star)}
                      className="p-0.5 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-2.5 h-2.5 ${
                          star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <span className="text-[9px] font-mono text-slate-400">#{idx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
