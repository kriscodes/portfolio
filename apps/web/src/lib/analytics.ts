/** Adapter for the shared first-party collector served by the API. */
export type AnalyticsEventName =
  | 'pageview'
  | 'project_open'
  | 'project_preview_open'
  | 'studio_section_open'
  | 'outbound_click'
  | 'studio_ready'
  | 'studio_fallback';
export type AnalyticsProperties = {
  project?: 'careiq' | 'gen-ui' | 'neon-drift';
  section?: 'work' | 'about' | 'life';
  target?: 'linkedin' | 'instagram' | 'github' | 'website';
  mode?: 'day' | 'night' | '2d' | '3d';
};
type BrowserTracker = {
  notice: string | null;
  isEnabled: () => boolean;
  track: (event: AnalyticsEventName, properties?: AnalyticsProperties) => void;
  pageview: (pathname?: string) => void;
};
declare global {
  interface Window {
    StudioInsights?: BrowserTracker;
  }
}

let loaderStarted = false;
const pending: Array<{ event: AnalyticsEventName; properties: AnalyticsProperties }> = [];
/** The shared runtime owns pageviews and delivery on all three sites. */
export function getAnalyticsTracker(): BrowserTracker | null {
  if (typeof window === 'undefined') return null;
  if (window.StudioInsights) return window.StudioInsights;
  if (loaderStarted) return null;
  const hostname = window.location.hostname;
  const configuredOrigin = process.env.NEXT_PUBLIC_ANALYTICS_ORIGIN;
  if (!['kristiansalmeron.com', 'www.kristiansalmeron.com'].includes(hostname) && !configuredOrigin)
    return null;
  const origin = configuredOrigin || 'https://analytics.kristiansalmeron.com';
  try {
    const base = new URL(origin);
    if (
      base.protocol !== 'https:' &&
      !(process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(base.hostname))
    )
      return null;
    loaderStarted = true;
    window.addEventListener(
      'studio-insights-ready',
      () => {
        for (const entry of pending.splice(0))
          window.StudioInsights?.track(entry.event, entry.properties);
      },
      { once: true },
    );
    const script = document.createElement('script');
    script.src = new URL('/analytics-assets/tracker.js', base).href;
    script.async = true;
    script.dataset.site = 'portfolio';
    script.referrerPolicy = 'no-referrer';
    script.addEventListener(
      'error',
      () => {
        pending.length = 0;
      },
      { once: true },
    );
    document.head.appendChild(script);
  } catch {
    // A blocked collector must never delay navigation or project interactions.
  }
  return null;
}
export function trackPortfolioEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {},
) {
  try {
    const tracker = getAnalyticsTracker();
    if (tracker) tracker.track(event, properties);
    else if (loaderStarted && pending.length < 20) pending.push({ event, properties });
  } catch {
    /* The portfolio works without measurement. */
  }
}
