import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
import { BASE, type Lang } from './config.ts';

export const sha = (s: string, n = 8) => createHash('sha1').update(s).digest('hex').slice(0, n);

export const clean = (s: string | undefined | null) =>
  (s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();

/** Collapse to a single line. */
export const line = (s: string | undefined | null) => clean(s).replace(/\n+/g, ' ').trim();

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const absUrl = (href: string, pageUrl: string) => {
  try {
    return new URL(href.trim(), pageUrl).toString();
  } catch {
    return null;
  }
};

/** '2026.10.02' -> '2026-10-02' */
export const parseDotDate = (s: string) => {
  const m = s.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null;
};

const FILE_RE = /\/files\/394\/(\d{4})\/(\d{2})(\d{2})\/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_\d+_(en|tc|sc)\.[a-z]+$/i;

/** Info encoded in Wisdom IR file URLs: folder date, upload timestamp and file language. */
export const fileInfo = (url: string | null | undefined) => {
  if (!url) return null;
  const m = url.match(FILE_RE);
  if (!m) return null;
  return {
    folderDate: `${m[1]}-${m[2]}-${m[3]}`,
    stampDate: `${m[4]}-${m[5]}-${m[6]}`,
    stamp: `${m[4]}${m[5]}${m[6]}${m[7]}${m[8]}${m[9]}`,
    time: `${m[7]}:${m[8]}`,
    lang: m[10].toLowerCase() as Lang,
  };
};

/** Language of a file URL: Wisdom IR suffix, or `_en.pdf`/`_tc.pdf` style names, else the page language. */
export const fileLangOf = (url: string, pageLang: Lang): Lang => {
  const fi = fileInfo(url);
  if (fi) return fi.lang;
  const m = url.match(/[_/-](en|tc|sc)(?:\.[a-z]+|\/?)$/i);
  return m ? (m[1].toLowerCase() as Lang) : pageLang;
};

export const formatOf = (url: string): 'pdf' | 'html' | 'link' =>
  /\.pdf($|\?)/i.test(url) ? 'pdf' : url.startsWith(BASE) ? 'html' : 'link';

const ALLOWED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'h3', 'h4', 'h5', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'sup', 'sub']);

/** Allow-list HTML sanitiser for scraped rich text (press release bodies, FAQ answers). */
export const sanitizeHtml = (html: string, pageUrl: string) => {
  const $ = cheerio.load(`<div id="__root">${html}</div>`, null, false);
  $('script,style,iframe,object,embed,form,input,button,head,title,meta,link,img').remove();
  const root = $('#__root');
  // unwrap disallowed tags (deepest first)
  root
    .find('*')
    .toArray()
    .reverse()
    .forEach((el) => {
      const node = $(el);
      const tag = (el as { tagName?: string }).tagName?.toLowerCase() ?? '';
      if (!ALLOWED.has(tag)) {
        node.replaceWith(node.contents());
        return;
      }
      const href = tag === 'a' ? node.attr('href') : undefined;
      for (const attr of Object.keys((el as { attribs?: Record<string, string> }).attribs ?? {})) node.removeAttr(attr);
      if (href) {
        const abs = absUrl(href, pageUrl);
        if (abs && /^https?:/.test(abs)) node.attr('href', abs);
      }
    });
  return (root.html() ?? '')
    .replace(/<p>\s*(&nbsp;|\s|<br>)*\s*<\/p>/g, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
};

/** Split an element's text on <br> into clean lines. */
export const linesOf = ($: cheerio.CheerioAPI, el: Parameters<cheerio.CheerioAPI>[0]) => {
  const html = $(el).html() ?? '';
  return html
    .split(/<br\s*\/?>/i)
    .map((frag) => line(cheerio.load(`<x>${frag}</x>`, null, false)('x').text()))
    .filter(Boolean);
};

export const parseNumber = (s: string) => {
  const t = s.replace(/[,\s%]/g, '').replace(/[()]/g, '');
  if (!t || t === '-' || t === '–') return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return /^\(.*\)$/.test(s.trim()) ? -n : n;
};
