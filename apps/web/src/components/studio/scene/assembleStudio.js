import * as THREE from 'three';
import { KRISTIAN_ABOUT, KRISTIAN_PROJECTS } from '../data';
import {
  paintKristianProjectPreview,
  paintKristianProjectScreen,
  paintKristianVoyageMap,
  paintKristianAboutWallPage,
} from './texturePainters';
import { createKristianBoatWater } from './boat-water';
import { createKristianAboutArchive } from './about-display';
import { createKristianBoatLights } from './boat-lights';
import { createKristianSilverado } from './truck';
import { createKristianCourtyardArchitecture } from './architecture';
import { createKristianNeighborhood } from './neighborhood';
import { createKristianStreetLife } from './street-life';
import { createKristianIndoorPlants } from './plants';
import { createKristianCameraEquipment } from './camera-equipment';

/** Builds the approved scene into Fiber-owned renderer, scene, and camera. */
export function assembleStudio(el, callbacks = {}, engine) {
  const { renderer, scene, camera, invalidate } = engine;
  const initialChildren = new Set(scene.children);
  let boatWater = null;
  let boatLights = null;
  let aboutArchive = null;
  let silverado = null;
  let courtyardArchitecture = null;
  let neighborhood = null;
  let streetLife = null;
  let indoorPlants = null;
  let cameraEquipment = null;
  let resizeObserver;
  let disposed = false;
  let drawPending = false;
  let interactionEl = el;
  const listeners = [];
  let releaseSceneEvents = () => {};
  const textures = new Set();
  const geometries = new Set();
  const materials = new Set();
  try {
    if (!el || !el.appendChild) throw new Error('A studio container element is required.');
    interactionEl = el.closest('.kd-scene-stage') || el.parentElement || el;
    const world = new THREE.Group();
    scene.add(world);
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.cssText =
      'display:block;width:100%;height:100%;touch-action:pan-y;outline:none;';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    camera.position.set(10.5, 8.4, 12);
    camera.lookAt(0, 1.7, 0);
    const transitions = [];
    const neon = [];
    const nightMeshes = [];
    const objects = [];
    const signRecords = [];
    let highlightedSign = null;
    let theme = 1;
    // The theme supplies a gentle default yaw; interaction adds an independent offset.
    let angle = 0;
    let dragStart = null;
    let moved = false;
    let activeView = null;
    let screenFocused = false;
    let lifeFocus = null;
    let aboutFocus = 'story';
    const aboutPageIndexes = { story: 0, experience: 0, approach: 0 };
    let boatDisplay = null;
    let voyageProgress = 0.12;
    let voyageDirection = 1;
    const motionPreference = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
    let voyagePlaying = !motionPreference.matches;
    let sceneVisible = true;
    let lifeTime = 0;
    let lastLifeTime = null;
    let lastMapPaint = -Infinity;
    let mapControlHeight = 88;
    let lastOutsideTheme = -1;
    let sceneIntersection = null;
    let cameraMotion = null;
    let frozenYaw = null;
    const currentLook = new THREE.Vector3(0, 1.7, 0);
    const officePoint = ([x, y, z]) => [x * 0.53 - 3.6, y * 0.43 + 0.094, z * 0.53 + 0.25];
    const monitorScale = [1.5, (1.5 * 0.53) / 0.43, 1.5],
      monitorAnchor = [-0.6, 1.94, -0.2],
      monitorRetreat = 0.18 / 0.53;
    const monitorPoint = ([x, y, z]) =>
      officePoint([
        (x + 0.42 - monitorAnchor[0]) * monitorScale[0] + monitorAnchor[0] - 0.42,
        (y - monitorAnchor[1]) * monitorScale[1] + monitorAnchor[1],
        (z + 0.85 - monitorAnchor[2]) * monitorScale[2] + monitorAnchor[2] - 0.85 - monitorRetreat,
      ]);
    const monitorCenter = monitorPoint([-1.02, 2.78, -1.021]);
    const monitorCloseup = {
      position: [monitorCenter[0], monitorCenter[1] + 0.054, monitorCenter[2] + 1.703],
      target: monitorCenter,
      fov: 32,
      minHorizontal: 46,
    };
    const lifePoint = ([x, y, z]) => [x * 1.1 - 4.255, y * 0.64 - 0.008, z * 1.1 - 1.106];
    const mappedShot = (shot, map) => ({
      ...shot,
      position: map(shot.position),
      target: map(shot.target),
    });
    const shotPresets = {
      work: mappedShot(
        { position: [-0.75, 3.18, 2.55], target: [-1.02, 2.7, -1.02], fov: 34, minHorizontal: 32 },
        monitorPoint,
      ),
      life: {
        position: [-0.75, 2.5, 2.6],
        target: [-1.45, 1.55, -2.8],
        fov: 39,
        minHorizontal: 40,
      },
      about: {
        position: [-2.45, 3.18, 0.55],
        target: [-2.45, 3.02, -2.35],
        fov: 40,
        minHorizontal: 32,
      },
    };
    const clamp = THREE.MathUtils.clamp;
    const smooth = (a, b, t) => {
      const x = clamp((t - a) / (b - a), 0, 1);
      return x * x * (3 - 2 * x);
    };
    const color = (value) => new THREE.Color(value);
    const trackMaterial = (material) => {
      materials.add(material);
      return material;
    };
    function material(day, night = day, roughness = 0.65, metalness = 0) {
      const m = trackMaterial(new THREE.MeshStandardMaterial({ color: day, roughness, metalness }));
      transitions.push({ material: m, day: color(day), night: color(night) });
      return m;
    }
    const M = {
      wall: material(0xe8ddc5, 0x111e31),
      wallSide: material(0xd8c9ac, 0x10182a),
      floor: material(0xd3bc93, 0x1c2c36),
      base: material(0xa79b7c, 0x09151f),
      wood: material(0xbd8559, 0x4d3837),
      edge: material(0xd6b68b, 0x263a43),
      metal: material(0x55605a, 0x19262e, 0.38, 0.4),
      dark: material(0x273230, 0x101b26, 0.5),
      cream: material(0xf1e8cd, 0xccc7b4),
      paper: material(0xece6d4, 0xa8bdc4),
      green: material(0x547344, 0x428d74),
      green2: material(0x769451, 0x61ab80),
      terracotta: material(0xc16a48, 0x92525e),
      rug: material(0xb7baa0, 0x253741),
      rugLine: material(0xd1d1b1, 0x3c515b),
      brass: material(0xa88b57, 0xa18765, 0.3, 0.65),
    };
    function mesh(geometry, mat, x, y, z, parent = world) {
      geometries.add(geometry);
      const o = new THREE.Mesh(geometry, mat);
      o.position.set(x, y, z);
      o.castShadow = true;
      o.receiveShadow = true;
      parent.add(o);
      return o;
    }
    const box = (w, h, d, x, y, z, mat, parent) =>
      mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
    const cyl = (rt, rb, h, x, y, z, mat, parent, segments = 24) =>
      mesh(new THREE.CylinderGeometry(rt, rb, h, segments), mat, x, y, z, parent);
    const sphere = (r, x, y, z, mat, parent) =>
      mesh(new THREE.SphereGeometry(r, 20, 14), mat, x, y, z, parent);
    function rod(a, b, r, mat, parent = world) {
      const p = new THREE.Vector3(...a),
        q = new THREE.Vector3(...b);
      const o = mesh(new THREE.CylinderGeometry(r, r, p.distanceTo(q), 12), mat, 0, 0, 0, parent);
      o.position.copy(p).add(q).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.sub(p).normalize());
      return o;
    }
    const fontRepaints = [];
    function canvasTexture(width, height, draw) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas textures are unavailable in this browser.');
      draw(ctx, width, height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      textures.add(texture);
      fontRepaints.push(() => {
        draw(ctx, width, height);
        texture.needsUpdate = true;
      });
      return texture;
    }
    const grain = canvasTexture(512, 128, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 48; i++) {
        ctx.strokeStyle = `rgba(82,42,21,${0.025 + (i % 5) * 0.007})`;
        ctx.lineWidth = 0.6 + (i % 3) * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, i * 3);
        ctx.bezierCurveTo(120, i * 3 - 3, 260, i * 3 + 4, w, i * 3 - 1);
        ctx.stroke();
      }
    });
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(2, 1);
    M.wood.map = grain;
    const haloTexture = canvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.12, 'rgba(255,255,255,.8)');
      g.addColorStop(0.4, 'rgba(255,255,255,.23)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    function halo(x, y, z, tint, size, parent = world) {
      const mat = trackMaterial(
        new THREE.SpriteMaterial({
          map: haloTexture,
          color: tint,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(x, y, z);
      sprite.scale.set(size, size, 1);
      parent.add(sprite);
      return mat;
    }
    function tube(points, tint, start, end, parent = world, radius = 0.027) {
      const mat = trackMaterial(
        new THREE.MeshStandardMaterial({
          color: 0x8eaba7,
          emissive: tint,
          emissiveIntensity: 0,
          roughness: 0.32,
          transparent: true,
          opacity: 0,
        }),
      );
      const glows = [];
      for (let i = 1; i < points.length; i++) {
        const strip = rod(points[i - 1], points[i], radius, mat, parent);
        strip.castShadow = false;
        strip.receiveShadow = false;
        const a = new THREE.Vector3(...points[i - 1]),
          b = new THREE.Vector3(...points[i]);
        const count = Math.max(1, Math.ceil(a.distanceTo(b) / 0.6));
        for (let j = 0; j <= count; j++) {
          const p = a.clone().lerp(b, j / count);
          glows.push(halo(p.x, p.y, p.z + 0.025, tint, 0.6, parent));
        }
      }
      neon.push({ material: mat, glows, tint: color(tint), start, end });
      return mat;
    }
    function plane(texture, w, h, x, y, z, parent = world, emissiveTint = 0xffffff) {
      const mat = trackMaterial(
        new THREE.MeshStandardMaterial({
          map: texture,
          color: 0xffffff,
          emissiveMap: texture,
          emissive: emissiveTint,
          emissiveIntensity: 0,
          roughness: 0.7,
        }),
      );
      const p = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent);
      p.castShadow = false;
      return p;
    }
    function plant(x, y, z, scale = 1, parent = world) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.scale.setScalar(scale);
      parent.add(g);
      cyl(0.27, 0.2, 0.43, 0, 0.215, 0, M.terracotta, g);
      cyl(0.285, 0.285, 0.055, 0, 0.415, 0, M.terracotta, g);
      cyl(0.245, 0.245, 0.018, 0, 0.447, 0, M.dark, g);
      for (let i = 0; i < 10; i++) {
        const a = i * 2.4,
          height = 0.65 + (i % 4) * 0.17;
        const p = [Math.cos(a) * (0.25 + (i % 3) * 0.07), height, Math.sin(a) * 0.32];
        rod([0, 0.4, 0], p, 0.015, M.green, g);
        const leaf = sphere(0.18, ...p, i % 2 ? M.green : M.green2, g);
        leaf.scale.set(0.65, 1.8, 0.28);
        leaf.rotation.set(Math.sin(a) * 0.65, a, -Math.cos(a) * 0.7);
      }
      return g;
    }
    function nightOnly(o) {
      o.traverse((child) => {
        if (child.isMesh) {
          child.userData.themeSource = child.material;
          child.material = child.material.clone();
          materials.add(child.material);
          child.material.transparent = true;
          child.material.opacity = 1;
          nightMeshes.push(child);
        }
      });
      return o;
    }
    const ambient = new THREE.HemisphereLight(0xe7eddf, 0x453d45, 1.5);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffe9ca, 2.6);
    key.position.set(-4, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -11;
    key.shadow.camera.right = 11;
    key.shadow.camera.top = 11;
    key.shadow.camera.bottom = -11;
    key.shadow.normalBias = 0.025;
    key.shadow.bias = -0.00015;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x7bcbff, 0.4);
    fill.position.set(5, 6, -3);
    scene.add(fill);
    const sunset = new THREE.DirectionalLight(0xffaa70, 0.5);
    sunset.position.set(-7, 4, 2);
    scene.add(sunset);
    function point(tint, x, y, z, distance = 8) {
      const light = new THREE.PointLight(tint, 0, distance, 2);
      light.position.set(x, y, z);
      world.add(light);
      return light;
    }
    const cyanLight = point(0x25e8ff, -2.8, 3.25, -1.7, 9);
    const warmLight = point(0xffc078, ...officePoint([0.87, 2.83, -1.2]), 2.15);
    const signLight = point(0xff4dbd, -3.55, 2.6, -4.32, 3.2);
    courtyardArchitecture = createKristianCourtyardArchitecture(THREE, { world, theme });
    neighborhood = createKristianNeighborhood(THREE, { world, theme });
    streetLife = createKristianStreetLife(THREE, {
      world,
      theme,
      sources: neighborhood.reflectionSources,
    });
    // Three enamel street arrows share a grounded metal post, with distinct directions.
    const post = new THREE.Group();
    post.position.set(-6.0, 0.12, 2.4);
    world.add(post);
    const postMetal = material(0x526560, 0x2a4652, 0.3, 0.65);
    cyl(0.2, 0.25, 0.12, 0, 0.07, 0, postMetal, post);
    cyl(0.085, 0.105, 4.25, 0, 2.175, 0, postMetal, post);
    sphere(0.13, 0, 4.32, 0, M.brass, post);
    const textMask = (label, size = 100, tracking = 0) =>
      canvasTexture(1024, 256, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.font = `500 ${size}px Rajdhani, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`;
        ctx.fillText(label, w / 2, h / 2 + 3);
      });
    function arrow(key, label, y, yaw, direction, dayTint, nightTint, neonTint) {
      const group = new THREE.Group();
      group.position.set(0, y + 0.93, 0);
      group.scale.set(1.2, 1.15, 1);
      group.rotation.y = yaw;
      post.add(group);
      const w = 2.44,
        h = 0.6,
        tip = 0.32;
      const points = [
        [-w / 2, -h / 2],
        [w / 2 - tip, -h / 2],
        [w / 2, 0],
        [w / 2 - tip, h / 2],
        [-w / 2, h / 2],
      ];
      if (direction < 0) {
        points.forEach((p) => {
          p[0] *= -1;
        });
        points.reverse();
      }
      const shape = new THREE.Shape();
      points.forEach((p, i) => {
        if (i) shape.lineTo(p[0], p[1]);
        else shape.moveTo(p[0], p[1]);
      });
      shape.closePath();
      const face = material(dayTint, nightTint, 0.27, 0.18),
        side = material(0x52625d, 0x263a46, 0.3, 0.45);
      const body = mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.085,
          bevelEnabled: true,
          bevelThickness: 0.018,
          bevelSize: 0.022,
          bevelSegments: 2,
          steps: 1,
        }),
        [face, side],
        0,
        0,
        0,
        group,
      );
      const mask = textMask(label, key === 'about' ? 128 : 140, 2);
      const textMat = material(0x234b4b, 0xf0f5e8, 0.45);
      textMat.map = mask;
      textMat.transparent = true;
      textMat.alphaTest = 0.08;
      textMat.emissiveMap = mask;
      textMat.emissive.set(neonTint);
      const lettering = mesh(
        new THREE.PlaneGeometry(1.98, 0.51),
        textMat,
        -direction * 0.1,
        0,
        0.112,
        group,
      );
      lettering.castShadow = false;
      const edgeMat = trackMaterial(
        new THREE.MeshStandardMaterial({
          color: neonTint,
          emissive: neonTint,
          emissiveIntensity: 0,
          roughness: 0.3,
        }),
      );
      const inset = points.map((p) => [p[0] * 0.97, p[1] * 0.89, 0.113]);
      inset.forEach((p, i) => {
        const edge = rod(p, inset[(i + 1) % inset.length], 0.017, edgeMat, group);
        edge.castShadow = false;
      });
      [-1.02, 1.02].forEach((x) => {
        const bolt = cyl(0.018, 0.018, 0.018, x, 0, 0.116, M.brass, group, 12);
        bolt.rotation.x = Math.PI / 2;
      });
      const glow = halo(0, 0, 0.12, neonTint, 1.05, group);
      const edgeLight = new THREE.PointLight(neonTint, 0, 1.2, 2);
      edgeLight.position.set(0, 0.05, 0.4);
      group.add(edgeLight);
      const record = {
        key,
        group,
        points: points.map((p) => [p[0], p[1], 0.133]),
        face,
        textMat,
        edgeMat,
        glow,
        edgeLight,
        tint: color(neonTint),
        dayTint: color(dayTint),
        nightTint: color(nightTint),
      };
      signRecords.push(record);
      objects.push({ object: body, key });
      return body;
    }
    arrow('work', 'WORK', 3.08, 0.8, 1, 0x9fcac2, 0x1c4b56, 0x3ceafa);
    arrow('life', 'LIFE', 2.27, 0.5, -1, 0xe6ad90, 0x563448, 0xff71b9);
    arrow('about', 'ABOUT', 1.46, 1.05, 1, 0xd6cda4, 0x424c46, 0xffd294);
    function updateSignMaterials() {
      const lit = smooth(0.25, 0.85, theme);
      signRecords.forEach((s) => {
        const hover = highlightedSign === s.key ? 1 : 0;
        s.face.color
          .copy(s.dayTint)
          .lerp(s.nightTint, theme)
          .lerp(s.tint, hover * (0.08 + theme * 0.07));
        s.face.emissive.copy(s.tint);
        s.face.emissiveIntensity = theme * 0.045 + hover * (0.03 + theme * 0.09);
        s.edgeMat.color.set(0x9eafa2).lerp(s.tint, lit);
        s.edgeMat.emissiveIntensity = lit * (1.4 + hover * 0.8);
        s.textMat.emissiveIntensity = theme * (0.14 + hover * 0.28);
        s.glow.opacity = lit * (0.025 + hover * 0.055);
        s.edgeLight.intensity = lit * (0.2 + hover * 0.2);
      });
    }
    const officeObjectsStart = world.children.length;
    // Warm timber desk and its visible small tools.
    const desk = new THREE.Group();
    desk.position.set(-0.42, 0, -0.85);
    world.add(desk);
    box(4.35, 0.16, 1.65, 0, 1.82, 0, M.wood, desk);
    box(4.22, 0.045, 1.5, 0, 1.71, 0, M.edge, desk);
    [-1.85, 1.85].forEach((x) =>
      [-0.58, 0.58].forEach((z) =>
        rod([x * 0.95, 0.17, z * 0.93], [x, 1.73, z], 0.063, M.metal, desk),
      ),
    );
    box(1.17, 0.28, 1.34, 1.23, 1.54, 0, M.wood, desk);
    box(0.32, 0.035, 0.035, 1.23, 1.54, 0.69, M.brass, desk);
    tube(
      [
        [-2.04, 1.72, 0.73],
        [2.04, 1.72, 0.73],
      ],
      0x39edff,
      0.35,
      0.65,
      desk,
      0.014,
    );
    const monitor = new THREE.Group();
    desk.add(monitor);
    monitor.scale.set(...monitorScale);
    monitor.position.set(
      monitorAnchor[0] * (1 - monitorScale[0]),
      monitorAnchor[1] * (1 - monitorScale[1]),
      monitorAnchor[2] * (1 - monitorScale[2]) - monitorRetreat,
    );
    cyl(0.34, 0.34, 0.045, -0.6, 1.94, -0.02, M.metal, monitor);
    box(0.12, 0.47, 0.12, -0.6, 2.14, -0.2, M.metal, monitor);
    box(1.96, 1.21, 0.12, -0.6, 2.77, -0.24, M.dark, monitor);
    let projectScreenState = { collection: 'work', tabHeight: 88 };
    const screenTexture = canvasTexture(1200, 694, (ctx, w, h) =>
      paintKristianProjectScreen(ctx, w, h, projectScreenState, KRISTIAN_PROJECTS),
    );
    const screen = plane(screenTexture, 1.79, 1.035, -0.6, 2.78, -0.171, monitor);
    objects.push({ object: monitor, key: 'work' });
    screen.material = trackMaterial(
      new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }),
    );
    function setProjectScreen(state) {
      projectScreenState = {
        ...state,
        collection: state?.collection === 'experiments' ? 'experiments' : 'work',
        headerHeight: Number(state?.headerHeight) || 46,
        footerHeight: Number(state?.footerHeight) || 24,
      };
      const canvas = screenTexture.image;
      paintKristianProjectScreen(
        canvas.getContext('2d'),
        canvas.width,
        canvas.height,
        projectScreenState,
        KRISTIAN_PROJECTS,
      );
      screenTexture.needsUpdate = true;
      schedule();
    }
    const screenGlow = halo(-0.6, 2.78, -0.12, 0x32dfdf, 2.7, monitor);
    box(1.35, 0.055, 0.46, -0.6, 1.96, 0.49, M.cream, desk);
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 10; i++)
        box(0.083, 0.018, 0.068, -1.16 + i * 0.125, 1.997, 0.35 + row * 0.12, M.paper, desk);
    sphere(0.09, 0.43, 1.99, 0.51, M.cream, desk).scale.set(1, 0.42, 1.3);
    cyl(0.24, 0.24, 0.04, 1.54, 1.94, -0.35, M.metal, desk);
    rod([1.54, 1.95, -0.35], [1.54, 2.7, -0.35], 0.035, M.metal, desk);
    rod([1.54, 2.7, -0.35], [1.38, 3.05, -0.35], 0.035, M.metal, desk);
    const lampShade = cyl(0.22, 0.36, 0.28, 1.34, 2.96, -0.35, M.terracotta, desk);
    lampShade.rotation.z = -0.45;
    const bulbMat = trackMaterial(
      new THREE.MeshStandardMaterial({ color: 0xffe5b0, emissive: 0xffbc6a, emissiveIntensity: 1 }),
    );
    sphere(0.12, 1.29, 2.83, -0.35, bulbMat, desk);
    const lampGlow = halo(0.87, 2.83, -1.2, 0xffc087, 1.5);
    cyl(0.17, 0.17, 0.025, 0.69, 1.93, 0.2, M.terracotta, desk);
    cyl(0.115, 0.1, 0.25, 0.69, 2.065, 0.2, M.cream, desk);
    cyl(0.096, 0.096, 0.008, 0.69, 2.194, 0.2, M.dark, desk);
    const mugHandle = mesh(
      new THREE.TorusGeometry(0.09, 0.023, 8, 20),
      M.cream,
      0.81,
      2.065,
      0.2,
      desk,
    );
    mugHandle.rotation.y = 0.2;
    box(0.68, 0.065, 0.49, -1.72, 1.94, 0.32, M.terracotta, desk).rotation.y = 0.15;
    box(0.64, 0.015, 0.46, -1.72, 1.98, 0.32, M.paper, desk).rotation.y = 0.15;
    cyl(0.1, 0.095, 0.25, 1.88, 2.06, 0.4, M.green, desk);
    for (let i = 0; i < 5; i++)
      rod(
        [1.84 + (i % 3) * 0.04, 2.02, 0.38 + Math.floor(i / 3) * 0.04],
        [1.82 + (i % 3) * 0.065, 2.42 + (i % 2) * 0.06, 0.38],
        0.009,
        M.wood,
        desk,
      );
    // A graphic woven rug makes the intersection of two directions tangible.
    box(3.2, 0.025, 2.0, 0.1, 0.2125, 0, M.rug);
    const rugTexture = canvasTexture(1024, 640, (ctx, w, h) => {
      ctx.fillStyle = '#19333d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#36535b';
      ctx.lineWidth = 2;
      for (let x = 15; x < w; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 10; y < h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#547e79';
      ctx.fillRect(55, 50, 110, h - 100);
      ctx.strokeStyle = '#7eb5a6';
      ctx.lineWidth = 5;
      ctx.strokeRect(28, 28, w - 56, h - 56);
      ctx.strokeStyle = '#b47590';
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.moveTo(220, h - 70);
      ctx.lineTo(450, h - 70);
      ctx.lineTo(530, h - 150);
      ctx.lineTo(w - 65, h - 150);
      ctx.stroke();
      ctx.strokeStyle = '#75a6b1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(220, 70);
      ctx.lineTo(w - 70, 70);
      ctx.lineTo(w - 70, 340);
      ctx.stroke();
      ctx.fillStyle = '#ccb17f';
      for (let i = 0; i < 5; i++) ctx.fillRect(w - 220 + i * 24, 91, 10, 36);
    });
    const rugFace = plane(rugTexture, 3.16, 1.96, 0.1, 0.226, 0);
    rugFace.rotation.x = -Math.PI / 2;
    rugFace.receiveShadow = true;
    const chair = new THREE.Group();
    chair.position.set(-0.88, 0, 0.25);
    chair.rotation.y = -0.28;
    world.add(chair);
    box(1.13, 0.18, 1.03, 0, 1.15, 0, M.green, chair);
    const chairBack = box(1.15, 0.82, 0.15, 0, 1.7, 0.45, M.green, chair);
    chairBack.rotation.x = 0.12;
    [-0.44, 0.44].forEach((x) =>
      [-0.39, 0.39].forEach((z) =>
        rod([x, 0.2, z], [x * 0.9, 1.09, z * 0.9], 0.042, M.wood, chair),
      ),
    );
    const officeInterior = new THREE.Group();
    world.children.slice(officeObjectsStart).forEach((object) => officeInterior.add(object));
    officeInterior.scale.set(0.53, 0.43, 0.53);
    officeInterior.position.set(-3.6, 0.094, 0.25);
    world.add(officeInterior);
    const lifeObjectsStart = world.children.length;
    // A generous sailing cabinet anchors the right side of the studio.
    const shelf = new THREE.Group();
    shelf.position.set(2.55, 0, -1.54);
    world.add(shelf);
    const shelfMetal = material(0x4b6268, 0x142a3c, 0.33, 0.65),
      screenBezel = material(0x263c43, 0x091521, 0.28, 0.68),
      screenTrim = material(0x93b7b2, 0x527d88, 0.3, 0.72);
    box(1.25, 2.8, 0.1, 0, 1.61, -0.44, shelfMetal, shelf);
    [-0.61, 0.61].forEach((x) => box(0.065, 2.88, 0.9, x, 1.61, 0, shelfMetal, shelf));
    [0.35, 1.625, 2.97].forEach((y) => {
      box(1.28, 0.085, 0.92, 0, y, 0, shelfMetal, shelf);
      tube(
        [
          [-0.55, y - 0.015, 0.469],
          [0.55, y - 0.015, 0.469],
        ],
        0x91b5b1,
        0.24,
        0.9,
        shelf,
        0.007,
      );
    });
    function lifeDisplayFrame(width, height, y, tint) {
      box(width + 0.14, height + 0.14, 0.1, 0, y, 0.34, screenBezel, shelf);
      [-1, 1].forEach((side) => {
        box(0.025, height + 0.115, 0.028, side * (width / 2 + 0.048), y, 0.407, screenTrim, shelf);
        box(
          width + 0.12,
          0.025,
          0.028,
          0,
          y + side * (height / 2 + 0.048),
          0.407,
          screenTrim,
          shelf,
        );
      });
      [
        [-0.5, -0.5],
        [0.5, -0.5],
        [0.5, 0.5],
        [-0.5, 0.5],
      ].forEach(([x, z]) => {
        const screw = cyl(
          0.011,
          0.011,
          0.009,
          x * (width + 0.09),
          y + z * (height + 0.09),
          0.428,
          M.brass,
          shelf,
          8,
        );
        screw.rotation.x = Math.PI / 2;
      });
      tube(
        [
          [-width / 2, y + height / 2 + 0.052, 0.432],
          [width / 2 - 0.18, y + height / 2 + 0.052, 0.432],
        ],
        tint,
        0.18,
        0.82,
        shelf,
        0.006,
      );
      for (let i = 0; i < 5; i++)
        box(
          0.025,
          0.009,
          0.008,
          width / 2 - 0.13 + i * 0.026,
          y - height / 2 - 0.047,
          0.433,
          M.dark,
          shelf,
        );
    }
    const lifePanelWidth = 1.14 / 1.1,
      lifeMapHeight = 0.71 / 0.64,
      lifeOutsideHeight = 0.6384 / 0.64;
    const lifeMapY = 2.2975,
      lifeOutsideY = 0.9875;
    const voyageTexture = canvasTexture(900, 560, (ctx, w, h) =>
      paintKristianVoyageMap(ctx, w, h, {
        progress: voyageProgress,
        direction: voyageDirection,
        theme: 1,
        time: 0,
        controlsHeight: mapControlHeight,
      }),
    );
    lifeDisplayFrame(lifePanelWidth, lifeMapHeight, lifeMapY, 0x68e6f0);
    const voyageMap = plane(
      voyageTexture,
      lifePanelWidth,
      lifeMapHeight,
      0,
      lifeMapY,
      0.412,
      shelf,
    );
    voyageMap.material = trackMaterial(
      new THREE.MeshBasicMaterial({ map: voyageTexture, toneMapped: false }),
    );
    function paintOutdoors(ctx, w, h, t) {
      const ink = new THREE.Color(0xe2fff4),
        paper = new THREE.Color(0x143542).lerp(new THREE.Color(0x081c2b), t),
        accent = new THREE.Color(0x82e0cc).lerp(new THREE.Color(0xbfa6f5), t);
      ctx.fillStyle = '#' + paper.getHexString();
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = t > 0.5 ? '#214554' : '#39616b';
      ctx.lineWidth = 1;
      for (let x = 28; x < w; x += 54) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 20; y < h; y += 54) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#' + paper.getHexString();
      ctx.globalAlpha = 0.82;
      ctx.fillRect(25, 25, w - 50, h - 50);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#' + accent.getHexString();
      ctx.font = '500 30px Arial, sans-serif';
      ctx.fillText('LIFE / OUTSIDE', 56, 64);
      ctx.beginPath();
      ctx.arc(w - 66, 52, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#' + ink.getHexString();
      ctx.font = '500 68px Arial, sans-serif';
      ctx.fillText('Outside is my reset.', 56, 158);
      ctx.font = '46px Arial, sans-serif';
      const words =
        'Salt air, open water, a trail that goes a little farther. I love the change of pace—and coming back with a fresh perspective.'.split(
          ' ',
        );
      let line = '',
        y = 245;
      for (const word of words) {
        const next = line ? line + ' ' + word : word;
        if (ctx.measureText(next).width > w - 112 && line) {
          ctx.fillText(line, 56, y);
          y += 63;
          line = word;
        } else line = next;
      }
      if (line) ctx.fillText(line, 56, y);
      ctx.strokeStyle = '#' + accent.getHexString();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(55, 510);
      ctx.lineTo(255, 510);
      ctx.lineTo(286, 487);
      ctx.lineTo(311, 499);
      ctx.lineTo(354, 461);
      ctx.lineTo(410, 510);
      ctx.lineTo(w - 55, 510);
      ctx.stroke();
    }
    const outdoorsTexture = canvasTexture(1000, 560, (ctx, w, h) => paintOutdoors(ctx, w, h, 1));
    lifeDisplayFrame(lifePanelWidth, lifeOutsideHeight, lifeOutsideY, 0x91b5b1);
    const outdoorsNote = plane(
      outdoorsTexture,
      lifePanelWidth,
      lifeOutsideHeight,
      0,
      lifeOutsideY,
      0.411,
      shelf,
    );
    outdoorsNote.material = trackMaterial(
      new THREE.MeshBasicMaterial({ map: outdoorsTexture, toneMapped: false }),
    );
    objects.push({ object: shelf, key: 'life' });
    // The larger model floats on a broad moving water tray.
    {
      const boat = new THREE.Group();
      boatDisplay = boat;
      boat.position.set(2.5, 3.02, -1.56);
      boat.rotation.y = 0.35;
      world.add(boat);
      const hullWood = material(0xb7794b, 0x9d775d, 0.42);
      hullWood.map = grain;
      const deckWood = material(0xdfbd86, 0xc5ac87, 0.58);
      deckWood.map = grain;
      const sailCream = material(0xf4e8cb, 0xe9e2d2, 0.91);
      const sailTeal = material(0x76b3ac, 0x94d4d1, 0.9);
      const sailCoral = material(0xd18c72, 0xe3a291, 0.88);
      [sailCream, sailTeal, sailCoral].forEach((m) => {
        m.side = THREE.DoubleSide;
      });
      const fabric = canvasTexture(128, 128, (ctx, w, h) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(69,76,64,.075)';
        ctx.lineWidth = 0.6;
        for (let i = 2; i < 128; i += 4) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, h);
          ctx.moveTo(0, i);
          ctx.lineTo(w, i);
          ctx.stroke();
        }
      });
      sailCream.map = fabric;
      sailTeal.map = fabric;
      sailCoral.map = fabric;
      // Longitudinal sections form a deep, rounded hull with raised, pointed ends.
      const sections = [
        [-0.55, 0.006, 0.365, 0.025],
        [-0.47, 0.085, 0.345, 0.105],
        [-0.3, 0.143, 0.323, 0.15],
        [-0.08, 0.165, 0.315, 0.165],
        [0.16, 0.148, 0.323, 0.155],
        [0.38, 0.102, 0.344, 0.11],
        [0.55, 0.003, 0.382, 0.028],
      ];
      const hullPositions = [],
        hullUVs = [],
        hullIndices = [],
        ribs = 14;
      sections.forEach(([x, beam, sheer, depth], i) => {
        for (let j = 0; j <= ribs; j++) {
          const a = (j / ribs) * Math.PI;
          hullPositions.push(x, sheer - Math.sin(a) * depth, Math.cos(a) * beam);
          hullUVs.push(i / (sections.length - 1), j / ribs);
          if (i < sections.length - 1 && j < ribs) {
            const a0 = i * (ribs + 1) + j,
              b0 = a0 + ribs + 1;
            hullIndices.push(a0, a0 + 1, b0, b0, a0 + 1, b0 + 1);
          }
        }
      });
      const hullGeometry = new THREE.BufferGeometry();
      hullGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hullPositions, 3));
      hullGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(hullUVs, 2));
      hullGeometry.setIndex(hullIndices);
      hullGeometry.computeVertexNormals();
      mesh(hullGeometry, hullWood, 0, 0, 0, boat);
      const deckPositions = [],
        deckUVs = [],
        deckIndices = [];
      sections.forEach(([x, beam, sheer], i) => {
        deckPositions.push(x, sheer - 0.009, -beam, x, sheer - 0.009, beam);
        deckUVs.push(i / 6, 0, i / 6, 1);
        if (i < sections.length - 1) {
          const n = i * 2;
          deckIndices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
        }
      });
      const deckGeometry = new THREE.BufferGeometry();
      deckGeometry.setAttribute('position', new THREE.Float32BufferAttribute(deckPositions, 3));
      deckGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(deckUVs, 2));
      deckGeometry.setIndex(deckIndices);
      deckGeometry.computeVertexNormals();
      mesh(deckGeometry, deckWood, 0, 0, 0, boat);
      [-1, 1].forEach((side) => {
        const curve = new THREE.CatmullRomCurve3(
          sections.map(([x, beam, sheer]) => new THREE.Vector3(x, sheer + 0.002, beam * side)),
        );
        mesh(new THREE.TubeGeometry(curve, 40, 0.009, 6, false), deckWood, 0, 0, 0, boat);
      });
      rod([-0.1, 0.316, 0], [-0.1, 1.095, 0], 0.013, M.brass, boat);
      sphere(0.019, -0.1, 1.097, 0, M.brass, boat);
      rod([-0.1, 0.415, 0.015], [0.44, 0.415, 0.015], 0.009, M.brass, boat);
      // Both sails are triangular fabric meshes with a gentle three-dimensional billow.
      function fabricSail(a, b, c, mat, divisions = 9) {
        const A = new THREE.Vector3(...a),
          B = new THREE.Vector3(...b),
          C = new THREE.Vector3(...c);
        const positions = [],
          uvs = [],
          indices = [],
          rows = [];
        for (let i = 0; i <= divisions; i++) {
          rows[i] = [];
          for (let j = 0; j <= divisions - i; j++) {
            const u = i / divisions,
              v = j / divisions,
              r = 1 - u - v;
            const p = A.clone().multiplyScalar(r).addScaledVector(B, u).addScaledVector(C, v);
            p.z += Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * Math.sin(Math.PI * r) * 0.19;
            rows[i][j] = positions.length / 3;
            positions.push(p.x, p.y, p.z);
            uvs.push(u, v);
          }
        }
        for (let i = 0; i < divisions; i++)
          for (let j = 0; j < divisions - i; j++) {
            indices.push(rows[i][j], rows[i][j + 1], rows[i + 1][j]);
            if (j < divisions - i - 1)
              indices.push(rows[i + 1][j], rows[i][j + 1], rows[i + 1][j + 1]);
          }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        g.setIndex(indices);
        g.computeVertexNormals();
        return mesh(g, mat, 0, 0, 0, boat);
      }
      fabricSail([-0.074, 1.025, 0.018], [0.425, 0.443, 0.018], [-0.074, 0.443, 0.018], sailCream);
      fabricSail([-0.135, 1.005, 0.008], [-0.495, 0.438, 0.008], [-0.135, 0.438, 0.008], sailTeal);
      // Coral lower panels and stitched hems add a small, purposeful hit of color.
      fabricSail(
        [-0.074, 0.53, 0.028],
        [0.425, 0.443, 0.028],
        [-0.074, 0.443, 0.028],
        sailCoral,
        3,
      );
      const hemMat = M.cream;
      [
        [
          [-0.074, 1.025, 0.023],
          [0.425, 0.443, 0.023],
        ],
        [
          [0.425, 0.443, 0.023],
          [-0.074, 0.443, 0.023],
        ],
        [
          [-0.135, 1.005, 0.013],
          [-0.495, 0.438, 0.013],
        ],
      ].forEach(([a, b]) => rod(a, b, 0.0033, hemMat, boat));
      rod([-0.1, 1.075, 0], [0.54, 0.38, 0], 0.003, M.paper, boat);
      rod([-0.1, 1.075, 0], [-0.54, 0.37, 0], 0.003, M.paper, boat);
      rod([0.425, 0.443, 0.02], [0.3, 0.325, 0.13], 0.0028, M.paper, boat);
    }
    boatDisplay.scale.y = 1.71875;
    boatDisplay.position.y = 2.88;
    boatLights = createKristianBoatLights(THREE, { boat: boatDisplay, theme });
    boatWater = createKristianBoatWater(THREE, {
      world,
      boat: boatDisplay,
      boatY: 2.88,
      theme: 1,
      reducedMotion: motionPreference.matches,
      active: true,
    });
    objects.push({ object: boatDisplay, key: 'life' });
    const boatTagTexture = canvasTexture(780, 100, (ctx, w, h) => {
      ctx.fillStyle = '#133c45';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c8f4df';
      ctx.font = '500 53px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MAKE WAVES', w / 2, 68);
    });
    const boatTag = plane(boatTagTexture, 0.78, 0.1, 2.5, 3.105, -1.139);
    boatTag.material = trackMaterial(
      new THREE.MeshBasicMaterial({ map: boatTagTexture, toneMapped: false }),
    );
    const boatHitAnchor = new THREE.Object3D();
    boatHitAnchor.position.set(2.5, 3.91125, -1.1);
    world.add(boatHitAnchor);

    const lifeStation = new THREE.Group();
    world.children.slice(lifeObjectsStart).forEach((object) => lifeStation.add(object));
    lifeStation.scale.set(1.1, 0.64, 1.1);
    lifeStation.position.set(-2.805, -0.008, 1.694);
    const lifePivot = new THREE.Group();
    lifePivot.position.set(-1.45, 0, -2.8);
    lifePivot.add(lifeStation);
    world.add(lifePivot);
    silverado = createKristianSilverado(THREE, {
      world,
      position: [4.15, 0.12, -1.9],
      rotation: 0,
      theme,
    });
    // One tabbed terminal faces the studio entrance.
    aboutArchive = createKristianAboutArchive(THREE, { world, M, theme: 1 });
    function refreshAboutDisplay() {
      const key = aboutFocus || 'story',
        section = KRISTIAN_ABOUT[key],
        index = aboutPageIndexes[key] || 0,
        page = section.pages[index];
      aboutArchive.updateSurface('display', {
        paint: (ctx, w, h) =>
          paintKristianAboutWallPage(ctx, w, h, { section, page, index, key, theme }),
      });
    }
    refreshAboutDisplay();
    aboutArchive.group.position.set(-3.25, -1.18, -1.2);
    shotPresets.about = mappedShot(aboutArchive.overview, ([x, y, z]) => [
      x - 3.25,
      y - 1.18,
      z - 1.2,
    ]);
    objects.push({ object: aboutArchive.group, key: 'about' });
    // A dark-framed lightbox with sharp lettering, and a soft luminous surround.
    box(3.8, 0.95, 0.1, -3.55, 2.6, -4.61, M.dark);
    const signTexture = canvasTexture(1024, 256, (ctx, w, h) => {
      ctx.fillStyle = '#19282e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f399c3';
      ctx.lineWidth = 7;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.fillStyle = '#ffe1e9';
      ctx.font = '500 220px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STUDIO', w / 2, h / 2 + 4);
    });
    const sign = plane(signTexture, 3.64, 0.81, -3.55, 2.6, -4.553);
    const signGlow = halo(-3.55, 2.6, -4.49, 0xff52c0, 5.0);
    tube(
      [
        [-5.31, 2.148, -4.548],
        [-1.79, 2.148, -4.548],
      ],
      0xff3ac8,
      0.68,
      0.94,
      world,
      0.014,
    );
    indoorPlants = createKristianIndoorPlants(THREE, { world, theme });
    cameraEquipment = createKristianCameraEquipment(THREE, { world, theme });
    const shadowMat = trackMaterial(new THREE.ShadowMaterial({ opacity: 0.17 }));
    const ground = mesh(new THREE.PlaneGeometry(100, 100), shadowMat, 0, -0.255, 0, scene);
    ground.rotation.x = -Math.PI / 2;
    ground.castShadow = false;
    function applyTheme(value) {
      theme = clamp(Number.isFinite(Number(value)) ? Number(value) : 1, 0, 1);
      transitions.forEach((t) => t.material.color.copy(t.day).lerp(t.night, theme));
      aboutArchive?.setTheme(theme);
      boatLights?.setTheme(theme);
      silverado?.setTheme(theme);
      courtyardArchitecture?.setTheme(theme);
      neighborhood?.setTheme(theme);
      streetLife?.setTheme(theme);
      indoorPlants?.setTheme(theme);
      cameraEquipment?.setTheme(theme);
      // The wall material clones preserve each original palette while allowing opacity.
      const wallFade = smooth(0.08, 0.6, theme);
      nightMeshes.forEach((o) => {
        o.visible = wallFade > 0.001;
        o.material.opacity = wallFade;
        o.material.depthWrite = wallFade > 0.98;
        const source = o.userData.themeSource;
        o.material.color.copy(source.color);
        o.castShadow = wallFade > 0.5;
      });
      neon.forEach((n) => {
        const p = smooth(n.start, n.end, theme);
        n.material.color.set(0xa9bbb5).lerp(n.tint, p * 0.8);
        n.material.emissiveIntensity = p * 3.6;
        n.material.opacity = p;
        n.material.depthWrite = p > 0.98;
        n.glows.forEach((m) => {
          m.opacity = p * 0.23;
        });
      });
      const cyan = smooth(0.28, 0.65, theme),
        pink = smooth(0.55, 0.91, theme),
        glow = smooth(0.08, 0.5, theme);
      ambient.color.set(0xfff0d4).lerp(color(0xa6c6e5), theme);
      ambient.groundColor.set(0x9a8e70).lerp(color(0x252032), theme);
      ambient.intensity = THREE.MathUtils.lerp(2.8, 1.25, theme);
      key.color.set(0xffe6c3).lerp(color(0xc8daf8), theme);
      key.intensity = THREE.MathUtils.lerp(3, 1.8, theme);
      fill.color.set(0xfff0d8).lerp(color(0x799cfc), theme);
      fill.intensity = THREE.MathUtils.lerp(0.35, 0.7, theme);
      sunset.intensity = THREE.MathUtils.lerp(0.65, 0.12, theme);
      cyanLight.intensity = 0;
      warmLight.intensity = 0.15 + glow * 1.2;
      signLight.intensity = pink * 2.4;
      screenGlow.opacity = 0.025 + theme * 0.11;
      bulbMat.emissiveIntensity = 0.35 + glow * 2.8;
      lampGlow.opacity = glow * 0.3;
      sign.material.emissiveIntensity = 0.04 + smooth(0.64, 0.95, theme) * 1.9;
      signGlow.opacity = pink * 0.11;
      rugFace.material.emissiveIntensity = theme * 0.11;
      updateSignMaterials();
      shadowMat.opacity = THREE.MathUtils.lerp(0.14, 0.23, theme);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(1.16, 1.08, theme);
    }
    function desiredCameraPose(view, width, height) {
      const aspect = width / height,
        closeView = width < 600;
      if (!view) {
        return {
          position: new THREE.Vector3(-4, 6, 13),
          target: new THREE.Vector3(-1.2, 1, -0.8),
          fov: Math.max(
            34,
            (2 * Math.atan(Math.tan((30 * Math.PI) / 180) / aspect) * 180) / Math.PI,
          ),
          yaw: -0.1 + angle,
        };
      }
      const lifeShots = {
        boat: {
          position: [-0.57, 2.8582, -0.171],
          target: [-1.505, 2.4732, -2.734],
          fov: 34,
          minHorizontal: 33,
        },
        map: {
          position: [-1.4, 1.5924, -0.4668],
          target: [-1.45, 1.4624, -2.3468],
          fov: 32,
          minHorizontal: 38,
        },
        outside: {
          position: [-1.4, 0.709, -0.4679],
          target: [-1.45, 0.624, -2.3479],
          fov: 32,
          minHorizontal: 38,
        },
      };
      const preset =
        view === 'work' && screenFocused
          ? monitorCloseup
          : view === 'life' && lifeFocus
            ? lifeShots[lifeFocus]
            : shotPresets[view];
      const yaw = frozenYaw === null ? world.rotation.y : frozenYaw;
      const rotation = new THREE.Matrix4().makeRotationY(yaw);
      return {
        position: new THREE.Vector3(...preset.position).applyMatrix4(rotation),
        target: new THREE.Vector3(...preset.target).applyMatrix4(rotation),
        fov: Math.max(
          preset.fov,
          (2 * Math.atan(Math.tan((preset.minHorizontal * Math.PI) / 360) / aspect) * 180) /
            Math.PI,
        ),
        yaw,
      };
    }
    function beginCameraMove(view, options = {}) {
      if (disposed || (view !== null && !shotPresets[view])) return false;
      // Sample the current flight before replacing it, so a second sign never jumps back.
      drawPending = false;
      if (cameraMotion) {
        draw(performance.now());
        drawPending = false;
      }
      const oldView = activeView;
      if (view !== null && frozenYaw === null) frozenYaw = world.rotation.y;
      dragStart = null;
      moved = false;
      highlightedSign = null;
      updateSignMaterials();
      const reduced =
        typeof globalThis.matchMedia === 'function' &&
        globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const requestedDuration = Number(options.duration);
      const duration =
        options.animate === false || options.immediate || options.reducedMotion || reduced
          ? 0
          : Number.isFinite(requestedDuration)
            ? Math.max(0, requestedDuration)
            : 1300;
      activeView = view;
      cameraMotion = {
        key: view,
        start: performance.now(),
        duration,
        fromPosition: camera.position.clone(),
        fromTarget: currentLook.clone(),
        fromFov: camera.fov,
        fromYaw: world.rotation.y,
        lift: oldView !== view ? 0.35 : 0,
      };
      if (callbacks.onViewChange) callbacks.onViewChange({ key: view, settled: false });
      if (duration === 0) {
        draw(performance.now());
        invalidate();
      } else schedule();
      return true;
    }
    function draw(now = performance.now()) {
      // Always release the pending flag, including when this container is hidden.
      drawPending = false;
      if (disposed) return;
      if (el.clientWidth < 1 || el.clientHeight < 1) {
        if (callbacks.onSignLayout) callbacks.onSignLayout([]);
        return;
      }
      const w = el.clientWidth,
        h = el.clientHeight;
      const lifeActive =
        (activeView === null || activeView === 'life') && sceneVisible && !document.hidden;
      const neighborhoodActive = activeView === null && sceneVisible && !document.hidden;
      const neighborhoodMotion =
        neighborhood?.update(now / 1000, {
          active: neighborhoodActive,
          reducedMotion: motionPreference.matches,
        }) === true;
      const lifeMotion = lifeActive && (!motionPreference.matches || voyagePlaying);
      const lifeDelta =
        lastLifeTime === null ? 0 : Math.min(0.08, Math.max(0, (now - lastLifeTime) / 1000));
      lastLifeTime = now;
      if (lifeMotion) {
        lifeTime += lifeDelta;
        if (voyagePlaying) {
          voyageProgress += (lifeDelta * voyageDirection) / 20;
          if (voyageProgress >= 1 || voyageProgress <= 0) {
            voyageProgress = Math.max(0, Math.min(1, voyageProgress));
            voyageDirection *= -1;
            if (callbacks.onLifeState)
              callbacks.onLifeState({
                playing: voyagePlaying,
                direction: voyageDirection,
                focus: lifeFocus,
              });
          }
        }
      }
      boatWater?.update(lifeTime, theme, { active: lifeMotion, reducedMotion: !lifeMotion });
      const truckMotion =
        silverado?.update(now / 1000, {
          active: lifeActive,
          reducedMotion: motionPreference.matches,
        }) === true;
      if (now - lastMapPaint > 65 || !lifeMotion) {
        const canvas = voyageTexture.image;
        paintKristianVoyageMap(canvas.getContext('2d'), canvas.width, canvas.height, {
          progress: voyageProgress,
          direction: voyageDirection,
          theme,
          time: lifeTime,
          controlsHeight: mapControlHeight,
        });
        voyageTexture.needsUpdate = true;
        lastMapPaint = now;
      }
      if (Math.abs(theme - lastOutsideTheme) > 0.04 || theme === 0 || theme === 1) {
        if (theme !== lastOutsideTheme) {
          const canvas = outdoorsTexture.image;
          paintOutdoors(canvas.getContext('2d'), canvas.width, canvas.height, theme);
          outdoorsTexture.needsUpdate = true;
          lastOutsideTheme = theme;
        }
      }
      const pose = desiredCameraPose(activeView, w, h);
      let completedView;
      camera.aspect = w / h;
      if (cameraMotion) {
        const t =
          cameraMotion.duration === 0
            ? 1
            : clamp((now - cameraMotion.start) / cameraMotion.duration, 0, 1);
        const ease = t * t * t * (t * (t * 6 - 15) + 10);
        camera.position.copy(cameraMotion.fromPosition).lerp(pose.position, ease);
        camera.position.y += Math.sin(Math.PI * t) * cameraMotion.lift;
        currentLook.copy(cameraMotion.fromTarget).lerp(pose.target, ease);
        camera.fov = THREE.MathUtils.lerp(cameraMotion.fromFov, pose.fov, ease);
        world.rotation.y = THREE.MathUtils.lerp(cameraMotion.fromYaw, pose.yaw, ease);
        if (t >= 1) {
          completedView = cameraMotion.key;
          cameraMotion = null;
          if (activeView === null) frozenYaw = null;
        }
      } else {
        camera.position.copy(pose.position);
        currentLook.copy(pose.target);
        camera.fov = pose.fov;
        world.rotation.y = pose.yaw;
      }
      camera.lookAt(currentLook);
      camera.updateProjectionMatrix();
      const streetMotion =
        streetLife?.update(now / 1000, {
          active: neighborhoodActive,
          reducedMotion: motionPreference.matches,
          camera,
        }) === true;
      // Fiber owns drawing; update matrices before projecting native screen controls.
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      if (callbacks.onSignLayout) {
        const projectedSigns = signRecords.map((s) => {
          const center = new THREE.Vector3().setFromMatrixPosition(s.group.matrixWorld);
          const normal = new THREE.Vector3(0, 0, 1).transformDirection(s.group.matrixWorld);
          const inFront = center.clone().applyMatrix4(camera.matrixWorldInverse).z < -camera.near;
          const facing = normal.dot(camera.position.clone().sub(center)) > 0;
          const points =
            inFront && facing
              ? s.points.map((p) => {
                  const v = new THREE.Vector3(...p)
                    .applyMatrix4(s.group.matrixWorld)
                    .project(camera);
                  return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h];
                })
              : [[-1, -1]];
          return { key: s.key, points, visible: inFront && facing };
        });
        callbacks.onSignLayout(projectedSigns);
      }
      if (callbacks.onMonitorLayout) {
        const points = [
          [-0.895, 0.5175, 0.003],
          [0.895, 0.5175, 0.003],
          [0.895, -0.5175, 0.003],
          [-0.895, -0.5175, 0.003],
        ].map((p) => {
          const v = new THREE.Vector3(...p).applyMatrix4(screen.matrixWorld).project(camera);
          return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h];
        });
        callbacks.onMonitorLayout({ points, visible: activeView === 'work' && !cameraMotion });
      }
      if (callbacks.onLifeLayout) {
        const project = (object, width, height) =>
          [
            [-width / 2, height / 2, 0.004],
            [width / 2, height / 2, 0.004],
            [width / 2, -height / 2, 0.004],
            [-width / 2, -height / 2, 0.004],
          ].map((p) => {
            const v = new THREE.Vector3(...p).applyMatrix4(object.matrixWorld).project(camera);
            return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h];
          });
        const mapPoints = project(voyageMap, lifePanelWidth, lifeMapHeight),
          mapWidth = Math.min(
            Math.hypot(mapPoints[1][0] - mapPoints[0][0], mapPoints[1][1] - mapPoints[0][1]),
            Math.hypot(mapPoints[2][0] - mapPoints[3][0], mapPoints[2][1] - mapPoints[3][1]),
          );
        const nextControlHeight =
          lifeFocus === 'map'
            ? Math.min(190, Math.ceil((56 * 900) / Math.max(240, mapWidth)) + 18)
            : 70;
        if (Math.abs(nextControlHeight - mapControlHeight) > 1) {
          mapControlHeight = nextControlHeight;
          lastMapPaint = -Infinity;
          schedule();
        }
        callbacks.onLifeLayout({
          focus: lifeFocus,
          visible: activeView === 'life' && !cameraMotion,
          planes: [
            { key: 'boat', points: project(boatHitAnchor, 1.35, 2.3375) },
            { key: 'map', points: mapPoints },
            { key: 'outside', points: project(outdoorsNote, lifePanelWidth, lifeOutsideHeight) },
          ],
          mapWidth,
          controlsHeight: mapControlHeight,
        });
      }
      if (callbacks.onAboutLayout && aboutArchive) {
        const planes = aboutArchive.surfaces.map((record) => ({
          key: record.key,
          points: record.corners.map((point) => {
            const v = new THREE.Vector3(...point)
              .applyMatrix4(record.mesh.matrixWorld)
              .project(camera);
            return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h];
          }),
        }));
        callbacks.onAboutLayout({
          focus: aboutFocus,
          visible: activeView === 'about' && !cameraMotion,
          planes,
        });
      }
      if (completedView !== undefined && callbacks.onViewChange)
        callbacks.onViewChange({ key: completedView, settled: true });
      if (cameraMotion || lifeMotion || truckMotion || neighborhoodMotion || streetMotion)
        schedule();
    }
    function schedule() {
      if (!disposed && !drawPending) {
        drawPending = true;
        invalidate();
      }
    }
    function listen(name, handler) {
      interactionEl.addEventListener(name, handler);
      listeners.push([name, handler]);
    }
    listen('pointerdown', (e) => {
      if (
        e.button !== 0 ||
        e.target.closest(
          '.kd-monitor-ui,.kd-life-navigation,.kd-life-map-controls,.kd-life-boat-controls,.kd-life-back,.kd-about-navigation,.kd-about-reader,.kd-about-back',
        )
      )
        return;
      dragStart = {
        x: e.clientX,
        y: e.clientY,
        angle,
        pointerId: e.pointerId,
        canRotate: activeView === null && !cameraMotion,
      };
      moved = false;
      if (interactionEl.setPointerCapture) interactionEl.setPointerCapture(e.pointerId);
    });
    listen('pointermove', (e) => {
      if (!dragStart || dragStart.pointerId !== e.pointerId) return;
      const dx = e.clientX - dragStart.x,
        dy = e.clientY - dragStart.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (moved && dragStart.canRotate) {
        angle = clamp(dragStart.angle + dx * 0.005, -0.65, 0.6);
        if (callbacks.onRotate) callbacks.onRotate((angle * 180) / Math.PI);
        schedule();
      }
    });
    listen('pointerup', (e) => {
      if (dragStart && dragStart.pointerId !== e.pointerId) return;
      const start = dragStart;
      dragStart = null;
      if (start && interactionEl.hasPointerCapture && interactionEl.hasPointerCapture(e.pointerId))
        interactionEl.releasePointerCapture(e.pointerId);
      if (!start || moved) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hits = objects
        .map((o) => ({ key: o.key, hits: raycaster.intersectObject(o.object, true) }))
        .filter((o) => o.hits.length)
        .sort((a, b) => a.hits[0].distance - b.hits[0].distance);
      if (hits.length && callbacks.onNavigate) callbacks.onNavigate(hits[0].key);
    });
    listen('pointercancel', () => {
      dragStart = null;
    });
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(el);
    } else {
      globalThis.addEventListener('resize', schedule);
    }
    function resumeLife() {
      lastLifeTime = null;
      schedule();
    }
    function motionChanged() {
      if (motionPreference.matches) {
        voyagePlaying = false;
        if (cameraMotion) cameraMotion.duration = 0;
      }
      if (callbacks.onLifeState)
        callbacks.onLifeState({
          playing: voyagePlaying,
          direction: voyageDirection,
          focus: lifeFocus,
        });
      resumeLife();
    }
    releaseSceneEvents = () => {
      globalThis.removeEventListener('resize', schedule);
      sceneIntersection?.disconnect();
      document.removeEventListener('visibilitychange', resumeLife);
      motionPreference.removeEventListener('change', motionChanged);
    };
    document.addEventListener('visibilitychange', resumeLife);
    motionPreference.addEventListener('change', motionChanged);
    if (typeof IntersectionObserver !== 'undefined') {
      sceneIntersection = new IntersectionObserver(
        (entries) => {
          sceneVisible = entries[0]?.isIntersecting !== false;
          resumeLife();
        },
        { threshold: 0 },
      );
      sceneIntersection.observe(el);
    }
    applyTheme(1);
    draw();
    invalidate();
    document.fonts?.ready.then(() => {
      if (disposed) return;
      fontRepaints.forEach((paint) => paint());
      refreshAboutDisplay();
      lastMapPaint = -Infinity;
      lastOutsideTheme = -1;
      schedule();
    });
    return {
      setTheme(progress) {
        if (disposed) return;
        applyTheme(progress);
        schedule();
      },
      setAngle(degrees) {
        if (disposed) return;
        angle = clamp(((Number(degrees) || 0) * Math.PI) / 180, -0.65, 0.6);
        schedule();
      },
      navigateTo(key, options) {
        if (key === 'life' && !lifeFocus) {
          lifeFocus = 'boat';
          if (callbacks.onLifeState)
            callbacks.onLifeState({
              playing: voyagePlaying,
              direction: voyageDirection,
              focus: lifeFocus,
            });
        }
        return beginCameraMove(key, options);
      },
      resetView(options) {
        lifeFocus = null;
        if (callbacks.onLifeState)
          callbacks.onLifeState({
            playing: voyagePlaying,
            direction: voyageDirection,
            focus: null,
          });
        return beginCameraMove(null, options);
      },
      focusMonitor(enabled, options) {
        if (disposed || screenFocused === !!enabled) return;
        screenFocused = !!enabled;
        if (activeView === 'work') beginCameraMove('work', options);
      },
      focusLife(key, options) {
        if (![null, 'boat', 'map', 'outside'].includes(key) || disposed) return;
        lifeFocus = key;
        if (callbacks.onLifeState)
          callbacks.onLifeState({
            playing: voyagePlaying,
            direction: voyageDirection,
            focus: lifeFocus,
          });
        if (activeView === 'life') beginCameraMove('life', options);
      },
      focusAbout(key, options) {
        if (![null, 'story', 'experience', 'approach'].includes(key) || disposed) return;
        aboutFocus = key;
        aboutArchive.setSelection(key);
        refreshAboutDisplay();
        if (callbacks.onAboutState) callbacks.onAboutState({ focus: aboutFocus });
        schedule();
      },
      setAboutPage(key, index) {
        const entry = KRISTIAN_ABOUT[key];
        if (!entry || disposed) return;
        aboutPageIndexes[key] = clamp(Math.floor(Number(index) || 0), 0, entry.pages.length - 1);
        if (key === aboutFocus) refreshAboutDisplay();
        schedule();
      },
      setLifePlaying(playing) {
        voyagePlaying = !!playing;
        lastLifeTime = null;
        if (callbacks.onLifeState)
          callbacks.onLifeState({
            playing: voyagePlaying,
            direction: voyageDirection,
            focus: lifeFocus,
          });
        schedule();
      },
      reverseVoyage() {
        voyageDirection *= -1;
        if (callbacks.onLifeState)
          callbacks.onLifeState({
            playing: voyagePlaying,
            direction: voyageDirection,
            focus: lifeFocus,
          });
        schedule();
      },
      rippleWater() {
        boatWater?.nudge(1.4);
        schedule();
      },
      setProjectScreen,
      highlightSign(key) {
        if (disposed) return;
        const next = signRecords.some((s) => s.key === key) ? key : null;
        if (next === highlightedSign) return;
        highlightedSign = next;
        updateSignMaterials();
        schedule();
      },
      tick(now) {
        if (!disposed) draw(now);
      },
      render() {
        if (!disposed) {
          drawPending = false;
          draw();
          invalidate();
        }
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        drawPending = false;
        if (resizeObserver) resizeObserver.disconnect();
        else globalThis.removeEventListener('resize', schedule);
        releaseSceneEvents();
        boatLights?.dispose();
        boatWater?.dispose();
        aboutArchive?.dispose();
        silverado?.dispose();
        courtyardArchitecture?.dispose();
        neighborhood?.dispose();
        streetLife?.dispose();
        indoorPlants?.dispose();
        cameraEquipment?.dispose();
        listeners.forEach(([name, handler]) => interactionEl.removeEventListener(name, handler));
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        textures.forEach((t) => t.dispose());
        scene.children
          .filter((child) => !initialChildren.has(child))
          .forEach((child) => scene.remove(child));
      },
    };
  } catch (error) {
    disposed = true;
    if (resizeObserver) resizeObserver.disconnect();
    releaseSceneEvents();
    listeners.forEach(
      ([name, handler]) => interactionEl && interactionEl.removeEventListener(name, handler),
    );
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    scene.children
      .filter((child) => !initialChildren.has(child))
      .forEach((child) => scene.remove(child));
    boatLights?.dispose();
    boatWater?.dispose();
    aboutArchive?.dispose();
    silverado?.dispose();
    courtyardArchitecture?.dispose();
    neighborhood?.dispose();
    streetLife?.dispose();
    indoorPlants?.dispose();
    cameraEquipment?.dispose();
    throw new Error(
      `Unable to create Kristian's studio: ${error && error.message ? error.message : error}`,
    );
  }
}
