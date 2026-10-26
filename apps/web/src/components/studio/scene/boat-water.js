/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianBoatWater(THREE, options = {}) {
  const parent = options.parent || options.world;
  if (!parent || !THREE) throw new Error('Boat water needs THREE and its scene parent.');
  const origin = options.position || [2.5, 3.02, -1.56];
  const width = options.width || 1.22,
    depth = options.depth || 0.82;
  const waterHeight = options.waterHeight === undefined ? 0.18 : options.waterHeight;
  const group = new THREE.Group();
  group.position.set(...origin);
  parent.add(group);
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  const boat = options.boat || null;
  const originalBoat = boat
    ? { position: boat.position.clone(), rotation: boat.rotation.clone() }
    : null;
  const boatY = options.boatY === undefined ? origin[1] - 0.03 : options.boatY;
  let disposed = false,
    active = options.active === true,
    reducedMotion = options.reducedMotion === true;
  let lastInputTime = null,
    elapsed = 0,
    theme = 1;
  const uniforms = {
    uKsWaterTime: { value: 0 },
    uKsStirAt: { value: -100 },
    uKsStirStrength: { value: 0 },
    uKsNight: { value: 1 },
  };
  function add(geometry, material, x, y, z) {
    geometries.add(geometry);
    materials.add(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);
    return mesh;
  }
  const box = (w, h, d, x, y, z, material) =>
    add(new THREE.BoxGeometry(w, h, d), material, x, y, z);
  const trayMaterial = new THREE.MeshStandardMaterial({
    color: 0x224957,
    roughness: 0.46,
    metalness: 0.2,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x81aca8,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.3,
    metalness: 0.45,
  });
  const sideMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x6aadae,
    roughness: 0.25,
    metalness: 0.05,
    clearcoat: 0.7,
    transparent: true,
    opacity: 0.47,
    depthWrite: false,
  });
  box(width, 0.035, depth, 0, 0.022, 0, trayMaterial);
  box(width + 0.08, 0.065, depth + 0.07, 0, -0.015, 0, trayMaterial);
  box(
    width,
    waterHeight - 0.018,
    0.018,
    0,
    waterHeight / 2 + 0.018,
    -depth / 2 + 0.009,
    sideMaterial,
  );
  box(
    width,
    waterHeight - 0.018,
    0.018,
    0,
    waterHeight / 2 + 0.018,
    depth / 2 - 0.009,
    sideMaterial,
  );
  box(
    0.018,
    waterHeight - 0.018,
    depth - 0.025,
    -width / 2 + 0.009,
    waterHeight / 2 + 0.018,
    0,
    sideMaterial,
  );
  box(
    0.018,
    waterHeight - 0.018,
    depth - 0.025,
    width / 2 - 0.009,
    waterHeight / 2 + 0.018,
    0,
    sideMaterial,
  );
  [-1, 1].forEach((side) => {
    box(
      width + 0.012,
      0.018,
      0.024,
      0,
      waterHeight + 0.014,
      side * (depth / 2 - 0.007),
      rimMaterial,
    );
    box(
      0.024,
      0.018,
      depth - 0.025,
      side * (width / 2 - 0.007),
      waterHeight + 0.014,
      0,
      rimMaterial,
    );
  });
  // A tiny procedural environment provides true PBR reflections and clearcoat shine.
  // Existing room lights also reflect from the displaced normals; no second scene render is needed.
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A canvas is required for the boat water reflection texture.');
  const sky = context.createLinearGradient(0, 0, 0, 128);
  sky.addColorStop(0, '#d5e9e7');
  sky.addColorStop(0.4, '#6b9f9f');
  sky.addColorStop(0.55, '#3a6779');
  sky.addColorStop(1, '#102b3b');
  context.fillStyle = sky;
  context.fillRect(0, 0, 256, 128);
  context.fillStyle = '#ebf8e8';
  context.fillRect(44, 18, 35, 45);
  context.fillRect(98, 12, 18, 46);
  context.fillStyle = '#48cdd8';
  context.fillRect(6, 49, 97, 6);
  context.fillRect(215, 14, 4, 61);
  context.fillStyle = '#dc8dbb';
  context.fillRect(147, 32, 54, 7);
  const environment = new THREE.CanvasTexture(canvas);
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.mapping = THREE.EquirectangularReflectionMapping;
  textures.add(environment);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x286a78,
    roughness: 0.22,
    metalness: 0.28,
    clearcoat: 0.95,
    clearcoatRoughness: 0.12,
    envMap: environment,
    envMapIntensity: 1.0,
    emissive: 0x000000,
    emissiveIntensity: 0,
    side: THREE.DoubleSide,
  });
  const declarations = `
uniform float uKsWaterTime;
uniform float uKsStirAt;
uniform float uKsStirStrength;
uniform float uKsNight;
varying vec3 vKsWaterLocal;
float ksWaterWake(vec2 p) {
  float age = max(0.0, uKsWaterTime - uKsStirAt);
  if (uKsStirAt < -10.0 || age > 4.0) return 0.0;
  float radius = length(p * vec2(0.9, 1.25));
  return sin(radius * 49.0 - age * 8.5) * exp(-radius * 3.8 - age * 1.15) * (1.0 - smoothstep(3.0, 4.0, age)) * uKsStirStrength;
}
float ksWaterWave(vec2 p) {
  float t = uKsWaterTime;
  return sin(p.x * 12.0 + t * 1.35) * 0.0042 + sin(p.y * 16.0 - t * 1.05) * 0.0032
    + sin((p.x + p.y) * 23.0 + t * 1.8) * 0.0018 + ksWaterWake(p) * 0.014;
}
`;
  waterMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = declarations + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
