import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInsights } from './insights.js';
import { reportRange, type AnalyticsEvent } from './types.js';

const now = new Date('2026-11-17T20:00:00.000Z');
function event(
  id: string,
  minutes: number,
  overrides: Partial<AnalyticsEvent> = {},
): AnalyticsEvent {
  return {
    eventId: id,
    event: 'pageview',
    path: '/',
    referrer: '',
    source: 'unknown',
    medium: 'unknown',
    campaign: '',
    visitorHash: 'visitor',
    sessionHash: 'visit',
    project: '',
    section: '',
    mode: '',
    target: '',
    device: 'desktop',
    occurredAt: new Date(now.getTime() - minutes * 60_000),
    schemaVersion: 2,
    site: 'portfolio',
    pageHash: id,
    previousPageHash: '',
    visitScope: 'shared',
    ...overrides,
  };
}
const report = (events: AnalyticsEvent[]) => buildInsights(events, reportRange(7, now), now);

test('duration takes cumulative maxima, tolerates delayed snapshots and excludes unmeasured pages', () => {
  const events = [
    event('start', 100),
    event('later-snapshot', 95, { event: 'page_engagement', pageHash: 'start', activeMs: 80_000 }),
    event('earlier-snapshot', 98, {
      event: 'page_engagement',
      pageHash: 'start',
      activeMs: 40_000,
    }),
    event('duplicate-snapshot', 95, {
      event: 'page_engagement',
      pageHash: 'start',
      activeMs: 80_000,
    }),
    event('second', 90, { path: '/about/' }),
    event('legacy', 80, { schemaVersion: 1, pageHash: '' }),
    event('unmatched', 85, { event: 'page_engagement', pageHash: 'missing', activeMs: 50_000 }),
    event('wrong-route', 85, {
      event: 'page_engagement',
      pageHash: 'start',
      path: '/private/',
      activeMs: 90_000,
    }),
  ];
  const result = report(events);
  assert.equal(result.totals.activeSeconds, 80);
  assert.equal(result.totals.avgActiveSeconds, 80);
  assert.equal(result.coverage.pageviews, 2);
  assert.equal(result.coverage.timedPageviews, 1);
  assert.equal(result.coverage.legacyPageviews, 1);
  assert.equal(result.pages.find((page) => page.path === '/about/')?.avgActiveSeconds, null);
  const clamp = report([
    event('start', 100),
    event('snapshot', 99, { event: 'page_engagement', pageHash: 'start', activeMs: 86_400_000 }),
  ]);
  assert.equal(clamp.totals.activeSeconds, 60);
});

test('scroll coverage counts each measured page once per reached milestone', () => {
  const result = report([
    event('start', 100),
    event('quarter', 99, { event: 'scroll_depth', pageHash: 'start', scrollDepth: 25 }),
    event('half', 98, { event: 'scroll_depth', pageHash: 'start', scrollDepth: 50 }),
    event('three-quarters', 97, { event: 'scroll_depth', pageHash: 'start', scrollDepth: 75 }),
    event('duplicate-half', 96, { event: 'scroll_depth', pageHash: 'start', scrollDepth: 50 }),
  ]);
  assert.deepEqual(
    [
      result.pages[0].scroll25,
      result.pages[0].scroll50,
      result.pages[0].scroll75,
      result.pages[0].scroll100,
    ],
    [1, 1, 1, 0],
  );
  assert.equal(result.coverage.timedPageviews, 0);
});

test('paths require explicit same-visit page links and support long active reading', () => {
  const result = report([
    event('entry', 120),
    event('unrelated-tab', 110, { path: '/work/' }),
    event('reading', 80, { event: 'page_engagement', pageHash: 'entry', activeMs: 600_000 }),
    event('next', 79, { path: '/about/', previousPageHash: 'entry' }),
    event('other-visit', 78, {
      sessionHash: 'another',
      path: '/contact/',
      previousPageHash: 'next',
    }),
    event('self', 77, { sessionHash: 'self-visit', previousPageHash: 'self' }),
  ]);
  assert.deepEqual(result.paths, [
    {
      fromSite: 'portfolio',
      fromPath: '/',
      toSite: 'portfolio',
      toPath: '/about/',
      transitions: 1,
    },
  ]);
});

