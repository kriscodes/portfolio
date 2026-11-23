import { isCareIqSite, siteOfHost } from './catalog.js';
import {
  ANALYTICS_SITES,
  type AnalyticsEvent,
  type AnalyticsInsights,
  type AnalyticsOverview,
  type AnalyticsSite,
} from './types.js';

const IDLE_MS = 30 * 60_000;
export const INSIGHTS_EVENT_LIMIT = 100_000;
type Page = {
  event: AnalyticsEvent;
  activeMs: number | null;
  depth: number;
  matchedArrival: boolean;
};

/** Shared reporting logic keeps the durable and test stores semantically identical.
 * Only explicit page links become paths. Event order alone cannot prove navigation.
 */
export function buildInsights(
  history: AnalyticsEvent[],
  range: AnalyticsOverview['range'],
  now = new Date(),
  metadata: {
    measurementStartedAt?: string | null;
    legacyPageviews?: number;
    siteLastSeen?: Partial<Record<AnalyticsSite, string | null>>;
    limited?: boolean;
    site?: AnalyticsSite;
  } = {},
): AnalyticsInsights {
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dates = new Map<number, string>();
  const inRange = (event: AnalyticsEvent) => {
    if (metadata.site && (event.site ?? 'portfolio') !== metadata.site) return false;
    const timestamp = event.occurredAt.getTime();
    let date = dates.get(timestamp);
    if (!date) {
      date = dateFormatter.format(event.occurredAt);
      dates.set(timestamp, date);
    }
    return date >= range.start && date <= range.end;
  };
  const events = history.filter((event) => event.schemaVersion === 2);
  const ordered = [...events].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || a.eventId.localeCompare(b.eventId),
  );
  const pageKey = (event: AnalyticsEvent) => `${event.sessionHash}:${event.pageHash}`;
  const pages = new Map<string, Page>();
  const sessions = new Map<
    string,
    { pages: Page[]; lastAt: number; sharedSiteActivity: Map<AnalyticsSite, number> }
  >();
  for (const event of ordered) {
    let session = sessions.get(event.sessionHash);
    if (!session) {
      session = { pages: [], lastAt: event.occurredAt.getTime(), sharedSiteActivity: new Map() };
      sessions.set(event.sessionHash, session);
    }
    session.lastAt = Math.max(session.lastAt, event.occurredAt.getTime());
    const referringSite = siteOfHost(event.referrer);
    const lastSourceActivity = referringSite
      ? session.sharedSiteActivity.get(referringSite)
      : undefined;
    const matchedArrival =
      event.visitScope === 'shared' &&
      !isCareIqSite(event.site ?? null) &&
      lastSourceActivity !== undefined &&
      event.occurredAt.getTime() > lastSourceActivity &&
      event.occurredAt.getTime() - lastSourceActivity <= IDLE_MS;
    if (event.visitScope === 'shared' && event.site)
      session.sharedSiteActivity.set(event.site, event.occurredAt.getTime());
    if (event.event !== 'pageview' || !event.pageHash || pages.has(pageKey(event))) continue;
    const page = { event, activeMs: null, depth: 0, matchedArrival };
    pages.set(pageKey(event), page);
    session.pages.push(page);
  }
  for (const event of ordered) {
    if (!['page_engagement', 'scroll_depth'].includes(event.event)) continue;
    const page = pages.get(pageKey(event));
    if (!page || event.site !== page.event.site || event.path !== page.event.path) continue;
    const elapsed = event.occurredAt.getTime() - page.event.occurredAt.getTime();
    if (elapsed < 0) continue;
    if (event.event === 'page_engagement' && typeof event.activeMs === 'number') {
      // Cumulative snapshots are idempotent and cannot exceed observed wall time.
      page.activeMs = Math.max(page.activeMs ?? 0, Math.min(event.activeMs, elapsed));
    }
    page.depth = Math.max(page.depth, event.scrollDepth ?? 0);
  }
  const report: AnalyticsInsights = {
    measurementStartedAt:
      metadata.measurementStartedAt ??
      ordered
        .find((event) => !metadata.site || event.site === metadata.site)
        ?.occurredAt.toISOString() ??
      null,
    coverage: {
      pageviews: 0,
      legacyPageviews:
        metadata.legacyPageviews ??
        history.filter((e) => e.schemaVersion !== 2 && e.event === 'pageview' && inRange(e)).length,
      timedPageviews: 0,
      sharedVisits: 0,
      localVisits: 0,
      limited: metadata.limited ?? false,
    },
    totals: { visits: 0, completedVisits: 0, activeSeconds: 0, avgActiveSeconds: null },
    sites: (metadata.site ? [metadata.site] : ANALYTICS_SITES).map((site) => ({
      site,
      pageviews: 0,
      visits: 0,
      entries: 0,
      lastEventAt:
        metadata.siteLastSeen?.[site] ??
        history
          .filter((e) => (e.site ?? 'portfolio') === site)
          .reduce<
            string | null
          >((last, e) => (!last || e.occurredAt.toISOString() > last ? e.occurredAt.toISOString() : last), null),
    })),
    pages: [],
    entries: [],
    paths: [],
    movement: [],
    engagement: [],
    outbound: [],
  };
  const pageRows = new Map<
    string,
    AnalyticsInsights['pages'][number] & { totalActiveMs: number }
  >();
  const entries = new Map<string, AnalyticsInsights['entries'][number]>();
  const paths = new Map<string, AnalyticsInsights['paths'][number]>();
  const movement = new Map<string, AnalyticsInsights['movement'][number]>();
  const engagement = new Map<string, AnalyticsInsights['engagement'][number]>();
  const outbound = new Map<string, AnalyticsInsights['outbound'][number]>();
  function movementRow(fromSite: AnalyticsSite, toSite: AnalyticsSite) {
    const key = `${fromSite}:${toSite}`;
    let row = movement.get(key);
    if (!row) {
      row = { fromSite, toSite, arrivals: 0, matchedArrivals: 0, unmatchedArrivals: 0, clicks: 0 };
      movement.set(key, row);
    }
    return row;
  }
  function pageRow(page: Page) {
    const site = page.event.site!;
    const key = `${site}:${page.event.path}`;
    let row = pageRows.get(key);
    if (!row) {
      row = {
        site,
        path: page.event.path,
        views: 0,
        timedViews: 0,
        avgActiveSeconds: null,
        scroll25: 0,
        scroll50: 0,
        scroll75: 0,
        scroll100: 0,
        entries: 0,
        exits: 0,
        completedViews: 0,
        exitRate: null,
        totalActiveMs: 0,
      };
      pageRows.set(key, row);
    }
    return row;
  }
  for (const session of sessions.values()) {
    const selected = session.pages.filter((page) => inRange(page.event));
    if (!selected.length) continue;
    report.totals.visits += 1;
    if (session.pages[0].event.visitScope === 'shared') report.coverage.sharedVisits += 1;
    else report.coverage.localVisits += 1;
    const complete = !metadata.limited && session.lastAt <= now.getTime() - IDLE_MS;
    if (complete) report.totals.completedVisits += 1;
    for (const site of report.sites) {
      if (selected.some((page) => page.event.site === site.site)) site.visits += 1;
    }
    const first = session.pages[0];
    if (inRange(first.event)) {
      const site = first.event.site!;
      pageRow(first).entries += 1;
      report.sites.find((row) => row.site === site)!.entries += 1;
      const source = first.event.source || 'unknown';
      const key = `${site}:${first.event.path}:${source}`;
      const row = entries.get(key) ?? { site, path: first.event.path, source, visits: 0 };
      row.visits += 1;
      entries.set(key, row);
    }
    const last = session.pages.at(-1)!;
    if (complete && inRange(last.event)) pageRow(last).exits += 1;
    for (const page of selected) {
      const event = page.event;
      const row = pageRow(page);
      row.views += 1;
      if (complete) row.completedViews += 1;
      report.coverage.pageviews += 1;
      report.sites.find((site) => site.site === event.site)!.pageviews += 1;
      if (page.activeMs !== null) {
        row.timedViews += 1;
        row.totalActiveMs += page.activeMs;
        report.coverage.timedPageviews += 1;
        report.totals.activeSeconds += page.activeMs / 1000;
      }
      if (page.depth >= 25) row.scroll25 += 1;
      if (page.depth >= 50) row.scroll50 += 1;
      if (page.depth >= 75) row.scroll75 += 1;
      if (page.depth >= 100) row.scroll100 += 1;
      const previous = event.previousPageHash
        ? pages.get(`${event.sessionHash}:${event.previousPageHash}`)
        : undefined;
      if (previous && previous !== page && previous.event.occurredAt <= event.occurredAt) {
        const edge = {
          fromSite: previous.event.site!,
          fromPath: previous.event.path,
          toSite: event.site!,
          toPath: event.path,
          transitions: 0,
        };
        const key = JSON.stringify([edge.fromSite, edge.fromPath, edge.toSite, edge.toPath]);
        const path = paths.get(key) ?? edge;
        path.transitions += 1;
        paths.set(key, path);
      }
      const fromSite = siteOfHost(event.referrer);
      if (
        fromSite &&
        fromSite !== event.site &&
        (!previous || previous.event.site !== event.site)
      ) {
        const movement = movementRow(fromSite, event.site!);
        movement.arrivals += 1;
        if (page.matchedArrival) movement.matchedArrivals += 1;
        else movement.unmatchedArrivals += 1;
      }
    }
  }
  const seenOpens = new Set<string>();
  for (const event of events.filter(inRange)) {
    const site = event.site!;
    if (
      event.content &&
      ['project_open', 'experiment_open', 'tool_open', 'tool_action'].includes(event.event)
    ) {
      const key = `${site}:${event.content}`;
      const row = engagement.get(key) ?? { site, content: event.content, opens: 0, actions: 0 };
      if (event.event === 'tool_action') row.actions += 1;
      else {
        const openKey = `${pageKey(event)}:${event.content}`;
        if (!seenOpens.has(openKey)) row.opens += 1;
        seenOpens.add(openKey);
      }
      engagement.set(key, row);
    }
    if (event.event === 'outbound_click' && event.target) {
      const destinationSite = event.destinationSite ?? '';
      const destinationPath = event.destinationPath ?? '';
      const key = JSON.stringify([site, event.target, destinationSite, destinationPath]);
      const row = outbound.get(key) ?? {
        site,
        target: event.target,
        destinationSite,
        destinationPath,
        clicks: 0,
      };
      row.clicks += 1;
      outbound.set(key, row);
      if (destinationSite && destinationSite !== site)
        movementRow(site, destinationSite).clicks += 1;
    }
  }
  report.totals.avgActiveSeconds = report.coverage.timedPageviews
    ? report.totals.activeSeconds / report.coverage.timedPageviews
    : null;
  report.pages = [...pageRows.values()]
    .map(({ totalActiveMs, ...row }) => ({
      ...row,
      avgActiveSeconds: row.timedViews ? totalActiveMs / row.timedViews / 1000 : null,
      exitRate: row.completedViews ? row.exits / row.completedViews : null,
    }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .slice(0, 50);
  report.entries = [...entries.values()].sort((a, b) => b.visits - a.visits).slice(0, 30);
  report.paths = [...paths.values()].sort((a, b) => b.transitions - a.transitions).slice(0, 30);
  report.movement = [...movement.values()].sort(
    (a, b) => b.arrivals - a.arrivals || b.clicks - a.clicks,
  );
  report.engagement = [...engagement.values()].sort(
    (a, b) => b.opens - a.opens || b.actions - a.actions,
  );
  report.outbound = [...outbound.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 30);
  return report;
}
