/** Anonymous, first-party portfolio measurement. No fingerprinting or personal URL data. */
import { createAnalyticsOutbox } from './analytics-outbox';
export const ANALYTICS_OPT_OUT_KEY = 'ks_analytics_opt_out';
const VISITOR_KEY = 'ks_analytics_visitor_v1';
const SESSION_KEY = 'ks_analytics_session_v1';
const SESSION_IDLE_MS = 30 * 60 * 1000;
const SOCIAL_SOURCES = [
  'facebook',
  'instagram',
  'linkedin',
  'tiktok',
  'whatsapp',
  'github',
] as const;
type SocialSource = (typeof SOCIAL_SOURCES)[number];
type Source = SocialSource | 'google' | 'bing' | 'duckduckgo' | 'direct' | 'referral' | 'other';
type Medium = 'social' | 'messaging' | 'organic' | 'direct' | 'referral';
export type AnalyticsEventName =
  | 'pageview'
  | 'project_open'
  | 'project_preview_open'
  | 'studio_section_open'
  | 'outbound_click'
  | 'studio_ready'
  | 'studio_fallback';
export type AnalyticsProperties = {
  project?: 'careiq' | 'gen-ui' | 'neon-drift';
  section?: 'work' | 'about' | 'life';
  target?: 'linkedin' | 'instagram' | 'github' | 'website';
  mode?: 'day' | 'night' | '2d' | '3d';
};
type Attribution = { source: Source; medium: Medium; campaign: string; referrer: string };
export type AnalyticsPayload = AnalyticsProperties &
  Attribution & {
    eventId: string;
    occurredAt: string;
    event: AnalyticsEventName;
    path: string;
    visitorId: string;
    sessionId: string;
  };
type SafeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type AnalyticsEnvironment = {
  location: () => string;
  referrer: () => string;
  now: () => number;
  randomId: () => string;
  privacy: () => { globalPrivacyControl?: boolean; doNotTrack?: string | null };
  local?: SafeStorage;
  session?: SafeStorage;
  replaceUrl: (path: string) => void;
  send: (payload: AnalyticsPayload) => void;
};
type Session = Attribution & { id: string; updatedAt: number };

