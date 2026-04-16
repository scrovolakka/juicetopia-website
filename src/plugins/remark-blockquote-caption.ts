import { visit } from 'unist-util-visit';
import type { Root, Blockquote, Paragraph, Text } from 'mdast';

/**
 * Remark plugin: blockquote with caption.
 *
 * Transforms a standard blockquote whose last paragraph starts with "——"
 * into a <figure> with <blockquote> + <figcaption>.
 *
 * Usage in Markdown:
 *
 *   > 台帳の真実と、私の目の真実——これは交換してはならない。
 *   >
 *   > —— ヴィリナ・コマツ「泥の断章」第三話
 */
export default function remarkBlockquoteCaption() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      if (!parent || index === undefined) return;

      const children = node.children;
      if (children.length === 0) return;

      // Check if the last child is a paragraph starting with "——"
      const last = children[children.length - 1];
      if (last.type !== 'paragraph' || last.children.length === 0) return;

      const firstInline = last.children[0];
      if (firstInline.type !== 'text') return;

      const trimmed = firstInline.value.trimStart();
      if (!trimmed.startsWith('——')) return;

      // Strip the "—— " prefix from the caption text
      const captionText = trimmed.replace(/^——\s*/, '');
      const captionChildren = [
        ...(captionText
          ? [{ type: 'text' as const, value: captionText }]
          : []),
        ...last.children.slice(1),
      ];

      // Body = all children except the last (caption) paragraph
      const bodyChildren = children.slice(0, -1);

      // Build the HTML replacement
      parent.children.splice(index, 1, {
        type: 'html',
        value: '',
      } as any);

      // We need to render body and caption manually via hast-like html nodes.
      // Instead, wrap in html open/close tags and keep mdast children for
      // further processing by other plugins (ruby, tcy, etc.).
      const nodes: any[] = [];

      nodes.push({ type: 'html', value: '<figure class="quote-figure">' });
      nodes.push({ type: 'html', value: '<blockquote>' });
      nodes.push(...bodyChildren);
      nodes.push({ type: 'html', value: '</blockquote>' });
      nodes.push({ type: 'html', value: '<figcaption>' });
      nodes.push({
        type: 'paragraph',
        children: captionChildren,
      });
      nodes.push({ type: 'html', value: '</figcaption>' });
      nodes.push({ type: 'html', value: '</figure>' });

      parent.children.splice(index, 1, ...nodes);
    });
  };
}
