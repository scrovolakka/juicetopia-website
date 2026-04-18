/**
 * Hero 3D — SACRABOLLA.
 * Low-poly wireframe chalice on a lathe, with acid vertex dots, an interior
 * liquid surface (ink red), and a loop of drip particles escaping the rim.
 * Rotates on Y with a slight X wobble and mild mouse parallax.
 * Respects prefers-reduced-motion.
 */
import * as THREE from 'three';

type Profile = [number, number][];

/**
 * Half-section profile of the chalice, traced from the bottom pole of the foot,
 * up and around to the top of the rim, down the interior wall, and back to the
 * interior-bottom pole. LatheGeometry revolves this around the Y axis.
 *
 * Measurements are in world units — the whole mesh is scaled to fit.
 */
const CHALICE_PROFILE: Profile = [
  // Foot — compact pedestal. Diameter is now clearly smaller than the bowl so
  // the silhouette reads as "chalice on a stem" rather than a funnel.
  [0.00, -1.30],
  [0.70, -1.30],
  [0.72, -1.27],
  [0.66, -1.22],
  [0.34, -1.14],
  [0.22, -1.06],
  // Stem joint — fluted region
  [0.18, -0.96],
  [0.17, -0.88],
  // Knop — bulbous node
  [0.22, -0.83],
  [0.36, -0.76],
  [0.36, -0.62],
  [0.22, -0.55],
  [0.17, -0.48],
  // Upper shaft — thin neck below bowl
  [0.16, -0.40],
  // Bowl — rounded / hemispheric, not conic. Tight base, rapid curve outward,
  // upper wall nearly vertical into the rim.
  [0.22, -0.35],
  [0.42, -0.28],
  [0.75, -0.12],
  [1.00, 0.12],
  [1.15, 0.35],
  [1.21, 0.52],
  // Rim — outer lip
  [1.23, 0.58],
  [1.23, 0.62],
  [1.15, 0.62],
  // Interior wall — descend mirroring the bowl's curve back to the axis. Inner
  // bottom sits slightly above exterior bottom to imply wall thickness.
  [1.08, 0.55],
  [0.95, 0.35],
  [0.75, 0.05],
  [0.45, -0.20],
  [0.20, -0.28],
  [0.00, -0.28],
];

// Ring loops at key y-values give the wireframe visible "bands" at the rim,
// the knop equator, and the foot edge.
const BAND_YS = [0.62, 0.58, -0.69, -1.27];

function buildChaliceGeometry(): THREE.LatheGeometry {
  const points = CHALICE_PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
  const segments = 12; // low-poly, matches the torus knot's density
  return new THREE.LatheGeometry(points, segments);
}

