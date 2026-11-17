export const EVENTS = [
  'pageview',
  'studio_section_open',
  'project_open',
  'project_preview_open',
  'outbound_click',
  'studio_ready',
  'studio_fallback',
  'page_engagement',
  'scroll_depth',
  'experiment_open',
  'tool_open',
  'tool_action',
] as const;

export type AnalyticsEventName = (typeof EVENTS)[number];
export type AnalyticsSite = 'portfolio' | 'lab' | 'toolbox';

export interface AnalyticsEvent {
  eventId: string;
  event: AnalyticsEventName;
  path: string;
  referrer: string;
  source: string;
  medium: string;
  campaign: string;
  visitorHash: string;
  sessionHash: string;
  project: string;
  section: string;
  mode: string;
  target: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'other';
  occurredAt: Date;
  schemaVersion?: 1 | 2;
  site?: AnalyticsSite;
  pageHash?: string;
  previousPageHash?: string;
  visitScope?: 'shared' | 'local';
  activeMs?: number | null;
  scrollDepth?: 25 | 50 | 75 | 100 | null;
  content?: string;
  action?: string;
  destinationSite?: AnalyticsSite | '';
  destinationPath?: string;
  receivedAt?: Date;
}

export interface AnalyticsInsights {
  measurementStartedAt: string | null;
  coverage: {
    pageviews: number;
    legacyPageviews: number;
    timedPageviews: number;
    sharedVisits: number;
    localVisits: number;
    limited: boolean;
  };
  totals: {
    visits: number;
    completedVisits: number;
    activeSeconds: number;
    avgActiveSeconds: number | null;
  };
  sites: Array<{
    site: AnalyticsSite;
    pageviews: number;
    visits: number;
    entries: number;
    lastEventAt: string | null;
  }>;
  pages: Array<{
    site: AnalyticsSite;
    path: string;
    views: number;
    timedViews: number;
    avgActiveSeconds: number | null;
    scroll25: number;
    scroll50: number;
    scroll75: number;
    scroll100: number;
    entries: number;
    exits: number;
    completedViews: number;
    exitRate: number | null;
  }>;
  entries: Array<{ site: AnalyticsSite; path: string; source: string; visits: number }>;
  paths: Array<{
    fromSite: AnalyticsSite;
    fromPath: string;
    toSite: AnalyticsSite;
    toPath: string;
    transitions: number;
  }>;
  movement: Array<{
    fromSite: AnalyticsSite;
    toSite: AnalyticsSite;
    arrivals: number;
    matchedArrivals: number;
    unmatchedArrivals: number;
    clicks: number;
  }>;
  engagement: Array<{ site: AnalyticsSite; content: string; opens: number; actions: number }>;
  outbound: Array<{
    site: AnalyticsSite;
    target: string;
    destinationSite: AnalyticsSite | '';
    destinationPath: string;
    clicks: number;
  }>;
}

export interface Owner {
  email: string;
  passwordHash: string;
}

export interface AnalyticsOverview {
  range: { days: number; start: string; end: string; timezone: 'America/Los_Angeles' };
  totals: {
    visitors: number;
    pageviews: number;
    projectOpens: number;
    linkedinClicks: number;
    recentVisitors: number;
  };
  daily: Array<{ date: string; visitors: number }>;
  sources: Array<{ source: string; visitors: number }>;
  projects: Array<{ project: string; opens: number; previews: number }>;
  sections: Array<{ section: string; opens: number }>;
  pages: Array<{ site?: AnalyticsSite; path: string; views: number }>;
  devices: Array<{ device: string; visitors: number }>;
  campaigns: Array<{ source: string; campaign: string; visitors: number }>;
  lastEventAt: string | null;
  insights: AnalyticsInsights;
}

export interface AnalyticsStore {
  ready(): Promise<void>;
  getOwner(): Promise<Owner | null>;
  createOwner(owner: Owner): Promise<boolean>;
  createSession(tokenHash: string, expiresAt: Date, expectedPasswordHash: string): Promise<boolean>;
  getSession(tokenHash: string): Promise<Owner | null>;
  deleteSession(tokenHash: string): Promise<void>;
  consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean>;
  insertEvent(event: AnalyticsEvent): Promise<void>;
  overview(days: number): Promise<AnalyticsOverview>;
  cleanup(): Promise<void>;
  close(): Promise<void>;
}

export function reportRange(days: number, now = new Date()): AnalyticsOverview['range'] {
  const end = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const first = new Date(`${end}T12:00:00Z`);
  first.setUTCDate(first.getUTCDate() - days + 1);
  return { days, start: first.toISOString().slice(0, 10), end, timezone: 'America/Los_Angeles' };
}

export function emptyDaily(range: AnalyticsOverview['range']) {
  return Array.from({ length: range.days }, (_, index) => {
    const date = new Date(`${range.start}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), visitors: 0 };
  });
}
