import * as cheerio from 'cheerio';
import { LANGS, pageUrl, type Lang } from './config.ts';
import type { PoliteFetcher } from './http.ts';
import { absUrl, line, linesOf, parseDotDate, parseNumber, sanitizeHtml, sha, slug } from './util.ts';
import { classifyEvent } from './classify.ts';
import { mergeLangs, type Notes, type PerLang, type RawItem } from './docs.ts';
import type {
  BoardFile,
  BrandsFile,
  CalendarFile,
  CompanyFile,
  ContactsFile,
  FaqFile,
  FinancialHighlightsFile,
  Localized,
} from '../../src/data/schemas.ts';

const now = () => new Date().toISOString();
const urls3 = (path: string) => ({ en: pageUrl('en', path), tc: pageUrl('tc', path), sc: pageUrl('sc', path) });

async function load3(f: PoliteFetcher, path: string, notes: Notes) {
  const out = {} as PerLang<cheerio.CheerioAPI>;
  for (const L of LANGS) {
    const u = pageUrl(L, path);
    const r = await f.get(u);
    if (r.status !== 200) notes.push(`FAILED ${u} -> ${r.status} ${r.error ?? ''}`);
    out[L] = cheerio.load(r.body || '<html></html>');
  }
  return out;
}

const loc = (fn: (L: Lang) => string | null | undefined): Localized => ({
  en: fn('en') || null,
  tc: fn('tc') || null,
  sc: fn('sc') || null,
});
const locList = (fn: (L: Lang) => string[]) => ({ en: fn('en'), tc: fn('tc'), sc: fn('sc') });
/** Text with <sub>/<sup> separated by a space (e.g. "Stephen<sub>JP</sub>" -> "Stephen JP"). */
const spacedText = ($: cheerio.CheerioAPI, el: Parameters<cheerio.CheerioAPI>[0]) => {
  const c = $(el).clone();
  c.find('sub,sup').each((_, x) => {
    $(x).replaceWith(' ' + $(x).text());
  });
  return line(c.text());
};

const paras = ($: cheerio.CheerioAPI, sel: string) =>
  $(sel)
    .toArray()
    .map((p) => line($(p).text()))
    .filter(Boolean);

// ------------------------------------------------------------------ financial highlights

export async function scrapeHighlights(f: PoliteFetcher, notes: Notes): Promise<FinancialHighlightsFile> {
  const $ = await load3(f, 'financial_highlight.php', notes);
  const rows = (L: Lang) =>
    $[L]('table.highlight-table tr')
      .toArray()
      .map((tr) => $[L](tr).find('th,td').toArray().map((c) => line($[L](c).text())));
  const R = { en: rows('en'), tc: rows('tc'), sc: rows('sc') };
  const header = R.en[0];
  const years = header.slice(1).map(Number);
  const out: FinancialHighlightsFile['rows'] = [];
  let group: Localized = { en: null, tc: null, sc: null };
  for (let i = 1; i < R.en.length; i++) {
    const cells = R.en[i];
    const isGroup = cells.slice(1).every((c) => !c);
    const label = loc((L) => R[L][i]?.[0]);
    if (isGroup) {
      group = label;
      continue;
    }
    const en = cells[0];
    const unit = /\(RMB cents\)|cents/i.test(en) ? 'rmb-cents' : cells.slice(1).some((c) => c.includes('%')) ? 'percent' : 'rmb-million';
    const values: Record<string, number | null> = {};
    const display: Record<string, string> = {};
    years.forEach((y, j) => {
      values[String(y)] = parseNumber(cells[j + 1] ?? '');
      display[String(y)] = cells[j + 1] ?? '';
    });
    // sanity: TC/SC values should match EN
    for (const L of ['tc', 'sc'] as const) {
      const other = R[L][i]?.slice(1).join('|');
      if (other !== cells.slice(1).join('|')) notes.push(`highlights row "${en}": ${L} values differ from EN (${other})`);
    }
    out.push({ key: slug(en.replace(/\(.*?\)/g, '')), group, label, unit, values, display });
  }
  return {
    generatedAt: now(),
    currencyNote: loc((L) => R[L][0]?.[0]),
    years,
    rows: out,
    sourceUrls: urls3('financial_highlight.php'),
  };
}

