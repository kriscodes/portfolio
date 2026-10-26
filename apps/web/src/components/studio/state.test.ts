import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readStudioState, saveStudioState } from './state';

let url: URL;
let memory: Map<string, string>;
let pushes: string[];
let reducedMotion = false;
let storageBlocked = false;

beforeEach(() => {
  url = new URL('https://kristiansalmeron.com/');
  memory = new Map();
  pushes = [];
  reducedMotion = false;
  storageBlocked = false;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      get location() {
        return url;
      },
      matchMedia: () => ({ matches: reducedMotion }),
      history: {
        pushState: (_state: unknown, _title: string, next: string) => {
          pushes.push(next);
          url = new URL(next, url);
        },
      },
    },
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (storageBlocked) throw new Error('Storage disabled');
        memory.set(key, value);
      },
    },
  });
});

test('a fresh visit opens the overview while preserving a saved theme', () => {
  memory.set(
    'kristian-corner-studio:v1',
    JSON.stringify({ modelContent: { theme: 'day', section: 'work', project: 'careiq' } }),
  );
  const saved = readStudioState();
  assert.equal(saved.modelContent.theme, 'day');
  assert.equal(saved.modelContent.section, null);
  assert.equal(saved.modelContent.project, 'careiq');
});

test('shared project URLs override a different remembered project and collection', () => {
  memory.set(
    'kristian-corner-studio:v1',
    JSON.stringify({ modelContent: { collection: 'work', project: 'careiq' } }),
  );
  url.hash = '#experiments/neon-drift';
  const model = readStudioState().modelContent;
  assert.equal(model.section, 'work');
  assert.equal(model.collection, 'experiments');
  assert.equal(model.project, 'neon-drift');
  url.hash = '#work/neon-drift';
  assert.equal(readStudioState().modelContent.project, null);
});

test('invalid stored values and out-of-range terminal pages cannot break restoration', () => {
  memory.set('kristian-corner-studio:v1', '{broken');
  assert.equal(readStudioState().modelContent.theme, 'night');
  memory.set(
    'kristian-corner-studio:v1',
    JSON.stringify({
      modelContent: { theme: '<script>', aboutPages: { story: -10, approach: 400 } },
      privateContent: { angle: 900 },
    }),
  );
  const snapshot = readStudioState();
  assert.equal(snapshot.modelContent.theme, 'night');
  assert.equal(snapshot.modelContent.aboutPages.story, 0);
  assert.equal(snapshot.modelContent.aboutPages.approach, 2);
  assert.equal(snapshot.privateContent.angle, 25);
  url.hash = '#about/experience/999';
  assert.equal(readStudioState().modelContent.aboutPages.experience, 4);
});

test('Life links restore the correct camera and respect reduced motion', () => {
  reducedMotion = true;
  url.hash = '#life/catalina';
  const model = readStudioState().modelContent;
  assert.equal(model.section, 'life');
  assert.equal(model.lifeView, 'map');
  assert.equal(model.voyagePlaying, false);
});

test('view changes create history entries and theme changes do not duplicate them', () => {
  const snapshot = readStudioState();
  snapshot.modelContent.section = 'about';
  snapshot.modelContent.aboutView = 'experience';
  snapshot.modelContent.aboutPages.experience = 1;
  saveStudioState(snapshot);
  assert.equal(url.hash, '#about/experience/2');
  snapshot.modelContent.theme = 'day';
  saveStudioState(snapshot);
  assert.equal(pushes.length, 1);
  assert.equal(readStudioState().modelContent.theme, 'day');
});

test('navigation remains available when browser storage is blocked', () => {
  storageBlocked = true;
  const snapshot = readStudioState();
  snapshot.modelContent.section = 'work';
  snapshot.modelContent.project = 'careiq';
  assert.doesNotThrow(() => saveStudioState(snapshot));
  assert.equal(url.hash, '#work/careiq');
});
