import { KRISTIAN_ABOUT, KRISTIAN_PROJECTS } from './data';
import { paintKristianProjectPreview } from './scene/painters';
import { mountProjectPreview } from './projects';
import { readStudioState, saveStudioState } from './state';

/**
 * @param {HTMLElement} root
 * @param {(state: import('./state').StudioModelState) => void} onStateChange
 */
export function createControllerRuntime(root, onStateChange = () => {}) {
  const lifetime = new AbortController();
  let disposed = false;
  function listen(target, name, handler) {
    target.addEventListener(name, handler, { signal: lifetime.signal });
  }
  function setKristianLogo(root, direction = 'streetplate') {
    const brand = root && root.querySelector('.kd-brand');
    if (!brand) return false;
    const type = direction === 'switchback' ? 'switchback' : 'streetplate';
    if (brand.dataset.logo === type) return type;
    brand.dataset.logo = type;
    brand.setAttribute('aria-label', 'Kristian Salmeron — return to the overview');
    brand.innerHTML =
      type === 'streetplate'
        ? '<span class="kd-nameplate" aria-hidden="true"><span class="kd-first">KRISTIAN</span><strong class="kd-last">SALMERON</strong><i class="kd-bolt"></i></span>'
        : '<span class="kd-switchback-lockup" aria-hidden="true"><i class="kd-switchback"></i><span class="kd-switchback-name"><span class="kd-first">KRISTIAN</span><strong class="kd-last">Salmeron</strong></span></span>';
    return type;
  }

  const toggle = root.querySelector('.kd-theme'),
    status = root.querySelector('.kd-mode-status'),
    cameraNav = root.querySelector('.kd-camera-nav'),
    signNav = root.querySelector('.kd-scene-navigation'),
    viewStatus = root.querySelector('.kd-camera-status');
  const monitorUI = root.querySelector('#kd-project-monitor'),
    projectIndex = monitorUI.querySelector('.kd-project-index'),
    projectRuntime = monitorUI.querySelector('.kd-project-runtime');
  const sailingActions = root.querySelector('.kd-sailing-actions');
  const lifeNav = root.querySelector('.kd-life-navigation'),
    lifeMapControls = root.querySelector('.kd-life-map-controls'),
    lifeBack = root.querySelector('.kd-life-back'),
    lifeStatus = root.querySelector('.kd-life-status');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const settings = { duration: 1700, angle: 0, logo: 'streetplate' };
  setKristianLogo(root, settings.logo);
  let mode = 'night',
    progress = 1,
    scene = null,
    animation = 0,
    activeSection = null,
    lastOpener = null;
  let cameraSettled = true,
    monitorLayout = null,
    projectState = { selected: null, collection: 'work' },
    projectFocusPending = false,
    projectIndexTabHeight = 88;
  let lifeControlFocusPending = null;
  let lifeLayout = null,
    lifeFocusKey = null,
    lifePlaying = !reduced.matches,
    lifeDirection = 1;
  const projectRuntimes = new Map();
  const pendingRuntimes = new Set();
  const views = {
    work: 'Work — studio monitor',
    life: 'Life — sailing display',
    about: 'About — entrance terminal',
  };
  function syncSceneChrome() {
    const section = activeSection || 'overview';
    let label = 'Corner Studio',
      detail = 'Overview';
    if (section === 'work') {
      label = 'Work';
      detail =
        KRISTIAN_PROJECTS.find((item) => item.id === projectState.selected)?.title ||
        (projectState.collection === 'experiments' ? 'Experiments' : 'Projects');
      root.querySelector('.kd-footer-hint').textContent = projectState.selected
        ? 'Explore the project on the monitor'
        : 'Choose a project on the monitor';
    } else if (section === 'life') {
      label = 'Life';
      detail =
        { boat: 'Sailboat', map: 'Catalina crossing', outside: 'Outside' }[lifeFocusKey] ||
        'Sailing display';
    } else if (section === 'about') {
      label = 'About';
      detail =
        { story: 'Background', experience: 'Experience', approach: 'Approach' }[aboutFocusKey] ||
        'Background';
    }
    const nextDetail = cameraSettled ? detail : 'Moving…';
    const labelEl = root.querySelector('.kd-location-label'),
      detailEl = root.querySelector('.kd-location-detail');
    if (labelEl.textContent !== label) labelEl.textContent = label;
    if (detailEl.textContent !== nextDetail) detailEl.textContent = nextDetail;
  }

  function currentSnapshot() {
    return {
      modelContent: {
        design: 'Corner Studio / Parking',
        identity: settings.logo,
        theme: mode,
        section: activeSection,
        project: projectState.selected,
        collection: projectState.collection,
        lifeView: lifeFocusKey,
        voyagePlaying: lifePlaying,
        aboutView: aboutFocusKey,
        aboutPages: { ...aboutPages },
      },
      privateContent: {
        overviewLayout: 'studio-parking-v5',
        angle: settings.angle,
        monitorViews: { ...monitorCollectionViews },
        monitorLastCards: { ...monitorLastOpenedCard },
      },
    };
  }
  function persist() {
    if (disposed) return;
    const snapshot = currentSnapshot();
    saveStudioState(snapshot);
    lastLocation = window.location.href;
    onStateChange(snapshot.modelContent);
  }

  function quadTransform(element, points, width, height) {
    if (points?.length !== 4) return false;
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points,
      dx1 = x1 - x2,
      dx2 = x3 - x2,
      dx3 = x0 - x1 + x2 - x3,
      dy1 = y1 - y2,
      dy2 = y3 - y2,
      dy3 = y0 - y1 + y2 - y3,
      den = dx1 * dy2 - dx2 * dy1;
    let g = 0,
      h = 0;
    if (Math.abs(dx3) + Math.abs(dy3) > 0.00001 && Math.abs(den) > 0.00001) {
      g = (dx3 * dy2 - dx2 * dy3) / den;
      h = (dx1 * dy3 - dx3 * dy1) / den;
    }
    const matrix = [
      (x1 - x0 + g * x1) / width,
      (y1 - y0 + g * y1) / width,
      0,
      g / width,
      (x3 - x0 + h * x3) / height,
      (y3 - y0 + h * y3) / height,
      0,
      h / height,
      0,
      0,
      1,
      0,
      x0,
      y0,
      0,
      1,
    ];
    if (!matrix.every(Number.isFinite)) return false;
    element.style.transform = 'matrix3d(' + matrix.join(',') + ')';
    return true;
  }
  function fitLifeHit(button, points) {
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]),
      left = Math.min(...xs),
      top = Math.min(...ys),
      width = Math.max(...xs) - left,
      height = Math.max(...ys) - top;
    if (!Number.isFinite(left + top + width + height) || width < 1 || height < 1) return;
    Object.assign(button.style, {
      left: left + 'px',
      top: top + 'px',
      width: width + 'px',
      height: height + 'px',
      clipPath:
        'polygon(' +
        points
          .map(
            (p) =>
              (((p[0] - left) / width) * 100).toFixed(2) +
              '% ' +
              (((p[1] - top) / height) * 100).toFixed(2) +
              '%',
          )
          .join(',') +
        ')',
    });
  }
  function updateLifeVisibility() {
    const visible =
      activeSection === 'life' &&
      cameraSettled &&
      lifeLayout?.visible &&
      lifeLayout.focus === lifeFocusKey;
    if (activeSection !== 'life') lifeStatus.textContent = '';
    sailingActions.hidden = !visible;
    sailingActions.inert = !visible;
    sailingActions
      .querySelectorAll('button')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.life === lifeFocusKey)),
      );
    if (visible && lifeControlFocusPending) {
      const focusTarget = sailingActions.querySelector(
        '[data-life="' + lifeControlFocusPending + '"]',
      );
      if (focusTarget) {
        lifeControlFocusPending = null;
        focusTarget.focus({ preventScroll: true });
      }
    }
    lifeNav.hidden = !visible;
    lifeNav.querySelectorAll('[data-life]').forEach((button) => {
      button.hidden = lifeFocusKey !== 'boat' || button.dataset.life !== 'boat';
      button.setAttribute(
        'aria-label',
        button.dataset.life === 'boat'
          ? 'Ripple the water beneath the sailboat'
          : button.dataset.life === 'map'
            ? 'Open the Catalina navigation screen'
            : 'Open the outdoors screen',
      );
    });
    const mapVisible = visible && lifeFocusKey === 'map';
    lifeMapControls.hidden = !mapVisible;
    lifeMapControls.inert = !mapVisible;
    lifeBack.hidden = !visible;
    if (activeSection === 'life')
      root.querySelector('.kd-footer-hint').textContent =
        lifeFocusKey === 'boat'
          ? 'Touch the water to make waves'
          : lifeFocusKey === 'map'
            ? 'Marina del Rey ↔ Catalina'
            : lifeFocusKey === 'outside'
              ? 'A little time outside'
              : 'Explore the sailing display';
    syncSceneChrome();
  }
  function positionLife(layout) {
    lifeLayout = layout;
    lifeFocusKey = layout.focus;
    for (const exhibit of layout.planes) {
      const button = lifeNav.querySelector(`[data-life="${exhibit.key}"]`);
      if (button) fitLifeHit(button, exhibit.points);
      if (exhibit.key === 'map') quadTransform(lifeMapControls, exhibit.points, 900, 560);
    }
    lifeMapControls.style.setProperty(
      '--kd-map-button-height',
      (52 * 900) / Math.max(240, layout.mapWidth) + 'px',
    );
    lifeMapControls.style.setProperty(
      '--kd-map-font',
      (14 * 900) / Math.max(240, layout.mapWidth) + 'px',
    );
    updateLifeVisibility();
  }
  function syncLifeState(state) {
    lifePlaying = state.playing;
    lifeDirection = state.direction;
    lifeFocusKey = state.focus;
    const play = lifeMapControls.querySelector('[data-voyage="play"]');
    play.textContent = lifePlaying ? 'Pause' : 'Sail';
    play.setAttribute(
      'aria-label',
      lifePlaying ? 'Pause the Catalina voyage' : 'Play the Catalina voyage',
    );
    play.setAttribute('aria-pressed', String(lifePlaying));
    lifeMapControls.querySelector('.kd-voyage-status').textContent =
      lifeDirection === 1 ? 'To Catalina' : 'To the marina';
    lifeMapControls.querySelector('[data-voyage="reverse"]').textContent =
      lifeDirection === 1 ? 'Sail back' : 'Head out';
    lifeStatus.textContent =
      state.focus === 'map'
        ? 'The Catalina crossing. ' + (lifePlaying ? 'Sailing.' : 'Paused.')
        : state.focus === 'boat'
          ? 'The sailboat. Touch the water to make waves.'
          : state.focus === 'outside'
            ? 'Outside is my reset. Salt air, open water, a trail that goes a little farther. I love the change of pace—and coming back with a fresh perspective.'
            : 'Explore the sailing display.';
    updateLifeVisibility();
  }
  listen(root, 'click', (event) => {
    const exhibit = event.target.closest('[data-life]'),
      voyage = event.target.closest('[data-voyage]'),
      back = event.target.closest('[data-life-back]');
    if (exhibit) {
      if (exhibit.closest('.kd-sailing-actions')) lifeControlFocusPending = exhibit.dataset.life;
      if (exhibit.dataset.life === 'boat' && lifeFocusKey === 'boat') scene?.rippleWater();
      else
        scene?.focusLife(exhibit.dataset.life, { duration: 800, reducedMotion: reduced.matches });
      persist();
    } else if (voyage) {
      if (voyage.dataset.voyage === 'play') scene?.setLifePlaying(!lifePlaying);
      else scene?.reverseVoyage();
      persist();
    } else if (back) {
      lifeControlFocusPending = null;
      closeSection();
    }
  });
  const aboutReader = root.querySelector('.kd-about-reader');
  const aboutStatus = root.querySelector('.kd-about-status');
  const aboutLeaf = aboutReader.querySelector('.kd-about-leaf');
  const aboutKeys = Object.keys(KRISTIAN_ABOUT);
  let aboutLayout = null,
    aboutFocusKey = 'story',
    aboutReaderQuadValid = false;
  let aboutPages = Object.fromEntries(aboutKeys.map((key) => [key, 0]));
  let aboutFocusPending = false,
    aboutPageTurnAnimation = null,
    aboutTextFitPending = true;
  const aboutCompactCopy = {
    story: [
      '12+ years connecting interfaces, architecture, and delivery to make complex systems easier to use and build.',
      'I connect the big picture to the code: understand the constraint, clarify the decision, and follow the complete workflow.',
    ],
    experience: [
      'Lead Software Engineer, Advanced Analytics at Highmark Health. Architecture, technical delivery, and shared healthcare foundations.',
      'Progressive PDF delivery cut the wait for medical coders and became a shared rendering capability.',
      'A shared claims foundation connecting eight applications and more than ten teams through data models, schemas, and APIs.',
      'Technical delivery across five healthcare initiatives, coordinating about 25 cross-functional contributors.',
      'Led and mentored three frontend engineers while remaining approximately 80% hands-on.',
    ],
    approach: [
      'Start with the people using a system, identify the real constraint, and follow the delivery-to-first-render path.',
      'Document the context, choice, tradeoffs, and what would make the team revisit a decision.',
      'Connect interfaces, APIs, data models, and team practices around one complete workflow.',
    ],
  };
  function validAboutKey(key) {
    return typeof key === 'string' && Object.prototype.hasOwnProperty.call(KRISTIAN_ABOUT, key);
  }
  function clampAboutPage(key, value) {
    const count = KRISTIAN_ABOUT[key]?.pages?.length || 0;
    return Number.isFinite(value)
      ? Math.max(0, Math.min(Math.max(0, count - 1), Math.trunc(value)))
      : 0;
  }
  function aboutCurrentPage() {
    const section = KRISTIAN_ABOUT[aboutFocusKey],
      index = clampAboutPage(aboutFocusKey, aboutPages[aboutFocusKey]);
    aboutPages[aboutFocusKey] = index;
    return { section, index, page: section.pages[index] };
  }
  function fitAboutReaderCopy() {
    const copy = aboutReader.querySelector('.kd-about-page-copy');
    if (aboutReader.hidden || !copy.clientHeight) return;
    const compact = aboutReader.dataset.compact === 'true';
    const title = copy.querySelector('.kd-about-title'),
      body = copy.querySelector('.kd-about-body');
    const number = copy.querySelector('.kd-about-proof strong');
    const shortProof = number.textContent.length < 16;
    number.style.fontSize = (shortProof ? 82 : compact ? 44 : 46) + 'px';
    for (const size of compact ? [44, 42] : [36, 34, 32]) {
      body.style.fontSize = size + 'px';
      title.style.fontSize = (compact ? 56 : 64) + 'px';
      if (copy.scrollHeight <= copy.clientHeight + 1) break;
    }
    aboutTextFitPending = false;
  }
  function syncAboutReader({ announce = false, animate = false } = {}) {
    const { section, index, page } = aboutCurrentPage();
    aboutReader.dataset.aboutKind = aboutFocusKey;
    aboutReader
      .querySelectorAll('[data-about-tab]')
      .forEach((button) =>
        button.setAttribute('aria-selected', String(button.dataset.aboutTab === aboutFocusKey)),
      );
    aboutLeaf.setAttribute('aria-labelledby', 'kd-about-tab-' + aboutFocusKey);
    aboutReader.querySelector('.kd-about-eyebrow').textContent =
      page.eyebrow || section.eyebrow || '';
    aboutReader.querySelector('.kd-about-title').textContent = page.title || section.title;
    aboutReader.querySelector('.kd-about-body').textContent =
      aboutReader.dataset.compact === 'true'
        ? aboutCompactCopy[aboutFocusKey][index]
        : page.body || '';
    const proof = aboutReader.querySelector('.kd-about-proof');
    proof.hidden = !page.proof && !page.proofLabel;
    proof.querySelector('strong').textContent = page.proof || '';
    proof.querySelector('span').textContent = page.proofLabel || '';
    aboutReader.querySelector('.kd-about-page-count').textContent =
      index + 1 + ' / ' + section.pages.length;
    aboutReader.querySelector('[data-about-page="previous"]').disabled = index === 0;
    aboutReader.querySelector('[data-about-page="next"]').disabled =
      index === section.pages.length - 1;
    aboutTextFitPending = true;
    syncSceneChrome();
    if (announce)
      aboutStatus.textContent =
        section.title + '. Page ' + (index + 1) + ' of ' + section.pages.length + '. ' + page.title;
    if (animate && !reduced.matches && typeof aboutLeaf.animate === 'function') {
      aboutPageTurnAnimation?.cancel();
      aboutPageTurnAnimation = aboutLeaf.animate(
        [
          { opacity: 0.5, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 220, easing: 'ease-out' },
      );
    }
    if (!aboutReader.hidden) fitAboutReaderCopy();
  }
  function updateAboutVisibility() {
    const visible =
      activeSection === 'about' &&
      cameraSettled &&
      aboutLayout?.visible === true &&
      aboutReaderQuadValid;
    aboutReader.hidden = !visible;
    aboutReader.inert = !visible;
    if (visible && aboutTextFitPending) fitAboutReaderCopy();
    if (activeSection !== 'about') {
      aboutStatus.textContent = '';
      return;
    }
    root.querySelector('.kd-footer-hint').textContent = 'Choose a tab · Turn a page';
    if (visible && aboutFocusPending) {
      aboutFocusPending = false;
      aboutReader
        .querySelector('[data-about-tab="' + aboutFocusKey + '"]')
        ?.focus({ preventScroll: true });
    }
  }
  function validAboutQuad(points) {
    if (
      !Array.isArray(points) ||
      points.length !== 4 ||
      !points.every((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
    )
      return false;
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    return Math.max(...xs) - Math.min(...xs) > 1 && Math.max(...ys) - Math.min(...ys) > 1;
  }
  function positionAbout(layout) {
    aboutLayout = layout || null;
    const plane = layout?.planes?.find((item) => item.key === 'display'),
      points = plane?.points;
    aboutReaderQuadValid = validAboutQuad(points) && quadTransform(aboutReader, points, 1100, 850);
    if (aboutReaderQuadValid) {
      const width = Math.max(
        1,
        Math.min(
          Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1]),
          Math.hypot(points[2][0] - points[3][0], points[2][1] - points[3][1]),
        ),
      );
      const compact = width < 440,
        changed = aboutReader.dataset.compact !== String(compact);
      aboutReader.dataset.compact = String(compact);
      aboutReader.style.setProperty(
        '--kd-about-control-height',
        Math.max(76, Math.ceil((46 * 1100) / width)) + 'px',
      );
      aboutReader.style.setProperty('--kd-about-control-scale', String(1100 / width));
      if (changed) syncAboutReader();
    }
    updateAboutVisibility();
  }
  function syncAboutState(state = {}) {
    if (validAboutKey(state.focus)) aboutFocusKey = state.focus;
    if (state.pages)
      aboutKeys.forEach((key) => {
        if (Number.isFinite(state.pages[key]))
          aboutPages[key] = clampAboutPage(key, state.pages[key]);
      });
    syncAboutReader();
    updateAboutVisibility();
  }
  function changeAboutPage(direction, opener) {
    const current = aboutCurrentPage(),
      next = clampAboutPage(aboutFocusKey, current.index + direction);
    if (next === current.index) return;
    aboutPages[aboutFocusKey] = next;
    syncAboutReader({ announce: true, animate: true });
    scene?.setAboutPage?.(aboutFocusKey, next);
    if (opener?.disabled)
      aboutReader
        .querySelector('[data-about-page="' + (direction > 0 ? 'previous' : 'next') + '"]')
        ?.focus({ preventScroll: true });
    persist();
  }
  function restoreAbout(model) {
    if (!model || typeof model !== 'object') return;
    if (model.aboutPages)
      aboutKeys.forEach((key) => {
        if (Number.isFinite(model.aboutPages[key]))
          aboutPages[key] = clampAboutPage(key, model.aboutPages[key]);
      });
    if (validAboutKey(model.aboutView)) aboutFocusKey = model.aboutView;
    syncAboutReader();
    scene?.focusAbout?.(aboutFocusKey);
    scene?.setAboutPage?.(aboutFocusKey, aboutPages[aboutFocusKey]);
    updateAboutVisibility();
  }
  listen(aboutReader, 'click', (event) => {
    const tab = event.target.closest('[data-about-tab]'),
      page = event.target.closest('[data-about-page]');
    if (tab) {
      event.stopPropagation();
      aboutFocusKey = tab.dataset.aboutTab;
      syncAboutReader({ announce: true, animate: true });
      scene?.focusAbout?.(aboutFocusKey);
      scene?.setAboutPage?.(aboutFocusKey, aboutPages[aboutFocusKey]);
      persist();
    } else if (page) {
      event.stopPropagation();
      changeAboutPage(page.dataset.aboutPage === 'next' ? 1 : -1, page);
    }
  });
  listen(aboutReader, 'keydown', (event) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !['ArrowLeft', 'ArrowRight'].includes(event.key)
    )
      return;
    event.preventDefault();
    const tab = event.target.closest('[data-about-tab]'),
      direction = event.key === 'ArrowRight' ? 1 : -1;
    if (tab) {
      const tabs = [...aboutReader.querySelectorAll('[data-about-tab]')],
        index = tabs.indexOf(tab),
        next = tabs[(index + direction + tabs.length) % tabs.length];
      next.click();
      next.focus({ preventScroll: true });
    } else changeAboutPage(direction, event.target.closest('button'));
  });
  document.fonts?.ready.then(() => {
    if (disposed) return;
    aboutTextFitPending = true;
    if (!aboutReader.hidden) fitAboutReaderCopy();
    projectIndex
      .querySelectorAll('canvas[data-project-preview]')
      .forEach((canvas) =>
        paintKristianProjectPreview(
          canvas.getContext('2d'),
          canvas.width,
          canvas.height,
          canvas.dataset.projectPreview,
        ),
      );
  });
  syncAboutReader();

  const monitorCollections = ['work', 'experiments'];
  const monitorCollectionViews = { work: null, experiments: null };
  const monitorLastOpenedCard = { work: 'careiq', experiments: 'neon-drift' };
  const monitorPanel = monitorUI.querySelector('.kd-monitor-panel');
  let monitorHeaderHeight = 88,
    monitorFooterHeight = 48,
    monitorSizeSignature = '';
  let monitorThumbnailsPainted = false;

  function projectCollectionFor(id) {
    const project = KRISTIAN_PROJECTS.find((item) => item.id === id);
    return project?.collection === 'experiments' || id === 'neon-drift' ? 'experiments' : 'work';
  }
  function projectCollectionItems(collection = projectState.collection) {
    return KRISTIAN_PROJECTS.filter((item) => projectCollectionFor(item.id) === collection);
  }
  function monitorCollectionLabel(collection = projectState.collection) {
    return collection === 'experiments' ? 'Experiments' : 'Work';
  }
  function projectFocusDestination(request = projectFocusPending) {
    if (request && typeof request === 'object' && request.kind === 'collection') {
      return monitorUI.querySelector('[data-collection="' + request.collection + '"]');
    }
    if (projectState.selected) return monitorUI.querySelector('[data-project-action="index"]');
    const id = request?.id || monitorLastOpenedCard[projectState.collection];
    return (
      projectIndex.querySelector('[data-project="' + id + '"]:not([hidden])') ||
      projectIndex.querySelector('[data-project]:not([hidden])')
    );
  }
  function monitorFooterContent() {
    const project = KRISTIAN_PROJECTS.find((item) => item.id === projectState.selected);
    const count = projectCollectionItems().length;
    return {
      title: project
        ? project.title
        : count +
          (projectState.collection === 'experiments'
            ? count === 1
              ? ' experiment'
              : ' experiments'
            : count === 1
              ? ' project'
              : ' projects'),
      status: project
        ? project.id === 'careiq'
          ? 'Sample data'
          : project.id === 'neon-drift'
            ? 'Drag to draw'
            : 'Interactive preview'
        : 'Opens on this screen',
    };
  }
  function paintMonitorShellTexture() {
    const footer = monitorFooterContent();
    scene?.setProjectScreen({
      collection: projectState.collection,
      selected: projectState.selected,
      headerHeight: monitorHeaderHeight,
      footerHeight: monitorFooterHeight,
      tabHeight: monitorHeaderHeight,
      title: footer.title,
      status: footer.status,
    });
  }
  function syncProjectBrowser(announce = false) {
    let project = KRISTIAN_PROJECTS.find((item) => item.id === projectState.selected);
    const collection = project
      ? projectCollectionFor(project.id)
      : monitorCollections.includes(projectState.collection)
        ? projectState.collection
        : 'work';
    projectState = { selected: project?.id || null, collection };
    monitorCollectionViews[collection] = projectState.selected;
    if (project) monitorLastOpenedCard[collection] = project.id;
    projectIndex.hidden = !!project;
    projectIndex.inert = projectIndex.hidden;
    projectRuntime.hidden = !project;
    projectRuntime.inert = projectRuntime.hidden;
    const tablist = monitorUI.querySelector('.kd-monitor-tabs');
    tablist?.setAttribute('role', 'tablist');
    const panelId = monitorPanel?.id || 'kd-monitor-panel';
    if (monitorPanel) {
      monitorPanel.id = panelId;
      monitorPanel.setAttribute('role', 'tabpanel');
      monitorPanel.setAttribute('aria-labelledby', 'kd-monitor-tab-' + collection);
    }
    monitorUI.querySelectorAll('[data-collection]').forEach((button) => {
      const selected = button.dataset.collection === collection;
      button.id = 'kd-monitor-tab-' + button.dataset.collection;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(selected));
      button.setAttribute('aria-controls', panelId);
      button.removeAttribute('aria-pressed');
    });
    projectIndex.querySelectorAll('[data-project]').forEach((button) => {
      button.hidden = projectCollectionFor(button.dataset.project) !== collection;
      button.inert = button.hidden;
    });
    if (!monitorThumbnailsPainted && typeof paintKristianProjectPreview === 'function') {
      projectIndex.querySelectorAll('canvas[data-project-preview]').forEach((canvas) => {
        paintKristianProjectPreview(
          canvas.getContext('2d'),
          canvas.width,
          canvas.height,
          canvas.dataset.projectPreview,
        );
      });
      monitorThumbnailsPainted = true;
    }
    monitorUI.querySelectorAll('[data-runtime]').forEach((host) => {
      host.hidden = host.dataset.runtime !== project?.id;
      host.inert = host.hidden;
    });
    const back = monitorUI.querySelector('[data-project-action="index"]');
    if (back) {
      back.hidden = !project;
      back.disabled = !project;
      back.textContent = '← Back';
      back.setAttribute('aria-label', 'Back to ' + monitorCollectionLabel());
    }
    const items = projectCollectionItems();
    monitorUI
      .querySelectorAll('[data-project-action="previous"],[data-project-action="next"]')
      .forEach((button) => {
        button.hidden = !project || items.length < 2;
        button.disabled = button.hidden;
      });
    if (
      project &&
      activeSection === 'work' &&
      cameraSettled &&
      !projectRuntimes.has(project.id) &&
      !pendingRuntimes.has(project.id)
    ) {
      const host = monitorUI.querySelector('[data-runtime="' + project.id + '"]');
      if (host) {
        const projectId = project.id;
        pendingRuntimes.add(projectId);
        host.setAttribute('aria-busy', 'true');
        const loading = document.createElement('div');
        loading.className = 'kd-preview-loading';
        loading.setAttribute('role', 'status');
        loading.textContent = 'Opening ' + project.title + '…';
        host.replaceChildren(loading);
        mountProjectPreview(projectId, host)
          .then((runtime) => {
            pendingRuntimes.delete(projectId);
            host.removeAttribute('aria-busy');
            if (disposed) {
              runtime.dispose();
              return;
            }
            projectRuntimes.set(projectId, runtime);
            updateMonitorVisibility();
            if (projectState.selected === projectId) {
              projectFocusPending = { kind: 'runtime', id: projectId };
              updateMonitorVisibility();
            }
          })
          .catch((error) => {
            pendingRuntimes.delete(projectId);
            host.removeAttribute('aria-busy');
            if (disposed) return;
            console.error('Project preview unavailable', error);
            const failure = document.createElement('div');
            failure.className = 'kd-preview-loading';
            failure.setAttribute('role', 'alert');
            const text = document.createElement('p');
            text.textContent = 'The preview could not open. Your place in the studio is saved.';
            const retry = document.createElement('button');
            retry.type = 'button';
            retry.textContent = 'Try again';
            retry.className = 'cursor-interaction';
            retry.addEventListener(
              'click',
              () => {
                host.replaceChildren();
                syncProjectBrowser();
              },
              { once: true, signal: lifetime.signal },
            );
            failure.append(text, retry);
            host.replaceChildren(failure);
          });
      }
    }
    const footer = monitorFooterContent();
    const context = monitorUI.querySelector('.kd-monitor-context'),
      status = monitorUI.querySelector('.kd-monitor-status');
    if (context) context.textContent = footer.title;
    if (status) status.textContent = footer.status;
    if (announce)
      monitorUI.querySelector('.kd-project-announcement').textContent = project
        ? project.title + ' opened. ' + footer.status + '.'
        : monitorCollectionLabel() + '. ' + footer.title + '. ' + footer.status + '.';
    paintMonitorShellTexture();
    updateMonitorVisibility();
    if (typeof syncSceneChrome === 'function') syncSceneChrome();
  }
  function selectProject(id, { save = true, focus = false } = {}) {
    if (id !== null && !KRISTIAN_PROJECTS.some((item) => item.id === id)) return;
    const collection = id ? projectCollectionFor(id) : projectState.collection;
    const leaving = projectState.selected;
    if (leaving) monitorLastOpenedCard[projectState.collection] = leaving;
    projectState = { selected: id, collection };
    monitorCollectionViews[collection] = id;
    if (id) monitorLastOpenedCard[collection] = id;
    if (focus)
      projectFocusPending = {
        kind: id ? 'runtime' : 'index',
        id: id || leaving || monitorLastOpenedCard[collection],
      };
    // The scene API is idempotent. Internal Back and collection changes never
    // pull the camera away from the monitor or restart a camera flight.
    if (id) scene?.focusMonitor(true, { duration: 650, reducedMotion: reduced.matches });
    syncProjectBrowser(true);
    if (save) persist();
  }
  function selectProjectCollection(collection, { focusTab = false, save = true } = {}) {
    if (!monitorCollections.includes(collection)) return;
    if (collection === projectState.collection) {
      if (focusTab)
        monitorUI
          .querySelector('[data-collection="' + collection + '"]')
          ?.focus({ preventScroll: true });
      return;
    }
    monitorCollectionViews[projectState.collection] = projectState.selected;
    if (projectState.selected)
      monitorLastOpenedCard[projectState.collection] = projectState.selected;
    const remembered = monitorCollectionViews[collection];
    const selected =
      remembered &&
      KRISTIAN_PROJECTS.some(
        (item) => item.id === remembered && projectCollectionFor(item.id) === collection,
      )
        ? remembered
        : null;
    projectState = { selected, collection };
    if (focusTab) projectFocusPending = { kind: 'collection', collection };
    syncProjectBrowser(true);
    if (save) persist();
  }
  function updateMonitorVisibility() {
    const visible = activeSection === 'work' && cameraSettled && monitorLayout?.visible;
    monitorUI.hidden = !visible;
    monitorUI.inert = !visible;
    for (const [id, runtime] of projectRuntimes)
      runtime?.setActive?.(!!visible && projectState.selected === id);
    if (activeSection !== 'work') projectFocusPending = false;
    if (visible && projectFocusPending) {
      const destination = projectFocusDestination();
      projectFocusPending = false;
      destination?.focus({ preventScroll: true });
    }
  }
  function positionMonitor(layout) {
    monitorLayout = layout;
    if (layout?.points?.length !== 4) {
      monitorUI.hidden = true;
      monitorUI.inert = true;
      return;
    }
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = layout.points;
    const dx1 = x1 - x2,
      dx2 = x3 - x2,
      dx3 = x0 - x1 + x2 - x3,
      dy1 = y1 - y2,
      dy2 = y3 - y2,
      dy3 = y0 - y1 + y2 - y3,
      den = dx1 * dy2 - dx2 * dy1;
    let g = 0,
      h = 0;
    if (Math.abs(dx3) + Math.abs(dy3) > 0.00001 && Math.abs(den) > 0.00001) {
      g = (dx3 * dy2 - dx2 * dy3) / den;
      h = (dx1 * dy3 - dx3 * dy1) / den;
    }
    const a = x1 - x0 + g * x1,
      b = x3 - x0 + h * x3,
      d = y1 - y0 + g * y1,
      e = y3 - y0 + h * y3;
    const matrix = [
      a / 600,
      d / 600,
      0,
      g / 600,
      b / 347,
      e / 347,
      0,
      h / 347,
      0,
      0,
      1,
      0,
      x0,
      y0,
      0,
      1,
    ];
    if (!matrix.every(Number.isFinite)) {
      monitorUI.hidden = true;
      monitorUI.inert = true;
      return;
    }
    monitorUI.style.transform = 'matrix3d(' + matrix.join(',') + ')';
    const physicalWidth = Math.min(Math.hypot(x1 - x0, y1 - y0), Math.hypot(x2 - x3, y2 - y3));
    const appWidth = Math.max(240, Math.round(physicalWidth)),
      scale = 600 / appWidth;
    const headerHeight = Math.ceil(46 * scale),
      footerHeight = Math.ceil(24 * scale),
      contentHeight = Math.max(1, 347 - headerHeight - footerHeight);
    monitorUI.dataset.compact = String(physicalWidth < 420);
    monitorUI.style.setProperty('--kd-monitor-scale', String(scale));
    monitorUI.style.setProperty('--kd-monitor-header-height', headerHeight + 'px');
    monitorUI.style.setProperty('--kd-monitor-footer-height', footerHeight + 'px');
    monitorUI.style.setProperty('--kd-runtime-width', appWidth + 'px');
    monitorUI.style.setProperty('--kd-runtime-height', contentHeight / scale + 'px');
    monitorUI.style.setProperty('--kd-runtime-scale', String(scale));
    // Legacy library variables remain available for card typography only.
    projectIndex.style.setProperty('--kd-library-scale', String(scale));
    projectIndexTabHeight = headerHeight;
    const signature = appWidth + ':' + headerHeight + ':' + footerHeight;
    if (signature !== monitorSizeSignature) {
      monitorSizeSignature = signature;
      monitorHeaderHeight = headerHeight;
      monitorFooterHeight = footerHeight;
      paintMonitorShellTexture();
    }
    updateMonitorVisibility();
  }
  listen(monitorUI, 'click', (event) => {
    // Handle only shell controls. Events from the Shadow DOM apps retain their
    // native handlers and cannot be confused with this navigation.
    const collection = event.target.closest('[data-collection]');
    const card = event.target.closest('[data-project]');
    const action = event.target.closest('[data-project-action]');
    if (collection) {
      event.stopPropagation();
      selectProjectCollection(collection.dataset.collection);
    } else if (card) {
      event.stopPropagation();
      selectProject(card.dataset.project, { focus: true });
    } else if (action) {
      event.stopPropagation();
      if (action.dataset.projectAction === 'index') selectProject(null, { focus: true });
      else {
        const items = projectCollectionItems(),
          index = items.findIndex((item) => item.id === projectState.selected);
        if (items.length > 1)
          selectProject(
            items[
              (index + (action.dataset.projectAction === 'next' ? 1 : -1) + items.length) %
                items.length
            ].id,
            { focus: true },
          );
      }
    }
  });
  listen(monitorUI, 'keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const insideDialog = event
      .composedPath()
      .some((node) => node?.matches?.('dialog[open],[role="dialog"],[aria-modal="true"]'));
    if (event.key === 'Escape') {
      if (
        !insideDialog &&
        !monitorUI.hidden &&
        !monitorUI.inert &&
        activeSection === 'work' &&
        projectState.selected
      ) {
        event.preventDefault();
        event.stopPropagation();
        selectProject(null, { focus: true });
      }
      return;
    }
    const tab = event.target.closest('[data-collection]');
    if (!tab || insideDialog) return;
    const index = monitorCollections.indexOf(tab.dataset.collection);
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % monitorCollections.length
        : event.key === 'ArrowLeft'
          ? (index + monitorCollections.length - 1) % monitorCollections.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? monitorCollections.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    selectProjectCollection(monitorCollections[next], { focusTab: true });
  });

  function syncChrome() {
    root.dataset.mode = mode;
    toggle.setAttribute('aria-checked', String(mode === 'night'));
    toggle.setAttribute(
      'aria-label',
      `After Hours dark theme ${mode === 'night' ? 'on' : 'off'}; switch to ${mode === 'night' ? 'Open Desk' : 'After Hours'}`,
    );
    status.textContent =
      mode === 'night' ? 'AFTER HOURS / LIGHTS ON' : 'OPEN DESK / A LITTLE DAYLIGHT';
  }
  function setMode(next, animate = true, save = true) {
    if (!['day', 'night'].includes(next)) return;
    cancelAnimationFrame(animation);
    mode = next;
    syncChrome();
    const target = mode === 'night' ? 1 : 0,
      from = progress;
    if (!animate || reduced.matches) {
      progress = target;
      scene?.setTheme(progress);
      if (save) persist();
      return;
    }
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / settings.duration),
        ease = t * t * (3 - 2 * t);
      progress = from + (target - from) * ease;
      scene?.setTheme(progress);
      if (t < 1) animation = requestAnimationFrame(step);
      else animation = 0;
    }
    animation = requestAnimationFrame(step);
    if (save) persist();
  }
  function applyView({ key, settled }) {
    if (key === 'about' && !settled) aboutFocusPending = true;
    activeSection = key || null;
    cameraSettled = settled;
    updateMonitorVisibility();
    root.dataset.view = key || 'overview';
    cameraNav.hidden = false;
    signNav.hidden = !!key || !settled;
    root
      .querySelector('#kd-scene')
      .setAttribute(
        'aria-label',
        key
          ? 'Camera close-up: ' + views[key] + '. Use the destination controls to change views.'
          : 'A corner studio with a desk, a large indoor sailing display, a decorative indoor palm, bonsai and conifer, camera equipment on the rear shelf, oversized entrance signs, and an asphalt parking lot. A white Silverado is parked off to the side. Beyond the lot, small neon storefronts, warm windows, and occasional passing headlights bring the neighborhood to life. Choose Work, Life, or About, or drag to look around.',
      );
    root
      .querySelectorAll('[data-camera]')
      .forEach((button) =>
        button.setAttribute('aria-current', button.dataset.camera === key ? 'page' : 'false'),
      );
    root.querySelector('.kd-return').setAttribute('aria-current', key ? 'false' : 'page');
    root
      .querySelectorAll('[data-section]')
      .forEach((button) =>
        button.setAttribute('aria-expanded', String(button.dataset.section === key)),
      );
    viewStatus.textContent = key
      ? settled
        ? views[key]
        : 'Moving to ' + views[key]
      : settled
        ? 'Overview'
        : 'Returning to the overview';
    root.querySelector('.kd-footer-hint').textContent = key
      ? 'Browse the scene'
      : 'Drag to look around · Work / Life / About';
    if (key && !settled)
      root.querySelector(`[data-camera="${key}"]`)?.focus({ preventScroll: true });
    if (!key && settled) lastOpener?.focus({ preventScroll: true });
    updateLifeVisibility();
    updateAboutVisibility();
    syncSceneChrome();
    if (key === 'work' && settled) syncProjectBrowser();
  }
  function openSection(key, opener) {
    if (!views[key] || !scene) return;
    if (key === 'work' && activeSection === 'work' && cameraSettled) return;
    if (key === 'work') {
      scene.focusMonitor(true, { immediate: true });
      projectFocusPending = {
        kind: projectState.selected ? 'runtime' : 'index',
        id: monitorLastOpenedCard[projectState.collection],
      };
    }
    if (opener?.dataset.section || opener?.dataset.camera) lastOpener = opener;
    else if (!lastOpener) lastOpener = root.querySelector(`[data-section="${key}"]`);
    activeSection = key;
    scene.navigateTo(key, { duration: 900, reducedMotion: reduced.matches });
    persist();
  }
  function closeSection() {
    if (!scene) return;
    scene.resetView({ duration: 900, reducedMotion: reduced.matches });
    activeSection = null;
    persist();
  }
  listen(root, 'click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button === toggle) setMode(mode === 'night' ? 'day' : 'night');
    else if (button.dataset.section || button.dataset.camera)
      openSection(button.dataset.section || button.dataset.camera, button);
    else if (button.classList.contains('kd-return') || button.classList.contains('kd-brand'))
      closeSection();
  });
  listen(root, 'keydown', (event) => {
    if (
      event.key === 'Escape' &&
      !event.defaultPrevented &&
      !event
        .composedPath()
        .some((node) => node?.matches?.('dialog[open],[role="dialog"],[aria-modal="true"]'))
    ) {
      event.preventDefault();
      closeSection();
    }
  });
  function positionSignButtons(signs) {
    for (const sign of signs) {
      const button = root.querySelector(`[data-section="${sign.key}"]`);
      if (!button || !sign.points?.length) continue;
      const xs = sign.points.map((p) => p[0]),
        ys = sign.points.map((p) => p[1]),
        left = Math.min(...xs),
        top = Math.min(...ys),
        width = Math.max(...xs) - left,
        height = Math.max(...ys) - top;
      if (!Number.isFinite(left + top + width + height) || width < 1 || height < 1) {
        button.hidden = true;
        continue;
      }
      button.hidden = false;
      Object.assign(button.style, {
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px',
        clipPath: `polygon(${sign.points.map((p) => `${(((p[0] - left) / width) * 100).toFixed(2)}% ${(((p[1] - top) / height) * 100).toFixed(2)}%`).join(',')})`,
      });
    }
  }
  root.querySelectorAll('.kd-sign-hit').forEach((button) => {
    listen(button, 'pointerenter', () => scene?.highlightSign(button.dataset.section));
    listen(button, 'pointerleave', () => scene?.highlightSign(null));
    listen(button, 'focus', () => scene?.highlightSign(button.dataset.section));
    listen(button, 'blur', () => scene?.highlightSign(null));
  });
  function restore(saved, { animate = false } = {}) {
    const model = saved?.modelContent || saved;
    if (['streetplate', 'switchback'].includes(model?.identity)) {
      settings.logo = model.identity;
      setKristianLogo(root, settings.logo);
    }
    for (const collection of monitorCollections) {
      const view = saved?.privateContent?.monitorViews?.[collection],
        last = saved?.privateContent?.monitorLastCards?.[collection];
      const valid = (id) =>
        KRISTIAN_PROJECTS.some(
          (item) => item.id === id && projectCollectionFor(item.id) === collection,
        );
      if (view === null || valid(view)) monitorCollectionViews[collection] = view;
      if (valid(last)) monitorLastOpenedCard[collection] = last;
    }
    restoreAbout(model);
    if ((model?.theme === 'day' || model?.theme === 'night') && model.theme !== mode)
      setMode(model.theme, false, false);
    const project = model?.project === 'field-guide' ? 'neon-drift' : model?.project;
    const savedCollection = ['work', 'experiments'].includes(model?.collection)
      ? model.collection
      : null;
    const hasProject =
      model &&
      Object.prototype.hasOwnProperty.call(model, 'project') &&
      (project === null || KRISTIAN_PROJECTS.some((item) => item.id === project));
    const restoredProject = hasProject ? project : projectState.selected;
    const collection = restoredProject
      ? projectCollectionFor(restoredProject)
      : savedCollection || projectState.collection;
    if (restoredProject !== projectState.selected || collection !== projectState.collection) {
      projectState = { selected: restoredProject, collection };
      syncProjectBrowser();
      scene?.focusMonitor(true, { immediate: true });
    }
    monitorCollectionViews[projectState.collection] = projectState.selected;
    const restoredLifeView = model?.lifeView === 'bonsai' ? 'boat' : model?.lifeView;
    if (
      model?.design === 'Corner Studio / Parking' &&
      Object.prototype.hasOwnProperty.call(model, 'lifeView') &&
      [null, 'boat', 'map', 'outside'].includes(restoredLifeView) &&
      restoredLifeView !== lifeFocusKey
    )
      scene?.focusLife(restoredLifeView, {
        immediate: !animate,
        duration: 650,
        reducedMotion: reduced.matches,
      });
    if (typeof model?.voyagePlaying === 'boolean' && model.voyagePlaying !== lifePlaying)
      scene?.setLifePlaying(model.voyagePlaying);
    const angle = saved?.privateContent?.angle;
    if (typeof angle === 'number' && angle !== settings.angle) {
      settings.angle = angle;
      scene?.setAngle(angle);
    }
  }
  const saved = readStudioState();
  syncProjectBrowser();
  restore(saved);
  syncChrome();
  function applySavedNavigation(snapshot, immediate = true) {
    const model = snapshot?.modelContent || snapshot;
    const previousSection = activeSection;
    restore(snapshot, { animate: !immediate });
    const section = ['work', 'life', 'about'].includes(model?.section) ? model.section : null;
    if (section === previousSection) {
      syncSceneChrome();
      return;
    }
    if (section) {
      if (section === 'work') scene?.focusMonitor(true, { immediate: true });
      scene?.navigateTo(section, { immediate, duration: 650, reducedMotion: reduced.matches });
    } else scene?.resetView({ immediate, duration: 650, reducedMotion: reduced.matches });
  }
  let lastLocation = window.location.href;
  function locationChanged() {
    if (window.location.href === lastLocation) return;
    lastLocation = window.location.href;
    if (window.location.hash === '#main') return;
    applySavedNavigation(readStudioState(), false);
  }
  listen(window, 'popstate', locationChanged);
  listen(window, 'hashchange', locationChanged);
  listen(reduced, 'change', () => {
    if (reduced.matches) {
      setMode(mode, false, false);
      aboutPageTurnAnimation?.cancel();
    }
  });
  root.style.setProperty('--kd-duration', settings.duration + 'ms');
  return {
    callbacks: {
      onNavigate: (key) => openSection(key),
      onRotate: (angle) => {
        settings.angle = angle;
      },
      onSignLayout: positionSignButtons,
      onMonitorLayout: positionMonitor,
      onLifeLayout: positionLife,
      onLifeState: syncLifeState,
      onAboutLayout: positionAbout,
      onAboutState: syncAboutState,
      onViewChange: applyView,
    },
    attachScene(next) {
      scene = next;
      if (!scene || disposed) return;
      root.classList.remove('kd-no-scene');
      scene.setTheme(progress);
      scene.setAngle(settings.angle);
      applySavedNavigation(readStudioState());
      onStateChange(currentSnapshot().modelContent);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      lifetime.abort();
      cancelAnimationFrame(animation);
      aboutPageTurnAnimation?.cancel();
      for (const runtime of projectRuntimes.values()) runtime?.dispose?.();
      projectRuntimes.clear();
      scene = null;
    },
  };
}
