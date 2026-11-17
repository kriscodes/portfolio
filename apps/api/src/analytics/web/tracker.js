/* Studio Insights: first-party, bounded measurement. No input values or precise scroll positions. */
'use strict';

(() => {
  const DAY_MS = 86_400_000;
  const VISIT_MS = 30 * 60_000;
  const IDLE_MS = 60_000;
  const ID = /^[A-Za-z0-9_-]{16,96}$/;
  const KEYS = {
    preference: 'ks_analytics_opt_out',
    visitor: 'ks_insights_visitor_v2',
    session: 'ks_insights_session_v2',
    outbox: 'ks_insights_outbox_v2',
    previous: 'ks_insights_previous_v2',
  };
  const HOSTS = {
    'kristiansalmeron.com': 'portfolio',
    'www.kristiansalmeron.com': 'portfolio',
    'lab.kristiansalmeron.com': 'lab',
    'toolbox.kristiansalmeron.com': 'toolbox',
  };
  const PATHS = {
    portfolio: new Set([
      '/',
      '/work/',
      '/work/care-iq/',
      '/work/gen-ui/',
      '/about/',
      '/contact/',
      '/field-notes/',
      '/field-notes/the-boundary-is-the-feature/',
      '/field-notes/leave-room-for-the-unknown/',
      '/privacy/',
    ]),
    lab: new Set([
      '/',
      '/experiments/',
      '/experiments/pdf-rendering/',
      '/methodology/',
      '/privacy/',
    ]),
    toolbox: new Set(['/', '/tools/prompt-builder/', '/privacy/']),
  };
  const EVENTS = new Set([
    'pageview',
    'page_engagement',
    'scroll_depth',
    'project_open',
    'project_preview_open',
    'studio_section_open',
    'outbound_click',
    'studio_ready',
    'studio_fallback',
    'experiment_open',
    'tool_open',
    'tool_action',
  ]);
  const SOURCES = new Set([
    'facebook',
    'instagram',
    'linkedin',
    'tiktok',
    'whatsapp',
    'github',
    'google',
    'bing',
    'duckduckgo',
    'direct',
    'unknown',
    'referral',
    'other',
  ]);
  const MEDIA = new Set(['social', 'messaging', 'organic', 'direct', 'unknown', 'referral']);
  const CAMPAIGNS = new Set(['portfolio', 'bio', 'launch', 'winter-update']);
  const SOURCES_BY_HOST = {
    'facebook.com': 'facebook',
    'fb.com': 'facebook',
    'instagram.com': 'instagram',
    'linkedin.com': 'linkedin',
    'tiktok.com': 'tiktok',
    'whatsapp.com': 'whatsapp',
    'wa.me': 'whatsapp',
    'github.com': 'github',
    'google.com': 'google',
    'bing.com': 'bing',
    'duckduckgo.com': 'duckduckgo',
  };
  const PROPS = {
    project: new Set(['careiq', 'care-iq', 'gen-ui', 'neon-drift']),
    section: new Set(['work', 'about', 'life']),
    target: new Set([
      'linkedin',
      'instagram',
      'github',
      'website',
      'email',
      'portfolio',
      'lab',
      'toolbox',
    ]),
    mode: new Set(['day', 'night', '2d', '3d']),
    content: new Set(['pdf-rendering', 'prompt-builder']),
    action: new Set(['generate']),
    destinationSite: new Set(['portfolio', 'lab', 'toolbox']),
  };
  const dayFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const day = (now) => dayFormat.format(now);
  const parse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };
  const read = (storage, key) => {
    try {
      return storage?.getItem(key) || null;
    } catch {
      return null;
    }
  };
  function write(storage, key, value) {
    try {
      if (value === null) storage?.removeItem(key);
      else storage?.setItem(key, value);
    } catch {}
  }
  function safePath(site, value) {
    let path = typeof value === 'string' ? value.split(/[?#]/, 1)[0].toLowerCase() : '/unknown/';
    if (!path.endsWith('/')) path += '/';
    return PATHS[site]?.has(path) ? path : '/unknown/';
  }
  function referral(value) {
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol)) return { source: 'unknown', host: '' };
      if (HOSTS[url.hostname]) return { source: 'referral', host: url.hostname };
      for (const [host, source] of Object.entries(SOURCES_BY_HOST)) {
        if (url.hostname === host || url.hostname.endsWith('.' + host)) return { source, host };
      }
      return { source: 'referral', host: '' };
    } catch {
      return { source: 'unknown', host: '' };
    }
  }
  function attribution(url, referrer) {
    const ref = referral(referrer);
    const sourceTag = url.searchParams.get('utm_source');
    const source = ['facebook', 'instagram', 'linkedin', 'tiktok', 'whatsapp', 'github'].includes(
      sourceTag,
    )
      ? sourceTag
      : ref.source;
    const medium = ['unknown', 'referral'].includes(source)
      ? source
      : source === 'whatsapp'
        ? 'messaging'
        : ['google', 'bing', 'duckduckgo'].includes(source)
          ? 'organic'
          : 'social';
    return {
      source,
      medium,
      campaign: CAMPAIGNS.has(url.searchParams.get('utm_campaign'))
        ? url.searchParams.get('utm_campaign')
        : '',
    };
  }
  function properties(value) {
    const result = {};
    for (const [key, allowed] of Object.entries(PROPS)) {
      if (allowed.has(value?.[key])) result[key] = value[key];
    }
    if (result.destinationSite)
      result.destinationPath = safePath(result.destinationSite, value.destinationPath);
    return result;
  }
  function sanitize(value) {
    if (
      !value ||
      typeof value !== 'object' ||
      !EVENTS.has(value.event) ||
      !ID.test(value.eventId) ||
      !ID.test(value.visitorId) ||
      !ID.test(value.sessionId) ||
      typeof value.occurredAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.occurredAt) ||
      !Number.isFinite(Date.parse(value.occurredAt))
    )
      return null;
    const legacy = value.schemaVersion !== 2;
    const site = legacy ? 'portfolio' : value.site;
    if (
      !PATHS[site] ||
      (!legacy && (!ID.test(value.pageId) || !['shared', 'local'].includes(value.visitScope)))
    )
      return null;
    const result = {
      ...properties(value),
      event: value.event,
      eventId: value.eventId,
      visitorId: value.visitorId,
      sessionId: value.sessionId,
      occurredAt: value.occurredAt,
      path: safePath(site, value.path),
      source: SOURCES.has(value.source) ? value.source : 'unknown',
      medium: MEDIA.has(value.medium) ? value.medium : 'unknown',
      campaign: CAMPAIGNS.has(value.campaign) ? value.campaign : '',
      referrer: referral('https://' + value.referrer).host,
    };
    if (!legacy) {
      Object.assign(result, {
        schemaVersion: 2,
        site,
        pageId: value.pageId,
        visitScope: value.visitScope,
      });
      if (ID.test(value.previousPageId)) result.previousPageId = value.previousPageId;
      if (value.event === 'page_engagement' && Number.isInteger(value.activeMs))
        result.activeMs = Math.max(0, Math.min(DAY_MS, value.activeMs));
      if ([25, 50, 75, 100].includes(value.scrollDepth)) result.scrollDepth = value.scrollDepth;
    }
    return result;
  }

  /** Durable, bounded and idempotent; only HTTP 204 acknowledges collection. */
  function createOutbox(env) {
    let queue = [],
      timer = null,
      draining = false,
      failures = 0;
    const acknowledged = new Set(),
      inFlight = new Set();
    const persisted = () => {
      const result = [];
      for (const key of [KEYS.outbox, 'ks_analytics_outbox_v1']) {
        const raw = read(env.local, key);
        const stored = raw && raw.length < 256_000 ? parse(raw) : null;
        for (const entry of Array.isArray(stored?.events) ? stored.events.slice(-100) : []) {
          const payload = sanitize(entry?.payload);
          if (
            payload &&
            !acknowledged.has(payload.eventId) &&
            env.now() - Date.parse(payload.occurredAt) <= DAY_MS &&
            Date.parse(payload.occurredAt) <= env.now() + 300_000
          ) {
            result.push({
              payload,
              attempts: Math.min(20, Math.max(0, Number(entry.attempts) || 0)),
              nextAttemptAt: Math.min(env.now() + 90_000, Number(entry.nextAttemptAt) || env.now()),
            });
          }
        }
      }
      return result;
    };
    function merge() {
      const combined = new Map();
      for (const entry of [...persisted(), ...queue]) {
        if (
          !acknowledged.has(entry.payload.eventId) &&
          env.now() - Date.parse(entry.payload.occurredAt) <= DAY_MS
        )
          combined.set(entry.payload.eventId, entry);
      }
      queue = [...combined.values()].slice(-100);
    }
    function persist() {
      write(
        env.local,
        KEYS.outbox,
        queue.length ? JSON.stringify({ version: 2, events: queue }) : null,
      );
      write(env.local, 'ks_analytics_outbox_v1', null);
    }
    function clear() {
      if (timer !== null) env.clearTimer(timer);
      timer = null;
      queue = [];
      failures = 0;
      persist();
    }
    function allowed() {
      if (env.allowed()) return true;
      clear();
      return false;
    }
    function schedule(delay) {
      if (timer !== null) env.clearTimer(timer);
      timer = env.setTimer(() => {
        timer = null;
        void drain();
      }, delay);
    }
    function remove(id) {
      acknowledged.add(id);
      if (acknowledged.size > 300) acknowledged.delete(acknowledged.values().next().value);
      merge();
      queue = queue.filter((entry) => entry.payload.eventId !== id);
      persist();
    }
    async function deliver(entry) {
      if (!allowed()) return { status: 204 };
      inFlight.add(entry.payload.eventId);
      try {
        return await env.send(entry.payload);
      } catch {
        return { status: 0 };
      } finally {
        inFlight.delete(entry.payload.eventId);
      }
    }
    const done = (status) => [204, 400, 403, 404, 405, 413, 415, 422].includes(status);
    async function drain() {
      if (draining || !allowed() || failures >= 8) return;
      merge();
      draining = true;
      try {
        let sent = 0;
        while (queue.length && sent < 20 && allowed()) {
          const entry = queue[0];
          if (entry.nextAttemptAt > env.now()) {
            schedule(entry.nextAttemptAt - env.now());
            break;
          }
          if (inFlight.has(entry.payload.eventId)) {
            schedule(500);
            break;
          }
          const response = await deliver(entry);
          if (!allowed()) break;
          if (done(response.status)) {
            remove(entry.payload.eventId);
            failures = 0;
            sent++;
            continue;
          }
          failures++;
          entry.attempts++;
          const delay = Math.min(30_000, 2000 * 2 ** Math.min(entry.attempts - 1, 4));
          const retryAfter = /^\d+$/.test(response.retryAfter || '')
            ? Number(response.retryAfter) * 1000
            : 0;
          entry.nextAttemptAt = env.now() + Math.max(delay, Math.min(90_000, retryAfter));
          persist();
          if (failures < 8) schedule(entry.nextAttemptAt - env.now());
          break;
        }
        if (sent === 20 && queue.length) schedule(100);
        if (!queue.length) persist();
      } finally {
        draining = false;
      }
    }
    return {
      enqueue(value) {
        if (!allowed()) return;
        const payload = sanitize(value);
        if (!payload) return;
        merge();
        if (!queue.some((entry) => entry.payload.eventId === payload.eventId))
          queue.push({ payload, attempts: 0, nextAttemptAt: env.now() });
        queue = queue.slice(-100);
        persist();
        void drain();
      },
      wake() {
        if (!allowed()) return;
        failures = 0;
        void drain();
      },
      flush() {
        if (!allowed()) return;
        merge();
        for (const entry of queue.filter((item) => !inFlight.has(item.payload.eventId)).slice(-10))
          void deliver(entry).then((response) => {
            if (allowed() && done(response.status)) remove(entry.payload.eventId);
          });
      },
      clear,
    };
  }

  function createTracker(env) {
    let visitor = null,
      session = null,
      page = null,
      visible = env.visible();
    let lastTick = env.now(),
      lastInteraction = env.now(),
      stopped = false;
    let shared = false,
      notice = null,
      lastSentActive = -1;
    let midnightDay = '',
      midnightAt = 0,
      appliedTag = '',
      lastCookieRefresh = 0;
    const recent = new Map();
    const url = new URL(env.location());
    const preference = url.searchParams.get('analytics_opt_out');
    const transientOptOut = preference === '1';
    if (preference === '1' || preference === '0') {
      env.cookie(KEYS.preference, preference, 365 * 86400);
      write(env.local, KEYS.preference, preference === '1' ? 'true' : 'false');
      url.searchParams.delete('analytics_opt_out');
      env.replaceUrl(url.pathname + url.search + url.hash);
      const sharedPreference = env.cookie(KEYS.preference);
      if (preference === '1')
        notice =
          sharedPreference === '1'
            ? 'Analytics is off for this browser on participating Studio sites.'
            : read(env.local, KEYS.preference) === 'true'
              ? 'Analytics is off on this site. This browser could not share the preference; set it separately on each Studio site.'
              : 'Analytics is off for this page. This browser blocked preference storage, so repeat this choice after navigation.';
      else
        notice =
          sharedPreference === '1'
            ? 'Analytics remains off. This browser could not update the shared preference cookie.'
            : 'Analytics is allowed here. Do Not Track and Global Privacy Control still take priority. Browser storage restrictions can require setting the preference on each site.';
    }
    // An old readable "allow" cookie must not override a new exclusion when its update was blocked.
    const documentOptOut = transientOptOut && env.cookie(KEYS.preference) !== '1';
    function clearIdentity() {
      visitor = null;
      session = null;
      page = null;
      for (const key of [
        KEYS.visitor,
        KEYS.session,
        KEYS.previous,
        'ks_analytics_visitor_v1',
        'ks_analytics_session_v1',
      ]) {
        write(env.local, key, null);
        write(env.session, key, null);
      }
      env.cookie(KEYS.visitor, '', 0);
      env.cookie(KEYS.session, '', 0);
    }
    function enabled() {
      const cookie = env.cookie(KEYS.preference);
      const localOptOut = read(env.local, KEYS.preference) === 'true';
      // A shared explicit choice supersedes stale per-origin preferences.
      if (cookie === '0' && localOptOut && !documentOptOut) write(env.local, KEYS.preference, null);
      if (cookie === null && localOptOut) env.cookie(KEYS.preference, '1', 365 * 86400);
      const privacy = env.privacy();
      const allowed =
        !documentOptOut &&
        cookie !== '1' &&
        !(cookie !== '0' && (localOptOut || transientOptOut)) &&
        !privacy.globalPrivacyControl &&
        !['1', 'yes'].includes(privacy.doNotTrack);
      if (!allowed) clearIdentity();
      return allowed;
    }
    function untilMidnight(now) {
      if (midnightDay === day(now)) return Math.max(1, Math.floor((midnightAt - now) / 1000));
      // Pacific days vary at DST transitions. Binary search the next date boundary.
      let low = now,
        high = now + 26 * 3600_000;
      while (high - low > 1000) {
        const middle = Math.floor((low + high) / 2);
        if (day(middle) === day(now)) low = middle;
        else high = middle;
      }
      midnightDay = day(now);
      midnightAt = high;
      return Math.max(1, Math.floor((high - now) / 1000));
    }
    function identity(now) {
      const today = day(now);
      const savedVisitor = parse(env.cookie(KEYS.visitor));
      shared = !!(savedVisitor?.day === today && ID.test(savedVisitor.id));
      if (shared) visitor = savedVisitor;
      if (!visitor || visitor.day !== today) {
        const saved = parse(read(env.local, KEYS.visitor));
        visitor =
          saved?.day === today && ID.test(saved.id) ? saved : { day: today, id: env.randomId() };
        env.cookie(KEYS.visitor, JSON.stringify(visitor), untilMidnight(now));
        shared = parse(env.cookie(KEYS.visitor))?.id === visitor.id;
        if (!shared) write(env.local, KEYS.visitor, JSON.stringify(visitor));
      }
      const savedSession = shared
        ? parse(env.cookie(KEYS.session))
        : parse(read(env.session, KEYS.session));
      const valid = (value) =>
        value?.day === today &&
        ID.test(value.id) &&
        typeof value.updatedAt === 'number' &&
        now >= value.updatedAt &&
        now - value.updatedAt < VISIT_MS &&
        SOURCES.has(value.source) &&
        MEDIA.has(value.medium) &&
        (value.campaign === '' || CAMPAIGNS.has(value.campaign));
      if (valid(savedSession)) session = savedSession;
      const currentUrl = new URL(env.location());
      const incoming = attribution(currentUrl, env.referrer());
      const tagged = ['facebook', 'instagram', 'linkedin', 'tiktok', 'whatsapp', 'github'].includes(
        currentUrl.searchParams.get('utm_source'),
      );
      const tag = tagged
        ? [safePath(env.site, currentUrl.pathname), incoming.source, incoming.campaign].join(':')
        : '';
      const changedTag =
        tagged &&
        tag !== appliedTag &&
        session &&
        (incoming.source !== session.source || incoming.campaign !== session.campaign);
      if (tagged) appliedTag = tag;
      if (!valid(session) || changedTag)
        session = { ...incoming, id: env.randomId(), day: today, updatedAt: now };
      session.updatedAt = now;
      if (shared && (savedSession?.id !== session.id || now - lastCookieRefresh >= 15_000)) {
        env.cookie(KEYS.session, JSON.stringify(session), Math.min(1800, untilMidnight(now)));
        lastCookieRefresh = now;
      } else if (!shared) write(env.session, KEYS.session, JSON.stringify(session));
      return {
        visitorId: visitor.id,
        sessionId: session.id,
        visitScope: shared ? 'shared' : 'local',
        source: session.source,
        medium: session.medium,
        campaign: session.campaign,
      };
    }
    function send(event, props = {}, now = env.now()) {
      if (!page || !enabled()) return;
      env.send({
        ...page.identity,
        ...properties(props),
        schemaVersion: 2,
        site: env.site,
        event,
        eventId: env.randomId(),
        occurredAt: new Date(now).toISOString(),
        path: page.path,
        pageId: page.id,
        previousPageId: page.previousId || undefined,
        referrer: page.referrer,
        ...(event === 'page_engagement' ? { activeMs: Math.round(page.activeMs) } : {}),
        ...([25, 50, 75, 100].includes(props.scrollDepth)
          ? { scrollDepth: props.scrollDepth }
          : {}),
      });
    }
    function accrue(now) {
      const elapsed = now - lastTick;
      if (page && day(now) === page.day && visible && !stopped && elapsed >= 0 && elapsed <= 20_000)
        page.activeMs = Math.min(
          DAY_MS,
          page.activeMs + Math.max(0, Math.min(now, lastInteraction + IDLE_MS) - lastTick),
        );
      if (page && day(now) === page.day) page.lastRecordedAt = now;
      lastTick = now;
    }
    function flush() {
      if (!enabled()) return;
      accrue(env.now());
      if (page && page.activeMs !== lastSentActive) {
        send('page_engagement', {}, page.lastRecordedAt);
        lastSentActive = page?.activeMs ?? -1;
      }
    }
    function pageview(restored = false) {
      if (!enabled()) return;
      const path = safePath(env.site, new URL(env.location()).pathname);
      if (path === '/privacy/') {
        flush();
        page = null;
        return;
      }
      const now = env.now(),
        ident = identity(now);
      if (!restored && page?.path === path && page.identity.sessionId === ident.sessionId) return;
      flush();
      let previous =
        page && !restored
          ? { id: page.id, session: page.identity.sessionId, at: now }
          : parse(read(env.session, KEYS.previous));
      // The rotating visit ID bounds this link; a page may be actively read for over 30 minutes.
      if (previous?.session !== ident.sessionId || previous.at > now) previous = null;
      page = {
        id: env.randomId(),
        previousId: previous && ID.test(previous.id) ? previous.id : '',
        path,
        identity: ident,
        day: day(now),
        lastRecordedAt: now,
        activeMs: 0,
        milestones: new Set(),
        referrer: referral(env.referrer()).host,
      };
      lastTick = now;
      lastInteraction = now;
      lastSentActive = -1;
      stopped = false;
      write(
        env.session,
        KEYS.previous,
        JSON.stringify({ id: page.id, session: ident.sessionId, at: now }),
      );
      send('pageview');
      if (path === '/work/care-iq/') send('project_open', { project: 'careiq' });
      if (path === '/work/gen-ui/') send('project_open', { project: 'gen-ui' });
      if (path === '/experiments/pdf-rendering/' && env.site === 'lab')
        send('experiment_open', { content: 'pdf-rendering' });
      if (path === '/tools/prompt-builder/' && env.site === 'toolbox')
        send('tool_open', { content: 'prompt-builder' });
      if (env.site === 'portfolio' && path === '/work/')
        send('studio_section_open', { section: 'work' });
      if (env.site === 'portfolio' && path === '/about/')
        send('studio_section_open', { section: 'about' });
    }
    function activity() {
      if (!enabled()) return;
      accrue(env.now());
      pageview();
      lastInteraction = env.now();
      stopped = false;
    }
    return {
      notice,
      isEnabled: enabled,
      pageview: () => pageview(),
      restore: () => pageview(true),
      track(event, props = {}) {
        if (!EVENTS.has(event) || ['pageview', 'page_engagement', 'scroll_depth'].includes(event))
          return;
        activity();
        const key = JSON.stringify([event, page?.id, properties(props)]),
          now = env.now();
        if (now - (recent.get(key) ?? -Infinity) < 700) return;
        recent.set(key, now);
        if (recent.size > 100) recent.delete(recent.keys().next().value);
        send(event, props);
      },
      activity,
      tick() {
        if (!enabled()) return;
        // A suspended/background timer must not extend an old visit.
        if (visible && !stopped && env.now() - lastInteraction < IDLE_MS) pageview();
        flush();
      },
      visibility(value) {
        flush();
        visible = value;
        lastTick = env.now();
        if (value) activity();
      },
      pagehide() {
        flush();
        stopped = true;
      },
      scroll(top, viewport, height) {
        activity();
        if (!page || !visible || height <= viewport || top <= 0) return;
        const depth =
          top + viewport >= height - 2 ? 100 : Math.floor(((top + viewport) / height) * 100);
        for (const milestone of [25, 50, 75, 100]) {
          if (depth >= milestone && !page.milestones.has(milestone)) {
            page.milestones.add(milestone);
            send('scroll_depth', { scrollDepth: milestone });
          }
        }
      },
    };
  }

  function outbound(href, currentSite) {
    try {
      const url = new URL(href);
      if (url.protocol === 'mailto:') return { target: 'email' };
      if (!['https:', 'http:'].includes(url.protocol)) return null;
      const site = HOSTS[url.hostname];
      if (site && site !== currentSite)
        return {
          target: site,
          destinationSite: site,
          destinationPath: safePath(site, url.pathname),
        };
      const source = referral(href).source;
      return ['linkedin', 'instagram', 'github'].includes(source) ? { target: source } : null;
    } catch {
      return null;
    }
  }

  function start(window, document) {
    if (window.StudioInsights) return;
    const script = document.querySelector('script[data-site][src*="/analytics-assets/tracker.js"]');
    const local = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const site = HOSTS[window.location.hostname] || (local && script?.dataset.site);
    if (!PATHS[site]) return;
    const endpoint = new URL(
      '/api/analytics/collect',
      script?.src || 'https://analytics.kristiansalmeron.com',
    ).href;
    let localStorage, sessionStorage;
    try {
      localStorage = window.localStorage;
    } catch {}
    try {
      sessionStorage = window.sessionStorage;
    } catch {}
    const cookie = (name, value, maxAge) => {
      try {
        if (value !== undefined) {
          if (!HOSTS[window.location.hostname] || window.location.protocol !== 'https:')
            return null;
          document.cookie =
            name +
            '=' +
            encodeURIComponent(value) +
            '; Path=/; Domain=kristiansalmeron.com; Secure; SameSite=Lax; Max-Age=' +
            maxAge;
        }
        const part = document.cookie.split('; ').find((item) => item.startsWith(name + '='));
        return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
      } catch {
        return null;
      }
    };
    let tracker;
    const outbox = createOutbox({
      local: localStorage,
      now: Date.now,
      allowed: () => tracker?.isEnabled() ?? false,
      setTimer: (fn, ms) => window.setTimeout(fn, ms),
      clearTimer: (id) => window.clearTimeout(id),
      send: async (payload) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20_000);
        try {
          const response = await window.fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            keepalive: true,
            referrerPolicy: 'no-referrer',
            signal: controller.signal,
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify(payload),
          });
          return { status: response.status, retryAfter: response.headers.get('Retry-After') };
        } finally {
          window.clearTimeout(timeout);
        }
      },
    });
    tracker = createTracker({
      site,
      local: localStorage,
      session: sessionStorage,
      cookie,
      location: () => window.location.href,
      referrer: () => document.referrer,
      now: Date.now,
      randomId: () => window.crypto.randomUUID(),
      visible: () => !document.hidden,
      privacy: () => ({
        globalPrivacyControl: window.navigator.globalPrivacyControl,
        doNotTrack: window.navigator.doNotTrack,
      }),
      replaceUrl: (url) => window.history.replaceState(window.history.state, '', url),
      send: (payload) => outbox.enqueue(payload),
    });
    window.StudioInsights = {
      track: tracker.track,
      pageview: tracker.pageview,
      isEnabled: tracker.isEnabled,
      notice: tracker.notice,
    };
    const safely =
      (fn) =>
      (...args) => {
        try {
          fn(...args);
        } catch {}
      };
    const pageview = safely(tracker.pageview);
    for (const method of ['pushState', 'replaceState']) {
      const original = window.history[method];
      window.history[method] = function (...args) {
        const result = original.apply(this, args);
        window.setTimeout(pageview, 0);
        return result;
      };
    }
    window.addEventListener('popstate', pageview);
    window.addEventListener(
      'pageshow',
      safely((event) => {
        if (event.persisted) tracker.restore();
        tracker.visibility(!document.hidden);
        outbox.wake();
      }),
    );
    window.addEventListener(
      'pagehide',
      safely(() => {
        tracker.pagehide();
        outbox.flush();
      }),
    );
    window.addEventListener(
      'online',
      safely(() => outbox.wake()),
    );
    window.addEventListener(
      'storage',
      safely(() => outbox.wake()),
    );
    document.addEventListener(
      'visibilitychange',
      safely(() => {
        tracker.visibility(!document.hidden);
        if (document.hidden) outbox.flush();
        else outbox.wake();
      }),
    );
    for (const event of ['pointerdown', 'keydown', 'touchstart'])
      document.addEventListener(event, safely(tracker.activity), { passive: true });
    let lastScroll = 0;
    document.addEventListener(
      'scroll',
      safely(() => {
        if (Date.now() - lastScroll < 250) return;
        lastScroll = Date.now();
        tracker.scroll(window.scrollY, window.innerHeight, document.documentElement.scrollHeight);
      }),
      { passive: true },
    );
    const clicked = safely((event) => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      const link = event.target instanceof window.Element ? event.target.closest('a[href]') : null;
      const props = link && outbound(link.href, site);
      if (props) tracker.track('outbound_click', props);
    });
    document.addEventListener('click', clicked, { capture: true });
    document.addEventListener('auxclick', clicked, { capture: true });
    window.setInterval(
      safely(() => {
        tracker.tick();
        outbox.wake();
      }),
      15_000,
    );
    pageview();
    outbox.wake();
    window.dispatchEvent(new CustomEvent('studio-insights-ready'));
    if (tracker.notice) {
      const aside = document.createElement('aside');
      aside.setAttribute('role', 'status');
      aside.setAttribute('aria-label', 'Analytics preference');
      aside.className = 'studio-insights-preference';
      const message = document.createElement('p');
      message.textContent = tracker.notice;
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.textContent = 'Dismiss';
      dismiss.addEventListener('click', () => aside.remove());
      aside.append(message, dismiss);
      document.body.prepend(aside);
    }
  }
  // The same dependency-free source is exercised in a VM by the Node test suite.
  if (typeof module !== 'undefined' && module.exports)
    module.exports = {
      createTracker,
      createOutbox,
      sanitize,
      safePath,
      outbound,
      attribution,
      day,
      KEYS,
    };
  else if (typeof window !== 'undefined') {
    try {
      start(window, document);
    } catch {}
  }
})();
