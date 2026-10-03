import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { buildMakeoverPrompt } from './src/utils/promptBuilder';
import { MakeoverSelections } from './src/types/makeover';
import path from 'path';
import crypto from 'crypto';
import { Firestore, FieldValue } from '@google-cloud/firestore';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support large image payloads (up to 30 MB for raw photo uploads)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// ---- DEMO MODE: invite-only passcode gate + daily cap ----
// The passcode lives only in the APP_ACCESS_PASSCODE secret. If it is not set, nobody can sign in.
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const DAILY_CAP = 50; // owner makeovers per session per day (invite codes allow 1 each)
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;
type Session = { expires: number; day: string; count: number; role: 'owner' | 'invite'; code?: string };
const sessions = new Map<string, Session>();

// ---- One-time invite codes (stored in Firestore so used codes stay used after restarts) ----
const INVITES = 'sif_invites';
const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // codes expire 48 hours after they are created
const INVITE_MAX_USES = 1; // makeovers per code
const PRO_TTL_MS = 31 * 24 * 60 * 60 * 1000; // paid Sales Tool codes: 31 days
const PRO_MAX_USES = 100; // paid Sales Tool codes: 100 makeovers
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let _db: Firestore | null = null;
const db = () => (_db ??= new Firestore({ databaseId: process.env.FIRESTORE_DATABASE_ID || 'default', ignoreUndefinedProperties: true }));
const newCode = () =>
  'SIF-' + Array.from({ length: 6 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
const normalizeCode = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '');
const USED_MSG = 'This code has already been used. Please contact Ecentra Concierge for a new one.';
const EXPIRED_MSG = 'This code has expired. Please contact Ecentra Concierge for a new one.';

type InviteDoc = { createdAt: number; expiresAt: number; maxUses: number; uses: number; note?: string };
const inviteProblem = (d: InviteDoc | undefined): string | null => {
  if (!d) return 'Incorrect code.';
  if (Date.now() > d.expiresAt) return EXPIRED_MSG;
  if ((d.uses || 0) >= (d.maxUses || 1)) return USED_MSG;
  return null;
};
const checkInvite = async (code: string) => {
  const snap = await db().collection(INVITES).doc(code).get();
  return inviteProblem(snap.exists ? (snap.data() as InviteDoc) : undefined);
};
const consumeInvite = (code: string) =>
  db().runTransaction(async (t) => {
    const ref = db().collection(INVITES).doc(code);
    const snap = await t.get(ref);
    const d = snap.exists ? (snap.data() as InviteDoc) : undefined;
    const problem = inviteProblem(d);
    if (problem) return problem;
    t.update(ref, { uses: (d!.uses || 0) + 1, lastUsedAt: Date.now() });
    return null;
  });
const refundInvite = (code: string) =>
  db().collection(INVITES).doc(code).update({ uses: FieldValue.increment(-1) });
const attempts = new Map<string, { count: number; first: number }>();

const today = () => new Date().toISOString().slice(0, 10);
const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest();
const clientIp = (req: Request) => {
  const xf = req.headers['x-forwarded-for'];
  return (typeof xf === 'string' ? xf.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
};

setInterval(() => {
  const now = Date.now();
  for (const [t, s] of sessions) if (now > s.expires) sessions.delete(t);
  for (const [ip, a] of attempts) if (now - a.first > ATTEMPT_WINDOW_MS) attempts.delete(ip);
}, 60 * 60 * 1000).unref();

app.post('/api/access', async (req: Request, res: Response) => {
  const expected = process.env.APP_ACCESS_PASSCODE?.trim();
  if (!expected) {
    return res.json({ ok: false, error: 'Access is not set up yet. Please contact Ecentra Concierge.' });
  }
  const ip = clientIp(req);
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && now - a.first < ATTEMPT_WINDOW_MS && a.count >= MAX_ATTEMPTS) {
    return res.json({ ok: false, error: 'Too many tries. Please wait 15 minutes and try again.' });
  }
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
  const fail = (error: string) => {
    if (!a || now - a.first >= ATTEMPT_WINDOW_MS) attempts.set(ip, { count: 1, first: now });
    else a.count++;
    return res.json({ ok: false, error });
  };
  if (!passcode) return fail('Please enter your code.');

  // Owner passcode: unlimited demos (daily cap only).
  if (crypto.timingSafeEqual(sha256(passcode), sha256(expected))) {
    attempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { expires: now + SESSION_TTL_MS, day: today(), count: 0, role: 'owner' });
    return res.json({ ok: true, token, role: 'owner' });
  }

  // Personal invite code: one makeover, expires 48 hours after it was created.
  const code = normalizeCode(passcode);
  if (/^SIF-[A-Z0-9]{6}$/.test(code)) {
    try {
      const problem = await checkInvite(code);
      if (problem) return fail(problem);
    } catch (e: unknown) {
      console.error('[invites] check failed:', (e as Error)?.message);
      return res.json({ ok: false, error: 'Invite codes are not available right now. Please try again later.' });
    }
    attempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { expires: now + SESSION_TTL_MS, day: today(), count: 0, role: 'invite', code });
    let kind = 'demo';
    try {
      const snap = await db().collection(INVITES).doc(code).get();
      kind = ((snap.data() || {}) as { kind?: string }).kind || 'demo';
    } catch {
      /* ignore */
    }
    // 'pro' only changes what the browser shows (no sales banner); limits are still enforced per code.
    return res.json({ ok: true, token, role: kind === 'pro' ? 'pro' : 'invite' });
  }

  return fail('Incorrect code.');
});

