#!/usr/bin/env node
import { CONTENT_ROUTES } from './validate-web.mjs';

// Exercise the delivered release over HTTP, including direct deep links and static assets.
// Usage: node scripts/test-live-web.mjs https://kristiansalmeron.com
// A local or staging origin can be supplied to test the same exported release before publish.
const base = new URL(process.argv[2] ?? 'https://kristiansalmeron.com');
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Use an HTTP(S) deployment URL.');
const errors = [];
const assets = new Map();
const pages = new Map();
const record = (path, message) => errors.push(`${path}: ${message}`);
const get = async (path) => {
  const url = new URL(path, base);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
      headers: { 'User-Agent': 'KristianPortfolioReleaseCheck/1.0', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    record(path, `request failed (${error.message})`);
    return null;
  }
};

for (const route of CONTENT_ROUTES) {
  const response = await get(route);
  if (!response) continue;
  if (response.status !== 200) {
    record(route, `expected HTTP 200, received ${response.status}`);
    continue;
  }
  if (!response.headers.get('content-type')?.includes('text/html'))
    record(route, 'response is not HTML');
  const html = await response.text();
  pages.set(route, html);
  if (!/<title>[^<]*Kristian Salmeron[^<]*<\/title>/i.test(html))
    record(route, 'expected portfolio document title');
  if ((html.match(/<main(?:\s|>)/gi) ?? []).length !== 1)
    record(route, 'one server-rendered main landmark is required');
  if ((html.match(/<h1(?:\s|>)/gi) ?? []).length !== 1)
    record(route, 'one server-rendered H1 is required');
  const canonical = html.match(
    /<link\b(?=[^>]*\brel="canonical")(?=[^>]*\bhref="([^"]+)")[^>]*>/i,
  )?.[1];
  if (canonical !== `https://kristiansalmeron.com${route}`)
    record(route, 'canonical URL does not match production route');
  for (const match of html.matchAll(/<(?:script|img|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/gi)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), new URL(route, base));
    if (
      url.origin !== base.origin ||
      !/\.(?:js|css|svg|png|jpe?g|webp|woff2?)(?:\?|$)/i.test(url.pathname + url.search)
    )
      continue;
    assets.set(url.pathname + url.search, url);
  }
}

const home =
  pages
    .get('/')
    ?.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ') ?? '';
if (!/I build systems, explore ideas, and follow (?:the )?interesting questions\./i.test(home))
  record('/', 'approved redesign supporting line was not delivered');

// A missing asset returning the SPA HTML shell is a failure even when its status is 200.
for (const [path, url] of assets) {
  const response = await get(url);
  if (!response) continue;
  if (response.status !== 200) {
    record(path, `asset returned HTTP ${response.status}`);
    continue;
  }
  const type = response.headers.get('content-type') ?? '';
  const extension = url.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const expected =
    extension === 'js'
      ? /(?:javascript|ecmascript)/i
      : extension === 'css'
        ? /text\/css/i
        : extension === 'svg'
          ? /image\/svg\+xml/i
          : extension?.startsWith('woff')
            ? /(?:font\/|application\/(?:font|octet-stream))/i
            : /image\//i;
  if (!expected.test(type)) record(path, `unexpected asset content type ${JSON.stringify(type)}`);
  const body = await response.arrayBuffer();
  if (!body.byteLength) record(path, 'empty static asset');
}

for (const [path, marker] of [
  ['/sitemap.xml', '<urlset'],
  ['/robots.txt', 'Sitemap: https://kristiansalmeron.com/sitemap.xml'],
]) {
  const response = await get(path);
  if (!response) continue;
  if (response.status !== 200) record(path, `expected HTTP 200, received ${response.status}`);
  const text = await response.text();
  if (!text.includes(marker)) record(path, 'expected crawler discovery content was not delivered');
}

const missingPath = '/__portfolio_release_check_missing__/';
const missing = await get(missingPath);
if (missing) {
  if (missing.status !== 404) record(missingPath, `expected HTTP 404, received ${missing.status}`);
  const body = await missing.text();
  if (!/Kristian Salmeron/i.test(body))
    record(missingPath, 'custom not-found page was not delivered');
}

if (errors.length) {
  console.error(
    `HTTP release checks failed with ${errors.length} issue(s):\n${errors.map((error) => `  - ${error}`).join('\n')}`,
  );
  process.exitCode = 1;
} else
  console.log(
    `HTTP release checks passed at ${base.origin}: ${CONTENT_ROUTES.length} direct page requests, ${assets.size} delivered assets, sitemap, robots, and custom HTTP 404.`,
  );
