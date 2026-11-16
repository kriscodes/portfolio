import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTelltalePath,
  GUST_DURATION_MS,
  SAIL_ANCHORS,
  SAIL_MAX_CLEW_DISPLACEMENT,
  sailTransform,
  sampleSailGust,
  TELLTALE_SHAPE,
  type SailGust,
} from './sail-motion';

test('a gust starts at rest, fills once, and finishes at exact rest without looping', () => {
  assert.deepEqual(sampleSailGust(0), { fill: 0, settled: false });
  assert.ok(sampleSailGust(1_000).fill < sampleSailGust(2_000).fill);
  assert.ok(sampleSailGust(3_000).fill > 0.95);
  assert.ok(sampleSailGust(6_000).fill < sampleSailGust(4_000).fill);
  assert.ok(sampleSailGust(8_000).fill < 0.01);

  for (const elapsed of [GUST_DURATION_MS, GUST_DURATION_MS + 1, 60_000, 86_400_000]) {
    assert.deepEqual(sampleSailGust(elapsed), {
      fill: 0,
      settled: true,
    });
  }
});

test('motion stays finite and changes gradually at ordinary and low frame rates', () => {
  for (const framesPerSecond of [24, 30, 60, 120]) {
    const interval = 1_000 / framesPerSecond;
    let previous = sampleSailGust(0);

    for (let time = interval; time <= GUST_DURATION_MS + interval; time += interval) {
      const current = sampleSailGust(time);
      assert.ok(current.fill >= 0 && current.fill <= 1);
      assert.ok(Math.abs(current.fill - previous.fill) < 0.035);
      previous = current;
    }
  }
});

test('start and finish are smooth, including the boundary between animation phases', () => {
  for (const boundary of [0, 2_600, 4_000, GUST_DURATION_MS]) {
    const before = sampleSailGust(boundary - 0.1);
    const after = sampleSailGust(boundary + 0.1);
    assert.ok(Math.abs(after.fill - before.fill) < 0.001);
  }

  assert.ok(sampleSailGust(1).fill < 0.000001);
  assert.ok(sampleSailGust(GUST_DURATION_MS - 1).fill < 0.000001);
});

test('sampling does not depend on previous frames and invalid input safely rests', () => {
  const expected = sampleSailGust(5_000);
  sampleSailGust(500);
  sampleSailGust(8_000);
  assert.deepEqual(sampleSailGust(5_000), expected);
  assert.deepEqual(sampleSailGust(-500), sampleSailGust(0));

  for (const elapsed of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.deepEqual(sampleSailGust(elapsed), {
      fill: 0,
      settled: true,
    });
  }
});

const fullGust: SailGust = { fill: 1, settled: false };

function numbersIn(value: string): number[] {
  return [...value.matchAll(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)].map(([number]) => Number(number));
}

function transformedPoint(transform: string, point: { x: number; y: number }) {
  const [a, b, c, d, e, f] = numbersIn(transform);
  return { x: a * point.x + c * point.y + e, y: b * point.x + d * point.y + f };
}

test('the sail transform fixes the inclined luff and never folds the artwork', () => {
  for (let time = 0; time <= GUST_DURATION_MS; time += 40) {
    const transform = sailTransform(sampleSailGust(time));
    const [a, b, c, d] = numbersIn(transform);
    assert.ok(a * d - b * c > 0.95, 'the cloth keeps its orientation and over 95% of its area');

    for (const anchor of [SAIL_ANCHORS.head, SAIL_ANCHORS.tack]) {
      const point = transformedPoint(transform, anchor);
      assert.ok(Math.abs(point.x - anchor.x) < 0.00001);
      assert.equal(point.y, anchor.y);
    }

    const clew = transformedPoint(transform, SAIL_ANCHORS.clew);
    assert.equal(clew.y, SAIL_ANCHORS.clew.y);
    assert.ok(Math.abs(clew.x - SAIL_ANCHORS.clew.x) <= SAIL_MAX_CLEW_DISPLACEMENT + 0.00001);
  }

  const clew = transformedPoint(sailTransform(fullGust), SAIL_ANCHORS.clew);
  assert.ok(Math.abs(SAIL_ANCHORS.clew.x - clew.x - SAIL_MAX_CLEW_DISPLACEMENT) < 0.00001);
  const mobileDisplacement = ((SAIL_ANCHORS.clew.x - clew.x) * 320) / 1_350;
  assert.ok(mobileDisplacement >= 10, 'the gust remains visible at a narrow artwork width');
  assert.equal(sailTransform(sampleSailGust(GUST_DURATION_MS)), 'matrix(1 0 0 1 0 0)');
});

