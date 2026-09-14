'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

type Point = { x: number; y: number };
type Settings = { bearing: number; strength: number; paused: boolean; point: Point };
type Particle = Point & { age: number; life: number; ink: number };
const PAPER = '#e8eadd';
const PRESETS = ['Drift', 'Breeze', 'Gust'];
const INITIAL_POINT = { x: 0.52, y: 0.48 };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

// A small, deterministic vector field. This is an expressive study, not weather data.
function velocity(x: number, y: number, angle: number, point: Point, time: number) {
  const dx = x - point.x;
  const dy = y - point.y;
  const radius = Math.sqrt(dx * dx + dy * dy) + 0.035;
  const curl = Math.exp(-radius * 3.8) * 2.5;
  return {
    x: Math.cos(angle) * 0.62 - (dy / radius) * curl + Math.sin(y * 9 + time * 0.1) * 0.15,
    y: Math.sin(angle) * 0.62 + (dx / radius) * curl + Math.cos(x * 8 - time * 0.08) * 0.13,
  };
}

export default function WindStudy() {
  const [bearing, setBearing] = useState(65);
  const [strength, setStrength] = useState(1);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [available, setAvailable] = useState(true);
  const [point, setPoint] = useState<Point>(INITIAL_POINT);
  const [announcement, setAnnouncement] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useRef<Settings>({ bearing, strength, paused, point });
  const redraw = useRef<() => void>(() => {});
  settings.current = { bearing, strength, paused: paused || reducedMotion, point };

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      setAvailable(false);
      return;
    }
    let width = 1;
    let height = 1;
    let frame = 0;
    let visible = false;
    let lastTime = 0;
    let elapsed = 0;
    let seed = 3210;
    let particles: Particle[] = [];
    let currentAngle = ((settings.current.bearing - 90) * Math.PI) / 180;
    const currentPoint = { ...settings.current.point };
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const makeParticle = (): Particle => ({
      x: random(),
      y: random(),
      age: 0,
      life: 90 + random() * 100,
      ink: random(),
    });
    const colors = ['#193e33', '#547064', '#87947d', '#b13c21'];

    function clear() {
      context!.fillStyle = PAPER;
      context!.fillRect(0, 0, width, height);
    }

    function drawStill() {
      clear();
      currentAngle = ((settings.current.bearing - 90) * Math.PI) / 180;
      Object.assign(currentPoint, settings.current.point);
      context!.lineWidth = 0.75;
      const spacing = width < 500 ? 29 : 31;
      // Streamlines keep the interaction meaningful when animation is paused or reduced.
      for (let py = -20; py < height + 20; py += spacing) {
        for (let px = -20; px < width + 20; px += spacing) {
          let x = px / width;
          let y = py / height;
          context!.strokeStyle = colors[Math.round(px + py) % 7 === 0 ? 3 : 1];
          context!.globalAlpha = 0.36;
          context!.beginPath();
          context!.moveTo(x * width, y * height);
          for (let i = 0; i < 16 + settings.current.strength * 6; i++) {
            const v = velocity(x, y, currentAngle, currentPoint, 0);
            x += v.x * 0.005;
            y += (v.y * 0.005 * width) / height;
            context!.lineTo(x * width, y * height);
          }
          context!.stroke();
        }
      }
      context!.globalAlpha = 1;
    }

    function canAnimate() {
      return visible && !document.hidden && !settings.current.paused;
    }

    function render(now: number) {
      frame = 0;
      if (!canAnimate()) return;
      const delta = lastTime ? Math.min((now - lastTime) / 16.667, 2) : 1;
      lastTime = now;
      elapsed += delta / 60;
      const targetAngle = ((settings.current.bearing - 90) * Math.PI) / 180;
      const difference = Math.atan2(
        Math.sin(targetAngle - currentAngle),
        Math.cos(targetAngle - currentAngle),
      );
      currentAngle += difference * Math.min(1, 0.045 * delta);
      currentPoint.x += (settings.current.point.x - currentPoint.x) * Math.min(1, 0.1 * delta);
      currentPoint.y += (settings.current.point.y - currentPoint.y) * Math.min(1, 0.1 * delta);
      context!.globalAlpha = 0.075;
      context!.fillStyle = PAPER;
      context!.fillRect(0, 0, width, height);
      context!.globalAlpha = 0.58;
      context!.lineWidth = 0.85;
      const speed = (0.00075 + settings.current.strength * 0.0007) * delta;
      for (const particle of particles) {
        const v = velocity(particle.x, particle.y, currentAngle, currentPoint, elapsed);
        const nx = particle.x + v.x * speed;
        const ny = particle.y + (v.y * speed * width) / height;
        context!.strokeStyle =
          colors[particle.ink < 0.07 ? 3 : particle.ink < 0.4 ? 0 : particle.ink < 0.8 ? 1 : 2];
        context!.beginPath();
        context!.moveTo(particle.x * width, particle.y * height);
        context!.lineTo(nx * width, ny * height);
        context!.stroke();
        particle.x = nx;
        particle.y = ny;
        particle.age += delta;
        if (nx < -0.02 || nx > 1.02 || ny < -0.02 || ny > 1.02 || particle.age > particle.life)
          Object.assign(particle, makeParticle());
      }
      context!.globalAlpha = 1;
      frame = requestAnimationFrame(render);
    }

    function reconcile(redrawStill = false) {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      lastTime = 0;
      if (redrawStill || !canAnimate()) drawStill();
      if (canAnimate()) frame = requestAnimationFrame(render);
    }

    function resize() {
      width = chart!.clientWidth;
      height = chart!.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      seed = 3210;
      particles = Array.from(
        { length: Math.min(850, Math.round((width * height) / 390)) },
        makeParticle,
      );
      reconcile(true);
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        reconcile();
      },
      { threshold: 0.05 },
    );
    resizeObserver.observe(chart);
    intersectionObserver.observe(chart);
    const onVisibility = () => reconcile();
    document.addEventListener('visibilitychange', onVisibility);
    redraw.current = () => {
      if (settings.current.paused || !frame) reconcile(true);
    };
    resize();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      redraw.current = () => {};
    };
  }, []);

  useEffect(() => {
    redraw.current();
  }, [bearing, strength, point, paused, reducedMotion]);

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' && event.type !== 'pointerdown' && event.buttons === 0)
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPoint({
      x: clamp((event.clientX - bounds.left) / bounds.width, 0.08, 0.92),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0.08, 0.92),
    });
  }

  function moveKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const directions: Record<string, Point> = {
      ArrowLeft: { x: -0.05, y: 0 },
      ArrowRight: { x: 0.05, y: 0 },
      ArrowUp: { x: 0, y: -0.05 },
      ArrowDown: { x: 0, y: 0.05 },
    };
    if (event.key === 'Home') {
      event.preventDefault();
      setPoint(INITIAL_POINT);
      setAnnouncement('Eddy centered.');
      return;
    }
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const next = {
      x: clamp(point.x + direction.x, 0.08, 0.92),
      y: clamp(point.y + direction.y, 0.08, 0.92),
    };
    setPoint(next);
    setAnnouncement(
      `Eddy position: ${Math.round(next.x * 100)} percent across, ${Math.round(next.y * 100)} percent down.`,
    );
  }

  return (
    <section
      className="wind-study"
      id="field-instrument"
      aria-labelledby="wind-title"
      tabIndex={-1}
    >
      <div className="wind-heading">
        <span>WIND STUDY / 001</span>
        <span>TURN. STIR. EXPLORE.</span>
      </div>
      <div className="wind-body">
        <div className="wind-plot-wrap">
          <div
            ref={chartRef}
            className="wind-chart"
            tabIndex={0}
            role="group"
            aria-label="Wind chart. Move the eddy with the arrow keys; Home centers it."
            aria-describedby="wind-help"
            onPointerMove={movePointer}
            onPointerDown={movePointer}
            onKeyDown={moveKeyboard}
          >
            <canvas ref={canvasRef} aria-hidden="true" />
            <div className="wind-grid" aria-hidden="true" />
            <div className="wind-north" aria-hidden="true">
              N<br />↑
            </div>
            <span
              className="wind-eddy"
              aria-hidden="true"
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
            >
              <span />
            </span>
            <span className="wind-plot-label">
              {reducedMotion
                ? 'STILL STUDY / REDUCED MOTION'
                : paused
                  ? 'STILL STUDY'
                  : 'FOLLOW THE CURRENT'}
            </span>
            {!available && (
              <p className="wind-fallback">
                The wind chart needs a browser with Canvas support. The controls below describe each
                setting.
              </p>
            )}
          </div>
          <p id="wind-help" className="wind-help">
            Move across the chart, tap a point, or focus it and use the arrow keys.
          </p>
        </div>
        <div className="wind-controls">
          <div className="wind-title-row">
            <div>
              <span className="eyebrow">BUILT FOR CURIOSITY</span>
              <h3 id="wind-title">
                Go with
                <br />
                <em>your own flow.</em>
              </h3>
            </div>
            <div className="wind-compass" aria-hidden="true">
              <span style={{ transform: `rotate(${bearing}deg)` }}>↑</span>
            </div>
          </div>
          <p>
            Change the direction. Stir up an eddy.
            <br />
            See what follows.
          </p>
          <label className="wind-bearing" htmlFor="wind-bearing">
            <span>Flow direction</span>
            <output>{String(bearing).padStart(3, '0')}°</output>
          </label>
          <input
            id="wind-bearing"
            type="range"
            min="0"
            max="359"
            value={bearing}
            aria-valuetext={`${bearing} degrees`}
            onChange={(event) => setBearing(Number(event.target.value))}
          />
          <div className="wind-presets" role="group" aria-label="Flow strength">
            {PRESETS.map((label, index) => (
              <button
                key={label}
                aria-pressed={strength === index}
                onClick={() => setStrength(index)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="wind-actions">
            <button onClick={() => setPaused(!paused)} disabled={reducedMotion}>
              {reducedMotion ? 'Motion reduced' : paused ? 'Play motion ▷' : 'Pause motion Ⅱ'}
            </button>
            <button
              onClick={() => {
                setBearing(65);
                setStrength(1);
                setPoint(INITIAL_POINT);
                setAnnouncement('Original direction, breeze, and eddy position restored.');
              }}
            >
              Reset ↺
            </button>
          </div>
          <details className="wind-build-note">
            <summary>Under the surface</summary>
            <p>
              A custom Canvas flow field: hundreds of individual trails, eased pointer response, and
              a compass tied to the controls. It rests when off-screen and respects reduced motion.
              A playful study, inspired by time on the water.
            </p>
          </details>
        </div>
      </div>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </section>
  );
}
