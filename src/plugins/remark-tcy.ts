import { visit } from 'unist-util-visit';
import type { Root, Text } from 'mdast';

const TCY_RE = /(?<!\d)(\d{2})(?!\d)/g;

/** Wrap isolated 2-digit numbers in <span class="tcy"> for tate-chu-yoko. */
export default function remarkTcy() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      const { value } = node;
      TCY_RE.lastIndex = 0;
      if (!TCY_RE.test(value)) return;
      TCY_RE.lastIndex = 0;

      const children: Array<{ type: string; value: string }> = [];
      let last = 0;
      let match: RegExpExecArray | null;

      while ((match = TCY_RE.exec(value)) !== null) {
        if (match.index > last) {
          children.push({ type: 'text', value: value.slice(last, match.index) });
        }
        children.push({ type: 'html', value: `<span class="tcy">${match[1]}</span>` });
        last = match.index + match[0].length;
      }
      if (last < value.length) {
        children.push({ type: 'text', value: value.slice(last) });
      }

      parent.children.splice(index, 1, ...(children as any));
    });
  };
}
