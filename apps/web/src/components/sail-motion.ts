export const GUST_DURATION_MS = 8_400;

export type SailGust = {
  /** Normalized cloth fullness, from the resting shape to the filled shape. */
  fill: number;
  /** Small signed flutter used at the free edge; the renderer supplies its scale. */
  flutter: number;
  /** Normalized upper-sail twist, following the initial fill with a slight delay. */
  twist: number;
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
    return { fill: 0, flutter: 0, twist: 0, settled: true };
  }

  const time = Math.max(0, elapsedMs);
  const fillEnvelope = easeBetween(time, 0, 2_600) * (1 - easeBetween(time, 4_000, 8_400));
  const gentleVariation = 1 - 0.025 * Math.sin((Math.PI * time) / GUST_DURATION_MS) ** 2;
  const fill = fillEnvelope * gentleVariation;
  const twist = easeBetween(time, 450, 3_050) * (1 - easeBetween(time, 4_200, 8_000));
  const flutter = Math.sin((time / 1_000) * Math.PI * 2 * 1.8) * fill * 0.6;

  return { fill, flutter, twist, settled: false };
}
