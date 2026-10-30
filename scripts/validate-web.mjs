#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const CONTENT_ROUTES = [
  '/',
  '/work/',
  '/work/gen-ui/',
  '/work/care-iq/',
  '/about/',
  '/contact/',
  '/field-notes/',
  '/field-notes/the-boundary-is-the-feature/',
  '/field-notes/leave-room-for-the-unknown/',
];

const repository = fileURLToPath(new URL('../', import.meta.url));
// Use the standard-library HTML parser, rather than treating serialized React HTML as XML.
// It decodes entities and handles scripts, void elements, and nested accessible labels.
const htmlParser = String.raw`
import json, sys
from html.parser import HTMLParser

VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.nodes = []
        self.stack = []
        self.text = []
    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs), 'text': '', 'parents': list(self.stack)}
        self.nodes.append(node)
        if tag not in VOID:
            self.stack.append(len(self.nodes)-1)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.stack.pop()
    def handle_endtag(self, tag):
        for position in range(len(self.stack)-1, -1, -1):
            if self.nodes[self.stack[position]]['tag'] == tag:
                self.stack = self.stack[:position]
                break
    def handle_data(self, value):
        hidden = any(self.nodes[index]['tag'] in ('script', 'style', 'template') for index in self.stack)
        for index in self.stack:
            if self.nodes[index]['tag'] not in ('script', 'style', 'template'):
                self.nodes[index]['text'] += value
        if not hidden:
            self.text.append(value)

result = {}
for filename, source in json.load(sys.stdin).items():
    parser = Document()
    parser.feed(source)
    result[filename] = {'nodes': parser.nodes, 'text': ' '.join(parser.text)}
json.dump(result, sys.stdout)
`;

async function filesBelow(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) files.push(...(await filesBelow(path)));
    else if (item.isFile()) files.push(path);
  }
  return files;
}

function normalizeRoute(pathname) {
  if (pathname === '/') return '/';
  if (extname(pathname)) return pathname;
  return pathname.replace(/\/+$/, '') + '/';
}

function routeForFile(path, directory) {
  const relativePath = relative(directory, path).split(sep).join('/');
  return relativePath === 'index.html' ? '/' : '/' + relativePath.replace(/\/index\.html$/, '/');
}

function compact(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function resolveLocalPath(url, directory) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  const path = resolve(directory, '.' + pathname);
  return path === directory || path.startsWith(directory + sep) ? path : null;
}

function attrTokens(value = '') {
  return value.trim().split(/\s+/).filter(Boolean);
}

