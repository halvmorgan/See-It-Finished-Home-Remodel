import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PhotoWorkspace } from './components/PhotoWorkspace';
import { CustomizationPanel } from './components/CustomizationPanel';
import { AISetupModal } from './components/AISetupModal';
import { PricingModal } from './components/PricingModal';
import { MakeoverSelections, SampleHomePreset } from './types/makeover';
import { INITIAL_SELECTIONS, SAMPLE_HOMES } from './data/presets';
import { countSelectedUpgrades } from './utils/promptBuilder';

export default function App() {
  // Image & Makeover State
  // Default to the first sample home for immediate visual richness and testing
  const initialPreset = SAMPLE_HOMES[0];
  const [originalImage, setOriginalImage] = useState<string | null>(initialPreset.beforeImage);
  const [resizedImage, setResizedImage] = useState<string | null>(initialPreset.beforeImage);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [generatedImage, setGeneratedImage] = useState<string | null>(initialPreset.afterImage);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(initialPreset.id);

  // Selections
  const [selections, setSelections] = useState<MakeoverSelections>({
    ...INITIAL_SELECTIONS,
    ...initialPreset.defaultSelections,
  });

  const [lastRenderedSelections, setLastRenderedSelections] = useState<MakeoverSelections | null>({
    ...INITIAL_SELECTIONS,
    ...initialPreset.defaultSelections,
  });

  // Flow & Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('Analyzing facade geometry & openings...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Monetization
  const [credits, setCredits] = useState<number>(3); // 3 complimentary passes to start
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isAISetupOpen, setIsAISetupOpen] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  // Demo mode: invite-only access. The passcode is checked on the server only.
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('sif_access_token');
    } catch {
      return null;
    }
  });
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('sif_role');
    } catch {
      return null;
    }
  });

  const saveToken = (token: string | null, newRole: string | null = null) => {
    setAccessToken(token);
    setRole(token ? newRole : null);
    try {
      if (token) {
        sessionStorage.setItem('sif_access_token', token);
        if (newRole) sessionStorage.setItem('sif_role', newRole);
      } else {
        sessionStorage.removeItem('sif_access_token');
        sessionStorage.removeItem('sif_role');
      }
    } catch {
      /* storage unavailable: token stays in memory only */
    }
  };

  // Owner tools: one-time invite codes (1 makeover each, expire after 48 hours)
  type InviteRow = { code: string; note: string; createdAt: number; expiresAt: number; used: boolean };
  const [inviteNote, setInviteNote] = useState<string>('');
  const [newInvite, setNewInvite] = useState<{ code: string; expiresAt: number } | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const ownerPost = async (url: string, body: object = {}) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
    });
    return res.json().catch(() => ({}));
  };

  const loadInvites = async () => {
    try {
      const data = await ownerPost('/api/invites/list');
      if (data.ok) setInvites(data.invites || []);
      else if (data.error) setInviteMsg(data.error);
    } catch {
      /* ignore */
    }
  };

  const createInvite = async () => {
    if (isCreatingInvite) return;
    setIsCreatingInvite(true);
    setInviteMsg(null);
    setCopied(false);
    try {
      const data = await ownerPost('/api/invites', { note: inviteNote });
      if (data.ok && data.code) {
        setNewInvite({ code: data.code, expiresAt: data.expiresAt });
        setInviteNote('');
        loadInvites();
      } else {
        setInviteMsg(data.error || 'Could not create a code.');
      }
    } catch {
      setInviteMsg('Could not reach the server.');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const inviteMessage = newInvite
    ? `Try See It Finished here: getseeitfinished.com - your one-time code is ${newInvite.code} (good for 1 makeover, expires in 48 hours).`
    : '';

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (accessToken && role === 'owner') loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, role]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim() || isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.token) {
        saveToken(data.token, data.role || null);
        setPasscodeInput('');
      } else {
        setAuthError(data.error || `Could not sign in (code ${res.status}). Please try again.`);
      }
    } catch {
      setAuthError('Could not reach the server. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // AI Backend Status
  const [aiStatus, setAiStatus] = useState<{
    ready: boolean;
    activeEngine: string;
    providers?: {
      gemini?: { configured: boolean; model: string };
      openai?: { configured: boolean; model: string };
    };
  }>({
    ready: false,
    activeEngine: 'Checking...',
  });

  // Fetch backend AI activation status on mount
  const checkAIStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setAiStatus({
          ready: data.status === 'ready',
          activeEngine: data.activeEngine,
          providers: data.providers,
        });
      }
    } catch {
      setAiStatus({
        ready: false,
        activeEngine: 'Offline / Awaiting configuration',
      });
    }
  };

  useEffect(() => {
    checkAIStatus();
  }, []);

  // Check if selections were modified since the last render
  const isModifiedSinceLastRender = useMemo(() => {
    if (!generatedImage || !lastRenderedSelections) return false;
    return JSON.stringify(selections) !== JSON.stringify(lastRenderedSelections);
  }, [selections, lastRenderedSelections, generatedImage]);

  // Determine current step in the Upload -> Customize -> Reveal flow
  const currentStep = useMemo<'upload' | 'customize' | 'reveal'>(() => {
    if (!originalImage) return 'upload';
    if (generatedImage && !isModifiedSinceLastRender) return 'reveal';
    return 'customize';
  }, [originalImage, generatedImage, isModifiedSinceLastRender]);

  // Handle uploading user photo
  const handleImageUploaded = (raw: string, resized: string, mime: string) => {
    setOriginalImage(raw);
    setResizedImage(resized);
    setMimeType(mime);
    setSelectedPresetId(null);
    setGeneratedImage(null);
    setLastRenderedSelections(null);
    setErrorMessage(null);
  };

  // Handle preset selection
  const handleSelectPreset = (preset: SampleHomePreset) => {
    setOriginalImage(preset.beforeImage);
    setResizedImage(preset.beforeImage);
    setMimeType('image/jpeg');
    setGeneratedImage(preset.afterImage);
    setSelectedPresetId(preset.id);
    const updated = {
      ...INITIAL_SELECTIONS,
      ...preset.defaultSelections,
    };
    setSelections(updated);
    setLastRenderedSelections(updated);
    setErrorMessage(null);
  };

  // Reset all customization panels to "Keep existing"
  const handleResetSelections = () => {
    setSelections(INITIAL_SELECTIONS);
  };

  // Clear workspace
  const handleClearImage = () => {
    setOriginalImage(null);
    setResizedImage(null);
    setGeneratedImage(null);
    setSelectedPresetId(null);
    setLastRenderedSelections(null);
    setSelections(INITIAL_SELECTIONS);
    setErrorMessage(null);
  };

  // Generate Makeover
  const handleGenerate = async () => {
    if (!originalImage || !resizedImage) {
      setErrorMessage('Please upload a home photo or choose a preset before generating.');
      return;
    }

    const upgradesCount = countSelectedUpgrades(selections);
    if (upgradesCount === 0) {
      setErrorMessage('Please customize at least 1 upgrade (e.g. Paint, Siding, Roof, or Doors).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Multi-stage progress indicators
    const progressStages = [
      'Analyzing facade geometry & openings...',
      'Synthesizing architectural materials & finishes...',
      'Preserving roofline pitch & surrounding landscape...',
      'Finalizing photorealistic lighting & reflections...',
    ];

    let stageIdx = 0;
    setLoadingStep(progressStages[0]);
    const stageInterval = setInterval(() => {
      stageIdx++;
      if (stageIdx < progressStages.length) {
        setLoadingStep(progressStages[stageIdx]);
      }
    }, 1800);

    try {
      // Demo homes are stored as file paths; convert them to base64 data before sending.
      let imagePayload = resizedImage;
      let payloadMime = mimeType;
      if (!imagePayload.startsWith('data:')) {
        const imgRes = await fetch(imagePayload);
        if (!imgRes.ok) throw new Error('Could not load the demo home photo.');
        const blob = await imgRes.blob();
        payloadMime = blob.type || mimeType;
        imagePayload = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Could not read the demo home photo.'));
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch('/api/generate-makeover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          image: imagePayload,
          mimeType: payloadMime,
          selections,
        }),
      });

      clearInterval(stageInterval);

      // Read the reply once (the server answers errors as { ok: false, error }).
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.image) {
        setGeneratedImage(data.image);
        setLastRenderedSelections(JSON.parse(JSON.stringify(selections)));
        setIsLoading(false);
        return;
      }

      if (data.authRequired || response.status === 401) {
        saveToken(null);
        setAuthError('Your access has expired. Please enter the passcode again.');
        return;
      }

      if (data.awaitingActivation) {
        // Never show a canned sample image as if it were a real result.
        setErrorMessage('The design engine is not available right now. Please try again later.');
      } else {
        setErrorMessage(data.error || data.message || 'The makeover could not be created. Please try again.');
      }
    } catch (err: unknown) {
      clearInterval(stageInterval);
      const error = err as Error;
      console.error('Generation error:', error);
      // Show the real error; never substitute a sample image.
      setErrorMessage('The makeover could not be created. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredits = (amount: number) => {
    setCredits((prev) => prev + amount);
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
        <form
          onSubmit={handleSignIn}
          className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl"
        >
          <div className="flex items-baseline gap-1.5 text-2xl font-bold tracking-tight">
            <span>See It Finished</span>
            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Demo preview - by invitation. Enter the code you were given.
          </p>
          <label htmlFor="sif-passcode" className="block mt-6 text-xs font-medium text-slate-400">
            Code
          </label>
          <input
            id="sif-passcode"
            type="password"
            autoComplete="off"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-white focus:outline-none focus:border-teal-400"
          />
          {authError && <p className="mt-3 text-sm text-amber-300">{authError}</p>}
          <button
            type="submit"
            disabled={isSigningIn || !passcodeInput.trim()}
            className="mt-5 w-full rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 py-2.5 font-semibold transition-colors"
          >
            {isSigningIn ? 'Checking...' : 'Enter'}
          </button>
          <p className="mt-5 text-xs text-slate-400">
            Need access? Contact Ecentra Concierge at ecentraconcierge.com.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Bar Header */}
      <Header
        currentStep={currentStep}
        hasImage={Boolean(originalImage)}
        hasRendered={Boolean(generatedImage)}
        aiStatus={aiStatus}
        credits={credits}
        onOpenPricing={() => {}}
        onOpenAISetup={() => {}}
      />

      {/* Main Workspace Area: Left Photo Workspace, Right Customization */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {role === 'owner' && (
          <section className="mb-6 rounded-xl border border-teal-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <h2 className="text-sm font-bold text-slate-900">Owner: invite codes</h2>
                <p className="text-xs text-slate-500">Each code works for 1 makeover and expires 48 hours after you create it.</p>
                <input
                  type="text"
                  value={inviteNote}
                  maxLength={100}
                  onChange={(e) => setInviteNote(e.target.value)}
                  placeholder="Who is it for? (optional, e.g. ABC Painting)"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <button
                type="button"
                onClick={createInvite}
                disabled={isCreatingInvite}
                className="rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white"
              >
                {isCreatingInvite ? 'Creating...' : 'Create invite code'}
              </button>
            </div>
            {inviteMsg && <p className="mt-3 text-sm text-amber-700">{inviteMsg}</p>}
            {newInvite && (
              <div className="mt-3 rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm">
                <div className="font-mono text-lg font-bold text-teal-800">{newInvite.code}</div>
                <div className="text-xs text-slate-600">Expires {new Date(newInvite.expiresAt).toLocaleString()}</div>
                <p className="mt-2 text-slate-700">{inviteMessage}</p>
                <button
                  type="button"
                  onClick={copyInvite}
                  className="mt-2 rounded-md border border-teal-300 bg-white px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                >
                  {copied ? 'Copied' : 'Copy message'}
                </button>
              </div>
            )}
            {invites.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 mb-1">Recent codes</div>
                <ul className="divide-y divide-slate-100 text-xs">
                  {invites.map((iv) => {
                    const status = iv.used ? 'Used' : Date.now() > iv.expiresAt ? 'Expired' : 'Not used yet';
                    return (
                      <li key={iv.code} className="flex flex-wrap justify-between gap-2 py-1.5">
                        <span className="font-mono text-slate-800">{iv.code}</span>
                        <span className="text-slate-500 truncate">{iv.note}</span>
                        <span className={iv.used ? 'text-slate-500' : status === 'Expired' ? 'text-amber-700' : 'text-teal-700 font-semibold'}>
                          {status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Photo Workspace (7 cols on desktop) */}
          <div className="lg:col-span-7">
            <PhotoWorkspace
              originalImage={originalImage}
              generatedImage={generatedImage}
              isLoading={isLoading}
              loadingStep={loadingStep}
              errorMessage={errorMessage}
              isModifiedSinceLastRender={isModifiedSinceLastRender}
              selectedPresetId={selectedPresetId}
              onImageUploaded={handleImageUploaded}
              onSelectPreset={handleSelectPreset}
              onClearImage={handleClearImage}
              onRegenerate={handleGenerate}
              onOpenPricing={() => {}}
              credits={credits}
            />
          </div>

          {/* Right Column: Customization Controls (5 cols on desktop) */}
          <div className="lg:col-span-5 sticky top-20">
            <CustomizationPanel
              selections={selections}
              onChange={setSelections}
              onReset={handleResetSelections}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              hasImage={Boolean(originalImage)}
              aiReady={aiStatus.ready || demoMode}
            />
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">See It Finished</span>
            <span>·</span>
            <span>Exterior design previews</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Demo preview - by invitation. Contact Ecentra Concierge for access.</span>
            <span>© {new Date().getFullYear()} See It Finished. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