// ------------------------------------------------------------------ board & committees

const GROUPS: [RegExp, BoardFile['people'][number]['group']][] = [
  [/independent|獨立|独立/i, 'independent-non-executive-director'],
  [/non-executive|非執行|非执行/i, 'non-executive-director'],
  [/executive|執行|执行/i, 'executive-director'],
  [/secretary|秘書|秘书/i, 'company-secretary'],
  [/management|管理/i, 'senior-management'],
];
const groupOf = (h: string) => GROUPS.find(([re]) => re.test(h))?.[1] ?? 'senior-management';

export async function scrapeBoard(f: PoliteFetcher, notes: Notes): Promise<BoardFile> {
  const bod = await load3(f, 'about_bod.php', notes);
  const gov = await load3(f, 'about_gov.php', notes);
  const info = await load3(f, 'about_info.php', notes);

  type P = { id: string; group: string; name: string; nameZh: string | null; bio: string[] };
  const peopleBy = {} as PerLang<P[]>;
  for (const L of LANGS) {
    const $ = bod[L];
    const list: P[] = [];
    let group = '';
    $('.dir-content')
      .children()
      .each((_, el) => {
        const tag = (el as { tagName?: string }).tagName;
        if (tag === 'h3') group = line($(el).text());
        else if ($(el).hasClass('dir-desc'))
          list.push({
            id: $(el).attr('id') ?? '',
            group,
            name: spacedText($, $(el).find('h4').first()),
            nameZh: spacedText($, $(el).children('span').first()) || null,
            bio: paras($, `#${$(el).attr('id')} p`),
          });
      });
    peopleBy[L] = list;
  }
  // roles from Company Information "Board" block: "Mr. Ding Shizhong (Chairman)"
  const roleLines = (L: Lang) => {
    const $ = info[L];
    const lines: string[] = [];
    let h2 = 0;
    $('ul.info-list > li')
      .first()
      .children()
      .each((_, el) => {
        const tag = (el as { tagName?: string }).tagName;
        if (tag === 'h2') h2++;
        else if (tag === 'p' && h2 === 1) lines.push(...linesOf($, el));
      });
    return lines;
  };
  const RL = { en: roleLines('en'), tc: roleLines('tc'), sc: roleLines('sc') };
  const roleFor = (L: Lang, name: string) => {
    const core = name.replace(/^(mr|ms|mrs|dr)\.?\s+/i, '').replace(/(先生|女士|博士)$/, '').trim();
    const hit = RL[L].find((l) => l.includes(core) && /[（(]/.test(l));
    return hit ? (hit.match(/[（(]([^）)]+)[）)]/)?.[1] ?? null) : null;
  };

  const people: BoardFile['people'] = peopleBy.en.map((p, i) => {
    const other = (L: Lang) => peopleBy[L].find((x) => x.id === p.id) ?? peopleBy[L][i];
    return {
      id: slug(p.name.replace(/^(mr|ms|mrs|dr)\.?\s+/i, '').replace(/\s+JP$/, '')) || p.id,
      group: groupOf(p.group),
      name: loc((L) => other(L)?.name),
      nameZh: p.nameZh,
      roles: loc((L) => roleFor(L, other(L)?.name ?? '')),
      bio: locList((L) => other(L)?.bio ?? []),
      order: i,
    };
  });
  if (!['tc', 'sc'].every((L) => peopleBy[L as Lang].length === peopleBy.en.length))
    notes.push(`board: people count differs by language (en ${peopleBy.en.length}, tc ${peopleBy.tc.length}, sc ${peopleBy.sc.length})`);

  const findPerson = (L: Lang, raw: string) => {
    const core = raw.replace(/^(mr|ms|mrs|dr)\.?\s+/i, '').replace(/(先生|女士|博士)$/, '').trim();
    if (!core) return null;
    const p = people.find((x) => {
      const n = (x.name[L] ?? '').replace(/^(mr|ms|mrs|dr)\.?\s+/i, '').replace(/(先生|女士|博士)$/, '').trim();
      return n && (n === core || n.includes(core) || core.includes(n));
    });
    return p?.id ?? null;
  };

  type C = { name: string; members: { raw: string; name: string; chair: boolean; nonBoard: boolean }[]; tor: string | null };
  const commBy = {} as PerLang<C[]>;
  for (const L of LANGS) {
    const $ = gov[L];
    const list: C[] = [];
    $('ul.committee-list > li').each((_, li) => {
      const spans = $(li).find('.com-list > span').toArray();
      if (!spans.length) return;
      const members = spans
        .map((s) => line($(s).text()))
        .filter((t) => t && !/^\*/.test(t))
        .map((raw) => {
          const chair = /chairman|chairperson|主席/i.test(raw);
          const nonBoard = /\*$/.test(raw);
          const name = raw.replace(/[（(][^）)]*[）)]/g, '').replace(/\*+$/, '').trim();
          return { raw, name, chair, nonBoard };
        });
      const tor = $(li).find('a[href]').first().attr('href');
      list.push({ name: line($(li).find('h2').first().text()), members, tor: tor ? absUrl(tor, pageUrl(L, 'about_gov.php')) : null });
    });
    commBy[L] = list;
  }
  const committees: BoardFile['committees'] = commBy.en.map((c, i) => ({
    key: slug(c.name.replace(/committee/i, '')) || `committee-${i}`,
    name: loc((L) => commBy[L][i]?.name),
    members: c.members.map((m, j) => ({
      name: loc((L) => commBy[L][i]?.members[j]?.name),
      personId: findPerson('en', m.name),
      isChair: m.chair,
      nonBoardMember: m.nonBoard,
    })),
    termsOfReference: loc((L) => commBy[L][i]?.tor) as { en: string | null; tc: string | null; sc: string | null },
  }));

  return {
    generatedAt: now(),
    people,
    committees,
    governanceIntro: locList((L) => {
      const $ = gov[L];
      return $('.main-content > p')
        .toArray()
        .map((p) => line($(p).text()))
        .filter(Boolean);
    }),
    sourceUrls: { directors: urls3('about_bod.php'), governance: urls3('about_gov.php'), companyInfo: urls3('about_info.php') },
  };
}

