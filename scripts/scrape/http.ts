import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CACHE_DIR, DELAY_MS, JITTER_MS, MAX_RETRIES, TIMEOUT_MS, USER_AGENT } from './config.ts';

export interface CachedResponse {
  url: string;
  method: 'GET' | 'HEAD';
  status: number; // 0 = network error (never cached)
  finalUrl?: string;
  contentType?: string;
  contentLength?: number | null;
  fetchedAt: string;
  fromCache: boolean;
  body: string;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sequential, rate-limited fetcher with a resumable on-disk cache.
 * - every network request waits until DELAY_MS (+ jitter) has passed since the previous one
 * - responses (including 4xx/5xx) are cached by method+URL; page GET network errors are not cached (re-runs retry them); link-check network errors are cached unless --recheck-errors
 * - offline mode never touches the network
 */
export class PoliteFetcher {
  private last = 0;
  stats = { network: 0, cacheHits: 0, errors: 0 };
  /** Every GET URL requested this run (cache hits included), for internal-link discovery. */
  visited = new Set<string>();
  constructor(private opts: { offline?: boolean; recheckErrors?: boolean; log?: (s: string) => void } = {}) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  private key(method: string, url: string) {
    return createHash('sha1').update(`${method} ${url}`).digest('hex');
  }

  private paths(method: string, url: string) {
    const k = this.key(method, url);
    return { meta: join(CACHE_DIR, `${k}.json`), body: join(CACHE_DIR, `${k}.body`) };
  }

  hasCachedCheck(url: string) {
    return existsSync(this.paths('CHECK', url).meta);
  }

  hasCached(url: string, method: 'GET' | 'HEAD' = 'GET') {
    return existsSync(this.paths(method, url).meta);
  }

  /** Seed the cache from a file captured earlier (e.g. the audit run), to avoid refetching identical pages. */
  seed(url: string, body: string, status = 200) {
    const p = this.paths('GET', url);
    if (existsSync(p.meta)) return false;
    writeFileSync(p.body, body);
    writeFileSync(p.meta, JSON.stringify({ url, method: 'GET', status, fetchedAt: new Date().toISOString(), seeded: true }, null, 1));
    return true;
  }

  async get(url: string) {
    this.visited.add(url);
    return this.request(url, 'GET');
  }

  /** Binary download (small public assets only), cached as raw bytes. */
  async getBinary(url: string): Promise<{ status: number; bytes: Buffer | null; fromCache: boolean; contentType?: string }> {
    const p = this.paths('BIN', url);
    if (existsSync(p.meta)) {
      this.stats.cacheHits++;
      const meta = JSON.parse(readFileSync(p.meta, 'utf8'));
      return { status: meta.status, contentType: meta.contentType, bytes: existsSync(p.body) ? readFileSync(p.body) : null, fromCache: true };
    }
    if (this.opts.offline) return { status: 0, bytes: null, fromCache: false };
    const wait = this.last + DELAY_MS + Math.random() * JITTER_MS - Date.now();
    if (wait > 0) await sleep(wait);
    this.last = Date.now();
    this.stats.network++;
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow', signal: ctl.signal });
      const bytes = Buffer.from(await res.arrayBuffer());
      clearTimeout(t);
      if (res.ok) writeFileSync(p.body, bytes);
      const meta = { url, status: res.status, contentType: res.headers.get('content-type') ?? undefined, fetchedAt: new Date().toISOString() };
      writeFileSync(p.meta, JSON.stringify(meta, null, 1));
      this.opts.log?.(`BIN ${res.status} ${url}`);
      return { status: res.status, contentType: meta.contentType, bytes: res.ok ? bytes : null, fromCache: false };
    } catch (e) {
      this.stats.errors++;
      return { status: 0, bytes: null, fromCache: false };
    }
  }
  async head(url: string) {
    return this.request(url, 'HEAD');
  }

