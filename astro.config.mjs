// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Deployed as a project site at scrovolakka.github.io/juicetopia-website/
// If ever moved to a user site (scrovolakka.github.io) or a custom domain, set `base: '/'`.
export default defineConfig({
  site: 'https://scrovolakka.github.io',
  base: '/juicetopia-website',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  image: {
    // Astro 5 uses sharp by default; explicit here for clarity.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
