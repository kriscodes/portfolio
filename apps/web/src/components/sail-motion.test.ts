import assert from 'node:assert/strict';
import test from 'node:test';
import { GUST_DURATION_MS, sampleSailGust } from './sail-motion';

test('a gust starts at rest, fills once, and finishes at exact rest without looping', () => {
  assert.deepEqual(sampleSailGust(0), { fill: 0, flutter: 0, twist: 0, settled: false });
  assert.ok(sampleSailGust(1_000).fill < sampleSailGust(2_000).fill);
  assert.ok(sampleSailGust(3_000).fill > 0.95);
  assert.ok(sampleSailGust(6_000).fill < sampleSailGust(4_000).fill);
  assert.ok(sampleSailGust(8_000).fill < 0.01);

  for (const elapsed of [GUST_DURATION_MS, GUST_DURATION_MS + 1, 60_000, 86_400_000]) {
    assert.deepEqual(sampleSailGust(elapsed), {
      fill: 0,
      flutter: 0,
      twist: 0,
      settled: true,
    });
  }
});

test('upper-sail twist follows the initial fill and relaxes before the final rest', () => {
  const rising = sampleSailGust(1_000);
  assert.ok(rising.twist > 0);
  assert.ok(rising.twist < rising.fill);
  assert.ok(sampleSailGust(3_200).twist > 0.99);
  assert.equal(sampleSailGust(8_000).twist, 0);
});

test('motion stays finite and changes gradually at ordinary and low frame rates', () => {
  for (const framesPerSecond of [24, 30, 60, 120]) {
    const interval = 1_000 / framesPerSecond;
    let previous = sampleSailGust(0);

    for (let time = interval; time <= GUST_DURATION_MS + interval; time += interval) {
      const current = sampleSailGust(time);
      assert.ok(current.fill >= 0 && current.fill <= 1);
      assert.ok(current.twist >= 0 && current.twist <= 1);
      assert.ok(Math.abs(current.flutter) <= 0.6);
      assert.ok(Math.abs(current.fill - previous.fill) < 0.035);
      assert.ok(Math.abs(current.twist - previous.twist) < 0.035);
      assert.ok(Math.abs(current.flutter - previous.flutter) < 0.3);
      previous = current;
    }
  }
});

test('start and finish are smooth, including the boundary between animation phases', () => {
  for (const boundary of [0, 450, 2_600, 3_050, 4_000, 4_200, 8_000, GUST_DURATION_MS]) {
    const before = sampleSailGust(boundary - 0.1);
    const after = sampleSailGust(boundary + 0.1);
    assert.ok(Math.abs(after.fill - before.fill) < 0.001);
    assert.ok(Math.abs(after.twist - before.twist) < 0.001);
    assert.ok(Math.abs(after.flutter - before.flutter) < 0.002);
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
      flutter: 0,
      twist: 0,
      settled: true,
    });
  }
});
