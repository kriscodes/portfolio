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
  campaign: 'bio',
  visitorId: 'visitor_123456789abcdefghijklmn',
  sessionId: 'session_123456789abcdefghijklmn',
  referrer: 'l.facebook.com',
};

const v2Event = {
  ...event,
  schemaVersion: 2,
  site: 'portfolio',
  visitScope: 'shared',
  pageId: 'page_123456789abcdefghijklmn',
  eventId: 'event_123456789abcdefghijklmn',
  occurredAt: new Date().toISOString(),
};

test('CareIQ origins collect only allowlisted measurements and report each app separately', async () => {
  await fixture(async ({ store, call }) => {
    await store.createOwner({ email: ownerEmail, passwordHash: await hashPassword(password) });
    const login = await call('login', mutation({ email: ownerEmail, password }));
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')!.split(';', 1)[0];
    const send = (host: string, body: Record<string, unknown>) => {
      const request = collect(body);
      request.headers = { ...request.headers, Origin: `https://${host}` };
      return call('collect', request);
    };
    const web = {
      ...v2Event,
      site: 'careiq-web',
      visitScope: 'local',
      path: '/',
      referrer: 'careiqlabs.com',
      previousPageId: v2Event.pageId,
    };
    const marketing = {
      ...web,
      site: 'careiq-marketing',
      path: '/research/',
      eventId: 'careiq_marketing_pageview',
    };
    assert.equal((await send('app.careiqlabs.com', web)).status, 204);
    assert.equal((await send('careiqlabs.com', marketing)).status, 204);
    assert.equal((await send('staging.careiqlabs.com', web)).status, 403);
    for (const payload of [
      { ...web, site: 'careiq-marketing' },
      { ...web, visitScope: 'shared' },
      { ...web, path: '/patient-workflow/123' },
      { ...web, path: '/?ticket=private' },
      { ...web, event: 'page_engagement', activeMs: 1000 },
    ]) {
      assert.equal((await send('app.careiqlabs.com', payload)).status, 400);
    }
    assert.equal(
      (
        await send('careiqlabs.com', {
          ...marketing,
          event: 'scroll_depth',
          scrollDepth: 50,
          eventId: 'careiq_marketing_scroll50',
        })
      ).status,
      204,
    );
    assert.equal(store.events.length, 3);
    assert.equal(store.events[0].referrer, '');
    assert.equal(store.events[0].previousPageHash, '');
    assert.equal(store.events[0].campaign, '');
    assert.notEqual(store.events[0].visitorHash, store.events[1].visitorHash);
    assert.equal((await call('overview?site=careiq-web')).status, 401);
    for (const site of ['careiq-web', 'careiq-marketing']) {
      const response = await call(`overview?days=7&site=${site}`, { headers: { Cookie: cookie } });
      assert.equal(response.status, 200);
      const report = await response.json();
      assert.equal(report.totals.visitors, 1);
      assert.equal(report.totals.pageviews, 1);
      assert.equal(report.daily.at(-1).visitors, 1);
      assert.deepEqual(
        report.insights.sites.map((row: { site: string }) => row.site),
        [site],
      );
      assert.equal(report.insights.pages[0].scroll50, site === 'careiq-marketing' ? 1 : 0);
      assert.equal(report.pages[0].site, site);
    }
    const all = await (await call('overview', { headers: { Cookie: cookie } })).json();
    assert.equal(all.totals.visitors, 2);
    assert.equal(
      (await call('overview?site=any-other-site', { headers: { Cookie: cookie } })).status,
      400,
    );
  });
});

