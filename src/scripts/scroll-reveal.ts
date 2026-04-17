/**
 * Lightweight scroll-reveal using IntersectionObserver.
 * Elements with [data-reveal] fade in + slide up when entering the viewport.
 * Elements with [data-reveal-stagger] are children that reveal with incremental delay.
 * Respects prefers-reduced-motion.
 */

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');

function init() {
  if (REDUCE.matches) {
    // Immediately show everything
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const delay = el.dataset.revealDelay ?? '0';
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('revealed');
        observer.unobserve(el);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
  );

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    observer.observe(el);
  });

  // Stagger: assign incremental delays to children
  document.querySelectorAll('[data-reveal-stagger]').forEach((container) => {
    const gap = parseInt((container as HTMLElement).dataset.revealStagger ?? '30', 10);
    container.querySelectorAll('[data-reveal]').forEach((child, i) => {
      (child as HTMLElement).dataset.revealDelay = String(i * gap);
    });
  });
}

// Run on DOMContentLoaded or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
