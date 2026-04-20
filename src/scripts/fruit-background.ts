import * as THREE from 'three';

function jitter(v: number, amount: number) {
  return v + (Math.random() - 0.5) * amount;
}

function createLeaf(color = 0x4d9b43) {
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.02 }),
  );
  leaf.scale.set(1.75, 0.2, 1.05);
  return leaf;
}

function createPineapple(): THREE.Group {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.86, 34, 30),
    new THREE.MeshStandardMaterial({ color: 0xf0b33d, roughness: 0.55, metalness: 0.04 }),
  );
  body.scale.set(0.88, 1.24, 0.88);
  g.add(body);

  const scaleGeo = new THREE.ConeGeometry(0.052, 0.2, 4);
  const scaleMat = new THREE.MeshStandardMaterial({ color: 0x946021, roughness: 0.83 });
  for (let y = -0.82; y <= 0.82; y += 0.13) {
    const ring = 18;
    const radius = 0.74 - Math.abs(y) * 0.22;
    for (let i = 0; i < ring; i += 1) {
      const a = (i / ring) * Math.PI * 2 + ((Math.round(y * 40) % 2) * Math.PI) / ring;
      const s = new THREE.Mesh(scaleGeo, scaleMat);
      s.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      s.lookAt(0, y, 0);
      s.rotateX(Math.PI / 2);
      g.add(s);
    }
  }

  const crownGeo = new THREE.ConeGeometry(0.12, 0.95, 7);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x4f9a2f, roughness: 0.72 });
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const leaf = new THREE.Mesh(crownGeo, crownMat);
    const r = i % 2 === 0 ? 0.16 : 0.24;
    leaf.position.set(Math.cos(a) * r, 1.08, Math.sin(a) * r);
    leaf.rotation.z = Math.PI + 0.12;
    leaf.rotation.x = 0.62;
    leaf.rotation.y = a;
    g.add(leaf);
  }

  const topStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: 0x795025, roughness: 0.85 }),
  );
  topStem.position.y = 1.05;
  g.add(topStem);
  return g;
}

function createBanana(): THREE.Group {
  const g = new THREE.Group();
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.25, -0.08, 0),
    new THREE.Vector3(-0.5, 0.38, 0.2),
    new THREE.Vector3(0.22, 0.62, 0.14),
    new THREE.Vector3(1.06, 0.36, -0.04),
  ]);
  const body = new THREE.Mesh(
    new THREE.TubeGeometry(path, 72, 0.16, 22, false),
    new THREE.MeshStandardMaterial({ color: 0xf6d44b, roughness: 0.47, metalness: 0.04 }),
  );
  body.rotation.set(0.22, 0.24, -0.32);
  g.add(body);

  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0xe8c13f, roughness: 0.5 });
  for (let i = -1; i <= 1; i += 1) {
    const ridge = new THREE.Mesh(
      new THREE.TubeGeometry(path, 52, 0.028, 8, false),
      ridgeMat,
    );
    ridge.rotation.set(0.22, 0.24 + i * 0.06, -0.32);
    ridge.position.z = i * 0.02;
    g.add(ridge);
  }

  const tipMat = new THREE.MeshStandardMaterial({ color: 0x5a3f18, roughness: 0.9 });
  const tipA = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 7), tipMat);
  tipA.position.set(-1.23, -0.12, -0.02);
  tipA.rotation.z = -1.3;
  g.add(tipA);
  const tipB = tipA.clone();
  tipB.position.set(1.05, 0.36, -0.05);
  tipB.rotation.z = 1.92;
  g.add(tipB);
  return g;
}

function createApple(): THREE.Group {
  const g = new THREE.Group();
  const appleGeo = new THREE.SphereGeometry(0.78, 36, 28);
  const p = appleGeo.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    const topIndent = y > 0.55 ? (y - 0.55) * 0.14 : 0;
    const sideBulge = (1 - Math.abs(y) * 0.75) * 0.06;
    const pinch = Math.max(0, 0.12 - r * 0.14);
    p.setXYZ(i, x * (1 + sideBulge - pinch), y * (0.95 - topIndent), z * (1 + sideBulge - pinch));
  }
  p.needsUpdate = true;
  appleGeo.computeVertexNormals();

  const apple = new THREE.Mesh(
    appleGeo,
    new THREE.MeshStandardMaterial({ color: 0xd93f35, roughness: 0.5, metalness: 0.06 }),
  );
  g.add(apple);

  const topDip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.17, 0.16, 16),
    new THREE.MeshStandardMaterial({ color: 0xac2c24, roughness: 0.68 }),
  );
  topDip.position.y = 0.71;
  g.add(topDip);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.04, 0.36, 12),
    new THREE.MeshStandardMaterial({ color: 0x6f4421, roughness: 0.8 }),
  );
  stem.position.y = 0.89;
  stem.rotation.z = 0.32;
  g.add(stem);

  const leaf = createLeaf(0x4ca148);
  leaf.position.set(0.2, 0.95, 0.03);
  leaf.rotation.y = -0.35;
  leaf.rotation.x = 0.12;
  g.add(leaf);
  return g;
}

