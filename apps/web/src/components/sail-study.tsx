'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_SAIL,
  projectSailPoint,
  sailPoint,
  stepSailWind,
  type SailPoint,
  type SailSettings,
} from './sail-geometry';

type ScreenPoint = Pick<SailPoint, 'x' | 'y'>;
type Coordinates = [number, number];
type Renderer = {
  update: (settings: SailSettings, windEnabled: boolean, settingsOpen: boolean) => void;
  destroy: () => void;
};
type ColorName = 'low' | 'high' | 'thread' | 'edge' | 'paper' | 'ink' | 'muted' | 'shadow';

function createSailRenderer(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  onAutomaticStop: () => void,
): Renderer | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ctx: CanvasRenderingContext2D = context;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const theme = window.matchMedia('(prefers-color-scheme: dark)');
  const viewport = { width: 0, height: 0, scale: 1 };
  const rows = 32;
  const columns = 24;
  const vertices: { u: number; v: number }[] = [];
  const faces: number[][] = [];
  const colors = {} as Record<ColorName, string>;
  let low: number[] = [];
  let high: number[] = [];
  let weave: CanvasPattern | null = null;
  let state: SailSettings = { ...DEFAULT_SAIL };
  let settingsOpen = true;
  let windEnabled = false;
  let inView = true;
  let disposed = false;
  let frame = 0;
  let last = 0;
  let time = 0;
  let dynamics = { fill: 0, velocity: 0 };
  const index = (i: number, j: number) => j * (columns + 1) + i;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= columns; i++) vertices.push({ u: i / columns, v: j / rows });
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      faces.push([index(i, j), index(i + 1, j), index(i + 1, j + 1), index(i, j + 1)]);
    }
  }

  function resolveColors() {
    const style = getComputedStyle(root);
    const sample = document.createElement('span');
    sample.style.display = 'none';
    root.appendChild(sample);
    const tokens: Record<ColorName, [string, string]> = {
      low: ['--s4-cloth-low', '#bec5ce'],
      high: ['--s4-cloth-high', '#fcfdfe'],
      thread: ['--s4-thread', '#525c6b'],
      edge: ['--t3-edge', '#565d6b'],
      paper: ['--t3-paper', '#f6f6f4'],
      ink: ['--t3-ink', '#1d1e21'],
      muted: ['--t3-muted', '#686c73'],
      shadow: ['--t3-shadow', '#343d4e1a'],
    };
    for (const name of Object.keys(tokens) as ColorName[]) {
      const [token, fallback] = tokens[name];
      sample.style.color = style.getPropertyValue(token).trim() || fallback;
      colors[name] = getComputedStyle(sample).color;
    }
    sample.remove();
    low = (colors.low.match(/[\d.]+/g) || ['190', '197', '206']).slice(0, 3).map(Number);
    high = (colors.high.match(/[\d.]+/g) || ['252', '253', '254']).slice(0, 3).map(Number);
    const tile = document.createElement('canvas');
    tile.width = 12;
    tile.height = 12;
    const pen = tile.getContext('2d');
    if (!pen) return;
    pen.strokeStyle = colors.thread;
    pen.globalAlpha = 0.12;
    pen.lineWidth = 0.45;
    for (let i = 0; i <= 12; i += 3) {
      pen.beginPath();
      pen.moveTo(i, 0);
      pen.lineTo(i, 12);
      pen.stroke();
      pen.beginPath();
      pen.moveTo(0, i + 0.5);
      pen.lineTo(12, i + 0.5);
      pen.stroke();
    }
    pen.fillStyle = colors.high;
    pen.globalAlpha = 0.34;
    for (let x = 0; x < 12; x += 3) {
      for (let y = 0; y < 12; y += 3) {
        if ((x + y) % 6 === 0) pen.fillRect(x, y, 1.5, 1.5);
      }
    }
    weave = ctx.createPattern(tile, 'repeat');
  }

  const model = (u: number, v: number) => sailPoint(u, v, state, dynamics.fill, time);
  const project = (point: SailPoint) => projectSailPoint(point, state, viewport);
  const at = (u: number, v: number) => project(model(u, v));
  function path(points: ScreenPoint[]) {
    ctx.beginPath();
    points.forEach((point, i) => (i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
  }
  function curve(points: ScreenPoint[], stroke: string, alpha = 1, lineWidth = 1) {
    path(points);
    ctx.strokeStyle = stroke;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function sampleLine(fn: (position: number) => Coordinates, count = 60) {
    const result: SailPoint[] = [];
    for (let i = 0; i <= count; i++) result.push(at(...fn(i / count)));
    return result;
  }
  function patch(center: Coordinates, a: Coordinates, b: Coordinates) {
    const outer = [at(...center), at(...a), at(...b)];
    path(outer);
    ctx.closePath();
    ctx.fillStyle = colors.high;
    ctx.globalAlpha = 0.36;
    ctx.fill();
    ctx.globalAlpha = 1;
    for (const size of [0.35, 0.56, 0.78, 1]) {
      const pa: Coordinates = [
        center[0] + (a[0] - center[0]) * size,
        center[1] + (a[1] - center[1]) * size,
      ];
      const pb: Coordinates = [
        center[0] + (b[0] - center[0]) * size,
        center[1] + (b[1] - center[1]) * size,
      ];
      curve([at(...pa), at(...pb)], colors.thread, 0.28, 0.55);
    }
    curve([...outer, outer[0]], colors.thread, 0.24, 0.55);
  }
  function dimension(a: ScreenPoint, b: ScreenPoint, label: string) {
    const { width, height } = viewport;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length < 30) return;
    let nx = -dy / length;
    let ny = dx / length;
    const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (nx * (middle.x - width * 0.52) + ny * (middle.y - height * 0.51) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const p = { x: a.x + nx * 15, y: a.y + ny * 15 };
    const q = { x: b.x + nx * 15, y: b.y + ny * 15 };
    curve([p, q], colors.muted, 0.55, 0.55);
    for (const tip of [p, q]) {
      curve(
        [
          { x: tip.x - nx * 3, y: tip.y - ny * 3 },
          { x: tip.x + nx * 3, y: tip.y + ny * 3 },
        ],
        colors.muted,
        0.7,
        0.6,
      );
    }
    ctx.font = '11px "IBM Plex Mono", monospace';
    const measure = ctx.measureText(label).width;
    const x = Math.max(measure / 2 + 8, Math.min(width - measure / 2 - 8, middle.x + nx * 25));
    const y = Math.max(15, Math.min(height - 10, middle.y + ny * 25));
    ctx.fillStyle = colors.paper;
    ctx.fillRect(x - measure / 2 - 3, y - 9, measure + 6, 14);
    ctx.fillStyle = colors.muted;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 2);
    ctx.textAlign = 'left';
  }
  function paint() {
    const { width, height, scale } = viewport;
    if (!width || !height || disposed) return;
    ctx.clearRect(0, 0, width, height);
    const shadow = ctx.createRadialGradient(
      width * 0.49,
      height * 0.8,
      1,
      width * 0.49,
      height * 0.8,
      width * 0.32,
    );
    shadow.addColorStop(0, colors.shadow);
    shadow.addColorStop(1, 'transparent');
    ctx.fillStyle = shadow;
    ctx.save();
    ctx.translate(0, height * 0.61);
    ctx.scale(1, 0.22);
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    const world = vertices.map(({ u, v }) => model(u, v));
    const screen = world.map(project);
    const ordered = faces
      .map((ids) => ({ ids, z: ids.reduce((value, id) => value + screen[id].z, 0) / 4 }))
      .sort((a, b) => a.z - b.z);
    for (const face of ordered) {
      const [a, b, , d] = face.ids.map((id) => world[id]);
      const ux = b.x - a.x;
      const uy = b.y - a.y;
      const uz = b.z - a.z;
      const vx = d.x - a.x;
      const vy = d.y - a.y;
      const vz = d.z - a.z;
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      const norm = Math.hypot(nx, ny, nz) || 1;
      const light = Math.abs((nx * -0.2 + ny * 0.3 + nz * 0.93) / norm);
      const shade = Math.max(0.15, Math.min(0.99, 0.29 + 0.68 * light));
      const rgb = low.map((value, i) => Math.round(value + (high[i] - value) * shade));
      const fill = `rgb(${rgb.join(',')})`;
      path(face.ids.map((id) => screen[id]));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.strokeStyle = fill;
      ctx.lineWidth = 0.45;
      ctx.fill();
      ctx.stroke();
    }
    if (weave) {
      const outline = [
        ...sampleLine((t) => [0, t]),
        ...sampleLine((t) => [1, 1 - t]),
        ...sampleLine((t) => [1 - t, 0]),
      ];
      ctx.save();
      path(outline);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = weave;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
    for (const v of [0.13, 0.27, 0.41, 0.55, 0.69, 0.83]) {
      curve(
        sampleLine((u) => [u, v]),
        colors.thread,
        0.22,
        0.7,
      );
      curve(
        sampleLine((u) => [u, v + 0.004]),
        colors.thread,
        0.16,
        0.35,
      );
    }
    patch([0.005, 0.005], [0.34, 0], [0, 0.18]);
    patch([0.995, 0.003], [0.67, 0], [1, 0.18]);
    patch([0.4, 0.997], [0, 0.87], [1, 0.87]);
    for (const v of [0.34, 0.64])
      curve(
        sampleLine((u) => [0.035 + u * 0.94, v]),
        colors.thread,
        0.3,
        1.2,
      );
    for (const batten of [
      { v: 0.23, start: 0.6 },
      { v: 0.46, start: 0.48 },
      { v: 0.69, start: 0.24 },
      { v: 0.84, start: 0.04 },
    ]) {
      const points = sampleLine((t) => [batten.start + (1 - batten.start) * t, batten.v]);
      curve(points, colors.high, 0.8, 2.7);
      curve(points, colors.thread, 0.32, 0.55);
      curve(
        sampleLine((t) => [batten.start + (1 - batten.start) * t, batten.v + 0.005]),
        colors.thread,
        0.18,
        0.45,
      );
    }
    curve(
      sampleLine((t) => [0, t]),
      colors.edge,
      0.65,
      1.7,
    );
    curve(
      sampleLine((t) => [1, t]),
      colors.edge,
      0.55,
      0.9,
    );
    curve(
      sampleLine((t) => [t, 0]),
      colors.edge,
      0.6,
      1.1,
    );
    for (const [u, v] of [
      [0.02, 0.013],
      [0.975, 0.009],
      [0.45, 0.992],
    ]) {
      const point = at(u, v);
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1.8, scale * 0.045), 0, Math.PI * 2);
      ctx.fillStyle = colors.paper;
      ctx.strokeStyle = colors.edge;
      ctx.lineWidth = 0.9;
      ctx.fill();
      ctx.stroke();
    }
    const mark = at(0.24, 0.62);
    const along = at(0.44, 0.62);
    ctx.save();
    ctx.translate(mark.x, mark.y);
    ctx.rotate(Math.atan2(along.y - mark.y, along.x - mark.x));
    ctx.fillStyle = colors.thread;
    ctx.globalAlpha = 0.5;
    ctx.font = `500 ${Math.max(12, scale * 0.4)}px "Instrument Sans", sans-serif`;
    ctx.fillText('KS', 0, 0);
    ctx.font = `${Math.max(9, scale * 0.24)}px "IBM Plex Mono", monospace`;
    ctx.fillText('01', 0, Math.max(11, scale * 0.31));
    ctx.restore();
    for (const v of [0.43, 0.66, 0.83]) {
      const point = model(1, v);
      const a = project(point);
      const b = project({ x: point.x + state.foot * 0.1, y: point.y, z: point.z + 0.04 });
      const load = Math.min(1, dynamics.fill);
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const tx = (b.x - a.x) / length;
      const ty = (b.y - a.y) / length;
      const points: ScreenPoint[] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const flutter = load * 1.6 * Math.sin(time * 8.3 + v * 9 - t * 5) * t;
        points.push({
          x: a.x + tx * length * t * load - ty * flutter,
          y: a.y + ty * length * t * load + tx * flutter + (1 - load) * 8 * t,
        });
      }
      curve(points, colors.edge, 0.7, 0.7);
    }
    if (settingsOpen) {
      dimension(at(0, 0), at(0, 1), `Luff ${state.height.toFixed(1)} m`);
      dimension(at(0, 0), at(1, 0), `Foot ${state.foot.toFixed(1)} m`);
    }
  }
  function stopFrame() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }
  function settleImmediately() {
    const wasEnabled = windEnabled;
    windEnabled = false;
    dynamics = { fill: 0, velocity: 0 };
    stopFrame();
    paint();
    if (wasEnabled) onAutomaticStop();
  }
  function animate(now: number) {
    frame = 0;
    if (disposed) return;
    if (!inView || document.hidden) {
      settleImmediately();
      return;
    }
    const dt = last ? Math.min((now - last) / 1000, 0.035) : 1 / 60;
    last = now;
    time += dt;
    dynamics = stepSailWind(dynamics, state.wind, windEnabled, time, dt);
    paint();
    if (!windEnabled && dynamics.fill < 0.0007 && Math.abs(dynamics.velocity) < 0.001) {
      dynamics = { fill: 0, velocity: 0 };
      last = 0;
      paint();
      return;
    }
    frame = requestAnimationFrame(animate);
  }
  function resize() {
    if (disposed) return;
    const box = canvas.getBoundingClientRect();
    viewport.width = box.width;
    viewport.height = box.height;
    viewport.scale = Math.min(box.width / 10.8, box.height / 12.1);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    resolveColors();
    paint();
  }
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) settleImmediately();
    },
    { threshold: 0 },
  );
  const refreshTheme = () => {
    resolveColors();
    paint();
  };
  const onVisibility = () => {
    if (document.hidden) settleImmediately();
  };
  const mutationObserver = new MutationObserver(refreshTheme);
  mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });
  mutationObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });
  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  motion.addEventListener('change', settleImmediately);
  theme.addEventListener('change', refreshTheme);
  resize();
  document.fonts.ready
    .then(() => {
      if (!disposed) paint();
    })
    .catch(() => {});

  return {
    update(settings, enabled, open) {
      if (disposed) return;
      state = settings;
      settingsOpen = open;
      windEnabled = enabled && state.wind > 0;
      if (motion.matches) {
        stopFrame();
        dynamics = { fill: windEnabled ? state.wind / 12 : 0, velocity: 0 };
      } else if (
        (windEnabled || dynamics.fill > 0 || dynamics.velocity !== 0) &&
        !frame &&
        inView &&
        !document.hidden
      ) {
        last = 0;
        frame = requestAnimationFrame(animate);
      }
      paint();
    },
    destroy() {
      disposed = true;
      stopFrame();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', settleImmediately);
      theme.removeEventListener('change', refreshTheme);
    },
  };
}

