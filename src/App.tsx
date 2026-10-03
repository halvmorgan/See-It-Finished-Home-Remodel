import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PhotoWorkspace } from './components/PhotoWorkspace';
import { CustomizationPanel } from './components/CustomizationPanel';
import { AISetupModal } from './components/AISetupModal';
import { PricingModal } from './components/PricingModal';
import { MakeoverSelections, SampleHomePreset } from './types/makeover';
import { INITIAL_SELECTIONS, SAMPLE_HOMES } from './data/presets';
import { countSelectedUpgrades } from './utils/promptBuilder';

// ---- Sales page: two offers split-tested 50/50 (force one with ?offer=a or ?offer=b) ----
type OfferKey = 'a' | 'b';
// Paste the Stripe payment links here when they are created.
const STRIPE_LINKS: Record<OfferKey, string> = {
  a: 'https://buy.stripe.com/7sYfZi2L7crrf3f4d63VC0y',
  b: '',
};

const STEPS = [
  { title: 'Take one photo', text: 'Snap the front of the house with a phone, or upload a photo the homeowner sends.' },
  { title: 'Pick the finishes', text: 'Paint colors, siding, roof, driveway, landscaping, doors and windows. Keep what stays.' },
  { title: 'See it finished', text: 'In about a minute you get a before-and-after of that exact house, ready to show or send.' },
];

const OFFER_COPY: Record<OfferKey, {
  eyebrow: string; headline: string; sub: string; steps: typeof STEPS;
  why: { title: string; text: string }[]; offerName: string; price: string; priceNote: string;
  monthly: string; includes: string[]; guarantee: string; cta: string; scarcity: string;
}> = {
  a: {
    eyebrow: 'For painters, roofers, siding, landscaping and exterior contractors',
    headline: 'Let homeowners see their house finished, before they ever call you.',
    sub: 'Put See It Finished on your website with your name on it. Homeowners upload a photo, choose colors and materials, and see their own home finished in about a minute. You get their name, phone and project, and they call already excited.',
    steps: STEPS,
    why: [
      { title: 'More leads from the same website', text: 'Most contractor sites only have a contact form. "See your house finished" gives visitors a reason to leave their info today.' },
      { title: 'Warmer calls', text: 'The homeowner has already pictured the result with your company name on it. You start the estimate halfway to yes.' },
      { title: 'Bigger jobs', text: 'Once they see new siding and trim together, paint-only becomes paint plus trim. Showing beats telling.' },
    ],
    offerName: 'Done For You: Your Branded See It Finished',
    price: '$497 setup',
    priceNote: 'normally $997',
    monthly: '+ $197/month. Cancel anytime.',
    includes: [
      'Your own See It Finished with your logo, colors and service area',
      'A "See your home finished" button and page for your website',
      'Every homeowner who tries it comes to you as a lead: name, phone, email and their choices',
      'Printable QR flyer for yard signs, trucks and leave-behinds',
      '3 ready-to-post social media captions',
      'Set up within 7 days of a 20-minute setup call',
    ],
    guarantee: 'If your See It Finished does not bring you at least one homeowner lead in 60 days, I refund your setup fee.',
    cta: 'Claim a founding spot',
    scarcity: 'Founding price is limited to the first 5 contractors.',
  },
  b: {
    eyebrow: 'For painters, roofers, siding, landscaping and exterior contractors',
    headline: 'Show the homeowner their house finished, right at the kitchen table.',
    sub: 'Snap a photo during the estimate, pick colors and materials together, and show them their own home finished in about a minute. Fewer "let me think about it." More yeses, and bigger jobs.',
    steps: STEPS,
    why: [
      { title: 'Close on the first visit', text: 'People buy what they can see. A finished picture of their own house answers "what will it look like?" on the spot.' },
      { title: 'Upsell without pushing', text: 'Show paint plus new shutters and a new door side by side. Let the homeowner pick the bigger job.' },
      { title: 'Follow up with something they want', text: 'Text or email the before-and-after card. It gets shown to the spouse, and you stay top of mind.' },
    ],
    offerName: 'Sales Tool: See It Finished in Your Pocket',
    price: '$79/month',
    priceNote: 'normally $97',
    monthly: 'No setup fee. Founding price stays as long as you stay. Cancel anytime.',
    includes: [
      'Works on your phone, tablet or laptop, nothing to install',
      'Up to 100 makeovers a month',
      'Download before-and-after cards to text or email the homeowner',
      'Paint, siding, roof, driveway, landscaping, doors, windows and trim',
      'Start the same day you sign up',
    ],
    guarantee: '30-day money back. If it does not help you sell, email me within 30 days and I refund you.',
    cta: 'Start for $79/month',
    scarcity: 'Founding price for early customers only.',
  },
};

