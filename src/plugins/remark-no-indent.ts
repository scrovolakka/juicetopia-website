import { visit } from 'unist-util-visit';
import type { Root, Paragraph } from 'mdast';

/**
 * Remark plugin: suppress text-indent on specific paragraphs.
 *
 * Adds `data-no-indent` to <p> tags when:
 *  - The paragraph text starts with an opening bracket:「『（
 *    (standard Japanese typesetting rule for dialogue)
 */

const OPEN_BRACKETS = /^[「『（]/;

function getPlainText(node: Paragraph): string {
  for (const child of node.children) {
    if (child.type === 'text') return child.value;
    if (child.type === 'html') {
      // Skip HTML tags, get inner text if any
      const inner = child.value.replace(/<[^>]*>/g, '');
      if (inner) return inner;
    }
  }
  return '';
}

export default function remarkNoIndent() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      const text = getPlainText(node);
      if (OPEN_BRACKETS.test(text)) {
        const data = (node.data ??= {});
        const hProps = ((data.hProperties as Record<string, unknown>) ??= {});
        hProps['data-no-indent'] = '';
      }
    });
  };
}
