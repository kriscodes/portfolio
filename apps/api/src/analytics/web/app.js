'use strict';

(() => {
  const API = '/api/analytics';
  const $ = (id) => document.getElementById(id);
  const demoReports = $('demo-reports');
  const themeKey = demoReports ? 'ks-insights-demo-theme' : 'ks-insights-theme';
  const state = {
    authenticated: false,
    days: '7',
    day: '',
    site: '',
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
  const projectNames = {
    careiq: 'Care IQ',
    'care-iq': 'Care IQ',
    'gen-ui': 'Medical document viewer',
    'rule-builder': 'Claims-auditing rule builder',
  };
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
    restoredTheme = localStorage.getItem(themeKey) || '';
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
      localStorage.setItem(themeKey, theme);
    } catch {}
  });

  if (!demoReports) {
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
    if (demoReports) throw new Error('Private requests are unavailable in the demo.');
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
    ['total-visitors', 'total-pageviews', 'total-visits', 'total-active'].forEach((id) => {
      $(id).textContent = '—';
    });
    ['visitor-chart', 'daily-table', 'exploration-plot', 'continuity-plot', 'site-cards'].forEach(
      (id) => $(id).replaceChildren(),
    );
    $('recent-visitors').textContent = 'Recent visitors: —';
    $('last-updated').textContent = 'Waiting for activity';
    $('chart-selection').textContent = '';
    $('no-data-notice').hidden = true;
    $('report-error').hidden = true;
    $('scope-status').hidden = true;
    $('overview-view').removeAttribute('aria-busy');
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
  $('retry-auth')?.addEventListener('click', bootstrap);

  function setFormBusy(form, busy) {
    form.setAttribute('aria-busy', String(busy));
    for (const input of form.querySelectorAll('input, button')) input.disabled = busy;
  }
  $('login-form')?.addEventListener('submit', async (event) => {
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
  $('setup-form')?.addEventListener('submit', async (event) => {
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
  $('logout')?.addEventListener('click', signOut);
  $('privacy-logout')?.addEventListener('click', signOut);

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
  const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' });
  const hourFormat = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
  const exactHour = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  });
  const dayInput = $('report-day');
  function shiftDay(value, difference) {
    const day = new Date(value + 'T12:00:00Z');
    day.setUTCDate(day.getUTCDate() + difference);
    return day.toISOString().slice(0, 10);
  }
  function updateDayControls() {
    if (!dayInput) return;
    const today = localDate.format(new Date());
    dayInput.max = today;
    dayInput.min = shiftDay(today, -179);
    if (!state.day || state.day < dayInput.min) state.day = today;
    dayInput.value = state.day;
    $('day-controls').hidden = state.days !== 'day';
    $('previous-day').disabled = state.day <= dayInput.min;
    $('next-day').disabled = state.day >= today;
  }
  function selectDay(value) {
    if (!value || value < dayInput.min || value > dayInput.max || state.day === value) return;
    state.day = value;
    state.report = null;
    updateDayControls();
    loadReport();
  }
  dayInput?.addEventListener('change', () => selectDay(dayInput.value));
  $('previous-day')?.addEventListener('click', () => selectDay(shiftDay(state.day, -1)));
  $('next-day')?.addEventListener('click', () => selectDay(shiftDay(state.day, 1)));
  const periodControls = document.querySelectorAll('[data-days]');
  periodControls.forEach((button) =>
    button.addEventListener('click', () => {
      const days = button.dataset.days;
      if (state.days === days) return;
      if (days === 'day' || state.days === 'day') state.report = null;
      state.days = days;
      periodControls.forEach((control) =>
        control.setAttribute('aria-pressed', String(control.dataset.days === days)),
      );
      updateDayControls();
      loadReport();
    }),
  );
  const siteControls = document.querySelectorAll('[data-site-scope]');
  siteControls.forEach((button) =>
    button.addEventListener('click', () => {
      const site = button.dataset.siteScope;
      if (state.site === site) return;
      state.site = site;
      state.report = null;
      siteControls.forEach((control) =>
        control.setAttribute('aria-pressed', String(control.dataset.siteScope === site)),
      );
      loadReport();
    }),
  );
  $('refresh-data')?.addEventListener('click', loadReport);

  async function loadReport() {
    if (demoReports) {
      try {
        const report = JSON.parse(demoReports.textContent)[state.days];
        if (!report) throw new Error('Sample report missing.');
        renderReport(report);
        state.report = report;
      } catch {
        $('report-error').textContent = 'The sample report could not load. Try reloading the page.';
        $('report-error').hidden = false;
      }
      return;
    }
    if (!state.authenticated) return;
    const requestId = ++state.request;
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller;
    $('refresh-data').disabled = true;
    $('overview-view').setAttribute('aria-busy', 'true');
    $('report-error').hidden = true;
    const scopeStatus = $('scope-status');
    if (!state.report) {
      $('overview-view').setAttribute('data-scope-pending', '');
      scopeStatus.textContent =
        'Loading ' + (state.site ? siteName(state.site) : 'all sites') + '…';
      scopeStatus.hidden = false;
    }
    try {
      updateDayControls();
      const params = new URLSearchParams(
        state.days === 'day' ? { date: state.day } : { days: state.days },
      );
      if (state.site) params.set('site', state.site);
      const report = await request('/overview?' + params, { signal: controller.signal });
      if (requestId !== state.request || !state.authenticated) return;
      state.report = report;
      $('overview-view').removeAttribute('data-scope-pending');
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
        scopeStatus.hidden = true;
        $('refresh-data').disabled = false;
        $('overview-view').setAttribute('aria-busy', 'false');
      }
    }
  }

  function renderChart(report) {
    const hourly = Array.isArray(report.hourly);
    const daily = hourly
      ? report.hourly.map((row) => ({ ...row, date: row.hour }))
      : safeArray(report.daily);
    const labelFor = (row, exact = false) =>
      hourly ? (exact ? exactHour : hourFormat).format(new Date(row.date)) : date(row.date);
    $('visitor-granularity').textContent = hourly
      ? 'Estimated visitors per hour'
      : 'Estimated visitors per day';
    $('visitor-details-label').textContent = hourly ? 'View hourly numbers' : 'View daily numbers';
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
          (hourly ? 'Hourly' : 'Daily') +
          ' estimated visitors. ' +
          valid.map((item) => labelFor(item, true) + ': ' + count(item.visitors)).join('; '),
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
      if (!hourly) {
        const points = valid.map((item, index) => [
          left + (index + 0.5) * step,
          top + plotHeight - (Number(item.visitors) / ceiling) * plotHeight,
        ]);
        const line = points.map(([x, y], index) => (index ? 'L' : 'M') + x + ' ' + y).join(' ');
        const base = top + plotHeight;
        chart.appendChild(
          svg('path', {
            class: 'visitor-area',
            d:
              line + ' L' + points.at(-1)[0] + ' ' + base + ' L' + points[0][0] + ' ' + base + ' Z',
          }),
        );
        chart.appendChild(svg('path', { class: 'visitor-line', d: line }));
        if (valid.length <= 7)
          points.forEach(([x, y]) =>
            chart.appendChild(
              svg('circle', {
                cx: x,
                cy: y,
                r: 3,
                class: 'metric-mark',
              }),
            ),
          );
      }
      valid.forEach((item, index) => {
        const barHeight = (Number(item.visitors) / ceiling) * plotHeight;
        const bar = svg('rect', {
          x: left + index * step + gap / 2,
          y: hourly && barHeight ? top + plotHeight - barHeight : top,
          width: Math.max(1, step - gap),
          height: hourly && barHeight ? barHeight : plotHeight,
          rx: Math.min(3, step / 5),
          class: hourly && barHeight ? 'chart-bar' : 'chart-bar chart-hit',
        });
        const title = svg('title');
        title.textContent =
          labelFor(item, true) + ': ' + count(item.visitors) + ' estimated visitors';
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
      const countTicks = hourly && width >= 360 ? 5 : 3;
      const indices = [
        ...new Set(
          Array.from({ length: countTicks }, (_, index) =>
            Math.round((index * (valid.length - 1)) / (countTicks - 1)),
          ),
        ),
      ];
      indices.forEach((index, position) => {
        const x =
          position === 0
            ? left
            : position === indices.length - 1
              ? width - right
              : left + (index + 0.5) * step;
        const label = svg('text', {
          x,
          y: height - 3,
          'text-anchor':
            position === 0 ? 'start' : position === indices.length - 1 ? 'end' : 'middle',
          class: 'chart-axis',
        });
        label.textContent = labelFor(valid[index]);
        chart.appendChild(label);
      });
      target.appendChild(chart);
    }
    const table = create('table', 'daily-data');
    const head = create('thead');
    const header = create('tr');
    [hourly ? 'Time (Pacific)' : 'Date', 'Estimated visitors'].forEach((label) => {
      const th = create('th', '', label);
      th.scope = 'col';
      header.appendChild(th);
    });
    head.appendChild(header);
    const body = create('tbody');
    for (const item of valid) {
      const row = create('tr');
      row.append(create('td', '', labelFor(item, true)), create('td', '', count(item.visitors)));
      body.appendChild(row);
    }
    table.append(head, body);
    $('daily-table').appendChild(table);
  }

  const siteNames = {
    portfolio: 'Portfolio',
    lab: 'Lab',
    toolbox: 'Toolbox',
    'careiq-web': 'CareIQ Web',
    'careiq-marketing': 'CareIQ Marketing',
  };
  const contentNames = {
    careiq: 'Care IQ',
    'care-iq': 'Care IQ',
    'gen-ui': 'Medical document viewer',
    'rule-builder': 'Claims-auditing rule builder',
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
  function renderInsights(insights = {}) {
    const coverage = insights.coverage || {};
    const totals = insights.totals || {};
    $('coverage-warning').hidden = !coverage.limited;
    $('total-visits').textContent = count(totals.visits);
    $('total-active').textContent = duration(totals.avgActiveSeconds);
    $('measurement-coverage').textContent = demoReports
      ? count(coverage.timedPageviews) +
        ' of ' +
        count(coverage.pageviews) +
        ' sample pageviews include active time'
      : insights.measurementStartedAt
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
    const visibleSites = state.site
      ? [state.site]
      : safeArray(insights.sites).map(({ site }) => site);
    for (const site of visibleSites) {
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
  }

  const rankingCharts = ['bars', 'dots', 'columns'];
  const chartNames = {
    bars: 'Horizontal bars',
    dots: 'Dot plot',
    columns: 'Vertical bars',
    flow: 'Flow diagram',
    donut: 'Donut',
  };
  const makeRows = (list, label, field) =>
    safeArray(list)
      .filter((item) => item[field] != null)
      .map((item) => ({ label: label(item), value: Number(item[field]) }));
  const labelPage = (item) =>
    state.site === item.site ? item.path : pageLabel(item.site, item.path);
  const labelContent = (item) => contentNames[item.content] || item.content;
  const labelsByTarget = {
    email: 'Email link',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    instagram: 'Instagram',
    contact: 'Contact page',
    website: 'Website',
  };
  function edgeRows(list, labelFrom, labelTo, field) {
    return safeArray(list).map((item) => {
      const from = labelFrom(item);
      const to = labelTo(item);
      return { from, to, label: from + ' → ' + to, value: Number(item[field]) };
    });
  }

  function reportMetrics(report) {
    const data = report.insights || {};
    const pages = safeArray(data.pages);
    const entries = safeArray(data.entries);
    const activity = safeArray(data.engagement);
    const visitPages = new Map();
    for (const entry of entries) {
      const label = labelPage(entry);
      visitPages.set(label, (visitPages.get(label) || 0) + entry.visits);
    }
    const crossing = (field) =>
      edgeRows(
        data.movement,
        (item) => siteName(item.fromSite),
        (item) => siteName(item.toSite),
        field,
      );
    const metric = (label, unit, rows, charts = rankingCharts, note = '', format = count) => ({
      label,
      unit,
      rows,
      charts,
      note,
      format,
    });
    const scrollMetrics = [
      ['scroll25', '25%'],
      ['scroll50', '50%'],
      ['scroll75', '75%'],
      ['scroll100', '100%'],
    ];
    const projectActions = safeArray(report.projects).flatMap((item) => {
      const title = projectNames[item.project] || item.project;
      return [
        { label: title + ' opens', value: item.opens },
        { label: title + ' previews', value: item.previews },
      ];
    });
    const devices = {
      desktop: 'Desktop',
      mobile: 'Mobile',
      tablet: 'Tablet',
      other: 'Other',
      unknown: 'Unknown',
    };
    return {
      exploration: [
        metric(
          'Average active time',
          'Active time per measured pageview',
          makeRows(pages, labelPage, 'avgActiveSeconds'),
          rankingCharts,
          'Counts visible periods with recent activity.',
          duration,
        ),
        metric(
          'Pageviews',
          'Pageviews with detailed measurement',
          makeRows(pages, labelPage, 'views'),
        ),
        metric(
          'Timed pageviews',
          'Pageviews with an active-time measurement',
          makeRows(pages, labelPage, 'timedViews'),
        ),
        metric(
          'Visits by entry page',
          'Observed visits by their first page',
          [...visitPages].map(([label, value]) => ({ label, value })),
        ),
        metric(
          'Entry pages & sources',
          'Observed visits by first page and source',
          makeRows(entries, (item) => labelPage(item) + ' · ' + humanSource(item.source), 'visits'),
        ),
        metric(
          'Last observed pages',
          'Estimated exits',
          makeRows(pages, labelPage, 'exits'),
          rankingCharts,
          'Last observed pages in visits inactive for 30 minutes.',
        ),
        metric(
          'Common next pages',
          'Observed page transitions',
          edgeRows(
            data.paths,
            (item) => labelPage({ site: item.fromSite, path: item.fromPath }),
            (item) => labelPage({ site: item.toSite, path: item.toPath }),
            'transitions',
          ),
          ['flow', 'bars', 'dots'],
        ),
        metric(
          'Movement between sites',
          'Observed arrivals',
          crossing('arrivals'),
          ['flow', 'bars', 'dots'],
          'Visit matching covers participating kristiansalmeron.com subdomains.',
        ),
        metric(
          'Matched arrivals',
          'Arrivals linked to an observed visit',
          crossing('matchedArrivals'),
          ['flow', 'bars', 'dots'],
        ),
        metric('Cross-site clicks', 'Observed destination clicks', crossing('clicks'), [
          'flow',
          'bars',
          'dots',
        ]),
        metric(
          'Scroll milestones',
          'Pageviews reaching each depth',
          scrollMetrics.map(([field, label]) => ({
            label,
            value: pages.reduce((sum, item) => sum + (Number(item[field]) || 0), 0),
          })),
          ['columns', 'bars', 'dots'],
          'Milestone counts are cumulative.',
        ),
        ...scrollMetrics.map(([field, label]) =>
          metric(
            label + ' scroll by page',
            'Pageviews reaching ' + label,
            makeRows(pages, labelPage, field),
          ),
        ),
        metric(
          'Projects, experiments & tools',
          'Content opens',
          makeRows(activity, labelContent, 'opens'),
        ),
        metric(
          'Primary content actions',
          'Intentional actions on measured content',
          makeRows(activity, labelContent, 'actions'),
        ),
        metric(
          'Outbound interest',
          'Observed link clicks',
          makeRows(
            data.outbound,
            (item) =>
              item.destinationSite
                ? pageLabel(item.destinationSite, item.destinationPath)
                : labelsByTarget[item.target] || item.target,
            'clicks',
          ),
        ),
      ],
      continuity: [
        metric(
          'Sources across all activity',
          'Estimated visitors by source',
          makeRows(report.sources, (item) => humanSource(item.source), 'visitors'),
        ),
        metric('Project & studio activity', 'Recorded actions', [
          ...projectActions,
          ...makeRows(report.sections, (item) => item.section + ' section opens', 'opens'),
        ]),
        metric(
          'Pages across all activity',
          'Pageviews by page',
          makeRows(report.pages, labelPage, 'views'),
        ),
        metric(
          'Devices',
          'Estimated visitors by device',
          makeRows(report.devices, (item) => devices[item.device] || item.device, 'visitors'),
          ['donut', 'bars', 'dots'],
        ),
        metric(
          'Shared link activity',
          'Estimated visitors by source and campaign',
          makeRows(
            report.campaigns,
            (item) => humanSource(item.source) + ' · ' + item.campaign,
            'visitors',
          ),
        ),
      ],
    };
  }

  function chartText(value, attrs) {
    const node = svg('text', { class: 'chart-axis', ...attrs });
    node.textContent = value;
    return node;
  }

  function labelLimit(label, limit) {
    return label.length > limit ? label.slice(0, limit - 1) + '…' : label;
  }

  function chartTitle(node, text) {
    const title = svg('title');
    title.textContent = text;
    node.appendChild(title);
    return node;
  }

  function rankPlot(target, rows, chart, format, maximum) {
    const list = create('ul', 'metric-ranking' + (chart === 'dots' ? ' metric-dots' : ''));
    for (const row of rows) {
      const item = create('li', 'metric-rank');
      const label = create('span', 'metric-label', row.label);
      const scale = svg('svg', {
        viewBox: '0 0 100 12',
        preserveAspectRatio: 'none',
        'aria-hidden': 'true',
      });
      const value = (row.value / maximum) * 96;
      scale.appendChild(
        svg('rect', { x: 0, y: 1, width: 100, height: 10, rx: 2, class: 'metric-track' }),
      );
      if (chart === 'dots') {
        scale.appendChild(svg('line', { x1: 0, x2: value, y1: 6, y2: 6, class: 'metric-stem' }));
        scale.appendChild(
          svg('line', { x1: value, x2: value + 3, y1: 6, y2: 6, class: 'metric-dot' }),
        );
      } else {
        scale.appendChild(
          svg('rect', { x: 0, y: 1, width: value, height: 10, rx: 2, class: 'metric-mark' }),
        );
      }
      item.append(label, scale, create('strong', 'metric-value', format(row.value)));
      list.appendChild(item);
    }
    target.appendChild(list);
  }

  function columnPlot(target, rows, format, maximum, unit) {
    const width = 420;
    const step = width / rows.length;
    const chart = svg('svg', { viewBox: '0 0 420 160', role: 'img', 'aria-label': unit });
    chart.appendChild(svg('line', { x1: 0, x2: width, y1: 128, y2: 128, class: 'chart-grid' }));
    rows.forEach((row, i) => {
      const center = (i + 0.5) * step;
      const height = (row.value / maximum) * 97;
      chart.appendChild(
        chartTitle(
          svg('rect', {
            x: center - step * 0.27,
            y: 128 - height,
            width: step * 0.54,
            height,
            class: 'metric-mark',
            rx: 3,
          }),
          row.label + ': ' + format(row.value),
        ),
      );
      chart.appendChild(
        chartText(format(row.value), { x: center, y: 122 - height, 'text-anchor': 'middle' }),
      );
      chart.appendChild(
        chartTitle(
          chartText(labelLimit(row.label, Math.max(4, Math.floor(step / 8))), {
            x: center,
            y: 147,
            'text-anchor': 'middle',
          }),
          row.label,
        ),
      );
    });
    target.appendChild(chart);
  }

  function flowPlot(target, rows, format, unit) {
    const sides = [new Map(), new Map()];
    const width = 420,
      height = 190,
      left = 130,
      right = width - left;
    for (const row of rows) {
      [row.from, row.to].forEach((key, side) =>
        sides[side].set(key, (sides[side].get(key) || 0) + row.value),
      );
    }
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const padding = 13;
    const scale =
      (height - 32 - (Math.max(...sides.map((side) => side.size)) - 1) * padding) / total;
    const middle = (left + right) / 2;
    const nodes = sides.map((side) => {
      let offset = 28;
      return new Map(
        [...side].map(([label, value]) => {
          const start = offset;
          offset += value * scale + padding;
          return [label, { start, next: start, height: value * scale }];
        }),
      );
    });
    const chart = svg('svg', {
      viewBox: '0 0 ' + width + ' ' + height,
      role: 'img',
      'aria-label':
        unit + '. ' + rows.map((row) => row.label + ': ' + format(row.value)).join('; '),
    });
    chart.append(
      chartText('From', { x: left - 6, y: 14, 'text-anchor': 'end' }),
      chartText('To', { x: right + 6, y: 14 }),
    );
    for (const row of rows) {
      const from = nodes[0].get(row.from);
      const to = nodes[1].get(row.to);
      const size = row.value * scale;
      const start = from.next + size / 2;
      const end = to.next + size / 2;
      chart.appendChild(
        chartTitle(
          svg('path', {
            d:
              'M' +
              left +
              ' ' +
              start +
              ' C' +
              middle +
              ' ' +
              start +
              ' ' +
              middle +
              ' ' +
              end +
              ' ' +
              right +
              ' ' +
              end,
            class: 'metric-flow',
            'stroke-width': size,
          }),
          row.label + ': ' + format(row.value),
        ),
      );
      from.next += size;
      to.next += size;
    }
    nodes.forEach((side, i) => {
      const x = i ? right : left - 4;
      for (const [label, node] of side) {
        chart.appendChild(
          svg('rect', { x, y: node.start, height: node.height, width: 4, class: 'metric-mark' }),
        );
        chart.appendChild(
          chartTitle(
            chartText(labelLimit(label, 17), {
              x: x + (i ? 8 : -4),
              y: node.start + node.height / 2 + 4,
              'text-anchor': i ? 'start' : 'end',
            }),
            label,
          ),
        );
      }
    });
    target.appendChild(chart);
  }

  function donutPlot(target, rows, format, unit) {
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const chart = svg('svg', { viewBox: '0 0 128 128', role: 'img', 'aria-label': unit });
    const legend = create('ul', 'metric-legend');
    const body = create('div', 'metric-donut');
    let start = 0;
    rows.forEach((row, index) => {
      const share = (row.value / total) * 100;
      const color = 'metric-series-' + (index % 5);
      chart.appendChild(
        chartTitle(
          svg('circle', {
            cx: 64,
            cy: 64,
            r: 51,
            pathLength: 100,
            'stroke-dasharray': share + ' ' + (100 - share),
            'stroke-dashoffset': -start,
            transform: 'rotate(-90 64 64)',
            class: 'metric-ring ' + color,
          }),
          row.label + ': ' + format(row.value),
        ),
      );
      const item = create('li');
      item.append(
        create('span', 'metric-swatch ' + color),
        create('span', '', row.label),
        create('strong', '', format(row.value) + ' · ' + Math.round(share) + '%'),
      );
      legend.appendChild(item);
      start += share;
    });
    body.append(chart, legend);
    target.appendChild(body);
  }

  function setSelect(control, options, selected) {
    if (
      control.options.length !== options.length ||
      options.some(([key], index) => control.options[index]?.value !== key)
    ) {
      control.replaceChildren(...options.map(([key, label]) => new Option(label, key)));
    }
    control.value = selected;
  }
  const reportSelection = {
    exploration: { metric: '0', chart: '' },
    continuity: { metric: '0', chart: '' },
  };

  function drawReports(report) {
    for (const [group, metrics] of Object.entries(reportMetrics(report))) {
      const selection = reportSelection[group];
      const metric = metrics[Number(selection.metric)] || metrics[0];
      const chart = metric.charts.includes(selection.chart) ? selection.chart : metric.charts[0];
      setSelect(
        $(group + '-metric'),
        metrics.map((item, index) => [String(index), item.label]),
        selection.metric,
      );
      setSelect(
        $(group + '-chart'),
        metric.charts.map((key) => [key, chartNames[key]]),
        chart,
      );
      $(group + '-unit').textContent = metric.unit;
      const note = $(group + '-note');
      note.hidden = !metric.note;
      note.textContent = metric.note;
      const target = $(group + '-plot');
      const positive = metric.rows.filter((row) => Number.isFinite(row.value) && row.value > 0);
      const rows = (
        metric.label === 'Scroll milestones'
          ? metric.rows
          : positive.sort((a, b) => b.value - a.value)
      ).slice(0, chart === 'flow' ? 7 : chart === 'columns' ? 8 : 12);
      target.replaceChildren();
      if (!positive.length) {
        empty(target, 'No measurements for this metric in the selected period.');
        continue;
      }
      const maximum = Math.max(...rows.map((row) => row.value));
      if (chart === 'flow') flowPlot(target, rows, metric.format, metric.unit);
      else if (chart === 'donut') donutPlot(target, rows, metric.format, metric.unit);
      else if (chart === 'columns') columnPlot(target, rows, metric.format, maximum, metric.unit);
      else rankPlot(target, rows, chart, metric.format, maximum);
    }
  }

  for (const [group, selection] of Object.entries(reportSelection)) {
    $(group + '-metric').addEventListener('change', (event) => {
      selection.metric = event.target.value;
      selection.chart = '';
      if (state.report) drawReports(state.report);
    });
    $(group + '-chart').addEventListener('change', (event) => {
      selection.chart = event.target.value;
      if (state.report) drawReports(state.report);
    });
  }

  function renderReport(report) {
    const totals = report.totals || {};
    $('total-pageviews').textContent = count(totals.pageviews);
    renderInsights(report.insights);
    $('total-visitors').textContent = count(totals.visitors);
    const range = report.range || {};
    const label = [...new Set([date(range.start), date(range.end)].filter(Boolean))].join(' – ');
    $('chart-range').textContent = (label || 'Selected period') + ' · Pacific time';
    renderChart(report);
    drawReports(report);
    if (demoReports) return;

    const measurement = $('site-measurement');
    measurement.textContent = state.site === 'careiq-web' ? 'App entry pageviews only' : '';
    measurement.hidden = !measurement.textContent;
    const noData = !(Number(totals.pageviews) > 0 || Number(totals.visitors) > 0);
    $('no-data-notice').hidden = !noData;
    if (noData) {
      $('no-data-heading').textContent = state.site
        ? 'No traffic for ' + siteName(state.site) + ' in this range.'
        : 'Your studio is ready for its first visitor.';
      $('no-data-help').textContent = state.site
        ? 'Activity appears here when someone visits with analytics enabled.'
        : 'Share a tagged link from Shared links. Activity will appear here after someone visits with tracking enabled.';
    }
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
  $('campaign-name')?.addEventListener('input', buildShareLinks);
  $('campaign-name')?.addEventListener('blur', () => {
    $('campaign-name').value = campaignName();
  });
  if (!demoReports) buildShareLinks();

  if (typeof ResizeObserver !== 'undefined') {
    let lastWidth = 0;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width || 0;
      if (width > 0 && Math.abs(width - lastWidth) > 2) {
        lastWidth = width;
        if (state.report) renderChart(state.report);
      }
    });
    observer.observe($('visitor-chart'));
  }
  if (demoReports) {
    loadReport();
  } else {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) bootstrap();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.authenticated) loadReport();
    });
    setInterval(() => {
      if (
        state.authenticated &&
        state.view === 'overview' &&
        document.visibilityState === 'visible'
      )
        loadReport();
    }, 60000);
    bootstrap();
  }
})();
