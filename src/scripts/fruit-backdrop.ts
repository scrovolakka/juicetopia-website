/**
 * Fruit backdrop — a low-poly wireframe 3D fruit slowly drifting behind the
 * content of each route index page. The canvas is a fixed, full-viewport
 * element with `z-index: 0`; content stacks above via `.page { z-index: 1 }`.
 *
 * Five fruits map to the five content routes, each tied to a King-of-Fruit
 * character:
 *   - pineapple (ジジバルバ)  → /novel/
 *   - banana    (スクロヴロッカ) → /characters/
 *   - apple     (モルドラッサ)   → /mondo/
 *   - grape     (グリッボロンカ) → /lexicon/
 *   - tomato    (ポンプリーズカ) → /gallery/
 *
 * Motion: slow Y rotation + gentle X wobble + scroll-driven Y drift for a
 * parallax float. Disabled under prefers-reduced-motion.
 */
import * as THREE from 'three';

export type FruitName = 'pineapple' | 'banana' | 'apple' | 'grape' | 'tomato';

// -----------------------------------------------------------------------------
// Shared wireframe material.
//
// First-time visitors see the fruit drawn in the site's neutral ink/bone
// palette — muted, part of the paper. Returning readers (the flag
// `jct-visited` is set in localStorage after the first encounter) see the
// fruit in the acid lime accent — a small reward for coming back.
// -----------------------------------------------------------------------------
function wireMaterial(
  mode: 'bone' | 'void',
  returning: boolean,
): THREE.MeshBasicMaterial {
  const color = returning
    ? 0xd8ff3a // acid lime for the second visit onward
    : mode === 'void'
      ? 0xefebe2 // bone wireframe on dark pages
      : 0x0f0e0c; // ink wireframe on paper pages
  return new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: returning ? 0.45 : mode === 'void' ? 0.32 : 0.22,
    side: THREE.DoubleSide,
  });
}

// -----------------------------------------------------------------------------
// Geometry builders
// -----------------------------------------------------------------------------

function buildPineapple(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();

  // Ellipsoid body — low-poly sphere scaled into a pine shape.
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 14), mat);
  body.scale.set(0.82, 1.2, 0.82);
  g.add(body);

  // Spiky leaf crown on top (7 radially arranged cones).
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.7, 3), mat);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.15, 1.45, Math.sin(a) * 0.15);
    // Tilt each leaf slightly outward.
    leaf.rotation.x = -Math.cos(a) * 0.35;
    leaf.rotation.z = Math.sin(a) * 0.35;
    g.add(leaf);
  }

  return g;
}

function buildBanana(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();

  // A gentle crescent curve traced by CatmullRom through five control points.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.3, -0.3, 0),
    new THREE.Vector3(-0.7, 0.3, 0),
    new THREE.Vector3(0.0, 0.55, 0),
    new THREE.Vector3(0.7, 0.3, 0),
    new THREE.Vector3(1.3, -0.3, 0),
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.24, 8, false), mat);
  g.add(tube);

  // Stem cap at the top curve.
  const stem = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), mat);
  stem.position.set(-1.3, -0.35, 0);
  stem.rotation.z = 0.5;
  g.add(stem);

  return g;
}

function buildApple(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();

  // Slightly squashed sphere for an apple silhouette.
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mat);
  body.scale.set(1.05, 0.92, 1.05);
  g.add(body);

  // Stem.
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 6), mat);
  stem.position.y = 1.02;
  g.add(stem);

  // A small leaf attached near the stem.
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 3), mat);
  leaf.position.set(0.12, 1.1, 0);
  leaf.rotation.z = -0.7;
  g.add(leaf);

  return g;
}

function buildGrape(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();

  // Triangular cluster of 9 grapes — same arrangement as the SVG portrait.
  const positions: Array<[number, number, number]> = [
    [0, 0.9, 0],
    [-0.32, 0.45, 0.05],
    [0.32, 0.45, 0.05],
    [-0.64, 0.0, 0.0],
    [0.0, 0.0, 0.15],
    [0.64, 0.0, 0.0],
    [-0.32, -0.45, 0.05],
    [0.32, -0.45, 0.05],
    [0.0, -0.9, 0.0],
  ];
  for (const [x, y, z] of positions) {
    const grape = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat);
    grape.position.set(x, y, z);
    g.add(grape);
  }

  // Stem rising above the cluster.
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), mat);
  stem.position.y = 1.25;
  g.add(stem);

  // Two small leaves at the stem crown.
  for (const dir of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 3), mat);
    leaf.position.set(dir * 0.18, 1.25, 0);
    leaf.rotation.z = -dir * 0.8;
    g.add(leaf);
  }

  return g;
}

function buildTomato(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();

  // Flattened sphere body.
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat);
  body.scale.set(1.1, 0.82, 1.1);
  g.add(body);

  // Five sepal leaves radiating from the top.
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.45, 3), mat);
    const a = (i / 5) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.22, 0.86, Math.sin(a) * 0.22);
    leaf.rotation.x = -Math.cos(a) * 1.1;
    leaf.rotation.z = Math.sin(a) * 1.1;
    g.add(leaf);
  }

  return g;
}

// -----------------------------------------------------------------------------
// Per-fruit positioning / sizing — mixed left/right so each page feels unique.
// -----------------------------------------------------------------------------

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
