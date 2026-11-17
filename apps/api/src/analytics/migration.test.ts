import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { Pool } from 'pg';
import { PostgresAnalyticsStore } from './store.js';
import type { AnalyticsEvent } from './types.js';

test(
  'additive migration preserves populated legacy events, owner credentials and active sessions, then reruns safely',
  { skip: !process.env.ANALYTICS_TEST_DATABASE_URL },
  async () => {
    const url = new URL(process.env.ANALYTICS_TEST_DATABASE_URL!);
    assert.match(url.pathname, /(?:test|review)/, 'Use a disposable test/review database only.');
    const admin = new Pool({ connectionString: url.toString(), max: 1 });
    const schema = `analytics_migration_${randomBytes(8).toString('hex')}`;
    await admin.query(`CREATE SCHEMA ${schema}`);
    url.searchParams.set('options', `-c search_path=${schema}`);
    const legacy = new Pool({ connectionString: url.toString(), max: 1 });
    const store = new PostgresAnalyticsStore(url.toString());
    const rerun = new PostgresAnalyticsStore(url.toString());
    try {
      await legacy.query(`
      CREATE TABLE analytics_owner (id SMALLINT PRIMARY KEY CHECK (id = 1), email TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      CREATE TABLE analytics_sessions (token_hash TEXT PRIMARY KEY, owner_id SMALLINT NOT NULL REFERENCES analytics_owner(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      CREATE TABLE analytics_events (
        id BIGSERIAL PRIMARY KEY, occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), event TEXT NOT NULL,
        path TEXT NOT NULL, referrer TEXT NOT NULL, source TEXT NOT NULL, medium TEXT NOT NULL, campaign TEXT NOT NULL,
        visitor_hash TEXT NOT NULL, session_hash TEXT NOT NULL, project TEXT NOT NULL, section TEXT NOT NULL,
        mode TEXT NOT NULL, target TEXT NOT NULL, device TEXT NOT NULL, event_id TEXT
      );
      INSERT INTO analytics_owner VALUES (1, 'existing-owner@example.com', 'existing-password-hash', NOW());
      INSERT INTO analytics_sessions (token_hash, owner_id, expires_at) VALUES ('existing-auth-session', 1, NOW() + INTERVAL '1 hour');
      INSERT INTO analytics_events (event, path, referrer, source, medium, campaign, visitor_hash, session_hash, project, section, mode, target, device, event_id)
        VALUES ('pageview','/','', 'github', 'social', 'historical-custom-campaign', 'old-visitor', 'old-visit', '', '', '', '', 'desktop', 'old-event');
    `);
      await store.ready();
      assert.equal((await store.getOwner())?.passwordHash, 'existing-password-hash');
      assert.equal(
        (await store.getSession('existing-auth-session'))?.email,
        'existing-owner@example.com',
      );
      assert.equal(
        await store.createOwner({ email: 'other@example.com', passwordHash: 'different' }),
        false,
      );
      const oldRow = (
        await legacy.query("SELECT * FROM analytics_events WHERE event_id = 'old-event'")
      ).rows[0];
      assert.equal(oldRow.schema_version, 1);
      assert.equal(oldRow.site, 'portfolio');
      assert.equal(oldRow.active_ms, null);
      assert.equal(oldRow.received_at, null);
      assert.equal(oldRow.campaign, 'historical-custom-campaign');
      const page: AnalyticsEvent = {
        eventId: 'new-page',
        event: 'pageview',
        path: '/tools/prompt-builder/',
        referrer: 'lab.kristiansalmeron.com',
        source: 'github',
        medium: 'social',
        campaign: 'portfolio',
        visitorHash: 'new-visitor',
        sessionHash: 'new-visit',
        project: '',
        section: '',
        mode: '',
        target: '',
        device: 'desktop',
        occurredAt: new Date(Date.now() - 65_000),
        schemaVersion: 2,
        site: 'toolbox',
        pageHash: 'new-page-hash',
        previousPageHash: '',
        visitScope: 'shared',
        content: 'prompt-builder',
      };
      await store.insertEvent(page);
      await store.insertEvent(page);
      await store.insertEvent({
        ...page,
        eventId: 'snapshot',
        event: 'page_engagement',
        occurredAt: new Date(Date.now() - 5_000),
        activeMs: 30_000,
        scrollDepth: 50,
      });
      await rerun.ready();
      const overview = await rerun.overview(7);
      assert.equal(overview.totals.pageviews, 2);
      assert.equal(overview.insights.coverage.legacyPageviews, 1);
      assert.equal(overview.insights.coverage.pageviews, 1);
      assert.equal(overview.insights.totals.avgActiveSeconds, 30);
      assert.equal(overview.insights.pages[0].scroll50, 1);
      assert.equal(overview.insights.pages[0].site, 'toolbox');
      assert.equal(overview.insights.movement[0].unmatchedArrivals, 1);
      assert.equal(
        (await rerun.getSession('existing-auth-session'))?.email,
        'existing-owner@example.com',
      );
      assert.equal(
        Number(
          (await legacy.query('SELECT COUNT(*) AS count FROM analytics_events')).rows[0].count,
        ),
        3,
      );
    } finally {
      await rerun.close();
      await store.close();
      await legacy.end();
      await admin.query(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
    }
  },
);