/** Audit the actual static release, including cross-page anchors and referenced CSS assets. */
export async function validateExport(options = {}) {
  const directory = resolve(options.directory ?? resolve(repository, 'apps/web/out'));
  const origin = new URL(options.origin ?? 'https://kristiansalmeron.com').origin;
  const sourceDirectory =
    options.sourceDirectory === false
      ? null
      : resolve(options.sourceDirectory ?? resolve(repository, 'apps/web/src'));
  const routes = options.routes ?? CONTENT_ROUTES;
  const requireSeo = options.requireSeo ?? true;
  const checkCopy = options.checkCopy ?? true;
  const errors = [];
  const add = (where, message) => errors.push(`${where}: ${message}`);
  let files;
  try {
    files = await filesBelow(directory);
  } catch {
    return {
      errors: [`Export directory does not exist: ${directory}. Run the production build first.`],
      pages: 0,
      links: 0,
      assets: 0,
    };
  }

  const htmlFiles = files.filter((file) => extname(file) === '.html');
  const htmlSources = Object.fromEntries(
    await Promise.all(htmlFiles.map(async (file) => [file, await readFile(file, 'utf8')])),
  );
  const parsed = spawnSync('python3', ['-c', htmlParser], {
    input: JSON.stringify(htmlSources),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (parsed.status !== 0)
    throw new Error(`HTML parser failed: ${parsed.stderr || parsed.error?.message}`);
  const documents = JSON.parse(parsed.stdout);
  const pages = new Map(
    htmlFiles.map((file) => [
      routeForFile(file, directory),
      { ...documents[file], file, source: htmlSources[file] },
    ]),
  );
  for (const route of routes)
    if (!pages.has(route)) add(route, 'required exported route is missing');
  if (!pages.has('/404.html') && !pages.has('/404/'))
    add('/404.html', 'custom not-found export is missing');

  const titles = new Map();
  const descriptions = new Map();
  const assetReferences = new Map();
  let linksChecked = 0;
  const assetExists = async (url, where) => {
    if (url.origin !== origin || ['data:', 'blob:'].includes(url.protocol)) return;
    const path = resolveLocalPath(url, directory);
    if (!path) {
      add(where, `asset escapes release directory: ${url.pathname}`);
      return;
    }
    if (assetReferences.has(path)) return;
    assetReferences.set(path, url);
    try {
      if (!(await stat(path)).isFile()) add(where, `asset is not a file: ${url.pathname}`);
    } catch {
      add(where, `missing local asset ${url.pathname}`);
    }
  };

  for (const [route, document] of pages) {
    const { nodes } = document;
    const contentRoute = routes.includes(route);
    const elements = (tag) => nodes.filter((node) => node.tag === tag);
    const main = elements('main');
    if (main.length !== 1) add(route, `expected one main landmark, found ${main.length}`);
    if (elements('h1').length !== 1) add(route, `expected one H1, found ${elements('h1').length}`);
    else if (!compact(elements('h1')[0].text)) add(route, 'H1 is empty');
    if (!elements('html')[0]?.attrs.lang) add(route, 'document language is missing');
    if (!/<!doctype\s+html/i.test(document.source)) add(route, 'HTML doctype is missing');
    const pageTitles = elements('title');
    if (pageTitles.length !== 1 || !compact(pageTitles[0]?.text))
      add(route, 'one meaningful document title is required');
    const meta = (name, attribute = 'name') =>
      nodes.filter((node) => node.tag === 'meta' && node.attrs[attribute] === name);
    if (contentRoute) {
      const title = compact(pageTitles[0]?.text);
      if (titles.has(title)) add(route, `document title duplicates ${titles.get(title)}`);
      titles.set(title, route);
      const desc = meta('description');
      if (desc.length !== 1 || !compact(desc[0]?.attrs.content))
        add(route, 'one nonempty description is required');
      const description = compact(desc[0]?.attrs.content);
      if (descriptions.has(description))
        add(route, `description duplicates ${descriptions.get(description)}`);
      descriptions.set(description, route);
      const canonical = nodes.filter(
        (node) => node.tag === 'link' && attrTokens(node.attrs.rel).includes('canonical'),
      );
      if (requireSeo && canonical.length !== 1) add(route, 'one canonical URL is required');
      if (canonical.length && canonical[0].attrs.href !== origin + route)
        add(route, `canonical must be ${origin + route}`);
      for (const key of ['og:title', 'og:description', 'og:url']) {
        const tags = meta(key, 'property');
        if (requireSeo && (tags.length !== 1 || !compact(tags[0]?.attrs.content)))
          add(route, `one nonempty ${key} is required`);
        if (key === 'og:url' && tags.length && tags[0].attrs.content !== origin + route)
          add(route, `og:url must be ${origin + route}`);
      }
    }

    const ids = new Map();
    for (const node of nodes)
      if (node.attrs.id) {
        if (ids.has(node.attrs.id)) add(route, `duplicate id ${node.attrs.id}`);
        ids.set(node.attrs.id, node);
      }
    const accessibleName = (node) =>
      compact(
        node.attrs['aria-label'] ||
          attrTokens(node.attrs['aria-labelledby'])
            .map((id) => ids.get(id)?.text ?? '')
            .join(' ') ||
          node.text,
      );
    for (const node of nodes) {
      for (const attribute of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
        for (const target of attrTokens(node.attrs[attribute]))
          if (!ids.has(target)) add(route, `${attribute} points to missing id ${target}`);
      }
      if (node.tag === 'label' && node.attrs.for && !ids.has(node.attrs.for))
        add(route, `label points to missing input ${node.attrs.for}`);
      if (node.tag === 'button' && !accessibleName(node))
        add(route, 'button has no accessible name');
      if (
        ['input', 'select', 'textarea'].includes(node.tag) &&
        !['hidden', 'submit', 'button', 'reset'].includes(node.attrs.type)
      ) {
        const explicitLabel = nodes.some(
          (label) =>
            label.tag === 'label' &&
            node.attrs.id &&
            label.attrs.for === node.attrs.id &&
            compact(label.text),
        );
        const wrappingLabel = node.parents.some(
          (index) => nodes[index].tag === 'label' && compact(nodes[index].text),
        );
        if (
          !node.attrs['aria-label'] &&
          !node.attrs['aria-labelledby'] &&
          !explicitLabel &&
          !wrappingLabel
        )
          add(route, `${node.tag} ${node.attrs.id || node.attrs.name || ''} has no label`);
      }
      if (node.tag === 'img' && !Object.hasOwn(node.attrs, 'alt'))
        add(route, `image ${node.attrs.src ?? ''} has no alt attribute`);

      if (node.tag === 'a') {
        linksChecked++;
        const href = compact(node.attrs.href);
        if (!href || href === '#' || /^(?:javascript:|void\b)/i.test(href)) {
          add(route, `placeholder link ${JSON.stringify(href)}`);
          continue;
        }
        if (
          !accessibleName(node) &&
          !node.parents.some((index) => nodes[index].tag === 'svg') &&
          !nodes.some(
            (child) =>
              child.parents.includes(nodes.indexOf(node)) && child.tag === 'img' && child.attrs.alt,
          )
        )
          add(route, `link ${href} has no accessible name`);
        if (
          node.attrs.target === '_blank' &&
          !attrTokens(node.attrs.rel).some((token) => ['noopener', 'noreferrer'].includes(token))
        )
          add(route, `new-tab link lacks noopener/noreferrer: ${href}`);
        let url;
        try {
          url = new URL(href, origin + route);
        } catch {
          add(route, `invalid link ${href}`);
          continue;
        }
        if (['mailto:', 'tel:'].includes(url.protocol)) continue;
        if (!['https:', 'http:'].includes(url.protocol)) {
          add(route, `unsupported link protocol ${href}`);
          continue;
        }
        if (url.origin !== origin) continue;
        const targetRoute = normalizeRoute(url.pathname);
        const targetDocument = pages.get(targetRoute);
        if (!targetDocument) {
          const path = resolveLocalPath(url, directory);
          if (!path || !files.includes(path))
            add(route, `internal link has no exported target: ${href}`);
        } else if (url.hash) {
          let anchor;
          try {
            anchor = decodeURIComponent(url.hash.slice(1));
          } catch {
            add(route, `invalid hash encoding: ${href}`);
            continue;
          }
          if (
            !targetDocument.nodes.some(
              (target) =>
                target.attrs.id === anchor || (target.tag === 'a' && target.attrs.name === anchor),
            )
          )
            add(route, `internal link has no hash target: ${href}`);
        }
      }
      const references = [];
      if (node.attrs.src) references.push(node.attrs.src);
      if (node.attrs.poster) references.push(node.attrs.poster);
      if (
        node.tag === 'meta' &&
        ['og:image', 'og:image:secure_url', 'twitter:image'].includes(
          node.attrs.property ?? node.attrs.name,
        ) &&
        node.attrs.content
      )
        references.push(node.attrs.content);
      if (node.attrs.srcset && !/^data:/i.test(node.attrs.srcset))
        references.push(...node.attrs.srcset.split(',').map((item) => item.trim().split(/\s+/)[0]));
      if (
        node.tag === 'link' &&
        attrTokens(node.attrs.rel).some((token) =>
          ['stylesheet', 'icon', 'preload', 'modulepreload'].includes(token),
        ) &&
        node.attrs.href
      )
        references.push(node.attrs.href);
      for (const ref of references) {
        try {
          await assetExists(new URL(ref, origin + route), route);
        } catch {
          add(route, `invalid asset URL: ${ref}`);
        }
      }
    }
    const bodyText = compact(document.text);
    const placeholder = bodyText.match(
      /\blorem ipsum\b|\bTODO\b|\bTBD\b|\byour (?:name|email|project)\b|\bexample\.com\b|\bplaceholder (?:text|content)\b/i,
    );
    if (placeholder) add(route, `unfinished visible content: ${placeholder[0]}`);
    if (
      contentRoute &&
      !nodes.some(
        (node) =>
          node.tag === 'a' &&
          node.attrs.href?.startsWith('#') &&
          ids.get(node.attrs.href.slice(1))?.tag === 'main',
      )
    )
      add(route, 'skip link must lead to the main landmark');
  }

  // Assets imported by CSS must be present too; linked stylesheets alone do not catch missing fonts.
  for (const [path, url] of assetReferences)
    if (extname(path) === '.css') {
      let css;
      try {
        css = await readFile(path, 'utf8');
      } catch {
        continue;
      }
      for (const match of css.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) {
        try {
          await assetExists(new URL(match[1].trim(), url), relative(directory, path));
        } catch {
          add(relative(directory, path), `invalid CSS asset ${match[1]}`);
        }
      }
    }

  if (checkCopy) {
    const homeText = compact(pages.get('/')?.text).replace(/[’‘]/g, "'");
    if (
      !/I build systems, explore ideas, and follow (?:the )?interesting questions\./i.test(homeText)
    )
      add('/', 'approved supporting line is missing');
    if (/A practice in making/i.test(homeText)) add('/', 'superseded headline is still present');
    const genText = compact(pages.get('/work/gen-ui/')?.text);
    if (
      !/(?:15|fifteen)\s*(?:min(?:ute)?s?)/i.test(genText) ||
      !/(?:under|less than|<)\s*5\s*(?:sec(?:ond)?s?)/i.test(genText)
    )
      add(
        '/work/gen-ui/',
        'initial PDF rendering outcome (~15 minutes to under 5 seconds) is missing',
      );
    const careText = compact(pages.get('/work/care-iq/')?.text);
    if (!/(?:in|active|under)\s+development/i.test(careText))
      add('/work/care-iq/', 'current development status must be visible');
    if (/\b(?:HIPAA|SOC\s*2)[ -]?(?:certified|compliant)\b/i.test(careText))
      add('/work/care-iq/', 'unsubstantiated certification/compliance claim');
  }

  if (requireSeo) {
    const sitemapPath = resolve(directory, 'sitemap.xml');
    try {
      const xml = await readFile(sitemapPath, 'utf8');
      const locs = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((match) => match[1].trim());
      for (const route of routes)
        if (!locs.includes(origin + route)) add('/sitemap.xml', `missing ${origin + route}`);
      if (new Set(locs).size !== locs.length) add('/sitemap.xml', 'duplicate URLs');
      for (const loc of locs) {
        try {
          const url = new URL(loc);
          if (url.origin !== origin || !pages.has(normalizeRoute(url.pathname)))
            add('/sitemap.xml', `URL has no canonical exported page: ${loc}`);
        } catch {
          add('/sitemap.xml', `invalid URL ${loc}`);
        }
      }
    } catch {
      add('/sitemap.xml', 'production sitemap is missing');
    }
    try {
      const robots = await readFile(resolve(directory, 'robots.txt'), 'utf8');
      if (
        !new RegExp(
          `^Sitemap:\\s*${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml\\s*$`,
          'im',
        ).test(robots)
      )
        add('/robots.txt', 'production sitemap URL is missing');
      if (/^Disallow:\s*\/\s*$/im.test(robots))
        add('/robots.txt', 'production site blocks all crawlers');
    } catch {
      add('/robots.txt', 'production robots.txt is missing');
    }
  }

  const bridgePattern =
    /window\s*(?:\.\s*openai\b|\[\s*['"]openai['"]\s*\])|openai:set_globals|window\s*\.\s*Tweak\b|\bdata-tweak\b|\bTweak\s*\.\s*(?:attach|create|bind|panel)\b/;
  const scanFiles = files.filter((file) => ['.html', '.js'].includes(extname(file)));
  if (sourceDirectory) {
    try {
      scanFiles.push(
        ...(await filesBelow(sourceDirectory)).filter((file) =>
          ['.tsx', '.ts', '.js', '.jsx', '.css'].includes(extname(file)),
        ),
      );
    } catch {
      add(sourceDirectory, 'source directory is missing');
    }
  }
  for (const file of scanFiles) {
    const match = (await readFile(file, 'utf8')).match(bridgePattern);
    if (match) add(relative(repository, file), `prototype-only bridge remains: ${match[0]}`);
  }
  return {
    errors: [...new Set(errors)],
    pages: pages.size,
    contentPages: routes.length,
    links: linksChecked,
    assets: assetReferences.size,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const directory = args.find((arg) => !arg.startsWith('--'));
  const result = await validateExport({
    directory,
    requireSeo: !args.includes('--no-seo'),
    checkCopy: !args.includes('--no-copy'),
  });
  if (result.errors.length) {
    console.error(
      `Static release audit failed with ${result.errors.length} issue(s):\n${result.errors.map((error) => `  - ${error}`).join('\n')}`,
    );
    process.exitCode = 1;
  } else
    console.log(
      `Static release audit passed: ${result.contentPages} content routes, ${result.pages} exported pages, ${result.links} links, ${result.assets} local assets; semantics, metadata, references, production copy, and prototype cleanup checked.`,
    );
}
