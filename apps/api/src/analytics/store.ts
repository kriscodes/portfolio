import { Pool } from 'pg';
import { isCareIqSite } from './catalog.js';
import type {
  AnalyticsEvent,
  AnalyticsOverview,
  AnalyticsSite,
  AnalyticsStore,
  Owner,
} from './types.js';
import { emptyDaily, reportRange } from './types.js';
import { buildInsights, INSIGHTS_EVENT_LIMIT } from './insights.js';
import { summarizeEvents } from './summarize.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS analytics_owner (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS analytics_sessions (
  token_hash TEXT PRIMARY KEY,
  owner_id SMALLINT NOT NULL REFERENCES analytics_owner(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS analytics_rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  resets_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT NOT NULL,
  source TEXT NOT NULL,
  medium TEXT NOT NULL,
  campaign TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  project TEXT NOT NULL,
  section TEXT NOT NULL,
  mode TEXT NOT NULL,
  target TEXT NOT NULL,
  device TEXT NOT NULL
);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS event_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_event_id_idx ON analytics_events (event_id);
CREATE INDEX IF NOT EXISTS analytics_events_time_idx ON analytics_events (occurred_at);
CREATE INDEX IF NOT EXISTS analytics_events_visitor_time_idx ON analytics_events (visitor_hash, occurred_at);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS schema_version SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS site TEXT NOT NULL DEFAULT 'portfolio';
CREATE INDEX IF NOT EXISTS analytics_events_site_time_idx ON analytics_events (site, occurred_at);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS page_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS previous_page_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visit_scope TEXT NOT NULL DEFAULT 'local';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS active_ms INTEGER;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS scroll_depth SMALLINT;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT '';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS destination_site TEXT NOT NULL DEFAULT '';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS destination_path TEXT NOT NULL DEFAULT '';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS analytics_events_session_time_idx ON analytics_events (session_hash, occurred_at);
CREATE INDEX IF NOT EXISTS analytics_events_v2_time_idx ON analytics_events (occurred_at) WHERE schema_version = 2;
CREATE INDEX IF NOT EXISTS analytics_sessions_expiry_idx ON analytics_sessions (expires_at);
`;

export class PostgresAnalyticsStore implements AnalyticsStore {
  private readonly pool: Pool;
  private initialization: Promise<void> | undefined;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 4,
      connectionTimeoutMillis: 8_000,
      idleTimeoutMillis: 30_000,
    });
    this.pool.on('error', () => console.error('Analytics database connection interrupted.'));
  }

  async ready() {
    if (!this.initialization) {
      this.initialization = this.migrate().catch((error) => {
        this.initialization = undefined;
        throw error;
      });
    }
    await this.initialization;
    await this.pool.query('SELECT 1');
  }

  private async migrate() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '5s'");
      // Serialize overlapping deploys. Failed migrations roll back and can retry.
      await client.query('SELECT pg_advisory_xact_lock(2048111701)');
      await client.query(SCHEMA);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOwner(): Promise<Owner | null> {
    const result = await this.pool.query(
      'SELECT email, password_hash FROM analytics_owner WHERE id = 1',
    );
    return result.rows[0]
      ? { email: result.rows[0].email, passwordHash: result.rows[0].password_hash }
      : null;
  }

  async createOwner(owner: Owner) {
    const result = await this.pool.query(
      'INSERT INTO analytics_owner (id, email, password_hash) VALUES (1, $1, $2) ON CONFLICT (id) DO NOTHING RETURNING id',
      [owner.email, owner.passwordHash],
    );
    return result.rowCount === 1;
  }

  async createSession(tokenHash: string, expiresAt: Date, expectedPasswordHash: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Password recovery updates this same row before revoking all sessions. Taking
      // its lock serializes issuance with recovery: sessions issued first are revoked,
      // and sessions issued after recovery must match the new password hash.
      const owner = await client.query(
        'SELECT password_hash FROM analytics_owner WHERE id = 1 FOR UPDATE',
      );
      if (!owner.rows[0] || owner.rows[0].password_hash !== expectedPasswordHash) {
        await client.query('ROLLBACK');
        return false;
      }
      await client.query(
        'INSERT INTO analytics_sessions (token_hash, owner_id, expires_at) VALUES ($1, 1, $2)',
        [tokenHash, expiresAt],
      );
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getSession(tokenHash: string): Promise<Owner | null> {
    const result = await this.pool.query(
      'SELECT o.email, o.password_hash FROM analytics_sessions s JOIN analytics_owner o ON o.id = s.owner_id WHERE s.token_hash = $1 AND s.expires_at > NOW()',
      [tokenHash],
    );
    return result.rows[0]
      ? { email: result.rows[0].email, passwordHash: result.rows[0].password_hash }
      : null;
  }

  async deleteSession(tokenHash: string) {
    await this.pool.query('DELETE FROM analytics_sessions WHERE token_hash = $1', [tokenHash]);
  }

  async consumeRateLimit(key: string, limit: number, windowMs: number) {
    const result = await this.pool.query(
      `INSERT INTO analytics_rate_limits (key, attempts, resets_at)
       VALUES ($1, 1, NOW() + ($2 * INTERVAL '1 millisecond'))
       ON CONFLICT (key) DO UPDATE SET
         attempts = CASE WHEN analytics_rate_limits.resets_at <= NOW() THEN 1 ELSE analytics_rate_limits.attempts + 1 END,
         resets_at = CASE WHEN analytics_rate_limits.resets_at <= NOW() THEN EXCLUDED.resets_at ELSE analytics_rate_limits.resets_at END
       RETURNING attempts`,
      [key, windowMs],
    );
    return Number(result.rows[0].attempts) <= limit;
  }

  async insertEvent(event: AnalyticsEvent) {
    await this.pool.query(
      `INSERT INTO analytics_events (occurred_at, event, path, referrer, source, medium, campaign, visitor_hash, session_hash, project, section, mode, target, device, event_id, schema_version, site, page_hash, previous_page_hash, visit_scope, active_ms, scroll_depth, content, action, destination_site, destination_path, received_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,NOW())
       ON CONFLICT (event_id) DO NOTHING`,
      [
        event.occurredAt,
        event.event,
        event.path,
        event.referrer,
        event.source,
        event.medium,
        event.campaign,
        event.visitorHash,
        event.sessionHash,
        event.project,
        event.section,
        event.mode,
        event.target,
        event.device,
        event.eventId,
        event.schemaVersion ?? 1,
        event.site ?? 'portfolio',
        event.pageHash ?? '',
        event.previousPageHash ?? '',
        event.visitScope ?? 'local',
        event.activeMs ?? null,
        event.scrollDepth ?? null,
        event.content ?? '',
        event.action ?? '',
        event.destinationSite ?? '',
        event.destinationPath ?? '',
      ],
    );
  }

  async overview(days: number, site?: AnalyticsSite): Promise<AnalyticsOverview> {
    const range = reportRange(days);
    const where = `WHERE occurred_at >= ($1::date::timestamp AT TIME ZONE 'America/Los_Angeles')
      AND occurred_at < (($2::date + 1)::timestamp AT TIME ZONE 'America/Los_Angeles')
      AND ($3::text IS NULL OR site = $3)`;
    const values = [range.start, range.end, site ?? null];
    const [totals, daily, sources, projects, sections, pages, devices, campaigns, last] =
      await Promise.all([
        this.pool.query(
          `SELECT COUNT(DISTINCT visitor_hash) AS visitors,
        COUNT(*) FILTER (WHERE event = 'pageview') AS pageviews,
        COUNT(*) FILTER (WHERE event = 'project_open') AS project_opens,
        COUNT(*) FILTER (WHERE event = 'outbound_click' AND target = 'linkedin') AS linkedin_clicks,
        COUNT(DISTINCT visitor_hash) FILTER (WHERE occurred_at >= NOW() - INTERVAL '5 minutes') AS recent_visitors
        FROM analytics_events ${where}`,
          values,
        ),
        this.pool.query(
          `SELECT TO_CHAR(occurred_at AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD') AS date,
        COUNT(DISTINCT visitor_hash) AS visitors FROM analytics_events ${where} GROUP BY 1 ORDER BY 1`,
          values,
        ),
        this.pool.query(
          `SELECT source, COUNT(DISTINCT visitor_hash) AS visitors FROM analytics_events ${where}
        GROUP BY source ORDER BY visitors DESC, source LIMIT 20`,
          values,
        ),
        this.pool.query(
          `SELECT project,
        COUNT(*) FILTER (WHERE event = 'project_open') AS opens,
        COUNT(*) FILTER (WHERE event = 'project_preview_open') AS previews
        FROM analytics_events ${where} AND project <> '' GROUP BY project ORDER BY opens DESC, project LIMIT 10`,
          values,
        ),
        this.pool.query(
          `SELECT section, COUNT(*) AS opens FROM analytics_events ${where}
        AND event = 'studio_section_open' AND section <> '' GROUP BY section ORDER BY opens DESC, section LIMIT 10`,
          values,
        ),
        this.pool.query(
          `SELECT site, path, COUNT(*) AS views FROM analytics_events ${where}
        AND event = 'pageview' GROUP BY site, path ORDER BY views DESC, site, path LIMIT 30`,
          values,
        ),
        this.pool.query(
          `SELECT device, COUNT(DISTINCT visitor_hash) AS visitors FROM analytics_events ${where}
        GROUP BY device ORDER BY visitors DESC, device LIMIT 5`,
          values,
        ),
        this.pool.query(
          `SELECT source, campaign, COUNT(DISTINCT visitor_hash) AS visitors FROM analytics_events ${where}
        AND campaign <> '' GROUP BY source, campaign ORDER BY visitors DESC, campaign LIMIT 30`,
          values,
        ),
        this.pool.query(
          'SELECT MAX(occurred_at) AS last_event_at FROM analytics_events WHERE ($1::text IS NULL OR site = $1)',
          [site ?? null],
        ),
      ]);
    const dailyCounts = new Map(
      daily.rows.map((row) => [row.date as string, Number(row.visitors)]),
    );
    const n = totals.rows[0];
    const [insightEvents, insightMetadata] = await Promise.all([
      // Visits are day-scoped. The extra day preserves context at the selected boundary.
      // Bound memory on the small API instance and explicitly flag limited reports.
      this.pool.query(
        `SELECT * FROM analytics_events WHERE schema_version = 2
        AND occurred_at >= (($1::date - 1)::timestamp AT TIME ZONE 'America/Los_Angeles')
        AND occurred_at < (($2::date + 1)::timestamp AT TIME ZONE 'America/Los_Angeles')
        AND ($3::text IS NULL OR site = $3)
        ORDER BY occurred_at, id LIMIT $4`,
        [
          range.start,
          range.end,
          isCareIqSite(site ?? null) ? site : null,
          INSIGHTS_EVENT_LIMIT + 1,
        ],
      ),
      this.pool.query(
        `SELECT site, MAX(occurred_at) AS last_seen,
        MIN(occurred_at) FILTER (WHERE schema_version = 2) AS started,
        COUNT(*) FILTER (WHERE schema_version = 1 AND event = 'pageview'
          AND occurred_at >= ($1::date::timestamp AT TIME ZONE 'America/Los_Angeles')
          AND occurred_at < (($2::date + 1)::timestamp AT TIME ZONE 'America/Los_Angeles')) AS legacy
        FROM analytics_events WHERE ($3::text IS NULL OR site = $3) GROUP BY site`,
        values,
      ),
    ]);
    const measuredStarts = insightMetadata.rows
      .map((row) => row.started as Date | null)
      .filter((date): date is Date => date instanceof Date);
    const insights = buildInsights(
      insightEvents.rows.slice(0, INSIGHTS_EVENT_LIMIT).map(eventFromRow),
      range,
      new Date(),
      {
        site,
        measurementStartedAt: measuredStarts.length
          ? new Date(Math.min(...measuredStarts.map((date) => date.getTime()))).toISOString()
          : null,
        legacyPageviews: insightMetadata.rows.reduce((total, row) => total + Number(row.legacy), 0),
        siteLastSeen: Object.fromEntries(
          insightMetadata.rows.map((row) => [
            row.site,
            row.last_seen instanceof Date ? row.last_seen.toISOString() : null,
          ]),
        ),
        limited: insightEvents.rows.length > INSIGHTS_EVENT_LIMIT,
      },
    );
    return {
      insights,
      range,
      totals: {
        visitors: Number(n.visitors),
        pageviews: Number(n.pageviews),
        projectOpens: Number(n.project_opens),
        linkedinClicks: Number(n.linkedin_clicks),
        recentVisitors: Number(n.recent_visitors),
      },
      daily: emptyDaily(range).map((row) => ({ ...row, visitors: dailyCounts.get(row.date) ?? 0 })),
      sources: sources.rows.map((row) => ({ source: row.source, visitors: Number(row.visitors) })),
      projects: projects.rows.map((row) => ({
        project: row.project,
        opens: Number(row.opens),
        previews: Number(row.previews),
      })),
      sections: sections.rows.map((row) => ({ section: row.section, opens: Number(row.opens) })),
      pages: pages.rows.map((row) => ({
        site: row.site,
        path: row.path,
        views: Number(row.views),
      })),
      devices: devices.rows.map((row) => ({ device: row.device, visitors: Number(row.visitors) })),
      campaigns: campaigns.rows.map((row) => ({
        source: row.source,
        campaign: row.campaign,
        visitors: Number(row.visitors),
      })),
      lastEventAt:
        last.rows[0].last_event_at instanceof Date
          ? last.rows[0].last_event_at.toISOString()
          : null,
    };
  }

  async cleanup() {
    await this.pool.query(
      "DELETE FROM analytics_events WHERE id IN (SELECT id FROM analytics_events WHERE occurred_at < NOW() - INTERVAL '180 days' LIMIT 5000)",
    );
    await this.pool.query('DELETE FROM analytics_sessions WHERE expires_at <= NOW()');
    await this.pool.query('DELETE FROM analytics_rate_limits WHERE resets_at <= NOW()');
  }

  async close() {
    await this.pool.end();
  }
}

function eventFromRow(row: Record<string, unknown>): AnalyticsEvent {
  return {
    eventId: String(row.event_id ?? row.id),
    event: row.event as AnalyticsEvent['event'],
    path: String(row.path),
    referrer: String(row.referrer),
    source: String(row.source),
    medium: String(row.medium),
    campaign: String(row.campaign),
    visitorHash: String(row.visitor_hash),
    sessionHash: String(row.session_hash),
    project: String(row.project),
    section: String(row.section),
    mode: String(row.mode),
    target: String(row.target),
    device: row.device as AnalyticsEvent['device'],
    occurredAt: row.occurred_at as Date,
    schemaVersion: row.schema_version as 1 | 2,
    site: row.site as AnalyticsEvent['site'],
    pageHash: String(row.page_hash),
    previousPageHash: String(row.previous_page_hash),
    visitScope: row.visit_scope as AnalyticsEvent['visitScope'],
    activeMs: row.active_ms === null ? null : Number(row.active_ms),
    scrollDepth: row.scroll_depth as AnalyticsEvent['scrollDepth'],
    content: String(row.content),
    action: String(row.action),
    destinationSite: row.destination_site as AnalyticsEvent['destinationSite'],
    destinationPath: String(row.destination_path),
  };
}

/** Test-only adapter. Production always requires an explicitly configured durable store. */
export class MemoryAnalyticsStore implements AnalyticsStore {
  owner: Owner | null = null;
  readonly events: AnalyticsEvent[] = [];
  readonly eventIds = new Set<string>();
  readonly sessions = new Map<string, Date>();
  readonly limits = new Map<string, { attempts: number; expiresAt: number }>();
  async ready() {}
  async getOwner() {
    return this.owner;
  }
  async createOwner(owner: Owner) {
    if (this.owner) return false;
    this.owner = owner;
    return true;
  }
  async createSession(hash: string, expiresAt: Date, expectedPasswordHash: string) {
    if (!this.owner || this.owner.passwordHash !== expectedPasswordHash) return false;
    this.sessions.set(hash, expiresAt);
    return true;
  }
  async getSession(hash: string) {
    return (this.sessions.get(hash)?.getTime() ?? 0) > Date.now() ? this.owner : null;
  }
  async deleteSession(hash: string) {
    this.sessions.delete(hash);
  }
  async consumeRateLimit(key: string, limit: number, windowMs: number) {
    const current = this.limits.get(key);
    const entry =
      current && current.expiresAt > Date.now()
        ? current
        : { attempts: 0, expiresAt: Date.now() + windowMs };
    entry.attempts += 1;
    this.limits.set(key, entry);
    return entry.attempts <= limit;
  }
  async insertEvent(event: AnalyticsEvent) {
    if (this.eventIds.has(event.eventId)) return;
    this.eventIds.add(event.eventId);
    this.events.push(event);
  }
  async overview(days: number, site?: AnalyticsSite): Promise<AnalyticsOverview> {
    return summarizeEvents(this.events, days, new Date(), site);
  }
  async cleanup() {}
  async close() {}
}
