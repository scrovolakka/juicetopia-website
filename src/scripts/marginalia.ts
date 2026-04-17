/**
 * Marginalia / sidenotes — activates on articles with [data-marginalia="on"].
 *
 * Picks up GFM footnotes (produced by Astro markdown when the document contains
 * [^n] references and [^n]: body definitions), and on wide screens repositions
 * each footnote body as a floating aside in the right margin of the body
 * column, anchored to the vertical position of its reference.
 *
 * On narrow screens the default in-flow footnote section is preserved and the
 * reference becomes a jump link.
 *
 * No-op if the article has no GFM footnotes. Respects prefers-reduced-motion.
 */

const WIDE_QUERY = '(min-width: 80rem)';

type Pair = { ref: HTMLAnchorElement; body: HTMLLIElement; index: number };

function collectPairs(article: HTMLElement): Pair[] {
  // remark-gfm outputs refs as <sup><a id="user-content-fnref-N" href="#user-content-fn-N">
  // and bodies as <li id="user-content-fn-N">…</li> inside <section class="footnotes">.
  const refs = Array.from(
    article.querySelectorAll<HTMLAnchorElement>('a[id^="user-content-fnref"]'),
  );
  const pairs: Pair[] = [];
  refs.forEach((ref, i) => {
    const href = ref.getAttribute('href') ?? '';
    const id = href.replace('#', '');
    const body = article.querySelector<HTMLLIElement>(`li[id="${id}"]`);
    if (!body) return;
    pairs.push({ ref, body, index: i + 1 });
  });
  return pairs;
}

function buildSidenote(body: HTMLLIElement, index: number): HTMLElement {
  const aside = document.createElement('aside');
  aside.className = 'sidenote';
  aside.setAttribute('data-sidenote-index', String(index));
  // Clone the body HTML, but strip the back-reference arrow (`↩`) that GFM adds.
  const inner = body.cloneNode(true) as HTMLLIElement;
  inner.querySelectorAll('a[class*="footnote-backref"]').forEach((a) => a.remove());
  // Also remove the default id so it doesn't duplicate.
  inner.removeAttribute('id');
  const num = document.createElement('span');
  num.className = 'sidenote-num';
  num.textContent = `${index}`;
  aside.appendChild(num);
  // Preserve inner child nodes (usually a single <p>).
  while (inner.firstChild) aside.appendChild(inner.firstChild);
  return aside;
}

function layoutSidenotes(article: HTMLElement, pairs: Pair[]) {
  // Remove any previously injected sidenotes from a prior layout pass.
  article
    .querySelectorAll<HTMLElement>('.sidenote')
    .forEach((el) => el.remove());

  const body = article.querySelector<HTMLElement>('.body');
  if (!body) return;

  // Build the asides into a sidenote column that sits inside .body-scroll.
  // On wide screens the column is positioned absolutely to the right of .body.
  let col = article.querySelector<HTMLElement>('.sidenote-col');
  if (!col) {
    col = document.createElement('div');
    col.className = 'sidenote-col';
    col.setAttribute('aria-hidden', 'false');
    body.parentElement?.appendChild(col);
  } else {
    col.innerHTML = '';
  }

  // Measure the body's top in the parent coordinate space to align sidenotes.
  const bodyRect = body.getBoundingClientRect();
  const parentRect = (col.parentElement as HTMLElement).getBoundingClientRect();
  const bodyTopOffset = bodyRect.top - parentRect.top;

  // Minimum vertical gap between sidenotes (to avoid overlap).
  const MIN_GAP = 16;
  let lastBottom = -Infinity;

  pairs.forEach(({ ref, body: fnBody }, i) => {
    const refRect = ref.getBoundingClientRect();
    const refTop = refRect.top - parentRect.top - bodyTopOffset;
    const aside = buildSidenote(fnBody, i + 1);
    col.appendChild(aside);
    // Flow into the DOM, then position.
    let y = Math.max(refTop - 4, lastBottom + MIN_GAP);
    aside.style.top = `${y}px`;
    // After first layout, measure actual height and update lastBottom.
    const h = aside.offsetHeight;
    lastBottom = y + h;
  });
}

function enhanceRefs(article: HTMLElement, pairs: Pair[]) {
  pairs.forEach(({ ref }, i) => {
    ref.setAttribute('data-marginalia-ref', String(i + 1));
  });
}

function teardown(article: HTMLElement) {
  article
    .querySelectorAll<HTMLElement>('.sidenote, .sidenote-col')
    .forEach((el) => el.remove());
}

function init() {
  const article = document.querySelector<HTMLElement>('article[data-marginalia="on"]');
  if (!article) return;

  const pairs = collectPairs(article);
  if (pairs.length === 0) return;

  // Mark the article so CSS knows footnotes exist.
  article.setAttribute('data-has-footnotes', 'true');
  enhanceRefs(article, pairs);

  const media = matchMedia(WIDE_QUERY);

  const apply = () => {
    if (media.matches) {
      layoutSidenotes(article, pairs);
    } else {
      teardown(article);
    }
  };

  apply();

  // Recompute on resize + on writing-mode toggle (horizontal/vertical changes layout).
  let rafId = 0;
  const schedule = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(apply);
  };
  window.addEventListener('resize', schedule, { passive: true });
  media.addEventListener('change', schedule);

  // Observe the writing-mode attribute too.
  const mo = new MutationObserver(schedule);
  mo.observe(article, { attributes: true, attributeFilter: ['data-writing'] });

  // After images load, positions can shift.
  window.addEventListener('load', schedule);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
