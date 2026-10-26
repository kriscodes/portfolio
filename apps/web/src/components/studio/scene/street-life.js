/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianStreetLife(THREE, { world, sources = [], theme = 1 } = {}) {
  const group = new THREE.Group();
  group.name = 'Quiet neighborhood street and reflected light';
  world.add(group);
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set(),
    transitions = [],
    reflections = [];
  let disposed = false,
    time = 0,
    lastTime = null,
    night = 1;
  function material(day, dark = day, roughness = 0.8, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ color: day, roughness, metalness });
    materials.add(m);
    transitions.push({ m, day: new THREE.Color(day), dark: new THREE.Color(dark) });
    return m;
  }
  function mesh(g, m, x = 0, y = 0, z = 0, parent = group) {
    geometries.add(g);
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = false;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const box = (w, h, d, x, y, z, m, parent = group) =>
    mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent);
  const asphalt = material(0x7a8284, 0x13212d, 0.89),
    curb = material(0xb7b5aa, 0x34434d, 0.86),
    walk = material(0xc2b9a5, 0x35414a, 0.9);
  const gutter = material(0x8e9692, 0x263943, 0.65, 0.2),
    line = material(0xd1c6a0, 0x667c83, 0.96);
  box(20.4, 0.08, 5.48, 3, 0.08, -8.14, asphalt);
  box(20.4, 0.13, 0.18, 3, 0.145, -10.79, curb);
  box(20.4, 0.06, 0.32, 3, 0.09, -5.54, gutter);
  box(20.4, 0.16, 1.06, 3, 0.12, -11.41, walk);
  // Expansion joints and a few worn road dashes establish a street at full scale.
  for (let x = -6.5; x < 13; x += 1.25) box(0.012, 0.003, 1.01, x, 0.202, -11.4, gutter);
  for (let x = -6.3; x < 13; x += 3.4) box(1.35, 0.0015, 0.055, x, 0.122, -8.15, line);
  for (let x of [-1.2, 6.4, 11.8]) {
    box(0.7, 0.003, 0.16, x, 0.124, -5.61, gutter);
    for (let i = 0; i < 9; i++)
      box(0.014, 0.004, 0.13, x - 0.29 + i * 0.071, 0.127, -5.61, asphalt);
  }
  // A dark hatchback crosses only occasionally. Its lamps and projected beams
  // belong to the same vehicle, so every moving pool of light has a source.
  const car = new THREE.Group();
  car.name = 'Occasional passing hatchback';
  group.add(car);
  const body = material(0x657b87, 0x293c51, 0.35, 0.45),
    glass = material(0x354d59, 0x0b1d2c, 0.2, 0.4),
    rubber = material(0x252b2f, 0x0d151d, 0.95),
    rim = material(0x9aa5a6, 0x5c6d78, 0.35, 0.75);
  box(3.75, 0.49, 1.64, 0, 0.69, 0, body, car);
  box(3.48, 0.16, 1.69, -0.02, 0.46, 0, rubber, car);
  const cabin = box(1.93, 0.62, 1.43, -0.2, 1.2, 0, glass, car);
  cabin.rotation.z = -0.055;
  box(1.66, 0.07, 1.45, -0.26, 1.55, 0, body, car);
  box(0.08, 0.61, 1.49, -0.32, 1.2, 0, body, car);
  box(0.09, 0.53, 1.46, 0.68, 1.17, 0, body, car);
  box(0.1, 0.51, 1.45, -1.12, 1.17, 0, body, car);
  box(0.25, 0.07, 0.13, 0.69, 1.04, 0.86, body, car);
  box(0.25, 0.07, 0.13, 0.69, 1.04, -0.86, body, car);
  for (const x of [-1.18, 1.18])
    for (const z of [-0.82, 0.82]) {
      const wheel = mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.16, 12), rubber, x, 0.43, z, car);
      wheel.rotation.x = Math.PI / 2;
      const hub = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.17, 10), rim, x, 0.43, z, car);
      hub.rotation.x = Math.PI / 2;
    }
  function lens(color) {
    const m = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1,
      roughness: 0.25,
      toneMapped: false,
    });
    materials.add(m);
    return m;
  }
  const head = lens(0xffefd1),
    tail = lens(0xe64d44);
  const lamps = [];
  for (const side of [-1, 1]) {
    box(0.026, 0.115, 0.35, 1.887, 0.79, side * 0.55, head, car);
    box(0.024, 0.1, 0.32, -1.887, 0.79, side * 0.55, tail, car);
    const lamp = new THREE.SpotLight(0xffefd1, 0, 8, 0.24, 0.8, 1.7);
    lamp.position.set(1.93, 0.78, side * 0.55);
    lamp.castShadow = false;
    const target = new THREE.Object3D();
    target.position.set(7, 0.124, side * 0.64);
    car.add(target);
    lamp.target = target;
    car.add(lamp);
    lamps.push(lamp);
  }
  const beamCanvas = document.createElement('canvas');
  beamCanvas.width = 128;
  beamCanvas.height = 256;
  const bc = beamCanvas.getContext('2d');
  if (bc) {
    const g = bc.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,248,221,0)');
    g.addColorStop(0.55, 'rgba(255,248,221,.04)');
    g.addColorStop(0.85, 'rgba(255,248,221,.22)');
    g.addColorStop(1, 'rgba(255,248,221,.4)');
    bc.fillStyle = g;
    bc.beginPath();
    bc.moveTo(5, 0);
    bc.lineTo(123, 0);
    bc.lineTo(72, 256);
    bc.lineTo(56, 256);
    bc.closePath();
    bc.fill();
  }
  const beamTexture = new THREE.CanvasTexture(beamCanvas);
  beamTexture.colorSpace = THREE.SRGBColorSpace;
  textures.add(beamTexture);
  const beamMat = new THREE.MeshBasicMaterial({
    map: beamTexture,
    color: 0xffefd1,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  materials.add(beamMat);
  for (const side of [-1, 1]) {
    const beam = mesh(new THREE.PlaneGeometry(1.45, 5.5), beamMat, 4.55, 0.126, side * 0.55, car);
    beam.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
    beam.receiveShadow = false;
  }
  // A sparse damp surface catches real scene lights. These patches are on the
  // asphalt, leaving the timber studio and its pedestrian threshold dry.
  const damp = new THREE.MeshPhysicalMaterial({
    color: 0x74848b,
    roughness: 0.18,
    metalness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.2,
  });
  materials.add(damp);
  for (const [x, z, w, d, rotation] of [
    [1.3, -3.6, 2.6, 1.1, 0.1],
    [4.2, -2.4, 2.9, 1.4, -0.13],
    [6.1, -6.2, 3.3, 0.75, 0.06],
  ]) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.5 * w, 0);
    shape.bezierCurveTo(-0.49 * w, -0.45 * d, -0.18 * w, -0.58 * d, 0.08 * w, -0.4 * d);
    shape.bezierCurveTo(0.52 * w, -0.56 * d, 0.61 * w, -0.12 * d, 0.42 * w, 0.17 * d);
    shape.bezierCurveTo(0.41 * w, 0.56 * d, -0.23 * w, 0.42 * d, -0.42 * w, 0.23 * d);
    shape.bezierCurveTo(-0.53 * w, 0.12 * d, -0.46 * w, 0.09 * d, -0.5 * w, 0);
    const patch = mesh(new THREE.ShapeGeometry(shape), damp, x, 0.1257, z);
    patch.rotation.set(-Math.PI / 2, 0, rotation);
    patch.receiveShadow = false;
  }
  function reflectionTexture(index) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext('2d');
    let seed = 417 + index * 197;
    const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    if (ctx) {
      ctx.clearRect(0, 0, 128, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.2, 'rgba(255,255,255,.08)');
      g.addColorStop(0.48, 'rgba(255,255,255,.34)');
      g.addColorStop(0.76, 'rgba(255,255,255,.10)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(53, 0);
      ctx.bezierCurveTo(27, 70, 7, 133, 23, 201);
      ctx.lineTo(58, 256);
      ctx.lineTo(76, 256);
      ctx.bezierCurveTo(110, 189, 126, 133, 92, 69);
      ctx.lineTo(76, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      for (let i = 0; i < 55; i++) {
        const y = 24 + random() * 208,
          fade = Math.sin((y / 256) * Math.PI),
          w = (20 + random() * 75) * fade;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + random() * 0.3) * fade + ')';
        ctx.fillRect(64 - w / 2 + (random() - 0.5) * 14, y, w, 0.5 + random() * 2.2);
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 45; i++) {
        ctx.fillStyle = 'rgba(0,0,0,' + (0.15 + random() * 0.6) + ')';
        ctx.fillRect(random() * 128, random() * 256, 3 + random() * 29, 0.5 + random() * 2.4);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.add(t);
    return t;
  }
  sources.forEach((source, index) => {
    const columns = 5,
      rows = 12,
      positions = new Float32Array((columns + 1) * (rows + 1) * 3),
      uv = [],
      indices = [];
    for (let y = 0; y <= rows; y++)
      for (let x = 0; x <= columns; x++) {
        uv.push(x / columns, y / rows);
        if (x < columns && y < rows) {
          const a = y * (columns + 1) + x;
          indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
        }
      }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    const tint = source.color || source.tint || 0x61dfdd;
    const m = new THREE.MeshBasicMaterial({
      color: tint,
      map: reflectionTexture(index),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    materials.add(m);
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec2 vKsReflectXZ;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvKsReflectXZ=position.xz;',
      );
      shader.fragmentShader = 'varying vec2 vKsReflectXZ;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nbool ksLot=vKsReflectXZ.x>=-.4&&vKsReflectXZ.x<=8.5&&vKsReflectXZ.y>=-5.4&&vKsReflectXZ.y<=1.5;\nbool ksStreet=vKsReflectXZ.x>=-7.2&&vKsReflectXZ.x<=13.2&&vKsReflectXZ.y>=-10.8&&vKsReflectXZ.y<=-5.42;\nif(!ksLot&&!ksStreet)discard;',
      );
    };
    m.customProgramCacheKey = () => 'ks-neon-ground-reflection-v1';
    const object = mesh(geometry, m);
    object.frustumCulled = false;
    object.renderOrder = 2;
    object.receiveShadow = false;
    object.userData.ksReflection = true;
    reflections.push({ source, object, positions, columns, rows });
  });
  function mergeStatic(parent) {
    parent.updateWorldMatrix(true, true);
    const inverse = parent.matrixWorld.clone().invert(),
      buckets = new Map();
    for (const object of [...parent.children]) {
      if (!object.isMesh || object.userData.ksReflection) continue;
      const key = object.material.uuid + ':' + object.receiveShadow;
      if (!buckets.has(key))
        buckets.set(key, {
          m: object.material,
          receive: object.receiveShadow,
          p: [],
          n: [],
          uv: [],
        });
      const bucket = buckets.get(key),
        original = object.geometry,
        g = original.index ? original.toNonIndexed() : original.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      const p = g.getAttribute('position'),
        n = g.getAttribute('normal'),
        uv = g.getAttribute('uv');
      for (let i = 0; i < p.count; i++) {
        bucket.p.push(p.getX(i), p.getY(i), p.getZ(i));
        bucket.n.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
        bucket.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
      }
      object.removeFromParent();
      g.dispose();
      geometries.delete(original);
      original.dispose();
    }
    for (const b of buckets.values()) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      mesh(g, b.m, 0, 0, 0, parent).receiveShadow = b.receive;
    }
  }
  mergeStatic(car);
  mergeStatic(group);
  function setTheme(value) {
    if (disposed) return;
    night = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    transitions.forEach(({ m, day, dark }) => m.color.copy(day).lerp(dark, night));
    head.emissiveIntensity = 0.08 + night * 1.45;
    tail.emissiveIntensity = 0.06 + night * 0.9;
    lamps.forEach((l) => (l.intensity = night * 2.6));
    beamMat.opacity = night * 0.2;
    damp.color.set(0x74848b).lerp(new THREE.Color(0x182c3a), night);
  }
  const localEye = new THREE.Vector3();
  function update(now, { active = true, reducedMotion = false, camera = null } = {}) {
    if (disposed) return false;
    if (lastTime !== null && active && !reducedMotion)
      time += Math.min(0.08, Math.max(0, now - lastTime));
    lastTime = now;
    const phase = (time + 3.6) % 31;
    car.visible = !reducedMotion && phase < 9.5;
    if (car.visible) car.position.set(-12.8 + (phase / 9.5) * 28.4, 0.005, -8.3);
    if (camera) {
      group.updateWorldMatrix(true, false);
      localEye.copy(camera.position);
      group.worldToLocal(localEye);
      for (const record of reflections) {
        const source = record.source,
          p = source.position || [0, 2, -11],
          width = source.width || 2,
          height = (source.height || 0.6) * 3.1;
        record.object.visible = localEye.y > 0.22;
        record.object.material.opacity = Math.min(
          0.7,
          (Number.isFinite(source.level) ? source.level : night) * 0.82,
        );
        let i = 0;
        for (let row = 0; row <= record.rows; row++)
          for (let column = 0; column <= record.columns; column++) {
            const u = column / record.columns - 0.5,
              v = row / record.rows - 0.5;
            const sx = p[0] + u * width * 1.35,
              sy = Math.max(0.35, p[1] + v * height),
              sz = p[2];
            const virtualY = 0.252 - sy,
              t = (localEye.y - 0.126) / (localEye.y - virtualY);
            record.positions[i++] = localEye.x + (sx - localEye.x) * t;
            record.positions[i++] = 0.1268;
            record.positions[i++] = localEye.z + (sz - localEye.z) * t;
          }
        record.object.geometry.getAttribute('position').needsUpdate = true;
      }
    }
    return active && !reducedMotion;
  }
  setTheme(theme);
  return {
    group,
    setTheme,
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      lamps.forEach((l) => l.dispose?.());
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