// ------------------------------------------------------------------ IR calendar

export async function scrapeCalendar(f: PoliteFetcher, notes: Notes): Promise<CalendarFile> {
  type E = RawItem & { ics: string | null; attachments: { label: string; url: string }[] };
  const lists = {} as PerLang<E[]>;
  for (const L of LANGS) {
    const first = pageUrl(L, 'news_calendar.php');
    const r = await f.get(first);
    const $ = cheerio.load(r.body);
    const shown = $('.t-year span').first().text().trim();
    const years = [...new Set($('a[href^="?year="]').toArray().map((a) => $(a).attr('href')!.replace('?year=', '')))];
    const pages = [[first, r.body] as const];
    for (const y of years) {
      if (y === shown) continue;
      const u = `${first}?year=${y}`;
      const ry = await f.get(u);
      if (ry.status === 200) pages.push([u, ry.body] as const);
      else notes.push(`FAILED ${u} -> ${ry.status}`);
    }
    lists[L] = [];
    for (const [u, body] of pages) {
      const $p = cheerio.load(body);
      $p('tr').each((_, tr) => {
        const tds = $p(tr).find('td');
        if (tds.length < 2) return;
        const date = parseDotDate(line(tds.eq(0).text()));
        if (!date) return;
        const ics = tds.find('a[href*="downloadics"]').attr('href');
        const icsUrl = ics ? absUrl(ics, u) : null;
        const attachments = tds
          .eq(2)
          .find('a[href]')
          .toArray()
          .map((a) => ({ label: line($p(a).text()) || 'PDF', url: absUrl($p(a).attr('href')!, u)! }))
          .filter((a) => a.url);
        lists[L].push({ lang: L, date, title: line(tds.eq(1).text()), url: null, sourceUrl: u, key: icsUrl?.match(/id=(\d+)/)?.[1], ics: icsUrl, attachments });
      });
    }
  }
  const groups = mergeLangs(lists as PerLang<RawItem[]>);
  const events: CalendarFile['events'] = groups.map((g) => {
    const p = (g.en ?? g.tc ?? g.sc)! as E;
    const at = (L: Lang) => (g[L] as E | undefined)?.attachments ?? [];
    return {
      id: `${p.date}-${p.key ?? sha(p.title)}`,
      date: p.date!,
      year: Number(p.date!.slice(0, 4)),
      title: loc((L) => g[L]?.title),
      kind: classifyEvent(g.en?.title ?? g.tc?.title ?? ''),
      icsUrl: (g.en as E | undefined)?.ics ?? p.ics ?? null,
      attachments: at('en').map((a, i) => ({ label: loc((L) => at(L)[i]?.label ?? null), url: a.url })),
      sourceUrls: loc((L) => g[L]?.sourceUrl) as { en: string | null; tc: string | null; sc: string | null },
    };
  });
  events.sort((a, b) => b.date.localeCompare(a.date));
  return { generatedAt: now(), events };
}