export function initHero(canvas: HTMLCanvasElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();

  const BASE_FOV = 45;
  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 100);
  camera.position.set(0, 0.05, 6);

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
  // Non-uniform scale: slightly taller than wide, and overall larger so the
  // chalice dominates the frame. Lifted on Y so its mass centers vertically
  // (the profile is bottom-heavy without this shift).
  chalice.scale.set(1.18, 1.32, 1.18);
  chalice.position.y = 0.44;
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

  // ------------------------------------------------------------------------
  // Polygon glitch — snapshot the pristine vertex positions so we can perturb
  // them briefly and restore. Two flavours of glitch are scheduled randomly:
  //   · 'jitter' — every vertex displaced by small noise for ~200ms (signal
  //     static on the surface)
  //   · 'shear'  — a horizontal band of vertices slides in X for a few frames
  //     (scanline tear / tape dropout)
  // Both are disabled under prefers-reduced-motion.
  // ------------------------------------------------------------------------
  const chaliceOrig = new Float32Array(
    (positions.array as Float32Array).length,
  );
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
    // 3–8 s between events on average, slightly skewed short on occasion.
    const gap = 2800 + Math.random() * 5500;
    nextGlitchAt = now + gap;
  }

  function startGlitch(now: number) {
    const roll = Math.random();
    if (roll < 0.78) {
      glitchKind = 'jitter';
      glitchUntil = now + 120 + Math.random() * 240;
    } else {
      glitchKind = 'shear';
      glitchUntil = now + 60 + Math.random() * 160;
      // Pick a random y band relative to the profile's height range.
      glitchShearY = -1.3 + Math.random() * 1.9;
      glitchShearBand = 0.12 + Math.random() * 0.18;
      glitchShearDx = (Math.random() - 0.5) * 0.35;
    }
  }

  function restoreGeometry() {
    const arr = positions.array as Float32Array;
    arr.set(chaliceOrig);
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
      // Only X is displaced for vertices within the band; everything else
      // stays on the original position.
      for (let i = 0; i < arr.length; i += 3) {
        const y = chaliceOrig[i + 1];
        const inBand = Math.abs(y - glitchShearY) < glitchShearBand;
        arr[i] = chaliceOrig[i] + (inBand ? glitchShearDx : 0);
        arr[i + 1] = chaliceOrig[i + 1];
        arr[i + 2] = chaliceOrig[i + 2];
      }
      for (let i = 0; i < pArr.length; i += 3) {
        const y = particlesOrig[i + 1];
        const inBand = Math.abs(y - glitchShearY) < glitchShearBand;
        pArr[i] = particlesOrig[i] + (inBand ? glitchShearDx : 0);
        pArr[i + 1] = particlesOrig[i + 1];
        pArr[i + 2] = particlesOrig[i + 2];
      }
    }
    positions.needsUpdate = true;
    particleGeom.attributes.position.needsUpdate = true;
  }

  // Accent band rings — extra circles at the rim / knop equator / foot edge.
  // Implemented as thin LineLoop geometries so they sit exactly on the lathe
  // surface and rotate with the chalice.
  const bandMat = new THREE.LineBasicMaterial({
    color: 0xd8ff3a,
    transparent: true,
    opacity: 0.55,
  });
  const bands: THREE.LineLoop[] = [];
  for (const y of BAND_YS) {
    // Find the x at this y by walking the profile.
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

  // Interior liquid surface — acid disc at the inner rim level.
  // Very thin disc slightly below the rim, rendered double-sided so it reads
  // from above and through the wireframe from the side.
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
  liquid.position.y = 0.55; // just beneath the rim top, inside the inner wall
  chalice.add(liquid);

  // Drip particles — a fixed pool of descending acid points spawned at the rim.
  // Each one falls under gravity, fades out, then respawns at the rim edge.
  const DRIP_COUNT = 14;
  const dripPositions = new Float32Array(DRIP_COUNT * 3);
  const dripVelocities = new Float32Array(DRIP_COUNT); // y velocity only; x,z static
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
  // Drips live in chalice space so they rotate with it — feels physical.
  chalice.add(drips);

  // Acid halo ring behind — sized to sit just outside the enlarged chalice
  // and lifted to match the chalice's vertical center.
  const ringGeom = new THREE.RingGeometry(2.55, 2.58, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xd8ff3a,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.set(0, 0.22, -1);
  scene.add(ring);

  // ------------------------------------------------------------------------
  // Grid corridor — vaporwave/retro-3D background. Two large planes (floor +
  // ceiling) rendered with a shader that draws a moving grid, giving the
  // sensation that the viewer is sliding forward through a tunnel while the
  // chalice hangs suspended in the foreground.
  // ------------------------------------------------------------------------
  const gridUniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xd8ff3a) },
    uFade: { value: 0.55 },
    uScroll: { value: 2.2 }, // world units per second the grid appears to travel
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
        // Align grid to world XZ so the floor and ceiling share ruling.
        vec2 coord = vWorldPos.xz;
        // Scroll the Z axis forward — lines appear to move toward the camera.
        coord.y += uTime * uScroll;
        // Distance to nearest grid line in each axis.
        vec2 g = abs(fract(coord) - 0.5);
        float d = min(g.x, g.y);
        // Anti-aliased line.
        float line = 1.0 - smoothstep(0.0, 0.035, d);
        // Distance fade — near the viewer it's sharp, near horizon it dies.
        float dist = length(vWorldPos.xz);
        float distFade = 1.0 - smoothstep(8.0, 34.0, dist);
        // Softly kill very close to the camera too so the grid feels like it's
        // sliding out from under the chalice rather than crowding the frame.
        float nearFade = smoothstep(0.5, 4.0, dist);
        float alpha = line * distFade * nearFade * uFade;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Floor — below the chalice, extending deep into the scene.
  const floorGeom = new THREE.PlaneGeometry(80, 120);
  const floor = new THREE.Mesh(floorGeom, gridMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.2;
  scene.add(floor);

  // Ceiling — mirrored above.
  const ceilingGeom = new THREE.PlaneGeometry(80, 120);
  const ceiling = new THREE.Mesh(ceilingGeom, gridMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.4;
  scene.add(ceiling);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;

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

  function onMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }
  window.addEventListener('pointermove', onMove, { passive: true });

  function onScroll() {
    scrollY = window.scrollY;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  let raf = 0;
  let t = 0;
  const ROT_SPEED = 0.0035;
  const GRAVITY = 0.6;
  let lastTime = performance.now();

  function tick(now?: number) {
    t += 1;
    const current = now ?? performance.now();
    const dt = Math.min(0.05, (current - lastTime) / 1000);
    lastTime = current;

    if (!reduce.matches) {
      // Y-axis rotation — the natural axis for a cup on display.
      chalice.rotation.y += ROT_SPEED;
      // Subtle X wobble and mouse-driven Z lean, no continuous X spin.
      chalice.rotation.x = Math.sin(t * 0.005) * 0.06 - mouseY * 0.05;
      chalice.rotation.z = mouseX * 0.04;

      camera.position.x += (mouseX * 0.18 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 0.1 + 0.05 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      const fovOffset = Math.min(scrollY * 0.008, 4);
      camera.fov = BASE_FOV + fovOffset;
      camera.updateProjectionMatrix();

      // Particle twinkle on the vertex dots
      particleMat.opacity = 0.4 + 0.35 * Math.sin(t * 0.02);

      // Liquid subtle pulse on opacity (as if the surface catches light)
      liquidMat.opacity = 0.55 + 0.15 * Math.sin(t * 0.015);

      // Drip simulation — advance each point, respawn when it falls off / dies.
      const pos = dripGeom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DRIP_COUNT; i++) {
        dripAges[i] += dt;
        dripVelocities[i] += GRAVITY * dt;
        const newY = pos.getY(i) - dripVelocities[i] * dt;
        pos.setY(i, newY);
        if (newY < -1.6 || dripAges[i] > dripLifes[i]) {
          seedDrip(i, false);
          pos.setXYZ(
            i,
            dripPositions[i * 3],
            dripPositions[i * 3 + 1],
            dripPositions[i * 3 + 2],
          );
        }
      }
      pos.needsUpdate = true;

      // Polygon glitch — start one on schedule, apply/restore every frame
      // until its TTL expires.
      if (glitchKind === 'off' && current >= nextGlitchAt) {
        startGlitch(current);
        scheduleNextGlitch(current);
      }
      applyGlitch(current);

      // Scroll the grid corridor forward.
      gridUniforms.uTime.value += dt;
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
    window.removeEventListener('scroll', onScroll);
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
    ceilingGeom.dispose();
    gridMat.dispose();
  };
}

/**
 * Walk the profile and return the outer-wall x coordinate at the given y, if
 * y lies within a segment. Used to place accent band rings on the surface.
 * Scans from the first vertex to the rim (rising-y portion of the profile)
 * so we get the outer wall, not the interior return.
 */
function profileXAtY(profile: Profile, y: number): number | null {
  let ascending = true;
  let lastY = profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [x0, y0] = profile[i - 1];
    const [x1, y1] = profile[i];
    if (ascending && y1 < lastY) {
      // We crossed the rim — stop considering further segments (interior wall).
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
