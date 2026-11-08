import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import express from 'express';
import { Pool } from 'pg';
import { createAnalytics, type AnalyticsOptions } from './router.js';
import { MemoryAnalyticsStore, PostgresAnalyticsStore } from './store.js';
import { hashPassword, verifyPassword } from './auth.js';
import type { AnalyticsEvent } from './types.js';
import { reportRange } from './types.js';

const ownerEmail = 'owner@example.com';
const setupToken = 'test-setup-token-which-is-long-enough-123';
const hashSecret = 'test-hash-secret-which-is-long-enough-456';
const origin = 'https://analytics.kristiansalmeron.com';
const password = 'a long private owner password';

async function fixture(
  run: (context: {
    base: string;
    store: MemoryAnalyticsStore;
    call: (path: string, options?: RequestInit) => Promise<Response>;
  }) => Promise<void>,
  options: AnalyticsOptions = {},
) {
  const store = new MemoryAnalyticsStore();
  const analytics = createAnalytics({
    store,
    ownerEmail,
    setupToken,
    hashSecret,
    origin,
    production: true,
    serveWeb: false,
    ...options,
  });
  const app = express();
  app.use(analytics.router);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const call = (path: string, init?: RequestInit) => fetch(`${base}/api/analytics/${path}`, init);
  try {
    await run({ base, store, call });
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await analytics.close();
  }
}

function mutation(body: unknown, cookie?: string, originHeader = origin): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: originHeader,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  };
}

function collect(body: unknown, cookie?: string): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Origin: 'https://kristiansalmeron.com',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/130 Safari/537.36',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  };
}

const event = {
  event: 'pageview',
  path: '/work/care-iq/?email=private@example.com',
  source: 'whatsapp',
  medium: 'messaging',
  campaign: 'profile',
  visitorId: 'visitor_123456789abcdefghijklmn',
  sessionId: 'session_123456789abcdefghijklmn',
  referrer: 'l.facebook.com',
};

test('password hashes are salted, memory-hard, and do not accept incorrect passwords', async () => {
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('incorrect password', first), false);
  assert.equal(await verifyPassword(password, 'invalid'), false);
});

test('owner setup is one-time and reports require a secure server session', async () => {
  await fixture(async ({ call, store }) => {
    const auth = await call('auth');
    assert.deepEqual(await auth.json(), { authenticated: false, setupRequired: true });
    const report = await call('overview?days=7');
    assert.equal(report.status, 401);
    assert.match(report.headers.get('cache-control') ?? '', /no-store/);
    assert.equal((await call('setup', mutation({ token: 'invalid', password }))).status, 403);
    const setup = await call('setup', mutation({ token: setupToken, password }));
    assert.equal(setup.status, 201);
    const header = setup.headers.get('set-cookie')!;
    assert.match(header, /^__Host-analytics=/);
    assert.match(header, /HttpOnly/);
    assert.match(header, /Secure/);
    assert.match(header, /SameSite=Strict/);
    assert.doesNotMatch(header, /Domain=/);
    const cookie = header.split(';')[0];
    assert.ok(store.owner?.passwordHash.startsWith('scrypt$32768$'));
    assert.notEqual(store.owner?.passwordHash, password);
    assert.ok(![...store.sessions.keys()].some((key) => cookie.includes(key)));
    assert.equal(
      (
        await call(
          'setup',
          mutation({ token: setupToken, password: 'another long secret password' }),
        )
      ).status,
      409,
    );
    const owner = await call('auth', { headers: { Cookie: cookie } });
    assert.deepEqual(await owner.json(), {
      authenticated: true,
      setupRequired: false,
      email: ownerEmail,
    });
    const empty = await call('overview?days=7', { headers: { Cookie: cookie } });
    assert.equal(empty.status, 200);
    const data = await empty.json();
    assert.equal(data.totals.visitors, 0);
    assert.equal(data.daily.length, 7);
    assert.equal(data.range.timezone, 'America/Los_Angeles');
    assert.equal((await call('overview?days=999', { headers: { Cookie: cookie } })).status, 400);
    assert.equal((await call('logout', mutation({}, cookie))).status, 200);
    assert.equal((await call('overview', { headers: { Cookie: cookie } })).status, 401);
  });
});

