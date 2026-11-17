import express, { type NextFunction, type Request, type Response } from 'express';
import { createHmac, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { hashPassword, secretEqual, sessionToken, tokenHash, verifyPassword } from './auth.js';
import { PostgresAnalyticsStore } from './store.js';
import { CAMPAIGNS, contentFor, safePath, safeReferrer, siteOfHost } from './catalog.js';
import {
  EVENTS,
  reportRange,
  type AnalyticsSite,
  type AnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsStore,
  type Owner,
} from './types.js';

export interface AnalyticsOptions {
  store?: AnalyticsStore;
  databaseUrl?: string;
  ownerEmail?: string;
  setupToken?: string;
  hashSecret?: string;
  origin?: string;
  externalOrigin?: string;
  production?: boolean;
  serveWeb?: boolean;
}

const SOURCES = new Set([
  'facebook',
  'instagram',
  'linkedin',
  'tiktok',
  'whatsapp',
  'github',
  'google',
  'bing',
  'duckduckgo',
  'direct',
  'referral',
  'other',
  'unknown',
]);
const PROJECTS = new Set(['careiq', 'care-iq', 'neon-drift', 'gen-ui']);
const SECTIONS = new Set(['work', 'about', 'life']);
const MODES = new Set(['day', 'night', '2d', '3d']);
const TARGETS = new Set([
  'linkedin',
  'instagram',
  'github',
  'website',
  'email',
  'portfolio',
  'lab',
  'toolbox',
]);
const MEDIA = new Set(['social', 'messaging', 'referral', 'direct', 'organic', 'unknown']);
const VISITOR_ID = /^[A-Za-z0-9_-]{16,96}$/;
const SESSION_AGE_MS = 8 * 60 * 60 * 1000;
const COOKIE_DOMAINLESS = '__Host-analytics';
const DUMMY_HASH =
  'scrypt$32768$8$1$64c68bcde4965c08649277813cd0ebf9$1c3b33c334a0d48ac4053071da9f3a57f520b9f2c5a4120de19add4d9719b8d7e4cc1971369d13fe02891203f90b50b07731cfd940bc3cab800d96c39f4f2db1';

function responseError(response: Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

function normalizedOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

function parseCookie(request: Request, cookieName: string) {
  const raw = request.headers.cookie;
  if (!raw || raw.length > 4096) return null;
  for (const item of raw.split(';')) {
    const [name, value] = item.trim().split('=');
    if (name === cookieName && value && /^[A-Za-z0-9_-]{43}$/.test(value)) return value;
  }
  return null;
}

function classification(userAgent: string): AnalyticsEvent['device'] {
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return 'tablet';
  if (/mobi|iphone|android/i.test(userAgent)) return 'mobile';
  if (/windows|macintosh|linux|x11/i.test(userAgent)) return 'desktop';
  return 'other';
}

export function createAnalytics(options: AnalyticsOptions = {}) {
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  const ownerEmail = (options.ownerEmail ?? process.env.ANALYTICS_OWNER_EMAIL ?? '')
    .trim()
    .toLowerCase();
  const setupToken = options.setupToken ?? process.env.ANALYTICS_SETUP_TOKEN ?? '';
  const hashSecret = options.hashSecret ?? process.env.ANALYTICS_HASH_SECRET ?? '';
  const origin = normalizedOrigin(
    options.origin ?? process.env.ANALYTICS_ORIGIN ?? 'https://analytics.kristiansalmeron.com',
  );
  const externalOrigin = normalizedOrigin(
    options.externalOrigin ?? process.env.RENDER_EXTERNAL_URL,
  );
  const configured = !!(
    ownerEmail &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail) &&
    setupToken.length >= 32 &&
    hashSecret.length >= 32 &&
    origin
  );
  const store =
    options.store ?? (databaseUrl ? new PostgresAnalyticsStore(databaseUrl) : undefined);
  const router = express.Router();
  const cookieName = production ? COOKIE_DOMAINLESS : 'analytics_session';
  const authOrigins = new Set([origin, externalOrigin].filter((value): value is string => !!value));
  const collectOrigins = new Set([
    'https://kristiansalmeron.com',
    'https://www.kristiansalmeron.com',
    'https://lab.kristiansalmeron.com',
    'https://toolbox.kristiansalmeron.com',
    ...authOrigins,
  ]);
  const collectLimits = new Map<string, { count: number; expiresAt: number }>();
  let cleanupAt = 0;
  let cleanupRunning = false;

  const hash = (kind: string, value: string) =>
    createHmac('sha256', hashSecret).update(`${kind}:${value}`).digest('hex');
  const isDevelopmentOrigin = (value: string | undefined) => {
    if (production || !value) return false;
    try {
      const u = new URL(value);
      return u.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(u.hostname);
    } catch {
      return false;
    }
  };
  const acceptsOrigin = (request: Request, origins: Set<string>) => {
    const header = request.get('origin');
    return !!header && (origins.has(header) || isDevelopmentOrigin(header));
  };
  const acceptsAuthOrigin = (request: Request) => {
    const header = request.get('origin');
    if (!header) return false;
    if (authOrigins.has(header)) return true;
    return (
      isDevelopmentOrigin(header) && normalizedOrigin(header) === `http://${request.get('host')}`
    );
  };

  const noStore = (_request: Request, response: Response, next: NextFunction) => {
    response.set({
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'",
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    if (production) response.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  };

  async function ready() {
    if (!store || !configured) throw new Error('Analytics is not configured.');
    await store.ready();
    if (!cleanupRunning && Date.now() > cleanupAt) {
      cleanupRunning = true;
      cleanupAt = Date.now() + 60 * 60 * 1000;
      store
        .cleanup()
        .catch(() => console.error('Analytics retention cleanup failed.'))
        .finally(() => {
          cleanupRunning = false;
        });
    }
  }

  async function ownerFor(request: Request): Promise<Owner | null> {
    const token = parseCookie(request, cookieName);
    return token && store ? store.getSession(tokenHash(token)) : null;
  }

  async function setSession(request: Request, response: Response, expectedPasswordHash: string) {
    const token = sessionToken();
    const created = await store!.createSession(
      tokenHash(token),
      new Date(Date.now() + SESSION_AGE_MS),
      expectedPasswordHash,
    );
    if (!created) return false;
    const previous = parseCookie(request, cookieName);
    if (previous) await store!.deleteSession(tokenHash(previous));
    response.cookie(cookieName, token, {
      httpOnly: true,
      secure: production,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_AGE_MS,
    });
    return true;
  }

  router.use(['/api/analytics', '/analytics-assets', '/'], noStore);

  const requireReady = async (_request: Request, response: Response, next: NextFunction) => {
    try {
      await ready();
      next();
    } catch {
      responseError(
        response,
        503,
        'ANALYTICS_UNAVAILABLE',
        'Analytics is not available yet. Please try again shortly.',
      );
    }
  };
  const requireOwner = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const owner = await ownerFor(request);
      if (!owner) {
        responseError(response, 401, 'SIGN_IN_REQUIRED', 'Please sign in to view your analytics.');
        return;
      }
      response.locals.analyticsOwner = owner;
      next();
    } catch {
      responseError(
        response,
        503,
        'ANALYTICS_UNAVAILABLE',
        'Analytics is temporarily unavailable.',
      );
    }
  };
  const requireMutationOrigin = (request: Request, response: Response, next: NextFunction) => {
    if (!acceptsAuthOrigin(request)) {
      responseError(response, 403, 'ORIGIN_NOT_ALLOWED', 'This request is not allowed.');
      return;
    }
    if (!request.is('application/json')) {
      responseError(response, 415, 'JSON_REQUIRED', 'Send a JSON request.');
      return;
    }
    next();
  };
  const authJSON = express.json({ limit: '4kb', strict: true });

  router.get('/api/analytics/auth', requireReady, async (request, response) => {
    const owner = await ownerFor(request);
    if (owner) {
      response.json({ authenticated: true, setupRequired: false, email: owner.email });
      return;
    }
    response.json({ authenticated: false, setupRequired: !(await store!.getOwner()) });
  });

  router.post(
    '/api/analytics/setup',
    requireReady,
    requireMutationOrigin,
    authJSON,
    async (request, response) => {
      const allowed = await store!.consumeRateLimit(
        hash('setup-ip', request.ip ?? request.socket.remoteAddress ?? ''),
        5,
        15 * 60_000,
      );
      if (!allowed) {
        response.set('Retry-After', '900');
        responseError(
          response,
          429,
          'TRY_LATER',
          'Too many attempts. Please try again in 15 minutes.',
        );
        return;
      }
      if (await store!.getOwner()) {
        responseError(response, 409, 'SETUP_COMPLETE', 'Owner setup has already been completed.');
        return;
      }
      const token = typeof request.body?.token === 'string' ? request.body.token : '';
      const password = typeof request.body?.password === 'string' ? request.body.password : '';
      if (token.length > 256 || !secretEqual(token, setupToken)) {
        responseError(response, 403, 'SETUP_NOT_ALLOWED', 'This setup code is invalid.');
        return;
      }
      if (password.length < 14 || password.length > 128) {
        responseError(
          response,
          400,
          'PASSWORD_LENGTH',
          'Choose a password containing 14 to 128 characters.',
        );
        return;
      }
      const passwordHash = await hashPassword(password);
      const created = await store!.createOwner({
        email: ownerEmail,
        passwordHash,
      });
      if (!created) {
        responseError(response, 409, 'SETUP_COMPLETE', 'Owner setup has already been completed.');
        return;
      }
      if (!(await setSession(request, response, passwordHash))) {
        responseError(response, 401, 'SIGN_IN_FAILED', 'The email or password is incorrect.');
        return;
      }
      response.status(201).json({ authenticated: true, email: ownerEmail });
    },
  );

  router.post(
    '/api/analytics/login',
    requireReady,
    requireMutationOrigin,
    authJSON,
    async (request, response) => {
      const allowed = await store!.consumeRateLimit(
        hash('login-ip', request.ip ?? request.socket.remoteAddress ?? ''),
        8,
        15 * 60_000,
      );
      if (!allowed) {
        response.set('Retry-After', '900');
        responseError(
          response,
          429,
          'TRY_LATER',
          'Too many sign-in attempts. Please try again in 15 minutes.',
        );
        return;
      }
      const email =
        typeof request.body?.email === 'string'
          ? request.body.email.trim().toLowerCase().slice(0, 254)
          : '';
      const password = typeof request.body?.password === 'string' ? request.body.password : '';
      if (password.length < 1 || password.length > 128) {
        responseError(response, 401, 'SIGN_IN_FAILED', 'The email or password is incorrect.');
        return;
      }
      const owner = await store!.getOwner();
      const validPassword = await verifyPassword(password, owner?.passwordHash ?? DUMMY_HASH);
      if (!owner || !validPassword || !secretEqual(email, owner.email)) {
        responseError(response, 401, 'SIGN_IN_FAILED', 'The email or password is incorrect.');
        return;
      }
      if (!(await setSession(request, response, owner.passwordHash))) {
        responseError(response, 401, 'SIGN_IN_FAILED', 'The email or password is incorrect.');
        return;
      }
      response.json({ authenticated: true, email: owner.email });
    },
  );

  router.post(
    '/api/analytics/logout',
    requireReady,
    requireMutationOrigin,
    authJSON,
    requireOwner,
    async (request, response) => {
      const token = parseCookie(request, cookieName);
      if (token) await store!.deleteSession(tokenHash(token));
      response.clearCookie(cookieName, {
        httpOnly: true,
        secure: production,
        sameSite: 'strict',
        path: '/',
      });
      response.json({ authenticated: false });
    },
  );

  router.get('/api/analytics/overview', requireReady, requireOwner, async (request, response) => {
    const days = Number(request.query.days ?? '7');
    if (![7, 30, 90].includes(days)) {
      responseError(response, 400, 'INVALID_RANGE', 'Choose 7, 30, or 90 days.');
      return;
    }
    response.json(await store!.overview(days));
  });

  function collectorCORS(request: Request, response: Response, next: NextFunction) {
    response.vary('Origin');
    if (!acceptsOrigin(request, collectOrigins)) {
      responseError(response, 403, 'ORIGIN_NOT_ALLOWED', 'This request is not allowed.');
      return;
    }
    response.set({
      'Access-Control-Allow-Origin': request.get('origin')!,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Expose-Headers': 'Retry-After',
    });
    next();
  }

  router.options('/api/analytics/collect', collectorCORS, (_request, response) => {
    response.sendStatus(204);
  });
  router.post(
    '/api/analytics/collect',
    collectorCORS,
    requireReady,
    express.text({ type: ['text/plain', 'application/json'], limit: '4kb' }),
    async (request, response) => {
      if (await ownerFor(request)) {
        response.sendStatus(204);
        return;
      }
      const agent = request.get('user-agent') ?? '';
      // Real WhatsApp in-app browsers can include “WhatsApp” in their user agent.
      // Only its engine-less link fetcher is a preview rather than a person visiting.
      const isBot =
        /bot|spider|crawl|headless|facebookexternalhit|slurp|preview|curl|wget/i.test(agent) ||
        (/whatsapp/i.test(agent) && !/applewebkit|gecko|chrome|safari/i.test(agent));
      if (
        isBot ||
        request.get('sec-gpc') === '1' ||
        request.get('dnt') === '1' ||
        /(?:^|;)\s*ks_analytics_opt_out=1(?:;|$)/.test(request.headers.cookie ?? '')
      ) {
        response.sendStatus(204);
        return;
      }
      const key = hash('collector-ip', request.ip ?? request.socket.remoteAddress ?? '');
      const current = collectLimits.get(key);
      const limit =
        current && current.expiresAt > Date.now()
          ? current
          : { count: 0, expiresAt: Date.now() + 60_000 };
      limit.count += 1;
      collectLimits.set(key, limit);
      if (collectLimits.size > 10_000) {
        for (const [entryKey, entry] of collectLimits)
          if (entry.expiresAt <= Date.now()) collectLimits.delete(entryKey);
        if (collectLimits.size > 10_000) collectLimits.delete(collectLimits.keys().next().value!);
      }
      if (limit.count > 120) {
        response.set('Retry-After', '60');
        response.sendStatus(429);
        return;
      }
      let body: Record<string, unknown>;
      try {
        const parsed = typeof request.body === 'string' ? JSON.parse(request.body) : null;
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
        body = parsed;
      } catch {
        responseError(response, 400, 'INVALID_EVENT', 'This event is invalid.');
        return;
      }
      if (
        typeof body.event !== 'string' ||
        !EVENTS.includes(body.event as AnalyticsEventName) ||
        typeof body.visitorId !== 'string' ||
        !VISITOR_ID.test(body.visitorId) ||
        typeof body.sessionId !== 'string' ||
        !VISITOR_ID.test(body.sessionId) ||
        (body.eventId !== undefined &&
          (typeof body.eventId !== 'string' || !VISITOR_ID.test(body.eventId)))
      ) {
        responseError(response, 400, 'INVALID_EVENT', 'This event is invalid.');
        return;
      }
      const version = body.schemaVersion ?? 1;
      const originSite = siteOfHost(new URL(request.get('origin')!).hostname);
      const isV2 = version === 2;
      const site =
        originSite ??
        (isDevelopmentOrigin(request.get('origin')) &&
        ['portfolio', 'lab', 'toolbox'].includes(String(body.site))
          ? (body.site as AnalyticsSite)
          : null);
      const newEvents = [
        'page_engagement',
        'scroll_depth',
        'experiment_open',
        'tool_open',
        'tool_action',
      ];
      if (
        ![1, 2].includes(Number(version)) ||
        (version !== 1 && version !== 2) ||
        (!isV2 &&
          (newEvents.includes(body.event as string) ||
            (originSite && originSite !== 'portfolio'))) ||
        (isV2 &&
          (!site ||
            body.site !== site ||
            typeof body.eventId !== 'string' ||
            typeof body.pageId !== 'string' ||
            !VISITOR_ID.test(body.pageId) ||
            (body.previousPageId !== undefined &&
              body.previousPageId !== '' &&
              (typeof body.previousPageId !== 'string' || !VISITOR_ID.test(body.previousPageId))) ||
            !['shared', 'local'].includes(String(body.visitScope))))
      ) {
        responseError(response, 400, 'INVALID_EVENT_CONTEXT', 'This event context is invalid.');
        return;
      }
      const now = Date.now();
      let occurredAt = new Date(now);
      if (body.occurredAt !== undefined) {
        const candidate =
          typeof body.occurredAt === 'string' &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(body.occurredAt)
            ? new Date(body.occurredAt)
            : new Date(NaN);
        const timestamp = candidate.getTime();
        // Preserve queued event time, with a short transit/clock grace beyond the
        // browser's 24-hour outbox TTL. Never let a client's clock create future data.
        if (
          !Number.isFinite(timestamp) ||
          candidate.toISOString() !== body.occurredAt ||
          timestamp < now - (24 * 60 + 5) * 60_000 ||
          timestamp > now + 5 * 60_000
        ) {
          responseError(response, 400, 'INVALID_EVENT_TIME', 'This event timestamp is invalid.');
          return;
        }
        occurredAt = new Date(Math.min(timestamp, now));
      }
      const path = safePath(site ?? 'portfolio', body.path);
      const valueFrom = (name: string, allow: Set<string>, fallback = '') =>
        typeof body[name] === 'string' && allow.has(body[name] as string)
          ? (body[name] as string)
          : fallback;
      const campaign =
        typeof body.campaign === 'string' && CAMPAIGNS.has(body.campaign) ? body.campaign : '';
      const content = isV2 ? contentFor(site!, path) : '';
      const validDepth =
        [25, 50, 75, 100].includes(Number(body.scrollDepth)) &&
        typeof body.scrollDepth === 'number';
      const validActive =
        typeof body.activeMs === 'number' &&
        Number.isInteger(body.activeMs) &&
        body.activeMs >= 0 &&
        body.activeMs <= 86_400_000;
      if (
        isV2 &&
        ((body.activeMs !== undefined && !validActive) ||
          (body.scrollDepth !== undefined && !validDepth) ||
          (body.event === 'page_engagement' && !validActive) ||
          (body.event === 'scroll_depth' && !validDepth) ||
          (body.event === 'experiment_open' &&
            (site !== 'lab' || content !== 'pdf-rendering' || body.content !== content)) ||
          (['tool_open', 'tool_action'].includes(body.event as string) &&
            (site !== 'toolbox' || content !== 'prompt-builder' || body.content !== content)) ||
          (body.event === 'tool_action' && body.action !== 'generate'))
      ) {
        responseError(response, 400, 'INVALID_MEASUREMENT', 'This measurement is invalid.');
        return;
      }
      const destinationSite =
        isV2 &&
        ['portfolio', 'lab', 'toolbox'].includes(String(body.destinationSite)) &&
        body.event === 'outbound_click' &&
        body.target === body.destinationSite
          ? (body.destinationSite as AnalyticsSite)
          : '';
      const day = reportRange(1, occurredAt).end;
      const scope = isV2 && body.visitScope === 'local' ? `:${site}` : '';
      const event: AnalyticsEvent = {
        eventId: typeof body.eventId === 'string' ? body.eventId : randomUUID(),
        event: body.event as AnalyticsEventName,
        path,
        referrer: safeReferrer(body.referrer),
        source: valueFrom('source', SOURCES, isV2 ? 'unknown' : 'direct'),
        medium: valueFrom('medium', MEDIA, isV2 ? 'unknown' : 'direct'),
        campaign,
        visitorHash: hash(isV2 ? `visitor-v2:${day}${scope}` : 'visitor', body.visitorId),
        sessionHash: hash(isV2 ? `session-v2:${day}${scope}` : 'session', body.sessionId),
        project: valueFrom('project', PROJECTS),
        section: valueFrom('section', SECTIONS),
        mode: valueFrom('mode', MODES),
        target: valueFrom('target', TARGETS) || valueFrom('destination', TARGETS),
        device: classification(agent),
        occurredAt,
        receivedAt: new Date(now),
        schemaVersion: isV2 ? 2 : 1,
        site: site ?? 'portfolio',
        pageHash: isV2 ? hash('page', body.pageId as string) : '',
        previousPageHash:
          isV2 && body.previousPageId ? hash('page', body.previousPageId as string) : '',
        visitScope: isV2 && body.visitScope === 'shared' ? 'shared' : 'local',
        activeMs: isV2 && body.event === 'page_engagement' ? (body.activeMs as number) : null,
        scrollDepth:
          isV2 && ['page_engagement', 'scroll_depth'].includes(body.event as string) && validDepth
            ? (body.scrollDepth as 25 | 50 | 75 | 100)
            : null,
        content: isV2
          ? content ||
            (site === 'portfolio' &&
            ['project_open', 'project_preview_open'].includes(body.event as string)
              ? valueFrom('project', PROJECTS)
              : '')
          : '',
        action: isV2 && body.event === 'tool_action' ? 'generate' : '',
        destinationSite,
        destinationPath: destinationSite ? safePath(destinationSite, body.destinationPath) : '',
      };
      await store!.insertEvent(event);
      response.sendStatus(204);
    },
  );

  // The application shell and static assets contain no analytics data or credentials.
  // Every reporting endpoint above independently verifies the owner session.
  if (options.serveWeb !== false) {
    const web = fileURLToPath(new URL('./web/', import.meta.url));
    const serveFile =
      (filename: string) => (_request: Request, response: Response, next: NextFunction) => {
        // Keep the fixed filename relative to an explicit root. Absolute filenames can
        // otherwise be rejected when this checkout lives below a hidden .codex folder.
        response.sendFile(
          filename,
          { root: web, cacheControl: false },
          (error?: Error & { status?: number }) => {
            if (!error) return;
            if (error.status === 404 && !response.headersSent) {
              responseError(response, 404, 'NOT_FOUND', 'This dashboard file does not exist.');
              return;
            }
            next(error);
          },
        );
      };
    router.get('/analytics-assets/app.js', serveFile('app.js'));
    router.get('/analytics-assets/tracker.js', serveFile('tracker.js'));
    router.get('/analytics-assets/styles.css', serveFile('styles.css'));
    router.get(['/', '/login', '/login/'], serveFile('index.html'));
    router.use('/analytics-assets', (_request, response) => {
      responseError(response, 404, 'NOT_FOUND', 'This dashboard file does not exist.');
    });
  }

  router.use('/api/analytics', (_request, response) => {
    responseError(response, 404, 'NOT_FOUND', 'This analytics endpoint does not exist.');
  });
  router.use(
    (
      error: { status?: number; type?: string },
      _request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      if (response.headersSent) {
        next(error);
        return;
      }
      if (error.status === 413) {
        responseError(response, 413, 'REQUEST_TOO_LARGE', 'This request is too large.');
        return;
      }
      if (error.status === 400) {
        responseError(response, 400, 'INVALID_REQUEST', 'This request is invalid.');
        return;
      }
      console.error('Analytics request failed.');
      responseError(
        response,
        503,
        'ANALYTICS_UNAVAILABLE',
        'Analytics is temporarily unavailable.',
      );
    },
  );

  return {
    router,
    ready,
    configured: !!(configured && store),
    close: async () => {
      await store?.close();
    },
  };
}
