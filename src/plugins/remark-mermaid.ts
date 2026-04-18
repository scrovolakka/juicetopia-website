import { visit } from 'unist-util-visit';
import type { Root, Code } from 'mdast';

/**
 * Remark plugin: convert fenced code blocks with `mermaid` language
 * into raw HTML `<pre class="mermaid">...</pre>` nodes.
 *
 * The mermaid.js runtime (loaded by PaperLayout via dynamic import) looks
 * for `pre.mermaid` / `.mermaid` elements and renders SVG diagrams in-place.
 * We use <pre> (not <div>) so the raw text is preserved if JS fails.
 *
 * Usage inside markdown:
 *
 * ```mermaid
 * flowchart LR
 *   A --> B
 * ```
 */
export default function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (!parent || index === undefined) return;
      if ((node.lang ?? '').toLowerCase() !== 'mermaid') return;

      // HTML-escape the source so angle brackets in the diagram don't
      // break the DOM before mermaid gets a chance to read textContent.
      const escaped = (node.value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      parent.children.splice(index, 1, {
        type: 'html',
        value: `<pre class="mermaid" data-mermaid-src>${escaped}</pre>`,
      } as any);
    });
  };
}
