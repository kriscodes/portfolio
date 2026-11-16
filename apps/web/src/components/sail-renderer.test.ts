import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { createTelltalePath, GUST_DURATION_MS, sampleSailGust } from './sail-motion';
import { createSailRenderer } from './sail-renderer';

function installAnimationClock(context: TestContext) {
  const pending = new Map<number, FrameRequestCallback>();
  const canceled: number[] = [];
  const originalRequest = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const originalCancel = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
  let nextId = 1;
  let now = 0;

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    value(callback: FrameRequestCallback) {
      const id = nextId++;
      pending.set(id, callback);
      return id;
    },
  });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    value(id: number) {
      canceled.push(id);
      pending.delete(id);
    },
  });
  context.mock.method(performance, 'now', () => now);
  context.after(() => {
    if (originalRequest)
      Object.defineProperty(globalThis, 'requestAnimationFrame', originalRequest);
    else Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
    if (originalCancel) Object.defineProperty(globalThis, 'cancelAnimationFrame', originalCancel);
    else Reflect.deleteProperty(globalThis, 'cancelAnimationFrame');
  });

  return {
    pending,
    canceled,
    advanceTo(timestamp: number) {
      assert.equal(pending.size, 1, 'exactly one animation frame should be pending');
      const [id, callback] = pending.entries().next().value!;
      pending.delete(id);
      now = timestamp;
      callback(now);
    },
  };
}

function createArtwork() {
  const clothAttributes = new Map<string, string>();
  const telltaleAttributes = new Map<string, string>();
  const cloth = {
    setAttribute(name: string, value: string) {
      clothAttributes.set(name, value);
    },
  } as unknown as SVGGElement;
  const telltale = {
    setAttribute(name: string, value: string) {
      telltaleAttributes.set(name, value);
    },
  } as unknown as SVGPathElement;

  return {
    cloth,
    telltale,
    transform: () => clothAttributes.get('transform'),
    path: () => telltaleAttributes.get('d'),
    assertResting() {
      assert.equal(clothAttributes.get('transform'), 'matrix(1 0 0 1 0 0)');
      assert.equal(telltaleAttributes.get('d'), createTelltalePath(sampleSailGust(0), 0));
    },
  };
}

function translationIn(transform: string | undefined): number {
  assert.ok(transform);
  const values = transform.slice('matrix('.length, -1).split(' ').map(Number);
  return Math.abs(values[4]);
}

test('a natural gust completes once at exact rest and leaves no scheduled frames', (context) => {
  const clock = installAnimationClock(context);
  const artwork = createArtwork();
  let completions = 0;
  const renderer = createSailRenderer(artwork.cloth, artwork.telltale, () => completions++);

  renderer.start();
  renderer.start();
  assert.equal(clock.pending.size, 1, 'repeated start must not create parallel animation loops');
  clock.advanceTo(1_000);
  artwork.assertResting();
  clock.advanceTo(4_000);
  assert.notEqual(artwork.transform(), 'matrix(1 0 0 1 0 0)');
  assert.equal(completions, 0);

  clock.advanceTo(1_000 + GUST_DURATION_MS);
  artwork.assertResting();
  assert.equal(completions, 1);
  assert.equal(clock.pending.size, 0);
  renderer.start();
  assert.equal(clock.pending.size, 0, 'a completed renderer does not replay itself');
  renderer.dispose();
});

test('early release is continuous and reaches exact rest after 1.4 seconds', (context) => {
  const clock = installAnimationClock(context);
  const artwork = createArtwork();
  let completions = 0;
  const renderer = createSailRenderer(artwork.cloth, artwork.telltale, () => completions++);

  renderer.start();
  clock.advanceTo(0);
  clock.advanceTo(3_000);
  const beforeRelease = artwork.transform();
  const initialTranslation = translationIn(beforeRelease);
  assert.ok(initialTranslation > 0);
  renderer.settle();
  clock.advanceTo(3_000);
  assert.equal(artwork.transform(), beforeRelease, 'releasing does not snap the cloth');

  let previousTranslation = initialTranslation;
  for (let frame = 1; frame <= 84; frame += 1) {
    clock.advanceTo(3_000 + (1_400 * frame) / 84);
    const translation = translationIn(artwork.transform());
    assert.ok(translation <= previousTranslation, 'cloth tension eases monotonically');
    assert.ok(previousTranslation - translation < initialTranslation * 0.03);
    if (frame < 84) assert.equal(completions, 0);
    previousTranslation = translation;
  }

  artwork.assertResting();
  assert.equal(completions, 1);
  assert.equal(clock.pending.size, 0);
  renderer.dispose();
});

test('disposal cancels motion and stale callbacks while fresh renderers can replay', (context) => {
  const clock = installAnimationClock(context);
  const artwork = createArtwork();
  let completions = 0;
  const renderer = createSailRenderer(artwork.cloth, artwork.telltale, () => completions++);

  renderer.start();
  clock.advanceTo(0);
  clock.advanceTo(2_000);
  const [pendingId, staleCallback] = clock.pending.entries().next().value!;
  renderer.dispose();
  renderer.dispose();
  assert.ok(clock.canceled.includes(pendingId));
  assert.equal(clock.pending.size, 0);
  artwork.assertResting();

  staleCallback(GUST_DURATION_MS);
  renderer.start();
  renderer.settle();
  artwork.assertResting();
  assert.equal(completions, 0, 'disposed renderers cannot report completion');
  assert.equal(clock.pending.size, 0);

  const replay = createSailRenderer(artwork.cloth, artwork.telltale, () => completions++);
  replay.start();
  clock.advanceTo(10_000);
  clock.advanceTo(13_000);
  assert.notEqual(artwork.transform(), 'matrix(1 0 0 1 0 0)');
  clock.advanceTo(10_000 + GUST_DURATION_MS);
  artwork.assertResting();
  assert.equal(completions, 1);
  assert.equal(clock.pending.size, 0);
  replay.dispose();
});
