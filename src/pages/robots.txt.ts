import type { APIRoute } from 'astro';
// Disallow everything. Note: on a GitHub *project* page (user.github.io/repo/) crawlers only read robots.txt at the
// domain root, so this file is advisory there; the per-page noindex meta is the effective control.
export const GET: APIRoute = () => new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain' } });
