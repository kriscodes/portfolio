import { createTelltalePath, sailTransform, sampleSailGust, type SailGust } from './sail-motion';

export type SailRenderer = {
  start: () => void;
  settle: () => void;
  dispose: () => void;
};

const RELEASE_DURATION_MS = 1_400;

/** Animate ordinary SVG elements without a canvas, GPU context, or idle loop. */
export function createSailRenderer(
  cloth: SVGGElement,
  telltale: SVGPathElement,
  onComplete: () => void,
): SailRenderer {
  let disposed = false;
  let frame = 0;
  let startedAt: number | null = null;
  let releasedAt: number | null = null;
  let releaseFrom: SailGust | null = null;
  let current = sampleSailGust(0);

  function draw(gust: SailGust, elapsedMs: number) {
    cloth.setAttribute('transform', sailTransform(gust));
    telltale.setAttribute('d', createTelltalePath(gust, elapsedMs));
  }

  function animate(now: number) {
    frame = 0;
    if (disposed) return;
    startedAt ??= now;
    const elapsedMs = now - startedAt;
    current = sampleSailGust(elapsedMs);

    if (releasedAt !== null && releaseFrom) {
      const progress = Math.min(1, (now - releasedAt) / RELEASE_DURATION_MS);
      const remaining = 1 - progress * progress * (3 - 2 * progress);
      current = {
        fill: releaseFrom.fill * remaining,
        settled: progress === 1,
      };
    }

    draw(current, elapsedMs);
    if (current.settled) {
      onComplete();
      return;
    }
    frame = requestAnimationFrame(animate);
  }

  return {
    start() {
      if (!disposed && !frame && startedAt === null) frame = requestAnimationFrame(animate);
    },
    settle() {
      if (disposed || releasedAt !== null) return;
      releasedAt = performance.now();
      releaseFrom = current;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      draw(sampleSailGust(0), 0);
    },
  };
}