test('collector validates origins, strips URL queries, hashes identifiers, and counts social campaigns', async () => {
  await fixture(async ({ call, store }) => {
    const request = collect(event);
    const blocked = await call('collect', {
      ...request,
      headers: { ...request.headers, Origin: 'https://untrusted.example' },
    });
    assert.equal(blocked.status, 403);
    assert.equal(store.events.length, 0);
    const response = await call('collect', request);
    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get('access-control-allow-origin'),
      'https://kristiansalmeron.com',
    );
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
    assert.equal(store.events[0].path, '/work/care-iq/');
    assert.equal(store.events[0].visitorHash.length, 64);
    assert.notEqual(store.events[0].visitorHash, event.visitorId);
    assert.equal(store.events[0].device, 'desktop');
    await call('collect', collect({ ...event, event: 'project_open', project: 'careiq' }));
    await call('collect', collect({ ...event, event: 'outbound_click', target: 'linkedin' }));
    await call(
      'collect',
      collect({
        ...event,
        campaign: 'customer@example.com',
        path: '/customer@example.com',
        referrer: 'private@example.com',
      }),
    );
    assert.equal(store.events[3].campaign, '');
    assert.equal(store.events[3].path, '/unknown/');
    assert.equal(store.events[3].referrer, '');
    assert.equal(
      (await call('collect', collect({ ...event, event: 'password_entered' }))).status,
      400,
    );
    const setup = await call('setup', mutation({ token: setupToken, password }));
    const cookie = setup.headers.get('set-cookie')!.split(';')[0];
    const before = store.events.length;
    assert.equal((await call('collect', collect(event, cookie))).status, 204);
    assert.equal(store.events.length, before, 'owner visits must be excluded');
    const overview = await (await call('overview?days=7', { headers: { Cookie: cookie } })).json();
    assert.equal(overview.totals.visitors, 1);
    assert.equal(overview.totals.projectOpens, 1);
    assert.equal(overview.totals.linkedinClicks, 1);
    assert.deepEqual(overview.campaigns, [
      { source: 'whatsapp', campaign: 'profile', visitors: 1 },
    ]);
    assert.ok(!JSON.stringify(overview).includes('private@example.com'));
  });
});

test('collector acknowledges retries without duplicate counts and never acknowledges failed persistence', async () => {
  await fixture(async ({ call, store }) => {
    const queued = { ...event, eventId: '7ac5bde7-d744-49ea-b6b3-9a51f339b1b1' };
    for (let retry = 0; retry < 3; retry++)
      assert.equal((await call('collect', collect(queued))).status, 204);
    assert.equal(store.events.length, 1);
    assert.equal(store.events[0].eventId, queued.eventId);
    const totals = (await store.overview(7)).totals;
    assert.equal(totals.visitors, 1);
    assert.equal(totals.pageviews, 1);
    assert.equal((await call('collect', collect({ ...event, eventId: 'invalid id' }))).status, 400);
    const insertEvent = store.insertEvent.bind(store);
    store.insertEvent = async () => {
      throw new Error('test persistence interruption');
    };
    assert.equal(
      (
        await call(
          'collect',
          collect({ ...event, eventId: 'c80f8bc0-07a1-47bf-b81f-10742c52b31e' }),
        )
      ).status,
      503,
    );
    store.insertEvent = insertEvent;
    assert.equal(
      (
        await call(
          'collect',
          collect({ ...event, eventId: 'c80f8bc0-07a1-47bf-b81f-10742c52b31e' }),
        )
      ).status,
      204,
    );
    assert.equal(store.events.length, 2);
  });
});

