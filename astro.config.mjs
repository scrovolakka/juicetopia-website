// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NOTE: Update `site` to the real GitHub username / custom domain before deploy.
// If deploying to a user site (<user>.github.io) or a custom domain, set `base: '/'`.
export default defineConfig({
  site: 'https://example.github.io',
  base: '/juicetopia-website',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  image: {
    // Astro 5 uses sharp by default; explicit here for clarity.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
