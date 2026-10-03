import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Sliders, Columns, Eye, ZoomIn, X, Sparkles, Check } from 'lucide-react';
import { generateComparisonDownloadCard } from '../utils/imageUtils';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  isModifiedSinceLastRender?: boolean;
  onRegenerateClick?: () => void;
  homeTitle?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  beforeImage,
  afterImage,
  isModifiedSinceLastRender,
  onRegenerateClick,
  homeTitle = "See It Finished",
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'after' | 'before'>('slider');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedPercentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(clampedPercentage);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleDownloadSingle = () => {
    const link = document.createElement('a');
    link.href = afterImage;
    link.download = `see-it-finished-after-${Date.now()}.jpg`;
    link.click();
  };

  const handleDownloadComparison = async () => {
    try {
      setIsDownloading(true);
      const cardDataUrl = await generateComparisonDownloadCard(beforeImage, afterImage, homeTitle);
      const link = document.createElement('a');
      link.href = cardDataUrl;
      link.download = `see-it-finished-comparison-${Date.now()}.jpg`;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download card generation error:', err);
      // Fallback
      handleDownloadSingle();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Modification warning flag */}
      {isModifiedSinceLastRender && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs sm:text-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium">
              Selections modified since last render. Click Regenerate to preview updates.
            </span>
          </div>
          {onRegenerateClick && (
            <button
              onClick={onRegenerateClick}
              className="px-2.5 py-1 rounded bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors text-xs whitespace-nowrap ml-2"
            >
              Regenerate
            </button>
          )}
        </div>
      )}

      {/* Control bar: View mode & action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'slider' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Slider</span>
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'side-by-side' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => setViewMode('after')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'after' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Makeover</span>
          </button>
          <button
            onClick={() => setViewMode('before')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'before' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Original</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors"
            title="Expand Fullscreen"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          <button
            onClick={handleDownloadComparison}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            title="Download comparison card with before & after photos"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Generating Card...' : 'Download Card'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md aspect-[4/3] w-full select-none">
        {viewMode === 'slider' && (
          <div
            ref={containerRef}
            className="relative w-full h-full cursor-ew-resize overflow-hidden"
            onMouseDown={(e) => {
              setIsDragging(true);
              handleMove(e.clientX);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleMove(e.touches[0].clientX);
            }}
          >
            {/* After Image (Background layer) */}
            <img
              src={afterImage}
              alt="Makeover After"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Before Image (Clipped layer) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={beforeImage}
                alt="Original Before"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: containerRef.current?.clientWidth || '100%', maxWidth: 'none' }}
              />
            </div>

            {/* Slider Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Handle Knob */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-teal-400 transition-transform hover:scale-105 active:scale-95">
                <span className="text-xs font-bold font-mono tracking-tighter select-none">↔</span>
              </div>
            </div>

            {/* Badges on preview */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold tracking-wide border border-white/20">
                ORIGINAL
              </span>
            </div>
            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded bg-teal-600/90 backdrop-blur-sm text-white text-xs font-semibold tracking-wide border border-teal-400/30">
                AI MAKEOVER
              </span>
            </div>
          </div>
        )}

        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-2 w-full h-full divide-x divide-slate-800">
            <div className="relative w-full h-full">
              <img
                src={beforeImage}
                alt="Original Before"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold tracking-wide border border-white/20">
                  ORIGINAL
                </span>
              </div>
            </div>
            <div className="relative w-full h-full">
              <img
                src={afterImage}
                alt="Makeover After"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded bg-teal-600/90 backdrop-blur-sm text-white text-xs font-semibold tracking-wide border border-teal-400/30">
                  AI MAKEOVER
                </span>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'after' && (
          <div className="relative w-full h-full">
            <img
              src={afterImage}
              alt="Makeover After"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded bg-teal-600/90 backdrop-blur-sm text-white text-xs font-semibold tracking-wide border border-teal-400/30">
                AI MAKEOVER
              </span>
            </div>
          </div>
        )}

        {viewMode === 'before' && (
          <div className="relative w-full h-full">
            <img
              src={beforeImage}
              alt="Original Before"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold tracking-wide border border-white/20">
                ORIGINAL
              </span>
            </div>
          </div>
        )}

        {/* Bottom Disclaimer Pill */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[11px] font-medium border border-slate-700/60 shadow">
            AI design preview · Details may vary
          </span>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fadeIn">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Expanded Makeover View</h3>
              <p className="text-xs text-slate-400">Drag or toggle modes to inspect materials in detail</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadSingle}
                className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-500 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Image</span>
              </button>
              <button
                onClick={() => setIsZoomed(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
            <img
              src={viewMode === 'before' ? beforeImage : afterImage}
              alt="Expanded preview"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