test('queued event timestamps retain original dates and do not appear as recent visitors', async () => {
  await fixture(async ({ call, store }) => {
    const now = Date.now();
    const occurredAt = new Date(now - 10 * 60_000).toISOString();
    const response = await call('collect', collect({ ...event, occurredAt }));
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-expose-headers'), 'Retry-After');
    assert.equal(store.events[0].occurredAt.toISOString(), occurredAt);
    const overview = await store.overview(7);
    assert.equal(overview.totals.recentVisitors, 0);
    const originalDate = reportRange(1, new Date(occurredAt)).end;
    assert.equal(overview.daily.find((day) => day.date === originalDate)?.visitors, 1);
    assert.equal(overview.lastEventAt, occurredAt);
    for (const invalid of [
      'invalid',
      '2026-99-40T00:00:00.000Z',
      new Date(now - 25 * 60 * 60_000).toISOString(),
      new Date(now + 10 * 60_000).toISOString(),
      null,
    ]) {
      assert.equal((await call('collect', collect({ ...event, occurredAt: invalid }))).status, 400);
    }
    assert.equal(store.events.length, 1);
    const nearFuture = await call(
      'collect',
      collect({ ...event, occurredAt: new Date(now + 60_000).toISOString() }),
    );
    assert.equal(nearFuture.status, 204);
    assert.ok(store.events[1].occurredAt.getTime() <= Date.now());
    assert.ok(store.events[1].occurredAt.getTime() >= now);
    const legacy = await call('collect', collect(event));
    assert.equal(legacy.status, 204);
    assert.ok(store.events[2].occurredAt.getTime() >= now);
  });
});

