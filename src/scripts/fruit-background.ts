import * as THREE from 'three';

function createPineapple(): THREE.Group {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 20, 18),
    new THREE.MeshStandardMaterial({ color: 0xf2b134, roughness: 0.55, metalness: 0.05 }),
  );
  body.scale.set(0.9, 1.2, 0.9);
  g.add(body);

  const spikeGeo = new THREE.ConeGeometry(0.08, 0.22, 5);
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x9f6a1a, roughness: 0.8 });
  for (let y = -0.72; y <= 0.72; y += 0.2) {
    const ring = 9;
    const radius = 0.66 - Math.abs(y) * 0.2;
    for (let i = 0; i < ring; i += 1) {
      const a = (i / ring) * Math.PI * 2 + (Math.floor((y + 1) * 10) % 2) * 0.35;
      const s = new THREE.Mesh(spikeGeo, spikeMat);
      s.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      s.lookAt(0, y, 0);
      s.rotateX(Math.PI / 2);
      g.add(s);
    }
  }

  const leafGeo = new THREE.ConeGeometry(0.14, 0.7, 6);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f9a2f, roughness: 0.75 });
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(a) * 0.18, 1.0, Math.sin(a) * 0.18);
    leaf.rotation.z = Math.PI;
    leaf.rotation.x = 0.55;
    leaf.rotation.y = a;
    g.add(leaf);
  }
  return g;
}

function createBanana(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.16, 12, 50, Math.PI * 1.15),
    new THREE.MeshStandardMaterial({ color: 0xf2d449, roughness: 0.45, metalness: 0.05 }),
  );
  body.rotation.set(Math.PI / 2.8, Math.PI / 10, 0);
  body.scale.set(1.12, 1, 0.75);
  g.add(body);

  const tipMat = new THREE.MeshStandardMaterial({ color: 0x513813, roughness: 0.85 });
  const tip1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), tipMat);
  tip1.position.set(-0.88, -0.14, -0.25);
  g.add(tip1);
  const tip2 = tip1.clone();
  tip2.position.set(0.82, 0.34, 0.24);
  g.add(tip2);
  return g;
}

function createApple(): THREE.Group {
  const g = new THREE.Group();
  const apple = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 24, 20),
    new THREE.MeshStandardMaterial({ color: 0xd93f35, roughness: 0.5, metalness: 0.06 }),
  );
  apple.scale.set(1, 0.95, 1);
  g.add(apple);

  const topDip = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xaa2c24, roughness: 0.65 }),
  );
  topDip.position.y = 0.67;
  topDip.scale.y = 0.4;
  g.add(topDip);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0x6f4421, roughness: 0.8 }),
  );
  stem.position.y = 0.88;
  stem.rotation.z = 0.35;
  g.add(stem);

  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x4da34c, roughness: 0.8 }),
  );
  leaf.scale.set(1.5, 0.3, 0.9);
  leaf.position.set(0.2, 0.95, 0.03);
  leaf.rotation.y = -0.35;
  g.add(leaf);
  return g;
}

function createTomato(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 24, 20),
    new THREE.MeshStandardMaterial({ color: 0xc82826, roughness: 0.42, metalness: 0.08 }),
  );
  body.scale.y = 0.82;
  g.add(body);

  const sepalMat = new THREE.MeshStandardMaterial({ color: 0x2f8f3c, roughness: 0.85 });
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 5), sepalMat);
    leaf.position.set(Math.cos(a) * 0.2, 0.68, Math.sin(a) * 0.2);
    leaf.rotation.x = -Math.PI * 0.85;
    leaf.rotation.y = a;
    g.add(leaf);
  }
  return g;
}

function createGrapes(): THREE.Group {
  const g = new THREE.Group();
  const grapeMat = new THREE.MeshStandardMaterial({ color: 0x5d3faa, roughness: 0.45, metalness: 0.1 });
  const geo = new THREE.SphereGeometry(0.22, 12, 12);
  const rows = [1, 2, 3, 4, 3, 2];
  rows.forEach((count, row) => {
    for (let i = 0; i < count; i += 1) {
      const grape = new THREE.Mesh(geo, grapeMat);
      const spread = (count - 1) * 0.24;
      grape.position.set(i * 0.24 - spread / 2, 0.65 - row * 0.24, (row % 2 === 0 ? 0.08 : -0.08));
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

  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const key = new THREE.DirectionalLight(0xfff3e2, 0.95);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8ff3a, 0.32);
  rim.position.set(-5, -2, -3);
  scene.add(rim);

  const fruits = [
    { mesh: createPineapple(), pos: new THREE.Vector3(-4.3, 1.95, -1.8), speed: 0.0022 },
    { mesh: createBanana(), pos: new THREE.Vector3(3.75, 2.1, -2.5), speed: 0.0018 },
    { mesh: createApple(), pos: new THREE.Vector3(-4.8, -2.1, -2.2), speed: 0.0025 },
    { mesh: createTomato(), pos: new THREE.Vector3(0.2, -2.35, -1.7), speed: 0.0021 },
    { mesh: createGrapes(), pos: new THREE.Vector3(4.5, -1.45, -2.4), speed: 0.0019 },
  ];

  fruits.forEach((f, i) => {
    f.mesh.position.copy(f.pos);
    f.mesh.rotation.y = i * 0.7;
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
        f.mesh.rotation.x = Math.sin(performance.now() * 0.0003 + i) * 0.08;
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
