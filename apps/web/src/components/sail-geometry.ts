export type SailSettings = {
  height: number;
  foot: number;
  draft: number;
  wind: number;
};

export type SailPoint = { x: number; y: number; z: number };
export type SailDynamics = { fill: number; velocity: number };
export type SailViewport = { width: number; height: number; scale: number };

export const DEFAULT_SAIL: Readonly<SailSettings> = {
  height: 11,
  foot: 2.8,
  draft: 15,
  wind: 16,
};

export function sailPoint(
  u: number,
  v: number,
  settings: SailSettings,
  fill = 0,
  time = 0,
): SailPoint {
  const { height, foot } = settings;
  const load = Math.max(0, fill);
  const filled = Math.min(1, load);
  const chord = foot * (1 - v) + foot * 0.13 * Math.sin(Math.PI * v) + foot * 0.018 * v;
  const peak = 0.39;
  const normalizer = Math.pow(peak, 0.7) * Math.pow(1 - peak, 1.1);
  const section = u === 0 || u === 1 ? 0 : (Math.pow(u, 0.7) * Math.pow(1 - u, 1.1)) / normalizer;
  const draft = (settings.draft / 100) * (0.35 + 0.65 * filled) * (1 - 0.1 * Math.max(0, load - 1));
  const twist = (0.025 + 0.27 * load) * Math.pow(v, 1.35);
  const rake = 0.06 * foot * v + 0.012 * foot * Math.sin(Math.PI * v);
  const belly = chord * draft * section * (0.85 + 0.15 * Math.sin(Math.PI * v));
  const ripple =
    foot *
    0.0055 *
    Math.min(load, 1.5) *
    Math.pow(u, 5) *
    Math.sin(Math.PI * v) *
    Math.sin(time * 6.7 + v * 13.1);
  return {
    x: rake + u * chord * Math.cos(twist),
    y:
      height * v -
      0.035 * foot * Math.sin(Math.PI * u) * Math.pow(1 - v, 4) -
      0.026 * foot * (1 - filled) * Math.sin(Math.PI * u) * Math.sin(Math.PI * v),
    z: u * chord * Math.sin(twist) + belly + ripple,
  };
}

export function projectSailPoint(
  point: SailPoint,
  settings: SailSettings,
  viewport: SailViewport,
): SailPoint {
  const x = point.x - settings.foot * 0.36;
  const y = point.y - settings.height * 0.4;
  const z = point.z;
  const ax = 0.18;
  const ay = -0.48;
  const az = -0.94;
  const y1 = y * Math.cos(ax) - z * Math.sin(ax);
  const z1 = y * Math.sin(ax) + z * Math.cos(ax);
  const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
  const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
  const x3 = x2 * Math.cos(az) - y1 * Math.sin(az);
  const y3 = x2 * Math.sin(az) + y1 * Math.cos(az);
  return {
    x: viewport.width * 0.52 + x3 * viewport.scale,
    y: viewport.height * 0.51 - y3 * viewport.scale,
    z: z2,
  };
}

export function stepSailWind(
  dynamics: SailDynamics,
  windKnots: number,
  enabled: boolean,
  time: number,
  elapsed: number,
): SailDynamics {
  const dt = Math.max(0, Math.min(elapsed, 0.035));
  const variation = 0.96 + 0.035 * Math.sin(time * 0.83) + 0.018 * Math.sin(time * 1.71);
  const target = enabled ? (windKnots / 12) * variation : 0;
  const acceleration = (target - dynamics.fill) * 16 - dynamics.velocity * 6;
  const velocity = dynamics.velocity + acceleration * dt;
  return {
    velocity,
    fill: Math.max(0, Math.min(2.1, dynamics.fill + velocity * dt)),
  };
}
