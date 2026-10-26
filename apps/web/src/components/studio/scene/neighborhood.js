/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianNeighborhood(THREE, { world, theme = 1 } = {}) {
  if (!THREE || !world) throw new Error('The neighborhood needs THREE and its world group.');
  const group = new THREE.Group();
  group.name = 'Across the street — neighboring storefronts';
  world.add(group);
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set(),
    transitions = [];
  let disposed = false,
    currentTheme = 1,
    pulse = 1;
  function mat(day, night = day, roughness = 0.8, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ color: day, roughness, metalness });
    materials.add(m);
    transitions.push({ m, a: new THREE.Color(day), b: new THREE.Color(night) });
    return m;
  }
  function mesh(g, m, x = 0, y = 0, z = 0, cast = true) {
    geometries.add(g);
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = cast;
    o.receiveShadow = true;
    group.add(o);
    return o;
  }
  function box(w, h, d, x, y, z, m, cast = true) {
    return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, cast);
  }
  function face(w, h, x, y, z, m) {
    return mesh(new THREE.PlaneGeometry(w, h), m, x, y, z, false);
  }
  function texture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    textures.add(t);
    return t;
  }
  const stucco = mat(0xb3ada0, 0x36434d, 0.96),
    brick = mat(0xa99a8b, 0x3c4148, 0.95);
  const trim = mat(0x737b78, 0x34434c, 0.78),
    base = mat(0x8c928d, 0x2a3943, 0.96);
  const metal = mat(0x344849, 0x142a35, 0.5, 0.45),
    roof = mat(0x56625e, 0x25333c, 0.93);
  const awningA = mat(0x466467, 0x203c47, 0.88),
    awningB = mat(0x8e6456, 0x49363c, 0.91);
  const brass = mat(0xada080, 0x8e826a, 0.45, 0.6),
    darkGlass = mat(0x3e565b, 0x172c36, 0.3, 0.2);
  const coffeeEdge = mat(0x759b9c, 0x789b9c, 0.36, 0.35);
  coffeeEdge.emissive.set(0x65d4dd);
  const bladeEdge = mat(0x9a7578, 0x9a7578, 0.35, 0.3);
  bladeEdge.emissive.set(0xe895a1);
  const lantern = mat(0xe0bc8a, 0xd8b68a, 0.81);
  lantern.emissive.set(0xffc78b);
  const warmStrip = mat(0xc8c9b1, 0xb9b8a2, 0.6);
  warmStrip.emissive.set(0xffd5a0);
  function litFace(draw, w = 512, h = 384, tint = 0xffd1a0) {
    const m = mat(0xb6bab2, 0xd6d0be, 0.47, 0.1);
    m.map = texture(w, h, draw);
    m.emissiveMap = m.map;
    m.emissive.set(tint);
    return m;
  }
  function interior(ctx, w, h, variant) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#263b42');
    gradient.addColorStop(0.47, variant ? '#765a43' : '#8d7855');
    gradient.addColorStop(1, '#202e34');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = variant ? '#c5a26e' : '#b9aa7a';
    ctx.fillRect(w * 0.11, h * 0.17, w * 0.77, h * 0.018);
    ctx.fillStyle = '#302f2b';
    ctx.fillRect(w * 0.08, h * 0.38, w * 0.29, h * 0.25);
    ctx.fillRect(w * 0.48, h * 0.35, w * 0.4, h * 0.29);
    ctx.fillStyle = '#8d7a58';
    [0, 0.1, 0.2].forEach((v) => ctx.fillRect(w * 0.1, (0.41 + v) * h, w * 0.25, h * 0.015));
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#726b54' : '#aba17c';
      ctx.fillRect(w * (0.12 + i * 0.032), h * 0.43, w * 0.018, h * (0.06 + (i % 3) * 0.014));
    }
    ctx.fillStyle = '#4b493c';
    ctx.fillRect(w * 0.04, h * 0.65, w * 0.91, h * 0.35);
    ctx.fillStyle = '#ac9266';
    ctx.fillRect(w * 0.04, h * 0.645, w * 0.91, h * 0.035);
    ctx.fillStyle = '#26343a';
    ctx.fillRect(w * 0.5, h * 0.52, w * 0.16, h * 0.13);
    ctx.fillRect(w * 0.69, h * 0.56, w * 0.09, h * 0.08);
    [0.23, 0.73].forEach((x) => {
      ctx.strokeStyle = '#293b3e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * x, 0);
      ctx.lineTo(w * x, h * 0.23);
      ctx.stroke();
      ctx.fillStyle = '#d4b37c';
      ctx.beginPath();
      ctx.ellipse(w * x, h * 0.25, w * 0.055, h * 0.025, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(174,216,218,.08)';
    ctx.beginPath();
    ctx.moveTo(w * 0.08, 0);
    ctx.lineTo(w * 0.16, 0);
    ctx.lineTo(w * 0.55, h);
    ctx.lineTo(w * 0.49, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(18,42,51,.25)';
    ctx.fillRect(0, h * 0.83, w, h * 0.17);
  }
  const coffeeGlass = litFace((c, w, h) => interior(c, w, h, 0)),
    ramenGlass = litFace((c, w, h) => interior(c, w, h, 1));
  const upperGlass = litFace(
    (ctx, w, h) => {
      ctx.fillStyle = '#987d56';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#bda06e';
      ctx.fillRect(w * 0.1, 0, w * 0.8, h);
      ctx.fillStyle = '#766b50';
      ctx.fillRect(w * 0.07, 0, w * 0.19, h);
      ctx.fillRect(w * 0.75, 0, w * 0.18, h);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(31,44,44,.10)' : 'rgba(229,205,156,.10)';
        ctx.fillRect((0.08 + i * 0.105) * w, 0, w * 0.018, h);
      }
      ctx.fillStyle = '#4c4a3f';
      ctx.fillRect(0, h * 0.89, w, h * 0.11);
    },
    256,
    128,
  );
  const coffeeSign = litFace(
    (ctx, w, h) => {
      ctx.fillStyle = '#132b34';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#8bdee2';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 84px Arial, sans-serif';
      ctx.fillText('NIGHT OWL', w / 2, h * 0.42);
      ctx.font = '500 26px Arial, sans-serif';
      ctx.fillStyle = '#c3d7cf';
      ctx.fillText('C O F F E E', w / 2, h * 0.84);
    },
    1024,
    160,
    0x79dce2,
  );
  const ramenSign = litFace(
    (ctx, w, h) => {
      ctx.fillStyle = '#432c38';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#a7797e';
      ctx.lineWidth = 5;
      ctx.strokeRect(13, 13, w - 26, h - 26);
      ctx.fillStyle = '#efb4b5';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 109px Arial, sans-serif';
      [...'RAMEN'].forEach((letter, i) => ctx.fillText(letter, w / 2, 105 + i * 139));
    },
    256,
    768,
    0xf3a3aa,
  );
  function opening(x, y, w, h, glass, front = -11) {
    box(w + 0.13, h + 0.13, 0.1, x, y, front + 0.03, metal, false);
    face(w, h, x, y, front + 0.088, glass);
    box(w + 0.16, 0.05, 0.16, x, y - h / 2 - 0.04, front + 0.04, trim, false);
  }
  function door(x, w, glass, front = -11) {
    opening(x, 1.225, w, 2.0, glass, front);
    box(0.022, 1.96, 0.025, x, 1.225, front + 0.112, metal, false);
    box(0.024, 0.3, 0.035, x + w * 0.31, 1.23, front + 0.139, brass, false);
    box(w + 0.16, 0.025, 0.29, x, 0.2125, front + 0.11, base, false);
  }
  const buildingBounds = [];
  function shell(x, w, rear, top, wall) {
    const front = -11,
      deck = top - 0.28,
      bodyFront = front - 0.14;
    box(w + 0.12, 0.2, front - rear + 0.12, x, 0.1, (front + rear) / 2, base);
    // Opaque side/back mass is set behind the recessed storefront glazing.
    box(w, deck - 0.2, bodyFront - rear, x, (deck + 0.2) / 2, (bodyFront + rear) / 2, wall);
    box(w + 0.05, 0.07, front - rear + 0.05, x, deck - 0.035, (front + rear) / 2, roof);
    box(w + 0.1, 0.28, 0.12, x, top - 0.14, front - 0.015, wall);
    box(w + 0.1, 0.28, 0.12, x, top - 0.14, rear + 0.015, wall);
    [-1, 1].forEach((side) =>
      box(0.1, 0.28, front - rear, x + (side * w) / 2, top - 0.14, (front + rear) / 2, wall),
    );
    box(w + 0.12, 0.045, 0.18, x, top - 0.0225, front + 0.01, trim);
    box(w + 0.08, 0.24, 0.16, x, 0.29, front + 0.005, base, false);
    [-1, 1].forEach((side) =>
      box(0.19, 2.18, 0.22, x + side * (w / 2 - 0.105), 1.21, front - 0.01, wall),
    );
    // Compact rooftop equipment sits below the parapet, keeping the skyline low.
    const unitX = x + w * 0.2,
      unitZ = rear + 0.65;
    box(0.66, 0.22, 0.52, unitX, deck + 0.11, unitZ, trim);
    box(0.72, 0.025, 0.57, unitX, deck + 0.232, unitZ, metal);
    for (let i = 0; i < 5; i++)
      box(0.048, 0.12, 0.012, unitX - 0.23 + i * 0.115, deck + 0.12, unitZ + 0.267, metal, false);
    const pipe = mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 2.38, 8),
      metal,
      x - w / 2 + 0.075,
      1.35,
      front + 0.04,
      false,
    );
    buildingBounds.push({
      min: [x - w / 2 - 0.06, 0, rear - 0.06],
      max: [x + w / 2 + 0.06, top, front + 0.5],
    });
  }
  // Exact low silhouettes keep the nearby studio and sailboat in front.
  shell(2.8, 4, -13.2, 3.8, stucco);
  opening(2.155, 1.27, 2.13, 1.72, coffeeGlass);
  door(3.945, 1.03, coffeeGlass);
  box(0.075, 1.75, 0.07, 2.15, 1.27, -10.87, metal, false);
  const awning = box(3.55, 0.065, 0.48, 2.8, 2.355, -10.78, awningA);
  awning.rotation.x = 0.08;
  box(3.56, 0.11, 0.055, 2.8, 2.29, -10.524, awningA, false);
  box(3.42, 0.018, 0.027, 2.8, 2.31, -10.65, warmStrip, false);
  box(3.58, 0.47, 0.115, 2.8, 2.665, -10.945, metal);
  face(3.47, 0.4, 2.8, 2.665, -10.881, coffeeSign);
  box(3.51, 0.014, 0.015, 2.8, 2.438, -10.874, coffeeEdge, false);
  [1.65, 3.83].forEach((x, i) => {
    opening(x, 3.13, 0.76, 0.43, i ? darkGlass : upperGlass);
    box(0.027, 0.43, 0.03, x, 3.13, -10.89, metal, false);
  });
  shell(7.8, 5, -13, 3.6, brick);
  opening(6.65, 1.26, 2.02, 1.7, ramenGlass);
  door(8.23, 0.91, ramenGlass);
  opening(9.34, 1.26, 0.94, 1.7, ramenGlass);
  const ramenAwning = box(4.38, 0.06, 0.44, 7.8, 2.36, -10.8, awningB);
  ramenAwning.rotation.x = 0.07;
  box(4.4, 0.105, 0.045, 7.8, 2.3, -10.564, awningB, false);
  [6.12, 7.82, 9.48].forEach((x, i) =>
    opening(x, 2.99, 0.73, 0.42, i === 1 ? darkGlass : upperGlass),
  );
  [6.03, 9.29].forEach((x) => {
    const o = mesh(new THREE.SphereGeometry(0.115, 12, 10), lantern, x, 2.12, -10.72, false);
    o.scale.y = 1.22;
    box(0.045, 0.033, 0.045, x, 2.28, -10.72, metal, false);
  });
  const blade = new THREE.Group();
  blade.position.set(10.08, 2.6, -10.67);
  blade.rotation.y = -0.55;
  group.add(blade);
  function bladeMesh(g, m, z = 0) {
    geometries.add(g);
    const o = new THREE.Mesh(g, m);
    o.position.z = z;
    o.castShadow = false;
    o.receiveShadow = true;
    blade.add(o);
    return o;
  }
  bladeMesh(new THREE.BoxGeometry(0.37, 1.12, 0.075), metal);
  bladeMesh(new THREE.PlaneGeometry(0.31, 1.055), ramenSign, 0.043);
  const edge = bladeMesh(new THREE.BoxGeometry(0.018, 1.06, 0.012), bladeEdge, 0.048);
  edge.position.x = -0.17;
  box(0.042, 0.055, 0.4, 10.04, 3.06, -10.83, metal, false);
  box(0.042, 0.055, 0.4, 10.04, 2.14, -10.83, metal, false);
  const warmLights = [];
  [
    [2.1, 1.6, -10.6],
    [7.1, 1.65, -10.64],
  ].forEach((p) => {
    const l = new THREE.PointLight(0xffc995, 0, 3.4, 2);
    l.position.set(...p);
    l.castShadow = false;
    group.add(l);
    warmLights.push(l);
  });
  const coffeeBounce = new THREE.PointLight(0x68d9e0, 0, 5.6, 2),
    ramenBounce = new THREE.PointLight(0xe997a3, 0, 4.5, 2);
  coffeeBounce.position.set(2.8, 2.62, -10.62);
  ramenBounce.position.set(10.08, 2.6, -10.35);
  coffeeBounce.castShadow = ramenBounce.castShadow = false;
  group.add(coffeeBounce, ramenBounce);
  const reflectionSources = [
    {
      position: [2.8, 2.665, -10.88],
      width: 3.47,
      height: 0.4,
      color: 0x70dbe2,
      tint: '#70dbe2',
      level: 0,
    },
    {
      position: [10.08, 2.6, -10.62],
      width: 0.31,
      height: 1.055,
      color: 0xe997a3,
      tint: '#e997a3',
      level: 0,
    },
    {
      position: [2.155, 1.27, -10.91],
      width: 2.13,
      height: 1.72,
      color: 0xf0c38b,
      tint: '#f0c38b',
      level: 0,
    },
    {
      position: [6.65, 1.26, -10.91],
      width: 2.02,
      height: 1.7,
      color: 0xe9b37e,
      tint: '#e9b37e',
      level: 0,
    },
  ];
  // Merge static surfaces by material while baking the angled awnings and blade.
  function mergeStatic() {
    group.updateMatrixWorld(true);
    const inverse = group.matrixWorld.clone().invert(),
      buckets = new Map(),
      old = [];
    group.traverse((o) => {
      if (!o.isMesh) return;
      const k = o.material.uuid + ':' + o.castShadow;
      if (!buckets.has(k))
        buckets.set(k, { m: o.material, cast: o.castShadow, p: [], n: [], uv: [] });
      const b = buckets.get(k),
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
    const oldGeometry = new Set(old.map((o) => o.geometry));
    oldGeometry.forEach((g) => {
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
    blade.removeFromParent();
  }
  mergeStatic();
  function lighting() {
    const n = THREE.MathUtils.smoothstep(currentTheme, 0.08, 0.95);
    coffeeSign.emissiveIntensity = (0.025 + 1.12 * n) * pulse;
    coffeeEdge.emissiveIntensity = (0.015 + 0.7 * n) * pulse;
    ramenSign.emissiveIntensity = 0.02 + 1.03 * n;
    bladeEdge.emissiveIntensity = 0.015 + 0.76 * n;
    coffeeGlass.emissiveIntensity = 0.015 + 0.44 * n;
    ramenGlass.emissiveIntensity = 0.015 + 0.4 * n;
    upperGlass.emissiveIntensity = 0.02 + 0.54 * n;
    lantern.emissiveIntensity = 0.04 + 0.76 * n;
    warmStrip.emissiveIntensity = 0.02 + 0.38 * n;
    warmLights.forEach((l) => (l.intensity = 0.005 + 0.3 * n));
    coffeeBounce.intensity = 0.65 * n * pulse;
    ramenBounce.intensity = 0.4 * n;
    reflectionSources[0].level = (0.008 + 0.66 * n) * pulse;
    reflectionSources[1].level = 0.006 + 0.44 * n;
    reflectionSources[2].level = 0.006 + 0.22 * n;
    reflectionSources[3].level = 0.006 + 0.2 * n;
  }
  function setTheme(value) {
    if (disposed) return;
    currentTheme = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    transitions.forEach(({ m, a, b }) => m.color.copy(a).lerp(b, currentTheme));
    lighting();
  }
  function update(time, { active = true, reducedMotion = false } = {}) {
    if (disposed) return false;
    const moving = active && !reducedMotion && currentTheme > 0.08 && Number.isFinite(time);
    const next = moving ? 1 + 0.035 * Math.sin((time * Math.PI * 2) / 18) : 1,
      changed = Math.abs(next - pulse) > 0.00001;
    if (changed) {
      pulse = next;
      lighting();
    }
    return moving || changed;
  }
  setTheme(theme);
  return {
    group,
    reflectionSources,
    buildingBounds,
    setTheme,
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      warmLights.forEach((l) => l.dispose?.());
      coffeeBounce.dispose?.();
      ramenBounce.dispose?.();
    },
  };
}
