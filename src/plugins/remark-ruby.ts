import { visit } from 'unist-util-visit';
import type { Root, Text } from 'mdast';

/**
 * Remark plugin to transform |漢字《かんじ》 notation into <ruby> HTML.
 *
 * Horizontal mode: reading appears above the base text.
 * Vertical mode:   reading appears to the right (handled by default ruby-position).
 */

const RUBY_RE = /\|([^《\n]+)《([^》\n]+)》/g;

export default function remarkRuby() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      const { value } = node;
      RUBY_RE.lastIndex = 0;
      if (!RUBY_RE.test(value)) return;
      RUBY_RE.lastIndex = 0;

      const children: Array<{ type: string; value: string }> = [];
      let last = 0;
      let match: RegExpExecArray | null;

      while ((match = RUBY_RE.exec(value)) !== null) {
        if (match.index > last) {
          children.push({ type: 'text', value: value.slice(last, match.index) });
        }
        children.push({
          type: 'html',
          value: `<ruby>${match[1]}<rp>（</rp><rt>${match[2]}</rt><rp>）</rp></ruby>`,
        });
        last = match.index + match[0].length;
      }
      if (last < value.length) {
        children.push({ type: 'text', value: value.slice(last) });
      }

      parent.children.splice(index, 1, ...(children as any));
    });
  };
}
