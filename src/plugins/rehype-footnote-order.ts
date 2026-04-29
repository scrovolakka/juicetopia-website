import { visit } from 'unist-util-visit';
import type { Root, Element, Text } from 'hast';

/**
 * Rehype plugin: align footnote display order with file (label) order.
 *
 * Default GFM behaviour numbers footnotes by tree-traversal order of
 * `footnoteReference` nodes — fine when the body cites `[^1] [^2] ...` in
 * sequence, but breaks when the body cites only a few footnotes and the rest
 * are reached only via cross-references inside other footnotes (e.g. the
 * "脚注の王" finale, where the body is one line and the footnote web is
 * referenced internally). The displayed numbers then drift away from the
 * `[^N]` labels in the markdown source.
 *
 * This plugin restores label-order display by:
 *   1. Rewriting the inner text of every in-body `<sup><a data-footnote-ref>`
 *      to the numeric id encoded in its href (`#user-content-fn-N` → `N`).
 *   2. Sorting the `<li>` children of `<section data-footnotes><ol>` by that
 *      numeric id, so the footnotes list reads 1, 2, 3, … in label order.
 *
 * Anchors and backrefs are unaffected — they key off `fn-N` / `fnref-N` ids
 * derived from the original label, which we don't touch.
 */

const FN_HREF = /#user-content-fn-(\d+)/;
const FN_ID = /^user-content-fn-(\d+)$/;

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export default function rehypeFootnoteOrder() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      // 1. Rewrite in-body footnote ref display number.
      if (
        node.tagName === 'a' &&
        node.properties &&
        node.properties.dataFootnoteRef !== undefined
      ) {
        const href = asString(node.properties.href);
        const m = href.match(FN_HREF);
        if (m) {
          const display = m[1];
          const text = node.children.find(
            (c): c is Text => c.type === 'text',
          );
          if (text) {
            text.value = display;
          } else {
            node.children = [{ type: 'text', value: display }];
          }
        }
      }

      // 2. Sort the footnotes <ol> by label-derived id.
      if (
        node.tagName === 'section' &&
        node.properties &&
        node.properties.dataFootnotes !== undefined
      ) {
        for (const child of node.children) {
          if (child.type !== 'element' || child.tagName !== 'ol') continue;
          const items: Element[] = [];
          const tail: typeof child.children = [];
          for (const li of child.children) {
            if (
              li.type === 'element' &&
              li.tagName === 'li' &&
              FN_ID.test(asString(li.properties?.id))
            ) {
              items.push(li);
            } else {
              tail.push(li);
            }
          }
          items.sort((a, b) => {
            const ai = Number(asString(a.properties?.id).match(FN_ID)?.[1] ?? 0);
            const bi = Number(asString(b.properties?.id).match(FN_ID)?.[1] ?? 0);
            return ai - bi;
          });
          child.children = [...tail, ...items];
        }
      }
    });
  };
}
