import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Run after building each static site. Every browser request is fulfilled or aborted locally.
// Usage: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/test-insights-tracking-browser.mjs --lab=/path/to/lab/out --toolbox=/path/to/toolbox/dist
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const equals = arg.indexOf('=');
    return [arg.slice(0, equals), arg.slice(equals + 1)];
  }),
);
assert.ok(args['--lab'] && args['--toolbox'], 'Supply built --lab and --toolbox directories.');
const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const origins = {
  portfolio: 'https://kristiansalmeron.com',
  lab: 'https://lab.kristiansalmeron.com',
  toolbox: 'https://toolbox.kristiansalmeron.com',
  analytics: 'https://analytics.kristiansalmeron.com',
};
const exportsByOrigin = new Map([
  [origins.portfolio, resolve(args['--portfolio'] || resolve(root, 'apps/web/out'))],
  [origins.lab, resolve(args['--lab'])],
  [origins.toolbox, resolve(args['--toolbox'])],
]);
const tracker = await readFile(resolve(root, 'apps/api/src/analytics/web/tracker.js'), 'utf8');
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};
const events = [],
  documentRequests = [],
  blocked = [];
let generationAttempts = 0;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ serviceWorkers: 'block', ...(process.env.TRACKER_MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : {}) });
await context.route('**/*', async (route) => {
  const request = route.request(),
    url = new URL(request.url());
  if (request.resourceType() === 'document')
    documentRequests.push({ url: url.href, referrer: request.headers().referer ?? '' });
  const cors = {
    'access-control-allow-origin': request.headers().origin ?? '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
  };
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  if (url.origin === origins.analytics && url.pathname === '/analytics-assets/tracker.js')
    return route.fulfill({ contentType: 'application/javascript', body: tracker });
  if (url.origin === origins.analytics && url.pathname === '/api/analytics/collect') {
    events.push(JSON.parse(request.postData() ?? '{}'));
    return route.fulfill({ status: 204, headers: cors });
  }
  if (url.hostname === 'toolbox-prompt-api.onrender.com' && url.pathname === '/api/generate') {
    generationAttempts += 1;
    // Deliberately do not retain the generation request or its synthetic credential.
    return route.fulfill({
      status: 200,
      headers: cors,
      contentType: 'application/json',
      body: JSON.stringify({
        prompt: 'Synthetic test output; no provider was contacted.',
        modelId: 'gpt-6-luna',
      }),
    });
  }
  const directory = exportsByOrigin.get(url.origin);
  if (directory) {
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return route.abort();
    }
    const filename = resolve(directory, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (filename !== directory && filename.startsWith(directory + sep)) {
      try {
        return await route.fulfill({
          contentType: mime[extname(filename)] ?? 'application/octet-stream',
          body: await readFile(filename),
        });
      } catch {
        /* Unexpected URLs fail closed below; never reach the network. */
      }
    }
  }
  blocked.push(url.origin + url.pathname);
  return route.abort();
});
const waitUntil = async (predicate, message, timeout = 5000) => {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error(message);
    await new Promise((done) => setTimeout(done, 25));
  }
};
const firstView = (site) =>
  events.find((event) => event.site === site && event.event === 'pageview');
