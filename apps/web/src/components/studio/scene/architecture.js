/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianCourtyardArchitecture(THREE, options = {}) {
  if (!THREE || !options.world)
    throw new Error('Parking court architecture needs THREE and a world group.');
  const world = options.world,
    group = new THREE.Group();
  group.name = 'Corner studio and parking court';
  world.add(group);
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set(),
    transitions = [],
    luminous = [],
    lamps = [];
  let disposed = false,
    seed = 526341,
    theme = 1;
  function random() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function material(day, night = day, roughness = 0.8, metalness = 0) {
    const value = new THREE.MeshStandardMaterial({ color: day, roughness, metalness });
    materials.add(value);
    transitions.push({ value, day: new THREE.Color(day), night: new THREE.Color(night) });
    return value;
  }
  const foundation = material(0x716f62, 0x27363f, 0.96);
  const concrete = material(0xd0cbbd, 0x40515d, 0.94, 0.02);
  const coping = material(0x918d7e, 0x2c3e49, 0.83, 0.04);
  const timber = material(0x86664c, 0x4c4b49, 0.73, 0.03);
  const frame = material(0x435655, 0x203642, 0.43, 0.62);
  const black = material(0x253335, 0x101e26, 0.65, 0.18);
  const paverA = material(0xc0bcaa, 0x65737a, 0.94);
  const paverB = material(0xb4b29f, 0x5b6c73, 0.94);
  const grate = material(0x71807b, 0x3b545e, 0.42, 0.72);
  const marking = material(0xd5d4c7, 0x9baab2, 0.92);
  const wheelStop = material(0xb8b9ad, 0x78858a, 0.94);
  const reflector = material(0xcdb778, 0x969c95, 0.86);
  const floorWood = material(0xffffff, 0xb19c89, 0.77);
  const asphalt = material(0xc1c6c1, 0x667583, 0.97);
  const cabinet = material(0x82948a, 0x344b55, 0.64, 0.18);
  function mesh(geometry, value, x = 0, y = 0, z = 0, parent = group, cast = true, receive = true) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, value);
    object.position.set(x, y, z);
    object.castShadow = cast;
    object.receiveShadow = receive;
    parent.add(object);
    return object;
  }
  function box(w, h, d, x, y, z, value, cast = true) {
    return mesh(new THREE.BoxGeometry(w, h, d), value, x, y, z, group, cast);
  }
  function surface(w, d, x, y, z, value) {
    const object = mesh(new THREE.PlaneGeometry(w, d), value, x, y, z, group, false);
    object.rotation.x = -Math.PI / 2;
    return object;
  }
  function texture(width, height, draw, repeatX = 1, repeatY = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    draw(context, width, height);
    const value = new THREE.CanvasTexture(canvas);
    value.colorSpace = THREE.SRGBColorSpace;
    value.wrapS = value.wrapT = THREE.RepeatWrapping;
    value.repeat.set(repeatX, repeatY);
    value.anisotropy = 4;
    textures.add(value);
    return value;
  }
  floorWood.map = texture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#ac8156';
      ctx.fillRect(0, 0, w, h);
      for (let board = 0; board < 10; board++) {
        const y = (board * h) / 10,
          light = 48 + Math.round(random() * 8);
        ctx.fillStyle = `hsl(32 35% ${light}%)`;
        ctx.fillRect(0, y, w, h / 10);
        ctx.fillStyle = '#68553e';
        ctx.fillRect(0, y, w, 1.1);
        ctx.fillStyle = '#c9a779';
        ctx.fillRect(0, y + 1.1, w, 0.8);
        const joint = (board % 3) * 164 + 28;
        ctx.fillStyle = '#746047';
        ctx.fillRect(joint, y, 0.8, h / 10);
        for (let i = 0; i < 11; i++) {
          const lineY = y + 5 + random() * 42;
          ctx.strokeStyle = `rgba(67,43,25,${0.04 + random() * 0.09})`;
          ctx.lineWidth = 0.4 + random() * 0.8;
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.bezierCurveTo(150, lineY - 4, 350, lineY + 5, 512, lineY + 1);
          ctx.stroke();
        }
      }
    },
    2.2,
    1.5,
  );
  // Fine, low-contrast aggregate reads as asphalt, rather than loose gravel.
  asphalt.map = texture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#596064';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 5600; i++) {
      const light = 31 + Math.round(random() * 9),
        size = 0.35 + random() * 1.3;
      ctx.fillStyle = `hsl(207 5% ${light}%)`;
      ctx.fillRect(random() * w, random() * h, size, size * (0.6 + random() * 0.45));
    }
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = 'rgba(19,27,31,.07)';
      ctx.beginPath();
      ctx.ellipse(
        random() * w,
        random() * h,
        1 + random() * 2,
        0.5 + random(),
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });
  marking.map = texture(256, 32, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 190; i++) {
      ctx.globalAlpha = 0.25 + random() * 0.65;
      ctx.fillRect(random() * w, random() * h, 0.4 + random() * 1.4, 0.4 + random());
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  });
  marking.alphaTest = 0.6;

  // Keep the existing room and parcel datum. The rear strip supports the new
  // parking surface continuously; the side extension carries the full-size truck.
  box(14, 0.36, 8.6, 0, -0.06, -0.7, foundation);
  box(1.5, 0.36, 6.9, 7.75, -0.06, -1.95, foundation);
  box(7.4, 0.36, 0.4, 3.3, -0.06, -5.2, foundation);
  box(6.4, 0.06, 5.5, -3.6, 0.15, -1.95, floorWood);
  // One continuous mesh avoids seams between the former court, side bay and
  // front service apron. UVs follow metres, so aggregate keeps a consistent size.
  const parkingShape = new THREE.Shape();
  [
    [-0.4, -5.4],
    [8.5, -5.4],
    [8.5, 1.5],
    [7, 1.5],
    [7, 3.5],
    [-6.9, 3.5],
    [-6.9, 2],
    [-0.4, 2],
  ].forEach(([x, z], i) => {
    if (i) parkingShape.lineTo(x, -z);
    else parkingShape.moveTo(x, -z);
  });
  parkingShape.closePath();
  const parkingGeometry = new THREE.ShapeGeometry(parkingShape),
    parkingPosition = parkingGeometry.getAttribute('position');
  const parkingUV = [];
  for (let i = 0; i < parkingPosition.count; i++)
    parkingUV.push(parkingPosition.getX(i) / 2.4, -parkingPosition.getY(i) / 2.4);
  parkingGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(parkingUV, 2));
  const parkingSurface = mesh(parkingGeometry, asphalt, 0, 0.123, 0, group, false);
  parkingSurface.rotation.x = -Math.PI / 2;
  // Three open-front bays. Nothing crosses the truck's route into the apron.
  [-0.18, 2.7, 5.6, 8.35].forEach((x) => box(0.075, 0.0018, 5.95, x, 0.125, -2.1, marking, false));
  box(8.53, 0.0018, 0.075, 4.085, 0.125, -5.1, marking, false);
  // Low perimeter curbs end before the bay entrance and stay outside the spaces.
  box(8.9, 0.095, 0.14, 4.05, 0.1665, -5.33, concrete, false);
  box(0.1, 0.095, 6.3, 8.45, 0.1665, -2.15, concrete, false);
  function parkingStop(x) {
    const section = new THREE.Shape();
    [
      [-0.13, 0],
      [0.13, 0],
      [0.085, 0.115],
      [-0.085, 0.115],
    ].forEach(([z, y], i) => (i ? section.lineTo(z, y) : section.moveTo(z, y)));
    section.closePath();
    const geometry = new THREE.ExtrudeGeometry(section, {
      depth: 2.04,
      bevelEnabled: false,
      steps: 1,
    });
    geometry.translate(0, 0, -1.02);
    geometry.rotateY(Math.PI / 2);
    mesh(geometry, wheelStop, x, 0.124, -4.38);
    [-0.64, 0.64].forEach((offset) =>
      box(0.24, 0.02, 0.006, x + offset, 0.182, -4.269, reflector, false),
    );
  }
  // Behind the rear wheels, with about seven centimetres of tire clearance.
  [1.25, 4.15, 7].forEach(parkingStop);
  // The timber edge still expresses the studio's six-centimetre floor rise.
  box(0.045, 0.052, 5.5, -0.407, 0.15, -1.95, timber, false);
  box(6.4, 0.052, 0.045, -3.6, 0.15, 0.795, timber, false);

  // Both walls remain solid and readable at night. The front and right sides
  // are deliberately open to the parking court and its pedestrian threshold.
  box(6.56, 3.0, 0.16, -3.68, 1.68, -4.78, concrete);
  box(0.16, 3.0, 5.66, -6.88, 1.68, -1.95, concrete);
  box(6.56, 0.055, 0.19, -3.68, 3.1975, -4.78, coping);
  box(0.19, 0.055, 5.66, -6.88, 3.1975, -1.95, coping);
  box(6.39, 0.095, 0.025, -3.6, 0.2275, -4.687, timber, false);
  box(0.025, 0.095, 5.48, -6.787, 0.2275, -1.95, timber, false);
  // Quiet cast-concrete joints give the large wall planes scale without signs.
  [-5.18, -3.6, -2.02].forEach((x) => box(0.007, 2.9, 0.002, x, 1.68, -4.698, coping, false));
  box(6.39, 0.006, 0.002, -3.6, 1.72, -4.697, coping, false);
  box(0.002, 0.006, 5.48, -6.797, 1.72, -1.95, coping, false);

  // A light, open canopy: three posts live on the rear or left edges, with no
  // post in the open right/front corner and no solid roof over the desk.
  [
    [-6.67, -4.56],
    [-0.55, -4.56],
    [-6.67, 0.66],
  ].forEach(([x, z]) => {
    box(0.115, 2.97, 0.115, x, 1.665, z, frame);
    box(0.185, 0.035, 0.185, x, 0.1975, z, black);
  });
  box(6.24, 0.13, 0.12, -3.61, 3.15, -4.56, frame);
  box(0.1, 0.12, 5.31, -6.67, 3.15, -1.95, frame);
  box(0.075, 0.1, 5.31, -0.55, 3.15, -1.95, frame);
  box(6.24, 0.085, 0.085, -3.61, 3.15, 0.66, frame);
  // Short rear slats shade only the back edge, leaving the useful overview open.
  for (let i = 0; i < 11; i++) box(0.064, 0.075, 1.16, -6.45 + i * 0.565, 3.19, -3.98, timber);

  // Low storage makes the rear wall a believable working edge. Its top is
  // .82 metres above the office floor, while the open center stays unfurnished.
  if (options.workbench !== false) {
    box(3.66, 0.08, 0.57, -3.5, 0.22, -4.25, black);
    box(3.8, 0.65, 0.65, -3.5, 0.585, -4.25, cabinet);
    box(3.82, 0.03, 0.67, -3.5, 0.925, -4.25, frame);
    box(3.88, 0.06, 0.76, -3.5, 0.97, -4.25, floorWood);
    for (let i = 0; i < 3; i++) {
      const x = -4.765 + i * 1.265;
      box(1.238, 0.622, 0.022, x, 0.585, -3.913, cabinet);
      box(0.235, 0.014, 0.027, x + 0.36, 0.686, -3.885, grate, false);
    }
    // Thin rear battens accept future tools without adding invented equipment
    // or decorative labels to the workshop at this stage.
    box(3.66, 0.034, 0.045, -3.5, 1.3, -4.67, frame, false);
    box(3.66, 0.034, 0.045, -3.5, 2.25, -4.67, frame, false);
    for (let i = 0; i < 9; i++)
      box(0.032, 1.14, 0.028, -5.22 + i * 0.43, 1.775, -4.641, timber, false);
  }

  // A warm paved pedestrian threshold connects the timber floor to the lot.
  // Its office-side drain and the flush bay drain give the surface a useful edge.
  for (let row = 0; row < 2; row++)
    for (let column = 0; column < 10; column++) {
      box(
        0.626,
        0.01,
        0.535,
        -6.48 + column * 0.64,
        0.126,
        1.08 + row * 0.55,
        (row + column) % 3 ? paverA : paverB,
        false,
      );
    }
  box(0.09, 0.065, 1.4, -6.905, 0.1325, 2.8, coping, false);
  box(5.6, 0.045, 0.075, -4.05, 0.1325, 3.54, coping, false);
  box(4.88, 0.009, 0.13, -3.93, 0.1265, 1.94, black, false);
  for (let i = 0; i < 33; i++)
    box(0.022, 0.011, 0.118, -6.3 + i * 0.148, 0.1315, 1.94, grate, false);
  box(8.42, 0.005, 0.09, 4.09, 0.1255, 1.42, black, false);
  for (let i = 0; i < 49; i++)
    box(0.014, 0.006, 0.076, -0.03 + i * 0.17, 0.127, 1.42, grate, false);

  function diffuser(w, h, d, x, y, z, tint, day = 0.025, night = 1.4) {
    const value = new THREE.MeshStandardMaterial({
      color: 0xe4e8da,
      emissive: tint,
      emissiveIntensity: day,
      roughness: 0.4,
      metalness: 0.08,
    });
    materials.add(value);
    luminous.push({ value, day, night });
    return box(w, h, d, x, y, z, value, false);
  }
  function lamp(tint, x, y, z, nightIntensity, distance) {
    const light = new THREE.PointLight(tint, 0, distance, 2);
    light.position.set(x, y, z);
    light.castShadow = false;
    group.add(light);
    lamps.push({ light, night: nightIntensity });
    return light;
  }
  // Two warm sconces light the solid back wall; their housings and diffusers
  // have visible physical locations rather than unexplained ambient glows.
  [-6.05, -0.95].forEach((x) => {
    box(0.13, 0.31, 0.06, x, 2.22, -4.655, black);
    box(0.18, 0.025, 0.13, x, 2.3775, -4.62, frame);
    diffuser(0.066, 0.215, 0.008, x, 2.225, -4.619, 0xffd29d, 0.02, 1.2);
    lamp(0xffd29d, x, 2.2, -4.4, 1.3, 4.2);
  });
  // One cyan under-beam fixture marks the entrance, with two small warm step
  // markers. There are no continuous neon strips around the parcel or parking bays.
  box(2.24, 0.043, 0.075, -2.56, 3.087, 0.648, black, false);
  diffuser(2.1, 0.008, 0.048, -2.56, 3.0615, 0.648, 0x63dcd7, 0.015, 1.45);
  lamp(0x70dcd6, -2.56, 2.91, 0.54, 0.85, 5.2);
  [-5.88, -1.05].forEach((x) => {
    box(0.25, 0.023, 0.012, x, 0.147, 0.818, black, false);
    diffuser(0.18, 0.009, 0.005, x, 0.148, 0.826, 0xffcd97, 0.01, 0.9);
  });

  // Merge static geometry by material and shadow setting. Lights retain their
  // owned world locations; the architecture renders in a few dozen calls.
  function mergeStatic() {
    world.updateMatrixWorld(true);
    const inverse = group.matrixWorld.clone().invert(),
      buckets = new Map(),
      originals = [],
      oldGeometries = new Set();
    group.traverse((object) => {
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
        });
      const bucket = buckets.get(key),
        original = object.geometry;
      const geometry = original.index ? original.toNonIndexed() : original.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      const p = geometry.getAttribute('position'),
        n = geometry.getAttribute('normal'),
        u = geometry.getAttribute('uv');
      for (let i = 0; i < p.count; i++) {
        bucket.position.push(p.getX(i), p.getY(i), p.getZ(i));
        bucket.normal.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
        bucket.uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
      }
      geometry.dispose();
      oldGeometries.add(original);
      originals.push(object);
    });
    originals.forEach((object) => object.removeFromParent());
    oldGeometries.forEach((geometry) => {
      geometries.delete(geometry);
      geometry.dispose();
    });
    buckets.forEach((bucket) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(bucket.position, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(bucket.normal, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uv, 2));
      mesh(geometry, bucket.material, 0, 0, 0, group, bucket.cast, bucket.receive);
    });
  }
  mergeStatic();
  function setTheme(value) {
    if (disposed) return;
    theme = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    transitions.forEach(({ value: material, day, night }) =>
      material.color.copy(day).lerp(night, theme),
    );
    luminous.forEach(({ value: material, day, night }) => {
      material.emissiveIntensity = THREE.MathUtils.lerp(day, night, theme);
    });
    lamps.forEach(({ light, night }) => {
      light.intensity = night * theme;
    });
  }
  setTheme(options.theme === undefined ? 1 : options.theme);
  const floorRegions = {
    base: { min: [-7, -0.24, -5.4], max: [8.5, 0.12, 3.6] },
    office: { min: [-6.8, 0.12, -4.7], max: [-0.4, 0.18, 0.8] },
    courtyard: { min: [-0.4, 0.12, -5.4], max: [8.5, 0.123, 1.5] },
    parkingCourt: { min: [-0.4, 0.12, -5.4], max: [8.5, 0.123, 1.5] },
    threshold: { min: [-6.8, 0.12, 0.8], max: [-0.4, 0.132, 1.9] },
    vehicleLane: { min: [-6.9, 0.12, 2], max: [6.9, 0.123, 3.5] },
    parkingBay: { min: [2.7, 0.12, -5.4], max: [5.6, 0.124, 1.5] },
  };
  return {
    group,
    floorRegions,
    setTheme,
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
