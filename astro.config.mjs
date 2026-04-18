// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkTcy from './src/plugins/remark-tcy';
import remarkRuby from './src/plugins/remark-ruby';
import remarkBlockquoteCaption from './src/plugins/remark-blockquote-caption';
import remarkNoIndent from './src/plugins/remark-no-indent';
import remarkAspectImage from './src/plugins/remark-aspect-image';
import remarkMermaid from './src/plugins/remark-mermaid';

// Deployed as a project site at scrovolakka.github.io/juicetopia-website/
// If ever moved to a user site (scrovolakka.github.io) or a custom domain, set `base: '/'`.
export default defineConfig({
  site: 'https://scrovolakka.github.io',
  base: '/juicetopia-website',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [
      remarkRuby,
      remarkTcy,
      remarkBlockquoteCaption,
      remarkAspectImage,
      remarkNoIndent,
      // TRAKTATO section: LaTeX + Mermaid. These plugins are safe to apply
      // globally — they only act on nodes whose syntax they recognise
      // ($...$ / $$...$$ for math, ```mermaid for diagrams), leaving novel
      // and other collections untouched.
      remarkMath,
      remarkMermaid,
    ],
    rehypePlugins: [
      // Renders the math nodes produced by remark-math into KaTeX HTML.
      // Requires katex.min.css (loaded only in PaperLayout).
      [rehypeKatex, { strict: false, trust: false }],
    ],
  },
  image: {
    // Astro 5 uses sharp by default; explicit here for clarity.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
