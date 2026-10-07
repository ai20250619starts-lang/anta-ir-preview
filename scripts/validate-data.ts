// `npm run validate` — schema + integrity validation of /data (also runs at the start of `npm run build`).
import { validateAll } from '../src/data/validate.ts';
const { errors, warnings, parsed } = validateAll();
for (const w of warnings) console.warn(`warning  ${w.file}: ${w.message}`);
for (const e of errors) console.error(`ERROR    ${e.file}: ${e.message}`);
console.log(`validate: ${Object.keys(parsed).length} files parsed, ${errors.length} errors, ${warnings.length} warnings`);
if (errors.length) process.exit(1);
