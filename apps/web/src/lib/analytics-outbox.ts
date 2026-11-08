import type { AnalyticsPayload } from './analytics';

export const ANALYTICS_OUTBOX_KEY = 'ks_analytics_outbox_v1';
const MAX_EVENTS = 100;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RETRY_DELAYS = [2_000, 5_000, 10_000, 20_000, 30_000, 30_000, 30_000];
const MAX_RETRY_FAILURES = 8;
const SOURCES = new Set([
  'facebook',
  'instagram',
  'linkedin',
  'tiktok',
  'whatsapp',
  'google',
  'bing',
  'duckduckgo',
  'direct',
  'referral',
  'other',
]);
const MEDIA = new Set(['social', 'messaging', 'organic', 'direct', 'referral']);
const EVENTS = new Set([
  'pageview',
  'project_open',
  'project_preview_open',
  'studio_section_open',
  'outbound_click',
  'studio_ready',
  'studio_fallback',
]);
const PROJECTS = new Set(['careiq', 'gen-ui', 'neon-drift']);
const SECTIONS = new Set(['work', 'about', 'life']);
const TARGETS = new Set(['linkedin', 'instagram', 'github', 'website']);
const MODES = new Set(['day', 'night', '2d', '3d']);
const ID = /^[A-Za-z0-9_-]{16,96}$/;
const PATH =
  /^\/(?:work\/(?:care-iq\/|gen-ui\/)?|about\/|contact\/|field-notes\/(?:[a-z0-9-]{1,80}\/)?|privacy\/)?$/;

type Entry = {
  payload: AnalyticsPayload;
  queuedAt: number;
  nextAttemptAt: number;
  attempts: number;
};
type SafeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type OutboxResponse = { status: number; retryAfter?: string | null };
export type OutboxEnvironment = {
  storage?: SafeStorage;
  now: () => number;
  allowed: () => boolean;
  send: (payload: AnalyticsPayload) => Promise<OutboxResponse>;
  setTimer: (callback: () => void, delay: number) => unknown;
  clearTimer: (timer: unknown) => void;
};

