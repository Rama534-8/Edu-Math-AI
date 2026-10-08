/**
 * Regenerate src/lib/curriculum/cbse-seed.ts from the syllabus tables.
 *
 *   node scripts/build-all.mjs
 *
 * Edit scripts/cbse-data.mjs / scripts/ap-data.mjs (the source tables) rather
 * than the generated seed files.
 */
import { build as buildCbse } from './build-cbse.mjs';
import { build as buildAp } from './build-ap.mjs';
import { CBSE_CHAPTERS } from './cbse-data.mjs';
import { AP_CHAPTERS } from './ap-data.mjs';

buildCbse(CBSE_CHAPTERS);
buildAp(AP_CHAPTERS);