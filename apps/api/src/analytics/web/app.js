'use strict';

(() => {
  const API = '/api/analytics';
  const $ = (id) => document.getElementById(id);
  const state = {
    authenticated: false,
    days: 7,
    view: 'overview',
    report: null,
    ownerEmail: '',
    request: 0,
    controller: null,
  };
  const platforms = [
    { name: 'Facebook', source: 'facebook', medium: 'social' },
    { name: 'Instagram', source: 'instagram', medium: 'social' },
    { name: 'LinkedIn', source: 'linkedin', medium: 'social' },
    { name: 'TikTok', source: 'tiktok', medium: 'social' },
    { name: 'WhatsApp', source: 'whatsapp', medium: 'messaging' },
    { name: 'GitHub', source: 'github', medium: 'social' },
  ];
  const sourceNames = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp',
    github: 'GitHub',
    direct: 'Direct / unknown',
    unknown: 'Direct / unknown',
    google: 'Google',
    other: 'Other',
  };
  const projectNames = { careiq: 'Care IQ', 'care-iq': 'Care IQ', 'gen-ui': 'Medical document viewer', 'rule-builder': 'Claims-auditing rule builder' };
  const number = new Intl.NumberFormat('en-US');
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
  const timeFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
  const svgNS = 'http://www.w3.org/2000/svg';
  let setupToken = '';
  let restoredTheme = '';
  try {
    restoredTheme = localStorage.getItem('ks-insights-theme') || '';
  } catch {}
  let theme = restoredTheme === 'dark' || restoredTheme === 'light' ? restoredTheme : 'light';

  function setTheme() {
    document.documentElement.dataset.theme = theme;
    $('theme-toggle').replaceChildren(
      document.createTextNode(theme === 'dark' ? 'Open Desk ' : 'After Hours '),
    );
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '◐';
    $('theme-toggle').appendChild(icon);
    $('theme-toggle').setAttribute(
      'aria-label',
      'Switch to ' + (theme === 'dark' ? 'Open Desk' : 'After Hours') + ' appearance',
    );
  }
  setTheme();
  $('theme-toggle').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    setTheme();
    try {
      localStorage.setItem('ks-insights-theme', theme);
    } catch {}
  });

  try {
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.has('setup')) {
      setupToken = (hash.get('setup') || '').slice(0, 256);
      history.replaceState(null, '', location.pathname + location.search);
    }
  } catch {}
  if (setupToken) {
    $('setup-code-field').hidden = true;
    $('setup-code-confirmed').hidden = false;
  }

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function svg(tag, attrs) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, String(value));
    return node;
  }
  function count(value) {
    return number.format(Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0);
  }
  function date(value) {
    if (!value) return '';
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(value + 'T12:00:00-08:00')
      : new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : dateFormat.format(parsed);
  }
  function humanSource(value) {
    return sourceNames[value] || value || 'Direct / unknown';
  }
  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }
  function empty(target, message) {
    target.replaceChildren(create('p', 'empty-list', message));
  }

  async function request(path, options = {}) {
    const response = await fetch(API + path, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const error = new Error(
        body?.error?.message ||
          body?.message ||
          (response.status === 429
            ? 'Too many attempts. Please wait a few minutes and try again.'
            : 'We couldn’t complete that request. Please try again.'),
      );
      error.status = response.status;
      throw error;
    }
    return body || {};
  }

  function authScreen(view, message) {
    state.authenticated = false;
    state.report = null;
    state.ownerEmail = '';
    state.request += 1;
    state.controller?.abort();
    $('starting').hidden = true;
    $('dashboard').hidden = true;
    $('main').hidden = false;
    $('logout').hidden = true;
    document.querySelector('.skip-link').href = '#main';
    $('owner-email').textContent = 'Your owner account';
    [
      'total-visitors',
      'total-projects',
      'total-linkedin',
      'total-pageviews',
      'total-visits',
      'total-active',
    ].forEach((id) => {
      $(id).textContent = '—';
    });
    [
      'visitor-chart',
      'daily-table',
      'source-list',
      'project-list',
      'page-list',
      'device-list',
      'campaign-list',
      'site-cards',
      'engagement-pages',
      'entry-list',
      'exit-list',
      'path-list',
      'movement-list',
      'content-list',
      'outbound-list',
    ].forEach((id) => $(id).replaceChildren());
    $('recent-visitors').textContent = 'Recent visitors: —';
    $('last-updated').textContent = 'Waiting for activity';
    $('chart-selection').textContent = '';
    $('no-data-notice').hidden = true;
    $('report-error').hidden = true;
    ['login', 'setup', 'unavailable'].forEach((name) => {
      $(name + '-view').hidden = name !== view;
    });
    if (message && view === 'unavailable') $('unavailable-message').textContent = message;
  }

  function enterDashboard(auth) {
    if (!auth.authenticated)
      throw new Error(
        'Sign-in could not be verified. Make sure cookies are enabled, then try again.',
      );
    state.authenticated = true;
    state.ownerEmail = auth.email || '';
    setupToken = '';
    $('setup-code').value = '';
    $('setup-password').value = '';
    $('setup-password-confirm').value = '';
    $('login-password').value = '';
    $('starting').hidden = true;
    $('main').hidden = true;
    $('dashboard').hidden = false;
    $('logout').hidden = false;
    document.querySelector('.skip-link').href = '#dashboard-main';
    $('owner-email').textContent = state.ownerEmail || 'Your owner account';
    setView(state.view);
    loadReport();
  }

  async function bootstrap() {
    $('starting').hidden = false;
    $('main').hidden = true;
    $('dashboard').hidden = true;
    try {
      const auth = await request('/auth');
      if (auth.authenticated) enterDashboard(auth);
      else authScreen(auth.setupRequired ? 'setup' : 'login');
    } catch {
      authScreen(
        'unavailable',
        'We couldn’t connect to your workspace. If the service was asleep, give it a moment and try again.',
      );
    }
  }
  $('retry-auth').addEventListener('click', bootstrap);

  function setFormBusy(form, busy) {
    form.setAttribute('aria-busy', String(busy));
    for (const input of form.querySelectorAll('input, button')) input.disabled = busy;
  }
  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    $('login-status').textContent = '';
    setFormBusy(form, true);
    try {
      const auth = await request('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: $('login-email').value.trim(),
          password: $('login-password').value,
        }),
      });
      enterDashboard(auth.authenticated ? auth : await request('/auth'));
    } catch (error) {
      $('login-status').textContent = error.message;
      $('login-password').value = '';
    } finally {
      setFormBusy(form, false);
    }
  });
  $('setup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $('setup-password').value;
    const token = setupToken || $('setup-code').value.trim();
    $('setup-status').textContent = '';
    if (!token) {
      $('setup-status').textContent = 'Enter your private setup code to create the owner login.';
      $('setup-code').focus();
      return;
    }
    if (password.length < 14) {
      $('setup-status').textContent = 'Choose a password with at least 14 characters.';
      $('setup-password').focus();
      return;
    }
    if (password !== $('setup-password-confirm').value) {
      $('setup-status').textContent = 'The passwords don’t match. Please try again.';
      $('setup-password-confirm').focus();
      return;
    }
    setFormBusy(form, true);
    try {
      const auth = await request('/setup', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      enterDashboard(auth.authenticated ? auth : await request('/auth'));
    } catch (error) {
      $('setup-status').textContent = error.message;
    } finally {
      setFormBusy(form, false);
    }
  });

  async function signOut() {
    $('logout').disabled = true;
    $('privacy-logout').disabled = true;
    try {
      await request('/logout', { method: 'POST', body: '{}' });
      authScreen('login');
      $('login-email').value = '';
      $('login-status').textContent = '';
      $('login-email').focus();
    } catch (error) {
      $('report-error').textContent = 'We couldn’t sign out. Please try again. ' + error.message;
      $('report-error').hidden = false;
      setView('overview');
    } finally {
      $('logout').disabled = false;
      $('privacy-logout').disabled = false;
    }
  }
  $('logout').addEventListener('click', signOut);
  $('privacy-logout').addEventListener('click', signOut);

  function setView(view) {
    if (!['overview', 'links', 'privacy'].includes(view)) view = 'overview';
    state.view = view;
    ['overview', 'links', 'privacy'].forEach((name) => {
      $(name + '-view').hidden = name !== view;
    });
    document.querySelectorAll('[data-view]').forEach((button) => {
      const selected = button.dataset.view === view;
      button.classList.toggle('active', selected);
      if (selected) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.title =
      (view === 'overview' ? 'Studio Insights' : view === 'links' ? 'Shared links' : 'Privacy') +
      ' — Kristian Salmeron';
  }
  document
    .querySelectorAll('[data-view]')
    .forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  document.querySelectorAll('[data-days]').forEach((button) =>
    button.addEventListener('click', () => {
      const days = Number(button.dataset.days);
      if (![7, 30, 90].includes(days) || state.days === days) return;
      state.days = days;
      document
        .querySelectorAll('[data-days]')
        .forEach((control) =>
          control.setAttribute('aria-pressed', String(Number(control.dataset.days) === days)),
        );
      loadReport();
    }),
  );
  $('refresh-data').addEventListener('click', loadReport);

  async function loadReport() {
    if (!state.authenticated) return;
    const requestId = ++state.request;
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller;
    $('refresh-data').disabled = true;
    $('overview-view').setAttribute('aria-busy', 'true');
    $('report-error').hidden = true;
    try {
      const report = await request('/overview?days=' + state.days, { signal: controller.signal });
      if (requestId !== state.request || !state.authenticated) return;
      state.report = report;
      renderReport(report);
    } catch (error) {
      if (error.name === 'AbortError' || requestId !== state.request) return;
      if (error.status === 401 || error.status === 403) {
        authScreen('login');
        $('login-status').textContent =
          'Your session has ended. Sign in again to see your reports.';
      } else {
        $('report-error').textContent = state.report
          ? 'We couldn’t refresh your report. The last loaded data is still shown. Please try again.'
          : 'We couldn’t load your visitor data. Please try refreshing in a moment.';
        $('report-error').hidden = false;
      }
    } finally {
      if (requestId === state.request) {
        $('refresh-data').disabled = false;
        $('overview-view').setAttribute('aria-busy', 'false');
      }
    }
  }

  function rows(target, list, getLabel, getCount, emptyMessage) {
    target.replaceChildren();
    if (!list.length) {
      empty(target, emptyMessage);
      return;
    }
    for (const item of list.slice(0, 12)) {
      const row = create('div', 'data-row');
      row.append(create('span', '', getLabel(item)), create('strong', '', count(getCount(item))));
      target.appendChild(row);
    }
  }
  function renderSources(sources, total) {
    const target = $('source-list');
    target.replaceChildren();
    if (!sources.length) {
      empty(target, 'Traffic sources will appear after the first visit.');
      return;
    }
    for (const item of sources.slice(0, 8)) {
      const row = create('div', 'meter-row');
      const group = create('div');
      group.appendChild(create('span', 'meter-label', humanSource(item.source)));
      const meter = svg('svg', {
        viewBox: '0 0 100 5',
        preserveAspectRatio: 'none',
        class: 'meter-svg',
        'aria-hidden': 'true',
      });
      meter.appendChild(
        svg('rect', { x: 0, y: 0, width: 100, height: 5, rx: 2.5, class: 'meter-track' }),
      );
      meter.appendChild(
        svg('rect', {
          x: 0,
          y: 0,
          width: Math.min(100, Math.max(0, (Number(item.visitors) / Math.max(1, total)) * 100)),
          height: 5,
          rx: 2.5,
          class: 'meter-fill',
        }),
      );
      group.appendChild(meter);
      row.append(group, create('strong', '', count(item.visitors)));
      target.appendChild(row);
    }
  }
  function renderProjects(report) {
    const list = [];
    for (const project of safeArray(report.projects)) {
      const name = projectNames[project.project] || project.project || 'Project';
      list.push({ label: name + ' project views', value: project.opens });
      if (Number(project.previews) > 0)
        list.push({ label: name + ' preview launches', value: project.previews });
    }
    for (const section of safeArray(report.sections)) {
      const name = String(section.section || 'Studio').replace(/(^|[-_ ])\w/g, (part) =>
        part.replace(/[-_]/g, ' ').toUpperCase(),
      );
      list.push({ label: name + ' section opens', value: section.opens });
    }
    rows(
      $('project-list'),
      list,
      (item) => item.label,
      (item) => item.value,
      'Project and studio activity will appear here.',
    );
  }
  function renderCampaigns(campaigns) {
    const target = $('campaign-list');
    target.replaceChildren();
    if (!campaigns.length) {
      empty(target, 'No tagged visits yet. Copy a platform link from Shared links to get started.');
      return;
    }
    const table = create('table', 'campaign-table');
    const head = create('thead');
    const header = create('tr');
    ['Source', 'Campaign', 'Visitors'].forEach((label) => {
      const th = create('th', '', label);
      th.scope = 'col';
      header.appendChild(th);
    });
    head.appendChild(header);
    const body = create('tbody');
    for (const item of campaigns.slice(0, 15)) {
      const row = create('tr');
      row.append(
        create('td', '', humanSource(item.source)),
        create('td', '', item.campaign || 'Untagged'),
        create('td', '', count(item.visitors)),
      );
      body.appendChild(row);
    }
    table.append(head, body);
    target.appendChild(table);
  }
  function renderChart(daily) {
    const target = $('visitor-chart');
    target.replaceChildren();
    const valid = daily.filter(
      (item) => item && typeof item.date === 'string' && Number.isFinite(Number(item.visitors)),
    );
    $('daily-table').replaceChildren();
    if (!valid.length || !valid.some((item) => Number(item.visitors) > 0)) {
      target.appendChild(create('p', 'chart-empty', 'Your visitor trend will appear here.'));
      $('chart-selection').textContent = '';
      if (!valid.length) return;
    } else {
      const width = Math.max(260, Math.round(target.getBoundingClientRect().width || 600));
      const height = 208,
        left = 34,
        right = 4,
        top = 12,
        bottom = 27;
      const plotWidth = width - left - right,
        plotHeight = height - top - bottom;
      const peak = Math.max(1, ...valid.map((item) => Number(item.visitors)));
      const ceiling = peak <= 4 ? 4 : peak <= 10 ? 10 : Math.ceil(peak / 10) * 10;
      const chart = svg('svg', {
        viewBox: '0 0 ' + width + ' ' + height,
        role: 'group',
        'aria-label':
          'Daily estimated visitors. ' +
          valid.map((item) => date(item.date) + ': ' + count(item.visitors)).join('; '),
      });
      [0, 0.5, 1].forEach((ratio) => {
        const y = top + plotHeight * ratio;
        chart.appendChild(
          svg('line', { x1: left, x2: width - right, y1: y, y2: y, class: 'chart-grid' }),
        );
        const label = svg('text', {
          x: left - 9,
          y: y + 4,
          'text-anchor': 'end',
          class: 'chart-axis',
        });
        label.textContent = count(ceiling * (1 - ratio));
        chart.appendChild(label);
      });
      const step = plotWidth / valid.length;
      const gap = Math.max(1, Math.min(9, step * 0.24));
      valid.forEach((item, index) => {
        const barHeight = (Number(item.visitors) / ceiling) * plotHeight;
        const bar = svg('rect', {
          x: left + index * step + gap / 2,
          y: top + plotHeight - barHeight,
          width: Math.max(1, step - gap),
          height: Math.max(0, barHeight),
          rx: Math.min(3, step / 5),
          class: 'chart-bar',
        });
        const title = svg('title');
        title.textContent = date(item.date) + ': ' + count(item.visitors) + ' estimated visitors';
        bar.appendChild(title);
        bar.setAttribute('tabindex', '0');
        bar.setAttribute('role', 'button');
        bar.setAttribute('aria-label', title.textContent);
        bar.addEventListener('focus', () => {
          $('chart-selection').textContent = title.textContent;
        });
        bar.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            $('chart-selection').textContent = title.textContent;
          }
        });
        bar.addEventListener('pointerenter', () => {
          $('chart-selection').textContent = title.textContent;
        });
        bar.addEventListener('click', () => {
          $('chart-selection').textContent = title.textContent;
        });
        chart.appendChild(bar);
      });
      const indices = [...new Set([0, Math.floor((valid.length - 1) / 2), valid.length - 1])];
      indices.forEach((index, position) => {
        const x =
          position === 0
            ? left
            : position === indices.length - 1
              ? width - right
              : left + plotWidth / 2;
        const label = svg('text', {
          x,
          y: height - 3,
          'text-anchor':
            position === 0 ? 'start' : position === indices.length - 1 ? 'end' : 'middle',
          class: 'chart-axis',
        });
        label.textContent = date(valid[index].date);
        chart.appendChild(label);
      });
      target.appendChild(chart);
    }
    const table = create('table', 'daily-data');
    const head = create('thead');
    const header = create('tr');
    ['Date', 'Estimated visitors'].forEach((label) => {
      const th = create('th', '', label);
      th.scope = 'col';
      header.appendChild(th);
    });
    head.appendChild(header);
    const body = create('tbody');
    for (const item of valid) {
      const row = create('tr');
      row.append(create('td', '', date(item.date)), create('td', '', count(item.visitors)));
      body.appendChild(row);
    }
    table.append(head, body);
    $('daily-table').appendChild(table);
  }

  const siteNames = { portfolio: 'Portfolio', lab: 'Lab', toolbox: 'Toolbox' };
  const contentNames = {
    careiq: 'Care IQ',
    'care-iq': 'Care IQ',
    'gen-ui': 'Medical document viewer', 'rule-builder': 'Claims-auditing rule builder',
    'neon-drift': 'Neon Drift',
    'pdf-rendering': 'PDF rendering protocol',
    'prompt-builder': 'Prompt Builder',
  };
  function siteName(site) {
    return siteNames[site] || 'Unknown site';
  }
  function pageLabel(site, path) {
    return siteName(site) + ' · ' + (path || '/');
  }
  function duration(seconds) {
    if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return '—';
    const value = Math.max(0, Math.round(Number(seconds)));
    return value < 60 ? value + 's' : Math.floor(value / 60) + 'm ' + (value % 60) + 's';
  }
  function percent(value) {
    return value === null || value === undefined
      ? '—'
      : Math.round(Math.min(1, Math.max(0, Number(value))) * 100) + '%';
  }
  function detailRows(id, list, label, metric, description, message) {
    const target = $(id);
    target.replaceChildren();
    if (!list.length) {
      empty(target, message);
      return;
    }
    for (const item of list.slice(0, 12)) {
      const row = create('div', 'detail-row');
      const text = create('div', '', label(item));
      const note = description(item);
      if (note) text.appendChild(create('small', '', note));
      row.append(text, create('strong', '', metric(item)));
      target.appendChild(row);
    }
    if (list.length > 12)
      target.appendChild(create('p', 'panel-note', 'Showing the 12 highest counts.'));
  }
  function renderInsights(insights = {}) {
    const coverage = insights.coverage || {};
    const totals = insights.totals || {};
    $('coverage-warning').hidden = !coverage.limited;
    $('total-visits').textContent = count(totals.visits);
    $('total-active').textContent = duration(totals.avgActiveSeconds);
    $('measurement-coverage').textContent = insights.measurementStartedAt
      ? 'Earliest retained new event ' +
        timeFormat.format(new Date(insights.measurementStartedAt)) +
        ' PT · ' +
        count(coverage.timedPageviews) +
        ' timed / ' +
        count(coverage.pageviews) +
        ' new pageviews'
      : 'No new measurements yet. Historical traffic remains available below.';
    const sites = $('site-cards');
    sites.replaceChildren();
    for (const site of ['portfolio', 'lab', 'toolbox']) {
      const item = safeArray(insights.sites).find((entry) => entry.site === site);
      const card = create('section', 'site-card');
      const title = create('h3');
      title.append(
        create('span', 'status-dot' + (item?.lastEventAt ? '' : ' pending')),
        document.createTextNode(siteName(site)),
      );
      card.append(
        title,
        create('strong', '', count(item?.pageviews) + ' new pageviews'),
        create(
          'p',
          '',
          count(item?.entries) +
            ' visit entries · ' +
            count(item?.visits) +
            ' visits with new measurement',
        ),
      );
      card.appendChild(
        create(
          'p',
          '',
          item?.lastEventAt
            ? 'Last observed ' + timeFormat.format(new Date(item.lastEventAt)) + ' PT'
            : 'No events observed yet',
        ),
      );
      sites.appendChild(card);
    }
    const pages = safeArray(insights.pages);
    const target = $('engagement-pages');
    target.replaceChildren();
    if (!pages.length)
      empty(
        target,
        'Active time and scroll depth will appear after updated collectors record pageviews.',
      );
    else {
      const wrap = create('div', 'table-scroll');
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'region');
      wrap.setAttribute(
        'aria-label',
        'Page engagement table, scroll horizontally for all milestones',
      );
      const table = create('table', 'insights-table');
      table.appendChild(
        create(
          'caption',
          '',
          'Most viewed pages · Scroll counts are cumulative, not additional visits',
        ),
      );
      const head = create('thead');
      const tr = create('tr');
      ['Page', 'Views', 'Avg. active', 'Timed', '25%', '50%', '75%', '100%'].forEach((label) => {
        const th = create('th', '', label);
        th.scope = 'col';
        tr.appendChild(th);
      });
      head.appendChild(tr);
      const body = create('tbody');
      for (const item of pages.slice(0, 12)) {
        const row = create('tr');
        const label = create('td', '', item.path || '/');
        label.appendChild(create('small', '', siteName(item.site)));
        row.appendChild(label);
        [
          count(item.views),
          duration(item.avgActiveSeconds),
          count(item.timedViews),
          count(item.scroll25),
          count(item.scroll50),
          count(item.scroll75),
          count(item.scroll100),
        ].forEach((value) => row.appendChild(create('td', '', value)));
        body.appendChild(row);
      }
      table.append(head, body);
      wrap.appendChild(table);
      target.appendChild(wrap);
    }
    detailRows(
      'entry-list',
      safeArray(insights.entries),
      (i) => pageLabel(i.site, i.path),
      (i) => count(i.visits),
      (i) => humanSource(i.source),
      'Entry pages will appear with new visits.',
    );
    detailRows(
      'exit-list',
      pages.filter((i) => i.exits > 0).sort((a, b) => b.exits - a.exits),
      (i) => pageLabel(i.site, i.path),
      (i) => count(i.exits) + ' exits',
      (i) => percent(i.exitRate) + ' of this page’s views in inactive visits',
      'No inactive visits with an observed exit yet.',
    );
    detailRows(
      'path-list',
      safeArray(insights.paths),
      (i) => pageLabel(i.fromSite, i.fromPath) + ' → ' + pageLabel(i.toSite, i.toPath),
      (i) => count(i.transitions),
      () => 'Observed next-page transitions',
      'Linked page navigation will appear here.',
    );
    detailRows(
      'movement-list',
      safeArray(insights.movement),
      (i) => siteName(i.fromSite) + ' → ' + siteName(i.toSite),
      (i) => count(i.arrivals) + ' arrivals',
      (i) =>
        count(i.matchedArrivals) +
        ' matched · ' +
        count(i.unmatchedArrivals) +
        ' unmatched · ' +
        count(i.clicks) +
        ' destination clicks',
      'No movement between participating sites observed yet.',
    );
    $('movement-coverage').textContent =
      count(coverage.sharedVisits) +
      ' visits with shared identifiers · ' +
      count(coverage.localVisits) +
      ' site-local visits. Matching estimates connect only these subdomains. Destination clicks and observed arrivals are independent counts.';
    detailRows(
      'content-list',
      safeArray(insights.engagement),
      (i) => contentNames[i.content] || i.content,
      (i) => count(i.opens) + ' opens',
      (i) => siteName(i.site) + ' · ' + count(i.actions) + ' primary actions',
      'Project, experiment, and tool engagement will appear here.',
    );
    detailRows(
      'outbound-list',
      safeArray(insights.outbound),
      (i) =>
        i.destinationSite
          ? pageLabel(i.destinationSite, i.destinationPath)
          : {
              email: 'Email link',
              linkedin: 'LinkedIn',
              github: 'GitHub',
              instagram: 'Instagram',
              contact: 'Contact page',
              website: 'Website',
            }[i.target] || i.target,
      (i) => count(i.clicks),
      (i) => 'Clicked from ' + siteName(i.site),
      'Relevant outbound and cross-site clicks will appear here.',
    );
  }

  function renderReport(report) {
    const totals = report.totals || {};
    $('total-pageviews').textContent = count(totals.pageviews);
    renderInsights(report.insights);
    $('total-visitors').textContent = count(totals.visitors);
    $('total-projects').textContent = count(totals.projectOpens);
    $('total-linkedin').textContent = count(totals.linkedinClicks);
    $('no-data-notice').hidden = Number(totals.pageviews) > 0 || Number(totals.visitors) > 0;
    const range = report.range || {};
    const label = [date(range.start), date(range.end)].filter(Boolean).join(' – ');
    $('chart-range').textContent = label
      ? label + ' · Pacific time'
      : 'Last ' + state.days + ' days · Pacific time';
    renderChart(safeArray(report.daily));
    renderSources(safeArray(report.sources), Number(totals.visitors) || 0);
    renderProjects(report);
    rows(
      $('page-list'),
      safeArray(report.pages),
      (item) => (item.site ? pageLabel(item.site, item.path) : item.path || '/'),
      (item) => item.views,
      'Pageviews will appear after someone explores your portfolio.',
    );
    rows(
      $('device-list'),
      safeArray(report.devices),
      (item) =>
        ({ desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet', unknown: 'Unknown' })[
          item.device
        ] ||
        item.device ||
        'Unknown',
      (item) => item.visitors,
      'Device information will appear after the first visit.',
    );
    renderCampaigns(safeArray(report.campaigns));
    $('recent-visitors').textContent =
      count(totals.recentVisitors) +
      (Number(totals.recentVisitors) === 1 ? ' visitor' : ' visitors') +
      ' with activity in the last 5 min';
    if (report.lastEventAt && !Number.isNaN(new Date(report.lastEventAt).getTime()))
      $('last-updated').textContent =
        'Last activity ' + timeFormat.format(new Date(report.lastEventAt)) + ' PT';
    else $('last-updated').textContent = 'Waiting for first activity';
  }

  function campaignName() {
    return (
      $('campaign-name')
        .value.trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || 'portfolio'
    );
  }
  function buildShareLinks() {
    const campaign = campaignName();
    const target = $('shared-links');
    target.replaceChildren();
    for (const platform of platforms) {
      const row = create('div', 'shared-link');
      const name = create('label', 'platform-name', platform.name);
      name.htmlFor = 'share-' + platform.source;
      const url = new URL(
        campaign === 'portfolio'
          ? 'https://kristiansalmeron.com/' + platform.source
          : 'https://kristiansalmeron.com/',
      );
      if (campaign !== 'portfolio') {
        url.searchParams.set('utm_source', platform.source);
        url.searchParams.set('utm_medium', platform.medium);
        url.searchParams.set('utm_campaign', campaign);
      }
      const input = create('input');
      input.id = 'share-' + platform.source;
      input.type = 'text';
      input.readOnly = true;
      input.value = url.href;
      input.setAttribute('aria-label', platform.name + ' tracking link');
      input.addEventListener('focus', () => input.select());
      const button = create('button', 'secondary-button', 'Copy');
      button.type = 'button';
      button.setAttribute('aria-label', 'Copy ' + platform.name + ' tracking link');
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(input.value);
          $('copy-status').textContent = platform.name + ' link copied.';
          button.textContent = 'Copied';
          setTimeout(() => {
            button.textContent = 'Copy';
          }, 1800);
        } catch {
          input.focus();
          input.select();
          $('copy-status').textContent =
            'The link is selected. Use your browser’s Copy command to copy it.';
        }
      });
      row.append(name, input, button);
      target.appendChild(row);
    }
  }
  $('campaign-name').addEventListener('input', buildShareLinks);
  $('campaign-name').addEventListener('blur', () => {
    $('campaign-name').value = campaignName();
  });
  buildShareLinks();

  if (typeof ResizeObserver !== 'undefined') {
    let lastWidth = 0;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width || 0;
      if (width > 0 && Math.abs(width - lastWidth) > 2) {
        lastWidth = width;
        if (state.authenticated && state.report) renderChart(safeArray(state.report.daily));
      }
    });
    observer.observe($('visitor-chart'));
  }
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) bootstrap();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.authenticated) loadReport();
  });
  setInterval(() => {
    if (state.authenticated && state.view === 'overview' && document.visibilityState === 'visible')
      loadReport();
  }, 60000);
  bootstrap();
})();
