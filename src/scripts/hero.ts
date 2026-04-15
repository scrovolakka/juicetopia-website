// Hero 3D — low-poly torus knot wireframe, slow rotation, mild parallax.
// Kept minimal on purpose: single mesh, no post-processing.
import * as THREE from 'three';

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

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Torus knot — low tube / low radial segments for visible polygons
  const geom = new THREE.TorusKnotGeometry(1.2, 0.36, 80, 10, 2, 3);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xefebe2,
    wireframe: true,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);

  // Glow ring (static) behind for acid bleed
  const ringGeom = new THREE.RingGeometry(2.2, 2.22, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xd8ff3a,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.z = -1;
  scene.add(ring);

  // Light not needed for MeshBasicMaterial, but keep a minimal ambient for future material swap
  scene.add(new THREE.AmbientLight(0xffffff, 1));

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

  function onMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }
  window.addEventListener('pointermove', onMove, { passive: true });

  let raf = 0;
  let t = 0;
  const ROT_SPEED = 0.0015;

  function tick() {
    t += 1;
    if (!reduce.matches) {
      mesh.rotation.y += ROT_SPEED;
      mesh.rotation.x += ROT_SPEED * 0.4;
      // Mild parallax
      mesh.rotation.z = mouseX * 0.08;
      camera.position.x += (mouseX * 0.2 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 0.12 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  // Pause on hidden tab
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      tick();
    }
  });

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    renderer.dispose();
    geom.dispose();
    mat.dispose();
    ringGeom.dispose();
    ringMat.dispose();
  };
}