function read(storage: SafeStorage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function write(storage: SafeStorage | undefined, key: string, value: string | null) {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Disabled browser storage only reduces count accuracy; never block the portfolio.
  }
}
function parse(value: string | null): unknown {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
function hostOf(value: string): string {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.hostname.toLowerCase() : '';
  } catch {
    return '';
  }
}
function isHost(host: string, domain: string) {
  return host === domain || host.endsWith('.' + domain);
}
export function safeCampaign(value: string | null): string {
  return value && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value) ? value : '';
}
export function analyticsDay(now: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function resolveAttribution(location: string, referrer: string): Attribution {
  const url = new URL(location);
  const tagged = url.searchParams.get('utm_source')?.toLowerCase();
  const referringHost = hostOf(referrer);
  const campaign = safeCampaign(url.searchParams.get('utm_campaign'));
  if (SOCIAL_SOURCES.includes(tagged as SocialSource)) {
    const source = tagged as SocialSource;
    return {
      source,
      medium: source === 'whatsapp' ? 'messaging' : 'social',
      campaign,
      referrer: referringHost,
    };
  }
  const sources: [string, Source][] = [
    ['facebook.com', 'facebook'],
    ['fb.com', 'facebook'],
    ['instagram.com', 'instagram'],
    ['linkedin.com', 'linkedin'],
    ['tiktok.com', 'tiktok'],
    ['whatsapp.com', 'whatsapp'],
    ['wa.me', 'whatsapp'],
    ['github.com', 'github'],
    ['google.com', 'google'],
    ['bing.com', 'bing'],
    ['duckduckgo.com', 'duckduckgo'],
  ];
  const source = sources.find(([host]) => isHost(referringHost, host))?.[1];
  if (source) {
    const medium =
      source === 'whatsapp'
        ? 'messaging'
        : ['google', 'bing', 'duckduckgo'].includes(source)
          ? 'organic'
          : 'social';
    return { source, medium, campaign, referrer: referringHost };
  }
  if (!referringHost || isHost(referringHost, 'kristiansalmeron.com'))
    return { source: 'direct', medium: 'direct', campaign, referrer: '' };
  return { source: 'referral', medium: 'referral', campaign, referrer: referringHost };
}
export function createAnalyticsTracker(environment: AnalyticsEnvironment) {
  const env = environment;
  const initialUrl = new URL(env.location());
  const preference = initialUrl.searchParams.get('analytics_opt_out');
  let optedOut = read(env.local, ANALYTICS_OPT_OUT_KEY) === 'true';
  let notice: string | null = null;
  if (preference === '1' || preference === '0') {
    optedOut = preference === '1';
    write(env.local, ANALYTICS_OPT_OUT_KEY, optedOut ? 'true' : null);
    if (optedOut) {
      write(env.local, VISITOR_KEY, null);
      write(env.session, SESSION_KEY, null);
    }
    initialUrl.searchParams.delete('analytics_opt_out');
    env.replaceUrl(initialUrl.pathname + initialUrl.search + initialUrl.hash);
    notice = optedOut
      ? 'This browser is excluded from portfolio analytics.'
      : 'This browser can contribute anonymous portfolio analytics. Your browser’s privacy preferences still apply.';
  }
  let session: Session | null = null;
  let visitor: { day: string; id: string } | null = null;
  let lastPath = '';
  let lastTaggedUrl = '';
  const recentEvents = new Map<string, number>();
  const disabled = () => {
    const privacy = env.privacy();
    return (
      optedOut ||
      read(env.local, ANALYTICS_OPT_OUT_KEY) === 'true' ||
      privacy.globalPrivacyControl === true ||
      privacy.doNotTrack === '1' ||
      privacy.doNotTrack === 'yes'
    );
  };
  function identity(now: number) {
    const day = analyticsDay(now);
    if (!visitor || visitor.day !== day) {
      const saved = parse(read(env.local, VISITOR_KEY)) as { day?: unknown; id?: unknown } | null;
      visitor =
        saved?.day === day && typeof saved.id === 'string' && /^[a-f0-9-]{16,64}$/.test(saved.id)
          ? { day, id: saved.id }
          : { day, id: env.randomId() };
      write(env.local, VISITOR_KEY, JSON.stringify(visitor));
    }
    const url = new URL(env.location());
    const tagged = SOCIAL_SOURCES.includes(
      url.searchParams.get('utm_source')?.toLowerCase() as SocialSource,
    );
    const attribution = resolveAttribution(url.href, env.referrer());
    if (!session) {
      const saved = parse(read(env.session, SESSION_KEY)) as Session | null;
      if (
        saved &&
        typeof saved.id === 'string' &&
        /^[a-f0-9-]{16,64}$/.test(saved.id) &&
        typeof saved.updatedAt === 'number' &&
        now - saved.updatedAt < SESSION_IDLE_MS &&
        now >= saved.updatedAt &&
        typeof saved.source === 'string' &&
        typeof saved.referrer === 'string' &&
        typeof saved.campaign === 'string'
      )
        session = saved;
    }
    const changedTag =
      tagged &&
      url.href !== lastTaggedUrl &&
      session &&
      (session.source !== attribution.source || session.campaign !== attribution.campaign);
    if (!session || now - session.updatedAt >= SESSION_IDLE_MS || changedTag)
      session = { ...attribution, id: env.randomId(), updatedAt: now };
    if (tagged) lastTaggedUrl = url.href;
    session.updatedAt = now;
    write(env.session, SESSION_KEY, JSON.stringify(session));
    return {
      visitorId: visitor.id,
      sessionId: session.id,
      source: session.source,
      medium: session.medium,
      campaign: session.campaign,
      referrer: session.referrer,
    };
  }
  function track(event: AnalyticsEventName, properties: AnalyticsProperties = {}) {
    if (disabled()) return;
    const path = new URL(env.location()).pathname;
    const now = env.now();
    const key = JSON.stringify([event, path, properties]);
    if (now - (recentEvents.get(key) ?? -Infinity) < 700) return;
    recentEvents.set(key, now);
    // The set of allowed event/property combinations is small and locally bounded.
    if (recentEvents.size > 100)
      for (const [savedKey, time] of recentEvents)
        if (now - time > 1000) recentEvents.delete(savedKey);
    env.send({
      ...identity(now),
      ...properties,
      eventId: env.randomId(),
      occurredAt: new Date(now).toISOString(),
      event,
      path,
    });
  }
  return {
    notice,
    isEnabled: () => !disabled(),
    track,
    pageview(pathname: string) {
      const normalized = pathname.replace(/\/+$/, '') || '/';
      if (normalized === lastPath) return;
      lastPath = normalized;
      track('pageview');
      if (normalized === '/work/care-iq') track('project_open', { project: 'careiq' });
      if (normalized === '/work/gen-ui') track('project_open', { project: 'gen-ui' });
      if (normalized === '/work') track('studio_section_open', { section: 'work' });
      if (normalized === '/about') track('studio_section_open', { section: 'about' });
    },
  };
}

let browserTracker: ReturnType<typeof createAnalyticsTracker> | null = null;
let browserOutbox: ReturnType<typeof createAnalyticsOutbox> | null = null;
export function getAnalyticsTracker() {
  if (typeof window === 'undefined') return null;
  if (browserTracker) return browserTracker;
  const hostname = window.location.hostname;
  const configuredOrigin = process.env.NEXT_PUBLIC_ANALYTICS_ORIGIN;
  if (!['kristiansalmeron.com', 'www.kristiansalmeron.com'].includes(hostname) && !configuredOrigin)
    return null;
  const origin = configuredOrigin || 'https://analytics.kristiansalmeron.com';
  let endpoint: string;
  try {
    const base = new URL(origin);
    if (
      base.protocol !== 'https:' &&
      !(process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(base.hostname))
    )
      return null;
    endpoint = new URL('/api/analytics/collect', base).href;
  } catch {
    return null;
  }
  let local: SafeStorage | undefined;
  let session: SafeStorage | undefined;
  try {
    local = window.localStorage;
  } catch {
    /* Browsers may block storage. */
  }
  try {
    session = window.sessionStorage;
  } catch {
    /* Browsers may block storage. */
  }
  browserOutbox = createAnalyticsOutbox({
    storage: local,
    now: () => Date.now(),
    allowed: () => browserTracker?.isEnabled() ?? false,
    setTimer: (callback, delay) => window.setTimeout(callback, delay),
    clearTimer: (timer) => window.clearTimeout(timer as number),
    send: async (payload) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20_000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          keepalive: true,
          referrerPolicy: 'no-referrer',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        return { status: response.status, retryAfter: response.headers.get('Retry-After') };
      } finally {
        window.clearTimeout(timeout);
      }
    },
  });
  browserTracker = createAnalyticsTracker({
    location: () => window.location.href,
    referrer: () => document.referrer,
    now: () => Date.now(),
    randomId: () => window.crypto.randomUUID(),
    privacy: () => ({
      globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl,
      doNotTrack: navigator.doNotTrack,
    }),
    local,
    session,
    replaceUrl: (url) => window.history.replaceState(window.history.state, '', url),
    send: (payload) => browserOutbox?.enqueue(payload),
  });
  window.addEventListener('online', () => browserOutbox?.wake());
  window.addEventListener('pagehide', () => browserOutbox?.flushOnExit());
  window.addEventListener('storage', (event) => {
    if (event.key === ANALYTICS_OPT_OUT_KEY || event.key === null) browserOutbox?.wake();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) browserOutbox?.flushOnExit();
    else browserOutbox?.wake();
  });
  browserOutbox.wake();
  return browserTracker;
}
export function trackPortfolioEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {},
) {
  try {
    getAnalyticsTracker()?.track(event, properties);
  } catch {
    /* The portfolio works without measurement. */
  }
}

export function outboundTarget(href: string): AnalyticsProperties['target'] | null {
  const host = hostOf(href);
  if (isHost(host, 'linkedin.com')) return 'linkedin';
  if (isHost(host, 'instagram.com')) return 'instagram';
  if (isHost(host, 'github.com')) return 'github';
  return null;
}
