import { visit } from 'unist-util-visit';
import type { Root, Paragraph, Image } from 'mdast';

/**
 * Remark plugin: inline aspect-ratio figures.
 *
 * Transforms a markdown image whose alt text starts with an aspect tag into a
 * <figure> with a cropping frame and an optional caption. Astro's built-in
 * image transform still runs over the inner image node (the mdast `image`
 * node is preserved), so `![...](./local.png)` references remain processed
 * by astro:assets and get width/height/srcset for free.
 *
 * Usage in Markdown:
 *
 *   ![[16:9] キャプション文](./frame.png)
 *   ![[4:3]](./crop.png)              ← no caption
 *   ![[1:1] square note](./pic.png)
 *
 * Supported tags: [16:9], [4:3], [3:2], [1:1].
 *
 * The image is cropped to the given ratio via `object-fit: cover` on the
 * inner frame. If you want to keep the natural aspect ratio, just don't add
 * the tag — a plain markdown image renders inline without cropping.
 */

const ASPECT_RE = /^\[(16:9|4:3|3:2|1:1)\]\s*([\s\S]*)$/;

export default function remarkAspectImage() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!parent || index === undefined) return;
      // Only handle paragraphs that contain exactly one image node. Inline
      // images mixed with prose are left untouched.
      if (node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== 'image') return;

      const img = child as Image;
      const alt = img.alt ?? '';
      const match = alt.match(ASPECT_RE);
      if (!match) return;

      const aspect = match[1];
      const caption = (match[2] ?? '').trim();
      const cls = `fig fig-${aspect.replace(':', '-')}`;

      // Rewrite alt to remove the tag so assistive tech reads the caption only
      // (or falls back to a sensible placeholder if none).
      img.alt = caption || '';

      const replacement: any[] = [];
      replacement.push({ type: 'html', value: `<figure class="${cls}">` });
      replacement.push({ type: 'html', value: '<div class="fig-frame">' });
      replacement.push(img);
      replacement.push({ type: 'html', value: '</div>' });
      if (caption) {
        replacement.push({ type: 'html', value: '<figcaption>' });
        replacement.push({ type: 'text', value: caption });
        replacement.push({ type: 'html', value: '</figcaption>' });
      }
      replacement.push({ type: 'html', value: '</figure>' });

      parent.children.splice(index, 1, ...replacement);
    });
  };
}