#include <beginnormal_vertex>
float ksHeight = ksWaterWave(position.xz);
float ksDx = (ksWaterWave(position.xz + vec2(0.006, 0.0)) - ksWaterWave(position.xz - vec2(0.006, 0.0))) / 0.012;
float ksDz = (ksWaterWave(position.xz + vec2(0.0, 0.006)) - ksWaterWave(position.xz - vec2(0.0, 0.006))) / 0.012;
objectNormal = normalize(vec3(-ksDx, 1.0, -ksDz));
`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
#include <begin_vertex>
transformed.y += ksHeight;
vKsWaterLocal = transformed;
`,
    );
    shader.fragmentShader = declarations + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
#include <color_fragment>
float ksCaustic = sin(vKsWaterLocal.x * 31.0 + uKsWaterTime * 1.1) * sin(vKsWaterLocal.z * 35.0 - uKsWaterTime * 0.8);
float ksGlimmer = smoothstep(0.78, 0.99, ksCaustic) * 0.055;
float ksWake = abs(ksWaterWake(vKsWaterLocal.xz));
diffuseColor.rgb += vec3(0.16, 0.42, 0.39) * ksGlimmer + vec3(0.12, 0.22, 0.2) * ksWake;
`,
    );
  };
  waterMaterial.customProgramCacheKey = () => 'ks-boat-water-pbr-v1';
  const waterGeometry = new THREE.PlaneGeometry(width - 0.045, depth - 0.045, 30, 20);
  waterGeometry.rotateX(-Math.PI / 2);
  const water = add(waterGeometry, waterMaterial, 0, waterHeight, 0);
  water.receiveShadow = false;
  const dayWater = new THREE.Color(0x54aaa7),
    nightWater = new THREE.Color(0x205a74);
  const dayTray = new THREE.Color(0x8a9c91),
    nightTray = new THREE.Color(0x24434d);
  const dayRim = new THREE.Color(0xa4b8a4),
    nightRim = new THREE.Color(0x6faaa9);
  function setTheme(value) {
    theme = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    uniforms.uKsNight.value = theme;
    waterMaterial.color.copy(dayWater).lerp(nightWater, theme);
    waterMaterial.emissiveIntensity = 0;
    waterMaterial.envMapIntensity = 0.75 + theme * 0.4;
    trayMaterial.color.copy(dayTray).lerp(nightTray, theme);
    rimMaterial.color.copy(dayRim).lerp(nightRim, theme);
    rimMaterial.emissiveIntensity = 0;
    sideMaterial.opacity = 0.39 + theme * 0.1;
  }
  function placeBoat() {
    if (!boat || !originalBoat) return;
    const moving = active && !reducedMotion;
    boat.position.copy(originalBoat.position);
    boat.position.y = boatY;
    boat.rotation.copy(originalBoat.rotation);
    if (moving) {
      boat.position.y += Math.sin(elapsed * 1.35) * 0.007 + Math.sin(elapsed * 2.05) * 0.002;
      boat.rotation.z += Math.sin(elapsed * 1.1 + 0.5) * 0.012;
      boat.rotation.x += Math.sin(elapsed * 1.45) * 0.008;
    }
  }
  function update(timeSeconds, nextTheme = theme, state = {}) {
    if (disposed) return false;
    if (typeof state.active === 'boolean' && state.active !== active) {
      active = state.active;
      lastInputTime = null;
    }
    if (typeof state.reducedMotion === 'boolean' && state.reducedMotion !== reducedMotion) {
      reducedMotion = state.reducedMotion;
      lastInputTime = null;
    }
    const now = Number.isFinite(timeSeconds) ? timeSeconds : 0;
    if (lastInputTime !== null && active && !reducedMotion)
      elapsed += THREE.MathUtils.clamp(now - lastInputTime, 0, 0.08);
    lastInputTime = now;
    uniforms.uKsWaterTime.value = elapsed;
    if (nextTheme !== theme) setTheme(nextTheme);
    placeBoat();
    return active && !reducedMotion;
  }
  setTheme(options.theme === undefined ? 1 : options.theme);
  placeBoat();
  return {
    group,
    water,
    update,
    setTheme,
    nudge(strength = 1) {
      if (disposed) return;
      uniforms.uKsStirAt.value = elapsed;
      uniforms.uKsStirStrength.value = THREE.MathUtils.clamp(Number(strength) || 1, 0.25, 2);
    },
    needsFrame() {
      return !disposed && active && !reducedMotion;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      if (boat && originalBoat) {
        boat.position.copy(originalBoat.position);
        boat.rotation.copy(originalBoat.rotation);
      }
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
