/**
 * Mermaid initialiser — lazy-loaded by PaperLayout only when the page
 * actually contains mermaid diagrams (remark-mermaid converts fenced
 * ```mermaid blocks into <pre class="mermaid" data-mermaid-src>...</pre>).
 *
 * Strategy:
 *   1. Check presence of pre.mermaid nodes; bail out if none.
 *   2. Dynamically import mermaid so pages without diagrams don't pay the
 *      bundle cost.
 *   3. Re-snapshot the original source text before each run (mermaid
 *      mutates the node after rendering, and we want idempotency if the
 *      theme later changes).
 *
 * Theme: we use 'neutral' so the palette stays close to the paper's
 * ink/bone tokens; acid accents are applied via CSS overrides in base.css.
 */
export async function initMermaid() {
  const nodes = document.querySelectorAll<HTMLElement>('pre.mermaid');
  if (nodes.length === 0) return;

  // Snapshot originals so reruns stay idempotent (mermaid replaces
  // textContent with an <svg> once rendered).
  nodes.forEach((n) => {
    if (!n.dataset.mermaidOriginal) {
      n.dataset.mermaidOriginal = n.textContent ?? '';
    } else {
      n.textContent = n.dataset.mermaidOriginal;
      n.removeAttribute('data-processed');
    }
  });

  const { default: mermaid } = await import('mermaid');

  const isDark =
    document.documentElement.dataset.mode === 'void' ||
    matchMedia('(prefers-color-scheme: dark)').matches;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark ? 'dark' : 'neutral',
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    themeVariables: {
      // Align with juicetopia's palette where mermaid exposes hooks.
      primaryColor: isDark ? '#18181a' : '#efebe2',
      primaryBorderColor: isDark ? '#d8ff3a' : '#0f0e0c',
      primaryTextColor: isDark ? '#efebe2' : '#0f0e0c',
      lineColor: isDark ? '#9a9690' : '#6b6a63',
      secondaryColor: isDark ? '#2a2a2d' : '#e8e3d6',
      tertiaryColor: isDark ? '#1a1a1c' : '#f5f2e9',
    },
  });

  try {
    await mermaid.run({ querySelector: 'pre.mermaid' });
  } catch (err) {
    // One broken diagram shouldn't nuke the whole page; surface it in the
    // console for authoring and move on.
    console.warn('[mermaid] render error', err);
  }
}
