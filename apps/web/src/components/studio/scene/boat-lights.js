/** Procedural scene model retained from the approved Corner Studio. */
export function createKristianBoatLights(THREE, { boat, theme = 1 } = {}) {
  if (!THREE || !boat) throw new Error('Boat lights need THREE and the boat group.');
  const group = new THREE.Group();
  group.name = 'Boat navigation and deck fixtures';
  boat.add(group);
  const geometries = new Set(),
    materials = new Set(),
    lenses = [];
  let disposed = false;
  function metal(color, roughness = 0.4, metalness = 0.75) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(m);
    return m;
  }
  const bronze = metal(0x807155),
    dark = metal(0x172429, 0.58, 0.5),
    silver = metal(0xaeb6ad, 0.3, 0.82);
  function mesh(g, m, p, parent = group) {
    geometries.add(g);
    const o = new THREE.Mesh(g, m);
    o.position.set(...p);
    o.castShadow = false;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const cylinder = (r, h, m, p, parent, open = false, start = 0, arc = Math.PI * 2) =>
    mesh(new THREE.CylinderGeometry(r, r, h, 16, 1, open, start, arc), m, p, parent);
  function lens(color, g, p, parent = group) {
    const m = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1,
      roughness: 0.22,
      metalness: 0.08,
      toneMapped: false,
    });
    materials.add(m);
    lenses.push(m);
    const o = mesh(g, m, p, parent);
    o.receiveShadow = false;
    return o;
  }
  // Boat local axes: bow -X, starboard -Z, port +Z.
  // Each colored lens opens from dead ahead through 112.5 degrees on its side.
  function sideLamp(side, color, name) {
    const fixture = new THREE.Group();
    fixture.name = name;
    fixture.position.set(-0.46, 0.365, side * 0.08);
    group.add(fixture);
    const start = side > 0 ? Math.PI * 1.5 : Math.PI * 0.875,
      arc = Math.PI * 0.625;
    cylinder(0.018, 0.012, bronze, [0, -0.009, 0], fixture);
    cylinder(0.015, 0.016, dark, [0, 0.003, 0], fixture);
    lens(
      color,
      new THREE.CylinderGeometry(0.0155, 0.0155, 0.014, 16, 1, true, start, arc),
      [0, 0.003, 0],
      fixture,
    );
    cylinder(0.018, 0.005, dark, [0, 0.013, 0], fixture);
    // Opaque sector masks the aft and inboard faces of the colored lens.
    cylinder(0.017, 0.019, dark, [0, 0.003, 0], fixture, true, start + arc, Math.PI * 2 - arc);
    return fixture;
  }
  sideLamp(1, 0xff3931, 'Port red bow sidelight');
  sideLamp(-1, 0x35ea83, 'Starboard green bow sidelight');
  // A small all-round white lantern, visibly mounted above the mast fitting.
  cylinder(0.01, 0.022, bronze, [-0.1, 1.107, 0]);
  cylinder(0.019, 0.006, dark, [-0.1, 1.116, 0]);
  lens(0xfff4da, new THREE.CylinderGeometry(0.014, 0.014, 0.022, 16), [-0.1, 1.13, 0]);
  cylinder(0.018, 0.005, dark, [-0.1, 1.143, 0]);
  // Shielded work light on the back of the mast. Its beam stays behind the sails
  // (which billow toward +Z), landing on the aft part of the wooden deck.
  mesh(new THREE.BoxGeometry(0.031, 0.044, 0.032), dark, [-0.1, 0.72, -0.013]);
  mesh(new THREE.BoxGeometry(0.014, 0.014, 0.068), bronze, [-0.1, 0.72, -0.052]);
  const from = new THREE.Vector3(-0.1, 0.72, -0.091),
    to = new THREE.Vector3(0.22, 0.325, -0.075);
  const aim = to.clone().sub(from).normalize();
  const body = cylinder(0.022, 0.043, dark, from.toArray(), group, true);
  body.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), aim);
  const back = cylinder(0.022, 0.004, silver, from.clone().addScaledVector(aim, -0.021).toArray());
  back.quaternion.copy(body.quaternion);
  const glass = lens(
    0xfff5df,
    new THREE.CircleGeometry(0.016, 16),
    from.clone().addScaledVector(aim, 0.014).toArray(),
  );
  glass.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aim);
  const hood = cylinder(
    0.024,
    0.022,
    dark,
    from.clone().addScaledVector(aim, 0.019).toArray(),
    group,
    true,
  );
  hood.quaternion.copy(body.quaternion);
  const spot = new THREE.SpotLight(0xfff1d3, 0, 0.67, 0.17, 0.78, 2);
  spot.name = 'Shielded mast deck work light';
  spot.position.copy(from.clone().addScaledVector(aim, 0.029));
  spot.castShadow = false;
  const target = new THREE.Object3D();
  target.name = 'Deck work light target';
  target.position.copy(to);
  group.add(target);
  spot.target = target;
  group.add(spot);
  function setTheme(value) {
    if (disposed) return;
    const t = THREE.MathUtils.clamp(Number(value) || 0, 0, 1),
      night = t * t * (3 - 2 * t);
    lenses.forEach((m) => {
      m.emissiveIntensity = 0.1 + night * 1.65;
    });
    spot.intensity = 0.004 + night * 0.38;
  }
  setTheme(theme);
  return {
    group,
    setTheme,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      spot.dispose?.();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