/** Reconstruct the exact allowed shape. Never forward arbitrary persisted properties. */
export function sanitizedOutboxPayload(value: unknown): AnalyticsPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.occurredAt !== 'string' || body.occurredAt.length !== 24) return null;
  const occurredAt = Date.parse(body.occurredAt);
  if (!Number.isFinite(occurredAt) || new Date(occurredAt).toISOString() !== body.occurredAt)
    return null;
  if (
    typeof body.event !== 'string' ||
    !EVENTS.has(body.event) ||
    typeof body.eventId !== 'string' ||
    !ID.test(body.eventId) ||
    typeof body.visitorId !== 'string' ||
    !ID.test(body.visitorId) ||
    typeof body.sessionId !== 'string' ||
    !ID.test(body.sessionId) ||
    typeof body.source !== 'string' ||
    !SOURCES.has(body.source) ||
    typeof body.medium !== 'string' ||
    !MEDIA.has(body.medium)
  )
    return null;
  let path = typeof body.path === 'string' ? body.path.split(/[?#]/, 1)[0].toLowerCase() : '/';
  if (!path.endsWith('/')) path += '/';
  if (!PATH.test(path)) path = '/unknown/';
  const referrer =
    typeof body.referrer === 'string' &&
    body.referrer.length <= 253 &&
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(body.referrer)
      ? body.referrer
      : '';
  const campaign =
    typeof body.campaign === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(body.campaign)
      ? body.campaign
      : '';
  const payload: AnalyticsPayload = {
    eventId: body.eventId,
    occurredAt: body.occurredAt,
    event: body.event as AnalyticsPayload['event'],
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    path,
    referrer,
    campaign,
    source: body.source as AnalyticsPayload['source'],
    medium: body.medium as AnalyticsPayload['medium'],
  };
  if (typeof body.project === 'string' && PROJECTS.has(body.project))
    payload.project = body.project as AnalyticsPayload['project'];
  if (typeof body.section === 'string' && SECTIONS.has(body.section))
    payload.section = body.section as AnalyticsPayload['section'];
  if (typeof body.target === 'string' && TARGETS.has(body.target))
    payload.target = body.target as AnalyticsPayload['target'];
  if (typeof body.mode === 'string' && MODES.has(body.mode))
    payload.mode = body.mode as AnalyticsPayload['mode'];
  return payload;
}

function retryDelay(attempts: number, retryAfter: string | null | undefined, now: number) {
  const normal = RETRY_DELAYS[Math.min(Math.max(0, attempts - 1), RETRY_DELAYS.length - 1)];
  if (!retryAfter) return normal;
  const seconds = /^\d+(?:\.\d+)?$/.test(retryAfter.trim())
    ? Number(retryAfter) * 1000
    : Date.parse(retryAfter) - now;
  return Number.isFinite(seconds) ? Math.max(normal, Math.min(90_000, seconds)) : normal;
}

/** Best-effort delivery, bounded to 100 anonymous events and 24 hours of local storage. */
export function createAnalyticsOutbox(environment: OutboxEnvironment) {
  const env = environment;
  let queue: Entry[] = [];
  let timer: unknown = null;
  let draining = false;
  let failures = 0;
  const inFlight = new Set<string>();
  const acknowledged = new Set<string>();

  function readPersisted(): Entry[] {
    try {
      const raw = env.storage?.getItem(ANALYTICS_OUTBOX_KEY);
      if (!raw || raw.length > 256_000) return [];
      const stored = JSON.parse(raw);
      if (stored?.version !== 1 || !Array.isArray(stored.events)) return [];
      const now = env.now();
      const entries: Entry[] = [];
      const ids = new Set<string>();
      for (const item of stored.events.slice(-MAX_EVENTS)) {
        if (!item || typeof item !== 'object') continue;
        const payload = sanitizedOutboxPayload(item.payload);
        if (
          !payload ||
          acknowledged.has(payload.eventId) ||
          ids.has(payload.eventId) ||
          !Number.isFinite(item.queuedAt) ||
          item.queuedAt > now ||
          now - item.queuedAt > MAX_AGE_MS
        )
          continue;
        ids.add(payload.eventId);
        entries.push({
          payload,
          queuedAt: item.queuedAt,
          nextAttemptAt: Number.isFinite(item.nextAttemptAt)
            ? Math.min(now + 90_000, Math.max(now, item.nextAttemptAt))
            : now,
          attempts: Number.isInteger(item.attempts) ? Math.min(100, Math.max(0, item.attempts)) : 0,
        });
      }
      return entries;
    } catch {
      return [];
    }
  }
  function persist() {
    try {
      if (!queue.length) env.storage?.removeItem(ANALYTICS_OUTBOX_KEY);
      else
        env.storage?.setItem(ANALYTICS_OUTBOX_KEY, JSON.stringify({ version: 1, events: queue }));
    } catch {
      // Blocked/full browser storage still leaves a bounded in-memory outbox.
    }
  }
  function mergePersisted() {
    const combined = new Map<string, Entry>();
    for (const entry of [...readPersisted(), ...queue])
      if (!acknowledged.has(entry.payload.eventId)) combined.set(entry.payload.eventId, entry);
    queue = [...combined.values()]
      .filter((entry) => env.now() - entry.queuedAt <= MAX_AGE_MS)
      .sort((a, b) => a.queuedAt - b.queuedAt)
      .slice(-MAX_EVENTS);
  }
  function cancelTimer() {
    if (timer !== null) env.clearTimer(timer);
    timer = null;
  }
  function clear() {
    cancelTimer();
    queue = [];
    failures = 0;
    persist();
  }
  function permitted() {
    if (env.allowed()) return true;
    clear();
    return false;
  }
  function remove(eventId: string) {
    acknowledged.add(eventId);
    if (acknowledged.size > 300) acknowledged.delete(acknowledged.values().next().value!);
    mergePersisted();
    queue = queue.filter((entry) => entry.payload.eventId !== eventId);
    persist();
  }
  function schedule(delay: number) {
    cancelTimer();
    timer = env.setTimer(() => {
      timer = null;
      void drain();
    }, delay);
  }
  async function deliver(entry: Entry): Promise<OutboxResponse> {
    inFlight.add(entry.payload.eventId);
    try {
      return await env.send(entry.payload);
    } catch {
      return { status: 0 };
    } finally {
      inFlight.delete(entry.payload.eventId);
    }
  }
  async function drain() {
    if (draining || !permitted()) return;
    mergePersisted();
    if (!queue.length) {
      cancelTimer();
      persist();
      return;
    }
    if (failures >= MAX_RETRY_FAILURES) return;
    draining = true;
    let delivered = 0;
    try {
      while (queue.length && delivered < 20 && permitted()) {
        queue = queue.filter((entry) => env.now() - entry.queuedAt <= MAX_AGE_MS);
        const entry = queue[0];
        if (!entry) break;
        if (entry.nextAttemptAt > env.now()) {
          schedule(entry.nextAttemptAt - env.now());
          break;
        }
        if (inFlight.has(entry.payload.eventId)) {
          schedule(500);
          break;
        }
        const result = await deliver(entry);
        if (!permitted()) break;
        // Render may return an HTTP 200 wake-up page. Only collector 204 is an ACK.
        if (result.status === 204 || [400, 403, 404, 405, 413, 415, 422].includes(result.status)) {
          remove(entry.payload.eventId);
          failures = 0;
          delivered += 1;
          continue;
        }
        failures += 1;
        entry.attempts += 1;
        entry.nextAttemptAt = env.now() + retryDelay(entry.attempts, result.retryAfter, env.now());
        mergePersisted();
        persist();
        if (failures < MAX_RETRY_FAILURES) schedule(entry.nextAttemptAt - env.now());
        break;
      }
      if (delivered >= 20 && queue.length) schedule(100);
      if (!queue.length) {
        cancelTimer();
        persist();
      }
    } finally {
      draining = false;
    }
  }
  queue = readPersisted();
  return {
    enqueue(value: AnalyticsPayload) {
      if (!permitted()) return;
      const payload = sanitizedOutboxPayload(value);
      if (!payload || acknowledged.has(payload.eventId)) return;
      mergePersisted();
      if (!queue.some((entry) => entry.payload.eventId === payload.eventId))
        queue.push({ payload, queuedAt: env.now(), nextAttemptAt: env.now(), attempts: 0 });
      queue = queue.slice(-MAX_EVENTS);
      persist();
      void drain();
    },
    wake() {
      cancelTimer();
      if (!permitted()) return;
      failures = 0;
      void drain();
    },
    flushOnExit() {
      if (!permitted()) return;
      mergePersisted();
      if (!queue.length) {
        persist();
        return;
      }
      // Keep unload requests well below the browser's shared 64 KiB keepalive quota.
      for (const entry of queue.filter((item) => !inFlight.has(item.payload.eventId)).slice(-10)) {
        if (!permitted()) break;
        void deliver(entry).then((result) => {
          if (!permitted()) return;
          if (result.status === 204 || [400, 403, 404, 405, 413, 415, 422].includes(result.status))
            remove(entry.payload.eventId);
        });
      }
    },
    clear,
  };
}
