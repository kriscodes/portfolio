import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paintKristianVoyageMap } from './painters';

function canvasContext() {
  const labels: string[] = [];
  const paths: number[][] = [];
  const gradient = { addColorStop() {} };
  const target: Record<PropertyKey, unknown> = {
    fillText(value: string) {
      labels.push(value);
    },
    measureText(value: string) {
      return { width: value.length * 12 };
    },
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  };
  const context = new Proxy(target, {
    get(object, key) {
      if (key in object) return object[key];
      return (...arguments_: unknown[]) => {
        if (['moveTo', 'lineTo', 'arc', 'translate', 'rotate'].includes(String(key)))
          paths.push(arguments_.filter((value): value is number => typeof value === 'number'));
      };
    },
    set(object, key, value) {
      object[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { context, labels, paths };
}

test('the Catalina map draws real coast geometry and moves the boat between both harbors', () => {
  for (const theme of [0, 1]) {
    const { context, labels, paths } = canvasContext();
    const start = paintKristianVoyageMap(context, 900, 560, { theme, progress: 0, direction: 1 });
    const middle = paintKristianVoyageMap(context, 900, 560, {
      theme,
      progress: 0.5,
      direction: 1,
    });
    const finish = paintKristianVoyageMap(context, 900, 560, {
      theme,
      progress: 1,
      direction: -1,
    });
    assert.ok(start && middle && finish, 'real map projection must be available');
    for (const result of [start, middle, finish]) {
      for (const point of [result.marina, result.avalon, result.boat]) {
        assert.ok(point);
        assert.equal(point.length, 2);
        assert.ok(point.every(Number.isFinite));
      }
    }
    assert.deepEqual(start.boat, start.marina);
    assert.deepEqual(finish.boat, finish.avalon);
    assert.notDeepEqual(middle.boat, start.boat);
    assert.notDeepEqual(middle.boat, finish.boat);
    assert.ok(labels.includes('MARINA DEL REY'));
    assert.ok(labels.includes('SANTA CATALINA'));
    assert.ok(!labels.some((label) => /map loading/i.test(label)));
    assert.ok(paths.length > 100, 'coastline and route paths should be drawn');
    assert.ok(paths.every((coordinates) => coordinates.every(Number.isFinite)));
  }
});