try {
  const portfolio = await context.newPage();
  await portfolio.goto(
    origins.portfolio + '/?private_query=never-collect-query#never-collect-fragment',
  );
  await waitUntil(() => firstView('portfolio'), 'Real built Portfolio did not initialize its tracker.');
  await portfolio.locator('a[href="https://lab.kristiansalmeron.com/"]').first().click();
  await portfolio.getByRole('heading', { level: 1 }).waitFor();
  await waitUntil(() => firstView('lab'), 'Real built Lab did not initialize its tracker.');
  const lab = portfolio;
  assert.equal(firstView('lab').referrer, 'kristiansalmeron.com');
  assert.equal(
    documentRequests.find((request) => request.url === origins.lab + '/')?.referrer,
    origins.portfolio + '/',
  );
  const labBefore = events.filter(
    (event) => event.site === 'lab' && event.event === 'pageview',
  ).length;
  await lab.getByRole('link', { name: 'The method', exact: true }).click();
  await waitUntil(
    () =>
      events.filter((event) => event.site === 'lab' && event.event === 'pageview').length >
      labBefore,
    'Lab client navigation did not emit a pageview.',
  );
  await waitUntil(
    () => events.some((event) => event.site === 'lab' && event.event === 'experiment_open' && event.content === 'pdf-rendering'),
    'Lab protocol open did not finish sending.',
  );
  const labMethod = events.find(
    (event) =>
      event.site === 'lab' &&
      event.path === '/experiments/pdf-rendering/' &&
      event.event === 'pageview',
  );
  assert.equal(labMethod.previousPageId, firstView('lab').pageId);

  const toolbox = await context.newPage();
  // Model an arrival from Lab; there is currently no direct Lab-to-Toolbox navigation link.
  await toolbox.goto(origins.toolbox + '/', { referer: origins.lab + '/' });
  await waitUntil(() => firstView('toolbox'), 'Real built Toolbox did not initialize its tracker.');
  for (const site of ['lab', 'toolbox']) {
    assert.equal(
      firstView(site).visitorId,
      firstView('portfolio').visitorId,
      `${site}: daily identifier must span owned hosts`,
    );
    assert.equal(
      firstView(site).sessionId,
      firstView('portfolio').sessionId,
      `${site}: visit must span owned hosts`,
    );
    assert.equal(firstView(site).visitScope, 'shared');
  }
  const cookies = await context.cookies();
  for (const name of ['ks_insights_visitor_v2', 'ks_insights_session_v2']) {
    const cookie = cookies.find((item) => item.name === name);
    assert.ok(
      cookie?.secure && cookie.domain.endsWith('kristiansalmeron.com'),
      `${name}: first-party Secure cookie required`,
    );
    assert.equal(cookie.sameSite, 'Lax');
  }
  for (const link of await toolbox.locator('a[href="https://kristiansalmeron.com/"]').all()) {
    assert.equal(await link.getAttribute('referrerpolicy'), 'origin');
    assert.ok(!((await link.getAttribute('rel')) ?? '').split(/\s+/).includes('noreferrer'));
  }
  assert.ok(
    (await toolbox.getByRole('link', { name: 'GitHub', exact: true }).getAttribute('rel')).includes(
      'noreferrer',
    ),
  );
  await toolbox.getByRole('link', { name: 'Open Prompt Builder', exact: true }).click();
  await toolbox.getByLabel('Your idea', { exact: true }).waitFor();
  await waitUntil(
    () => events.some((event) => event.event === 'tool_open'),
    'Tool open did not collect.',
  );
  assert.equal(
    events.filter((event) => event.event === 'tool_action').length,
    0,
    'Opening the tool is not a generation.',
  );
  await toolbox
    .getByLabel('Your idea', { exact: true })
    .fill('SYNTHETIC_PRIVATE_IDEA_DO_NOT_COLLECT');
  await toolbox.getByRole('button', { name: 'Unlock AI', exact: true }).click();
  await toolbox
    .getByLabel('Workbench access key', { exact: true })
    .fill('SYNTHETIC-TEST-KEY-NOT-A-REAL-CREDENTIAL');
  await toolbox.getByRole('button', { name: 'Unlock for this visit', exact: true }).click();
  await toolbox.getByRole('button', { name: 'Build prompt', exact: true }).click();
  await waitUntil(
    () => generationAttempts === 1 && events.some((event) => event.event === 'tool_action'),
    'Validated generation attempt did not collect.',
  );
  const action = events.find((event) => event.event === 'tool_action');
  assert.equal(action.site, 'toolbox');
  assert.equal(action.content, 'prompt-builder');
  assert.equal(action.action, 'generate');
  assert.equal(events.filter((event) => event.event === 'tool_action').length, 1);
  assert.ok(!JSON.stringify(events).includes('SYNTHETIC_PRIVATE'));
  assert.ok(!JSON.stringify(events).includes('SYNTHETIC-TEST-KEY'));
  assert.ok(!JSON.stringify(events).includes('never-collect'));
  assert.ok(events.every((event) => !event.path.includes('?') && !event.path.includes('#')));

  const privacy = await context.newPage();
  await privacy.goto(origins.lab + '/privacy/?analytics_opt_out=1');
  await privacy.getByRole('status', { name: 'Analytics preference' }).waitFor();
  await waitUntil(() => context.pages().length >= 3, 'Privacy page did not open.');
  const consentCookie = (await context.cookies()).find(
    (cookie) => cookie.name === 'ks_analytics_opt_out',
  );
  assert.equal(consentCookie?.value, '1');
  assert.ok(
    !events.some((event) => event.path === '/privacy/'),
    'Privacy notice must process choices without recording pageviews.',
  );
  await new Promise((done) => setTimeout(done, 150));
  const countAtOptOut = events.length;
  for (const page of [lab, toolbox]) {
    await page.evaluate(() => {
      window.StudioInsights.pageview();
      window.StudioInsights.track('tool_action', { content: 'prompt-builder', action: 'generate' });
    });
    assert.equal(await page.evaluate(() => window.StudioInsights.isEnabled()), false);
  }
  await new Promise((done) => setTimeout(done, 200));
  assert.equal(
    events.length,
    countAtOptOut,
    'Opt-out must stop collection in already-open sibling sites.',
  );
  const afterOptOut = await context.cookies();
  assert.ok(
    !afterOptOut.some((cookie) =>
      ['ks_insights_visitor_v2', 'ks_insights_session_v2'].includes(cookie.name),
    ),
  );
  for (const page of [lab, toolbox]) {
    assert.equal(await page.evaluate(() => localStorage.getItem('ks_insights_outbox_v2')), null);
  }
  console.log(
    JSON.stringify(
      {
        passed: true,
        browser: 'Chrome',
        actualBuilds: ['Portfolio', 'Lab', 'Toolbox'],
        mobile: !!process.env.TRACKER_MOBILE,
        checked: [
          'shared secure identifiers',
          'origin-only referrals',
          'Lab SPA paths',
          'experiment opens',
          'tool opens',
          'fixed generation attempt without input',
          'privacy exclusion',
          'cross-site opt-out',
        ],
        capturedEvents: events.length,
        mockedGenerationRequests: generationAttempts,
        productionRequests: 0,
        blockedResources: [...new Set(blocked)],
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
  await browser.close();
}
