/**
 * Hero 3D — SACRABOLLA.
 * Full-viewport immersive scene: low-poly wireframe chalice with orbiting
 * content nodes connected by acid lines, vertex particles, drip simulation,
 * and a scrolling grid corridor. Respects prefers-reduced-motion.
 */
import * as THREE from 'three';

type Profile = [number, number][];

const CHALICE_PROFILE: Profile = [
  [0.00, -1.30],
  [0.70, -1.30],
  [0.72, -1.27],
  [0.66, -1.22],
  [0.34, -1.14],
  [0.22, -1.06],
  [0.18, -0.96],
  [0.17, -0.88],
  [0.22, -0.83],
  [0.36, -0.76],
  [0.36, -0.62],
  [0.22, -0.55],
  [0.17, -0.48],
  [0.16, -0.40],
  [0.22, -0.35],
  [0.42, -0.28],
  [0.75, -0.12],
  [1.00, 0.12],
  [1.15, 0.35],
  [1.21, 0.52],
  [1.23, 0.58],
  [1.23, 0.62],
  [1.15, 0.62],
  [1.08, 0.55],
  [0.95, 0.35],
  [0.75, 0.05],
  [0.45, -0.20],
  [0.20, -0.28],
  [0.00, -0.28],
];

const BAND_YS = [0.62, 0.58, -0.69, -1.27];

const NODE_ORBITS = [
  { radius: 4.4, speed: 0.070, yOff: 0.9, phase: 0, yAmp: 0.20 },
  { radius: 4.9, speed: -0.055, yOff: -0.25, phase: Math.PI * 0.4, yAmp: 0.25 },
  { radius: 4.2, speed: 0.085, yOff: 0.15, phase: Math.PI * 0.8, yAmp: 0.15 },
  { radius: 4.7, speed: -0.062, yOff: -0.75, phase: Math.PI * 1.2, yAmp: 0.22 },
  { radius: 4.5, speed: 0.078, yOff: 0.65, phase: Math.PI * 1.6, yAmp: 0.18 },
];

function buildChaliceGeometry(): THREE.LatheGeometry {
  const points = CHALICE_PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(points, 12);
}

