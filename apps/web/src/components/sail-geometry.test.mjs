import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SAIL, projectSailPoint, sailPoint, stepSailWind } from './sail-geometry.ts';

test('the luff and bottom corner anchors stay fixed when wind fills the cloth', () => {
  for (const height of [7, 11]) {
    for (const foot of [2.8, 5]) {
      const settings = { ...DEFAULT_SAIL, height, foot };
      for (const v of [0, 0.25, 0.5, 0.75, 1]) {
        assert.deepEqual(sailPoint(0, v, settings, 0), sailPoint(0, v, settings, 2.1, 10));
      }
      assert.deepEqual(sailPoint(0, 0, settings, 2.1), { x: 0, y: 0, z: 0 });
      assert.equal(sailPoint(1, 0, settings, 2.1).x, foot);
      assert.equal(sailPoint(0, 1, settings, 2.1).y, height);
    }
  }
});

test('draft and wind make a meaningful change to the sail belly', () => {
  const lowDraft = { ...DEFAULT_SAIL, draft: 6 };
  const highDraft = { ...DEFAULT_SAIL, draft: 18 };
  assert.ok(sailPoint(0.39, 0.4, highDraft, 1).z > sailPoint(0.39, 0.4, lowDraft, 1).z);
  assert.ok(sailPoint(0.39, 0.4, DEFAULT_SAIL, 1).z > sailPoint(0.39, 0.4, DEFAULT_SAIL, 0).z);
});

test('all slider extremes produce finite model and screen coordinates', () => {
  for (const height of [7, 11]) {
    for (const foot of [2.8, 5]) {
      for (const draft of [6, 18]) {
        const settings = { height, foot, draft, wind: 22 };
        for (const fill of [0, 1, 2.1]) {
          for (let j = 0; j <= 32; j++) {
            for (let i = 0; i <= 24; i++) {
              const point = sailPoint(i / 24, j / 32, settings, fill, 25);
              for (const width of [320, 660]) {
                const projected = projectSailPoint(point, settings, {
                  width,
                  height: 535,
                  scale: Math.min(width / 10.8, 535 / 12.1),
                });
                assert.ok(Object.values(point).every(Number.isFinite));
                assert.ok(Object.values(projected).every(Number.isFinite));
              }
            }
          }
        }
      }
    }
  }
});

test('wind remains bounded through long-running and delayed frames, then settles', () => {
  let dynamics = { fill: 0, velocity: 0 };
  let time = 0;
  for (let i = 0; i < 3600; i++) {
    const elapsed = i % 180 === 0 ? 30 : 1 / 60;
    time += Math.min(elapsed, 0.035);
    dynamics = stepSailWind(dynamics, 22, true, time, elapsed);
    assert.ok(dynamics.fill >= 0 && dynamics.fill <= 2.1);
    assert.ok(Number.isFinite(dynamics.velocity));
  }
  assert.ok(dynamics.fill > 1);
  for (let i = 0; i < 600; i++) {
    time += 1 / 60;
    dynamics = stepSailWind(dynamics, 22, false, time, 1 / 60);
  }
  assert.ok(dynamics.fill < 0.0007);
  assert.ok(Math.abs(dynamics.velocity) < 0.001);
});

test('zero wind remains still and zero elapsed time cannot advance dynamics', () => {
  assert.deepEqual(stepSailWind({ fill: 0, velocity: 0 }, 0, true, 100, 1 / 60), {
    fill: 0,
    velocity: 0,
  });
  const dynamics = { fill: 1, velocity: 0.2 };
  assert.deepEqual(stepSailWind(dynamics, 22, true, 100, 0), dynamics);
});
