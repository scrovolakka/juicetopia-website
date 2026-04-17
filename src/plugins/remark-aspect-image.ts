import { visit } from 'unist-util-visit';
import type { Root, Paragraph, Image } from 'mdast';

/**
 * Remark plugin: inline figure directives on markdown images.
 *
 * Transforms a markdown image whose alt text starts with one or more
 * bracketed directives into a <figure> with a frame and an optional caption.
 * Astro's built-in image transform still runs over the inner image node,
 * so `![...](./local.png)` references keep srcset / width / height.
 *
 * Syntax (tokens inside the single [...] are space-separated, order-free):
 *
 *   ![[16:9] キャプション](./frame.png)            centered, 16:9 crop
 *   ![[4:3]](./crop.png)                              centered, 4:3 crop (no caption)
 *   ![[left] caption](./img.png)                      float-left, natural ratio
 *   ![[right] caption](./img.png)                     float-right, natural ratio
 *   ![[left 16:9] caption](./img.png)                 float-left + 16:9 crop
 *   ![[right 4:3] caption](./img.png)                 float-right + 4:3 crop
 *
 * Supported aspect tokens: 16:9 | 4:3 | 3:2 | 1:1.
 * Supported float tokens:  left | right.
 *
 * In vertical writing mode the float tokens are ignored (picture-page
 * layout wins). See base.css for the float / clear rules.
 */

type Aspect = '16:9' | '4:3' | '3:2' | '1:1';
type Float = 'left' | 'right';

const TAG_RE = /^\[([^\]]+)\]\s*([\s\S]*)$/;
const ASPECTS = new Set<Aspect>(['16:9', '4:3', '3:2', '1:1']);
const FLOATS = new Set<Float>(['left', 'right']);

function parseDirectives(raw: string): { float?: Float; aspect?: Aspect } {
  const tokens = raw.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
  let float: Float | undefined;
  let aspect: Aspect | undefined;
  for (const t of tokens) {
    if (FLOATS.has(t as Float)) float = t as Float;
    else if (ASPECTS.has(t as Aspect)) aspect = t as Aspect;
  }
  return { float, aspect };
}

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
      const match = alt.match(TAG_RE);
      if (!match) return;

      const { float, aspect } = parseDirectives(match[1]);
      // At least one directive is required; otherwise leave as plain image.
      if (!float && !aspect) return;

      const caption = (match[2] ?? '').trim();
      const classes = ['fig'];
      if (aspect) classes.push(`fig-${aspect.replace(':', '-')}`);
      if (float) classes.push(`fig-${float}`);
      const cls = classes.join(' ');

      // Rewrite alt to remove the tag so assistive tech reads the caption only
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
