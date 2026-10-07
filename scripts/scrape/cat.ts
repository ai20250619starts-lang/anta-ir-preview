// Dev helper: print a cached response body (offline; never hits the network).
import { PoliteFetcher } from './http.ts';
const f = new PoliteFetcher({ offline: true });
const r = await f.get(process.argv[2]);
process.stdout.write(r.body);
