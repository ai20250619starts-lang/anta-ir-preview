// One-off: seed the HTTP cache with EN pages already captured during the audit (same day), so they are not refetched.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { PoliteFetcher } from './http.ts';
import { BASE } from './config.ts';

const raw = 'audit/raw';
const f = new PoliteFetcher();
const map: Record<string, string> = {};
for (const file of readdirSync(raw)) {
  const m = file.match(/^en_([a-z_]+\.php)$/);
  if (m) map[`${BASE}/en/${m[1]}`] = `${raw}/${file}`;
  const t = file.match(/^(tc|sc)_index\.php$/);
  if (t) map[`${BASE}/${t[1]}/index.php`] = `${raw}/${file}`;
}
map[`${BASE}/en/index.php`] = `${raw}/en.html`;
if (existsSync(`${raw}/years`))
  for (const file of readdirSync(`${raw}/years`)) {
    const m = file.match(/^(news|press)_(\d{4})\.html$/);
    if (m) map[`${BASE}/en/${m[1] === 'news' ? 'news' : 'news_press'}.php?year=${m[2]}`] = `${raw}/years/${file}`;
  }
let n = 0;
for (const [url, file] of Object.entries(map)) if (f.seed(url, readFileSync(file, 'utf8'))) n++;
console.log(`seeded ${n} cached pages from ${raw}`);