  /**
   * Link check: HEAD, falling back to a 1-byte ranged GET (body discarded) when HEAD is refused.
   * Cached under its own key, so re-runs don't re-check. Never downloads whole files.
   */
  async check(url: string): Promise<{ status: number; ok: boolean; sizeBytes: number | null; checkedAt: string; fromCache: boolean; error?: string }> {
    const p = this.paths('CHECK', url);
    if (existsSync(p.meta)) {
      const cached = JSON.parse(readFileSync(p.meta, 'utf8'));
      // network-error results are cached too (so re-runs don't spend ~20 s per dead host); --recheck-errors retries them
      if (!(cached.status === 0 && this.opts.recheckErrors && !this.opts.offline)) {
        this.stats.cacheHits++;
        return { ...cached, fromCache: true };
      }
    }
    if (this.opts.offline) return { status: 0, ok: false, sizeBytes: null, checkedAt: '', fromCache: false, error: 'offline: not in cache' };
    const attempt = async (method: 'HEAD' | 'GET') => {
      const wait = this.last + DELAY_MS + Math.random() * JITTER_MS - Date.now();
      if (wait > 0) await sleep(wait);
      this.last = Date.now();
      this.stats.network++;
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          method,
          redirect: 'follow',
          signal: ctl.signal,
          headers: { 'User-Agent': USER_AGENT, ...(method === 'GET' ? { Range: 'bytes=0-0' } : {}) },
        });
        await res.body?.cancel().catch(() => {});
        const cr = res.headers.get('content-range')?.match(/\/(\d+)$/)?.[1];
        const cl = res.headers.get('content-length');
        const size = cr ? Number(cr) : method === 'HEAD' && cl ? Number(cl) : null;
        return { status: res.status, size: size && size > 0 ? size : null, error: undefined as string | undefined };
      } catch (e) {
        return { status: 0, size: null, error: (e as Error).message };
      } finally {
        clearTimeout(t);
      }
    };
    let r = await attempt('HEAD');
    if ([0, 403, 405, 501].includes(r.status)) r = await attempt('GET');
    const out = { url, status: r.status, ok: r.status >= 200 && r.status < 400, sizeBytes: r.size, checkedAt: new Date().toISOString(), error: r.error };
    writeFileSync(p.meta, JSON.stringify(out, null, 1));
    if (r.status === 0) this.stats.errors++;
    this.opts.log?.(`CHECK ${r.status} ${url}`);
    return { ...out, fromCache: false };
  }

  async request(url: string, method: 'GET' | 'HEAD'): Promise<CachedResponse> {
    const p = this.paths(method, url);
    if (existsSync(p.meta)) {
      const meta = JSON.parse(readFileSync(p.meta, 'utf8'));
      this.stats.cacheHits++;
      return { ...meta, fromCache: true, body: existsSync(p.body) ? readFileSync(p.body, 'utf8') : '' };
    }
    if (this.opts.offline) {
      return { url, method, status: 0, fetchedAt: '', fromCache: false, body: '', error: 'offline: not in cache' };
    }
    let lastErr = '';
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const wait = this.last + DELAY_MS + Math.random() * JITTER_MS - Date.now();
      if (wait > 0) await sleep(wait);
      this.last = Date.now();
      this.stats.network++;
      try {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
        const res = await fetch(url, {
          method,
          redirect: 'follow',
          signal: ctl.signal,
          headers: { 'User-Agent': USER_AGENT, Accept: method === 'HEAD' ? '*/*' : 'text/html,*/*;q=0.8' },
        });
        // keep the abort timer running while the body downloads (a stalled body must not hang the crawl)
        const body = method === 'GET' ? await res.text() : '';
        clearTimeout(t);
        const len = res.headers.get('content-length');
        const meta = {
          url,
          method,
          status: res.status,
          finalUrl: res.url,
          contentType: res.headers.get('content-type') ?? undefined,
          contentLength: len ? Number(len) : null,
          fetchedAt: new Date().toISOString(),
        };
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          lastErr = `HTTP ${res.status}`;
          await sleep(DELAY_MS * (attempt + 2));
          continue;
        }
        writeFileSync(p.body, body);
        writeFileSync(p.meta, JSON.stringify(meta, null, 1));
        this.opts.log?.(`${method} ${res.status} ${url}`);
        return { ...meta, fromCache: false, body };
      } catch (e) {
        lastErr = (e as Error).message;
        this.opts.log?.(`${method} ERR ${url} ${lastErr}`);
        await sleep(DELAY_MS * (attempt + 2));
      }
    }
    this.stats.errors++;
    return { url, method, status: 0, fetchedAt: new Date().toISOString(), fromCache: false, body: '', error: lastErr };
  }
}
