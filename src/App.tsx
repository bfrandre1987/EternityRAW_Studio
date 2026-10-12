/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PhotoItem, 
  PresetItem, 
  EditAdjustments, 
  ColorLabel, 
  FlagStatus 
} from './types';
import { 
  loadSavedPhotos, 
  savePhotos, 
  loadCustomPresets, 
  saveCustomPresets, 
  loadCloudSyncState, 
  saveCloudSyncState, 
  CloudSyncState 
} from './utils/storage';
import { DEFAULT_ADJUSTMENTS } from './utils/presets';
import { analyzeAndAutoRetouch, HistogramData } from './utils/rawProcessor';
import { Header } from './components/Header';
import { CanvasEditor } from './components/CanvasEditor';
import { SidebarEdit } from './components/SidebarEdit';
import { SidebarLeft } from './components/SidebarLeft';
import { Filmstrip } from './components/Filmstrip';
import { DAMCatalog } from './components/DAMCatalog';
import { BatchExportModal } from './components/BatchExportModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { QuickAssistGuide } from './components/QuickAssistGuide';

export default function App() {
  // Main Photos & Preset state
  const [photos, setPhotos] = useState<PhotoItem[]>(() => loadSavedPhotos());
  const [activePhotoId, setActivePhotoId] = useState<string>(() => photos[0]?.id || '');
  const [customPresets, setCustomPresets] = useState<PresetItem[]>(() => loadCustomPresets());
  const [cloudState, setCloudState] = useState<CloudSyncState>(() => loadCloudSyncState());

  // UI Modes
  const [currentTab, setCurrentTab] = useState<'dam' | 'develop'>('develop');
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(false);
  const [isFilmstripCollapsed, setIsFilmstripCollapsed] = useState<boolean>(false);
  const [isFullView, setIsFullView] = useState<boolean>(false);

  // Modals
  const [isBatchExportOpen, setIsBatchExportOpen] = useState<boolean>(false);
  const [batchExportPhotosList, setBatchExportPhotosList] = useState<PhotoItem[]>([]);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Mask & Visualizer states
  const [showMaskOverlay, setShowMaskOverlay] = useState<boolean>(false);
  const [activeMaskId, setActiveMaskId] = useState<string | undefined>(undefined);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);

  // Undo / Redo history stack for the current editing session
  const [undoStack, setUndoStack] = useState<EditAdjustments[]>([]);
  const [redoStack, setRedoStack] = useState<EditAdjustments[]>([]);

  // Find active photo safely
  const activePhoto = useMemo(() => {
    return photos.find((p) => p.id === activePhotoId) || photos[0];
  }, [photos, activePhotoId]);

  // Sync edits to active photo and persist
  const handleUpdateAdjustments = useCallback(
    (newAdj: EditAdjustments, description: string = 'Penyesuaian Slider') => {
      if (!activePhoto) return;

      // Push current to undo stack
      setUndoStack((prev) => [...prev, activePhoto.adjustments]);
      setRedoStack([]);

      const updatedHistory = [
        ...activePhoto.history,
        {
          description,
          timestamp: Date.now(),
          adjustments: newAdj,
        },
      ];

      const updatedPhoto: PhotoItem = {
        ...activePhoto,
        adjustments: newAdj,
        history: updatedHistory,
        cloudSyncStatus: 'synced',
      };

      setPhotos((prevPhotos) => {
        const next = prevPhotos.map((p) => (p.id === activePhoto.id ? updatedPhoto : p));
        savePhotos(next);
        return next;
      });
    },
    [activePhoto]
  );

  // Smart Auto Retouch (Capture One style)
  const handleSmartAutoRetouch = useCallback(() => {
    if (!activePhoto) return;

    // Create offscreen canvas with current photo to analyze
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activePhoto.url;
    img.onload = () => {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d')!;
      c.width = 400;
      c.height = 300;
      ctx.drawImage(img, 0, 0, 400, 300);
      const imgData = ctx.getImageData(0, 0, 400, 300);

      const autoAdjs = analyzeAndAutoRetouch(imgData);
      const merged: EditAdjustments = {
        ...activePhoto.adjustments,
        ...autoAdjs,
      };

      handleUpdateAdjustments(merged, 'Smart Auto-Retouch (Capture One)');
    };
  }, [activePhoto, handleUpdateAdjustments]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !activePhoto) return;
    const prevAdj = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setRedoStack((prev) => [...prev, activePhoto.adjustments]);
    setUndoStack(newUndoStack);

    const updatedPhoto: PhotoItem = {
      ...activePhoto,
      adjustments: prevAdj,
      cloudSyncStatus: 'synced',
    };

    setPhotos((prev) => {
      const next = prev.map((p) => (p.id === activePhoto.id ? updatedPhoto : p));
      savePhotos(next);
      return next;
    });
  }, [undoStack, activePhoto]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !activePhoto) return;
    const nextAdj = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setUndoStack((prev) => [...prev, activePhoto.adjustments]);
    setRedoStack(newRedoStack);

    const updatedPhoto: PhotoItem = {
      ...activePhoto,
      adjustments: nextAdj,
      cloudSyncStatus: 'synced',
    };

    setPhotos((prev) => {
      const next = prev.map((p) => (p.id === activePhoto.id ? updatedPhoto : p));
      savePhotos(next);
      return next;
    });
  }, [redoStack, activePhoto]);

  // Preset application
  const handleApplyPreset = (preset: PresetItem) => {
    if (!activePhoto) return;
    const merged: EditAdjustments = {
      ...activePhoto.adjustments,
      ...preset.adjustments,
    };
    handleUpdateAdjustments(merged, `Preset: ${preset.name}`);
  };

  const handleSaveCustomPreset = (newPreset: PresetItem) => {
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
  };

  // Rollback to specific history step
  const handleSelectHistoryStep = (index: number) => {
    if (!activePhoto || !activePhoto.history[index]) return;
    const targetAdj = activePhoto.history[index].adjustments;
    handleUpdateAdjustments(targetAdj, `Kembali ke: ${activePhoto.history[index].description}`);
  };

  const handleResetToOriginal = () => {
    handleUpdateAdjustments(DEFAULT_ADJUSTMENTS, 'Reset Semua ke Default RAW');
  };

  // Metadata update
  const handleUpdatePhotoMetadata = (tags: string[], collection: string) => {
    if (!activePhoto) return;
    const updated: PhotoItem = { ...activePhoto, tags, collection };
    setPhotos((prev) => {
      const next = prev.map((p) => (p.id === activePhoto.id ? updated : p));
      savePhotos(next);
      return next;
    });
  };

  // Batch Export Trigger
  const handleOpenBatchExport = (selectedList?: PhotoItem[]) => {
    if (selectedList && selectedList.length > 0) {
      setBatchExportPhotosList(selectedList);
    } else if (activePhoto) {
      setBatchExportPhotosList([activePhoto]);
    }
    setIsBatchExportOpen(true);
  };

  // Ratings & Flags
  const handleRatePhoto = (id: string, rating: number) => {
    setPhotos((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, rating } : p));
      savePhotos(next);
      return next;
    });
  };

  const handleFlagPhoto = (id: string, flag: FlagStatus) => {
    setPhotos((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, flag } : p));
      savePhotos(next);
      return next;
    });
  };

  const handleDeletePhotos = (ids: string[]) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => !ids.includes(p.id));
      savePhotos(next);
      if (ids.includes(activePhotoId) && next[0]) {
        setActivePhotoId(next[0].id);
      }
      return next;
    });
  };

  // File import handler for RAW & images
  const handleImportFiles = (files: FileList) => {
    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      const isRawFile = /\.(dng|cr2|cr3|nef|arw|raf|raw|tiff)$/i.test(file.name);
      const ext = (file.name.split('.').pop() || 'RAW').toUpperCase();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newPhoto: PhotoItem = {
          id: 'imported-' + Date.now() + '-' + idx,
          name: file.name.replace(/\.[^/.]+$/, ''),
          originalFileName: file.name,
          url: dataUrl,
          thumbnailUrl: dataUrl,
          isRaw: true,
          exif: {
            cameraMake: isRawFile ? 'Pro Camera System' : 'Digital Camera',
            cameraModel: isRawFile ? `Pro RAW (${ext})` : 'Digital Sensor',
            lens: 'Prime 50mm f/1.4',
            iso: 100,
            aperture: 'f/2.8',
            shutterSpeed: '1/500s',
            focalLength: '50mm',
            colorSpace: 'ProPhoto RGB',
            rawFormat: ext as any,
            dimensions: { width: 6000, height: 4000 },
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            dateTaken: new Date().toISOString().slice(0, 16).replace('T', ' '),
            bitDepth: '14-bit Uncompressed RAW',
          },
          rating: 0,
          colorLabel: 'none',
          flag: 'unflagged',
          tags: ['Impor', ext],
          collection: 'Impor Terbaru',
          dateAdded: new Date().toISOString().slice(0, 10),
          adjustments: { ...DEFAULT_ADJUSTMENTS },
          history: [
            {
              description: `Impor Berkas ${ext}`,
              timestamp: Date.now(),
              adjustments: DEFAULT_ADJUSTMENTS,
            },
          ],
          cloudSyncStatus: 'synced',
        };

        setPhotos((prev) => {
          const next = [newPhoto, ...prev];
          savePhotos(next);
          return next;
        });

        setActivePhotoId(newPhoto.id);
        setCurrentTab('develop');
      };

      reader.readAsDataURL(file);
    });
  };

  // Keyboard Shortcuts Handler (1-5 for rating, P for pick, X for reject, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Escape to exit full view
      if (e.key === 'Escape' && isFullView) {
        e.preventDefault();
        setIsFullView(false);
        return;
      }

      // F to toggle full view (standard pro photo editor shortcut)
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && currentTab === 'develop') {
        e.preventDefault();
        setIsFullView((prev) => !prev);
        return;
      }

      // Rating: 0-5
      if (['0', '1', '2', '3', '4', '5'].includes(e.key) && activePhoto) {
        handleRatePhoto(activePhoto.id, parseInt(e.key));
        return;
      }

      // Pick: P
      if (e.key.toLowerCase() === 'p' && activePhoto) {
        handleFlagPhoto(activePhoto.id, activePhoto.flag === 'picked' ? 'unflagged' : 'picked');
        return;
      }

      // Reject: X
      if (e.key.toLowerCase() === 'x' && activePhoto) {
        handleFlagPhoto(activePhoto.id, activePhoto.flag === 'rejected' ? 'unflagged' : 'rejected');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, handleUndo, handleRedo, isFullView, currentTab]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#121417] text-[#e1e4ea] overflow-hidden select-none font-sans">
      {/* Studio Header Bar */}
      {!isFullView && (
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isBeginnerMode={isBeginnerMode}
          onToggleBeginnerMode={() => setIsBeginnerMode(!isBeginnerMode)}
          onSmartAutoRetouch={handleSmartAutoRetouch}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          cloudState={cloudState}
          onOpenCloudModal={() => setIsCloudModalOpen(true)}
          onOpenBatchExportModal={() => handleOpenBatchExport()}
          onOpenGuideModal={() => setIsGuideModalOpen(true)}
          activePhotoName={activePhoto?.name}
        />
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {currentTab === 'dam' ? (
          /* ========================================================= */
          /* PUSTAKA DAM (DIGITAL ASSET MANAGEMENT VIEW)               */
          /* ========================================================= */
          <DAMCatalog
            photos={photos}
            onOpenPhotoInEditor={(photo, openInFullView) => {
              setActivePhotoId(photo.id);
              setCurrentTab('develop');
              if (openInFullView) {
                setIsFullView(true);
              }
            }}
            onUpdatePhoto={(updated) => {
              setPhotos((prev) => {
                const next = prev.map((p) => (p.id === updated.id ? updated : p));
                savePhotos(next);
                return next;
              });
            }}
            onDeletePhotos={handleDeletePhotos}
            onBatchExportSelected={handleOpenBatchExport}
            onImportPhotos={handleImportFiles}
          />
        ) : (
          /* ========================================================= */
          /* EDITOR STUDIO (DEVELOP RAW VIEW)                          */
          /* ========================================================= */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {/* Left Dock: Presets, History & EXIF (hidden in Full View) */}
              {activePhoto && !isFullView && (
                <SidebarLeft
                  activePhoto={activePhoto}
                  customPresets={customPresets}
                  onApplyPreset={handleApplyPreset}
                  onSaveCustomPreset={handleSaveCustomPreset}
                  onSelectHistoryStep={handleSelectHistoryStep}
                  onResetToOriginal={handleResetToOriginal}
                  onUpdatePhotoMetadata={handleUpdatePhotoMetadata}
                />
              )}

              {/* Center Canvas Viewport */}
              {activePhoto && (
                <CanvasEditor
                  photo={activePhoto}
                  adjustments={activePhoto.adjustments}
                  onHistogramUpdate={setHistogramData}
                  showMaskOverlay={showMaskOverlay}
                  onToggleMaskOverlay={() => setShowMaskOverlay(!showMaskOverlay)}
                  activeMaskId={activeMaskId}
                  showClippingWarning={false}
                  onResetAdjustments={handleResetToOriginal}
                  isFullView={isFullView}
                  onToggleFullView={() => setIsFullView((prev) => !prev)}
                />
              )}

              {/* Right Inspector: Beginner & Pro Adjustment Panels (hidden in Full View) */}
              {activePhoto && !isFullView && (
                <SidebarEdit
                  adjustments={activePhoto.adjustments}
                  onChangeAdjustments={handleUpdateAdjustments}
                  histogramData={histogramData}
                  exif={activePhoto.exif}
                  isBeginnerMode={isBeginnerMode}
                  onSmartAutoRetouch={handleSmartAutoRetouch}
                  showMaskOverlay={showMaskOverlay}
                  onToggleMaskOverlay={() => setShowMaskOverlay(!showMaskOverlay)}
                  activeMaskId={activeMaskId}
                  onSelectMask={setActiveMaskId}
                />
              )}
            </div>

            {/* Bottom Filmstrip Bar (hidden in Full View) */}
            {!isFullView && (
              <Filmstrip
                photos={photos}
                activePhotoId={activePhotoId}
                onSelectPhoto={(photo) => setActivePhotoId(photo.id)}
                onDoubleClickPhoto={(photo) => {
                  setActivePhotoId(photo.id);
                  setIsFullView(true);
                }}
                onRatePhoto={handleRatePhoto}
                onFlagPhoto={handleFlagPhoto}
                onOpenImport={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*,.dng,.cr2,.cr3,.nef,.arw,.raf,.raw,.tiff';
                  input.onchange = (e: any) => e.target.files && handleImportFiles(e.target.files);
                  input.click();
                }}
                isCollapsed={isFilmstripCollapsed}
                onToggleCollapse={() => setIsFilmstripCollapsed(!isFilmstripCollapsed)}
              />
            )}
          </div>
        )}
      </div>

      {/* Batch Export Modal */}
      <BatchExportModal
        photosToExport={batchExportPhotosList}
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
      />

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        cloudState={cloudState}
        onUpdateCloudState={(newState) => {
          setCloudState(newState);
          saveCloudSyncState(newState);
        }}
        photos={photos}
        customPresets={customPresets}
        onRestoreBackup={(restoredPhotos, restoredPresets) => {
          setPhotos(restoredPhotos);
          savePhotos(restoredPhotos);
          if (restoredPresets.length > 0) {
            setCustomPresets(restoredPresets);
            saveCustomPresets(restoredPresets);
          }
          if (restoredPhotos[0]) setActivePhotoId(restoredPhotos[0].id);
        }}
      />

      {/* Beginner Quick Guide Modal */}
      <QuickAssistGuide
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
