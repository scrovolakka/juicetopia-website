/**
 * Geometric backdrop — a low-poly wireframe mathematical shape slowly drifting
 * behind the content of each route index page. The canvas is a fixed,
 * full-viewport element with `z-index: 0`; content stacks above via
 * `.page { z-index: 1 }`.
 *
 * Five mathematical shapes map to the five content routes:
 *   - torus knot (trefoil)  → /novel/
 *   - Möbius strip          → /characters/
 *   - icosahedron (nested)  → /mondo/
 *   - octahedron cluster    → /lexicon/
 *   - torus (double ring)   → /gallery/
 *
 * Motion: slow Y rotation + gentle X wobble + scroll-driven Y drift for a
 * parallax float. Disabled under prefers-reduced-motion.
 */
import * as THREE from 'three';

export type FruitName = 'pineapple' | 'banana' | 'apple' | 'grape' | 'tomato' | 'dodecahedron' | 'stella' | 'hypercube';

function wireMaterial(
  mode: 'bone' | 'void',
  returning: boolean,
): THREE.MeshBasicMaterial {
  const color = returning
    ? 0xd8ff3a
    : mode === 'void'
      ? 0xefebe2
      : 0x0f0e0c;
  return new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: returning ? 0.45 : mode === 'void' ? 0.32 : 0.22,
    side: THREE.DoubleSide,
  });
}

// Trefoil torus knot — three-lobed knot, mathematically beautiful
function buildPineapple(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.9, 0.28, 80, 8, 2, 3), mat);
  g.add(knot);
  return g;
}

// Möbius strip — parametric surface with a single side
function buildBanana(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const SEGMENTS = 80;
  const STRIP_W = 0.4;
  const R = 1.1;
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const u = (i / SEGMENTS) * Math.PI * 2;
    for (let j = 0; j <= 1; j++) {
      const v = (j - 0.5) * STRIP_W;
      const x = (R + v * Math.cos(u / 2)) * Math.cos(u);
      const y = (R + v * Math.cos(u / 2)) * Math.sin(u);
      const z = v * Math.sin(u / 2);
      vertices.push(x, y, z);
    }
  }
  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, b, c, b, d, c);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  const mesh = new THREE.Mesh(geom, mat);
  g.add(mesh);
  return g;
}

// Nested icosahedra — two concentric icosahedra at different scales
function buildApple(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 0), mat);
  g.add(outer);
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), mat);
  inner.rotation.set(0.3, 0.5, 0.2);
  g.add(inner);
  return g;
}

// Octahedron cluster — 4 interlocking octahedra at rotated orientations
function buildGrape(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const rotations: [number, number, number][] = [
    [0, 0, 0],
    [Math.PI / 4, 0, Math.PI / 4],
    [0, Math.PI / 4, Math.PI / 4],
    [Math.PI / 4, Math.PI / 4, 0],
  ];
  for (const [rx, ry, rz] of rotations) {
    const octa = new THREE.Mesh(new THREE.OctahedronGeometry(1.0, 0), mat);
    octa.rotation.set(rx, ry, rz);
    g.add(octa);
  }
  return g;
}

// Double torus — two interlocking tori (Hopf link)
function buildTomato(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const t1 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.2, 12, 32), mat);
  g.add(t1);
  const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.2, 12, 32), mat);
  t2.rotation.x = Math.PI / 2;
  t2.position.x = 0.9;
  t1.position.x = -0.45;
  t2.position.x = 0.45;
  g.add(t2);
  return g;
}

// Dodecahedron — 12-faced Platonic solid
function buildDodecahedron(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const dodeca = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), mat);
  g.add(dodeca);
  return g;
}

// Stella octangula — two interpenetrating tetrahedra (compound solid)
function buildStella(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const t1 = new THREE.Mesh(new THREE.TetrahedronGeometry(1.2, 0), mat);
  g.add(t1);
  const t2 = new THREE.Mesh(new THREE.TetrahedronGeometry(1.2, 0), mat);
  t2.rotation.set(Math.PI, 0, Math.PI / 3);
  g.add(t2);
  return g;
}