test('the independent ribbon has a fixed attachment, tapered tip, and restrained wave', () => {
  for (let time = 0; time < 2_000; time += 25) {
    const path = createTelltalePath(fullGust, time);
    const [upper, lower] = path.split(' L ');
    const upperNumbers = numbersIn(upper);
    const lowerNumbers = numbersIn(lower);
    assert.deepEqual(upperNumbers.slice(0, 2), [0, -TELLTALE_SHAPE.rootWidth / 2]);
    assert.deepEqual(lowerNumbers.slice(-2), [0, TELLTALE_SHAPE.rootWidth / 2]);
    assert.equal(upperNumbers.at(-2), TELLTALE_SHAPE.streamingLength);
    assert.equal(lowerNumbers[0], TELLTALE_SHAPE.streamingLength);
    assert.ok(Math.abs(lowerNumbers[1] - upperNumbers.at(-1)! - TELLTALE_SHAPE.tipWidth) < 0.002);
    assert.ok(path.endsWith(' Z'));

    for (let index = 1; index < upperNumbers.length; index += 2) {
      assert.ok(
        Math.abs(upperNumbers[index]) <= TELLTALE_SHAPE.maximumWave + TELLTALE_SHAPE.rootWidth / 2,
      );
    }
  }
});

test('the ribbon rests with a slight droop and returns to the exact same shape', () => {
  const rest = sampleSailGust(0);
  const path = createTelltalePath(rest, 0);
  const upper = numbersIn(path.split(' L ')[0]);
  assert.equal(upper.at(-2), TELLTALE_SHAPE.restingLength);
  assert.equal(upper.at(-1), TELLTALE_SHAPE.restingDroop - TELLTALE_SHAPE.tipWidth / 2);

  for (const time of [100, 2_500, GUST_DURATION_MS, 60_000]) {
    assert.equal(createTelltalePath(rest, time), path);
    assert.equal(createTelltalePath({ ...fullGust, settled: true }, time), path);
  }
  assert.equal(createTelltalePath(sampleSailGust(GUST_DURATION_MS), GUST_DURATION_MS), path);
});

test('a ribbon wave travels from its attachment toward the tip', () => {
  function waveAt(position: number, time: number) {
    const upper = createTelltalePath(fullGust, time).split(' L ')[0];
    const controls = [...upper.matchAll(/Q (-?[\d.]+) (-?[\d.]+)/g)];
    const point = controls.find(
      ([, x]) => Math.abs(Number(x) / TELLTALE_SHAPE.streamingLength - position) < 0.001,
    );
    assert.ok(point);
    const halfWidth =
      (TELLTALE_SHAPE.rootWidth + (TELLTALE_SHAPE.tipWidth - TELLTALE_SHAPE.rootWidth) * position) /
      2;
    return (Number(point[2]) + halfWidth) / position ** 2;
  }

  const downstreamDelay = (0.25 / TELLTALE_SHAPE.waveCyclesPerSecond) * 1_000;
  assert.ok(waveAt(0.25, 0) > 2.9);
  assert.ok(waveAt(0.5, downstreamDelay) > 2.9);
  assert.ok(Math.abs(waveAt(0.25, 0) - waveAt(0.5, downstreamDelay)) < 0.02);
});

test('ribbon shape stays continuous through a gradual release and handles invalid inputs', () => {
  let previous = numbersIn(createTelltalePath(fullGust, 3_000));
  for (let frame = 1; frame <= 84; frame += 1) {
    const progress = frame / 84;
    const remaining = 1 - progress * progress * (3 - 2 * progress);
    const gust = { ...fullGust, fill: remaining, settled: progress === 1 };
    const current = numbersIn(createTelltalePath(gust, 3_000 + frame * (1_000 / 60)));
    assert.equal(current.length, previous.length);
    assert.ok(current.every((value, index) => Math.abs(value - previous[index]) < 1));
    previous = current;
  }

  const invalid = { ...fullGust, fill: Number.NaN };
  assert.equal(sailTransform(invalid), 'matrix(1 0 0 1 0 0)');
  assert.equal(createTelltalePath(invalid, Number.NaN), createTelltalePath(sampleSailGust(0), 0));
});
