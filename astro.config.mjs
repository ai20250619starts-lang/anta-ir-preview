// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * GitHub Pages-ready static build.
 *   PREVIEW_SITE  origin of the Pages site, e.g. https://<user>.github.io   (default: http://localhost:4321)
 *   PREVIEW_BASE  path prefix for a project page, e.g. /anta-ir-preview/    (default: /)
 * Example: PREVIEW_SITE=https://harry.github.io PREVIEW_BASE=/anta-ir-preview/ npm run build
 * All internal links/assets go through withBase() (src/lib/paths.ts), so they respect the base path.
 */
const site = process.env.PREVIEW_SITE || 'http://localhost:4321';
const rawBase = process.env.PREVIEW_BASE || '/';
const base = ('/' + rawBase.replace(/^\/+|\/+$/g, '') + '/').replace(/\/+/g, '/');

export default defineConfig({
  output: 'static',
  site,
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  i18n: {
    locales: ['en', { path: 'tc', codes: ['zh-Hant', 'zh-HK'] }, { path: 'sc', codes: ['zh-Hans', 'zh-CN'] }],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
  },
  vite: { plugins: [tailwindcss()] },
});
