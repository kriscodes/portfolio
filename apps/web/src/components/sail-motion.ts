export const GUST_DURATION_MS = 8_400;

export const SAIL_ANCHORS = {
  tack: { x: 80, y: 1_118 },
  head: { x: 1_087, y: 56 },
  clew: { x: 1_311, y: 1_090 },
} as const;
export const SAIL_MAX_CLEW_DISPLACEMENT = 3.5;

export const TELLTALE_SHAPE = {
  restingLength: 72,
  streamingLength: 90,
  restingDroop: 20,
  maximumWave: 3,
  rootWidth: 3,
  tipWidth: 0.8,
  waveCyclesPerSecond: 1.35,
} as const;

export type SailGust = {
  /** Normalized gust strength, from still air to the fully streaming telltale. */
  fill: number;
  settled: boolean;
};

/** Quintic easing keeps velocity and acceleration continuous at both endpoints. */
function easeBetween(elapsedMs: number, startMs: number, endMs: number): number {
  const progress = Math.max(0, Math.min(1, (elapsedMs - startMs) / (endMs - startMs)));
  const eased = progress ** 3 * (progress * (progress * 6 - 15) + 10);
  return Math.max(0, Math.min(1, eased));
}

/**
 * A deliberately paced illustration of one gust, rather than a physics simulation.
 * Sampling elapsed time makes the result independent of frame rate or missed frames.
 */
export function sampleSailGust(elapsedMs: number): SailGust {
  if (!Number.isFinite(elapsedMs) || elapsedMs >= GUST_DURATION_MS) {
    return { fill: 0, settled: true };
  }

  const time = Math.max(0, elapsedMs);
  const fillEnvelope = easeBetween(time, 0, 2_600) * (1 - easeBetween(time, 4_000, 8_400));
  const gentleVariation = 1 - 0.025 * Math.sin((Math.PI * time) / GUST_DURATION_MS) ** 2;
  const fill = fillEnvelope * gentleVariation;
  return { fill, settled: false };
}

function normalizedFill(gust: SailGust): number {
  if (gust.settled || !Number.isFinite(gust.fill)) return 0;
  return Math.max(0, Math.min(1, gust.fill));
}

/**
 * Affine tension preserves straight seams and the entire inclined leading edge.
 * The trailing corner moves only 3.5 artwork pixels; the image never folds over itself.
 */
export function sailTransform(gust: SailGust): string {
  const fill = normalizedFill(gust);
  if (fill === 0) return 'matrix(1 0 0 1 0 0)';

  const { tack, head, clew } = SAIL_ANCHORS;
  const leadingEdgeSlope = (tack.x - head.x) / (tack.y - head.y);
  const leadingEdgeIntercept = head.x - leadingEdgeSlope * head.y;
  const leadingEdgeAtClew = leadingEdgeSlope * clew.y + leadingEdgeIntercept;
  const compression = (SAIL_MAX_CLEW_DISPLACEMENT * fill) / (clew.x - leadingEdgeAtClew);

  // SVG matrix order is [a, b, c, d, e, f]. Only x changes; y remains fixed.
  const matrix = [
    1 - compression,
    0,
    compression * leadingEdgeSlope,
    1,
    compression * leadingEdgeIntercept,
    0,
  ];
  return `matrix(${matrix.map((value) => Number(value.toFixed(9))).join(' ')})`;
}

type RibbonPoint = { x: number; y: number };

function pointText(point: RibbonPoint): string {
  return `${Number(point.x.toFixed(3))} ${Number(point.y.toFixed(3))}`;
}

/** Quadratic segments smooth the sampled ribbon without overshooting its narrow outline. */
function smoothRibbonEdge(points: RibbonPoint[], firstCommand: 'M' | 'L'): string {
  const commands = [`${firstCommand} ${pointText(points[0])}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    const endpoint =
      index === points.length - 2 ? next : { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
    commands.push(`Q ${pointText(point)} ${pointText(endpoint)}`);
  }
  return commands.join(' ');
}

/**
 * A thin, independent ribbon relative to its fixed attachment at (0, 0).
 * Continue elapsed time while releasing the gust so its traveling wave never changes phase.
 */
export function createTelltalePath(gust: SailGust, elapsedMs: number): string {
  const fill = normalizedFill(gust);
  const elapsedSeconds = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) / 1_000 : 0;
  const { restingLength, streamingLength, restingDroop, maximumWave, rootWidth, tipWidth } =
    TELLTALE_SHAPE;
  const length = restingLength + (streamingLength - restingLength) * fill;
  const droop = restingDroop * (1 - fill);
  const upper: RibbonPoint[] = [];
  const lower: RibbonPoint[] = [];
  const segments = 20;

  for (let index = 0; index <= segments; index += 1) {
    const position = index / segments;
    const freedom = position ** 2;
    // Decreasing temporal phase sends each crest from the attachment toward the tip.
    const phase = Math.PI * 2 * (position - elapsedSeconds * TELLTALE_SHAPE.waveCyclesPerSecond);
    const wave = maximumWave * fill * freedom * Math.sin(phase);
    const center = droop * freedom + wave;
    const halfWidth = (rootWidth + (tipWidth - rootWidth) * position) / 2;
    const x = length * position;
    upper.push({ x, y: center - halfWidth });
    lower.push({ x, y: center + halfWidth });
  }

  return `${smoothRibbonEdge(upper, 'M')} ${smoothRibbonEdge(lower.reverse(), 'L')} Z`;
}
