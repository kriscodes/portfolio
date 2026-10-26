/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianIndoorPlants(THREE, options = {}) {
  if (!THREE || !options.world) throw new Error('Indoor plants need THREE and their world group.');
  const world = options.world,
    group = new THREE.Group();
  group.name = 'Indoor decorative palm, bonsai and conifer';
  world.add(group);
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set(),
    instances = new Set(),
    transitions = [];
  const clamp = THREE.MathUtils.clamp;
  let theme = 1,
    disposed = false,
    seed = 918273;
  function rand() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const between = (a, b) => a + (b - a) * rand();
  function material(day, night, roughness = 0.7, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ color: day, roughness, metalness });
    materials.add(m);
    transitions.push({
      m,
      day: new THREE.Color(day),
      night: new THREE.Color(night === undefined ? day : night),
    });
    return m;
  }
  const bark = material(0x745441, 0x4d4346, 0.88),
    barkLight = material(0xa5805b, 0x777461, 0.86);
  const rootBark = material(0x8c6a4b, 0x66504e, 0.9),
    stone = material(0x8a9992, 0x3f5b65, 0.85);
  const soil = material(0x514c39, 0x283a35, 0.95),
    moss = material(0x6f8843, 0x3c705a, 0.92);
  const leafMaterial = material(0xe4e5c5, 0x8ab9a7, 0.63, 0.02);
  leafMaterial.side = THREE.DoubleSide;
  leafMaterial.emissive.set(0x174f47);
  const pineCore = material(0x2f5941, 0x204e48, 0.83);
  const pineMaterial = material(0xc2d3ad, 0x67a798, 0.72);
  pineMaterial.side = THREE.DoubleSide;
  pineMaterial.emissive.set(0x134b4b);
  const palmMaterial = material(0xa9c77f, 0x70ac96, 0.62);
  palmMaterial.side = THREE.DoubleSide;
  palmMaterial.vertexColors = true;
  palmMaterial.emissive.set(0x143b3d);
  function mesh(g, m, x = 0, y = 0, z = 0, parent = group) {
    geometries.add(g);
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const box = (w, h, d, x, y, z, m, p) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, p);
  const cylinder = (rt, rb, h, x, y, z, m, p, n = 28) =>
    mesh(new THREE.CylinderGeometry(rt, rb, h, n), m, x, y, z, p);
  function tube(points, r0, r1, m, parent = group, steps = 20, sides = 9) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const frames = curve.computeFrenetFrames(steps, false),
      vertices = [],
      normals = [],
      uv = [],
      indices = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        p = curve.getPoint(t),
        radius = THREE.MathUtils.lerp(r0, r1, Math.pow(t, 0.8));
      for (let j = 0; j <= sides; j++) {
        const a = (j / sides) * Math.PI * 2,
          n = frames.normals[i]
            .clone()
            .multiplyScalar(Math.cos(a))
            .addScaledVector(frames.binormals[i], Math.sin(a));
        vertices.push(p.x + n.x * radius, p.y + n.y * radius, p.z + n.z * radius);
        normals.push(n.x, n.y, n.z);
        uv.push(j / sides, t);
        if (i < steps && j < sides) {
          const k = i * (sides + 1) + j;
          indices.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    return mesh(g, m, 0, 0, 0, parent);
  }
  function line(a, b, r, m, parent = group) {
    return tube([a, b], r, r * 0.8, m, parent, 1, 7);
  }
  // One small procedural grain texture gives the trunk ridges a natural dry-bark finish.
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#cbb394';
    ctx.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 86; i++) {
      const x = rand() * 128;
      ctx.strokeStyle = `rgba(49,31,24,${between(0.05, 0.23)})`;
      ctx.lineWidth = between(0.5, 2.2);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + between(-8, 8), 85, x + between(-8, 8), 175, x + between(-5, 5), 256);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 3);
    textures.add(texture);
    bark.map = texture;
    rootBark.map = texture;
  }
  function leafGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, 0, 0, -0.43, 0.38, 0.035, 0, 1, 0, 0.43, 0.38, 0.035, 0, 0.42, 0.13],
        3,
      ),
    );
    g.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
    g.computeVertexNormals();
    geometries.add(g);
    return g;
  }
  const leafShape = leafGeometry(),
    dummy = new THREE.Object3D(),
    instanceColor = new THREE.Color();
  const bonsai = new THREE.Group();
  bonsai.name = 'Sculptural windswept bonsai';
  bonsai.position.set(-5.08, 1.155, -4.16);
  bonsai.scale.setScalar(0.32);
  group.add(bonsai);
  // The exposed root flare sits directly in moss and soil.
  const mossPatches = [
    [-0.27, 0.314, 0.13, 0.2, 0.13],
    [0.29, 0.318, 0.1, 0.18, 0.11],
    [-0.08, 0.32, -0.2, 0.23, 0.12],
    [0.18, 0.318, -0.16, 0.16, 0.13],
  ];
  mossPatches.forEach(([x, y, z, sx, sz]) => {
    const g = new THREE.SphereGeometry(1, 14, 8);
    const o = mesh(g, moss, x, y, z, bonsai);
    o.scale.set(sx, 0.035, sz);
  });
  for (let i = 0; i < 19; i++) {
    const a = rand() * Math.PI * 2,
      r = between(0.28, 0.49);
    const o = mesh(
      new THREE.DodecahedronGeometry(between(0.018, 0.047), 0),
      stone,
      Math.cos(a) * r,
      0.327,
      Math.sin(a) * r * 0.65,
      bonsai,
    );
    o.rotation.set(rand(), rand(), rand());
    o.scale.y = 0.65;
  }
  // The trunk follows a double bend, with taper and exposed nebari roots.
  const trunk = [
    [0.02, 0.32, 0.015],
    [-0.06, 0.53, 0.02],
    [-0.14, 0.8, -0.01],
    [0.04, 1.1, -0.045],
    [0.12, 1.36, -0.025],
    [-0.02, 1.62, -0.015],
    [0.03, 1.86, -0.02],
  ];
  tube(trunk, 0.125, 0.026, bark, bonsai, 33, 13);
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7 + 0.2,
      r = between(0.25, 0.39);
    tube(
      [
        [0.02, 0.36, 0.015],
        [Math.cos(a) * 0.1, 0.34, Math.sin(a) * 0.075],
        [Math.cos(a) * r, 0.318, Math.sin(a) * r * 0.72],
      ],
      0.05,
      0.009,
      rootBark,
      bonsai,
      12,
      8,
    );
  }
  const branchPaths = [
    [
      [-0.08, 0.68, 0.0],
      [-0.26, 0.87, 0.04],
      [-0.47, 1.0, 0.1],
      [-0.67, 1.035, 0.12],
    ],
    [
      [-0.02, 0.95, -0.025],
      [0.2, 1.12, 0.025],
      [0.42, 1.18, 0.08],
      [0.58, 1.19, 0.1],
    ],
    [
      [0.1, 1.24, -0.03],
      [-0.09, 1.37, -0.08],
      [-0.38, 1.45, -0.08],
      [-0.62, 1.46, -0.08],
    ],
    [
      [0.07, 1.45, -0.02],
      [0.27, 1.59, -0.1],
      [0.48, 1.64, -0.08],
    ],
    [
      [-0.015, 1.66, -0.02],
      [0.02, 1.82, -0.05],
      [-0.05, 1.92, -0.02],
    ],
  ];
  branchPaths.forEach((p, i) => {
    tube(p, 0.05 - i * 0.006, 0.009, bark, bonsai, 18, 9);
    const end = p[p.length - 1];
    [-1, 1].forEach((side) =>
      tube(
        [p[p.length - 2], end, [end[0] + side * 0.12, end[1] + 0.035, end[2] + side * 0.1]],
        0.013,
        0.003,
        barkLight,
        bonsai,
        7,
        7,
      ),
    );
  });
  // Fine bark ribs follow the lower bend instead of covering it with a smooth cylinder.
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    tube(
      trunk
        .slice(0, 5)
        .map((p, j) => [
          p[0] + Math.cos(a) * (0.105 - j * 0.013),
          p[1],
          p[2] + Math.sin(a) * (0.105 - j * 0.013),
        ]),
      0.009,
      0.004,
      barkLight,
      bonsai,
      24,
      5,
    );
  }
  const pads = [
    [-0.48, 1.045, 0.12, 0.4, 0.28, 0.18],
    [0.39, 1.235, 0.09, 0.31, 0.26, 0.17],
    [-0.3, 1.48, -0.08, 0.45, 0.3, 0.19],
    [0.28, 1.69, -0.08, 0.35, 0.27, 0.18],
    [-0.02, 1.94, -0.02, 0.42, 0.3, 0.22],
  ];
  const leafCount = 1000,
    leaves = new THREE.InstancedMesh(leafShape, leafMaterial, leafCount);
  instances.add(leaves);
  leaves.name = 'Individual bonsai leaves';
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  bonsai.add(leaves);
  for (let i = 0; i < leafCount; i++) {
    const p = pads[i % pads.length],
      a = rand() * Math.PI * 2,
      r = Math.sqrt(rand()),
      edge = Math.max(0, 1 - r * r);
    const x = p[0] + Math.cos(a) * p[3] * r,
      z = p[2] + Math.sin(a) * p[4] * r,
      y = p[1] + p[5] * (0.2 + Math.sqrt(edge) * 0.8) + between(-0.045, 0.025);
    dummy.position.set(x, y, z);
    dummy.rotation.set(
      -Math.PI / 2 + between(-0.65, 0.65),
      a + between(-0.8, 0.8),
      between(-0.6, 0.6),
    );
    dummy.scale.set(between(0.043, 0.067), between(0.075, 0.125), 0.07);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    instanceColor.setHSL(between(0.23, 0.35), between(0.34, 0.56), between(0.23, 0.45));
    leaves.setColorAt(i, instanceColor);
  }
  leaves.instanceMatrix.needsUpdate = true;
  leaves.instanceColor.needsUpdate = true;
  // Additional tiny peripheral twigs create layered, clipped cloud pads with visible air gaps.
  pads.forEach((p) => {
    for (let j = 0; j < 8; j++) {
      const a = (j * Math.PI) / 4;
      line(
        [p[0], p[1] - 0.04, p[2]],
        [p[0] + Math.cos(a) * p[3] * 0.72, p[1] + 0.045, p[2] + Math.sin(a) * p[4] * 0.72],
        0.005,
        barkLight,
        bonsai,
      );
    }
  });
  bonsai.children.forEach((child) => (child.position.y -= 0.3));
  const conifers = new THREE.Group();
  conifers.name = 'Slender companion conifers';
  group.add(conifers);
  function conifer(position, height, radius, index) {
    const tree = new THREE.Group();
    tree.position.set(...position);
    tree.name = 'Companion conifer ' + (index + 1);
    conifers.add(tree);
    const trunkEnd = [Math.sin(index + 1) * 0.045, height * 0.95, 0.018];
    tube([[0, 0.012, 0], [0.018, height * 0.55, -0.01], trunkEnd], 0.032, 0.008, bark, tree, 18, 8);
    const count = 500,
      foliage = new THREE.InstancedMesh(leafShape, pineMaterial, count);
    instances.add(foliage);
    foliage.name = 'Airy conifer branch sprays';
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    tree.add(foliage);
    // Low, overlapping inner whorls supply a readable evergreen silhouette.
    // Fine individual sprays stay outside this dark core and retain the airy tips.
    for (let layer = 0; layer < 7; layer++) {
      const t = (layer + 0.15) / 7,
        bottom = 0.32 + (height - 0.38) * t - 0.055;
      const coreHeight = Math.min(((height - 0.33) / 7) * 1.55, height - 0.05 - bottom);
      const coreRadius = (radius * Math.pow(1 - t, 0.78) + 0.017) * 0.84;
      const core = mesh(
        new THREE.ConeGeometry(coreRadius, coreHeight, 9, 1),
        pineCore,
        0,
        bottom + coreHeight / 2,
        0,
        tree,
      );
      core.rotation.y = layer * 0.71;
    }
    const tiers = 10;
    let n = 0;
    for (let tier = 0; tier < tiers; tier++) {
      const t = tier / (tiers - 1),
        y = 0.32 + (height - 0.38) * t,
        spread = radius * Math.pow(1 - t, 0.78) + 0.017;
      const countBranches = tier > 7 ? 4 : 6;
      for (let b = 0; b < countBranches; b++) {
        const angle = (b / countBranches) * Math.PI * 2 + tier * 1.61,
          tip = [Math.cos(angle) * spread, y + 0.035, Math.sin(angle) * spread];
        tube(
          [[0, y + 0.03, 0], [tip[0] * 0.5, y - 0.025, tip[2] * 0.5], tip],
          0.009 * (1 - t * 0.65),
          0.002,
          barkLight,
          tree,
          5,
          5,
        );
        for (let k = 0; k < 9 && n < count; k++, n++) {
          const along = between(0.25, 1),
            side = between(-0.055, 0.055);
          dummy.position.set(
            tip[0] * along - Math.sin(angle) * side,
            y + between(-0.02, 0.09),
            tip[2] * along + Math.cos(angle) * side,
          );
          dummy.rotation.set(
            -Math.PI / 2 + between(-0.65, 0.4),
            angle + between(-0.55, 0.55),
            between(-0.5, 0.5),
          );
          dummy.scale.set(between(0.028, 0.045), between(0.08, 0.14) * (1 - t * 0.2), 0.045);
          dummy.updateMatrix();
          foliage.setMatrixAt(n, dummy.matrix);
          instanceColor.setHSL(between(0.34, 0.43), between(0.32, 0.54), between(0.24, 0.43));
          foliage.setColorAt(n, instanceColor);
        }
      }
    }
    foliage.count = n;
    foliage.instanceMatrix.needsUpdate = true;
    foliage.instanceColor.needsUpdate = true;
    const cap = mesh(
      new THREE.ConeGeometry(radius * 0.065, 0.2, 5),
      pineMaterial,
      trunkEnd[0],
      height - 0.015,
      trunkEnd[2],
      tree,
    );
    cap.castShadow = false;
    for (let r = 0; r < 4; r++) {
      const a = (r * Math.PI) / 2 + index * 0.6;
      tube(
        [
          [0, 0.055, 0],
          [Math.cos(a) * radius * 0.36, 0.024, Math.sin(a) * radius * 0.36],
          [Math.cos(a) * radius * 0.72, 0.005, Math.sin(a) * radius * 0.72],
        ],
        0.022,
        0.004,
        rootBark,
        tree,
        7,
        6,
      );
    }
  }
  conifer([-1.85, 0.474, 0.35], 0.72, 0.2, 0);
  const palm = new THREE.Group();
  palm.name = 'Indoor feather palm';
  palm.position.set(-0.95, 0.574, 0.35);
  palm.scale.setScalar(0.43);
  group.add(palm);
  // A narrow feather palm fits inside the open corner, below the studio canopy.
  const stemCurve = new THREE.CatmullRomCurve3(
    [
      [0, 0.012, 0],
      [-0.075, 1.3, -0.015],
      [-0.08, 2.3, -0.015],
      [0.04, 3.25, -0.07],
      [0.14, 4.13, -0.13],
    ].map((p) => new THREE.Vector3(...p)),
  );
  tube(
    [
      [0, 0.012, 0],
      [-0.075, 1.3, -0.015],
      [-0.08, 2.3, -0.015],
      [0.04, 3.25, -0.07],
      [0.14, 4.13, -0.13],
    ],
    0.105,
    0.052,
    barkLight,
    palm,
    44,
    12,
  );
  for (let i = 0; i < 43; i++) {
    const t = (i + 0.3) / 43,
      p = stemCurve.getPoint(t),
      tangent = stemCurve.getTangent(t),
      r = 0.102 - 0.05 * t;
    const scar = mesh(
      new THREE.TorusGeometry(r, 0.009 + (1 - t) * 0.003, 5, 16),
      i % 3 ? bark : rootBark,
      p.x,
      p.y,
      p.z,
      palm,
    );
    scar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    scar.castShadow = false;
  }
  const crown = new THREE.Vector3(0.14, 4.13, -0.13);
  // Palm fronds are curved pinnate leaflets with folded spines, never solid flat fans.
  const frondVertices = [],
    frondColors = [],
    frondIndices = [];
  const frondColor = new THREE.Color();
  function triangle(a, b, c, color) {
    const n = frondVertices.length / 3;
    [a, b, c].forEach((p) => {
      frondVertices.push(p.x, p.y, p.z);
      frondColors.push(color.r, color.g, color.b);
    });
    frondIndices.push(n, n + 1, n + 2);
  }
  for (let i = 0; i < 11; i++) {
    const angle = (i / 11) * Math.PI * 2 + 0.18,
      reach = between(0.75, 1.05),
      lift = between(0.42, 0.62),
      drop = between(0.09, 0.25);
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const points = [
      crown.clone(),
      crown
        .clone()
        .addScaledVector(direction, reach * 0.35)
        .add(new THREE.Vector3(0, lift, 0)),
      crown
        .clone()
        .addScaledVector(direction, reach * 0.78)
        .add(new THREE.Vector3(0, lift * 0.62, 0)),
      crown
        .clone()
        .addScaledVector(direction, reach)
        .add(new THREE.Vector3(0, -drop, 0)),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    tube(
      points.map((p) => p.toArray()),
      0.018,
      0.003,
      moss,
      palm,
      20,
      6,
    );
    for (let j = 1; j < 19; j++) {
      const t = j / 20,
        center = curve.getPoint(t),
        tangent = curve.getTangent(t),
        side = new THREE.Vector3(-direction.z, 0, direction.x);
      const span = (0.035 + 0.205 * Math.pow(Math.sin(t * Math.PI), 0.7)) * (1 - t * 0.22);
      [-1, 1].forEach((sign) => {
        const root = center.clone().addScaledVector(tangent, -0.025),
          tip = center
            .clone()
            .addScaledVector(side, sign * span)
            .addScaledVector(direction, 0.085)
            .add(new THREE.Vector3(0, -0.07 - 0.05 * t, 0));
        const middle = root
          .clone()
          .lerp(tip, 0.5)
          .add(new THREE.Vector3(0, 0.022, 0));
        const width = 0.021 * (1 - t * 0.45),
          a = root.clone().addScaledVector(tangent, -width),
          b = root.clone().addScaledVector(tangent, width);
        frondColor.setHSL(between(0.25, 0.35), between(0.37, 0.57), between(0.34, 0.48));
        triangle(a, middle, tip, frondColor);
        triangle(middle, b, tip, frondColor);
      });
    }
  }
  // Three upright spear leaves create a distinct feathered crown above the drooping outer fronds.
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const end = crown
      .clone()
      .add(new THREE.Vector3(Math.cos(angle) * 0.21, 0.72, Math.sin(angle) * 0.21));
    tube(
      [crown.toArray(), crown.clone().lerp(end, 0.6).toArray(), end.toArray()],
      0.024,
      0.002,
      moss,
      palm,
      12,
      6,
    );
  }
  const frondGeometry = new THREE.BufferGeometry();
  frondGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frondVertices, 3));
  frondGeometry.setAttribute('color', new THREE.Float32BufferAttribute(frondColors, 3));
  frondGeometry.setIndex(frondIndices);
  frondGeometry.computeVertexNormals();
  mesh(frondGeometry, palmMaterial, 0, 0, 0, palm);
  for (let r = 0; r < 6; r++) {
    const a = (r * Math.PI) / 3;
    tube(
      [
        [0, 0.085, 0],
        [Math.cos(a) * 0.12, 0.035, Math.sin(a) * 0.12],
        [Math.cos(a) * 0.25, 0.005, Math.sin(a) * 0.25],
      ],
      0.038,
      0.005,
      rootBark,
      palm,
      9,
      7,
    );
  }
  const planters = new THREE.Group();
  planters.name = 'Indoor ceramic planters';
  group.add(planters);
  const ceramic = material(0xb4b3a2, 0x34454c, 0.52, 0.06),
    potRim = material(0x858d80, 0x4d6268, 0.43, 0.15);
  // The bonsai lives in a shallow oval dish on the back counter.
  const bonsaiDish = cylinder(0.5, 0.45, 0.16, -5.08, 1.08, -4.16, ceramic, planters, 36);
  bonsaiDish.scale.set(0.65, 1, 0.45);
  const bonsaiSoil = cylinder(0.468, 0.468, 0.01, -5.08, 1.153, -4.16, soil, planters, 36);
  bonsaiSoil.scale.set(0.65, 1, 0.45);
  const dishRim = mesh(
    new THREE.TorusGeometry(0.5, 0.022, 7, 36),
    potRim,
    -5.08,
    1.16,
    -4.16,
    planters,
  );
  dishRim.rotation.x = Math.PI / 2;
  dishRim.scale.set(0.65, 0.45, 1);
  // Both floor pots rest on the timber datum; soil covers the original root flare.
  cylinder(0.26, 0.21, 0.4, -0.95, 0.38, 0.35, ceramic, planters, 32);
  cylinder(0.237, 0.237, 0.009, -0.95, 0.574, 0.35, soil, planters, 32);
  const palmRim = mesh(
    new THREE.TorusGeometry(0.255, 0.017, 7, 32),
    potRim,
    -0.95,
    0.58,
    0.35,
    planters,
  );
  palmRim.rotation.x = Math.PI / 2;
  cylinder(0.23, 0.18, 0.3, -1.85, 0.33, 0.35, ceramic, planters, 28);
  cylinder(0.212, 0.212, 0.009, -1.85, 0.474, 0.35, soil, planters, 28);
  const pineRim = mesh(
    new THREE.TorusGeometry(0.224, 0.015, 7, 28),
    potRim,
    -1.85,
    0.48,
    0.35,
    planters,
  );
  pineRim.rotation.x = Math.PI / 2;
  function mergeStatic(parent) {
    world.updateMatrixWorld(true);
    const inverse = parent.matrixWorld.clone().invert(),
      buckets = new Map(),
      originals = [],
      usedGeometries = new Set();
    parent.traverse((object) => {
      if (!object.isMesh || object.isInstancedMesh) return;
      const key = object.material.uuid + ':' + object.castShadow + ':' + object.receiveShadow;
      if (!buckets.has(key))
        buckets.set(key, {
          material: object.material,
          cast: object.castShadow,
          receive: object.receiveShadow,
          position: [],
          normal: [],
          uv: [],
          color: [],
        });
      const bucket = buckets.get(key),
        original = object.geometry;
      const geometry = original.index ? original.toNonIndexed() : original.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      const p = geometry.getAttribute('position'),
        n = geometry.getAttribute('normal'),
        u = geometry.getAttribute('uv'),
        c = geometry.getAttribute('color');
      for (let i = 0; i < p.count; i++) {
        bucket.position.push(p.getX(i), p.getY(i), p.getZ(i));
        bucket.normal.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
        bucket.uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
        bucket.color.push(c ? c.getX(i) : 1, c ? c.getY(i) : 1, c ? c.getZ(i) : 1);
      }
      geometry.dispose();
      usedGeometries.add(original);
      originals.push(object);
    });
    originals.forEach((object) => object.removeFromParent());
    usedGeometries.forEach((geometry) => {
      geometries.delete(geometry);
      geometry.dispose();
    });
    buckets.forEach((bucket) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(bucket.position, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(bucket.normal, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uv, 2));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(bucket.color, 3));
      const object = mesh(geometry, bucket.material, 0, 0, 0, parent);
      object.castShadow = bucket.cast;
      object.receiveShadow = bucket.receive;
    });
  }

  mergeStatic(bonsai);
  mergeStatic(conifers);
  mergeStatic(palm);
  mergeStatic(planters);
  function setTheme(value) {
    if (disposed) return;
    theme = clamp(Number(value) || 0, 0, 1);
    transitions.forEach(({ m, day, night }) => m.color.copy(day).lerp(night, theme));
    leafMaterial.emissiveIntensity = 0;
    pineMaterial.emissiveIntensity = 0;
    palmMaterial.emissiveIntensity = 0;
  }
  setTheme(options.theme === undefined ? 1 : options.theme);
  return {
    group,
    bonsai,
    palm,
    conifers,
    setTheme,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      instances.forEach((o) => o.dispose());
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
