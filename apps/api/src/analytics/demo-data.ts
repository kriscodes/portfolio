import { contentFor } from './catalog.js';
import { summarizeEvents } from './summarize.js';
import type { AnalyticsEvent } from './types.js';

const sampleEnd = new Date('2026-11-14T23:00:00Z');
const dayMs = 86_400_000;
type DemoSite = 'portfolio' | 'lab' | 'toolbox';
type Step = [site: DemoSite, path: string];
const home: Step = ['portfolio', '/'];
const work: Step = ['portfolio', '/work/'];
const viewer: Step = ['portfolio', '/work/gen-ui/'];
const rules: Step = ['portfolio', '/work/rule-builder/'];
const lab: Step = ['lab', '/'];
const experiment: Step = ['lab', '/experiments/pdf-rendering/'];
const toolbox: Step = ['toolbox', '/'];
const promptBuilder: Step = ['toolbox', '/tools/prompt-builder/'];
const journeys: Step[][] = [
  [home, work, viewer],
  [home],
  [viewer, work, rules],
  [work, ['portfolio', '/work/care-iq/'], ['portfolio', '/contact/']],
  [home, lab, experiment],
  [home, toolbox, promptBuilder],
  [lab, experiment],
  [experiment, home, work],
  [promptBuilder, toolbox],
];
const hosts: Record<DemoSite, string> = {
  portfolio: 'kristiansalmeron.com',
  lab: 'lab.kristiansalmeron.com',
  toolbox: 'toolbox.kristiansalmeron.com',
};
const sources = ['direct', 'linkedin', 'linkedin', 'google', 'github'] as const;
const devices = ['desktop', 'desktop', 'mobile', 'mobile', 'tablet'] as const;
const depths = [25, 50, 75, 100] as const;

/** Generate fictional visits from scratch so every date range describes the same sample. */
export function createDemoReports() {
  const events: AnalyticsEvent[] = [];
  let seed = 43;
  function pick(limit: number) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 2 ** 32) * limit);
  }

  for (let day = 89; day >= 0; day--) {
    const visits = 7 + pick(10) + (day % 7 < 5 ? 5 : 0) + (day >= 3 && day <= 5 ? 16 : 0);
    for (let visit = 0; visit < visits; visit++) {
      const id = `sample-${day}-${visit}`;
      const journey = journeys[pick(journeys.length)];
      const source =
        day >= 3 && day <= 5 && pick(3) > 0 ? 'linkedin' : sources[pick(sources.length)];
      const device = devices[pick(devices.length)];
      const visitScope =
        new Set(journey.map(([site]) => site)).size > 1 || pick(4) > 0 ? 'shared' : 'local';
      const start = sampleEnd.getTime() - day * dayMs - (90 + pick(400)) * 60_000;
      const campaign = source === 'linkedin' ? (day <= 5 ? 'launch' : 'portfolio') : '';

      journey.forEach(([site, path], index) => {
        const previous = journey[index - 1];
        const next = journey[index + 1];
        const content = contentFor(site, path);
        const event: AnalyticsEvent = {
          eventId: `${id}-${index}-view`,
          event: 'pageview',
          path,
          referrer: previous ? hosts[previous[0]] : source === 'direct' ? '' : `${source}.com`,
          source,
          medium: source === 'direct' ? 'direct' : source === 'google' ? 'organic' : 'social',
          campaign,
          visitorHash: id,
          sessionHash: id,
          project: '',
          section: '',
          mode: '',
          target: '',
          device,
          occurredAt: new Date(start + index * 120_000),
          schemaVersion: 2,
          site,
          pageHash: `${id}-${index}`,
          previousPageHash: previous?.[0] === site ? `${id}-${index - 1}` : '',
          visitScope,
        };

        function add(
          kind: AnalyticsEvent['event'],
          seconds: number,
          fields: Partial<AnalyticsEvent>,
        ) {
          events.push({
            ...event,
            event: kind,
            eventId: `${id}-${index}-${kind}`,
            occurredAt: new Date(event.occurredAt.getTime() + seconds * 1000),
            ...fields,
          });
        }

        events.push(event);
        if (pick(9) > 0)
          add('page_engagement', 75, {
            activeMs: (10 + pick(65)) * 1000,
            scrollDepth: depths[pick(depths.length)],
          });
        if (content) {
          const kind =
            site === 'portfolio'
              ? 'project_open'
              : site === 'lab'
                ? 'experiment_open'
                : 'tool_open';
          add(kind, 1, { content, project: site === 'portfolio' ? content : '' });
          if (site === 'toolbox' && pick(3) > 0) add('tool_action', 25, { content });
        }
        if (next && next[0] !== site)
          add('outbound_click', 95, {
            target: next[0],
            destinationSite: next[0],
            destinationPath: next[1],
          });
        else if (!next && site === 'portfolio' && pick(8) === 0)
          add('outbound_click', 95, { target: 'linkedin' });
      });
    }
  }
  function report(days: number) {
    const summary = summarizeEvents(events, days, sampleEnd);
    summary.insights.sites = summary.insights.sites.filter(({ site }) =>
      Object.hasOwn(hosts, site),
    );
    return summary;
  }
  return { 7: report(7), 30: report(30), 90: report(90) };
}
