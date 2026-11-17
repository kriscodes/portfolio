import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const context = { module: { exports: {} }, URL, Intl, Date, Map, Set };
vm.runInNewContext(readFileSync(new URL('./web/tracker.js', import.meta.url), 'utf8'), context);
// The shipped script is intentionally dependency-free; exercise the same source in a VM.
const { createTracker, createOutbox, sanitize, outbound, KEYS } = context.module.exports as any;
function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}
function fixture(site = 'portfolio', cookies = new Map<string, string>(), blocked = false) {
  let now = Date.parse('2026-11-16T20:00:00Z'),
    index = 0;
  let location = `https://${site === 'portfolio' ? '' : site + '.'}kristiansalmeron.com/`;
  let referrer = '',
    visible = true;
  const privacy: { globalPrivacyControl?: boolean; doNotTrack?: string } = {};
  const local = storage(),
    session = storage(),
    sent: any[] = [];
  const env = {
    site,
    local,
    session,
    now: () => now,
    randomId: () => `${site}-` + (++index).toString().padStart(24, '0'),
    location: () => location,
    referrer: () => referrer,
    visible: () => visible,
    privacy: () => privacy,
    send: (payload: any) => sent.push(payload),
    cookie(name: string, value?: string, age?: number) {
      if (blocked) return null;
      if (value !== undefined) {
        if (age === 0) cookies.delete(name);
        else cookies.set(name, value);
      }
      return cookies.get(name) ?? null;
    },
    replaceUrl: (value: string) => {
      location = new URL(value, location).href;
    },
  };
  return {
    env,
    sent,
    local,
    session,
    privacy,
    cookies,
    advance: (ms: number) => {
      now += ms;
    },
    setTime: (time: string) => {
      now = Date.parse(time);
    },
    navigate: (url: string) => {
      location = new URL(url, location).href;
    },
    refer: (value: string) => {
      referrer = value;
    },
    visible: (value: boolean) => {
      visible = value;
    },
  };
}

test('visible active time stops after 60 seconds idle and excludes hidden or suspended time', () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  for (let index = 0; index < 8; index++) {
    f.advance(15_000);
    tracker.tick();
  }
  const times = f.sent
    .filter((event) => event.event === 'page_engagement')
    .map((event) => event.activeMs);
  assert.deepEqual(times, [15_000, 30_000, 45_000, 60_000]);
  tracker.activity();
  f.advance(15_000);
  tracker.tick();
  assert.equal(f.sent.at(-1).activeMs, 75_000);
  f.visible(false);
  tracker.visibility(false);
  f.advance(120_000);
  tracker.tick();
  assert.equal(f.sent.at(-1).activeMs, 75_000);
  f.visible(true);
  tracker.visibility(true);
  f.advance(45_000);
  tracker.tick();
  // A large timer gap can be a suspended browser; conservatively discard it.
  assert.equal(f.sent.at(-1).activeMs, 75_000);
});

test('visit identity rotates after inactivity and both identities rotate at Pacific midnight', () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  const first = f.sent[0];
  f.advance(31 * 60_000);
  tracker.activity();
  const second = f.sent.filter((event) => event.event === 'pageview').at(-1);
  assert.notEqual(second.sessionId, first.sessionId);
  assert.equal(second.visitorId, first.visitorId);
  assert.equal(second.previousPageId, undefined);
  f.setTime('2026-11-17T08:00:01Z');
  tracker.activity();
  const third = f.sent.filter((event) => event.event === 'pageview').at(-1);
  assert.notEqual(third.sessionId, second.sessionId);
  assert.notEqual(third.visitorId, second.visitorId);
});

test('owned subdomains share only daily visit identity and preserve the entry source', () => {
  const cookies = new Map<string, string>();
  const portfolio = fixture('portfolio', cookies);
  portfolio.navigate('/?utm_source=linkedin&utm_campaign=portfolio');
  createTracker(portfolio.env).pageview();
  const lab = fixture('lab', cookies);
  lab.refer('https://kristiansalmeron.com/work/?private=value');
  lab.navigate('/experiments/pdf-rendering/?prompt=secret');
  createTracker(lab.env).pageview();
  assert.equal(lab.sent[0].visitorId, portfolio.sent[0].visitorId);
  assert.equal(lab.sent[0].sessionId, portfolio.sent[0].sessionId);
  assert.equal(lab.sent[0].source, 'linkedin');
  assert.equal(lab.sent[0].visitScope, 'shared');
  assert.equal(lab.sent[0].referrer, 'kristiansalmeron.com');
  assert.equal(lab.sent[0].previousPageId, undefined);
  assert.equal(lab.sent[1].event, 'experiment_open');
  assert.equal(lab.sent[1].content, 'pdf-rendering');
  assert.ok(!JSON.stringify(lab.sent).includes('secret'));
});

