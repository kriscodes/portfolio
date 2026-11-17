import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Local-only UI fixtures. This server never connects to the production collector.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
);
const root = fileURLToPath(new URL('../apps/api/src/analytics/web/', import.meta.url));
const output = resolve(process.env.INSIGHTS_QA_OUTPUT || '/tmp/studio-insights-qa');
await mkdir(output, { recursive: true });
const sites = ['portfolio', 'lab', 'toolbox'];
const now = new Date().toISOString();
const page = (site, path, views) => ({
  site,
  path,
  views,
  timedViews: views - 1,
  avgActiveSeconds: 48,
  scroll25: views - 1,
  scroll50: 4,
  scroll75: 3,
  scroll100: 2,
  entries: 2,
  exits: 1,
  completedViews: 4,
  exitRate: 0.25,
});
const report = {
  range: { start: '2026-11-11', end: '2026-11-17', days: 7 },
  totals: { visitors: 148, pageviews: 263, projectOpens: 32, linkedinClicks: 9, recentVisitors: 2 },
  daily: [11, 12, 13, 14, 15, 16, 17].map((d, i) => ({
    date: `2026-11-${d}`,
    visitors: [14, 25, 12, 30, 28, 17, 22][i],
  })),
  sources: [
    { source: 'direct', visitors: 74 },
    { source: 'github', visitors: 44 },
    { source: 'linkedin', visitors: 30 },
  ],
  projects: [{ project: 'care-iq', opens: 22, previews: 3 }],
  sections: [{ section: 'work', opens: 18 }],
  pages: [
    { path: '/', views: 130 },
    { path: '/work/care-iq/', views: 42 },
  ],
  devices: [
    { device: 'desktop', visitors: 100 },
    { device: 'mobile', visitors: 48 },
  ],
  campaigns: [{ source: 'github', campaign: 'portfolio', visitors: 32 }],
  lastEventAt: now,
  insights: {
    measurementStartedAt: now,
    coverage: {
      pageviews: 60,
      legacyPageviews: 203,
      timedPageviews: 53,
      sharedVisits: 24,
      localVisits: 3,
      limited: false,
    },
    totals: { visits: 27, completedVisits: 21, activeSeconds: 2544, avgActiveSeconds: 48 },
    sites: sites.map((site, i) => ({
      site,
      pageviews: [155, 35, 73][i],
      visits: 9,
      entries: 9,
      lastEventAt: now,
    })),
    pages: [
      page('portfolio', '/', 24),
      page('portfolio', '/work/care-iq/', 16),
      page('lab', '/experiments/pdf-rendering/', 8),
      page('toolbox', '/tools/prompt-builder/', 12),
    ],
    entries: [
      { site: 'portfolio', path: '/', source: 'github', visits: 13 },
      { site: 'toolbox', path: '/tools/prompt-builder/', source: 'direct', visits: 8 },
    ],
    paths: [
      {
        fromSite: 'portfolio',
        fromPath: '/',
        toSite: 'portfolio',
        toPath: '/work/care-iq/',
        transitions: 12,
      },
    ],
    movement: [
      {
        fromSite: 'portfolio',
        toSite: 'lab',
        arrivals: 8,
        matchedArrivals: 6,
        unmatchedArrivals: 2,
        clicks: 10,
      },
    ],
    engagement: [
      { site: 'portfolio', content: 'care-iq', opens: 16, actions: 0 },
      { site: 'toolbox', content: 'prompt-builder', opens: 12, actions: 5 },
    ],
    outbound: [
      { site: 'portfolio', target: 'github', destinationSite: '', destinationPath: '', clicks: 8 },
      {
        site: 'portfolio',
        target: 'lab',
        destinationSite: 'lab',
        destinationPath: '/experiments/',
        clicks: 10,
      },
    ],
  },
};
let mode = 'data';
let authenticated = true;
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.url.startsWith('/api/analytics/')) {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/analytics/auth')
      return res.end(
        JSON.stringify({
          authenticated,
          setupRequired: false,
          email: authenticated ? 'preview@example.test' : undefined,
        }),
      );
    if (req.url === '/api/analytics/logout') {
      authenticated = false;
      return res.end('{}');
    }
    if (req.url.startsWith('/api/analytics/overview')) {
      if (!authenticated) {
        res.statusCode = 401;
        return res.end('{}');
      }
      if (mode === 'error') {
        res.statusCode = 503;
        return res.end('{}');
      }
      if (mode === 'empty')
        return res.end(
          JSON.stringify({
            range: report.range,
            totals: {},
            daily: report.daily.map((i) => ({ ...i, visitors: 0 })),
            insights: { coverage: {}, totals: { avgActiveSeconds: null }, sites: [], pages: [] },
          }),
        );
      return res.end(JSON.stringify(report));
    }
    return res.end('{}');
  }
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const filename = pathname === '/' ? 'index.html' : pathname.replace('/analytics-assets/', '');
  if (!['index.html', 'app.js', 'styles.css'].includes(filename)) {
    res.statusCode = 404;
    return res.end();
  }
  let source = await readFile(resolve(root, filename), 'utf8');
  if (filename === 'index.html')
    source = source.replace(
      '<div class="workspace">',
      '<div class="workspace"><p class="notice" role="status">LOCAL PREVIEW · SAMPLE DATA · No production connection</p>',
    );
  res.setHeader(
    'Content-Type',
    filename.endsWith('.js')
      ? 'text/javascript'
      : filename.endsWith('.css')
        ? 'text/css'
        : 'text/html',
  );
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:",
  );
  res.end(source);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const tab = await context.newPage();
