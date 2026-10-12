import React, { useState, useMemo } from 'react';
import { 
  PhotoItem, 
  ColorLabel, 
  FlagStatus, 
  DAMFilter 
} from '../types';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  Folder, 
  Star, 
  Check, 
  X, 
  Sliders, 
  Download, 
  Upload, 
  Trash2, 
  Camera, 
  Tag, 
  CheckSquare, 
  Square,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface DAMCatalogProps {
  photos: PhotoItem[];
  onOpenPhotoInEditor: (photo: PhotoItem, openInFullView?: boolean) => void;
  onUpdatePhoto: (updated: PhotoItem) => void;
  onDeletePhotos: (ids: string[]) => void;
  onBatchExportSelected: (photos: PhotoItem[]) => void;
  onImportPhotos: (files: FileList) => void;
}

export const DAMCatalog: React.FC<DAMCatalogProps> = ({
  photos,
  onOpenPhotoInEditor,
  onUpdatePhoto,
  onDeletePhotos,
  onBatchExportSelected,
  onImportPhotos,
}) => {
  // Selected photos for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filter, setFilter] = useState<DAMFilter>({
    searchQuery: '',
    minRating: 0,
    colorLabel: 'all',
    flag: 'all',
    cameraModel: '',
    collection: 'Semua Foto',
    rawOnly: false,
    sortBy: 'dateAdded',
    sortOrder: 'desc',
  });

  // Grid thumbnail size
  const [thumbnailSize, setThumbnailSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Compute unique collections
  const collections = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.collection) set.add(p.collection);
    });
    return Array.from(set);
  }, [photos]);

  // Filtered & Sorted photos
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      // Collection
      if (filter.collection === 'Favorit' && p.rating < 4) return false;
      if (filter.collection === 'Pilihan (Picked)' && p.flag !== 'picked') return false;
      if (filter.collection === 'Ditolak (Rejected)' && p.flag !== 'rejected') return false;
      if (filter.collection === 'RAW Format' && !p.isRaw) return false;
      if (
        filter.collection !== 'Semua Foto' &&
        filter.collection !== 'Favorit' &&
        filter.collection !== 'Pilihan (Picked)' &&
        filter.collection !== 'Ditolak (Rejected)' &&
        filter.collection !== 'RAW Format' &&
        p.collection !== filter.collection
      ) {
        return false;
      }

      // RAW Only
      if (filter.rawOnly && !p.isRaw) return false;

      // Min Rating
      if (filter.minRating > 0 && p.rating < filter.minRating) return false;

      // Color label
      if (filter.colorLabel !== 'all' && p.colorLabel !== filter.colorLabel) return false;

      // Flag
      if (filter.flag !== 'all' && p.flag !== filter.flag) return false;

      // Search Query
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q) || p.originalFileName.toLowerCase().includes(q);
        const matchesCamera = p.exif.cameraModel.toLowerCase().includes(q) || p.exif.lens.toLowerCase().includes(q);
        const matchesTags = p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCamera && !matchesTags) return false;
      }

      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (filter.sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (filter.sortBy === 'rating') cmp = a.rating - b.rating;
      else if (filter.sortBy === 'iso') cmp = a.exif.iso - b.exif.iso;
      else cmp = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      return filter.sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [photos, filter]);

  // Selection handlers
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
    }
  };

  const handleBatchRate = (rating: number) => {
    selectedIds.forEach((id) => {
      const p = photos.find((item) => item.id === id);
      if (p) onUpdatePhoto({ ...p, rating });
    });
  };

  const handleBatchFlag = (flag: FlagStatus) => {
    selectedIds.forEach((id) => {
      const p = photos.find((item) => item.id === id);
      if (p) onUpdatePhoto({ ...p, flag });
    });
  };

  const handleBatchColor = (colorLabel: ColorLabel) => {
    selectedIds.forEach((id) => {
      const p = photos.find((item) => item.id === id);
      if (p) onUpdatePhoto({ ...p, colorLabel });
    });
  };

  const handleBatchDelete = () => {
    if (confirm(`Hapus ${selectedIds.size} foto yang dipilih dari katalog?`)) {
      onDeletePhotos(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const selectedPhotosList = useMemo(() => {
    return photos.filter((p) => selectedIds.has(p.id));
  }, [photos, selectedIds]);

  const colorPillMap: Record<ColorLabel, string> = {
    none: 'bg-transparent',
    red: 'bg-rose-500',
    yellow: 'bg-amber-400',
    green: 'bg-emerald-500',
    blue: 'bg-sky-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#121417] text-xs select-none">
      {/* Left: Collections & Library Navigation */}
      <div className="w-64 bg-[#15181f] border-r border-[#232832] flex flex-col h-full shrink-0">
        <div className="p-3 border-b border-[#232832] flex items-center justify-between">
          <span className="font-semibold text-slate-200 text-xs flex items-center gap-2">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Koleksi & Proyek</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">{photos.length} Total</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Default Smart Collections */}
          {[
            { id: 'Semua Foto', label: 'Semua Foto', count: photos.length },
            { id: 'Favorit', label: 'Favorit (4★+)', count: photos.filter((p) => p.rating >= 4).length },
            { id: 'Pilihan (Picked)', label: 'Pilihan (Picked)', count: photos.filter((p) => p.flag === 'picked').length },
            { id: 'Ditolak (Rejected)', label: 'Ditolak (Rejected)', count: photos.filter((p) => p.flag === 'rejected').length },
            { id: 'RAW Format', label: 'Berkas RAW Asli', count: photos.filter((p) => p.isRaw).length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter({ ...filter, collection: item.id })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                filter.collection === item.id
                  ? 'bg-[#252c38] text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1f28]'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] font-mono opacity-60">{item.count}</span>
            </button>
          ))}

          {/* User Collections */}
          {collections.length > 0 && (
            <div className="pt-3 border-t border-[#232832] mt-2">
              <span className="text-[10px] uppercase font-semibold text-slate-500 px-2 block mb-1">
                Koleksi Kustom
              </span>
              {collections.map((cName) => {
                const count = photos.filter((p) => p.collection === cName).length;
                return (
                  <button
                    key={cName}
                    onClick={() => setFilter({ ...filter, collection: cName })}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      filter.collection === cName
                        ? 'bg-[#252c38] text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1f28]'
                    }`}
                  >
                    <span className="truncate">{cName}</span>
                    <span className="text-[10px] font-mono opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Import Zone */}
        <div className="p-3 border-t border-[#232832] bg-[#161a22]">
          <label className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Foto / File RAW</span>
            <input
              type="file"
              multiple
              accept="image/*,.dng,.cr2,.cr3,.nef,.arw,.raf,.raw,.tiff"
              onChange={(e) => e.target.files && onImportPhotos(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Content: Filters + Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Filter Bar */}
        <div className="bg-[#161921] border-b border-[#232832] p-3 flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari foto, kamera, lensa, tag..."
              value={filter.searchQuery}
              onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
              className="w-full bg-[#11141a] border border-[#2b313d] rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Rating Stars Filter */}
            <div className="flex items-center bg-[#11141a] p-1 rounded-lg border border-[#2b313d] gap-0.5">
              <span className="text-[10px] text-slate-400 px-1 font-medium">Bintang:</span>
              {[0, 1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFilter({ ...filter, minRating: star })}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                    filter.minRating === star ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {star === 0 ? 'Semua' : `${star}★`}
                </button>
              ))}
            </div>

            {/* Flag Filter */}
            <div className="flex items-center bg-[#11141a] p-1 rounded-lg border border-[#2b313d] gap-0.5">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'picked', label: 'Dipilih' },
                { id: 'rejected', label: 'Ditolak' },
              ].map((fl) => (
                <button
                  key={fl.id}
                  onClick={() => setFilter({ ...filter, flag: fl.id as any })}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    filter.flag === fl.id ? 'bg-[#2b3342] text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fl.label}
                </button>
              ))}
            </div>

            {/* RAW Only Toggle */}
            <button
              onClick={() => setFilter({ ...filter, rawOnly: !filter.rawOnly })}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                filter.rawOnly
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-[#11141a] border-[#2b313d] text-slate-400 hover:text-white'
              }`}
            >
              RAW Saja
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-[#11141a] border border-[#2b313d] rounded-lg px-2 py-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter({ ...filter, sortBy: e.target.value as any })}
                className="bg-transparent text-slate-300 focus:outline-none"
              >
                <option value="dateAdded">Tanggal</option>
                <option value="name">Nama</option>
                <option value="rating">Rating</option>
                <option value="iso">ISO</option>
              </select>
            </div>

            {/* Thumbnail Size Switcher */}
            <div className="flex items-center bg-[#11141a] p-1 rounded-lg border border-[#2b313d] gap-1">
              <button
                onClick={() => setThumbnailSize('sm')}
                className={`px-2 py-0.5 rounded text-[10px] ${thumbnailSize === 'sm' ? 'bg-[#2b3342] text-white' : 'text-slate-400'}`}
              >
                S
              </button>
              <button
                onClick={() => setThumbnailSize('md')}
                className={`px-2 py-0.5 rounded text-[10px] ${thumbnailSize === 'md' ? 'bg-[#2b3342] text-white' : 'text-slate-400'}`}
              >
                M
              </button>
              <button
                onClick={() => setThumbnailSize('lg')}
                className={`px-2 py-0.5 rounded text-[10px] ${thumbnailSize === 'lg' ? 'bg-[#2b3342] text-white' : 'text-slate-400'}`}
              >
                L
              </button>
            </div>
          </div>
        </div>

        {/* Batch Selection Action Bar (Appears when 1+ selected) */}
        {selectedIds.size > 0 && (
          <div className="bg-[#1a202c] border-b border-amber-500/30 px-4 py-2 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-amber-300 font-semibold"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{selectedIds.size} Foto Terpilih</span>
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Batal Pilihan
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Batch Rate */}
              <div className="flex items-center gap-0.5 bg-[#12151c] px-2 py-1 rounded-lg border border-[#2d3442]">
                <span className="text-[10px] text-slate-400 mr-1">Bintang:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleBatchRate(star)}
                    className="p-0.5 hover:text-amber-400 text-slate-400"
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Batch Flags */}
              <button
                onClick={() => handleBatchFlag('picked')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Pick</span>
              </button>

              <button
                onClick={() => handleBatchFlag('rejected')}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reject</span>
              </button>

              {/* Batch Export */}
              <button
                onClick={() => onBatchExportSelected(selectedPhotosList)}
                className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Batch ({selectedIds.size})</span>
              </button>

              {/* Batch Delete */}
              <button
                onClick={handleBatchDelete}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                title="Hapus Foto Terpilih"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Photos Grid View */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPhotos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Camera className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">Tidak ada foto ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan filter pencarian atau impor berkas foto RAW baru.</p>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                thumbnailSize === 'sm'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                  : thumbnailSize === 'md'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              }`}
            >
              {filteredPhotos.map((photo) => {
                const isSelected = selectedIds.has(photo.id);

                return (
                  <div
                    key={photo.id}
                    onClick={() => onOpenPhotoInEditor(photo)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onOpenPhotoInEditor(photo, true);
                    }}
                    title="Klik untuk membuka editor · Klik ganda untuk langsung ke Mode Full View"
                    className={`group relative bg-[#171a22] rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col shadow-sm ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/40 bg-[#1e232f]'
                        : 'border-[#242935] hover:border-slate-500 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Selection Checkbox */}
                      <div
                        onClick={(e) => toggleSelect(photo.id, e)}
                        className="absolute top-2 left-2 z-10 p-1 rounded-md bg-black/60 backdrop-blur-xs text-white opacity-80 group-hover:opacity-100 hover:scale-110 transition-all"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>

                      {/* RAW Format Badge */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold bg-black/75 backdrop-blur-xs text-amber-300 px-1.5 py-0.5 rounded shadow">
                          {photo.exif.rawFormat}
                        </span>
                      </div>

                      {/* Color Tag Indicator */}
                      {photo.colorLabel !== 'none' && (
                        <div
                          className={`absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full ${colorPillMap[photo.colorLabel]} ring-1 ring-white/50 shadow`}
                        />
                      )}

                      {/* Pick / Reject Badge */}
                      {photo.flag !== 'unflagged' && (
                        <div className="absolute bottom-2 right-2">
                          {photo.flag === 'picked' ? (
                            <span className="bg-emerald-600 text-white p-1 rounded-md flex items-center shadow">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="bg-rose-600 text-white p-1 rounded-md flex items-center shadow">
                              <X className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Meta Card Bottom */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors truncate block">
                          {photo.name}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>{photo.exif.cameraModel}</span>
                          <span className="font-mono text-slate-500">{photo.exif.fileSize}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#232832]">
                        {/* Rating Stars */}
                        <div
                          className="flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => onUpdatePhoto({ ...photo, rating: photo.rating === star ? 0 : star })}
                              className="p-0.5 hover:scale-125 transition-transform"
                            >
                              <Star
                                className={`w-3 h-3 ${
                                  star <= photo.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Open in Editor Link */}
                        <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 group-hover:underline">
                          <Sliders className="w-3 h-3" />
                          <span>Edit</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