// ------------------------------------------------------------------ FAQ

export async function scrapeFaq(f: PoliteFetcher, notes: Notes): Promise<FaqFile> {
  const $ = await load3(f, 'about_ir.php', notes);
  const items = (L: Lang) =>
    $[L]('ul.faq-list > li')
      .toArray()
      .map((li) => ({ q: line($[L](li).find('h4').first().text()), a: sanitizeHtml($[L](li).find('.faq-desc').html() ?? '', pageUrl(L, 'about_ir.php')) }));
  const I = { en: items('en'), tc: items('tc'), sc: items('sc') };
  if (I.tc.length !== I.en.length || I.sc.length !== I.en.length) notes.push(`faq: item count differs (en ${I.en.length}, tc ${I.tc.length}, sc ${I.sc.length})`);
  return {
    generatedAt: now(),
    items: I.en.map((it, i) => ({
      id: `faq-${String(i + 1).padStart(2, '0')}-${slug(it.q).slice(0, 40)}`,
      question: loc((L) => I[L][i]?.q),
      answerHtml: loc((L) => I[L][i]?.a),
      order: i,
    })),
    sourceUrls: urls3('about_ir.php'),
  };
}

// ------------------------------------------------------------------ contacts + company information

export async function scrapeContacts(f: PoliteFetcher, notes: Notes): Promise<ContactsFile> {
  const $c = await load3(f, 'contact.php', notes);
  const $i = await load3(f, 'about_info.php', notes);
  const $a = await load3(f, 'contact_alert.php', notes);

  type O = { address: string; postcode: string | null; phones: string[]; fax: string[]; map: string | null };
  const officesBy = {} as PerLang<O[]>;
  const emailsBy = {} as PerLang<{ label: string; email: string }[]>;
  for (const L of LANGS) {
    const $ = $c[L];
    const offices: O[] = [];
    const emails: { label: string; email: string }[] = [];
    $('.contact-list tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length !== 2) return;
      const label = line(tds.eq(0).text()).replace(/[:：]\s*$/, '');
      const valueLines = linesOf($, tds.eq(1));
      const value = valueLines.join(' ');
      const email = value.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/);
      if (email) {
        emails.push({ label, email: email[0] });
        return;
      }
      if (/^(add|address|地址)$/i.test(label)) {
        offices.push({ address: value, postcode: null, phones: [], fax: [], map: tds.eq(1).find('a[href]').attr('href') ?? null });
        return;
      }
      const cur = offices[offices.length - 1];
      if (!cur) return;
      if (/post|郵編|邮编|郵政|邮政/i.test(label)) cur.postcode = value;
      else if (/tel|電話|电话/i.test(label)) cur.phones.push(...valueLines);
      else if (/fax|傳真|传真/i.test(label)) cur.fax.push(...valueLines);
    });
    // emails follow the table as "Label:<br><a href="mailto:…">…</a>"
    const tail = ($('.contact-list .c1').html() ?? $('.contact-list').html() ?? '').split(/<\/table>/i).pop() ?? '';
    const parts = tail
      .split(/<br\s*\/?>/i)
      .map((frag) => line(cheerio.load(`<x>${frag}</x>`, null, false)('x').text()))
      .filter(Boolean);
    let pending = '';
    for (const part of parts) {
      const m = part.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/);
      if (m) {
        emails.push({ label: pending.replace(/[:：]\s*$/, '') || 'Email', email: m[0] });
        pending = '';
      } else pending = part;
    }
    officesBy[L] = offices;
    emailsBy[L] = emails;
  }

  // Company information sections (h2 + p blocks), merged by position
  type S = { heading: string; blocks: string[][] };
  const secBy = {} as PerLang<S[]>;
  for (const L of LANGS) {
    const $ = $i[L];
    const secs: S[] = [];
    $('ul.info-list > li')
      .children()
      .each((_, el) => {
        const tag = (el as { tagName?: string }).tagName;
        if (tag === 'h2') secs.push({ heading: line($(el).text()), blocks: [] });
        else if (tag === 'p' && secs.length) {
          const ls = linesOf($, el);
          if (ls.length) secs[secs.length - 1].blocks.push(ls);
        }
      });
    secBy[L] = secs;
  }
  const companyInfo = secBy.en.map((s, i) => ({
    key: slug(s.heading) || `section-${i}`,
    heading: loc((L) => secBy[L][i]?.heading),
    blocks: s.blocks.map((_, j) => locList((L) => secBy[L][i]?.blocks[j] ?? [])),
  }));

  // office names: match each contact-page office to a Company Information block sharing its digits (postcode / street numbers)
  const digits = (s: string) => new Set(s.match(/\d+/g) ?? []);
  const officeBlocks = companyInfo.filter((s) => /office|business|辦|办|營業|营业/i.test(s.heading.en ?? '')).flatMap((s) => s.blocks);
  const offices: ContactsFile['offices'] = officesBy.en.map((o, i) => {
    const d = digits(o.address + ' ' + (o.postcode ?? ''));
    let best: (typeof officeBlocks)[number] | null = null;
    let score = 0;
    for (const b of officeBlocks) {
      const bd = digits(b.en.join(' '));
      const s = [...d].filter((x) => bd.has(x)).length;
      if (s > score) {
        score = s;
        best = b;
      }
    }
    const name = loc((L) => best?.[L]?.[0] ?? null);
    const key = slug(name.en ?? `office-${i}`).replace(/-office$/, '') || `office-${i}`;
    return {
      key,
      name,
      address: loc((L) => officesBy[L][i]?.address),
      postcode: o.postcode,
      phones: o.phones,
      fax: o.fax,
      mapUrl: o.map,
    };
  });
  if (!offices.every((o) => o.name.en)) notes.push('contacts: could not name every office from Company Information');

  const iframeSrc = (doc: PerLang<cheerio.CheerioAPI>, L: Lang) => doc[L]('iframe').first().attr('src') ?? '';
  return {
    generatedAt: now(),
    offices,
    emails: emailsBy.en.map((e, i) => ({
      key: /investor|ir\b/i.test(e.label) ? 'investor-relations' : /general/i.test(e.label) ? 'general' : slug(e.label),
      label: loc((L) => emailsBy[L][i]?.label),
      email: e.email,
    })),
    companyInfo,
    vendorForms: {
      enquiryFormUrl: Object.fromEntries(LANGS.map((L) => [L, iframeSrc($c, L)])) as Record<Lang, string>,
      emailAlertUrl: Object.fromEntries(LANGS.map((L) => [L, iframeSrc($a, L)])) as Record<Lang, string>,
    },
    sourceUrls: { contact: urls3('contact.php'), companyInfo: urls3('about_info.php'), emailAlert: urls3('contact_alert.php') },
  };
}

