// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static site; EN / TC / SC all prefixed (/en/, /tc/, /sc/). `/` redirects to /en/.
export default defineConfig({
  output: 'static',
  site: 'https://preview.invalid', // placeholder until the preview host is chosen; keeps canonical URLs well-formed
  trailingSlash: 'ignore',
  i18n: {
    locales: ['en', { path: 'tc', codes: ['zh-Hant', 'zh-HK'] }, { path: 'sc', codes: ['zh-Hans', 'zh-CN'] }],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
  },
  vite: { plugins: [tailwindcss()] },
});
