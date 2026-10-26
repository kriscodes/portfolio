/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianSilverado(
  THREE,
  { world, position = [2.5, 0.12, 3.4], rotation = 1.2, theme = 1 } = {},
) {
  if (!THREE || !world) throw new Error('The Silverado needs THREE and a world group.');
  const group = new THREE.Group();
  group.name = '2022 Silverado 2500HD custom white crew cab';
  group.position.set(...position);
  if (Array.isArray(rotation)) group.rotation.set(...rotation);
  else group.rotation.y = Number(rotation) || 0;
  world.add(group);
  const body = new THREE.Group(),
    wheels = new THREE.Group();
  body.name = 'Silverado idling chassis';
  wheels.name = 'Silverado anchored wheels';
  group.add(body, wheels);
  let part = body;
  const batches = new Map(),
    geometries = new Set(),
    materials = new Set(),
    textures = new Set(),
    lamps = [],
    spots = [];
  let disposed = false;
  function mat(color, roughness = 0.4, metalness = 0.15, extras = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extras });
    materials.add(m);
    return m;
  }
  const white = mat(0xffffff, 0.32, 0.18),
    rubber = mat(0x10171a, 0.91, 0.02),
    black = mat(0x182126, 0.48, 0.42),
    silver = mat(0xc3cbd0, 0.24, 0.94),
    glass = mat(0x162c38, 0.14, 0.38, { side: THREE.DoubleSide }),
    liner = mat(0x283036, 0.87, 0.07);
  function lightMat(color) {
    const m = mat(color, 0.23, 0.1, { emissive: color, emissiveIntensity: 0, toneMapped: false });
    lamps.push(m);
    return m;
  }
  const whiteLamp = lightMat(0xf0f7ff),
    redLamp = lightMat(0xd51f25),
    amberLamp = lightMat(0xe89226);
  function add(g, m, p = [0, 0, 0], r = [0, 0, 0]) {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...p),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),
      new THREE.Vector3(1, 1, 1),
    );
    g.applyMatrix4(matrix);
    // Sheet metal uses meter-scale body proportions. Wheel radii stay circular:
    // wheel centers move to the longer wheelbase, while Y/Z tire sections scale equally.
    if (part === wheels) {
      g.computeBoundingBox();
      const axle = g.boundingBox.getCenter(new THREE.Vector3()).z > -0.0125 ? 0.32 : -0.345;
      g.scale(4.8, 4, 4);
      g.translate(0, 0, axle * 1.4);
    } else g.scale(4.8, 4, 5.4);
    if (g.index) {
      const old = g;
      g = g.toNonIndexed();
      old.dispose();
    }
    const key = m.uuid + ':' + part.uuid;
    let b = batches.get(key);
    if (!b) {
      b = { material: m, parent: part, positions: [], normals: [] };
      batches.set(key, b);
    }
    const v = g.attributes.position.array,
      n = g.attributes.normal?.array;
    if (!n) g.computeVertexNormals();
    b.positions.push(new Float32Array(v));
    b.normals.push(new Float32Array(g.attributes.normal.array));
    g.dispose();
  }
  const box = (w, h, d, x, y, z, m = white, r = [0, 0, 0]) =>
    add(new THREE.BoxGeometry(w, h, d), m, [x, y, z], r);
  function cylinder(radius, length, x, y, z, m = silver, segments = 20) {
    add(
      new THREE.CylinderGeometry(radius, radius, length, segments),
      m,
      [x, y, z],
      [0, 0, Math.PI / 2],
    );
  }
  function torus(radius, tube, x, y, z, m = silver, arc = Math.PI * 2) {
    add(new THREE.TorusGeometry(radius, tube, 6, 32, arc), m, [x, y, z], [0, Math.PI / 2, 0]);
  }
  function quad(points, m) {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, 1, 2, 0, 2, 3].flatMap((i) => points[i]),
        3,
      ),
    );
    g.computeVertexNormals();
    add(g, m);
  }
  function loft(w0, w1, y0, y1, zFront0, zBack0, zFront1, zBack1, m = white) {
    const p = [
      [-w0 / 2, y0, zFront0],
      [w0 / 2, y0, zFront0],
      [w0 / 2, y0, zBack0],
      [-w0 / 2, y0, zBack0],
      [-w1 / 2, y1, zFront1],
      [w1 / 2, y1, zFront1],
      [w1 / 2, y1, zBack1],
      [-w1 / 2, y1, zBack1],
    ];
    [
      [0, 1, 5, 4],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
      [1, 2, 6, 5],
      [4, 5, 6, 7],
      [3, 2, 1, 0],
    ].forEach((f) =>
      quad(
        f.map((i) => p[i]),
        m,
      ),
    );
  }
  function sideShape(points, x, depth, m) {
    const s = new THREE.Shape();
    points.forEach(([z, y], i) => (i ? s.lineTo(-z, y) : s.moveTo(-z, y)));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, steps: 1 });
    g.translate(0, 0, -depth / 2);
    add(g, m, [x, 0, 0], [0, Math.PI / 2, 0]);
  }
  function rod(a, b, r, m = black) {
    const v = new THREE.Vector3(...a),
      q = new THREE.Vector3(...b),
      g = new THREE.CylinderGeometry(r, r, v.distanceTo(q), 8);
    g.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        q.clone().sub(v).normalize(),
      ),
    );
    add(g, m, v.add(q).multiplyScalar(0.5).toArray());
  }
  function bowtie(y, z, scale = 1, m = black, back = false) {
    const s = new THREE.Shape(),
      p = [
        [-0.047, 0.008],
        [-0.017, 0.008],
        [-0.011, 0.018],
        [0.047, 0.018],
        [0.037, -0.008],
        [0.016, -0.008],
        [0.01, -0.018],
        [-0.047, -0.018],
      ];
    p.forEach(([x, yy], i) =>
      i ? s.lineTo(x * scale, yy * scale) : s.moveTo(x * scale, yy * scale),
    );
    s.closePath();
    add(
      new THREE.ExtrudeGeometry(s, { depth: 0.003, bevelEnabled: false }),
      m,
      [0, y, z],
      back ? [0, Math.PI, 0] : [0, 0, 0],
    );
  }
  // Exposed frame, axles, differentials and slightly raised suspension.
  box(0.21, 0.041, 0.91, 0, 0.111, -0.01, black);
  [-0.105, 0.105].forEach((x) => box(0.025, 0.037, 0.91, x, 0.131, -0.01, black));
  [0.32, -0.345].forEach((z) => {
    cylinder(0.015, 0.407, 0, 0.112, z, black);
    add(new THREE.SphereGeometry(0.029, 12, 8), black, [0, 0.112, z]);
    [-0.16, 0.16].forEach((x) => {
      box(0.025, 0.014, 0.18, x, 0.134, z, black);
      rod([x, 0.115, z], [x, 0.208, z + 0.035], 0.007, silver);
    });
  });
  // Four HD all-terrain wheels: chunky tread, polished rim lip, dark spokes, 8 lugs.
  part = wheels;
  [-1, 1].forEach((side) =>
    [0.32, -0.345].forEach((z) => {
      const x = side * 0.208,
        y = 0.109;
      torus(0.077, 0.027, x, y, z, rubber);
      cylinder(0.073, 0.057, x, y, z, rubber, 28);
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        box(0.061, 0.013, 0.024, x, y + Math.cos(a) * 0.102, z + Math.sin(a) * 0.102, rubber, [
          a,
          0,
          (i % 2 ? 1 : -1) * 0.12,
        ]);
      }
      cylinder(0.065, 0.008, side * 0.241, y, z, silver, 28);
      cylinder(0.058, 0.009, side * 0.247, y, z, black, 28);
      torus(0.062, 0.0035, side * 0.251, y, z, silver);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        box(
          0.007,
          0.049,
          0.008,
          side * 0.252,
          y + Math.cos(a) * 0.031,
          z + Math.sin(a) * 0.031,
          black,
          [a, 0, 0],
        );
        box(
          0.004,
          0.043,
          0.003,
          side * 0.257,
          y + Math.cos(a) * 0.031,
          z + Math.sin(a) * 0.031,
          silver,
          [a, 0, 0],
        );
        add(new THREE.SphereGeometry(0.003, 6, 4), silver, [
          side * 0.261,
          y + Math.cos(a) * 0.021,
          z + Math.sin(a) * 0.021,
        ]);
      }
      cylinder(0.018, 0.011, side * 0.257, y, z, silver, 12);
      cylinder(0.011, 0.012, side * 0.26, y, z, black, 12);
    }),
  );
  part = body;
  // Side sheet metal includes real open wheel arches rather than wheels on a box.
  const sideProfile = [
    [-0.54, 0.142],
    [-0.54, 0.285],
    [-0.207, 0.291],
    [0.192, 0.305],
    [0.504, 0.319],
    [0.535, 0.292],
    [0.535, 0.143],
    [0.45, 0.143],
    [0.45, 0.112],
  ];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI;
    sideProfile.push([0.32 + 0.13 * Math.cos(a), 0.112 + 0.13 * Math.sin(a)]);
  }
  sideProfile.push([-0.215, 0.112]);
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI;
    sideProfile.push([-0.345 + 0.13 * Math.cos(a), 0.112 + 0.13 * Math.sin(a)]);
  }
  sideProfile.push([-0.54, 0.142]);
  [-1, 1].forEach((side) => {
    sideShape(sideProfile, side * 0.197, 0.019, white);
    [0.32, -0.345].forEach((z) => {
      torus(0.127, 0.009, side * 0.212, 0.112, z, white, Math.PI);
      torus(0.124, 0.012, side * 0.201, 0.112, z, liner, Math.PI);
    });
    box(0.022, 0.025, 0.377, side * 0.207, 0.133, -0.004, black);
    box(0.026, 0.012, 0.343, side * 0.211, 0.15, -0.005, silver);
  });
  // Crew cab lower doors, high hood and raised central HD power dome.
  box(0.376, 0.147, 0.399, 0, 0.228, -0.005);
  loft(0.405, 0.399, 0.272, 0.322, 0.529, 0.193, 0.507, 0.195);
  loft(0.22, 0.174, 0.322, 0.342, 0.496, 0.241, 0.471, 0.245);
  box(0.117, 0.012, 0.009, 0, 0.325, 0.505, black);
  box(0.337, 0.009, 0.012, 0, 0.323, 0.529);
  loft(0.389, 0.354, 0.298, 0.462, 0.202, -0.208, 0.099, -0.183);
  box(0.356, 0.013, 0.291, 0, 0.464, -0.043);
  // Smoked windshield and four side windows, framed by upright A/B/C pillars.
  quad(
    [
      [-0.166, 0.319, 0.197],
      [0.166, 0.319, 0.197],
      [0.157, 0.45, 0.111],
      [-0.157, 0.45, 0.111],
    ],
    glass,
  );
  quad(
    [
      [0.157, 0.321, -0.209],
      [-0.157, 0.321, -0.209],
      [-0.153, 0.447, -0.186],
      [0.153, 0.447, -0.186],
    ],
    glass,
  );
  [-1, 1].forEach((side) => {
    const x = side * 0.196,
      xt = side * 0.182;
    quad(
      [
        [x, 0.319, 0.182],
        [x, 0.319, -0.007],
        [xt, 0.449, -0.007],
        [xt, 0.449, 0.091],
      ],
      glass,
    );
    quad(
      [
        [x, 0.319, -0.026],
        [x, 0.319, -0.192],
        [xt, 0.449, -0.173],
        [xt, 0.449, -0.026],
      ],
      glass,
    );
    rod([x, 0.309, -0.016], [xt, 0.455, -0.016], 0.006, black);
    box(0.002, 0.12, 0.002, side * 0.208, 0.236, -0.017, liner);
    box(0.002, 0.118, 0.002, side * 0.208, 0.236, -0.194, liner);
    [0.124, -0.114].forEach((z) => {
      box(0.008, 0.009, 0.045, side * 0.21, 0.286, z, white);
      box(0.003, 0.003, 0.033, side * 0.215, 0.282, z, black);
    });
    // Extended vertical tow mirrors with two-piece rear glass and white caps.
    rod([side * 0.19, 0.348, 0.159], [side * 0.246, 0.354, 0.158], 0.008, black);
    box(0.037, 0.082, 0.032, side * 0.251, 0.367, 0.158, white);
    box(0.029, 0.055, 0.004, side * 0.251, 0.377, 0.139, glass);
    box(0.029, 0.018, 0.004, side * 0.251, 0.338, 0.139, glass);
    box(0.025, 0.007, 0.004, side * 0.251, 0.366, 0.177, amberLamp);
    // Fuel flap, cab seam, black rain channel and the integrated front bed step.
    box(0.003, 0.035, 0.036, side * 0.209, 0.264, -0.258, liner);
    box(0.004, 0.03, 0.031, side * 0.211, 0.264, -0.258, white);
    box(0.004, 0.012, 0.035, side * 0.215, 0.187, -0.217, black);
    rod([side * 0.18, 0.459, -0.176], [side * 0.18, 0.459, 0.09], 0.003, black);
  });
  // Open Durabed: white side rails, dark corrugated floor and inner wheel tubs.
  box(0.367, 0.017, 0.312, 0, 0.222, -0.374, black);
  for (let i = -3; i <= 3; i++) box(0.008, 0.005, 0.298, i * 0.044, 0.234, -0.373, liner);
  [-1, 1].forEach((side) => {
    box(0.028, 0.073, 0.31, side * 0.188, 0.26, -0.373);
    box(0.032, 0.009, 0.313, side * 0.188, 0.3, -0.373, white);
    box(0.068, 0.048, 0.131, side * 0.15, 0.254, -0.345, black);
  });
  box(0.369, 0.078, 0.021, 0, 0.263, -0.53);
  box(0.372, 0.068, 0.019, 0, 0.264, -0.218);
  box(0.374, 0.009, 0.025, 0, 0.304, -0.532, black);
  // Old-generation HD split grille, substantial white bars and stacked LED lamps.
  box(0.303, 0.145, 0.015, 0, 0.245, 0.54, black);
  box(0.314, 0.014, 0.018, 0, 0.324, 0.548);
  box(0.316, 0.013, 0.02, 0, 0.169, 0.547);
  [-1, 1].forEach((side) => {
    box(0.012, 0.144, 0.018, side * 0.153, 0.245, 0.55);
    box(0.065, 0.134, 0.015, side * 0.185, 0.251, 0.542, black);
  });
  [0.194, 0.219, 0.271, 0.296].forEach((y) => box(0.277, 0.005, 0.01, 0, y, 0.552, liner));
  for (let i = -5; i <= 5; i++) box(0.004, 0.133, 0.008, i * 0.024, 0.245, 0.549, black);
  box(0.31, 0.023, 0.023, 0, 0.247, 0.557);
  bowtie(0.247, 0.572, 0.76, silver);
  bowtie(0.247, 0.576, 0.63, black);
  [-1, 1].forEach((side) => {
    const x = side * 0.184;
    [0.273, 0.233].forEach((y) => {
      box(0.039, 0.025, 0.009, x, y, 0.555, silver);
      box(0.025, 0.017, 0.006, x, y, 0.561, whiteLamp);
    });
    box(0.058, 0.007, 0.008, x, 0.309, 0.56, whiteLamp);
    box(0.007, 0.102, 0.008, side * 0.212, 0.26, 0.56, whiteLamp);
    box(0.05, 0.007, 0.008, side * 0.188, 0.208, 0.56, whiteLamp);
    box(0.009, 0.021, 0.009, side * 0.214, 0.301, 0.561, amberLamp);
  });
  // Color-matched bumpers, corner steps, fog lights, tow hooks and hitch.
  box(0.432, 0.044, 0.055, 0, 0.142, 0.536);
  box(0.34, 0.012, 0.026, 0, 0.112, 0.546, black);
  box(0.16, 0.024, 0.014, 0, 0.139, 0.571, black);
  [-1, 1].forEach((side) => {
    box(0.055, 0.021, 0.012, side * 0.172, 0.142, 0.568, black);
    box(0.035, 0.01, 0.006, side * 0.172, 0.142, 0.575, whiteLamp);
    rod([side * 0.108, 0.122, 0.568], [side * 0.108, 0.103, 0.574], 0.005, silver);
  });
  box(0.427, 0.037, 0.047, 0, 0.139, -0.539);
  box(0.19, 0.025, 0.014, 0, 0.143, -0.568, black);
  box(0.11, 0.019, 0.003, 0, 0.143, -0.577, silver);
  [-1, 1].forEach((side) => {
    box(0.06, 0.012, 0.047, side * 0.179, 0.163, -0.546, black);
    box(0.029, 0.102, 0.015, side * 0.192, 0.25, -0.546, redLamp);
    box(0.016, 0.026, 0.005, side * 0.192, 0.24, -0.556, silver);
  });
  box(0.027, 0.025, 0.075, 0, 0.103, -0.556, black);
  add(new THREE.SphereGeometry(0.009, 8, 6), silver, [0, 0.124, -0.593]);
  box(0.072, 0.013, 0.009, 0, 0.283, -0.545, black);
  bowtie(0.25, -0.546, 0.5, black, true);
  // Five amber clearance lamps and a compact red third brake light.
  [-0.136, -0.04, 0, 0.04, 0.136].forEach((x) => {
    box(0.018, 0.007, 0.028, x, 0.476, 0.063, black);
    box(0.015, 0.006, 0.017, x, 0.482, 0.069, amberLamp);
  });
  box(0.075, 0.008, 0.009, 0, 0.449, -0.193, redLamp);
  // Flush raised hood details and tiny physical model-name badges.
  [-1, 1].forEach((side) => {
    box(0.004, 0.011, 0.063, side * 0.203, 0.3, 0.253, silver);
    box(0.004, 0.006, 0.046, side * 0.205, 0.298, 0.252, black);
  });
  // Merge disjoint geometry by finish: detailed body, tread and trim remain inexpensive.
  batches.forEach((b) => {
    const m = b.material;
    let size = 0;
    b.positions.forEach((a) => (size += a.length));
    const p = new Float32Array(size),
      n = new Float32Array(size);
    let offset = 0;
    b.positions.forEach((a, i) => {
      p.set(a, offset);
      n.set(b.normals[i], offset);
      offset += a.length;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    g.computeBoundingSphere();
    geometries.add(g);
    const o = new THREE.Mesh(g, m);
    o.castShadow = true;
    o.receiveShadow = true;
    o.name =
      'Silverado ' +
      (m === white
        ? 'white body'
        : m === rubber
          ? 'all-terrain tires'
          : m === glass
            ? 'smoked glass'
            : 'detail finish');
    b.parent.add(o);
  });
  batches.clear();
  // Beams belong to the vehicle, so their targets rotate with its parking pose.
  [-1, 1].forEach((side) => {
    const s = new THREE.SpotLight(0xe7efff, 0, 12.5, 0.25, 0.7, 2);
    s.name = 'Silverado dipped headlamp';
    s.position.set(side * 0.8832, 1.068, 3.1266);
    const target = new THREE.Object3D();
    target.position.set(side * 1.008, -0.64, 10.368);
    body.add(target);
    s.target = target;
    s.castShadow = false;
    body.add(s);
    spots.push(s);
  });
  // The parked truck is running in both themes; daylight only reduces perceived glow.
  function setTheme(value) {
    if (disposed) return;
    const v = THREE.MathUtils.clamp((Number(value) - 0.38) / 0.47, 0, 1),
      night = v * v * (3 - 2 * v);
    lamps.forEach((m) => {
      m.emissiveIntensity =
        m === whiteLamp
          ? 1.05 + night * 0.55
          : m === redLamp
            ? 0.75 + night * 0.6
            : 0.8 + night * 0.45;
    });
    spots.forEach((s) => (s.intensity = 12 + night * 4));
    white.emissive.set(0xffffff);
    white.emissiveIntensity = night * 0.1;
  }
  function update(time, { active = true, reducedMotion = false } = {}) {
    if (disposed) return false;
    const running = active && !reducedMotion && Number.isFinite(time);
    if (!running) {
      const changed =
        body.position.lengthSq() > 0 || body.rotation.x !== 0 || body.rotation.z !== 0;
      body.position.set(0, 0, 0);
      body.rotation.set(0, 0, 0);
      return changed;
    }
    const tau = Math.PI * 2,
      t = Number(time);
    // Meter-scale mounts transmit only a few millimeters of idle; tires stay planted.
    body.position.y = 0.0034 * Math.sin(t * tau * 8.3) + 0.001 * Math.sin(t * tau * 13.7 + 1.2);
    body.position.x = 0.0008 * Math.sin(t * tau * 9.1 + 0.5);
    body.rotation.z = 0.00045 * Math.sin(t * tau * 8.3 + 0.6);
    body.rotation.x = 0.0002 * Math.sin(t * tau * 7.8 + 1.2);
    return true;
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
      spots.forEach((s) => s.dispose?.());
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
