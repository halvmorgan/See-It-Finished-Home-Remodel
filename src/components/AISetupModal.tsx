import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Terminal, HelpCircle } from 'lucide-react';

interface AISetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiStatus: {
    ready: boolean;
    activeEngine: string;
    providers?: {
      gemini?: { configured: boolean; model: string };
      openai?: { configured: boolean; model: string };
    };
  };
  onRefreshStatus: () => Promise<void>;
  demoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
}

export const AISetupModal: React.FC<AISetupModalProps> = ({
  isOpen,
  onClose,
  aiStatus,
  onRefreshStatus,
  demoMode,
  onToggleDemoMode,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'gemini' | 'openai'>('gemini');

  if (!isOpen) return null;

  const handleCheck = async () => {
    setIsChecking(true);
    await onRefreshStatus();
    setIsChecking(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Backend Setup & Status</h2>
              <p className="text-xs text-slate-400">Build first, connect AI credentials securely</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Summary Banner */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {aiStatus.ready ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {aiStatus.ready ? 'AI Generation Engine Active' : 'AI Generation Awaiting Activation'}
                </p>
                <p className="text-xs text-slate-500">
                  Active Engine: <span className="font-semibold text-slate-700">{aiStatus.activeEngine}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Verify</span>
            </button>
          </div>
        </div>

        {/* Demo Mode Toggle for Immediate Testing */}
        <div className="px-5 py-3.5 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-teal-900">Interactive Demo Makeover Mode</p>
            <p className="text-teal-700 text-[11px]">
              Allows you to test the full Upload → Customize → Before/After slider flow immediately with high-resolution sample models.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleDemoMode(!demoMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              demoMode ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                demoMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('gemini')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'gemini'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Option 1: Google Gemini (Recommended)</span>
              {aiStatus.providers?.gemini?.configured && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('openai')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'openai'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Option 2: OpenAI (DALL-E)</span>
              {aiStatus.providers?.openai?.configured && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </button>
          </div>

          {activeTab === 'gemini' ? (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>How Gemini is Configured</span>
                </p>
                <p>
                  The server is already fully integrated with the official <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">@google/genai</code> SDK using <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">gemini-3.1-flash-image</code> for photorealistic architectural synthesis.
                </p>
                <p>
                  Credentials are kept strictly server-side via <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">process.env.GEMINI_API_KEY</code>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Setup Steps:</h4>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600">
                  <li>
                    In the AI Studio interface, open the <strong>Settings &gt; Secrets</strong> tab on the left or top panel.
                  </li>
                  <li>
                    Add your Gemini API Key under the variable name <code className="font-mono bg-slate-100 px-1 rounded">GEMINI_API_KEY</code>.
                  </li>
                  <li>
                    Click the <strong>Verify</strong> button above to confirm instant activation.
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-900 space-y-1">
                <p className="font-bold">Billing & Model Tier Notice:</p>
                <p className="text-[11px]">
                  Google image generation models (<code className="font-mono">gemini-3.1-flash-image</code>) require a Google Cloud billing account or paid-tier Gemini API key. Ensure your project has billing enabled in Google Cloud / AI Studio.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>OpenAI DALL-E Integration</span>
                </p>
                <p>
                  You can connect OpenAI by setting <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">OPENAI_API_KEY</code> on the server.
                </p>
                <p>
                  Never paste your raw key in public chats. Provide it via server environment variables or AI Studio secrets.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">OpenAI Setup Steps:</h4>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600">
                  <li>
                    Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-teal-700 font-semibold underline inline-flex items-center gap-0.5">platform.openai.com/api-keys <ExternalLink className="w-3 h-3" /></a> and generate a Secret Key.
                  </li>
                  <li>
                    Set <code className="font-mono bg-slate-100 px-1 rounded">OPENAI_API_KEY=sk-...</code> in your server secrets.
                  </li>
                  <li>
                    Ensure your OpenAI account has at least $5 in prepaid credits under <strong>Billing &gt; Overview</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Need assistance? Support is available.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