export function initHero(canvas: HTMLCanvasElement, nodeLabels?: HTMLElement[]) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();

  const BASE_FOV = 50;
  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7.5);

  // Chalice body — wireframe bone
  const chaliceGeom = buildChaliceGeometry();
  const chaliceMat = new THREE.MeshBasicMaterial({
    color: 0xefebe2,
    wireframe: true,
    transparent: true,
    opacity: 0.52,
    side: THREE.DoubleSide,
  });
  const chalice = new THREE.Mesh(chaliceGeom, chaliceMat);
  chalice.scale.set(0.78, 0.86, 0.78);
  chalice.position.y = -0.80;
  scene.add(chalice);

  // Vertex particles — chartreuse dots on wireframe vertices
  const positions = chaliceGeom.attributes.position;
  const particleCount = Math.min(positions.count, 420);
  const stride = Math.max(1, Math.floor(positions.count / particleCount));
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const idx = i * stride;
    particlePositions[i * 3] = positions.getX(idx);
    particlePositions[i * 3 + 1] = positions.getY(idx);
    particlePositions[i * 3 + 2] = positions.getZ(idx);
  }
  const particleGeom = new THREE.BufferGeometry();
  particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xd8ff3a,
    size: 0.028,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeom, particleMat);
  chalice.add(particles);

  // Polygon glitch system
  const chaliceOrig = new Float32Array((positions.array as Float32Array).length);
  chaliceOrig.set(positions.array as Float32Array);
  const particlesOrig = new Float32Array(particlePositions.length);
  particlesOrig.set(particlePositions);

  type GlitchKind = 'off' | 'jitter' | 'shear';
  let glitchKind: GlitchKind = 'off';
  let glitchUntil = 0;
  let glitchShearY = 0;
  let glitchShearBand = 0;
  let glitchShearDx = 0;
  let nextGlitchAt = performance.now() + 2500 + Math.random() * 4000;

  function scheduleNextGlitch(now: number) {
    nextGlitchAt = now + 2800 + Math.random() * 5500;
  }

  function startGlitch(now: number) {
    if (Math.random() < 0.78) {
      glitchKind = 'jitter';
      glitchUntil = now + 120 + Math.random() * 240;
    } else {
      glitchKind = 'shear';
      glitchUntil = now + 60 + Math.random() * 160;
      glitchShearY = -1.3 + Math.random() * 1.9;
      glitchShearBand = 0.12 + Math.random() * 0.18;
      glitchShearDx = (Math.random() - 0.5) * 0.35;
    }
  }

  function restoreGeometry() {
    (positions.array as Float32Array).set(chaliceOrig);
    particlePositions.set(particlesOrig);
    positions.needsUpdate = true;
    particleGeom.attributes.position.needsUpdate = true;
  }

  function applyGlitch(now: number) {
    if (glitchKind === 'off') return;
    if (now >= glitchUntil) {
      restoreGeometry();
      glitchKind = 'off';
      return;
    }
    const arr = positions.array as Float32Array;
    const pArr = particlePositions;
    if (glitchKind === 'jitter') {
      const amp = 0.045;
      for (let i = 0; i < arr.length; i++) {
        arr[i] = chaliceOrig[i] + (Math.random() - 0.5) * amp;
      }
      for (let i = 0; i < pArr.length; i++) {
        pArr[i] = particlesOrig[i] + (Math.random() - 0.5) * amp;
      }
    } else if (glitchKind === 'shear') {
      for (let i = 0; i < arr.length; i += 3) {
        const inBand = Math.abs(chaliceOrig[i + 1] - glitchShearY) < glitchShearBand;
        arr[i] = chaliceOrig[i] + (inBand ? glitchShearDx : 0);
        arr[i + 1] = chaliceOrig[i + 1];
        arr[i + 2] = chaliceOrig[i + 2];
      }
      for (let i = 0; i < pArr.length; i += 3) {
        const inBand = Math.abs(particlesOrig[i + 1] - glitchShearY) < glitchShearBand;
        pArr[i] = particlesOrig[i] + (inBand ? glitchShearDx : 0);
        pArr[i + 1] = particlesOrig[i + 1];
        pArr[i + 2] = particlesOrig[i + 2];
      }
    }
    positions.needsUpdate = true;
    particleGeom.attributes.position.needsUpdate = true;
  }

  // Accent band rings
  const bandMat = new THREE.LineBasicMaterial({
    color: 0xd8ff3a,
    transparent: true,
    opacity: 0.55,
  });
  const bands: THREE.LineLoop[] = [];
  for (const y of BAND_YS) {
    const x = profileXAtY(CHALICE_PROFILE, y) ?? 0;
    if (x <= 0.01) continue;
    const circle = new THREE.BufferGeometry();
    const n = 48;
    const pts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts[i * 3] = Math.cos(a) * x;
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = Math.sin(a) * x;
    }
    circle.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const loop = new THREE.LineLoop(circle, bandMat);
    chalice.add(loop);
    bands.push(loop);
  }

  // Interior liquid surface
  const liquidGeom = new THREE.CircleGeometry(1.06, 48);
  const liquidMat = new THREE.MeshBasicMaterial({
    color: 0xd8ff3a,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 0.55;
  chalice.add(liquid);

  // Drip particles
  const DRIP_COUNT = 14;
  const dripPositions = new Float32Array(DRIP_COUNT * 3);
  const dripVelocities = new Float32Array(DRIP_COUNT);
  const dripAges = new Float32Array(DRIP_COUNT);
  const dripLifes = new Float32Array(DRIP_COUNT);
  const dripAngles = new Float32Array(DRIP_COUNT);
  const RIM_RADIUS = 1.22;
  const RIM_Y = 0.60;

  function seedDrip(i: number, initial = false) {
    const a = Math.random() * Math.PI * 2;
    dripAngles[i] = a;
    dripPositions[i * 3] = Math.cos(a) * RIM_RADIUS;
    dripPositions[i * 3 + 1] = initial ? RIM_Y - Math.random() * 1.8 : RIM_Y;
    dripPositions[i * 3 + 2] = Math.sin(a) * RIM_RADIUS;
    dripVelocities[i] = 0;
    dripAges[i] = initial ? Math.random() * 2 : 0;
    dripLifes[i] = 2.2 + Math.random() * 1.2;
  }
  for (let i = 0; i < DRIP_COUNT; i++) seedDrip(i, true);

  const dripGeom = new THREE.BufferGeometry();
  dripGeom.setAttribute('position', new THREE.BufferAttribute(dripPositions, 3));
  const dripMat = new THREE.PointsMaterial({
    color: 0xd8ff3a,
    size: 0.055,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const drips = new THREE.Points(dripGeom, dripMat);
  chalice.add(drips);

  // Halo ring
  const ringGeom = new THREE.RingGeometry(1.55, 1.57, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xd8ff3a,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.set(0, -0.55, -1);
  scene.add(ring);

  // Grid corridor
  const gridUniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xd8ff3a) },
    uFade: { value: 0.22 },
    uScroll: { value: 0.8 },
  };
  const gridMat = new THREE.ShaderMaterial({
    uniforms: gridUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uFade;
      uniform float uScroll;

      void main() {
        vec2 coord = vWorldPos.xz;
        coord.y += uTime * uScroll;
        vec2 g = abs(fract(coord) - 0.5);
        float d = min(g.x, g.y);
        float line = 1.0 - smoothstep(0.0, 0.035, d);
        float dist = length(vWorldPos.xz);
        float distFade = 1.0 - smoothstep(8.0, 34.0, dist);
        float nearFade = smoothstep(0.5, 4.0, dist);
        float alpha = line * distFade * nearFade * uFade;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const floorGeom = new THREE.PlaneGeometry(80, 120);
  const floor = new THREE.Mesh(floorGeom, gridMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.2;
  scene.add(floor);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  // Orbiting content nodes
  const nodeCount = nodeLabels ? Math.min(nodeLabels.length, NODE_ORBITS.length) : 0;
  const nodeMeshes: THREE.Mesh[] = [];
  const nodeMats: THREE.MeshBasicMaterial[] = [];
  const nodeLines: THREE.Line[] = [];
  const chaliceWorldCenter = new THREE.Vector3(0, -0.45, 0);

  const nodeLineMats: THREE.LineBasicMaterial[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const geom = new THREE.OctahedronGeometry(0.13, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xd8ff3a,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);
    nodeMeshes.push(mesh);
    nodeMats.push(mat);

    const dotGeom = new THREE.BufferGeometry();
    dotGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0xd8ff3a,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
    });
    mesh.add(new THREE.Points(dotGeom, dotMat));

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xd8ff3a,
      transparent: true,
      opacity: 0.18,
    });
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(lineGeom, lineMat);
    scene.add(line);
    nodeLines.push(line);
    nodeLineMats.push(lineMat);
  }

  const projVec = new THREE.Vector3();
  let mouseX = 0;
  let mouseY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let mouseClientX = -1e4;
  let mouseClientY = -1e4;
  function onMove(e: PointerEvent) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    mouseClientX = e.clientX;
    mouseClientY = e.clientY;
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', () => {
    mouseClientX = -1e4;
    mouseClientY = -1e4;
  });

  let converge = 0;
  const PENT_RADIUS = 1.55;
  const PENT_PHASE = -Math.PI / 2;
  const ringWorldRadius = 1.55;
  const ringEdgeVec = new THREE.Vector3();
  const chalProjVec = new THREE.Vector3();

  let raf = 0;
  let t = 0;
  let elapsed = 0;
  const ROT_SPEED = 0.0035;
  const GRAVITY = 0.6;
  let lastTime = performance.now();

  function tick(now?: number) {
    t += 1;
    const current = now ?? performance.now();
    const dt = Math.min(0.05, (current - lastTime) / 1000);
    lastTime = current;
    elapsed += dt;

    if (!reduce.matches) {
      chalice.rotation.y += ROT_SPEED;
      chalice.rotation.x = Math.sin(t * 0.005) * 0.06 - mouseY * 0.05;
      chalice.rotation.z = mouseX * 0.04;

      camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.025;
      camera.position.y += (-mouseY * 0.2 + 0.15 - camera.position.y) * 0.025;
      camera.lookAt(0, 0.2, 0);

      particleMat.opacity = 0.4 + 0.35 * Math.sin(t * 0.02);
      liquidMat.opacity = 0.55 + 0.15 * Math.sin(t * 0.015);

      // Drip simulation
      const dPos = dripGeom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DRIP_COUNT; i++) {
        dripAges[i] += dt;
        dripVelocities[i] += GRAVITY * dt;
        const newY = dPos.getY(i) - dripVelocities[i] * dt;
        dPos.setY(i, newY);
        if (newY < -1.6 || dripAges[i] > dripLifes[i]) {
          seedDrip(i, false);
          dPos.setXYZ(i, dripPositions[i * 3], dripPositions[i * 3 + 1], dripPositions[i * 3 + 2]);
        }
      }
      dPos.needsUpdate = true;

      if (glitchKind === 'off' && current >= nextGlitchAt) {
        startGlitch(current);
        scheduleNextGlitch(current);
      }
      applyGlitch(current);

      gridUniforms.uTime.value += dt;

      // Update orbiting nodes
      const rScale = camera.aspect < 1 ? 0.55 : camera.aspect < 1.4 ? 0.75 : 1.0;

      // Convergence: when the pointer is inside the halo ring, nodes pull into
      // a pentagon around the chalice. Outside, they resume free orbit.
      const rect = canvas.getBoundingClientRect();
      chalProjVec.copy(chaliceWorldCenter).project(camera);
      const chalSX = (chalProjVec.x * 0.5 + 0.5) * rect.width + rect.left;
      const chalSY = (-chalProjVec.y * 0.5 + 0.5) * rect.height + rect.top;
      ringEdgeVec
        .set(chaliceWorldCenter.x + ringWorldRadius, chaliceWorldCenter.y, chaliceWorldCenter.z)
        .project(camera);
      const ringSX = (ringEdgeVec.x * 0.5 + 0.5) * rect.width + rect.left;
      const ringRadiusPx = Math.max(60, Math.abs(ringSX - chalSX));
      const mdx = mouseClientX - chalSX;
      const mdy = mouseClientY - chalSY;
      const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
      const convergeTarget = mouseDist < ringRadiusPx ? 1 : 0;
      converge += (convergeTarget - converge) * Math.min(1, dt * 4);

      for (let i = 0; i < nodeCount; i++) {
        const o = NODE_ORBITS[i];
        const angle = o.phase + elapsed * o.speed;
        const r = o.radius * rScale;
        const orbitX = Math.cos(angle) * r;
        const orbitZ = Math.sin(angle) * r;
        const orbitY = o.yOff + Math.sin(elapsed * 0.15 + o.phase * 2) * o.yAmp;

        const pentAngle = PENT_PHASE + (i / nodeCount) * Math.PI * 2;
        const pentX = chaliceWorldCenter.x + Math.cos(pentAngle) * PENT_RADIUS;
        const pentY = chaliceWorldCenter.y + Math.sin(pentAngle) * PENT_RADIUS;
        const pentZ = chaliceWorldCenter.z;

        const nx = orbitX + (pentX - orbitX) * converge;
        const ny = orbitY + (pentY - orbitY) * converge;
        const nz = orbitZ + (pentZ - orbitZ) * converge;

        nodeMeshes[i].position.set(nx, ny, nz);
        nodeMeshes[i].rotation.y += 0.012;
        nodeMeshes[i].rotation.x += 0.007;

        projVec.set(nx, ny, nz);
        projVec.project(camera);
        // Logo avoidance: fade nodes crossing the central logo zone (NDC ellipse).
        const dx = projVec.x / 0.42;
        const dy = projVec.y / 0.16;
        const rNorm = Math.sqrt(dx * dx + dy * dy);
        const avoid = Math.min(1, Math.max(0, (rNorm - 0.85) / 0.35));
        const pulse = 0.5 + 0.3 * Math.sin(elapsed * 1.2 + i * 1.3);
        nodeMats[i].opacity = pulse * avoid;
        nodeLineMats[i].opacity = 0.18 * avoid;

        const lp = nodeLines[i].geometry.attributes.position as THREE.BufferAttribute;
        lp.setXYZ(0, chaliceWorldCenter.x, chaliceWorldCenter.y, chaliceWorldCenter.z);
        lp.setXYZ(1, nx, ny, nz);
        lp.needsUpdate = true;

        if (nodeLabels && nodeLabels[i]) {
          const rect = canvas.getBoundingClientRect();
          const sx = (projVec.x * 0.5 + 0.5) * rect.width;
          const sy = (-projVec.y * 0.5 + 0.5) * rect.height;
          nodeLabels[i].style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
          nodeLabels[i].style.opacity = String(avoid);
          if (!nodeLabels[i].classList.contains('is-positioned')) {
            nodeLabels[i].classList.add('is-positioned');
          }
        }
      }
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      lastTime = performance.now();
      tick();
    }
  });

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    renderer.dispose();
    chaliceGeom.dispose();
    chaliceMat.dispose();
    particleGeom.dispose();
    particleMat.dispose();
    for (const b of bands) b.geometry.dispose();
    bandMat.dispose();
    liquidGeom.dispose();
    liquidMat.dispose();
    dripGeom.dispose();
    dripMat.dispose();
    ringGeom.dispose();
    ringMat.dispose();
    floorGeom.dispose();
    gridMat.dispose();
    for (const m of nodeMeshes) {
      m.geometry.dispose();
      (m.material as THREE.MeshBasicMaterial).dispose();
    }
    for (const l of nodeLines) l.geometry.dispose();
    nodeLineMat.dispose();
  };
}

function profileXAtY(profile: Profile, y: number): number | null {
  let ascending = true;
  let lastY = profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [x0, y0] = profile[i - 1];
    const [x1, y1] = profile[i];
    if (ascending && y1 < lastY) {
      ascending = false;
      break;
    }
    lastY = y1;
    if ((y0 <= y && y <= y1) || (y1 <= y && y <= y0)) {
      const dy = y1 - y0;
      if (Math.abs(dy) < 1e-6) return x0;
      const t = (y - y0) / dy;
      return x0 + (x1 - x0) * t;
    }
  }
  return null;
}