test('blocked cookies use labeled local identities and query/fragment data never enter events', () => {
  const f = fixture('toolbox', new Map(), true);
  f.navigate('/tools/prompt-builder/?prompt=private-value#private-fragment');
  f.refer('https://private-person.example/personal/path');
  const tracker = createTracker(f.env);
  tracker.pageview();
  tracker.track('tool_action', {
    content: 'prompt-builder',
    action: 'generate',
    prompt: 'SECRET',
    email: 'PRIVATE',
  });
  assert.equal(f.sent[0].visitScope, 'local');
  assert.equal(f.sent[0].path, '/tools/prompt-builder/');
  assert.equal(f.sent[0].referrer, '');
  assert.equal(f.sent[0].source, 'referral');
  assert.equal(f.sent.at(-1).action, 'generate');
  assert.ok(
    !/SECRET|PRIVATE|private-value|private-fragment|private-person/.test(JSON.stringify(f.sent)),
  );
});

test('scroll collection emits each milestone at most once and ignores short pages', () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  tracker.scroll(0, 900, 500);
  tracker.scroll(0, 900, 3000);
  assert.equal(f.sent.filter((event) => event.event === 'scroll_depth').length, 0);
  tracker.scroll(100, 900, 3000);
  tracker.scroll(700, 900, 3000);
  tracker.scroll(2100, 900, 3000);
  tracker.scroll(2100, 900, 3000);
  assert.deepEqual(
    f.sent.filter((event) => event.event === 'scroll_depth').map((event) => event.scrollDepth),
    [25, 50, 75, 100],
  );
  assert.ok(f.sent.every((event) => !('scrollY' in event) && !('height' in event)));
});

test('page chains use stable page IDs and do not duplicate unchanged SPA routes', () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  tracker.pageview();
  const first = f.sent[0];
  f.advance(1000);
  f.navigate('/work/care-iq/?email=private');
  tracker.pageview();
  const views = f.sent.filter((event) => event.event === 'pageview');
  assert.equal(views.length, 2);
  assert.equal(views[1].previousPageId, first.pageId);
  assert.notEqual(views[1].pageId, first.pageId);
});

test('opt-out and browser signals purge identifiers and prevent all event types', () => {
  for (const signal of ['preference', 'globalPrivacyControl', 'doNotTrack']) {
    const f = fixture();
    if (signal === 'preference') f.navigate('/?analytics_opt_out=1');
    if (signal === 'globalPrivacyControl') f.privacy.globalPrivacyControl = true;
    if (signal === 'doNotTrack') f.privacy.doNotTrack = '1';
    f.local.setItem('ks_analytics_visitor_v1', 'legacy-identifier');
    const tracker = createTracker(f.env);
    tracker.pageview();
    tracker.activity();
    tracker.tick();
    tracker.track('outbound_click', { target: 'email' });
    assert.equal(f.sent.length, 0);
    assert.equal(f.cookies.has(KEYS.visitor), false);
    assert.equal(f.local.getItem('ks_analytics_visitor_v1'), null);
  }
});

test('a preference change on another subdomain is checked before the next event', () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  const count = f.sent.length;
  f.cookies.set(KEYS.preference, '1');
  tracker.track('outbound_click', { target: 'github' });
  assert.equal(f.sent.length, count);
  assert.equal(f.cookies.has(KEYS.visitor), false);
  f.local.setItem(KEYS.preference, 'true');
  f.cookies.set(KEYS.preference, '0');
  tracker.activity();
  assert.equal(tracker.isEnabled(), true);
  assert.equal(f.local.getItem(KEYS.preference), null);
});

test('explicit opt-out still blocks this document when all browser storage is unavailable', () => {
  const f = fixture('portfolio', new Map(), true);
  f.navigate('/?analytics_opt_out=1');
  const blocked = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  };
  const tracker = createTracker({ ...f.env, local: blocked, session: blocked });
  tracker.pageview();
  tracker.tick();
  tracker.track('outbound_click', { target: 'email' });
  assert.equal(f.sent.length, 0);
  assert.equal(tracker.isEnabled(), false);
  assert.match(tracker.notice, /off for this page/);
});

test('privacy pages process preferences but never create pageviews or engagement', () => {
  const f = fixture();
  f.navigate('/privacy/');
  const tracker = createTracker(f.env);
  tracker.pageview();
  tracker.tick();
  tracker.track('outbound_click', { target: 'github' });
  assert.equal(f.sent.length, 0);
  assert.equal(f.cookies.has(KEYS.visitor), false);
});

