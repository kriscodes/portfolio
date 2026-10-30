import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateExport } from './validate-web.mjs';

async function fixture(t, transform = (value) => value) {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-release-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'work'), { recursive: true });
  await writeFile(join(directory, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await writeFile(join(directory, 'style.css'), '.test{color:gray}');
  const page = (route, title, body) =>
    `<!doctype html><html lang="en"><head><title>${title}</title><meta name="description" content="${title} description"><link rel="canonical" href="https://kristiansalmeron.com${route}"><meta property="og:title" content="${title}"><meta property="og:description" content="${title} description"><meta property="og:url" content="https://kristiansalmeron.com${route}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css"></head><body><a href="#main">Skip to content</a><main id="main"><h1>${title}</h1>${body}</main></body></html>`;
  const sources = {
    'index.html': page(
      '/',
      'Home',
      '<a href="/work/#details">Read work</a><label for="height">Height</label><input type="range" id="height"><button aria-controls="settings">Sail settings</button><div id="settings"></div>',
    ),
    'work/index.html': page(
      '/work/',
      'Work',
      '<h2 id="details">The details</h2><a href="/">Home</a><a href="https://www.linkedin.com/in/krissalmeron/" target="_blank" rel="noreferrer">LinkedIn</a>',
    ),
    '404.html': page('/404.html', 'Not found', '<a href="/">Home</a>'),
    'sitemap.xml':
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://kristiansalmeron.com/</loc></url><url><loc>https://kristiansalmeron.com/work/</loc></url></urlset>',
    'robots.txt': 'User-Agent: *\nAllow: /\nSitemap: https://kristiansalmeron.com/sitemap.xml\n',
  };
  for (const [name, source] of Object.entries(sources))
    await writeFile(join(directory, name), transform(source, name));
  return { directory, sourceDirectory: false, routes: ['/', '/work/'], checkCopy: false };
}

test('accepts a complete release with named native controls, local assets, and cross-page anchors', async (t) => {
  const result = await validateExport(await fixture(t));
  assert.deepEqual(result.errors, []);
  assert.equal(result.pages, 3);
  assert.ok(result.links >= 7);
  assert.equal(result.assets, 2);
});

test('detects missing exported pages and broken cross-page anchors', async (t) => {
  const result = await validateExport(
    await fixture(t, (source, name) =>
      name === 'index.html'
        ? source.replace('/work/#details', '/work/#missing') + '<a href="/gone/">Missing page</a>'
        : source,
    ),
  );
  assert.ok(result.errors.some((error) => error.includes('no hash target: /work/#missing')));
  assert.ok(result.errors.some((error) => error.includes('no exported target: /gone/')));
});

test('detects missing image and nested font assets', async (t) => {
  const options = await fixture(t, (source, name) =>
    name === 'index.html'
      ? source
          .replace('</main>', '<img src="/missing.jpg" alt="Sail"></main>')
          .replace(
            '</head>',
            '<meta property="og:image" content="https://kristiansalmeron.com/social-preview.png"></head>',
          )
      : source,
  );
  await writeFile(
    join(options.directory, 'style.css'),
    '@font-face{font-family:test;src:url("./missing.woff2")}',
  );
  const result = await validateExport(options);
  assert.ok(result.errors.some((error) => error.includes('missing local asset /missing.jpg')));
  assert.ok(result.errors.some((error) => error.includes('missing local asset /missing.woff2')));
  assert.ok(
    result.errors.some((error) => error.includes('missing local asset /social-preview.png')),
  );
});

test('detects inaccessible native controls, duplicate IDs, and invalid ARIA references', async (t) => {
  const result = await validateExport(
    await fixture(t, (source, name) =>
      name === 'index.html'
        ? source
            .replace('for="height"', 'for="gone"')
            .replace('aria-controls="settings"', 'aria-controls="gone"')
            .replace('</main>', '<div id="settings"></div><button></button></main>')
        : source,
    ),
  );
  for (const expected of [
    'duplicate id settings',
    'aria-controls points to missing id gone',
    'label points to missing input gone',
    'has no label',
    'button has no accessible name',
  ])
    assert.ok(
      result.errors.some((error) => error.includes(expected)),
      expected,
    );
});

test('detects unsafe new-tab and placeholder links', async (t) => {
  const result = await validateExport(
    await fixture(t, (source, name) =>
      name === 'work/index.html'
        ? source.replace('rel="noreferrer"', '').replace('</main>', '<a href="#">Later</a></main>')
        : source,
    ),
  );
  assert.ok(result.errors.some((error) => error.includes('new-tab link lacks')));
  assert.ok(result.errors.some((error) => error.includes('placeholder link')));
});

test('requires canonical production metadata and crawler discovery', async (t) => {
  const result = await validateExport(
    await fixture(t, (source, name) =>
      name === 'index.html'
        ? source
            .replace('href="https://kristiansalmeron.com/"', 'href="https://preview.invalid/"')
            .replace('property="og:url"', 'property="unused"')
        : name === 'robots.txt'
          ? source + 'Disallow: /\n'
          : name === 'sitemap.xml'
            ? source.replace(
                '<loc>https://kristiansalmeron.com/work/</loc>',
                '<loc>https://kristiansalmeron.com/gone/</loc>',
              )
            : source,
    ),
  );
  for (const expected of [
    'canonical must be',
    'og:url is required',
    'blocks all crawlers',
    'missing https://kristiansalmeron.com/work/',
    'no canonical exported page',
  ])
    assert.ok(
      result.errors.some((error) => error.includes(expected)),
      expected,
    );
});

test('detects accidentally shipped prototype bridges without flagging ordinary prose', async (t) => {
  const options = await fixture(t);
  await writeFile(join(options.directory, 'prototype.js'), 'window.openai.setWidgetState({});');
  const result = await validateExport(options);
  assert.ok(result.errors.some((error) => error.includes('prototype-only bridge remains')));
});

test('detects duplicate primary landmarks and unfinished visible copy', async (t) => {
  const result = await validateExport(
    await fixture(t, (source, name) =>
      name === 'index.html'
        ? source.replace('</body>', '<main><h1>TODO</h1></main></body>')
        : source,
    ),
  );
  for (const expected of ['expected one main', 'expected one H1', 'unfinished visible content'])
    assert.ok(
      result.errors.some((error) => error.includes(expected)),
      expected,
    );
});
