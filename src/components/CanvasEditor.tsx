import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhotoItem, EditAdjustments } from '../types';
import { processRawPhoto, HistogramData } from '../utils/rawProcessor';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  SplitSquareVertical, 
  SplitSquareHorizontal,
  Columns, 
  Eye, 
  Grid, 
  RotateCcw,
  Layers,
  Minimize2,
  Expand,
  ArrowLeftRight,
  ArrowUpDown
} from 'lucide-react';

interface CanvasEditorProps {
  photo: PhotoItem;
  adjustments: EditAdjustments;
  onHistogramUpdate: (data: HistogramData) => void;
  showMaskOverlay: boolean;
  onToggleMaskOverlay: () => void;
  activeMaskId?: string;
  showClippingWarning: boolean;
  onResetAdjustments: () => void;
  isFullView?: boolean;
  onToggleFullView?: () => void;
}

export type ViewMode = 'single' | 'split' | 'side-by-side';
export type SplitOrientation = 'vertical' | 'horizontal';

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  photo,
  adjustments,
  onHistogramUpdate,
  showMaskOverlay,
  onToggleMaskOverlay,
  activeMaskId,
  showClippingWarning: _showClippingWarning,
  onResetAdjustments,
  isFullView = false,
  onToggleFullView,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const editedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [splitOrientation, setSplitOrientation] = useState<SplitOrientation>('vertical');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0-100
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Function to sync both Original and Edited canvases with base image
  const syncAllCanvases = useCallback(() => {
    const baseCanvas = baseCanvasRef.current;
    if (!baseCanvas) return;
    const w = baseCanvas.width;
    const h = baseCanvas.height;
    if (w === 0 || h === 0) return;

    // 1. Synchronize Original Canvas (Sebelum)
    const origCanvas = originalCanvasRef.current;
    if (origCanvas) {
      if (origCanvas.width !== w || origCanvas.height !== h) {
        origCanvas.width = w;
        origCanvas.height = h;
      }
      const origCtx = origCanvas.getContext('2d');
      if (origCtx) {
        origCtx.drawImage(baseCanvas, 0, 0);
      }
    }

    // 2. Synchronize Edited Canvas (Sesudah)
    const editedCanvas = editedCanvasRef.current;
    if (editedCanvas) {
      if (editedCanvas.width !== w || editedCanvas.height !== h) {
        editedCanvas.width = w;
        editedCanvas.height = h;
      }
      const baseCtx = baseCanvas.getContext('2d');
      const editedCtx = editedCanvas.getContext('2d');
      if (baseCtx && editedCtx) {
        const histData = processRawPhoto(
          baseCtx,
          w,
          h,
          adjustments,
          editedCtx,
          activeMaskId,
          showMaskOverlay
        );
        onHistogramUpdate(histData);
      }
    }
  }, [adjustments, activeMaskId, showMaskOverlay, onHistogramUpdate]);

  // Load image onto base canvas
  useEffect(() => {
    setIsLoadingImage(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.url;

    img.onload = () => {
      loadedImageRef.current = img;
      const baseCanvas = baseCanvasRef.current;
      if (!baseCanvas) return;

      // Scale canvas to reasonable max processing dimension for ultra-responsive editing
      const maxDim = 1920;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      baseCanvas.width = w;
      baseCanvas.height = h;

      const baseCtx = baseCanvas.getContext('2d')!;
      baseCtx.drawImage(img, 0, 0, w, h);

      // Synchronize both original and edited canvases
      syncAllCanvases();
      setIsLoadingImage(false);
    };

    img.onerror = () => {
      setIsLoadingImage(false);
    };
  }, [photo.id, photo.url, syncAllCanvases]);

  // Re-render canvases whenever adjustments, masks, or viewMode changes
  useEffect(() => {
    if (!isLoadingImage && loadedImageRef.current) {
      requestAnimationFrame(() => {
        syncAllCanvases();
      });
    }
  }, [syncAllCanvases, isLoadingImage, viewMode]);

  // Listen for \ and Y keys to compare Original (Sebelum) vs Edited (Sesudah)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === '\\' || (e.key.toLowerCase() === 'y' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        setIsComparingOriginal(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === '\\' || (e.key.toLowerCase() === 'y' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        setIsComparingOriginal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Track space bar for pan cursor
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Native non-passive wheel listener for smooth cursor-centered mouse scroll zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Scroll direction: deltaY < 0 is scroll up (Zoom In), deltaY > 0 is scroll down (Zoom Out)
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

      setZoomLevel((prevZoom) => {
        const nextZoom = Math.max(0.3, Math.min(6.0, Number((prevZoom * zoomFactor).toFixed(2))));

        // Snap back to 1.0 (Fit) when zooming out close to baseline
        if (nextZoom <= 1.04 && prevZoom > nextZoom) {
          setPanOffset({ x: 0, y: 0 });
          return 1;
        }

        // Cursor-centered zoom calculation: keeps pixel under cursor stationary
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const ratio = nextZoom / prevZoom;
        setPanOffset((prevPan) => ({
          x: Math.round(mouseX - (mouseX - prevPan.x) * ratio),
          y: Math.round(mouseY - (mouseY - prevPan.y) * ratio),
        }));

        return nextZoom;
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (zoomLevel > 1 || isSpacePressed)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Dedicated pointer handlers for Split Slider with pointer capture
  const handleSplitPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSplit(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSplitPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSplit || !imageWrapperRef.current) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    if (splitOrientation === 'vertical') {
      const relativeX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
      setSplitPos(Number(pct.toFixed(1)));
    } else {
      const relativeY = e.clientY - rect.top;
      const pct = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
      setSplitPos(Number(pct.toFixed(1)));
    }
  };

  const handleSplitPointerUp = (e: React.PointerEvent) => {
    if (isDraggingSplit) {
      setIsDraggingSplit(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  // Zoom helpers via UI buttons
  const handleZoom = (factor: number) => {
    if (factor === 1) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setZoomLevel((prev) => Math.max(0.3, Math.min(6.0, Number((prev * factor).toFixed(2)))));
    }
  };

  // Double click handler on the image: toggles between 400% zoom (centered at cursor) and 100% (Fit)
  const handleImageDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomLevel > 1) {
      // Already zoomed in: reset back to Fit (100%)
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      // Zoom into 400% directly at the clicked cursor location
      const targetZoom = 4.0;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        setPanOffset({
          x: Math.round(-mouseX * (targetZoom - 1)),
          y: Math.round(-mouseY * (targetZoom - 1)),
        });
      }
      setZoomLevel(targetZoom);
    }
  };

  // Double click handler on the container background (outside photo): toggles Full View mode
  const handleContainerDoubleClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current && onToggleFullView) {
      onToggleFullView();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleContainerDoubleClick}
      className={`relative flex-1 bg-[#101216] overflow-hidden flex items-center justify-center select-none ${
        isPanning ? 'cursor-grabbing' : isSpacePressed || zoomLevel > 1 ? 'cursor-grab' : 'cursor-default'
      }`}
      title="Klik ganda pada latar untuk Mode Layar Penuh (Full View) · Gunakan scroll mouse untuk Zoom"
    >
      {/* Loading state */}
      {isLoadingImage && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#101216]/80 backdrop-blur-sm gap-3">
          <div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-300">Memuat & Mengonversi Buffer RAW...</p>
        </div>
      )}

      {/* Hidden Master Base Canvas */}
      <canvas ref={baseCanvasRef} className="hidden" />

      {/* Full View Floating Top Indicator */}
      {isFullView && (
        <div className="absolute top-4 inset-x-0 mx-auto w-fit z-30 flex items-center gap-2.5 bg-[#171a21]/95 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-500/40 shadow-2xl text-xs text-slate-200 animate-in fade-in duration-200 select-none">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="font-semibold text-white">Mode Full View</span>
          <span className="text-slate-500">·</span>
          <span className="text-[11px] text-slate-400">Tekan Esc / F untuk keluar · Klik ganda foto untuk Zoom 400%</span>
          <button
            onClick={onToggleFullView}
            className="ml-1 px-2.5 py-0.5 rounded-full bg-[#252c38] hover:bg-[#313947] text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <Minimize2 className="w-3 h-3 text-purple-400" />
            <span>Keluar</span>
          </button>
        </div>
      )}

      {/* Main Canvas Viewport with Pan and Zoom */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transition: isPanning || isDraggingSplit ? 'none' : 'transform 0.15s ease-out',
        }}
        className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl"
      >
        {/* ========================================================= */}
        {/* MODE 1: SINGLE VIEW (dengan toggle Tahan Original)       */}
        {/* ========================================================= */}
        {viewMode === 'single' && (
          <div
            ref={imageWrapperRef}
            onDoubleClick={handleImageDoubleClick}
            title="Klik ganda untuk Zoom 400% ke area ini (atau kembali ke 100%)"
            className="relative inline-block cursor-pointer select-none"
          >
            {/* Edited Canvas */}
            <canvas
              ref={editedCanvasRef}
              className={`${
                isFullView ? 'max-w-[98vw] max-h-[94vh]' : 'max-w-[85vw] max-h-[78vh]'
              } object-contain block shadow-2xl transition-opacity duration-150 ${
                isComparingOriginal ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Original Canvas (Tampil saat isComparingOriginal aktif) */}
            <canvas
              ref={originalCanvasRef}
              className={`absolute inset-0 w-full h-full object-contain block shadow-2xl transition-opacity duration-150 pointer-events-none select-none ${
                isComparingOriginal ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Label Sebelum saat sedang membandingkan */}
            {isComparingOriginal && (
              <span className="absolute top-3 left-3 bg-black/90 backdrop-blur-md text-[11px] uppercase font-bold text-amber-400 px-3 py-1.5 rounded-lg shadow-2xl border border-amber-500/40 pointer-events-none flex items-center gap-1.5 animate-in fade-in">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Sebelum (Original)
              </span>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: SPLIT BEFORE / AFTER SLIDER                      */}
        {/* ========================================================= */}
        {viewMode === 'split' && (
          <div
            ref={imageWrapperRef}
            onDoubleClick={handleImageDoubleClick}
            title="Klik ganda foto untuk Zoom 400% · Geser pembagi untuk melihat Sebelum & Sesudah"
            className={`relative inline-block select-none cursor-pointer ${
              isFullView ? 'max-w-[98vw] max-h-[94vh]' : 'max-w-[85vw] max-h-[78vh]'
            }`}
          >
            {/* Bottom Layer: Edited Canvas (Sesudah) */}
            <canvas
              ref={editedCanvasRef}
              className={`${isFullView ? 'max-w-[98vw] max-h-[94vh]' : 'max-w-[85vw] max-h-[78vh]'} object-contain block shadow-2xl`}
            />

            {/* Top Layer: Original Canvas (Sebelum) di-clip dengan presisi pixel 1-to-1 */}
            <canvas
              ref={originalCanvasRef}
              style={{
                clipPath: isComparingOriginal
                  ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                  : splitOrientation === 'vertical'
                  ? `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`
                  : `polygon(0 0, 100% 0, 100% ${splitPos}%, 0 ${splitPos}%)`,
              }}
              className="absolute inset-0 w-full h-full object-contain block pointer-events-none select-none shadow-2xl"
            />

            {/* Draggable Divider Bar & Puck */}
            {!isComparingOriginal && (
              splitOrientation === 'vertical' ? (
                <div
                  style={{ left: `${splitPos}%` }}
                  onPointerDown={handleSplitPointerDown}
                  onPointerMove={handleSplitPointerMove}
                  onPointerUp={handleSplitPointerUp}
                  className="absolute inset-y-0 -ml-5 w-10 flex items-center justify-center cursor-ew-resize z-20 touch-none select-none group"
                  title="Geser pembagi Sebelum & Sesudah · Klik ganda untuk reset 50%"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSplitPos(50);
                  }}
                >
                  {/* Vertical Dividing Line */}
                  <div className="absolute inset-y-0 left-1/2 -ml-[1px] w-[2px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.95)] group-hover:bg-amber-400 group-hover:w-[3px] transition-all" />

                  {/* Circular Puck Handle */}
                  <div className="relative z-10 w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl text-[11px] font-bold group-hover:scale-110 group-active:scale-95 transition-transform border border-slate-300">
                    ↔
                  </div>

                  {/* Readout Pill while dragging */}
                  {isDraggingSplit && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap border border-amber-500/40">
                      {Math.round(splitPos)}% : {100 - Math.round(splitPos)}%
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{ top: `${splitPos}%` }}
                  onPointerDown={handleSplitPointerDown}
                  onPointerMove={handleSplitPointerMove}
                  onPointerUp={handleSplitPointerUp}
                  className="absolute inset-x-0 -mt-5 h-10 flex items-center justify-center cursor-ns-resize z-20 touch-none select-none group"
                  title="Geser pembagi Sebelum & Sesudah · Klik ganda untuk reset 50%"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSplitPos(50);
                  }}
                >
                  {/* Horizontal Dividing Line */}
                  <div className="absolute inset-x-0 top-1/2 -mt-[1px] h-[2px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.95)] group-hover:bg-amber-400 group-hover:h-[3px] transition-all" />

                  {/* Circular Puck Handle */}
                  <div className="relative z-10 w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl text-[11px] font-bold group-hover:scale-110 group-active:scale-95 transition-transform border border-slate-300">
                    ↕
                  </div>

                  {/* Readout Pill while dragging */}
                  {isDraggingSplit && (
                    <div className="absolute -left-14 top-1/2 -translate-y-1/2 bg-black/90 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap border border-amber-500/40">
                      {Math.round(splitPos)}%
                    </div>
                  )}
                </div>
              )
            )}

            {/* Badges Label */}
            {splitOrientation === 'vertical' ? (
              <>
                <span className="absolute top-3 left-3 bg-black/85 backdrop-blur-md text-[10px] uppercase font-bold text-white px-2.5 py-1 rounded shadow border border-white/20 pointer-events-none">
                  Sebelum (Original)
                </span>
                <span className="absolute top-3 right-3 bg-black/85 backdrop-blur-md text-[10px] uppercase font-bold text-amber-400 px-2.5 py-1 rounded shadow border border-amber-400/40 pointer-events-none">
                  Sesudah (Diedit)
                </span>
              </>
            ) : (
              <>
                <span className="absolute top-3 left-3 bg-black/85 backdrop-blur-md text-[10px] uppercase font-bold text-white px-2.5 py-1 rounded shadow border border-white/20 pointer-events-none">
                  Sebelum (Original - Atas)
                </span>
                <span className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-[10px] uppercase font-bold text-amber-400 px-2.5 py-1 rounded shadow border border-amber-400/40 pointer-events-none">
                  Sesudah (Diedit - Bawah)
                </span>
              </>
            )}

            {/* Comparing Original Overlay Indicator */}
            {isComparingOriginal && (
              <span className="absolute top-3 inset-x-0 mx-auto w-fit bg-amber-500 text-slate-900 font-bold text-[11px] px-3.5 py-1 rounded-full shadow-2xl border border-amber-300/40 pointer-events-none flex items-center gap-1.5 animate-in fade-in">
                <Eye className="w-3.5 h-3.5" />
                Menampilkan 100% Foto Original (Sebelum)
              </span>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: SIDE BY SIDE (Berdampingan Presisi Tinggi)        */}
        {/* ========================================================= */}
        {viewMode === 'side-by-side' && (
          <div
            ref={imageWrapperRef}
            onDoubleClick={handleImageDoubleClick}
            title="Klik ganda foto untuk Zoom 400% (Kedua foto tersinkronisasi)"
            className={`flex items-center justify-center gap-4 cursor-pointer select-none ${
              isFullView ? 'max-w-[98vw] max-h-[94vh]' : 'max-w-[92vw] max-h-[78vh]'
            }`}
          >
            {/* Left Card: Sebelum (Original Canvas) */}
            <div className="relative border border-[#2b313d] rounded-xl overflow-hidden bg-black/60 shadow-2xl flex flex-col items-center">
              <span className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-white px-2.5 py-1 rounded-md z-10 border border-white/20 pointer-events-none shadow">
                Sebelum (Original)
              </span>
              <canvas
                ref={originalCanvasRef}
                className={`${isFullView ? 'max-h-[82vh]' : 'max-h-[68vh]'} w-auto max-w-full object-contain block`}
              />
            </div>

            {/* Right Card: Sesudah (Edited Canvas) */}
            <div className="relative border border-amber-500/40 rounded-xl overflow-hidden bg-black/60 shadow-2xl flex flex-col items-center">
              <span className="absolute top-2.5 left-2.5 bg-amber-500/95 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-slate-900 px-2.5 py-1 rounded-md z-10 shadow pointer-events-none">
                Sesudah (Diedit)
              </span>
              <canvas
                ref={editedCanvasRef}
                className={`${isFullView ? 'max-h-[82vh]' : 'max-h-[68vh]'} w-auto max-w-full object-contain block`}
              />
            </div>

            {/* Comparing Original Overlay Indicator */}
            {isComparingOriginal && (
              <div className="absolute top-3 inset-x-0 mx-auto w-fit z-30 bg-amber-500 text-slate-900 font-bold text-[11px] px-3.5 py-1 rounded-full shadow-2xl border border-amber-300/40 pointer-events-none flex items-center gap-1.5 animate-in fade-in">
                <Eye className="w-3.5 h-3.5" />
                Mode Perbandingan: Menahan Foto Original
              </div>
            )}
          </div>
        )}

        {/* Rule of Thirds Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div />
          </div>
        )}
      </div>

      {/* Floating Bottom Toolbar for Canvas Controls */}
      <div className="absolute bottom-4 inset-x-0 mx-auto w-fit z-20 flex items-center gap-1.5 bg-[#171a21]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#2b313d] shadow-2xl select-none">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#101216] p-0.5 rounded-lg border border-[#232832]">
          <button
            onClick={() => setViewMode('single')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === 'single' ? 'bg-[#2b313d] text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Tunggal"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === 'split' ? 'bg-[#2b313d] text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Bandingkan Pembagi (Split Slider Sebelum & Sesudah)"
          >
            {splitOrientation === 'vertical' ? (
              <SplitSquareVertical className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <SplitSquareHorizontal className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === 'side-by-side' ? 'bg-[#2b313d] text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Berdampingan (Side-by-Side: Kiri Sebelum, Kanan Sesudah)"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Split Orientation Toggle (Hanya muncul saat mode Split aktif) */}
        {viewMode === 'split' && (
          <button
            onClick={() => setSplitOrientation((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'))}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-[#1a1e27] hover:bg-[#252c38] text-amber-300 border border-[#2b313d] transition-colors"
            title={splitOrientation === 'vertical' ? 'Ganti ke Pembagi Horizontal (Atas/Bawah)' : 'Ganti ke Pembagi Vertikal (Kiri/Kanan)'}
          >
            {splitOrientation === 'vertical' ? (
              <>
                <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[10px]">Vertikal</span>
              </>
            ) : (
              <>
                <ArrowUpDown className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[10px]">Horizontal</span>
              </>
            )}
          </button>
        )}

        {/* Hold to view original */}
        <button
          onMouseDown={() => setIsComparingOriginal(true)}
          onMouseUp={() => setIsComparingOriginal(false)}
          onMouseLeave={() => setIsComparingOriginal(false)}
          onTouchStart={() => setIsComparingOriginal(true)}
          onTouchEnd={() => setIsComparingOriginal(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            isComparingOriginal
              ? 'bg-amber-500 text-slate-900 shadow-lg scale-105'
              : 'hover:bg-[#232832] text-slate-300'
          }`}
          title="Tahan untuk melihat foto original Sebelum diedit [Tekan tombol \ atau Y]"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[11px]">Original</span>
        </button>

        <div className="h-4 w-[1px] bg-[#2b313d] mx-0.5" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 rounded-md hover:bg-[#232832] text-slate-400 hover:text-white"
            title="Perkecil Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (zoomLevel > 1) {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              } else {
                setZoomLevel(4);
                setPanOffset({ x: 0, y: 0 });
              }
            }}
            className="px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:text-white rounded hover:bg-[#232832] font-semibold"
            title="Klik ganda foto atau klik di sini untuk beralih antara 100% dan 400%"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 rounded-md hover:bg-[#232832] text-slate-400 hover:text-white"
            title="Perbesar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#2b313d] mx-0.5" />

        {/* Grid Overlay Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-md transition-colors ${
            showGrid ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
          }`}
          title="Grid Komposisi (Rule of Thirds)"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* AI Mask Overlay Toggle */}
        <button
          onClick={onToggleMaskOverlay}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
            showMaskOverlay ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
          }`}
          title="Tampilkan Masking Overlay Merah Ruby"
        >
          <Layers className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">Mask Overlay</span>
        </button>

        {/* Full View Toggle Button */}
        {onToggleFullView && (
          <button
            onClick={onToggleFullView}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              isFullView
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#232832]'
            }`}
            title={isFullView ? 'Keluar Full View (Tekan Esc atau F)' : 'Mode Full View / Layar Penuh (Tekan F)'}
          >
            {isFullView ? <Minimize2 className="w-3.5 h-3.5 text-purple-200" /> : <Expand className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isFullView ? 'Keluar' : 'Full View'}</span>
          </button>
        )}

        {/* Reset Adjustments */}
        <button
          onClick={onResetAdjustments}
          className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors ml-1"
          title="Reset Semua Pengaturan ke Standar RAW"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
