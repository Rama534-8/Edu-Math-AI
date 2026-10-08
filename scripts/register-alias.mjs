/**
 * Registers the "@/" alias resolve hook for plain Node.
 *
 * The hook itself only *defines* a resolve function, so passing
 * `ts-alias-loader.mjs` to `node --import` does nothing. This module registers it:
 *
 *   node --experimental-strip-types --import ./scripts/register-alias.mjs <script>
 *
 * Verification scripts that import Next.js sources through the "@/" alias should
 * either run that command or call `register('./ts-alias-loader.mjs', ...)` inline.
 * Note: `src/lib/db/index.ts` deliberately avoids "@/" so it also loads without
 * this hook.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const here = import.meta.dirname;
register('./ts-alias-loader.mjs', pathToFileURL(path.join(here, '/')));

export { pathToFileURL };