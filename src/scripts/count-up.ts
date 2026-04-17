/**
 * Kinetic count-up for elements marked with [data-count-up].
 * Interpolates from 0 to the initial text value (padded integer) when the
 * element enters the viewport. Preserves the final padded width.
 * No-op if prefers-reduced-motion is set.
 */

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
const DURATION = 900;

function ease(t: number): number {
  // easeOutCubic
  return 1 - Math.pow(1 - t, 3);
}

function animate(el: HTMLElement) {
  const target = parseInt(el.textContent?.trim() ?? '0', 10);
  if (!Number.isFinite(target) || target <= 0) return;
  const width = (el.textContent ?? '').length;
  const pad = (n: number) => String(n).padStart(width, '0');
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min(1, (now - start) / DURATION);
    const n = Math.round(target * ease(t));
    el.textContent = pad(n);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = pad(target);
  }
  requestAnimationFrame(tick);
}

function init() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count-up]'));
  if (els.length === 0) return;
  if (REDUCE.matches) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        animate(e.target as HTMLElement);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.4 },
  );
  els.forEach((el) => io.observe(el));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
