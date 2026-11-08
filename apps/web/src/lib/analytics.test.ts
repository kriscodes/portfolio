import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ANALYTICS_OPT_OUT_KEY,
  analyticsDay,
  createAnalyticsTracker,
  outboundTarget,
  resolveAttribution,
  type AnalyticsEnvironment,
} from './analytics';

function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
function fixture(url = 'https://kristiansalmeron.com/') {
  let location = url;
  let time = Date.parse('2026-11-08T20:00:00Z');
  let counter = 0;
  const local = storage(),
    session = storage();
  const privacy: { globalPrivacyControl?: boolean; doNotTrack?: string | null } = {};
  const sent: Parameters<AnalyticsEnvironment['send']>[0][] = [];
  const env: AnalyticsEnvironment = {
    location: () => location,
    referrer: () => 'https://l.instagram.com/?private=not-collected',
    now: () => time,
    randomId: () => (++counter).toString(16).padStart(32, '0'),
    privacy: () => privacy,
    local,
    session,
    replaceUrl: (next) => {
      location = new URL(next, location).href;
    },
    send: (payload) => {
      sent.push(payload);
    },
  };
  return {
    env,
    local,
    session,
    privacy,
    sent,
    navigate: (next: string) => {
      location = new URL(next, location).href;
    },
    advance: (milliseconds: number) => {
      time += milliseconds;
    },
    location: () => location,
  };
}

test('all five tagged social links remain attributable without a referral header', () => {
  for (const source of ['facebook', 'instagram', 'linkedin', 'tiktok', 'whatsapp']) {
    const result = resolveAttribution(
      `https://kristiansalmeron.com/?utm_source=${source}&utm_campaign=portfolio`,
      '',
    );
    assert.equal(result.source, source);
    assert.equal(result.campaign, 'portfolio');
    assert.equal(result.medium, source === 'whatsapp' ? 'messaging' : 'social');
  }
});

test('attribution respects tagged links, strips private data, and rejects spoofed hostnames', () => {
  assert.deepEqual(
    resolveAttribution(
      'https://kristiansalmeron.com/?utm_source=linkedin&utm_campaign=hello%40example.com&email=private',
      'https://l.instagram.com/p/private?secret=value',
    ),
    {
      source: 'linkedin',
      medium: 'social',
      campaign: '',
      referrer: 'l.instagram.com',
    },
  );
  assert.equal(
    resolveAttribution('https://kristiansalmeron.com/', 'https://linkedin.com.example.org/').source,
    'referral',
  );
  assert.equal(outboundTarget('https://www.linkedin.com/in/kris'), 'linkedin');
  assert.equal(outboundTarget('https://linkedin.com.example.org/in/kris'), null);
});

test('client navigation retains campaign acquisition and deduplicates repeated mount effects', () => {
  const context = fixture(
    'https://kristiansalmeron.com/?utm_source=whatsapp&utm_campaign=portfolio',
  );
  const tracker = createAnalyticsTracker(context.env);
  tracker.pageview('/');
  tracker.pageview('/');
  context.advance(1000);
  context.navigate('/work/care-iq/?email=not-collected#anything');
  tracker.pageview('/work/care-iq/');
  assert.equal(context.sent.filter((event) => event.event === 'pageview').length, 2);
  assert.equal(context.sent.filter((event) => event.event === 'project_open').length, 1);
  assert.ok(
    context.sent.every((event) => event.source === 'whatsapp' && event.campaign === 'portfolio'),
  );
  assert.equal(context.sent[1].path, '/work/care-iq/');
  assert.equal(context.sent[1].visitorId, context.sent[0].visitorId);
  assert.equal(context.sent[1].sessionId, context.sent[0].sessionId);
});

test('owner opt-out happens before collection and removes stored visitor identifiers', () => {
  const context = fixture('https://kristiansalmeron.com/?analytics_opt_out=1&utm_source=facebook');
  context.local.setItem('ks_analytics_visitor_v1', 'old-id');
  context.session.setItem('ks_analytics_session_v1', 'old-session');
  const tracker = createAnalyticsTracker(context.env);
  tracker.pageview('/');
  assert.equal(context.sent.length, 0);
  assert.equal(context.local.getItem(ANALYTICS_OPT_OUT_KEY), 'true');
  assert.equal(context.local.getItem('ks_analytics_visitor_v1'), null);
  assert.equal(context.session.getItem('ks_analytics_session_v1'), null);
  assert.equal(new URL(context.location()).searchParams.has('analytics_opt_out'), false);
});

test('global privacy control and do-not-track prevent collection and identifier storage', () => {
  for (const preference of ['globalPrivacyControl', 'doNotTrack'] as const) {
    const context = fixture();
    if (preference === 'globalPrivacyControl') context.privacy.globalPrivacyControl = true;
    else context.privacy.doNotTrack = '1';
    const tracker = createAnalyticsTracker(context.env);
    tracker.pageview('/');
    tracker.track('outbound_click', { target: 'linkedin' });
    assert.equal(context.sent.length, 0);
    assert.equal(context.local.values.size, 0);
    assert.equal(context.session.values.size, 0);
  }
});

test('visitor IDs rotate at Los Angeles midnight and sessions expire after inactivity', () => {
  assert.equal(analyticsDay(Date.parse('2026-11-08T08:30:00Z')), '2026-11-08');
  assert.equal(analyticsDay(Date.parse('2026-11-08T07:30:00Z')), '2026-11-07');
  const context = fixture();
  const tracker = createAnalyticsTracker(context.env);
  tracker.pageview('/');
  const first = context.sent[0];
  context.advance(31 * 60 * 1000);
  tracker.track('outbound_click', { target: 'linkedin' });
  assert.notEqual(context.sent[1].sessionId, first.sessionId);
  assert.equal(context.sent[1].visitorId, first.visitorId);
  context.advance(24 * 60 * 60 * 1000);
  tracker.track('outbound_click', { target: 'github' });
  assert.notEqual(context.sent[2].visitorId, first.visitorId);
});

test('disabled browser storage falls back to a visit-local random identity without fingerprinting', () => {
  const context = fixture();
  const blocked = {
    getItem: () => {
      throw new Error('Blocked');
    },
    setItem: () => {
      throw new Error('Blocked');
    },
    removeItem: () => {
      throw new Error('Blocked');
    },
  };
  context.env.local = blocked;
  context.env.session = blocked;
  const tracker = createAnalyticsTracker(context.env);
  tracker.pageview('/');
  context.advance(1000);
  tracker.track('outbound_click', { target: 'linkedin' });
  assert.equal(context.sent.length, 2);
  assert.equal(context.sent[0].visitorId, context.sent[1].visitorId);
});
