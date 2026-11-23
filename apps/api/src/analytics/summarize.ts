import { buildInsights } from './insights.js';
import {
  emptyDaily,
  emptyHourly,
  eventHour,
  overviewRange,
  reportRange,
  type AnalyticsEvent,
  type AnalyticsOverview,
  type AnalyticsSite,
} from './types.js';

export function summarizeEvents(
  history: AnalyticsEvent[],
  days: number,
  now = new Date(),
  site?: AnalyticsSite,
  day?: string,
): AnalyticsOverview {
  const range = overviewRange(days, day, now);
  const siteEvents = site
    ? history.filter((event) => (event.site ?? 'portfolio') === site)
    : history;
  const dates = new Map(siteEvents.map((event) => [event, reportRange(1, event.occurredAt).end]));
  const dateOf = (event: AnalyticsEvent) => dates.get(event)!;
  const events = siteEvents.filter(
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
    insights: buildInsights(history, range, now, { site }),
    range,
    totals: {
      visitors: unique(events),
      pageviews: events.filter((event) => event.event === 'pageview').length,
      projectOpens: events.filter((event) => event.event === 'project_open').length,
      linkedinClicks: events.filter(
        (event) => event.event === 'outbound_click' && event.target === 'linkedin',
      ).length,
      recentVisitors: unique(
        events.filter((event) => event.occurredAt.getTime() >= now.getTime() - 300_000),
      ),
    },
    daily: emptyDaily(range).map((row) => ({
      ...row,
      visitors: unique(events.filter((event) => dateOf(event) === row.date)),
    })),
    ...(day
      ? {
          hourly: emptyHourly(day).map((row) => ({
            ...row,
            visitors: unique(events.filter((event) => eventHour(event.occurredAt) === row.hour)),
          })),
        }
      : {}),
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
    pages: [
      ...new Set(
        events
          .filter((event) => event.event === 'pageview')
          .map((event) => JSON.stringify([event.site ?? 'portfolio', event.path])),
      ),
    ]
      .map((key) => {
        const [site, path] = JSON.parse(key) as [AnalyticsEvent['site'], string];
        return {
          site,
          path,
          views: events.filter(
            (event) =>
              (event.site ?? 'portfolio') === site &&
              event.path === path &&
              event.event === 'pageview',
          ).length,
        };
      })
      .sort(
        (a, b) =>
          b.views - a.views || a.site!.localeCompare(b.site!) || a.path.localeCompare(b.path),
      )
      .slice(0, 30),
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
    lastEventAt: siteEvents.length
      ? new Date(Math.max(...siteEvents.map((event) => event.occurredAt.getTime()))).toISOString()
      : null,
  };
}