test('v2 collector enforces site origins, measurement shape, and fixed sanitized catalogs', async () => {
  await fixture(async ({ store, call }) => {
    const send = (body: unknown, site = 'portfolio') => {
      const request = collect(body);
      request.headers = {
        ...request.headers,
        Origin:
          site === 'portfolio'
            ? 'https://kristiansalmeron.com'
            : `https://${site}.kristiansalmeron.com`,
      };
      return call('collect', request);
    };
    assert.equal((await send({ ...v2Event, site: 'lab' })).status, 400);
    assert.equal(
      (
        await send(
          {
            ...v2Event,
            site: 'lab',
            content: 'pdf-rendering',
            event: 'experiment_open',
            path: '/experiments/pdf-rendering/?prompt=secret#private',
            referrer: 'private-person.example.com',
            campaign: 'private-person',
          },
          'lab',
        )
      ).status,
      204,
    );
    const recorded = store.events[0];
    assert.equal(recorded.site, 'lab');
    assert.equal(recorded.path, '/experiments/pdf-rendering/');
    assert.equal(recorded.referrer, '');
    assert.equal(recorded.campaign, '');
    assert.equal(recorded.content, 'pdf-rendering');
    assert.match(recorded.pageHash!, /^[a-f0-9]{64}$/);
    assert.ok(!JSON.stringify(recorded).includes(v2Event.pageId));
    for (const activeMs of [-1, 0.5, 86_400_001, '100']) {
      assert.equal((await send({ ...v2Event, event: 'page_engagement', activeMs })).status, 400);
    }
    assert.equal((await send({ ...v2Event, event: 'scroll_depth', scrollDepth: 42 })).status, 400);
    assert.equal((await send({ ...v2Event, event: 'page_engagement' })).status, 400);
    assert.equal(
      (
        await send({
          ...v2Event,
          event: 'tool_action',
          content: 'prompt-builder',
          action: 'generate',
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await send(
          {
            ...v2Event,
            eventId: 'action_123456789abcdefghijklmn',
            site: 'toolbox',
            event: 'tool_action',
            path: '/tools/prompt-builder/',
            content: 'prompt-builder',
            action: 'generate',
            prompt: 'never store this',
            form: { email: 'private@example.com' },
          },
          'toolbox',
        )
      ).status,
      204,
    );
    assert.equal(store.events.at(-1)?.action, 'generate');
    assert.ok(!JSON.stringify(store.events).includes('never store this'));
    assert.equal(
      (
        await send({
          ...v2Event,
          eventId: 'outbound_123456789abcdefghijklmn',
          event: 'outbound_click',
          target: 'toolbox',
          destinationSite: 'toolbox',
          destinationPath: '/tools/prompt-builder/?value=private#secret',
        })
      ).status,
      204,
    );
    assert.equal(store.events.at(-1)?.destinationPath, '/tools/prompt-builder/');
    assert.equal(
      (
        await send({
          ...v2Event,
          eventId: 'unknown_123456789abcdefghijklmn',
          path: '/field-notes/private-person/',
          source: 'anything',
          medium: 'anything',
          campaign: 'winter-update',
        })
      ).status,
      204,
    );
    assert.equal(store.events.at(-1)?.path, '/unknown/');
    assert.equal(store.events.at(-1)?.source, 'unknown');
    assert.equal(store.events.at(-1)?.campaign, 'winter-update');
  });
});

test('v2 shared visits match subdomains; local visits stay separate and day boundaries break linkage', async () => {
  await fixture(async ({ store, call }) => {
    const send = (site: string, scope: string, occurredAt: string, id: string) => {
      const request = collect({
        ...v2Event,
        site,
        visitScope: scope,
        occurredAt,
        eventId: id,
        path: '/',
      });
      request.headers = {
        ...request.headers,
        Origin:
          site === 'portfolio'
            ? 'https://kristiansalmeron.com'
            : `https://${site}.kristiansalmeron.com`,
      };
      return call('collect', request);
    };
    const now = new Date().toISOString();
    for (const [site, scope, id] of [
      ['portfolio', 'shared', 'shared_1111111111111111'],
      ['lab', 'shared', 'shared_2222222222222222'],
      ['portfolio', 'local', 'local_11111111111111111'],
      ['lab', 'local', 'local_22222222222222222'],
    ]) {
      assert.equal((await send(site, scope, now, id)).status, 204);
    }
    assert.equal(store.events[0].sessionHash, store.events[1].sessionHash);
    assert.equal(store.events[0].visitorHash, store.events[1].visitorHash);
    assert.notEqual(store.events[2].sessionHash, store.events[3].sessionHash);
    assert.notEqual(store.events[2].visitorHash, store.events[3].visitorHash);
    const yesterday = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    assert.equal(
      (await send('portfolio', 'shared', yesterday, 'yesterday_11111111111111')).status,
      204,
    );
    assert.notEqual(store.events[0].sessionHash, store.events[4].sessionHash);
    assert.notEqual(store.events[0].visitorHash, store.events[4].visitorHash);
  });
});

test('shared opt-out cookie excludes new and legacy sends without changing owner authentication', async () => {
  await fixture(async ({ store, call }) => {
    assert.equal(
      (await call('collect', collect(v2Event, 'other=value; ks_analytics_opt_out=1'))).status,
      204,
    );
    assert.equal(
      (await call('collect', collect(event, 'ks_analytics_opt_out=1; other=value'))).status,
      204,
    );
    assert.equal(store.events.length, 0);
    assert.equal((await call('collect', collect(v2Event, 'ks_analytics_opt_out=0'))).status, 204);
    assert.equal(store.events.length, 1);
  });
});

test('legacy queued events receive the same path, referrer and campaign privacy filtering', async () => {
  await fixture(async ({ store, call }) => {
    assert.equal(
      (
        await call(
          'collect',
          collect({
            ...event,
            path: '/field-notes/private-person/',
            referrer: 'person.example.com',
            campaign: 'private-person',
          }),
        )
      ).status,
      204,
    );
    assert.equal(store.events[0].schemaVersion, 1);
    assert.equal(store.events[0].path, '/unknown/');
    assert.equal(store.events[0].referrer, '');
    assert.equal(store.events[0].campaign, '');
    assert.equal(store.events[0].source, 'whatsapp');
  });
});

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
    assert.deepEqual(overview.campaigns, [{ source: 'whatsapp', campaign: 'bio', visitors: 1 }]);
    assert.ok(!JSON.stringify(overview).includes('private@example.com'));
  });
});