test('a new exclusion wins over an old allow cookie when cookie updates are blocked', () => {
  const f = fixture();
  f.navigate('/?analytics_opt_out=1');
  const tracker = createTracker({
    ...f.env,
    cookie: (name: string) => (name === KEYS.preference ? '0' : null),
  });
  tracker.pageview();
  tracker.tick();
  assert.equal(tracker.isEnabled(), false);
  assert.equal(f.sent.length, 0);
  assert.equal(f.local.getItem(KEYS.preference), 'true');
});

test('a new approved source tag begins a visit, without repeatedly resetting it on heartbeats', () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  const first = f.sent[0];
  f.navigate('/?utm_source=github&utm_campaign=bio');
  tracker.pageview();
  const second = f.sent.filter((event) => event.event === 'pageview').at(-1);
  assert.notEqual(second.sessionId, first.sessionId);
  assert.equal(second.source, 'github');
  f.advance(15000);
  tracker.tick();
  assert.equal(f.sent.at(-1).sessionId, second.sessionId);
});

test('outbound interest uses a destination category and fixed route, never email or arbitrary URLs', () => {
  assert.equal(outbound('mailto:private@example.com?subject=secret', 'portfolio').target, 'email');
  assert.equal(
    outbound('https://github.com/kriscodes/portfolio?token=secret', 'portfolio').target,
    'github',
  );
  assert.equal(outbound('https://github.com.attacker.example/', 'portfolio'), null);
  assert.equal(
    outbound(
      'https://toolbox.kristiansalmeron.com/tools/prompt-builder/?prompt=secret',
      'portfolio',
    ).destinationPath,
    '/tools/prompt-builder/',
  );
  assert.equal(
    outbound('https://lab.kristiansalmeron.com/unknown-person/', 'portfolio').destinationPath,
    '/unknown/',
  );
});

test('persisted events are reconstructed from an allowlist before delivery', () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  const cleaned = sanitize({
    ...f.sent[0],
    content: 'private-name',
    campaign: 'alice-smith',
    path: '/arbitrary-person?email=private',
    referrer: 'private-person.example',
    prompt: 'private prompt',
  });
  assert.equal(cleaned.path, '/unknown/');
  assert.equal(cleaned.referrer, '');
  assert.equal(cleaned.campaign, '');
  assert.ok(!JSON.stringify(cleaned).includes('private'));
});

test('outbox retries preserve IDs and timestamps, opt-out clears delayed events', async () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  let allowed = true,
    status = 503;
  const sent: any[] = [],
    timers: Array<() => void> = [];
  const outbox = createOutbox({
    local: f.local,
    now: f.env.now,
    allowed: () => allowed,
    setTimer: (fn: () => void) => {
      timers.push(fn);
      return fn;
    },
    clearTimer: () => {},
    send: async (payload: any) => {
      sent.push(payload);
      return { status };
    },
  });
  outbox.enqueue(f.sent[0]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sent.length, 1);
  f.advance(5000);
  status = 204;
  timers.shift()?.();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sent.length, 2);
  assert.equal(sent[0].eventId, sent[1].eventId);
  assert.equal(sent[0].occurredAt, sent[1].occurredAt);
  assert.equal(f.local.getItem(KEYS.outbox), null);
  status = 503;
  f.advance(1000);
  tracker.track('outbound_click', { target: 'github' });
  outbox.enqueue(f.sent.at(-1));
  await new Promise((resolve) => setImmediate(resolve));
  allowed = false;
  outbox.wake();
  assert.equal(f.local.getItem(KEYS.outbox), null);
});

test('outbox drops old events and never treats a wake-up HTTP 200 page as an acknowledgement', async () => {
  const f = fixture(),
    tracker = createTracker(f.env);
  tracker.pageview();
  const old = { ...f.sent[0], occurredAt: '2026-11-14T20:00:00.000Z' };
  f.local.setItem(KEYS.outbox, JSON.stringify({ events: [{ payload: old }] }));
  const sent: any[] = [];
  const outbox = createOutbox({
    local: f.local,
    now: f.env.now,
    allowed: () => true,
    setTimer: () => 1,
    clearTimer: () => {},
    send: async (payload: any) => {
      sent.push(payload);
      return { status: 200 };
    },
  });
  outbox.wake();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sent.length, 0);
  outbox.enqueue(f.sent[0]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(f.local.getItem(KEYS.outbox));
});