test('cross-site login/setup is denied, failed logins are rate-limited, and sessions expire', async () => {
  await fixture(async ({ call, store }) => {
    assert.equal(
      (
        await call(
          'setup',
          mutation({ token: setupToken, password }, undefined, 'https://kristiansalmeron.com'),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call(
          'setup',
          mutation({ token: setupToken, password }, undefined, 'https://evil.example'),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call('setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
      ).status,
      403,
    );
    const setup = await call('setup', mutation({ token: setupToken, password }));
    const cookie = setup.headers.get('set-cookie')!.split(';')[0];
    await call('logout', mutation({}, cookie));
    for (let i = 0; i < 8; i++)
      assert.equal(
        (
          await call(
            'login',
            mutation({ email: 'wrong@example.com', password: 'incorrect password' }),
          )
        ).status,
        401,
      );
    const limited = await call('login', mutation({ email: ownerEmail, password }));
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('retry-after'), '900');
    store.limits.clear();
    const login = await call('login', mutation({ email: ownerEmail.toUpperCase(), password }));
    assert.equal(login.status, 200);
    const sessionCookie = login.headers.get('set-cookie')!.split(';')[0];
    for (const key of store.sessions.keys()) store.sessions.set(key, new Date(Date.now() - 1));
    assert.equal((await call('overview', { headers: { Cookie: sessionCookie } })).status, 401);
  });
});

test('WhatsApp browser visits count while engine-less previews and privacy opt-outs do not', async () => {
  await fixture(async ({ call, store }) => {
    const real = collect(event);
    const browser = await call('collect', {
      ...real,
      headers: {
        ...real.headers,
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 WhatsApp/2.26.1',
      },
    });
    assert.equal(browser.status, 204);
    assert.equal(store.events.length, 1);
    assert.equal(store.events[0].source, 'whatsapp');
    assert.equal(store.events[0].device, 'mobile');
    const preview = await call('collect', {
      ...real,
      headers: { ...real.headers, 'User-Agent': 'WhatsApp/2.26.1' },
    });
    assert.equal(preview.status, 204);
    assert.equal(store.events.length, 1);
    const optedOut = await call('collect', {
      ...real,
      headers: { ...real.headers, 'Sec-GPC': '1' },
    });
    assert.equal(optedOut.status, 204);
    assert.equal(store.events.length, 1);
  });
});

test('password recovery prevents an old-password login from issuing a delayed session', async () => {
  await fixture(async ({ call, store }) => {
    const setup = await call('setup', mutation({ token: setupToken, password }));
    assert.equal(setup.status, 201);
    const oldCookie = setup.headers.get('set-cookie')!.split(';')[0];
    const originalCreateSession = store.createSession.bind(store);
    let signalIssuance!: () => void;
    let resumeIssuance!: () => void;
    const issuanceStarted = new Promise<void>((resolve) => {
      signalIssuance = resolve;
    });
    const issuanceMayContinue = new Promise<void>((resolve) => {
      resumeIssuance = resolve;
    });
    store.createSession = async (hash, expiry, expectedHash) => {
      signalIssuance();
      await issuanceMayContinue;
      return originalCreateSession(hash, expiry, expectedHash);
    };
    const pendingLogin = call('login', mutation({ email: ownerEmail, password }));
    await issuanceStarted; // The old password has been verified; issuance is paused.
    const newPassword = 'a newly recovered private owner password';
    store.owner = { email: ownerEmail, passwordHash: await hashPassword(newPassword) };
    store.sessions.clear();
    resumeIssuance();
    const oldLogin = await pendingLogin;
    assert.equal(oldLogin.status, 401);
    assert.equal(oldLogin.headers.get('set-cookie'), null);
    assert.equal(store.sessions.size, 0);
    assert.equal((await call('overview', { headers: { Cookie: oldCookie } })).status, 401);
    store.createSession = originalCreateSession;
    assert.equal((await call('login', mutation({ email: ownerEmail, password }))).status, 401);
    assert.equal(
      (await call('login', mutation({ email: ownerEmail, password: newPassword }))).status,
      200,
    );
  });
});

test('unconfigured analytics fails closed without public visitor data', async () => {
  await fixture(
    async ({ call }) => {
      const response = await call('overview');
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.error.code, 'ANALYTICS_UNAVAILABLE');
      assert.ok(!JSON.stringify(body).includes('password'));
    },
    { hashSecret: '' },
  );
});

test('dashboard shell and fixed assets serve from hidden workspace ancestors without visitor data', async () => {
  await fixture(
    async ({ base, call }) => {
      const shell = await fetch(base + '/');
      assert.equal(shell.status, 200);
      assert.match(shell.headers.get('content-type') ?? '', /text\/html/);
      assert.match(shell.headers.get('cache-control') ?? '', /no-store/);
      assert.match(shell.headers.get('content-security-policy') ?? '', /script-src 'self'/);
      const html = await shell.text();
      assert.match(html, /Studio Insights/);
      assert.match(html, /\/analytics-assets\/app.js/);
      assert.ok(!html.includes(setupToken));
      assert.ok(!html.includes(ownerEmail));
      const script = await fetch(base + '/analytics-assets/app.js');
      assert.equal(script.status, 200);
      assert.match(script.headers.get('content-type') ?? '', /javascript/);
      assert.ok((await script.text()).length > 100);
      const css = await fetch(base + '/analytics-assets/styles.css');
      assert.equal(css.status, 200);
      assert.match(css.headers.get('content-type') ?? '', /text\/css/);
      assert.ok((await css.text()).length > 100);
      assert.equal((await fetch(base + '/login/')).status, 200);
      const missing = await fetch(base + '/analytics-assets/missing.js');
      assert.equal(missing.status, 404);
      assert.equal((await missing.json()).error.code, 'NOT_FOUND');
      assert.equal(
        (await call('overview')).status,
        401,
        'serving the shell must not expose reporting data',
      );
    },
    { serveWeb: true },
  );
});

test(
  'Postgres persists owner, atomic setup, hashed sessions, events, and rate limits',
  { skip: !process.env.ANALYTICS_TEST_DATABASE_URL },
  async () => {
    const url = new URL(process.env.ANALYTICS_TEST_DATABASE_URL!);
    assert.match(url.pathname, /(?:test|review)/, 'Use a disposable test/review database only.');
    const admin = new Pool({ connectionString: url.toString(), max: 1 });
    const schema = `analytics_test_${randomBytes(8).toString('hex')}`;
    await admin.query(`CREATE SCHEMA ${schema}`);
    url.searchParams.set('options', `-c search_path=${schema}`);
    const store = new PostgresAnalyticsStore(url.toString());
    let second: PostgresAnalyticsStore | undefined;
    try {
      await store.ready();
      const races = await Promise.all([
        store.createOwner({ email: ownerEmail, passwordHash: 'stored-password-hash' }),
        store.createOwner({ email: 'other@example.com', passwordHash: 'second-password-hash' }),
      ]);
      assert.equal(races.filter(Boolean).length, 1);
      const winningEmail = races[0] ? ownerEmail : 'other@example.com';
      assert.equal((await store.getOwner())?.email, winningEmail);
      const currentHash = (await store.getOwner())!.passwordHash;
      assert.equal(
        await store.createSession(
          'hashed-session-only',
          new Date(Date.now() + 60_000),
          currentHash,
        ),
        true,
      );
      const event: AnalyticsEvent = {
        eventId: 'persisted-pageview-unique-id',
        event: 'pageview',
        path: '/',
        referrer: '',
        source: 'facebook',
        medium: 'social',
        campaign: 'bio',
        visitorHash: 'hashed-visitor-only',
        sessionHash: 'hashed-session-only',
        project: '',
        section: '',
        mode: '',
        target: '',
        device: 'desktop',
        occurredAt: new Date(),
      };
      await store.insertEvent(event);
      await store.insertEvent(event); // A retried HTTP request must not count twice.
      await store.insertEvent({
        ...event,
        eventId: 'persisted-project-unique-id',
        event: 'project_open',
        project: 'careiq',
      });
      await store.insertEvent({
        ...event,
        eventId: 'persisted-linkedin-unique-id',
        event: 'outbound_click',
        target: 'linkedin',
      });
      assert.equal(await store.consumeRateLimit('test-login-limit', 1, 60_000), true);
      second = new PostgresAnalyticsStore(url.toString());
      await second.ready();
      assert.equal(await second.consumeRateLimit('test-login-limit', 1, 60_000), false);
      assert.equal((await second.getSession('hashed-session-only'))?.email, winningEmail);
      const overview = await second.overview(7);
      assert.equal(overview.totals.visitors, 1);
      assert.equal(overview.totals.pageviews, 1);
      assert.equal(overview.totals.projectOpens, 1);
      assert.equal(overview.totals.linkedinClicks, 1);
      assert.equal(overview.totals.recentVisitors, 1);
      assert.equal(overview.daily.length, 7);
      assert.equal(
        overview.daily.reduce((sum, day) => sum + day.visitors, 0),
        1,
      );
      assert.deepEqual(overview.sources, [{ source: 'facebook', visitors: 1 }]);
      await second.deleteSession('hashed-session-only');
      assert.equal(await store.getSession('hashed-session-only'), null);
      // Hold the same owner row lock used by the recovery command, then attempt
      // issuance with credentials that are becoming stale while recovery commits.
      const recovery = new Pool({ connectionString: url.toString(), max: 1 });
      const recoveryClient = await recovery.connect();
      try {
        await recoveryClient.query('BEGIN');
        await recoveryClient.query('UPDATE analytics_owner SET password_hash = $1 WHERE id = 1', [
          'recovered-password-hash',
        ]);
        await recoveryClient.query('DELETE FROM analytics_sessions');
        const staleIssuance = store.createSession(
          'stale-session-after-recovery',
          new Date(Date.now() + 60_000),
          currentHash,
        );
        await recoveryClient.query('COMMIT');
        assert.equal(await staleIssuance, false);
        assert.equal(await store.getSession('stale-session-after-recovery'), null);
        assert.equal(
          await store.createSession(
            'new-password-session',
            new Date(Date.now() + 60_000),
            'recovered-password-hash',
          ),
          true,
        );
        assert.ok(await store.getSession('new-password-session'));
      } finally {
        recoveryClient.release();
        await recovery.end();
      }
      await store.cleanup();
    } finally {
      await second?.close();
      await store.close();
      await admin.query(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
    }
  },
);