// Hypercube — tesseract projection (cube within cube, edges connected)
function buildHypercube(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), mat);
  g.add(outer);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat);
  inner.rotation.set(0.3, 0.4, 0.2);
  g.add(inner);
  const corners: [number, number, number][] = [
    [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
    [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1],
  ];
  const lineMat = new THREE.LineBasicMaterial({
    color: (mat as THREE.MeshBasicMaterial).color,
    transparent: true,
    opacity: (mat as THREE.MeshBasicMaterial).opacity * 0.6,
  });
  for (const [cx, cy, cz] of corners) {
    const geom = new THREE.BufferGeometry();
    const o = 0.8, i = 0.35;
    geom.setAttribute('position', new THREE.Float32BufferAttribute([
      cx * o, cy * o, cz * o, cx * i, cy * i, cz * i,
    ], 3));
    g.add(new THREE.Line(geom, lineMat));
  }
  return g;
}

type FruitConfig = {
  build: (mat: THREE.Material) => THREE.Group;
  position: [number, number, number];
  scale: number;
};

const CONFIGS: Record<FruitName, FruitConfig> = {
  pineapple: { build: buildPineapple, position: [2.3, 0.1, 0], scale: 0.95 },
  banana: { build: buildBanana, position: [-2.2, 0.5, 0], scale: 1.1 },
  apple: { build: buildApple, position: [2.1, -0.4, 0], scale: 1.0 },
  grape: { build: buildGrape, position: [-2.3, -0.2, 0], scale: 0.85 },
  tomato: { build: buildTomato, position: [2.2, 0.3, 0], scale: 1.05 },
  dodecahedron: { build: buildDodecahedron, position: [-2.0, 0.2, 0], scale: 0.9 },
  stella: { build: buildStella, position: [2.0, -0.1, 0], scale: 0.95 },
  hypercube: { build: buildHypercube, position: [-1.8, 0.3, 0], scale: 1.0 },
};

// -----------------------------------------------------------------------------
// Initializer
// -----------------------------------------------------------------------------

export function initFruitBackdrop(canvas: HTMLCanvasElement, name: FruitName) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Read current mode for material color.
  const mode = (document.documentElement.dataset.mode as 'bone' | 'void') ?? 'bone';

  // Second-visit-and-beyond check. The flag is stored in localStorage and
  // set here so the CURRENT page render uses the first-time appearance; the
  // next navigation (or reload) will pick up the acid lime variant. The try
  // block guards against storage being disabled / privacy mode.
  const VISIT_KEY = 'jct-visited';
  let returning = false;
  try {
    returning = localStorage.getItem(VISIT_KEY) === 'true';
    localStorage.setItem(VISIT_KEY, 'true');
  } catch {
    /* localStorage unavailable — treat as first visit always. */
  }

  const mat = wireMaterial(mode, returning);

  const cfg = CONFIGS[name];
  const fruit = cfg.build(mat);
  fruit.scale.setScalar(cfg.scale);
  const [px, py, pz] = cfg.position;
  fruit.position.set(px, py, pz);
  scene.add(fruit);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  let scrollY = window.scrollY;
  let t = 0;
  const baseY = py;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  window.addEventListener(
    'scroll',
    () => {
      scrollY = window.scrollY;
    },
    { passive: true },
  );

  let raf = 0;
  function tick() {
    t += 1;
    if (!reduce.matches) {
      fruit.rotation.y += 0.0035;
      fruit.rotation.x = Math.sin(t * 0.004) * 0.12;
      // Scroll parallax — the fruit drifts upward slowly as the user
      // scrolls down, giving a floating-behind-the-window feel.
      fruit.position.y = baseY + scrollY * 0.002;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else tick();
  });

  return () => {
    cancelAnimationFrame(raf);
    renderer.dispose();
    mat.dispose();
    fruit.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    });
  };
}