const getSession = (req: Request) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expires) {
    sessions.delete(token);
    return null;
  }
  if (s.day !== today()) {
    s.day = today();
    s.count = 0;
  }
  return s;
};

// Owner only: create a one-time invite code.
app.post('/api/invites', async (req: Request, res: Response) => {
  const s = getSession(req);
  if (!s || s.role !== 'owner') return res.json({ ok: false, error: 'Only the owner can create invite codes.' });
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 100) : '';
  // kind 'pro' = paid Sales Tool customer: 100 makeovers, good for 31 days.
  const kind = req.body?.kind === 'pro' ? 'pro' : 'demo';
  const ttl = kind === 'pro' ? PRO_TTL_MS : INVITE_TTL_MS;
  const maxUses = kind === 'pro' ? PRO_MAX_USES : INVITE_MAX_USES;
  try {
    for (let i = 0; i < 5; i++) {
      const code = newCode();
      const now = Date.now();
      try {
        await db()
          .collection(INVITES)
          .doc(code)
          .create({ createdAt: now, expiresAt: now + ttl, maxUses, uses: 0, note, kind, source: 'owner' });
        return res.json({ ok: true, code, expiresAt: now + ttl, note, kind, maxUses });
      } catch (e: unknown) {
        if ((e as { code?: number })?.code === 6) continue; // code already exists: try another
        throw e;
      }
    }
    return res.json({ ok: false, error: 'Could not create a code. Please try again.' });
  } catch (e: unknown) {
    console.error('[invites] create failed:', (e as Error)?.message);
    return res.json({ ok: false, error: 'Invite codes are not available yet (the database is not set up).' });
  }
});

// Owner only: the 20 most recent invite codes and whether they were used.
app.post('/api/invites/list', async (req: Request, res: Response) => {
  const s = getSession(req);
  if (!s || s.role !== 'owner') return res.json({ ok: false, error: 'Only the owner can see invite codes.' });
  try {
    const snap = await db().collection(INVITES).orderBy('createdAt', 'desc').limit(20).get();
    const invites = snap.docs.map((d) => {
      const x = d.data() as InviteDoc;
      return {
        code: d.id,
        note: x.note || '',
        createdAt: x.createdAt,
        expiresAt: x.expiresAt,
        used: (x.uses || 0) >= (x.maxUses || 1),
        uses: x.uses || 0,
        maxUses: x.maxUses || 1,
        kind: (x as { kind?: string }).kind || 'demo',
        source: (x as { source?: string }).source || 'owner',
      };
    });
    return res.json({ ok: true, invites });
  } catch (e: unknown) {
    console.error('[invites] list failed:', (e as Error)?.message);
    return res.json({ ok: false, error: 'Invite codes are not available yet (the database is not set up).' });
  }
});

