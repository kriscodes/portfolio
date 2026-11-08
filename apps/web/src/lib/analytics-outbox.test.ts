import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import {
  ANALYTICS_OUTBOX_KEY,
  createAnalyticsOutbox,
  sanitizedOutboxPayload,
  type OutboxEnvironment,
  type OutboxResponse,
} from './analytics-outbox';
import type { AnalyticsPayload } from './analytics';

function payload(eventId = '00000000-0000-4000-8000-000000000001'): AnalyticsPayload {
  return {
    eventId,
    occurredAt: '2026-11-08T20:00:00.000Z',
    event: 'pageview',
    path: '/',
    referrer: '',
    source: 'whatsapp',
    medium: 'messaging',
    campaign: 'portfolio',
    visitorId: '11111111-1111-4111-8111-111111111111',
    sessionId: '22222222-2222-4222-8222-222222222222',
  };
}
function fixture(
  responses: Array<OutboxResponse | Error> = [],
  values = new Map<string, string>(),
) {
  let now = Date.parse('2026-11-08T20:00:00Z');
  let allowed = true;
  let nextTimer = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const sent: AnalyticsPayload[] = [];
  const env: OutboxEnvironment = {
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
      removeItem: (key) => {
        values.delete(key);
      },
    },
    now: () => now,
    allowed: () => allowed,
    send: async (event) => {
      sent.push(event);
      const result = responses.shift() ?? { status: 204 };
      if (result instanceof Error) throw result;
      return result;
    },
    setTimer: (callback, delay) => {
      const id = ++nextTimer;
      timers.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimer: (timer) => {
      timers.delete(timer as number);
    },
  };
  return {
    env,
    sent,
    values,
    timers,
    block: () => {
      allowed = false;
    },
    now: () => now,
    async advance(milliseconds: number) {
      now += milliseconds;
      for (const [id, timer] of [...timers])
        if (timer.at <= now) {
          timers.delete(id);
          timer.callback();
        }
      await setImmediate();
    },
    entries: () => JSON.parse(values.get(ANALYTICS_OUTBOX_KEY) ?? '{"events":[]}').events,
  };
}

test('network failures and Render wake pages retry one stable ID; only 204 acknowledges', async () => {
  const context = fixture([new Error('Offline'), { status: 200 }, { status: 204 }]);
  const outbox = createAnalyticsOutbox(context.env);
  outbox.enqueue(payload());
  await setImmediate();
  assert.equal(context.entries().length, 1);
  assert.equal(context.sent.length, 1);
  await context.advance(1999);
  assert.equal(context.sent.length, 1);
  await context.advance(1);
  assert.equal(context.sent.length, 2);
  assert.equal(context.entries().length, 1, 'HTTP 200 wake HTML must stay queued');
  await context.advance(5000);
  assert.equal(context.sent.length, 3);
  assert.equal(context.entries().length, 0);
  assert.equal(new Set(context.sent.map((event) => event.eventId)).size, 1);
  assert.equal(new Set(context.sent.map((event) => event.occurredAt)).size, 1);
  assert.equal(context.sent[2].occurredAt, '2026-11-08T20:00:00.000Z');
});

test('persisted events survive a page reload and honor the server retry delay', async () => {
  const context = fixture([{ status: 429, retryAfter: '60' }]);
  const outbox = createAnalyticsOutbox(context.env);
  outbox.enqueue(payload());
  await setImmediate();
  assert.equal(context.entries()[0].nextAttemptAt, context.now() + 60_000);
  context.timers.clear(); // The original document is gone; its scheduled work cannot run.
  const reopened = fixture([{ status: 204 }], context.values);
  const restored = createAnalyticsOutbox(reopened.env);
  restored.wake();
  await reopened.advance(59_999);
  assert.equal(reopened.sent.length, 0);
  await reopened.advance(1);
  assert.equal(reopened.sent.length, 1);
  assert.equal(reopened.sent[0].eventId, payload().eventId);
  assert.equal(reopened.sent[0].occurredAt, payload().occurredAt);
  assert.equal(reopened.entries().length, 0);
});