test('GitHub visits retain their source and campaign in owner reports', async () => {
  await fixture(async ({ call, store }) => {
    const response = await call(
      'collect',
      collect({ ...event, source: 'github', medium: 'social', campaign: 'portfolio', path: '/' }),
    );
    assert.equal(response.status, 204);
    assert.equal(store.events[0].source, 'github');
    assert.equal(store.events[0].medium, 'social');
    const setup = await call('setup', mutation({ token: setupToken, password }));
    const cookie = setup.headers.get('set-cookie')!.split(';')[0];
    const overview = await (await call('overview?days=7', { headers: { Cookie: cookie } })).json();
    assert.deepEqual(overview.sources, [{ source: 'github', visitors: 1 }]);
    assert.deepEqual(overview.campaigns, [
      { source: 'github', campaign: 'portfolio', visitors: 1 },
    ]);
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
      await store.insertEvent({
        ...event,
        schemaVersion: 2,
        eventId: 'persisted-careiq-unique-id',
        site: 'careiq-marketing',
        pageHash: 'hashed-careiq-page',
        visitorHash: 'hashed-careiq-visitor',
        sessionHash: 'hashed-careiq-session',
        path: '/research/',
      });
      const marketing = await second.overview(7, 'careiq-marketing');
      assert.equal(marketing.totals.pageviews, 1);
      assert.equal(marketing.totals.visitors, 1);
      assert.equal(marketing.insights.pages[0].path, '/research/');
      assert.equal((await second.overview(7, 'portfolio')).totals.pageviews, 1);
      assert.equal((await second.overview(7, 'careiq-web')).totals.pageviews, 0);
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

test('staging collection accepts staging origins and refuses production origins', async () => {
  await fixture(
    async ({ call }) => {
      const stage = await call('collect', {
        method: 'OPTIONS',
        headers: { Origin: 'https://staging.kristiansalmeron.com' },
      });
      assert.equal(stage.status, 204);
      assert.equal(
        stage.headers.get('access-control-allow-origin'),
        'https://staging.kristiansalmeron.com',
      );
      const production = await call('collect', {
        method: 'OPTIONS',
        headers: { Origin: 'https://kristiansalmeron.com' },
      });
      assert.equal(production.status, 403);
    },
    { environment: 'staging', origin: 'https://analytics.staging.kristiansalmeron.com' },
  );
  await fixture(async ({ call }) => {
    const response = await call('collect', {
      method: 'OPTIONS',
      headers: { Origin: 'https://staging.kristiansalmeron.com' },
    });
    assert.equal(response.status, 403);
  });
});
