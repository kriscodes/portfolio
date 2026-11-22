import { readFile } from 'node:fs/promises';
import { createDemoReports } from './demo-data.js';

let page: string | undefined;

export async function renderDemoPage() {
  if (page) return page;

  const [shell, ownerShell] = await Promise.all([
    readFile(new URL('./web/demo.html', import.meta.url), 'utf8'),
    readFile(new URL('./web/index.html', import.meta.url), 'utf8'),
  ]);
  const report = ownerShell.match(/<!-- report:start -->([\s\S]+?)<!-- report:end -->/)?.[1];
  if (!report) throw new Error('Missing shared analytics overview.');

  const overview = report
    .trim()
    .replace(/<!-- owner:start -->[\s\S]+?<!-- owner:end -->/g, '')
    .replace(
      '<!-- demo:intro -->',
      '<h1 id="overview-heading">Studio Insights</h1><p>Explore how visitors discover work and move between sites. All figures in this demo are synthetic.</p>',
    )
    .replace(
      '<!-- demo:context -->',
      '<span class="access-pill">Synthetic data</span><span>Fixed sample · Pacific time</span>',
    );

  const reports = JSON.stringify(createDemoReports()).replaceAll('<', '\\u003c');
  page = shell
    .replace('<!-- overview -->', () => overview)
    .replace(
      '<!-- demo:reports -->',
      () => `<script id="demo-reports" type="application/json">${reports}</script>`,
    );
  return page;
}