const TRADES = [
  'House painting', 'Roofing', 'Siding', 'Windows and doors', 'Landscaping', 'Hardscape / pavers',
  'Driveway / concrete', 'Fencing / decks', 'General contractor / remodeler', 'Real estate agent', 'Other',
];

const FAQ = [
  { q: 'Is the picture real?', a: 'It is a design preview made from the actual photo of the house, so the shape, windows and surroundings stay the same. Each image is labeled "AI design preview" because real colors and materials will vary.' },
  { q: 'What kind of photos work best?', a: 'A straight-on photo of the front of the house in daylight, with the whole house in the frame.' },
  { q: 'Which trades is it for?', a: 'Anyone who changes how a house looks from the street: painters, roofers, siding, windows and doors, landscapers, hardscape, driveways, fences, decks and exterior remodelers.' },
  { q: 'Do homeowners see my name?', a: 'With the Done For You plan, yes: it carries your logo, colors and contact info, and leads come straight to you.' },
  { q: 'Can I cancel?', a: 'Yes. The monthly plan can be cancelled anytime.' },
];

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

  // Sales page: which offer this visitor sees (kept the same on return visits)
  const [offer] = useState<OfferKey>(() => {
    const pick = (): OfferKey => (Math.random() < 0.5 ? 'a' : 'b');
    try {
      const q = new URLSearchParams(window.location.search).get('offer');
      if (q === 'a' || q === 'b') {
        localStorage.setItem('sif_offer', q);
        return q;
      }
      const saved = localStorage.getItem('sif_offer');
      if (saved === 'a' || saved === 'b') return saved;
      const p = pick();
      localStorage.setItem('sif_offer', p);
      return p;
    } catch {
      return pick();
    }
  });
  const [demoForm, setDemoForm] = useState({ name: '', company: '', email: '', phone: '', trade: '' });
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isRequestingDemo, setIsRequestingDemo] = useState<boolean>(false);
  const [isDemoVisitor, setIsDemoVisitor] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('sif_demo') === '1';
    } catch {
      return false;
    }
  });

  const track = (event: 'view' | 'checkout') => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer, event }),
      keepalive: true,
    }).catch(() => {});
  };

  useEffect(() => {
    if (!accessToken) track('view');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckout = () => {
    track('checkout');
    const link = STRIPE_LINKS[offer];
    if (link) {
      window.location.href = link;
    } else {
      // No payment link yet: send them to the demo form instead.
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequestingDemo) return;
    setIsRequestingDemo(true);
    setDemoError(null);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...demoForm, offer }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.token) {
        try {
          sessionStorage.setItem('sif_demo', '1');
        } catch {
          /* ignore */
        }
        setIsDemoVisitor(true);
        saveToken(data.token, 'invite');
        window.scrollTo(0, 0);
      } else {
        setDemoError(data.error || 'Could not start your demo. Please try again.');
      }
    } catch {
      setDemoError('Could not reach the server. Please try again.');
    } finally {
      setIsRequestingDemo(false);
    }
  };

  // Owner tools: one-time invite codes (1 makeover each, expire after 48 hours)
  type InviteRow = { code: string; note: string; createdAt: number; expiresAt: number; used: boolean };
  const [inviteNote, setInviteNote] = useState<string>('');
  const [newInvite, setNewInvite] = useState<{ code: string; expiresAt: number; kind: string } | null>(null);
  type OfferStats = { views: number; demos: number; checkoutClicks: number };
  type LeadRow = { name: string; company: string; email: string; phone: string; trade: string; offer: string; code: string; createdAt: number };
  const [results, setResults] = useState<{ stats: Record<string, OfferStats>; leads: LeadRow[] } | null>(null);
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

  const loadResults = async () => {
    try {
      const data = await ownerPost('/api/owner/results');
      if (data.ok) setResults({ stats: data.stats, leads: data.leads || [] });
    } catch {
      /* ignore */
    }
  };

  const createInvite = async (kind: 'demo' | 'pro' = 'demo') => {
    if (isCreatingInvite) return;
    setIsCreatingInvite(true);
    setInviteMsg(null);
    setCopied(false);
    try {
      const data = await ownerPost('/api/invites', { note: inviteNote, kind });
      if (data.ok && data.code) {
        setNewInvite({ code: data.code, expiresAt: data.expiresAt, kind: data.kind || kind });
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

  const inviteMessage = !newInvite
    ? ''
    : newInvite.kind === 'pro'
      ? 'Welcome to See It Finished! Go to getseeitfinished.com, scroll to "Already have a code?" and enter your access code ' + newInvite.code + '. It is good for 100 makeovers over the next 31 days. Keep it private.'
      : 'Try See It Finished here: getseeitfinished.com - scroll to "Already have a code?" and enter your one-time code ' + newInvite.code + ' (good for 1 makeover, expires in 48 hours).';

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (accessToken && role === 'owner') {
      loadInvites();
      loadResults();
    }
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
    const copy = OFFER_COPY[offer];
    return (
      <div className="min-h-screen bg-white text-slate-900 antialiased">
        {/* Top bar */}
        <header className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 text-lg font-bold">
              <span>See It Finished</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
            </div>
            <a href="#demo" className="rounded-lg bg-teal-600 hover:bg-teal-500 px-3 py-1.5 text-sm font-semibold">
              Try it free
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-teal-300 text-xs sm:text-sm font-semibold uppercase tracking-wide">{copy.eyebrow}</p>
              <h1 className="mt-3 text-3xl sm:text-5xl font-bold leading-tight">{copy.headline}</h1>
              <p className="mt-4 text-slate-300 text-base sm:text-lg">{copy.sub}</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a href="#demo" className="text-center rounded-lg bg-teal-600 hover:bg-teal-500 px-5 py-3 font-semibold">
                  Try it free on a demo house
                </a>
                <a href="#offer" className="text-center rounded-lg border border-slate-500 hover:border-teal-400 px-5 py-3 font-semibold">
                  See the founding offer
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <figure className="relative">
                <img src={SAMPLE_HOMES[0].beforeImage} alt="House before" className="rounded-xl w-full h-56 sm:h-72 object-cover" />
                <figcaption className="absolute top-2 left-2 bg-slate-900/80 text-xs font-semibold px-2 py-1 rounded">BEFORE</figcaption>
              </figure>
              <figure className="relative">
                <img src={SAMPLE_HOMES[0].afterImage} alt="Same house, design preview after" className="rounded-xl w-full h-56 sm:h-72 object-cover" />
                <figcaption className="absolute top-2 left-2 bg-teal-600 text-xs font-semibold px-2 py-1 rounded">FINISHED</figcaption>
              </figure>
              <p className="col-span-2 text-xs text-slate-400">Design preview made from one photo. Real colors and materials will vary.</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">How it works</h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-6">
            {copy.steps.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-5">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center">{i + 1}</div>
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            Paint colors, siding and accents, roof and solar, driveway, landscaping, garage door, front door, windows and trim.
          </p>
        </section>

        {/* Why it pays */}
        <section className="bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-3 gap-6">
            {copy.why.map((w, i) => (
              <div key={i}>
                <h3 className="font-bold text-lg">{w.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Offer */}
        <section id="offer" className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="rounded-2xl border-2 border-teal-500 p-6 sm:p-8 shadow-sm">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-wide">Founding offer</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold">{copy.offerName}</h2>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
              <span className="text-4xl font-bold">{copy.price}</span>
              <span className="text-slate-600">{copy.priceNote}</span>
            </div>
            <p className="mt-1 font-semibold text-slate-800">{copy.monthly}</p>
            <ul className="mt-5 space-y-2">
              {copy.includes.map((x, i) => (
                <li key={i} className="flex gap-2 text-sm sm:text-base">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-lg bg-teal-50 border border-teal-200 p-4 text-sm">
              <span className="font-bold">Guarantee: </span>
              {copy.guarantee}
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="mt-6 w-full rounded-lg bg-teal-600 hover:bg-teal-500 py-3.5 text-lg font-bold text-white"
            >
              {copy.cta}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">Secure checkout by Stripe. {copy.scarcity}</p>
          </div>
        </section>

        {/* Demo form */}
        <section id="demo" className="bg-slate-900 text-white">
          <div className="max-w-xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">Try it free: 1 makeover on us</h2>
            <p className="mt-2 text-center text-slate-300">Get instant access. No credit card. Use a demo house or a photo of a real house.</p>
            <form onSubmit={handleDemoRequest} className="mt-6 grid gap-3">
              <input required maxLength={80} value={demoForm.name} onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })} placeholder="Your name" className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2.5 focus:outline-none focus:border-teal-400" />
              <input required maxLength={120} value={demoForm.company} onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })} placeholder="Company name" className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2.5 focus:outline-none focus:border-teal-400" />
              <input required type="email" maxLength={160} value={demoForm.email} onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })} placeholder="Email" className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2.5 focus:outline-none focus:border-teal-400" />
              <input type="tel" maxLength={40} value={demoForm.phone} onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })} placeholder="Phone (optional)" className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2.5 focus:outline-none focus:border-teal-400" />
              <select value={demoForm.trade} onChange={(e) => setDemoForm({ ...demoForm, trade: e.target.value })} className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2.5 focus:outline-none focus:border-teal-400">
                <option value="">What do you do?</option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {demoError && <p className="text-amber-300 text-sm">{demoError}</p>}
              <button type="submit" disabled={isRequestingDemo} className="rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 py-3 font-bold">
                {isRequestingDemo ? 'Setting up your demo...' : 'Start my free demo'}
              </button>
              <p className="text-xs text-slate-400">By starting the demo you agree Ecentra Concierge may contact you about See It Finished. Photos are used only to make your preview.</p>
            </form>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-center">Questions</h2>
          <div className="mt-6 space-y-4">
            {FAQ.map((f, i) => (
              <details key={i} className="rounded-lg border border-slate-200 p-4">
                <summary className="font-semibold cursor-pointer">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Code sign-in */}
        <section className="bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleSignIn} className="max-w-md mx-auto px-4 py-8">
            <label htmlFor="sif-passcode" className="block text-sm font-semibold text-slate-700">Already have a code?</label>
            <div className="mt-2 flex gap-2">
              <input
                id="sif-passcode"
                type="password"
                autoComplete="off"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter your code"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-teal-500"
              />
              <button type="submit" disabled={isSigningIn || !passcodeInput.trim()} className="rounded-lg bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50">
                {isSigningIn ? '...' : 'Enter'}
              </button>
            </div>
            {authError && <p className="mt-2 text-sm text-amber-700">{authError}</p>}
          </form>
        </section>

        <footer className="py-6 text-center text-xs text-slate-500">
          See It Finished by Ecentra Concierge · ecentraconcierge.com · Design previews are illustrations; actual results will vary.
        </footer>
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
        {role === 'invite' && (
          <section className="mb-6 rounded-xl bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold">
                {isDemoVisitor ? 'Your free demo is ready: 1 makeover. ' : ''}
                Pick a demo house or upload a photo, choose the finishes, then press Generate.
              </p>
              <p className="text-sm text-slate-300">
                Like it? {OFFER_COPY[offer].offerName}: {OFFER_COPY[offer].price} ({OFFER_COPY[offer].priceNote}). {OFFER_COPY[offer].monthly}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="shrink-0 rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2.5 font-semibold"
            >
              {OFFER_COPY[offer].cta}
            </button>
          </section>
        )}
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
                onClick={() => createInvite('demo')}
                disabled={isCreatingInvite}
                className="rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white"
              >
                {isCreatingInvite ? 'Creating...' : 'Create invite code'}
              </button>
              <button
                type="button"
                onClick={() => createInvite('pro')}
                disabled={isCreatingInvite}
                title="For paid Sales Tool customers: 100 makeovers, 31 days"
                className="rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 disabled:opacity-50 px-4 py-2 text-sm font-semibold"
              >
                Create Pro code (paid)
              </button>
            </div>
            {inviteMsg && <p className="mt-3 text-sm text-amber-700">{inviteMsg}</p>}
            {newInvite && (
              <div className="mt-3 rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm">
                <div className="font-mono text-lg font-bold text-teal-800">{newInvite.code}</div>
                <div className="text-xs text-slate-600">
                  {newInvite.kind === 'pro' ? 'Pro code: 100 makeovers. ' : 'Invite code: 1 makeover. '}
                  Expires {new Date(newInvite.expiresAt).toLocaleString()}
                </div>
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
            {results && (
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500">Split test: which offer is winning</div>
                  <button type="button" onClick={loadResults} className="text-xs text-teal-700 underline">Refresh</button>
                </div>
                <table className="mt-1 w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-1">Offer</th>
                      <th>Visitors</th>
                      <th>Free demos</th>
                      <th>Clicked buy</th>
                      <th>Demo rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['a', 'b'] as OfferKey[]).map((o) => {
                      const s = results.stats[o] || { views: 0, demos: 0, checkoutClicks: 0 };
                      const rate = s.views ? Math.round((s.demos / s.views) * 100) + '%' : '-';
                      return (
                        <tr key={o} className="border-t border-slate-100">
                          <td className="py-1.5 font-semibold">{o === 'a' ? 'A: Done For You ($497 + $197/mo)' : 'B: Sales Tool ($79/mo)'}</td>
                          <td>{s.views}</td>
                          <td>{s.demos}</td>
                          <td>{s.checkoutClicks}</td>
                          <td>{rate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-1 text-[11px] text-slate-500">Actual sales: check each payment link in Stripe. Preview a page: getseeitfinished.com/?offer=a or ?offer=b (that browser then keeps seeing it).</p>
                {results.leads.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Free demo requests (newest first)</div>
                    <ul className="divide-y divide-slate-100 text-xs">
                      {results.leads.map((l) => (
                        <li key={l.code + l.email} className="py-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span className="font-semibold text-slate-800">{l.company}</span>
                          <span>{l.name}</span>
                          <a className="text-teal-700 underline" href={'mailto:' + l.email}>{l.email}</a>
                          {l.phone && <a className="text-teal-700 underline" href={'tel:' + l.phone}>{l.phone}</a>}
                          <span className="text-slate-500">{l.trade}</span>
                          <span className="text-slate-500">Offer {String(l.offer).toUpperCase()}</span>
                          <span className="text-slate-400">{new Date(l.createdAt).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {invites.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 mb-1">Recent codes</div>
                <ul className="divide-y divide-slate-100 text-xs">
                  {invites.map((iv) => {
                    const status = iv.used ? 'Used' : Date.now() > iv.expiresAt ? 'Expired' : 'Not used yet';
                    const usage = (iv as { maxUses?: number; uses?: number }).maxUses && (iv as { maxUses?: number }).maxUses! > 1
                      ? ' (' + ((iv as { uses?: number }).uses || 0) + '/' + (iv as { maxUses?: number }).maxUses + ')'
                      : '';
                    return (
                      <li key={iv.code} className="flex flex-wrap justify-between gap-2 py-1.5">
                        <span className="font-mono text-slate-800">{iv.code}</span>
                        <span className="text-slate-500 truncate">{iv.note}</span>
                        <span className={iv.used ? 'text-slate-500' : status === 'Expired' ? 'text-amber-700' : 'text-teal-700 font-semibold'}>
                          {status}
                          {usage}
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