// ------------------------------------------------------------------ brands

export async function scrapeBrands(f: PoliteFetcher, notes: Notes): Promise<BrandsFile> {
  const $ = await load3(f, 'brand.php', notes);
  type B = { id: string; name: string; pillar: 'in-house' | 'strategic-investment'; desc: string[]; links: { label: string; url: string }[]; logo: string | null; image: string | null };
  const by = {} as PerLang<B[]>;
  const intro = {} as PerLang<{ overview: string[]; inHouse: string[]; strategic: string[] }>;
  for (const L of LANGS) {
    const d = $[L];
    const page = pageUrl(L, 'brand.php');
    const list: B[] = [];
    d('ul.brand-overview-list').each((ui, ul) => {
      d(ul)
        .find('a[id^="b"]')
        .each((_, anchor) => {
          const box = d(anchor).nextAll('.content-list').first();
          const links = box
            .find('p.link span')
            .toArray()
            .map((s) => {
              const a = d(s).find('a[href]').first();
              return { label: line(d(s).clone().children('a').remove().end().text()).replace(/[:：]\s*$/, ''), url: absUrl(a.attr('href') ?? '', page) ?? '' };
            })
            .filter((x) => x.url);
          const logo = box.find('.img img').attr('src');
          const img = box.find('.brand-img img').attr('src');
          list.push({
            id: d(anchor).attr('id')!,
            name: line(box.find('h6').first().text()),
            pillar: ui === 0 ? 'in-house' : 'strategic-investment',
            desc: box
              .find('.p1 p')
              .not('.link')
              .toArray()
              .map((p) => line(d(p).text()))
              .filter(Boolean),
            links,
            logo: logo ? absUrl(logo, page) : null,
            image: img ? absUrl(img, page) : null,
          });
        });
    });
    by[L] = list;
    // intro paragraphs: p.link directly under the main container, in order: overview, in-house, strategic
    const ps = d('.main-content > p.link, #article > .main-content > p.link').toArray().map((p) => line(d(p).text())).filter(Boolean);
    intro[L] = { overview: ps.slice(0, 1), inHouse: ps.slice(1, 2), strategic: ps.slice(2, 3) };
  }
  if (!by.en.length) notes.push('brands: no brands parsed (layout changed?)');
  const brands: BrandsFile['brands'] = by.en.map((b, i) => {
    const o = (L: Lang) => by[L].find((x) => x.id === b.id);
    return {
      key: slug(b.name) || b.id,
      name: b.name,
      pillar: b.pillar,
      description: locList((L) => o(L)?.desc ?? []),
      links: b.links.map((l, j) => ({ label: loc((L) => o(L)?.links[j]?.label ?? null), url: l.url })),
      logo: b.logo ? { src: '', sourceUrl: b.logo } : null, // src filled in by the assets stage
      image: b.image ? { src: '', sourceUrl: b.image } : null,
      order: i,
    };
  });
  return {
    generatedAt: now(),
    intro: {
      overview: locList((L) => intro[L].overview),
      inHouse: locList((L) => intro[L].inHouse),
      strategic: locList((L) => intro[L].strategic),
    },
    brands,
    sourceUrls: urls3('brand.php'),
  };
}

