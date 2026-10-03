import React, { useState } from 'react';
import {
  Paintbrush,
  Layers,
  Home,
  Compass,
  Trees,
  DoorClosed,
  Car,
  Grid3X3,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
} from 'lucide-react';
import { MakeoverSelections, Mode } from '../types/makeover';
import { POPULAR_EXTERIOR_COLORS } from '../data/presets';
import { countSelectedUpgrades } from '../utils/promptBuilder';

interface CustomizationPanelProps {
  selections: MakeoverSelections;
  onChange: (updated: MakeoverSelections) => void;
  onReset: () => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasImage: boolean;
  aiReady: boolean;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  selections,
  onChange,
  onReset,
  onGenerate,
  isLoading,
  hasImage,
  aiReady,
}) => {
  // Track open state for accordion sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    paint: true,
    siding: false,
    roof: false,
    driveway: false,
    landscaping: false,
    garageDoor: false,
    frontDoor: false,
    windows: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedCount = countSelectedUpgrades(selections);

  const handleModeChange = (category: keyof MakeoverSelections, mode: Mode) => {
    onChange({
      ...selections,
      [category]: {
        ...(selections[category] as object),
        mode,
      },
    });
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Exterior Customization
            </h2>
            <p className="text-xs text-slate-500">Select finishes to remodel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selected upgrades count */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            {selectedCount} {selectedCount === 1 ? 'upgrade' : 'upgrades'} selected
          </span>

          {/* Reset button */}
          <button
            onClick={onReset}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Reset all to keep existing"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="divide-y divide-slate-100 max-h-[calc(100vh-280px)] overflow-y-auto">
        {/* 1. Exterior Paint */}
        <section className="p-4 transition-colors">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('paint')}>
            <div className="flex items-center gap-2.5">
              <Paintbrush className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">Exterior Paint</span>
              {selections.exteriorPaint.mode === 'customize' && selections.exteriorPaint.color !== 'keep' && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selections.exteriorPaint.mode === 'keep' ? 'Keep existing' : selections.exteriorPaint.mode === 'customize' ? 'Customized' : 'N/A'}
              </span>
              {openSections.paint ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {/* Three-State Mode Control */}
          <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['keep', 'customize', 'na'] as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  handleModeChange('exteriorPaint', mode);
                  if (mode === 'customize') setOpenSections((p) => ({ ...p, paint: true }));
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  selections.exteriorPaint.mode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'keep' ? 'Keep existing' : mode === 'customize' ? 'Customize' : 'Not visible / N/A'}
              </button>
            ))}
          </div>

          {/* Controls revealed only when Customize is active */}
          {openSections.paint && selections.exteriorPaint.mode === 'customize' && (
            <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Curated Exterior Color Palette:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...selections,
                        exteriorPaint: { ...selections.exteriorPaint, color: 'keep' },
                      })
                    }
                    className={`h-9 rounded-md border text-[10px] font-medium flex items-center justify-center transition-all ${
                      selections.exteriorPaint.color === 'keep'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Keep
                  </button>

                  {POPULAR_EXTERIOR_COLORS.map((c) => {
                    const isSelected = selections.exteriorPaint.color === c.hex;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...selections,
                            exteriorPaint: { ...selections.exteriorPaint, color: c.hex, customHex: c.hex },
                          })
                        }
                        title={`${c.name} (${c.desc})`}
                        style={{ backgroundColor: c.hex }}
                        className={`h-9 rounded-md border flex items-center justify-center relative transition-transform hover:scale-105 ${
                          isSelected ? 'ring-2 ring-offset-2 ring-teal-600 border-white' : 'border-black/10'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hex Picker */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-600">Custom Hex:</label>
                <input
                  type="color"
                  value={selections.exteriorPaint.customHex || '#1E293B'}
                  onChange={(e) =>
                    onChange({
                      ...selections,
                      exteriorPaint: {
                        ...selections.exteriorPaint,
                        color: e.target.value,
                        customHex: e.target.value,
                      },
                    })
                  }
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={selections.exteriorPaint.customHex || '#1E293B'}
                  onChange={(e) =>
                    onChange({
                      ...selections,
                      exteriorPaint: {
                        ...selections.exteriorPaint,
                        color: e.target.value,
                        customHex: e.target.value,
                      },
                    })
                  }
                  className="w-24 text-xs font-mono px-2 py-1 rounded border border-slate-200"
                />
              </div>

              {/* Finish Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Finish Sheen:</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['keep', 'matte', 'satin', 'semi-gloss'] as const).map((finish) => (
                    <button
                      key={finish}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...selections,
                          exteriorPaint: { ...selections.exteriorPaint, finish },
                        })
                      }
                      className={`py-1 px-2 rounded border text-center capitalize transition-colors ${
                        selections.exteriorPaint.finish === finish
                          ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {finish === 'keep' ? 'Keep existing' : finish}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. Siding & Accents */}
        <section className="p-4 transition-colors">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('siding')}>
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">Siding & Accents</span>
              {selections.sidingAccents.mode === 'customize' && selections.sidingAccents.material !== 'keep' && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selections.sidingAccents.mode === 'keep' ? 'Keep existing' : selections.sidingAccents.mode === 'customize' ? 'Customized' : 'N/A'}
              </span>
              {openSections.siding ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['keep', 'customize', 'na'] as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  handleModeChange('sidingAccents', mode);
                  if (mode === 'customize') setOpenSections((p) => ({ ...p, siding: true }));
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  selections.sidingAccents.mode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'keep' ? 'Keep existing' : mode === 'customize' ? 'Customize' : 'Not visible / N/A'}
              </button>
            ))}
          </div>

          {openSections.siding && selections.sidingAccents.mode === 'customize' && (
            <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Material & Cladding:</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'keep', label: 'Keep existing' },
                    { id: 'wood', label: 'Wood Slats / Cedar' },
                    { id: 'stone', label: 'Stone Accents' },
                    { id: 'brick', label: 'Brick Accents' },
                    { id: 'stucco', label: 'Smooth Stucco' },
                  ].map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...selections,
                          sidingAccents: { ...selections.sidingAccents, material: mat.id as any },
                        })
                      }
                      className={`p-2 rounded border text-center transition-colors ${
                        selections.sidingAccents.material === mat.id
                          ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {mat.label}
                    </button>
                  ))}
                </div>
              </div>

              {selections.sidingAccents.material !== 'keep' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Accent Placement:</label>
                  <select
                    value={selections.sidingAccents.accentPlacement}
                    onChange={(e) =>
                      onChange({
                        ...selections,
                        sidingAccents: {
                          ...selections.sidingAccents,
                          accentPlacement: e.target.value as any,
                        },
                      })
                    }
                    className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                  >
                    <option value="entryway_accent">Entryway Alcove Accent</option>
                    <option value="lower_half_wainscot">Lower Foundation Wainscot</option>
                    <option value="columns_only">Porch Columns Only</option>
                    <option value="full_facade">Full Exterior Facade</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 3. Roof & Solar */}
        <section className="p-4 transition-colors">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('roof')}>
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">Roof & Solar</span>
              {selections.roofSolar.mode === 'customize' && (selections.roofSolar.material !== 'keep' || selections.roofSolar.solarPanels) && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selections.roofSolar.mode === 'keep' ? 'Keep existing' : selections.roofSolar.mode === 'customize' ? 'Customized' : 'N/A'}
              </span>
              {openSections.roof ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['keep', 'customize', 'na'] as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  handleModeChange('roofSolar', mode);
                  if (mode === 'customize') setOpenSections((p) => ({ ...p, roof: true }));
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  selections.roofSolar.mode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'keep' ? 'Keep existing' : mode === 'customize' ? 'Customize' : 'Not visible / N/A'}
              </button>
            ))}
          </div>

          {openSections.roof && selections.roofSolar.mode === 'customize' && (
            <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Roof Material:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'keep', label: 'Keep existing' },
                    { id: 'asphalt_shingles', label: 'Asphalt Shingles' },
                    { id: 'metal', label: 'Standing Seam Metal' },
                    { id: 'clay_tile', label: 'Clay Terracotta Tile' },
                    { id: 'concrete_tile', label: 'Concrete Tile' },
                    { id: 'slate', label: 'Natural Slate' },
                  ].map((roof) => (
                    <button
                      key={roof.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...selections,
                          roofSolar: { ...selections.roofSolar, material: roof.id as any },
                        })
                      }
                      className={`p-2 rounded border text-center transition-colors ${
                        selections.roofSolar.material === roof.id
                          ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {roof.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roof Color */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Roof Color:</label>
                <select
                  value={selections.roofSolar.color}
                  onChange={(e) =>
                    onChange({
                      ...selections,
                      roofSolar: { ...selections.roofSolar, color: e.target.value },
                    })
                  }
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                >
                  <option value="keep">Keep existing color</option>
                  <option value="charcoal">Architectural Charcoal</option>
                  <option value="matte_black">Matte Black</option>
                  <option value="terracotta">Warm Terracotta</option>
                  <option value="slate_gray">Slate Gray</option>
                  <option value="warm_bronze">Standing Seam Bronze</option>
                </select>
              </div>

              {/* Solar Panels Checkbox */}
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-teal-50/50 border border-teal-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selections.roofSolar.solarPanels}
                  onChange={(e) =>
                    onChange({
                      ...selections,
                      roofSolar: { ...selections.roofSolar, solarPanels: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900">Add Sleek Solar Panels</span>
                  <p className="text-slate-500 text-[11px]">Integrates clean, all-black rooftop solar arrays</p>
                </div>
              </label>
            </div>
          )}
        </section>

        {/* 4. Driveway */}
        <section className="p-4 transition-colors">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('driveway')}>
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">Driveway</span>
              {selections.driveway.mode === 'customize' && selections.driveway.material !== 'keep' && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selections.driveway.mode === 'keep' ? 'Keep existing' : selections.driveway.mode === 'customize' ? 'Customized' : 'N/A'}
              </span>
              {openSections.driveway ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['keep', 'customize', 'na'] as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  handleModeChange('driveway', mode);
                  if (mode === 'customize') setOpenSections((p) => ({ ...p, driveway: true }));
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  selections.driveway.mode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'keep' ? 'Keep existing' : mode === 'customize' ? 'Customize' : 'Not visible / N/A'}
              </button>
            ))}
          </div>

          {openSections.driveway && selections.driveway.mode === 'customize' && (
            <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
              <label className="block text-xs font-medium text-slate-700 mb-1">Driveway Material:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'keep', label: 'Keep existing' },
                  { id: 'concrete', label: 'Brushed Concrete' },
                  { id: 'pavers', label: 'Stone Pavers' },
                  { id: 'asphalt', label: 'Smooth Dark Asphalt' },
                  { id: 'stamped_concrete', label: 'Stamped Concrete' },
                  { id: 'exposed_aggregate', label: 'Exposed Aggregate' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...selections,
                        driveway: { ...selections.driveway, material: item.id as any },
                      })
                    }
                    className={`p-2 rounded border text-center transition-colors ${
                      selections.driveway.material === item.id
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 5. Landscaping */}
        <section className="p-4 transition-colors">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('landscaping')}>
            <div className="flex items-center gap-2.5">
              <Trees className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">Landscaping</span>
              {selections.landscaping.mode === 'customize' && (selections.landscaping.type !== 'keep' || selections.landscaping.addLighting) && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selections.landscaping.mode === 'keep' ? 'Keep existing' : selections.landscaping.mode === 'customize' ? 'Customized' : 'N/A'}
              </span>
              {openSections.landscaping ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['keep', 'customize', 'na'] as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  handleModeChange('landscaping', mode);
                  if (mode === 'customize') setOpenSections((p) => ({ ...p, landscaping: true }));
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  selections.landscaping.mode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'keep' ? 'Keep existing' : mode === 'customize' ? 'Customize' : 'Not visible / N/A'}
              </button>
            ))}
          </div>

          {openSections.landscaping && selections.landscaping.mode === 'customize' && (
            <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
              <label className="block text-xs font-medium text-slate-700 mb-1">Lawn & Garden Style:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'keep', label: 'Keep existing' },
                  { id: 'grass', label: 'Lush Green Grass' },
                  { id: 'artificial_turf', label: 'Artificial Turf' },
                  { id: 'gravel', label: 'Modern Gravel / Rock' },
                  { id: 'drought_friendly', label: 'Drought-Friendly Plants' },
                ].map((land) => (
                  <button
                    key={land.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...selections,
                        landscaping: { ...selections.landscaping, type: land.id as any },
                      })
                    }
                    className={`p-2 rounded border text-center transition-colors ${
                      selections.landscaping.type === land.id
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {land.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selections.landscaping.addPlanterBeds}
                    onChange={(e) =>
                      onChange({
                        ...selections,
                        landscaping: { ...selections.landscaping, addPlanterBeds: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span>Add geometric foundation mulch beds</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selections.landscaping.addLighting}
                    onChange={(e) =>
                      onChange({
                        ...selections,
                        landscaping: { ...selections.landscaping, addLighting: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span>Add warm architectural pathway & tree uplighting</span>
                </label>
              </div>
            </div>
          )}
        </section>

        {/* 6. Garage Door */}
        <section className="p-4 transition-colors">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('garageDoor')}>
            <div className="flex items-center gap-2.5">
              <Car className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">Garage Door</span>
              {selections.garageDoor.mode === 'customize' && selections.garageDoor.style !== 'keep' && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selections.garageDoor.mode === 'keep' ? 'Keep existing' : selections.garageDoor.mode === 'customize' ? 'Customized' : 'N/A'}
              </span>
              {openSections.garageDoor ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['keep', 'customize', 'na'] as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  handleModeChange('garageDoor', mode);
                  if (mode === 'customize') setOpenSections((p) => ({ ...p, garageDoor: true }));
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  selections.garageDoor.mode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'keep' ? 'Keep existing' : mode === 'customize' ? 'Customize' : 'Not visible / N/A'}
              </button>
            ))}
          </div>

          {openSections.garageDoor && selections.garageDoor.mode === 'customize' && (
            <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
              <label className="block text-xs font-medium text-slate-700 mb-1">Door Architectural Style:</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'keep', label: 'Keep existing' },
                  { id: 'modern_flat_panel', label: 'Modern Flat Panel' },
                  { id: 'carriage_house', label: 'Carriage House' },
                  { id: 'traditional_raised_panel', label: 'Traditional Raised Panel' },
                  { id: 'modern_glass_panel', label: 'Modern Glass Panel' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...selections,
                        garageDoor: { ...selections.garageDoor, style: style.id as any },
                      })
                    }
                    className={`p-2 rounded border text-center transition-colors ${
                      selections.garageDoor.style === style.id
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Door Color / Finish:</label>
                <select
                  value={selections.garageDoor.color}
                  onChange={(e) =>
                    onChange({
                      ...selections,
                      garageDoor: { ...selections.garageDoor, color: e.target.value },
                    })
                  }
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                >
                  <option value="keep">Keep existing color</option>
                  <option value="Deep Navy">Deep Navy</option>
                  <option value="Charcoal Matte">Charcoal Matte</option>
                  <option value="Crisp White">Crisp White</option>
                  <option value="Natural Cedar Woodgrain">Natural Cedar Woodgrain</option>
                  <option value="Black Anodized">Black Anodized</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* 7. Front Door */}
        <section className="p-4 transition-colors">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('frontDoor')}>
            <div className="flex items-center gap-2.5">
              <DoorClosed className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">Front Door</span>
              {selections.frontDoor.mode === 'customize' && selections.frontDoor.style !== 'keep' && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selections.frontDoor.mode === 'keep' ? 'Keep existing' : selections.frontDoor.mode === 'customize' ? 'Customized' : 'N/A'}
              </span>
              {openSections.frontDoor ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['keep', 'customize', 'na'] as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  handleModeChange('frontDoor', mode);
                  if (mode === 'customize') setOpenSections((p) => ({ ...p, frontDoor: true }));
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  selections.frontDoor.mode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'keep' ? 'Keep existing' : mode === 'customize' ? 'Customize' : 'Not visible / N/A'}
              </button>
            ))}
          </div>

          {openSections.frontDoor && selections.frontDoor.mode === 'customize' && (
            <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
              <label className="block text-xs font-medium text-slate-700 mb-1">Entry Door Style:</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'keep', label: 'Keep existing' },
                  { id: 'modern_slab', label: 'Modern Slab' },
                  { id: 'craftsman', label: 'Craftsman' },
                  { id: 'traditional_panel', label: 'Traditional Panel' },
                  { id: 'glass_insert', label: 'Glass Insert' },
                ].map((door) => (
                  <button
                    key={door.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...selections,
                        frontDoor: { ...selections.frontDoor, style: door.id as any },
                      })
                    }
                    className={`p-2 rounded border text-center transition-colors ${
                      selections.frontDoor.style === door.id
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {door.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Accent Paint Color:</label>
                <select
                  value={selections.frontDoor.color}
                  onChange={(e) =>
                    onChange({
                      ...selections,
                      frontDoor: { ...selections.frontDoor, color: e.target.value },
                    })
                  }
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                >
                  <option value="keep">Keep existing color</option>
                  <option value="Architectural Teal">Architectural Teal</option>
                  <option value="Vibrant Ochre Amber">Vibrant Ochre Amber</option>
                  <option value="Deep Navy">Deep Navy</option>
                  <option value="High-Gloss Black">High-Gloss Black</option>
                  <option value="Classic Red">Heritage Red</option>
                  <option value="Natural Stained Oak">Natural Stained Oak</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* 8. Windows & Trim */}
        <section className="p-4 transition-colors">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('windows')}>
            <div className="flex items-center gap-2.5">
              <Grid3X3 className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">Windows & Trim</span>
              {selections.windowsTrim.mode === 'customize' && (selections.windowsTrim.style !== 'keep' || selections.windowsTrim.trimColor !== 'keep') && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selections.windowsTrim.mode === 'keep' ? 'Keep existing' : selections.windowsTrim.mode === 'customize' ? 'Customized' : 'N/A'}
              </span>
              {openSections.windows ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['keep', 'customize', 'na'] as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  handleModeChange('windowsTrim', mode);
                  if (mode === 'customize') setOpenSections((p) => ({ ...p, windows: true }));
                }}
                className={`py-1.5 px-2 rounded-md transition-colors ${
                  selections.windowsTrim.mode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'keep' ? 'Keep existing' : mode === 'customize' ? 'Customize' : 'Not visible / N/A'}
              </button>
            ))}
          </div>

          {openSections.windows && selections.windowsTrim.mode === 'customize' && (
            <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
              <label className="block text-xs font-medium text-slate-700 mb-1">Window Style:</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'keep', label: 'Keep existing' },
                  { id: 'slim_modern', label: 'Slim Modern (Black Frame)' },
                  { id: 'traditional', label: 'Traditional Double-Hung' },
                  { id: 'colonial_grid', label: 'Colonial Grid' },
                  { id: 'craftsman', label: 'Craftsman Divided Lite' },
                ].map((win) => (
                  <button
                    key={win.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...selections,
                        windowsTrim: { ...selections.windowsTrim, style: win.id as any },
                      })
                    }
                    className={`p-2 rounded border text-center transition-colors ${
                      selections.windowsTrim.style === win.id
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {win.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Trim & Fascia Color:</label>
                <select
                  value={selections.windowsTrim.trimColor}
                  onChange={(e) =>
                    onChange({
                      ...selections,
                      windowsTrim: { ...selections.windowsTrim, trimColor: e.target.value },
                    })
                  }
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                >
                  <option value="keep">Keep existing trim</option>
                  <option value="Crisp White">Crisp Pure White</option>
                  <option value="Dark Charcoal">Dark Charcoal</option>
                  <option value="Matte Black">Matte Black</option>
                  <option value="Warm Taupe">Warm Taupe</option>
                  <option value="Deep Navy">Deep Navy</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Optional Architectural Requests Field */}
        <section className="p-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <span>Optional Architectural Instructions:</span>
              <span className="text-[10px] text-slate-500 font-normal">(Preservation rules apply)</span>
            </label>
            <span className="text-[11px] font-mono text-slate-500">
              {1200 - (selections.customRequests?.length || 0)} left
            </span>
          </div>

          <textarea
            value={selections.customRequests}
            maxLength={1200}
            rows={3}
            onChange={(e) =>
              onChange({
                ...selections,
                customRequests: e.target.value,
              })
            }
            placeholder="e.g. Keep front porch railings intact, emphasize warm evening lighting on the stone accents, make the house numbers modern brass..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </section>
      </div>

      {/* Sticky Bottom Generate Button */}
      <div className="p-4 border-t border-slate-100 bg-white flex flex-col gap-2">
        <button
          onClick={onGenerate}
          disabled={isLoading || !hasImage}
          type="button"
          className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span>Rendering Makeover...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-teal-200" />
              <span>
                {selectedCount > 0
                  ? `Generate Makeover (${selectedCount} upgrades)`
                  : 'Generate Makeover (Select Upgrades)'}
              </span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-500">
          Strict structural preservation guarantee · Camera perspective & roofline remain intact
        </p>
      </div>
    </div>
  );
};