// ---- Public sales page: split test (offer A vs B) + instant demo requests ----
const LEADS = 'sif_leads';
const STATS = 'sif_stats';
const OFFERS = ['a', 'b'];
const cleanOffer = (o: unknown) => (typeof o === 'string' && OFFERS.includes(o) ? o : 'a');
const trackSeen = new Map<string, number>(); // ip|offer|event -> last time (stops refresh-spam)
const demoByIp = new Map<string, { count: number; day: string }>();
const bump = (offer: string, field: string) =>
  db().collection(STATS).doc(offer).set({ [field]: FieldValue.increment(1), updatedAt: Date.now() }, { merge: true });

setInterval(() => {
  const now = Date.now();
  for (const [k, t] of trackSeen) if (now - t > 6 * 60 * 60 * 1000) trackSeen.delete(k);
  for (const [k, d] of demoByIp) if (d.day !== today()) demoByIp.delete(k);
}, 60 * 60 * 1000).unref();

app.post('/api/track', async (req: Request, res: Response) => {
  const offer = cleanOffer(req.body?.offer);
  const event = req.body?.event === 'checkout' ? 'checkoutClicks' : req.body?.event === 'view' ? 'views' : null;
  if (!event) return res.json({ ok: false });
  const key = clientIp(req) + '|' + offer + '|' + event;
  const last = trackSeen.get(key) || 0;
  if (Date.now() - last < 6 * 60 * 60 * 1000) return res.json({ ok: true, counted: false });
  trackSeen.set(key, Date.now());
  try {
    await bump(offer, event);
  } catch (e: unknown) {
    console.error('[track] failed:', (e as Error)?.message);
  }
  return res.json({ ok: true, counted: true });
});

// Kitchen Check split test: the kitchen-check.ai.studio page sends beacons here (text/plain, any origin).
const KC_OFFERS = ['a', 'b'];
app.post('/api/kc-track', express.text({ type: '*/*', limit: '2kb' }), async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  let body: { offer?: string; event?: string } = {};
  try {
    body = JSON.parse(typeof req.body === 'string' ? req.body : '{}');
  } catch {
    return res.json({ ok: false });
  }
  const offer = typeof body.offer === 'string' && KC_OFFERS.includes(body.offer) ? body.offer : null;
  const field = body.event === 'view' ? 'views' : body.event === 'demo' ? 'demos' : body.event === 'checkout' ? 'checkoutClicks' : null;
  if (!offer || !field) return res.json({ ok: false });
  const key = clientIp(req) + '|kc|' + offer + '|' + field;
  const last = trackSeen.get(key) || 0;
  if (Date.now() - last < 6 * 60 * 60 * 1000) return res.json({ ok: true, counted: false });
  trackSeen.set(key, Date.now());
  try {
    await bump('kc_' + offer, field);
  } catch (e: unknown) {
    console.error('[kc-track] failed:', (e as Error)?.message);
  }
  return res.json({ ok: true, counted: true });
});

