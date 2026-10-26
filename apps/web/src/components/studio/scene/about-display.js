/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianAboutArchive(THREE, options = {}) {
  if (!THREE || !options.world)
    throw new Error('The About wall display needs THREE and a world group.');
  const world = options.world,
    group = new THREE.Group();
  group.name = 'About — left wall display';
  world.add(group);
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set(),
    transitions = [],
    leds = [];
  let disposed = false,
    theme = 1,
    paintStep = -1;
  const logicalWidth = 1100,
    logicalHeight = 850,
    width = 2.35,
    height = (width * logicalHeight) / logicalWidth;
  const screenGroup = new THREE.Group();
  screenGroup.name = 'Single landscape About display';
  screenGroup.position.set(-3.5, 2.95, -1.12);
  screenGroup.rotation.y = Math.PI / 2;
  screenGroup.userData.aboutKey = 'display';
  group.add(screenGroup);
  function material(day, night, roughness = 0.4, metalness = 0.6) {
    const value = new THREE.MeshStandardMaterial({ color: day, roughness, metalness });
    materials.add(value);
    transitions.push({ value, day: new THREE.Color(day), night: new THREE.Color(night) });
    return value;
  }
  const shell = material(0x65757b, 0x233946, 0.33, 0.74);
  const edge = material(0xadb9b6, 0x657e85, 0.24, 0.86);
  const dark = material(0x1d3038, 0x081720, 0.58, 0.35);
  const cableMaterial = material(0x4d6263, 0x142b35, 0.77, 0.15);
  function mesh(geometry, value, x = 0, y = 0, z = 0, parent = screenGroup) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, value);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, x, y, z, value, parent) {
    return mesh(new THREE.BoxGeometry(w, h, d), value, x, y, z, parent);
  }
  function bevelBox(w, h, d, z, value) {
    const a = w / 2,
      b = h / 2,
      cut = 0.035,
      shape = new THREE.Shape();
    shape.moveTo(-a + cut, -b);
    shape.lineTo(a - cut, -b);
    shape.lineTo(a, -b + cut);
    shape.lineTo(a, b - cut);
    shape.lineTo(a - cut, b);
    shape.lineTo(-a + cut, b);
    shape.lineTo(-a, b - cut);
    shape.lineTo(-a, -b + cut);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      steps: 1,
    });
    geometry.translate(0, 0, -d / 2);
    return mesh(geometry, value, 0, 0, z);
  }
  function led(w, h, x, y, tint) {
    const value = new THREE.MeshStandardMaterial({
      color: tint,
      emissive: tint,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.28,
    });
    materials.add(value);
    leds.push(value);
    const object = box(w, h, 0.008, x, y, 0.059, value);
    object.castShadow = false;
    object.receiveShadow = false;
    return object;
  }
  // A shallow wall bracket and one restrained cable keep the screen mounted in
  // the room; there are no freestanding terminals or equipment rack.
  box(0.86, 0.56, 0.035, 0, 0.035, -0.064, dark);
  box(0.46, 0.2, 0.052, 0, 0.035, -0.031, edge);
  bevelBox(width + 0.15, height + 0.14, 0.1, 0, shell);
  bevelBox(width + 0.055, height + 0.055, 0.012, 0.043, dark);
  led(0.56, 0.008, -0.77, height / 2 + 0.047, 0x76e8d3);
  led(0.29, 0.008, 0.9, -height / 2 - 0.046, 0xb6a4f0);
  [-1, 1].forEach((x) =>
    [-1, 1].forEach((y) => {
      const bolt = mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.008, 8),
        edge,
        x * (width / 2 + 0.05),
        y * (height / 2 + 0.045),
        0.054,
      );
      bolt.rotation.x = Math.PI / 2;
      bolt.castShadow = false;
    }),
  );
  for (let i = 0; i < 7; i++)
    box(0.005, 0.023, 0.005, -0.09 + i * 0.03, -height / 2 - 0.045, 0.057, dark);
  const wirePoints = [
    [0.91, -height / 2 - 0.06, -0.035],
    [0.94, -height / 2 - 0.14, -0.07],
    [0.94, -1.24, -0.07],
    [0.87, -1.36, -0.07],
    [0.87, -1.8, -0.07],
  ];
  const wireCurve = new THREE.CatmullRomCurve3(
    wirePoints.map((point) => new THREE.Vector3(...point)),
  );
  mesh(new THREE.TubeGeometry(wireCurve, 24, 0.01, 7, false), cableMaterial);
  box(0.055, 0.075, 0.025, 0.87, -1.8, -0.065, dark);

  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth;
  canvas.height = logicalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The About wall display needs a canvas texture.');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, Math.min(8, Number(options.anisotropy) || 4));
  textures.add(texture);
  const faceMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    toneMapped: false,
  });
  materials.add(faceMaterial);
  const face = mesh(new THREE.PlaneGeometry(width, height), faceMaterial, 0, 0, 0.057);
  face.name = 'About landscape LCD';
  face.castShadow = false;
  face.receiveShadow = false;
  face.userData.aboutKey = 'display';
  const overview = {
    position: [-1.9, 3.07, -1.12],
    target: [-3.443, 3.07, -1.12],
    fov: 74,
    minHorizontal: 80,
  };
  const state = { tab: 'story' };
  const surface = {
    key: 'display',
    title: 'About Kristian',
    kind: 'display',
    object: screenGroup,
    mesh: face,
    width,
    height,
    logicalWidth,
    logicalHeight,
    canvas,
    context,
    texture,
    state,
    corners: [
      [-width / 2, height / 2, 0.001],
      [width / 2, height / 2, 0.001],
      [width / 2, -height / 2, 0.001],
      [-width / 2, -height / 2, 0.001],
    ],
    focus: { ...overview, position: overview.position.slice(), target: overview.target.slice() },
  };
  function paint() {
    if (disposed) return;
    if (typeof state.paint === 'function') {
      state.paint(context, logicalWidth, logicalHeight, { ...state, theme });
      texture.needsUpdate = true;
      return;
    }
    const night = theme >= 0.5;
    const colors = night
      ? { paper: '#10252f', ink: '#e4f3ed', muted: '#a1c2bf', accent: '#8be9d5', line: '#42655f' }
      : { paper: '#eee5d0', ink: '#264b49', muted: '#607b70', accent: '#397c72', line: '#b6c2ac' };
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = colors.paper;
    context.fillRect(0, 0, logicalWidth, logicalHeight);
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    function text(value, x, y, size, color = colors.ink, weight = 400) {
      context.font = weight + ' ' + size + 'px "Rajdhani",Arial,sans-serif';
      context.fillStyle = color;
      context.fillText(value, x, y);
    }
    text('ABOUT / KRISTIAN SALMERON', 56, 66, 25, colors.muted, 500);
    context.strokeStyle = colors.line;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(56, 96);
    context.lineTo(1044, 96);
    context.stroke();
    const tabs = [
      ['story', 'My story'],
      ['experience', 'Experience'],
      ['approach', 'How I work'],
    ];
    tabs.forEach(([key, title], index) => {
      const x = 56 + index * 270;
      if (key === state.tab) {
        context.fillStyle = night ? '#23473f' : '#d5e0cb';
        context.fillRect(x - 15, 119, 237, 64);
      }
      text(title, x, 162, 31, key === state.tab ? colors.accent : colors.muted, 500);
    });
    context.save();
    context.globalAlpha = 0.12;
    context.strokeStyle = colors.accent;
    context.lineWidth = 1;
    for (let x = 56; x < 1050; x += 58) {
      context.beginPath();
      context.moveTo(x, 223);
      context.lineTo(x, 747);
      context.stroke();
    }
    for (let y = 223; y < 748; y += 58) {
      context.beginPath();
      context.moveTo(56, y);
      context.lineTo(1044, y);
      context.stroke();
    }
    context.restore();
    text('A builder,', 65, 330, 83, colors.ink, 500);
    text('still curious.', 65, 425, 83, colors.ink, 500);
    text('Software. Architecture.', 68, 518, 38, colors.muted);
    text('Technical leadership.', 68, 571, 38, colors.muted);
    text('12+', 758, 468, 147, colors.accent, 500);
    text('years in software', 756, 523, 29, colors.muted);
    context.strokeStyle = colors.line;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(56, 747);
    context.lineTo(1044, 747);
    context.stroke();
    text('Background, experience, and how I work.', 65, 798, 28, colors.muted);
    texture.needsUpdate = true;
  }
  function setTheme(value) {
    if (disposed) return;
    theme = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    transitions.forEach(({ value: material, day, night }) =>
      material.color.copy(day).lerp(night, theme),
    );
    leds.forEach((material) => {
      material.emissiveIntensity = 0.12 + theme * 0.85;
    });
    const next = Math.round(theme * 8);
    if (next !== paintStep) {
      paintStep = next;
      paint();
    }
  }
  setTheme(options.theme === undefined ? 1 : options.theme);
  group.updateMatrixWorld(true);
  return {
    group,
    surfaces: [surface],
    targets: [{ key: 'display', object: screenGroup }],
    overview,
    anchor: face,
    width,
    height,
    corners: surface.corners,
    focus: surface.focus,
    setTheme,
    // Compatibility with callers that previously selected three physical objects:
    // tab state can repaint, but the single wall display never changes its pose.
    setSelection(key) {
      if (disposed || !['story', 'experience', 'approach'].includes(key) || state.tab === key)
        return;
      state.tab = key;
      paint();
    },
    updateSurface(key, next = {}) {
      if (disposed) return false;
      if (['story', 'experience', 'approach'].includes(key)) state.tab = key;
      else if (key !== 'display') return false;
      Object.assign(state, next);
      paint();
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