const errors = [];
tab.on('pageerror', (e) => errors.push(e.message));
const url = `http://127.0.0.1:${server.address().port}`;
try {
  await tab.goto(url);
  await tab.locator('#total-visitors').filter({ hasText: '148' }).waitFor();
  assert.equal(await tab.locator('#total-active').innerText(), '48s');
  assert.equal(await tab.locator('#site-cards .site-card').count(), 3);
  assert.equal(await tab.locator('#engagement-pages tbody tr').count(), 4);
  assert.match(await tab.locator('#movement-list').innerText(), /6 matched · 2 unmatched/);
  for (const [name, width] of [
    ['desktop', 1440],
    ['tablet', 768],
    ['mobile', 390],
    ['narrow', 320],
  ]) {
    await tab.setViewportSize({ width, height: 1000 });
    await tab.screenshot({ path: resolve(output, `dashboard-${name}.png`), fullPage: true });
    assert.ok(
      await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${name} has page overflow`,
    );
  }
  await tab.setViewportSize({ width: 1440, height: 1000 });
  await tab.locator('.chart-bar').first().focus();
  await tab.keyboard.press('Enter');
  assert.match(await tab.locator('#chart-selection').innerText(), /estimated visitors/);
  await tab.getByRole('button', { name: '30 days', exact: true }).click();
  assert.equal(
    await tab.getByRole('button', { name: '30 days', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  await tab.locator('[data-view="links"]').click();
  await tab.locator('#campaign-name').selectOption('launch');
  assert.match(await tab.locator('#share-github').inputValue(), /utm_campaign=launch/);
  await tab.locator('[data-view="privacy"]').click();
  assert.match(await tab.locator('#privacy-view').innerText(), /180 days/);
  await tab.setViewportSize({ width: 390, height: 844 });
  await tab.screenshot({ path: resolve(output, 'privacy-mobile.png'), fullPage: true });
  await tab.locator('[data-view="overview"]').click();
  await tab.locator('#theme-toggle').click();
  assert.equal(await tab.locator('html').getAttribute('data-theme'), 'dark');
  await tab.screenshot({ path: resolve(output, 'dashboard-dark-mobile.png'), fullPage: true });
  await tab.locator('#theme-toggle').click();
  mode = 'empty';
  await tab.locator('#refresh-data').click();
  await tab.locator('#no-data-notice').waitFor({ state: 'visible' });
  assert.equal(await tab.locator('#total-active').innerText(), '—');
  assert.match(await tab.locator('#path-list').innerText(), /will appear/);
  await tab.screenshot({ path: resolve(output, 'dashboard-empty-mobile.png'), fullPage: true });
  mode = 'error';
  await tab.locator('#refresh-data').click();
  await tab.locator('#report-error').waitFor({ state: 'visible' });
  await tab.locator('#logout').click();
  await tab.locator('#login-view').waitFor({ state: 'visible' });
  assert.equal(await tab.locator('#total-visitors').textContent(), '—');
  assert.equal(await tab.locator('#engagement-pages').textContent(), '');
  await tab.screenshot({ path: resolve(output, 'login-mobile.png'), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    `Dashboard browser checks passed: desktop/tablet/mobile/320px, keyboard chart, date filter, shared links, privacy, themes, empty/error/sign-out. Screenshots: ${output}`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