function createTomato(): THREE.Group {
  const g = new THREE.Group();
  const tomatoGeo = new THREE.SphereGeometry(0.83, 36, 28);
  const p = tomatoGeo.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const theta = Math.atan2(z, x);
    const ribs = 1 + Math.cos(theta * 5) * 0.045;
    const squash = y > 0 ? 0.8 : 0.84;
    p.setXYZ(i, x * ribs, y * squash, z * ribs);
  }
  p.needsUpdate = true;
  tomatoGeo.computeVertexNormals();

  const body = new THREE.Mesh(
    tomatoGeo,
    new THREE.MeshStandardMaterial({ color: 0xce2e28, roughness: 0.4, metalness: 0.09 }),
  );
  g.add(body);

  const sepalMat = new THREE.MeshStandardMaterial({ color: 0x2f8f3c, roughness: 0.85 });
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), sepalMat);
    leaf.position.set(Math.cos(a) * 0.16, 0.69, Math.sin(a) * 0.16);
    leaf.rotation.x = -Math.PI * 0.82;
    leaf.rotation.y = a;
    g.add(leaf);
  }

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.045, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: 0x6f4a22, roughness: 0.84 }),
  );
  stem.position.y = 0.8;
  g.add(stem);
  return g;
}

function createGrapes(): THREE.Group {
  const g = new THREE.Group();
  const grapeMat = new THREE.MeshStandardMaterial({ color: 0x5b3ca8, roughness: 0.44, metalness: 0.11 });
  const geo = new THREE.SphereGeometry(0.2, 16, 14);
  const rows = [2, 3, 4, 5, 4, 3, 2];
  rows.forEach((count, row) => {
    for (let i = 0; i < count; i += 1) {
      const grape = new THREE.Mesh(geo, grapeMat);
      const spread = (count - 1) * 0.22;
      grape.position.set(
        i * 0.22 - spread / 2,
        0.72 - row * 0.2,
        (row % 2 === 0 ? 0.07 : -0.07) + jitter(0, 0.035),
      );
      g.add(grape);
    }
  });

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0x6e4a22, roughness: 0.85 }),
  );
  stem.position.y = 0.98;
  stem.rotation.z = 0.22;
  g.add(stem);

  const leaf = createLeaf(0x4c9842);
  leaf.position.set(0.24, 0.96, 0.08);
  leaf.rotation.set(0.5, -0.55, 0.18);
  g.add(leaf);
  return g;
}

export function initFruitBackground(canvas: HTMLCanvasElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  scene.add(new THREE.AmbientLight(0xffffff, 0.78));
  const key = new THREE.DirectionalLight(0xfff3e2, 0.95);
  key.position.set(4, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8ff3a, 0.32);
  rim.position.set(-6, -2, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9bc0ff, 0.2);
  fill.position.set(0, -3, 4);
  scene.add(fill);

  const fruits = [
    { mesh: createPineapple(), pos: new THREE.Vector3(-4.5, 1.92, -1.5), speed: 0.0014, bob: 0.14 },
    { mesh: createBanana(), pos: new THREE.Vector3(3.5, 2.16, -2.1), speed: 0.0017, bob: 0.18 },
    { mesh: createApple(), pos: new THREE.Vector3(-4.9, -2.05, -1.9), speed: 0.0016, bob: 0.12 },
    { mesh: createTomato(), pos: new THREE.Vector3(0.18, -2.32, -1.45), speed: 0.0015, bob: 0.1 },
    { mesh: createGrapes(), pos: new THREE.Vector3(4.45, -1.35, -2.15), speed: 0.0013, bob: 0.16 },
  ];

  fruits.forEach((f, i) => {
    f.mesh.position.copy(f.pos);
    f.mesh.rotation.set(0.08 * i, i * 0.75, -0.06 * i);
    scene.add(f.mesh);
  });

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let raf = 0;
  const tick = () => {
    if (!reduce.matches) {
      fruits.forEach((f, i) => {
        f.mesh.rotation.y += f.speed;
        f.mesh.rotation.x = Math.sin(performance.now() * 0.00024 + i * 1.4) * 0.11;
        f.mesh.position.y = f.pos.y + Math.sin(performance.now() * 0.00034 + i) * f.bob;
      });
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  const onVisibility = () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else tick();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    renderer.dispose();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
        else m.dispose();
      }
    });
  };
}
