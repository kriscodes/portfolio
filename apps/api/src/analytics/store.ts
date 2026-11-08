import { Pool } from 'pg';
import type { AnalyticsEvent, AnalyticsOverview, AnalyticsStore, Owner } from './types.js';
import { emptyDaily, reportRange } from './types.js';

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
      this.initialization = this.pool
        .query(SCHEMA)
        .then(() => undefined)
        .catch((error) => {
          this.initialization = undefined;
          throw error;
        });
    }
    await this.initialization;
    await this.pool.query('SELECT 1');
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
      `INSERT INTO analytics_events (occurred_at, event, path, referrer, source, medium, campaign, visitor_hash, session_hash, project, section, mode, target, device, event_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
      ],
    );
  }

  async overview(days: number): Promise<AnalyticsOverview> {
    const range = reportRange(days);
    const where = `WHERE occurred_at >= ($1::date::timestamp AT TIME ZONE 'America/Los_Angeles')
      AND occurred_at < (($2::date + 1)::timestamp AT TIME ZONE 'America/Los_Angeles')`;
    const values = [range.start, range.end];
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
          `SELECT path, COUNT(*) AS views FROM analytics_events ${where}
        AND event = 'pageview' GROUP BY path ORDER BY views DESC, path LIMIT 20`,
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
        this.pool.query('SELECT MAX(occurred_at) AS last_event_at FROM analytics_events'),
      ]);
    const dailyCounts = new Map(
      daily.rows.map((row) => [row.date as string, Number(row.visitors)]),
    );
    const n = totals.rows[0];
    return {
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
      pages: pages.rows.map((row) => ({ path: row.path, views: Number(row.views) })),
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
  async overview(days: number): Promise<AnalyticsOverview> {
    const range = reportRange(days);
    const dateOf = (event: AnalyticsEvent) => reportRange(1, event.occurredAt).end;
    const events = this.events.filter(
      (event) => dateOf(event) >= range.start && dateOf(event) <= range.end,
    );
    const unique = (rows: AnalyticsEvent[]) => new Set(rows.map((event) => event.visitorHash)).size;
    const grouped = (key: 'source' | 'project' | 'section' | 'path' | 'device') => [
      ...new Set(events.map((event) => event[key]).filter(Boolean)),
    ];
    const campaigns = [
      ...new Set(
        events
          .filter((event) => event.campaign)
          .map((event) => JSON.stringify([event.source, event.campaign])),
      ),
    ];
    return {
      range,
      totals: {
        visitors: unique(events),
        pageviews: events.filter((event) => event.event === 'pageview').length,
        projectOpens: events.filter((event) => event.event === 'project_open').length,
        linkedinClicks: events.filter(
          (event) => event.event === 'outbound_click' && event.target === 'linkedin',
        ).length,
        recentVisitors: unique(
          events.filter((event) => event.occurredAt.getTime() >= Date.now() - 300_000),
        ),
      },
      daily: emptyDaily(range).map((row) => ({
        ...row,
        visitors: unique(events.filter((event) => dateOf(event) === row.date)),
      })),
      sources: grouped('source').map((source) => ({
        source,
        visitors: unique(events.filter((event) => event.source === source)),
      })),
      projects: grouped('project').map((project) => ({
        project,
        opens: events.filter((event) => event.project === project && event.event === 'project_open')
          .length,
        previews: events.filter(
          (event) => event.project === project && event.event === 'project_preview_open',
        ).length,
      })),
      sections: grouped('section').map((section) => ({
        section,
        opens: events.filter(
          (event) => event.section === section && event.event === 'studio_section_open',
        ).length,
      })),
      pages: grouped('path').map((path) => ({
        path,
        views: events.filter((event) => event.path === path && event.event === 'pageview').length,
      })),
      devices: grouped('device').map((device) => ({
        device,
        visitors: unique(events.filter((event) => event.device === device)),
      })),
      campaigns: campaigns.map((group) => {
        const [source, campaign] = JSON.parse(group) as [string, string];
        return {
          source,
          campaign,
          visitors: unique(
            events.filter((event) => event.source === source && event.campaign === campaign),
          ),
        };
      }),
      lastEventAt: this.events.at(-1)?.occurredAt.toISOString() ?? null,
    };
  }
  async cleanup() {}
  async close() {}
}