test('entries are visit acquisition; exits wait for inactivity and change when late pages arrive', () => {
  const events = [
    event('entry', 120, { source: 'github' }),
    event('last', 90, { path: '/about/', previousPageHash: 'entry' }),
    event('active-entry', 60, { sessionHash: 'active', source: 'linkedin' }),
    event('active-snapshot', 5, {
      event: 'page_engagement',
      sessionHash: 'active',
      pageHash: 'active-entry',
      activeMs: 1000,
    }),
  ];
  const result = report(events);
  assert.equal(result.totals.visits, 2);
  assert.equal(result.totals.completedVisits, 1);
  assert.equal(result.pages.find((page) => page.path === '/')?.exitRate, 0);
  assert.equal(result.pages.find((page) => page.path === '/about/')?.exitRate, 1);
  assert.deepEqual(
    result.entries.map(({ source, visits }) => ({ source, visits })),
    [
      { source: 'github', visits: 1 },
      { source: 'linkedin', visits: 1 },
    ],
  );
  const delayed = report([
    ...events,
    event('delayed-last', 40, { path: '/contact/', previousPageHash: 'last' }),
  ]);
  assert.equal(delayed.pages.find((page) => page.path === '/about/')?.exits, 0);
  assert.equal(delayed.pages.find((page) => page.path === '/contact/')?.exits, 1);
  const limited = buildInsights(events, reportRange(7, now), now, { limited: true });
  assert.equal(limited.totals.completedVisits, 0);
  assert.equal(limited.pages[0].exitRate, null);
});

test('range boundaries do not invent entries or exits when session context exists outside selection', () => {
  const range = {
    days: 1,
    start: '2026-11-17',
    end: '2026-11-17',
    timezone: 'America/Los_Angeles' as const,
  };
  const result = buildInsights(
    [
      event('previous-day', 800),
      event('inside', 700, { path: '/about/' }),
      event('after-range', -1000, { path: '/contact/' }),
    ],
    range,
    new Date('2026-11-19T00:00:00Z'),
  );
  assert.equal(result.coverage.pageviews, 1);
  assert.deepEqual(result.entries, []);
  assert.equal(result.pages[0].exits, 0);
});

test('cross-site arrivals, unmatched referrals, explicit outbound clicks and actions stay distinct', () => {
  const result = report([
    event('portfolio', 120),
    event('lab', 119, {
      site: 'lab',
      referrer: 'kristiansalmeron.com',
      path: '/experiments/pdf-rendering/',
    }),
    event('lab-open', 119, {
      site: 'lab',
      event: 'experiment_open',
      pageHash: 'lab',
      path: '/experiments/pdf-rendering/',
      content: 'pdf-rendering',
    }),
    event('lab-spa', 118, {
      site: 'lab',
      previousPageHash: 'lab',
      referrer: 'kristiansalmeron.com',
      path: '/methodology/',
    }),
    event('toolbox-local', 110, {
      sessionHash: 'local-toolbox',
      site: 'toolbox',
      visitScope: 'local',
      referrer: 'lab.kristiansalmeron.com',
      path: '/tools/prompt-builder/',
    }),
    event('tool-open', 110, {
      sessionHash: 'local-toolbox',
      site: 'toolbox',
      visitScope: 'local',
      event: 'tool_open',
      pageHash: 'toolbox-local',
      path: '/tools/prompt-builder/',
      content: 'prompt-builder',
    }),
    event('tool-action', 109, {
      sessionHash: 'local-toolbox',
      site: 'toolbox',
      visitScope: 'local',
      event: 'tool_action',
      pageHash: 'toolbox-local',
      path: '/tools/prompt-builder/',
      content: 'prompt-builder',
      action: 'generate',
    }),
    event('click', 109, {
      site: 'lab',
      event: 'outbound_click',
      target: 'toolbox',
      destinationSite: 'toolbox',
      destinationPath: '/tools/prompt-builder/',
    }),
  ]);
  assert.deepEqual(result.movement, [
    {
      fromSite: 'lab',
      toSite: 'toolbox',
      arrivals: 1,
      matchedArrivals: 0,
      unmatchedArrivals: 1,
      clicks: 1,
    },
    {
      fromSite: 'portfolio',
      toSite: 'lab',
      arrivals: 1,
      matchedArrivals: 1,
      unmatchedArrivals: 0,
      clicks: 0,
    },
  ]);
  assert.equal(result.coverage.sharedVisits, 1);
  assert.equal(result.coverage.localVisits, 1);
  assert.equal(result.engagement.find((row) => row.content === 'prompt-builder')?.actions, 1);
  assert.equal(result.outbound[0].clicks, 1);
});

test('empty and historical reports distinguish missing measurement from zero duration', () => {
  const empty = report([]);
  assert.equal(empty.measurementStartedAt, null);
  assert.equal(empty.totals.avgActiveSeconds, null);
  assert.equal(empty.sites.length, 5);
  assert.deepEqual(empty.pages, []);
  const legacy = report([event('old', 60, { schemaVersion: 1 })]);
  assert.equal(legacy.coverage.legacyPageviews, 1);
  assert.equal(legacy.coverage.pageviews, 0);
  assert.equal(legacy.measurementStartedAt, null);
  const zero = report([
    event('start', 60),
    event('zero', 59, { event: 'page_engagement', pageHash: 'start', activeMs: 0 }),
  ]);
  assert.equal(zero.totals.avgActiveSeconds, 0);
});