// ------------------------------------------------------------------ company profile, chairman, communications, AGM, ESG

export async function scrapeCompany(f: PoliteFetcher, notes: Notes): Promise<CompanyFile> {
  const about = await load3(f, 'about.php', notes);
  const chair = await load3(f, 'about_chairman.php', notes);
  const comm = await load3(f, 'about_communications.php', notes);
  const gm = await load3(f, 'news_gm.php', notes);
  const home = await load3(f, 'index.php', notes);

  const ldName = (L: Lang) => {
    try {
      const raw = home[L]('script[type="application/ld+json"]').first().text();
      return (JSON.parse(raw) as { name?: string }).name ?? null;
    } catch {
      notes.push(`company: JSON-LD on ${L} home page is not valid JSON; legal name taken from fallback`);
      return null;
    }
  };
  const fallbackName = { en: 'ANTA Sports Products Limited', tc: '安踏體育用品有限公司', sc: '安踏体育用品有限公司' };

  const gmLinks = (L: Lang) =>
    gm[L]('ul.news_gm_ul li')
      .toArray()
      .map((li) => {
        const a = gm[L](li).find('a[href]').first();
        return { label: line(gm[L](li).text()), url: a.attr('href') ? absUrl(a.attr('href')!, pageUrl(L, 'news_gm.php')) : null };
      });
  const G = { en: gmLinks('en'), tc: gmLinks('tc'), sc: gmLinks('sc') };

  const homeLink = (L: Lang, sel: string, fallback: string) => home[L](sel).first().attr('href') ?? fallback;

  const profileText = paras(about.en, '.about-txt p').join(' ');
  const codes = [...new Set(profileText.match(/\b(2020|82020)\b/g) ?? [])];
  if (!codes.includes('2020')) notes.push('company: stock code 2020 not found in profile text');

  return {
    generatedAt: now(),
    legalName: loc((L) => ldName(L) ?? fallbackName[L]),
    stockCodes: [
      { code: '2020', counter: 'HKD', exchange: 'HKEX' },
      { code: '82020', counter: 'RMB', exchange: 'HKEX' },
    ],
    slogan: loc((L) => (L === 'en' ? line(home.en('.b-info i').first().text()) : line(home[L]('.b-info span').first().text()))),
    profile: locList((L) => paras(about[L], '.about-txt p')),
    chairmanMessage: {
      paragraphs: locList((L) => paras(chair[L], '.about-chairman-detail > p')),
      signature: locList((L) =>
        chair[L]('.about-chairman-detail .sign p')
          .children()
          .toArray()
          .map((c) => line(chair[L](c).text()))
          .filter(Boolean),
      ),
    },
    corporateCommunications: locList((L) => paras(comm[L], '.about-chairman-detail > p')),
    agm: {
      intro: locList((L) => paras(gm[L], '.news > p')),
      links: G.en.map((_, i) => ({
        label: loc((L) => G[L][i]?.label),
        url: loc((L) => G[L][i]?.url) as { en: string | null; tc: string | null; sc: string | null },
      })),
    },
    esg: {
      siteUrl: Object.fromEntries(LANGS.map((L) => [L, homeLink(L, '.home-about a.more', `https://esg.anta.com/${L}/index`)])) as Record<Lang, string>,
      reportsUrl: Object.fromEntries(LANGS.map((L) => [L, homeLink(L, '.home-highlights a.more', `https://esg.anta.com/${L}/esgreports`)])) as Record<Lang, string>,
    },
    sourceUrls: {
      profile: urls3('about.php'),
      chairman: urls3('about_chairman.php'),
      communications: urls3('about_communications.php'),
      agm: urls3('news_gm.php'),
      home: urls3('index.php'),
    },
  };
}
