import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
  type Texture,
  WebGLRenderer,
} from 'three';
import { sampleSailGust, type SailGust } from './sail-motion';

export type SailRenderer = {
  start: () => void;
  settle: () => void;
  dispose: () => void;
};

type Callbacks = { onComplete: () => void; onUnavailable: () => void };
const RELEASE_DURATION_MS = 1_400;

// Deform a textured cloth surface, keeping the leading edge and corners anchored.
// Coordinates are normalized to the artwork, not a sailing or fluid simulation.
const vertexShader = `
  uniform float fill;
  uniform float flutter;
  uniform float twist;
  uniform float elapsed;
  varying vec2 textureCoordinates;

  void main() {
    textureCoordinates = uv;
    vec3 cloth = position;
    float height = clamp((uv.y - 0.045) / 0.91, 0.0, 1.0);
    float leadingEdge = mix(0.055, 0.804, height);
    float trailingEdge = mix(0.974, 0.804, height);
    float chord = clamp((uv.x - leadingEdge) / max(0.02, trailingEdge - leadingEdge), 0.0, 1.0);
    float verticalTension = sin(height * 3.14159265);
    float belly = sin(chord * 3.14159265) * verticalTension;
    float freeEdge = pow(chord, 4.0) * verticalTension;

    cloth.x += fill * belly * 0.035;
    cloth.y += fill * belly * 0.009;
    cloth.x -= twist * chord * height * verticalTension * 0.04;
    cloth.y += flutter * freeEdge * 0.004;
    cloth.x += sin(elapsed * 2.4 + height * 8.0) * freeEdge * fill * 0.003;

    // The blue telltale responds more freely than the tensioned cloth beside it.
    float ribbon = smoothstep(0.83, 0.89, uv.x)
      * (1.0 - smoothstep(0.035, 0.065, abs(uv.y - 0.535)));
    cloth.y += ribbon * flutter * 0.015;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(cloth, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D clothTexture;
  uniform float fill;
  varying vec2 textureCoordinates;

  void main() {
    vec4 cloth = texture2D(clothTexture, textureCoordinates);
    float light = 1.0 + fill * 0.018 * sin(textureCoordinates.x * 3.14159265);
    gl_FragColor = vec4(cloth.rgb * light, cloth.a);
  }
`;

/** Created on demand and disposed at rest; there is no background render loop. */
export async function createSailRenderer(
  canvas: HTMLCanvasElement,
  imageUrl: string,
  callbacks: Callbacks,
  signal?: AbortSignal,
): Promise<SailRenderer> {
  signal?.throwIfAborted();
  const texture: Texture = await new TextureLoader().loadAsync(imageUrl);
  let renderer: WebGLRenderer;
  try {
    // Do not allocate GPU resources while an image request can still be canceled.
    signal?.throwIfAborted();
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch (error) {
    texture.dispose();
    throw error;
  }
  renderer.setClearColor(0xffffff, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const uniforms = {
    clothTexture: { value: texture },
    fill: { value: 0 },
    flutter: { value: 0 },
    twist: { value: 0 },
    elapsed: { value: 0 },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new PlaneGeometry(1, 1, 64, 64);
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
  camera.position.z = 1;
  let disposed = false;
  let frame = 0;
  let startedAt: number | null = null;
  let releasedAt: number | null = null;
  let releaseFrom: SailGust | null = null;
  let current = sampleSailGust(0);

  function draw(gust: SailGust, elapsedMs: number) {
    uniforms.fill.value = gust.fill;
    uniforms.flutter.value = gust.flutter;
    uniforms.twist.value = gust.twist;
    uniforms.elapsed.value = elapsedMs / 1_000;
    renderer.render(scene, camera);
  }

  function resize() {
    if (disposed) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
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
        twist: releaseFrom.twist * remaining,
        flutter: releaseFrom.flutter * remaining,
        settled: progress === 1,
      };
    }

    draw(current, elapsedMs);
    if (current.settled) {
      callbacks.onComplete();
      return;
    }
    frame = requestAnimationFrame(animate);
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    if (!disposed) callbacks.onUnavailable();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  canvas.addEventListener('webglcontextlost', onContextLost);
  resize();

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
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