app.post('/api/demo-request', async (req: Request, res: Response) => {
  const b = req.body || {};
  const str = (x: unknown, max: number) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
  const name = str(b.name, 80);
  const company = str(b.company, 120);
  const email = str(b.email, 160).toLowerCase();
  const phone = str(b.phone, 40);
  const trade = str(b.trade, 60);
  const offer = cleanOffer(b.offer);
  if (!name || !company) return res.json({ ok: false, error: 'Please enter your name and company.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.json({ ok: false, error: 'Please enter a valid email address.' });

  const ip = clientIp(req);
  const d = demoByIp.get(ip);
  if (d && d.day === today() && d.count >= 3) {
    return res.json({ ok: false, error: 'Too many demo requests from this connection today. Please try again tomorrow.' });
  }

  try {
    const leadId = crypto.createHash('sha256').update(email).digest('hex').slice(0, 32);
    const leadRef = db().collection(LEADS).doc(leadId);
    const existing = await leadRef.get();
    let code: string | null = null;
    if (existing.exists) {
      const prev = existing.data() as { code?: string };
      if (prev.code) {
        const problem = await checkInvite(prev.code);
        if (!problem) code = prev.code; // still unused: give the same code back
        else if (problem === USED_MSG) {
          return res.json({
            ok: false,
            alreadyUsed: true,
            error: 'You have already used your free demo with this email. Pick a plan below or contact Ecentra Concierge.',
          });
        }
      }
    }
    if (!code) {
      for (let i = 0; i < 5 && !code; i++) {
        const c = newCode();
        const now = Date.now();
        try {
          await db().collection(INVITES).doc(c).create({
            createdAt: now,
            expiresAt: now + INVITE_TTL_MS,
            maxUses: INVITE_MAX_USES,
            uses: 0,
            note: company,
            kind: 'demo',
            source: 'sales-page',
            offer,
          });
          code = c;
        } catch (e: unknown) {
          if ((e as { code?: number })?.code !== 6) throw e;
        }
      }
      if (!code) return res.json({ ok: false, error: 'Could not create your demo. Please try again.' });
      await leadRef.set(
        { name, company, email, phone, trade, offer, code, createdAt: Date.now(), ip },
        { merge: true }
      );
      bump(offer, 'demos').catch(() => {});
    }
    demoByIp.set(ip, { count: (d && d.day === today() ? d.count : 0) + 1, day: today() });
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { expires: Date.now() + SESSION_TTL_MS, day: today(), count: 0, role: 'invite', code });
    return res.json({ ok: true, token, role: 'invite', code });
  } catch (e: unknown) {
    console.error('[demo-request] failed:', (e as Error)?.message);
    return res.json({ ok: false, error: 'Demos are not available right now. Please try again later.' });
  }
});

// Owner only: split-test results + recent sales-page leads.
app.post('/api/owner/results', async (req: Request, res: Response) => {
  const s = getSession(req);
  if (!s || s.role !== 'owner') return res.json({ ok: false, error: 'Owner only.' });
  try {
    const stats: Record<string, { views: number; demos: number; checkoutClicks: number }> = {};
    for (const o of OFFERS) {
      const snap = await db().collection(STATS).doc(o).get();
      const x = (snap.exists ? snap.data() : {}) as { views?: number; demos?: number; checkoutClicks?: number };
      stats[o] = { views: x.views || 0, demos: x.demos || 0, checkoutClicks: x.checkoutClicks || 0 };
    }
    for (const o of KC_OFFERS) {
      const snap = await db().collection(STATS).doc('kc_' + o).get();
      const x = (snap.exists ? snap.data() : {}) as { views?: number; demos?: number; checkoutClicks?: number };
      stats['kc_' + o] = { views: x.views || 0, demos: x.demos || 0, checkoutClicks: x.checkoutClicks || 0 };
    }
    const leadSnap = await db().collection(LEADS).orderBy('createdAt', 'desc').limit(30).get();
    const leads = leadSnap.docs.map((doc) => {
      const x = doc.data() as Record<string, unknown>;
      return {
        name: x.name, company: x.company, email: x.email, phone: x.phone, trade: x.trade,
        offer: x.offer, code: x.code, createdAt: x.createdAt,
      };
    });
    let kcLeads: Record<string, unknown>[] = [];
    try {
      const kcSnap = await db().collection('kc_leads').orderBy('createdAt', 'desc').limit(30).get();
      kcLeads = kcSnap.docs.map((doc) => {
        const x = doc.data() as Record<string, unknown>;
        return { name: x.name, company: x.company, email: x.email, phone: x.phone, offer: x.offer, createdAt: x.createdAt };
      });
    } catch (e: unknown) {
      console.error('[owner/results] kc leads failed:', (e as Error)?.message);
    }
    return res.json({ ok: true, stats, leads, kcLeads });
  } catch (e: unknown) {
    console.error('[owner/results] failed:', (e as Error)?.message);
    return res.json({ ok: false, error: 'Results are not available right now.' });
  }
});

// Health / Status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const hasGemini = Boolean(geminiKey && geminiKey.length > 5 && !geminiKey.includes('MY_GEMINI_API_KEY'));
  const hasOpenai = Boolean(openaiKey && openaiKey.length > 5);

  res.json({
    status: hasGemini || hasOpenai ? 'ready' : 'awaiting_activation',
    providers: {
      gemini: {
        configured: hasGemini,
        model: 'gemini-3.1-flash-image',
      },
      openai: {
        configured: hasOpenai,
        model: 'dall-e-3 / images.edit',
      },
    },
    activeEngine: hasGemini ? 'Google Gemini AI' : hasOpenai ? 'OpenAI' : 'None (Awaiting activation)',
  });
});

