// Dev helper: fetch a single URL through the polite cache and print a snippet.
import { PoliteFetcher } from './http.ts';
const f = new PoliteFetcher({ log: console.error });
for (const u of process.argv.slice(2)) {
  const r = await f.get(u);
  console.log(`== ${r.status} ${r.fromCache ? '(cache)' : '(net)'} ${u} ${r.body.length}B`);
}
