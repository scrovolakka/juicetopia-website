/** Translate vertical mouse-wheel into horizontal scroll for vertical-rl containers. */
export function initVerticalScroll(container: HTMLElement) {
  function onWheel(e: WheelEvent) {
    const article = container.closest('[data-writing]') as HTMLElement | null;
    if (!article || article.dataset.writing !== 'vertical') return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    e.preventDefault();
    container.scrollLeft -= e.deltaY;
  }

  container.addEventListener('wheel', onWheel, { passive: false });
  return () => container.removeEventListener('wheel', onWheel);
}
