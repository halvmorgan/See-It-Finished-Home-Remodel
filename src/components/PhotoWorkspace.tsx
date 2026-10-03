import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, RefreshCw, AlertTriangle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';
import { validateImageFile, readFileAsDataURL, resizeImageForGeneration } from '../utils/imageUtils';
import { SAMPLE_HOMES } from '../data/presets';
import { SampleHomePreset, MakeoverSelections } from '../types/makeover';

interface PhotoWorkspaceProps {
  originalImage: string | null;
  generatedImage: string | null;
  isLoading: boolean;
  loadingStep: string;
  errorMessage: string | null;
  isModifiedSinceLastRender: boolean;
  selectedPresetId: string | null;
  onImageUploaded: (dataUrl: string, resizedDataUrl: string, mimeType: string) => void;
  onSelectPreset: (preset: SampleHomePreset) => void;
  onClearImage: () => void;
  onRegenerate: () => void;
  onOpenPricing: () => void;
  credits: number;
}

export const PhotoWorkspace: React.FC<PhotoWorkspaceProps> = ({
  originalImage,
  generatedImage,
  isLoading,
  loadingStep,
  errorMessage,
  isModifiedSinceLastRender,
  selectedPresetId,
  onImageUploaded,
  onSelectPreset,
  onClearImage,
  onRegenerate,
  onOpenPricing,
  credits,
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error || 'Invalid file format or size.');
      return;
    }

    try {
      const rawDataUrl = await readFileAsDataURL(file);
      const resized = await resizeImageForGeneration(rawDataUrl, {
        maxWidth: 1536,
        maxHeight: 1536,
        quality: 0.9,
      });
      onImageUploaded(rawDataUrl, resized.dataUrl, resized.mimeType);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Could not process this image. Please try another photo.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Editorial Headline */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600">
          <span>Exterior Design Studio</span>
          <span>·</span>
          <span>Curb Appeal Visualization</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          See what’s possible.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          Upload any home photo or choose a preset. Choose custom exterior paint, siding accents, roofing, driveway, landscaping, and doors — then reveal a photorealistic before-and-after transformation.
        </p>
      </div>

      {/* Preset Demo Switcher */}
      <div className="flex flex-col gap-2 p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Quick Test with Demo Homes:</span>
          <span className="text-slate-500">Instant before & after preview</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_HOMES.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`flex items-center gap-3 p-2 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <img
                  src={preset.beforeImage}
                  alt={preset.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-md object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">{preset.name}</p>
                    {isSelected && <span className="text-[10px] font-bold text-teal-600">Active</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{preset.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Generation Notice</p>
            <p className="text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Visual Display */}
      {generatedImage && originalImage ? (
        <div className="flex flex-col gap-3">
          <ComparisonSlider
            beforeImage={originalImage}
            afterImage={generatedImage}
            isModifiedSinceLastRender={isModifiedSinceLastRender}
            onRegenerateClick={onRegenerate}
          />
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-teal-700 hover:text-teal-900 font-medium underline underline-offset-4"
            >
              Replace Photo
            </button>
            <button
              onClick={onClearImage}
              className="text-slate-400 hover:text-slate-600"
            >
              Clear Workspace
            </button>
          </div>
        </div>
      ) : originalImage ? (
        /* Original Photo Uploaded - Awaiting Generation */
        <div className="flex flex-col gap-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md aspect-[4/3] w-full">
            <img
              src={originalImage}
              alt="Uploaded Home"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            {/* Overlay Status */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold tracking-wide border border-white/20">
                ORIGINAL PHOTO LOADED
              </span>
            </div>

            {/* Replace Button Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-sm border border-white/10 transition-colors shadow-sm"
              >
                Change Photo
              </button>
              <button
                onClick={onClearImage}
                className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-sm transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Generating Loading State Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin mb-4" />
                <h3 className="text-lg font-bold">Rendering Makeover</h3>
                <p className="text-xs text-teal-300 mt-1 font-mono tracking-tight">{loadingStep}</p>
                <div className="w-48 bg-slate-800 rounded-full h-1.5 mt-4 overflow-hidden">
                  <div className="bg-teal-400 h-1.5 rounded-full animate-pulse w-3/4" />
                </div>
                <p className="text-[11px] text-slate-400 mt-3 max-w-xs">
                  Preserving structural geometry, roof pitch, window openings, and authentic lighting.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative rounded-2xl border-2 border-dashed transition-all p-8 sm:p-12 text-center cursor-pointer flex flex-col items-center justify-center gap-4 ${
            isDraggingOver
              ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
              : 'border-slate-300 bg-white hover:border-teal-500/80 hover:bg-slate-50/50 shadow-xs'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-bold text-slate-800">
              Drag & drop your house photo here
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              or click to browse from your device
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>Supports JPG, PNG, WebP</span>
            <span>·</span>
            <span>Up to 20 MB</span>
            <span>·</span>
            <span>Auto-scaled for HD AI</span>
          </div>

          <button
            type="button"
            className="mt-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
          >
            Select Photo
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Quality & Preservation Guarantee Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
        <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <p className="font-semibold text-slate-900">Structural Preservation</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Retains exact roof pitch, wall framing, and window openings.</p>
        </div>
        <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <p className="font-semibold text-slate-900">Authentic Surroundings</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Preserves trees, neighbors, driveway geometry, and natural light.</p>
        </div>
        <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <p className="font-semibold text-slate-900">Client-Ready Export</p>
          <p className="text-slate-500 text-[11px] mt-0.5">High-resolution side-by-side comparison cards for realtors & homeowners.</p>
        </div>
      </div>
    </div>
  );
};
