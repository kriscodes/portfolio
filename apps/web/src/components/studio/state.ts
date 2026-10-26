import type { StudioView } from './scene/types';

export interface StudioModelState {
  design: 'Corner Studio / Parking';
  identity: 'streetplate' | 'switchback';
  theme: 'day' | 'night';
  section: StudioView | null;
  project: 'careiq' | 'neon-drift' | null;
  collection: 'work' | 'experiments';
  lifeView: 'boat' | 'map' | 'outside' | null;
  voyagePlaying: boolean;
  aboutView: 'story' | 'experience' | 'approach';
  aboutPages: Record<string, number>;
}

export interface StudioSnapshot {
  modelContent: StudioModelState;
  privateContent: {
    overviewLayout: string;
    angle: number;
    monitorViews: Record<string, string | null>;
    monitorLastCards: Record<string, string>;
  };
}

const storageKey = 'kristian-corner-studio:v1';
const pageCounts: Record<string, number> = { story: 2, experience: 5, approach: 3 };
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function cleanSnapshot(value: unknown): StudioSnapshot {
  const saved = isRecord(value) ? value : {};
  const model = isRecord(saved.modelContent) ? saved.modelContent : {};
  const detail = isRecord(saved.privateContent) ? saved.privateContent : {};
  const pages = isRecord(model.aboutPages) ? model.aboutPages : {};
  const views = isRecord(detail.monitorViews) ? detail.monitorViews : {};
  const lastCards = isRecord(detail.monitorLastCards) ? detail.monitorLastCards : {};
  return {
    modelContent: {
      design: 'Corner Studio / Parking',
      identity: model.identity === 'switchback' ? 'switchback' : 'streetplate',
      theme: model.theme === 'day' ? 'day' : 'night',
      section: null,
      project: model.project === 'careiq' || model.project === 'neon-drift' ? model.project : null,
      collection: model.collection === 'experiments' ? 'experiments' : 'work',
      lifeView: ['boat', 'map', 'outside'].includes(String(model.lifeView))
        ? (model.lifeView as StudioModelState['lifeView'])
        : null,
      voyagePlaying:
        model.voyagePlaying !== false &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      aboutView:
        model.aboutView === 'experience' || model.aboutView === 'approach'
          ? model.aboutView
          : 'story',
      aboutPages: Object.fromEntries(
        Object.entries(pageCounts).map(([key, count]) => [
          key,
          typeof pages[key] === 'number' && Number.isFinite(pages[key])
            ? Math.max(0, Math.min(count - 1, Math.floor(pages[key] as number)))
            : 0,
        ]),
      ),
    },
    privateContent: {
      overviewLayout: 'studio-parking-v5',
      angle:
        typeof detail.angle === 'number' && Number.isFinite(detail.angle)
          ? Math.max(-25, Math.min(25, detail.angle))
          : 0,
      monitorViews: {
        work: views.work === 'careiq' ? 'careiq' : null,
        experiments: views.experiments === 'neon-drift' ? 'neon-drift' : null,
      },
      monitorLastCards: {
        work: lastCards.work === 'careiq' ? lastCards.work : 'careiq',
        experiments: lastCards.experiments === 'neon-drift' ? lastCards.experiments : 'neon-drift',
      },
    },
  };
}

/** A shared URL chooses the view; browser storage remembers preferences and tab positions. */
export function readStudioState(): StudioSnapshot {
  let saved: unknown;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  } catch {
    saved = null;
  }
  const snapshot = cleanSnapshot(saved);
  const model = snapshot.modelContent;
  const [view, item, page] = window.location.hash.replace(/^#/, '').split('/');
  if (view === 'work' || view === 'experiments') {
    model.section = 'work';
    model.collection = view === 'experiments' ? 'experiments' : 'work';
    model.project =
      item === 'careiq' && view === 'work'
        ? 'careiq'
        : item === 'neon-drift' && view === 'experiments'
          ? 'neon-drift'
          : null;
  } else if (view === 'life') {
    model.section = 'life';
    model.lifeView = item === 'catalina' ? 'map' : item === 'outdoors' ? 'outside' : 'boat';
  } else if (view === 'about') {
    model.section = 'about';
    model.aboutView = item === 'experience' || item === 'approach' ? item : 'story';
    if (page && /^\d+$/.test(page)) {
      model.aboutPages[model.aboutView] = Math.max(
        0,
        Math.min(pageCounts[model.aboutView] - 1, Number(page) - 1),
      );
    }
  }
  return snapshot;
}

function studioHash(model: StudioModelState): string {
  if (model.section === 'work') {
    const collection = model.collection === 'experiments' ? 'experiments' : 'work';
    return '#' + collection + (model.project ? '/' + model.project : '');
  }
  if (model.section === 'life') {
    return (
      '#life/' +
      (model.lifeView === 'map' ? 'catalina' : model.lifeView === 'outside' ? 'outdoors' : 'boat')
    );
  }
  if (model.section === 'about') {
    return '#about/' + model.aboutView + '/' + ((model.aboutPages[model.aboutView] || 0) + 1);
  }
  return '';
}

export function saveStudioState(snapshot: StudioSnapshot): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Navigation and controls remain usable when storage is disabled or full.
  }
  const hash = studioHash(snapshot.modelContent);
  if (hash !== window.location.hash) {
    window.history.pushState(null, '', window.location.pathname + window.location.search + hash);
  }
}
