export const EVENTS = [
  'pageview',
  'studio_section_open',
  'project_open',
  'project_preview_open',
  'outbound_click',
  'studio_ready',
  'studio_fallback',
] as const;

export type AnalyticsEventName = (typeof EVENTS)[number];

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
  pages: Array<{ path: string; views: number }>;
  devices: Array<{ device: string; visitors: number }>;
  campaigns: Array<{ source: string; campaign: string; visitors: number }>;
  lastEventAt: string | null;
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
