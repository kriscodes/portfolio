import { neonDriftStyles } from './neon-drift.styles';
import type { ProjectPreview } from './types';

type Point = { x: number; y: number };
type Pointer = Point & { dx: number; dy: number; strength: number };
type Particle = Point & { ink: number; age: number; life: number; speed: number; weight: number };
type QuadCanvas = HTMLCanvasElement & {
  getBoxQuads?: () => Array<{ p1: Point; p2: Point; p3: Point; p4: Point }>;
};

const palettes = [
  { name: 'Aurora', colors: ['#77f7d5', '#a8a4ff', '#f599d6'] },
  { name: 'Sunset', colors: ['#ffc67b', '#ff6d92', '#d49bff'] },
  { name: 'Electric', colors: ['#63d8ff', '#c4fc85', '#a6a2ff'] },
] as const;

/** A local canvas experiment. It has no storage, API calls or document-level handlers. */
export function mountPreview(host: HTMLElement): ProjectPreview {
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${neonDriftStyles}</style>
    <section class="drift" aria-label="Neon Drift, an interactive light-trail experiment">
      <canvas aria-hidden="true"></canvas>
      <i class="probe p0"></i><i class="probe p1"></i><i class="probe p2"></i><i class="probe p3"></i>
      <div class="identity"><strong>NEON DRIFT</strong><span>Drag through the light.</span></div>
      <div class="controls" aria-label="Light trail controls">
        <button type="button" data-drift="mode" aria-label="Switch to orbit mode" aria-pressed="false">Drift</button>
        <button type="button" data-drift="palette" aria-label="Change palette: Aurora" title="Change palette"><span class="swatches" aria-hidden="true"><i style="--color:#77f7d5"></i><i style="--color:#a8a4ff"></i><i style="--color:#f599d6"></i></span></button>
        <button type="button" data-drift="motion" aria-label="Pause motion" aria-pressed="true">Ⅱ</button>
        <button type="button" class="clear" data-drift="clear" aria-label="Clear trails" title="Clear trails">↺</button>
      </div><span class="status" role="status" aria-live="polite"></span>
    </section>`;

  const root = shadow.querySelector<HTMLElement>('.drift')!;
  const canvas = shadow.querySelector<QuadCanvas>('canvas')!;
  const context = canvas.getContext('2d');
  if (!context) {
    shadow.replaceChildren();
    throw new Error('This browser could not open the Neon Drift canvas.');
  }
  const ctx = context;
  const probes = Array.from(shadow.querySelectorAll<HTMLElement>('.probe'));
  const motionButton = shadow.querySelector<HTMLButtonElement>('[data-drift="motion"]')!;
  const modeButton = shadow.querySelector<HTMLButtonElement>('[data-drift="mode"]')!;
  const paletteButton = shadow.querySelector<HTMLButtonElement>('[data-drift="palette"]')!;
  const status = shadow.querySelector<HTMLElement>('.status')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1;
  let height = 1;
  let frame = 0;
  let active = false;
  let playing = !reducedMotion.matches;
  let disposed = false;
  let palette = 0;
  let mode: 'drift' | 'orbit' = 'drift';
  let particles: Particle[] = [];
  let phase = 0;
  let lastTime = 0;
  let pointer: Pointer | null = null;
  let pointerId: number | null = null;

  function announce(message: string) {
    status.textContent = message;
  }

  function syncMotion() {
    motionButton.textContent = playing ? 'Ⅱ' : '▶';
    motionButton.setAttribute('aria-label', playing ? 'Pause motion' : 'Play motion');
    motionButton.setAttribute('aria-pressed', String(playing));
  }

  function backdrop() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#080d1c';
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(
      width * 0.25,
      height * 0.24,
      0,
      width * 0.25,
      height * 0.24,
      Math.max(width, height) * 0.9,
    );
    glow.addColorStop(0, '#183446');
    glow.addColorStop(0.5, '#12172d');
    glow.addColorStop(1, '#080d1c');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function particle(x?: number, y?: number, ink?: number): Particle {
    return {
      x: x ?? Math.random() * width,
      y: y ?? Math.random() * height,
      ink: ink == null ? Math.floor(Math.random() * 3) : ink % 3,
      age: Math.random() * 220,
      life: 180 + Math.random() * 220,
      speed: 0.45 + Math.random() * 0.9,
      weight: 0.8 + Math.random() * 0.85,
    };
  }

  function seed() {
    particles = Array.from(
      { length: Math.max(54, Math.min(170, Math.round((width * height) / 850))) },
      () => particle(),
    );
  }

  function step(delta: number, fade: boolean) {
    if (fade) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(8,13,28,.025)';
      ctx.fillRect(0, 0, width, height);
    }
    phase += 0.006 * delta;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const colors = palettes[palette].colors;
    const cx = width * 0.53;
    const cy = height * 0.43;
    particles.forEach((p) => {
      const previousX = p.x;
      const previousY = p.y;
      const nx = p.x / Math.max(1, width);
      const ny = p.y / Math.max(1, height);
      const angle =
        mode === 'orbit'
          ? Math.atan2(p.y - cy, p.x - cx) +
            Math.PI / 2 +
            0.17 * Math.sin(Math.hypot(p.x - cx, p.y - cy) * 0.025 + phase)
          : Math.sin(nx * 4.2 + phase) * 0.8 +
            Math.cos(ny * 4.6 - phase * 0.6) * 0.95 +
            Math.sin((nx + ny) * 4 - phase * 0.3) * 0.35 -
            0.35;
      const speed = p.speed * (mode === 'orbit' ? 1.25 : 1);
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;
      if (pointer) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const radius = Math.max(45, Math.min(width, height) * 0.8);
        const force = Math.max(0, 1 - distance / radius) * pointer.strength;
        if (force > 0) {
          vx += ((-dy / Math.max(8, distance)) * 1.4 + pointer.dx * 0.25) * force;
          vy += ((dx / Math.max(8, distance)) * 1.4 + pointer.dy * 0.25) * force;
        }
      }
      p.x += vx * delta;
      p.y += vy * delta;
      p.age += delta;
      if (p.age > p.life || p.x < -8 || p.x > width + 8 || p.y < -8 || p.y > height + 8) {
        Object.assign(p, particle(undefined, undefined, p.ink));
        p.age = 0;
        return;
      }
      ctx.strokeStyle = colors[p.ink];
      ctx.globalAlpha = 0.6 * Math.min(1, p.age / 15, (p.life - p.age) / 25);
      ctx.lineWidth = p.weight;
      ctx.beginPath();
      ctx.moveTo(previousX, previousY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (pointer && pointerId === null) {
      pointer.strength *= Math.pow(0.95, delta);
      if (pointer.strength < 0.02) pointer = null;
    }
  }

  function staticArt() {
    for (let i = 0; i < 80; i++) step(1.2, i > 30);
  }

  function resize() {
    if (disposed) return;
    const nextWidth = Math.max(1, root.clientWidth);
    const nextHeight = Math.max(1, root.clientHeight);
    if (nextWidth === width && nextHeight === height && canvas.width > 1) return;
    width = nextWidth;
    height = nextHeight;
    root.dataset.compact = String(height < 160);
    const ratio = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    backdrop();
    seed();
    staticArt();
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || !active || !playing || document.hidden) return;
    const delta = lastTime ? Math.min(2.4, Math.max(0.3, (now - lastTime) / 16.667)) : 1;
    lastTime = now;
    step(delta, true);
    frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (!disposed && active && playing && !frame && !document.hidden) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  function pauseFrame() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  // The probes inherit the screen's CSS perspective. Inverting their projective
  // map aligns mouse and touch trails with the physical monitor in every view.
  function localPoint(event: PointerEvent): Point {
    const quad = canvas.getBoxQuads?.()[0];
    const points = quad
      ? [quad.p1, quad.p2, quad.p3, quad.p4]
      : probes.map((probe) => {
          const rect = probe.getBoundingClientRect();
          return { x: rect.left, y: rect.top };
        });
    const [p0, p1, p2, p3] = points;
    const dx1 = p1.x - p2.x,
      dx2 = p3.x - p2.x,
      dx3 = p0.x - p1.x + p2.x - p3.x;
    const dy1 = p1.y - p2.y,
      dy2 = p3.y - p2.y,
      dy3 = p0.y - p1.y + p2.y - p3.y;
    const determinant = dx1 * dy2 - dx2 * dy1;
    let g = 0,
      h = 0;
    if (Math.abs(determinant) > 0.000001) {
      g = (dx3 * dy2 - dx2 * dy3) / determinant;
      h = (dx1 * dy3 - dx3 * dy1) / determinant;
    }
    const a = p1.x - p0.x + g * p1.x,
      b = p3.x - p0.x + h * p3.x;
    const d = p1.y - p0.y + g * p1.y,
      e = p3.y - p0.y + h * p3.y;
    const A = a - event.clientX * g,
      B = b - event.clientX * h,
      C = event.clientX - p0.x;
    const D = d - event.clientY * g,
      E = e - event.clientY * h,
      F = event.clientY - p0.y;
    const denominator = A * E - B * D;
    if (Math.abs(denominator) < 0.000001) return { x: width / 2, y: height / 2 };
    return {
      x: Math.max(0, Math.min(width, ((C * E - B * F) / denominator) * width)),
      y: Math.max(0, Math.min(height, ((A * F - C * D) / denominator) * height)),
    };
  }

  function stir(event: PointerEvent) {
    const point = localPoint(event);
    const previous = pointer ?? point;
    pointer = {
      x: point.x,
      y: point.y,
      dx: Math.max(-12, Math.min(12, point.x - previous.x)),
      dy: Math.max(-12, Math.min(12, point.y - previous.y)),
      strength: 2.4,
    };
    if (!playing) for (let i = 0; i < 9; i++) step(1, i === 0);
  }

  function down(event: PointerEvent) {
    if (event.button !== 0 || !active) return;
    event.preventDefault();
    pointerId = event.pointerId;
    stir(event);
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* Detached pointers need no capture. */
    }
    const point = localPoint(event);
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 20;
      particles.push(
        particle(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius, i),
      );
    }
    if (particles.length > 220) particles.splice(0, particles.length - 220);
    if (!playing) for (let i = 0; i < 14; i++) step(1, false);
  }

  function move(event: PointerEvent) {
    if (event.pointerId === pointerId) {
      event.preventDefault();
      stir(event);
    }
  }

  function up(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    if (pointer) {
      pointer.dx = 0;
      pointer.dy = 0;
    }
  }

  function releasePointer() {
    if (pointerId !== null && canvas.hasPointerCapture(pointerId))
      canvas.releasePointerCapture(pointerId);
    pointerId = null;
    pointer = null;
  }

  function control(event: Event) {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
      'button[data-drift]',
    );
    if (!button || !active) return;
    if (button.dataset.drift === 'mode') {
      mode = mode === 'drift' ? 'orbit' : 'drift';
      modeButton.textContent = mode === 'drift' ? 'Drift' : 'Orbit';
      modeButton.setAttribute('aria-pressed', String(mode === 'orbit'));
      modeButton.setAttribute(
        'aria-label',
        'Switch to ' + (mode === 'drift' ? 'orbit' : 'drift') + ' mode',
      );
      if (!playing) {
        backdrop();
        seed();
        staticArt();
      }
      announce(mode === 'drift' ? 'Drift mode.' : 'Orbit mode.');
    } else if (button.dataset.drift === 'palette') {
      palette = (palette + 1) % palettes.length;
      paletteButton.setAttribute('aria-label', 'Change palette: ' + palettes[palette].name);
      shadow
        .querySelectorAll<HTMLElement>('.swatches i')
        .forEach((swatch, index) =>
          swatch.style.setProperty('--color', palettes[palette].colors[index]),
        );
      backdrop();
      seed();
      staticArt();
      announce(palettes[palette].name + ' palette.');
    } else if (button.dataset.drift === 'motion') {
      playing = !playing;
      syncMotion();
      if (playing) schedule();
      else pauseFrame();
      announce(playing ? 'Motion playing.' : 'Motion paused. Drag to draw.');
    } else {
      backdrop();
      seed();
      if (!playing) step(1, false);
      announce('Trails cleared.');
    }
  }

  function visibilityChange() {
    if (document.hidden) pauseFrame();
    else schedule();
  }
  function motionPreferenceChange(event: MediaQueryListEvent) {
    if (event.matches) {
      playing = false;
      pauseFrame();
      syncMotion();
    }
  }

  const pointerHandlers = {
    pointerdown: down,
    pointermove: move,
    pointerup: up,
    pointercancel: up,
    lostpointercapture: up,
  };
  Object.entries(pointerHandlers).forEach(([event, handler]) =>
    canvas.addEventListener(event, handler as EventListener),
  );
  shadow.addEventListener('click', control);
  document.addEventListener('visibilitychange', visibilityChange);
  reducedMotion.addEventListener('change', motionPreferenceChange);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  observer?.observe(host);
  const previousInert = host.inert;
  host.inert = true;
  syncMotion();
  resize();

  return {
    setActive(value) {
      if (disposed || active === value) return;
      active = value;
      host.inert = !active;
      if (active) {
        resize();
        schedule();
      } else {
        pauseFrame();
        releasePointer();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      active = false;
      pauseFrame();
      releasePointer();
      observer?.disconnect();
      Object.entries(pointerHandlers).forEach(([event, handler]) =>
        canvas.removeEventListener(event, handler as EventListener),
      );
      shadow.removeEventListener('click', control);
      document.removeEventListener('visibilitychange', visibilityChange);
      reducedMotion.removeEventListener('change', motionPreferenceChange);
      shadow.replaceChildren();
      particles = [];
      host.inert = previousInert;
    },
  };
}
