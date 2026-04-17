/**
 * Vertical-mode figure parallax.
 *
 * In vertical writing mode the figure frame is portrait-shaped and clips a
 * landscape (e.g. 16:9) source image that overhangs horizontally. This
 * script drives `translateX` on the image so that as the reader scrolls
 * through the column, the image pans left-to-right inside the window —
 * giving a "camera moves across the frame" effect synchronised with the
 * flow of reading (right-to-left column order in vertical-rl).
 *
 * Mapping:
 *   delta = frameCenterX − viewportCenterX  (relative to .body-scroll)
 *   p     = clamp(delta / halfSpan, -1, 1)
 *   translateX(img) = -p × (overhang / 2)
 *
 * Result:
 *   - frame entering from the LEFT of the viewport  → image shows its LEFT side
 *   - frame centered                                → image centered
 *   - frame exiting to the RIGHT                    → image shows its RIGHT side
 *
 * No-op outside vertical mode, under prefers-reduced-motion, or when the
 * image has no horizontal overhang (already-portrait source).
 */

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');

type Entry = { frame: HTMLElement; img: HTMLImageElement };

function init() {
  const article = document.querySelector<HTMLElement>('article.reading');
  if (!article) return;
  const scroll = article.querySelector<HTMLElement>('.body-scroll');
  if (!scroll) return;

  const entries: Entry[] = [];
  function collect() {
    entries.length = 0;
    article
      .querySelectorAll<HTMLElement>('.fig .fig-frame')
      .forEach((frame) => {
        const img = frame.querySelector<HTMLImageElement>('img');
        if (img) entries.push({ frame, img });
      });
  }

  function reset() {
    for (const { img } of entries) img.style.transform = '';
  }

  function update() {
    if (article.dataset.writing !== 'vertical' || REDUCE.matches) {
      reset();
      return;
    }
    const sr = scroll.getBoundingClientRect();
    const vpCenter = sr.left + sr.width / 2;

    for (const { frame, img } of entries) {
      const fr = frame.getBoundingClientRect();
      const frCenter = fr.left + fr.width / 2;
      const delta = frCenter - vpCenter;
      const half = sr.width / 2 + fr.width / 2;
      const p = Math.max(-1, Math.min(1, delta / half));

      const overhang = img.offsetWidth - frame.offsetWidth;
      if (overhang <= 0) {
        img.style.transform = '';
        continue;
      }
      const tx = -p * (overhang / 2);
      img.style.transform = `translateX(${tx.toFixed(1)}px)`;
    }
  }

  let rafId = 0;
  const schedule = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  };

  collect();

  scroll.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });

  // Images may finish loading after init — refresh when they do.
  for (const { img } of entries) {
    if (!img.complete) img.addEventListener('load', schedule, { once: true });
  }

  // Writing-mode attribute toggles — recompute / reset.
  const mo = new MutationObserver(schedule);
  mo.observe(article, { attributes: true, attributeFilter: ['data-writing'] });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
