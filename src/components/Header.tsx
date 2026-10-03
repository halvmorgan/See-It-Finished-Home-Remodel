import React from 'react';
import { Home, Sparkles, CreditCard, Key, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  currentStep: 'upload' | 'customize' | 'reveal';
  hasImage: boolean;
  hasRendered: boolean;
  aiStatus: {
    ready: boolean;
    activeEngine: string;
  };
  credits: number;
  onOpenPricing: () => void;
  onOpenAISetup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  hasImage,
  hasRendered,
  aiStatus,
  credits,
  onOpenPricing,
  onOpenAISetup,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Home className="w-5 h-5" />
          </div>
          <a href="/" className="flex items-baseline gap-1.5 text-lg sm:text-xl font-bold tracking-tight text-white hover:text-teal-400 transition-colors">
            <span>See It Finished</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block mb-0.5" />
          </a>
        </div>

        {/* Zone 2: Flow Indicator (Upload -> Customize -> Reveal) */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-medium">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            currentStep === 'upload' ? 'bg-teal-500/20 text-teal-300 font-semibold' : hasImage ? 'text-slate-300' : 'text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
            <span>Upload Photo</span>
          </div>

          <span className="text-slate-400">→</span>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            currentStep === 'customize' ? 'bg-teal-500/20 text-teal-300 font-semibold' : hasImage ? 'text-slate-300' : 'text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
            <span>Customize</span>
          </div>

          <span className="text-slate-400">→</span>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            currentStep === 'reveal' || hasRendered ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
            <span>Reveal Before & After</span>
          </div>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Status Badge */}
          <span
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300"
            title="Image engine status"
          >
            {aiStatus.ready ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">AI Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Connect AI</span>
              </>
            )}
          </span>

          {/* Credits / Passes */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600 text-white shadow-sm">
            <span className="font-semibold">Demo preview</span>
          </span>
        </div>
      </div>
    </header>
  );
};
