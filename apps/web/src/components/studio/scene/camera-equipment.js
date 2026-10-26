/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianCameraEquipment(THREE, { world, theme = 1 } = {}) {
  if (!THREE || !world) throw new Error('Camera equipment needs THREE and its world group.');
  const group = new THREE.Group();
  group.name = 'Photography kit on the rear workbench';
  world.add(group);
  const geometries = new Set(),
    materials = new Set(),
    transitions = [],
    taskLights = [];
  let disposed = false;
  function mat(day, night = day, roughness = 0.6, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ color: day, roughness, metalness });
    materials.add(m);
    transitions.push({ m, a: new THREE.Color(day), b: new THREE.Color(night) });
    return m;
  }
  const body = mat(0x2b3337, 0x34464e, 0.56, 0.24),
    rubber = mat(0x171f24, 0x202d35, 0.92);
  const metal = mat(0x53616a, 0x72858c, 0.4, 0.74),
    blackMetal = mat(0x25323a, 0x3d515c, 0.43, 0.55);
  const glass = mat(0x244b52, 0x34616c, 0.13, 0.42),
    coating = mat(0x243a46, 0x2c4858, 0.18, 0.48);
  const highlight = mat(0xa6c7c4, 0x9abcc4, 0.16, 0.52),
    bagFabric = mat(0x5d665f, 0x465b5c, 0.96);
  const bagEdge = mat(0x394641, 0x2b3e45, 0.92),
    brass = mat(0xa48b55, 0xb6a473, 0.42, 0.62),
    red = mat(0x9b574c, 0x9b6d61, 0.62);
  function mesh(g, m, x = 0, y = 0, z = 0, cast = true) {
    geometries.add(g);
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = cast;
    o.receiveShadow = true;
    group.add(o);
    return o;
  }
  function box(w, h, d, x, y, z, m = body) {
    return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
  }
  function cylinder(r0, r1, h, x, y, z, m = body, axis = 'y', segments = 24) {
    const o = mesh(new THREE.CylinderGeometry(r0, r1, h, segments), m, x, y, z);
    if (axis === 'z') o.rotation.x = Math.PI / 2;
    if (axis === 'x') o.rotation.z = Math.PI / 2;
    return o;
  }
  function ring(r, t, x, y, z, m = metal, axis = 'z') {
    const o = mesh(new THREE.TorusGeometry(r, t, 6, 32), m, x, y, z);
    if (axis === 'y') o.rotation.x = -Math.PI / 2;
    return o;
  }
  function disc(r, x, y, z, m = glass, axis = 'z') {
    const o = mesh(new THREE.CircleGeometry(r, 32), m, x, y, z, false);
    if (axis === 'y') o.rotation.x = -Math.PI / 2;
    return o;
  }
  // A full-frame mirrorless body, on its quick-release plate; mounted glass faces +Z.
  const cameraX = -3.95,
    cameraY = 1.135;
  box(0.29, 0.02, 0.175, cameraX, 1.01, -4.238, blackMetal);
  box(0.325, 0.23, 0.18, cameraX, cameraY, -4.23, body);
  box(0.078, 0.211, 0.201, cameraX + 0.146, 1.134, -4.216, rubber);
  box(0.105, 0.04, 0.182, cameraX + 0.115, 1.262, -4.228, body);
  box(0.122, 0.068, 0.145, cameraX - 0.035, 1.279, -4.245, body);
  box(0.087, 0.047, 0.019, cameraX - 0.035, 1.279, -4.326, rubber);
  box(0.07, 0.032, 0.004, cameraX - 0.035, 1.281, -4.338, coating);
  box(0.1, 0.014, 0.081, cameraX - 0.035, 1.318, -4.237, blackMetal);
  box(0.063, 0.006, 0.025, cameraX - 0.035, 1.328, -4.225, metal);
  cylinder(0.027, 0.027, 0.014, cameraX - 0.111, 1.265, -4.267, blackMetal);
  cylinder(0.023, 0.023, 0.016, cameraX + 0.109, 1.292, -4.223, metal);
  cylinder(0.009, 0.009, 0.007, cameraX + 0.111, 1.304, -4.183, red);
  [-1, 1].forEach((side) => {
    box(0.018, 0.025, 0.013, cameraX + side * 0.171, 1.219, -4.262, metal);
  });
  // A recessed mount, two tactile focus bands and one convex-looking coated element.
  cylinder(0.095, 0.095, 0.024, cameraX, cameraY, -4.129, metal, 'z');
  cylinder(0.083, 0.084, 0.176, cameraX, cameraY, -4.03, body, 'z');
  cylinder(0.088, 0.088, 0.043, cameraX, cameraY, -4.074, rubber, 'z');
  cylinder(0.086, 0.086, 0.039, cameraX, cameraY, -4.012, rubber, 'z');
  [-4.101, -4.051, -3.983, -3.943].forEach((z) => ring(0.084, 0.004, cameraX, cameraY, z, metal));
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI * 2) / 18,
      o = box(
        0.006,
        0.013,
        0.032,
        cameraX + Math.sin(a) * 0.088,
        cameraY + Math.cos(a) * 0.088,
        -4.073,
        rubber,
      );
    o.rotation.z = -a;
  }
  ring(0.076, 0.007, cameraX, cameraY, -3.938, blackMetal);
  disc(0.071, cameraX, cameraY, -3.933, glass);
  disc(0.043, cameraX, cameraY, -3.931, coating);
  ring(0.055, 0.0019, cameraX, cameraY, -3.93, highlight);
  const glint = disc(0.014, cameraX - 0.023, cameraY + 0.031, -3.928, highlight);
  glint.scale.set(1, 0.46, 1);
  glint.rotation.z = -0.45;
  box(0.012, 0.014, 0.006, cameraX + 0.127, 1.2, -4.136, metal);
  // Two capped spare lenses stand upright, away from the camera's mounted barrel.
  function spare(x, z, h, r) {
    cylinder(r * 0.92, r, 0.016, x, 1.008, z, rubber);
    cylinder(r, r * 0.98, h - 0.026, x, 1.015 + (h - 0.026) / 2, z, body);
    cylinder(r * 1.04, r * 1.04, h * 0.24, x, 1.015 + h * 0.44, z, rubber);
    [1.025, 1.015 + h * 0.3, 1.015 + h * 0.69, 1.0 + h - 0.012].forEach((y) =>
      ring(r, 0.003, x, y, z, metal, 'y'),
    );
    cylinder(r * 1.025, r * 1.025, 0.018, x, 1.0 + h - 0.005, z, rubber);
    disc(r * 0.83, x, 1.0 + h + 0.005, z, coating, 'y');
    const cap = box(r * 1.12, 0.006, 0.017, x, 1.0 + h + 0.009, z, blackMetal);
    cap.rotation.y = 0.15;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12,
        o = box(
          0.006,
          h * 0.16,
          0.008,
          x + Math.sin(a) * r * 1.035,
          1.015 + h * 0.44,
          z + Math.cos(a) * r * 1.035,
          rubber,
        );
      o.rotation.y = a;
    }
  }
  spare(-3.38, -4.14, 0.206, 0.071);
  spare(-3.06, -4.13, 0.268, 0.079);
  // A folded travel tripod lies along the back edge, with head and locking collars.
  [-0.046, 0, 0.046].forEach((offset, i) => {
    const z = -4.44 + offset,
      y = 1.032 + (i === 1 ? 0.021 : 0);
    cylinder(0.012, 0.012, 0.565, -2.614, y, z, blackMetal, 'x', 12);
    cylinder(0.014, 0.014, 0.19, -2.49, y, z, metal, 'x', 12);
    [-2.74, -2.51].forEach((x) => cylinder(0.02, 0.02, 0.034, x, y, z, rubber, 'x', 12));
    cylinder(0.018, 0.014, 0.047, -2.309, y, z, rubber, 'x', 12);
  });
  cylinder(0.039, 0.039, 0.105, -2.928, 1.065, -4.44, body, 'x', 16);
  const ball = mesh(new THREE.SphereGeometry(0.034, 12, 8), metal, -2.97, 1.089, -4.44);
  box(0.106, 0.017, 0.083, -2.97, 1.132, -4.44, blackMetal);
  cylinder(0.013, 0.013, 0.045, -2.928, 1.063, -4.383, rubber, 'z', 12);
  // An unbranded fabric bag with rounded corners, zipper, grab handle and buckles.
  const bagX = -2.22,
    bagZ = -4.065,
    w = 0.52,
    h = 0.22,
    r = 0.037;
  const outline = new THREE.Shape();
  outline.moveTo(-w / 2 + r, 0);
  outline.lineTo(w / 2 - r, 0);
  outline.quadraticCurveTo(w / 2, 0, w / 2, r);
  outline.lineTo(w / 2, h - r);
  outline.quadraticCurveTo(w / 2, h, w / 2 - r, h);
  outline.lineTo(-w / 2 + r, h);
  outline.quadraticCurveTo(-w / 2, h, -w / 2, h - r);
  outline.lineTo(-w / 2, r);
  outline.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  outline.closePath();
  const bagGeometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.27,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.009,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 5,
  });
  bagGeometry.translate(0, 0, -0.135);
  mesh(bagGeometry, bagFabric, bagX, 1.014, bagZ);
  box(0.49, 0.035, 0.287, bagX, 1.243, bagZ, bagEdge);
  box(0.31, 0.105, 0.025, bagX, 1.094, -3.907, bagEdge);
  box(0.42, 0.005, 0.009, bagX, 1.265, -3.933, metal);
  [-0.158, 0.158].forEach((x) => {
    box(0.031, 0.165, 0.012, bagX + x, 1.126, -3.913, rubber);
    box(0.035, 0.035, 0.014, bagX + x, 1.145, -3.9, metal);
  });
  [-0.092, 0.092].forEach((x) => box(0.018, 0.067, 0.021, bagX + x, 1.291, bagZ, bagEdge));
  box(0.201, 0.021, 0.027, bagX, 1.33, bagZ, bagEdge);
  // A pair of batteries with exposed brass contacts, beside the bag.
  [-2.77, -2.61].forEach((x) => {
    box(0.105, 0.036, 0.071, x, 1.02, -3.977, rubber);
    box(0.087, 0.006, 0.058, x, 1.041, -3.977, body);
    [-0.025, 0, 0.025].forEach((dx) => box(0.012, 0.003, 0.016, x + dx, 1.046, -3.957, brass));
  });
  // A real strip beneath the STUDIO lightbox gives the small dark kit definition.
  const diffuser = mat(0xd8d3bf, 0xd0ceba, 0.56);
  diffuser.emissive.set(0xffd4a0);
  box(2.24, 0.035, 0.055, -3.2, 2.085, -4.625, blackMetal);
  box(2.1, 0.006, 0.035, -3.2, 2.0645, -4.618, diffuser);
  [-4.15, -2.25].forEach((x) => box(0.032, 0.035, 0.095, x, 2.11, -4.65, blackMetal));
  [-3.9, -2.5].forEach((x) => {
    const light = new THREE.SpotLight(0xffd0a0, 0, 1.7, 0.72, 0.8, 2);
    light.position.set(x, 2.045, -4.6);
    light.castShadow = false;
    const target = new THREE.Object3D();
    target.position.set(x, 1.02, -4.12);
    group.add(light, target);
    light.target = target;
    taskLights.push(light);
  });
  function mergeStatic() {
    group.updateMatrixWorld(true);
    const inverse = group.matrixWorld.clone().invert(),
      buckets = new Map(),
      old = [];
    group.traverse((o) => {
      if (!o.isMesh) return;
      const key = o.material.uuid + ':' + o.castShadow;
      if (!buckets.has(key))
        buckets.set(key, { m: o.material, cast: o.castShadow, p: [], n: [], uv: [] });
      const b = buckets.get(key),
        g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
      const p = g.attributes.position,
        n = g.attributes.normal,
        uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        b.p.push(p.getX(i), p.getY(i), p.getZ(i));
        b.n.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
        b.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
      }
      g.dispose();
      old.push(o);
    });
    old.forEach((o) => o.removeFromParent());
    new Set(old.map((o) => o.geometry)).forEach((g) => {
      geometries.delete(g);
      g.dispose();
    });
    buckets.forEach((b) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      mesh(g, b.m, 0, 0, 0, b.cast);
    });
  }
  mergeStatic();
  function setTheme(value) {
    if (disposed) return;
    const t = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    transitions.forEach(({ m, a, b }) => m.color.copy(a).lerp(b, t));
    diffuser.emissiveIntensity = 0.025 + 0.875 * t;
    taskLights.forEach((light) => (light.intensity = 0.01 + 0.3 * t));
  }
  setTheme(theme);
  return {
    group,
    setTheme,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      taskLights.forEach((light) => light.dispose?.());
    },
  };
}