// Image Generation Endpoint
app.post('/api/generate-makeover', async (req: Request, res: Response) => {
  try {
    const session = getSession(req);
    if (!session) {
      // Sent as 200 because the AI Studio preview replaces error responses with its own page.
      return res.json({ ok: false, authRequired: true, error: 'Please enter your access passcode.' });
    }
    if (session.count >= DAILY_CAP) {
      return res.json({ ok: false, error: `Daily limit reached (${DAILY_CAP} makeovers). Please try again tomorrow.` });
    }

    const { image, mimeType = 'image/jpeg', selections } = req.body as {
      image: string;
      mimeType?: string;
      selections: MakeoverSelections;
    };

    if (!image) {
      return res.json({ ok: false,  error: 'Original image is required.' });
    }

    if (!selections) {
      return res.json({ ok: false,  error: 'Makeover selections are required.' });
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    const hasGemini = Boolean(geminiKey && geminiKey.length > 5 && !geminiKey.includes('MY_GEMINI_API_KEY'));
    const hasOpenai = Boolean(openaiKey && openaiKey.length > 5);

    // If neither AI provider is connected yet, return clear guidance
    if (!hasGemini && !hasOpenai) {
      return res.json({ ok: false, 
        awaitingActivation: true,
        error: 'AI backend awaiting activation',
        message:
          'No AI provider API key found in server environment. To activate live generation, add your GEMINI_API_KEY in the Secrets panel or provide OPENAI_API_KEY.',
      });
    }

    // Invite codes: use up the code's one makeover now; give it back if the makeover fails.
    if (session.role === 'invite' && session.code) {
      let problem: string | null;
      try {
        problem = await consumeInvite(session.code);
      } catch (e: unknown) {
        console.error('[invites] consume failed:', (e as Error)?.message);
        return res.json({ ok: false, error: 'Invite codes are not available right now. Please try again later.' });
      }
      if (problem) return res.json({ ok: false, inviteUsed: true, error: problem });
      const code = session.code;
      let refunded = false;
      const sendJson = res.json.bind(res);
      res.json = ((body: { success?: boolean }) => {
        if (!refunded && !(body && body.success)) {
          refunded = true;
          refundInvite(code).catch((e: Error) => console.error('[invites] refund failed:', e?.message));
        }
        return sendJson(body);
      }) as typeof res.json;
    }

    session.count++;
    const { systemPrompt, userPrompt, changesSummary } = buildMakeoverPrompt(selections);

    // Strip data URL header if present
    const base64Data = image.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    if (hasGemini && geminiKey) {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Execute generation with Gemini image model
      // Using gemini-3.1-flash-image for high-fidelity architectural exterior rendering
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '4:3',
            imageSize: '1K',
          },
        },
      });

      let generatedBase64: string | null = null;
      let textFeedback: string | null = null;

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            generatedBase64 = part.inlineData.data;
            break;
          } else if (part.text) {
            textFeedback = part.text;
          }
        }
      }

      if (generatedBase64) {
        return res.json({
          success: true,
          image: `data:image/png;base64,${generatedBase64}`,
          engine: 'Google Gemini (gemini-3.1-flash-image)',
          changesSummary,
          timestamp: new Date().toISOString(),
        });
      }

      // If model returned text instead of inlineData, check if another candidate or retry
      if (textFeedback) {
        return res.json({ ok: false, 
          error: 'The AI model provided architectural instructions but did not return a rendered image.',
          details: textFeedback,
        });
      }

      return res.json({ ok: false, 
        error: 'Unable to parse generated image from model response.',
      });
    }

    // Fallback: If OpenAI key is provided
    if (hasOpenai && openaiKey) {
      // In production OpenAI image editing, we can call images.generate or images.edit
      const openAiRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `High-end architectural exterior photo makeover preserving exact house shape: ${userPrompt}`,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      });

      if (!openAiRes.ok) {
        const errJson = await openAiRes.json().catch(() => ({}));
        return res.json({ ok: false, 
          error: 'OpenAI API error',
          details: errJson,
        });
      }

      const openAiData = (await openAiRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
      const b64 = openAiData.data?.[0]?.b64_json;
      if (b64) {
        return res.json({
          success: true,
          image: `data:image/png;base64,${b64}`,
          engine: 'OpenAI DALL-E-3',
          changesSummary,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return res.json({ ok: false,  error: 'Failed to generate makeover.' });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in /api/generate-makeover:', error);
    return res.json({ ok: false, 
      error: 'Generation failed on server.',
      message: error.message || 'Unknown error occurred.',
    });
  }
});

// Start Vite in dev mode or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`See It Finished server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