const controls: {
  key: keyof SailSettings;
  label: string;
  detail?: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: 'height', label: 'Height', detail: 'Luff', min: 7, max: 11, step: 0.1 },
  { key: 'foot', label: 'Width', detail: 'Foot', min: 2.8, max: 5, step: 0.1 },
  { key: 'draft', label: 'Draft', min: 6, max: 18, step: 1 },
  { key: 'wind', label: 'Wind', min: 0, max: 22, step: 1 },
];

function valueText(key: keyof SailSettings, value: number) {
  return key === 'height' || key === 'foot'
    ? `${value.toFixed(1)} m`
    : `${value}${key === 'draft' ? '%' : ' kn'}`;
}

export default function SailStudy({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SailSettings>({ ...DEFAULT_SAIL });
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [windEnabled, setWindEnabled] = useState(false);
  const [available, setAvailable] = useState(true);
  const [enhanced, setEnhanced] = useState(false);
  const [status, setStatus] = useState('The sail is at rest. Wind response is illustrative.');
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    const root = sectionRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const renderer = createSailRenderer(root, canvas, () => {
      setWindEnabled(false);
      setStatus('Wind paused. The sail is at rest.');
    });
    if (!renderer) {
      setAvailable(false);
      return;
    }
    rendererRef.current = renderer;
    setEnhanced(true);
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.update(settings, windEnabled, settingsOpen);
  }, [settings, settingsOpen, windEnabled]);

  function toggleWind() {
    const enabled = !windEnabled;
    setWindEnabled(enabled);
    setStatus(
      enabled
        ? `Wind on at ${settings.wind} knots. The sail fills and the upper sections open. Wind response is illustrative.`
        : 'Wind stopped. The sail is settling.',
    );
  }

  return (
    <section
      className="t3-hero"
      ref={sectionRef}
      aria-label="Introduction with interactive sail study"
    >
      {children}
      <div className="t3-art">
        <img
          src="/sail-rest.svg"
          className="sail-static-fallback"
          width="660"
          height="535"
          hidden={enhanced}
          alt="A silver triangular mainsail with panel seams, battens and reinforced corners."
        />
        <canvas
          ref={canvasRef}
          id="t3-canvas"
          role="img"
          hidden={!enhanced}
          aria-label={`A triangular mainsail, ${settings.height.toFixed(1)} metres high and ${settings.foot.toFixed(1)} metres wide, with woven cloth, panel seams, battens and reinforced corners. ${windEnabled ? `Wind is on at ${settings.wind} knots.` : 'The sail is at rest.'}`}
        >
          An illustrative sail form study. Adjust the controls to change its dimensions and wind.
        </canvas>
        {!available && (
          <p className="sail-fallback">
            The interactive sail study needs Canvas support. This is its resting form.
          </p>
        )}
      </div>
      <div className="t3-controls" hidden={!enhanced}>
        <div className="t3-tune">
          <button
            type="button"
            id="s4-settings-toggle"
            className="t3-tune-toggle"
            aria-expanded={settingsOpen}
            aria-controls="s4-settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            Sail settings<span aria-hidden="true">+</span>
          </button>
        </div>
        <button
          type="button"
          id="s4-wind-toggle"
          className="t3-gust"
          aria-pressed={windEnabled}
          disabled={!available || settings.wind === 0}
          onClick={toggleWind}
        >
          {windEnabled ? 'Stop wind' : settings.wind === 0 ? 'Still air' : 'Start wind'}
        </button>
      </div>
      <div id="s4-settings" className="s4-settings" hidden={!enhanced || !settingsOpen}>
        {controls.map(({ key, label, detail, min, max, step }) => (
          <div className="s4-control" key={key}>
            <label htmlFor={`s4-${key}`}>
              {label} {detail && <span>{detail}</span>}
              <output id={`s4-${key}-value`} htmlFor={`s4-${key}`}>
                {valueText(key, settings[key])}
              </output>
            </label>
            <input
              id={`s4-${key}`}
              type="range"
              min={min}
              max={max}
              step={step}
              value={settings[key]}
              aria-valuetext={valueText(key, settings[key])}
              onChange={(event) => {
                const value = Number(event.target.value);
                setSettings((current) => ({ ...current, [key]: value }));
                if (key === 'wind' && value === 0) {
                  setWindEnabled(false);
                  setStatus('Still air. The sail is settling.');
                }
              }}
            />
          </div>
        ))}
      </div>
      <noscript>
        <p className="sail-fallback">
          Enable JavaScript to adjust the sail and explore its wind response.
        </p>
      </noscript>
      <p className="t3-sr" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
