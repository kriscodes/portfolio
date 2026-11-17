import type { AnalyticsSite } from './types.js';

export const SITE_HOSTS: Record<string, AnalyticsSite> = {
  'kristiansalmeron.com': 'portfolio',
  'www.kristiansalmeron.com': 'portfolio',
  'lab.kristiansalmeron.com': 'lab',
  'toolbox.kristiansalmeron.com': 'toolbox',
};

export const SITE_PATHS: Record<AnalyticsSite, ReadonlySet<string>> = {
  portfolio: new Set([
    '/',
    '/work/',
    '/work/care-iq/',
    '/work/gen-ui/',
    '/about/',
    '/contact/',
    '/privacy/',
    '/field-notes/',
    '/field-notes/the-boundary-is-the-feature/',
    '/field-notes/leave-room-for-the-unknown/',
  ]),
  lab: new Set(['/', '/experiments/', '/experiments/pdf-rendering/', '/methodology/', '/privacy/']),
  toolbox: new Set(['/', '/tools/prompt-builder/', '/privacy/']),
};
export const CAMPAIGNS = new Set(['portfolio', 'bio', 'launch', 'winter-update']);
const REFERRERS = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  'linkedin.com',
  'tiktok.com',
  'whatsapp.com',
  'wa.me',
  'github.com',
  'google.com',
  'bing.com',
  'duckduckgo.com',
];

export function siteOfHost(host: string): AnalyticsSite | null {
  return SITE_HOSTS[host.toLowerCase()] ?? null;
}

export function safePath(site: AnalyticsSite, value: unknown): string {
  let path = typeof value === 'string' ? value.split(/[?#]/, 1)[0].toLowerCase() : '/';
  if (!path.endsWith('/')) path += '/';
  return SITE_PATHS[site].has(path) ? path : '/unknown/';
}

export function safeReferrer(value: unknown): string {
  if (typeof value !== 'string' || value.length > 253) return '';
  const host = value.toLowerCase();
  if (siteOfHost(host)) return host;
  // Store only the known domain, never an arbitrary host or a potentially identifying subdomain.
  return REFERRERS.find((domain) => host === domain || host.endsWith('.' + domain)) ?? '';
}

export function contentFor(site: AnalyticsSite, path: string): string {
  if (site === 'portfolio' && path === '/work/care-iq/') return 'careiq';
  if (site === 'portfolio' && path === '/work/gen-ui/') return 'gen-ui';
  if (site === 'lab' && path === '/experiments/pdf-rendering/') return 'pdf-rendering';
  if (site === 'toolbox' && path === '/tools/prompt-builder/') return 'prompt-builder';
  return '';
}