test('permanent rejection is dropped and does not block the following valid event', async () => {
  const context = fixture([{ status: 400 }, { status: 204 }]);
  const outbox = createAnalyticsOutbox(context.env);
  outbox.enqueue(payload());
  outbox.enqueue(payload('00000000-0000-4000-8000-000000000002'));
  await setImmediate();
  assert.equal(context.sent.length, 2);
  assert.equal(context.entries().length, 0);
  assert.equal(context.timers.size, 0);
});

test('privacy opt-out clears queued events before a retry or unload can send them', async () => {
  const context = fixture([{ status: 503 }]);
  const outbox = createAnalyticsOutbox(context.env);
  outbox.enqueue(payload());
  await setImmediate();
  context.block();
  await context.advance(2000);
  outbox.flushOnExit();
  assert.equal(context.sent.length, 1);
  assert.equal(context.entries().length, 0);
  assert.equal(context.timers.size, 0);
});

test('persisted payloads cannot replay arbitrary fields, private URL queries, or referral paths', () => {
  const reconstructed = sanitizedOutboxPayload({
    ...payload(),
    path: '/work/care-iq/?email=secret#private',
    referrer: 'https://linkedin.com/in/someone?token=secret',
    campaign: 'private@example.com',
    extra: 'never-send',
  });
  assert.ok(reconstructed);
  assert.equal(reconstructed.path, '/work/care-iq/');
  assert.equal(reconstructed.referrer, '');
  assert.equal(reconstructed.campaign, '');
  assert.equal(Object.hasOwn(reconstructed, 'extra'), false);
  assert.equal(sanitizedOutboxPayload({ ...payload(), source: 'private@example.com' }), null);
  assert.equal(sanitizedOutboxPayload({ ...payload(), occurredAt: 'yesterday' }), null);
  assert.equal(
    sanitizedOutboxPayload({ ...payload(), occurredAt: '2026-02-30T20:00:00.000Z' }),
    null,
  );
  assert.equal(
    sanitizedOutboxPayload({ ...payload(), path: '/private-person-name/' })?.path,
    '/unknown/',
  );
});

test('outbox is bounded to 100 entries and expires events after 24 hours', async () => {
  const context = fixture([new Error('Offline')]);
  const outbox = createAnalyticsOutbox(context.env);
  for (let i = 1; i <= 150; i++) outbox.enqueue(payload(i.toString(16).padStart(32, '0')));
  await setImmediate();
  assert.equal(context.entries().length, 100);
  await context.advance(24 * 60 * 60 * 1000 + 1);
  assert.equal(context.entries().length, 0);
});

test('an open page stops repeated failures after eight attempts and can resume when online', async () => {
  const context = fixture(Array.from({ length: 8 }, () => ({ status: 503 })));
  const outbox = createAnalyticsOutbox(context.env);
  outbox.enqueue(payload());
  await setImmediate();
  for (const delay of [2000, 5000, 10_000, 20_000, 30_000, 30_000, 30_000])
    await context.advance(delay);
  assert.equal(context.sent.length, 8);
  assert.equal(context.timers.size, 0);
  assert.equal(context.entries().length, 1);
  outbox.wake();
  await context.advance(30_000);
  assert.equal(context.sent.length, 9);
  assert.equal(context.entries().length, 0);
});

test('unload flushes queued events behind an in-flight request with stable IDs', async () => {
  const context = fixture();
  let finishFirst: ((response: OutboxResponse) => void) | undefined;
  context.env.send = (event) => {
    context.sent.push(event);
    if (context.sent.length === 1)
      return new Promise((resolve) => {
        finishFirst = resolve;
      });
    return Promise.resolve({ status: 204 });
  };
  const outbox = createAnalyticsOutbox(context.env);
  outbox.enqueue(payload());
  outbox.enqueue(payload('00000000-0000-4000-8000-000000000002'));
  outbox.flushOnExit();
  await setImmediate();
  assert.equal(context.sent.length, 2);
  assert.notEqual(context.sent[0].eventId, context.sent[1].eventId);
  finishFirst?.({ status: 204 });
  await setImmediate();
  assert.equal(context.entries().length, 0);
});
