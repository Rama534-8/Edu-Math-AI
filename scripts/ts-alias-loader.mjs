/**
 * Minimal ESM resolve hook so the validator can load the Next.js sources
 * directly under plain Node. Maps the "@/" alias onto ./src and adds the
 * implicit ".ts" / "/index.ts" extensions that bundlers normally provide.
 */
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(import.meta.dirname, '..');

function firstExistingFile(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  return candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const hit = firstExistingFile(path.join(ROOT, 'src', specifier.slice(2)));
    if (hit) return nextResolve(pathToFileURL(hit).href, context);
  }

  if (specifier.startsWith('.')) {
    const parentDir = context.parentURL?.startsWith('file:')
      ? path.dirname(fileURLToPath(context.parentURL))
      : ROOT;
    const hit = firstExistingFile(path.resolve(parentDir, specifier));
    if (hit) return nextResolve(pathToFileURL(hit).href, context);
  }

  return nextResolve(specifier, context);
}