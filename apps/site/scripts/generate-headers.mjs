import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templatePath = resolve(appRoot, 'scripts', '_headers.template');
const outputPath = resolve(appRoot, 'public', '_headers');
const url = process.env.NEXT_PUBLIC_OPENPANEL_URL;
const clientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;

function parseOrigin(value) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_OPENPANEL_URL must be a valid origin.');
  }

  if (
    parsed.origin === 'null' ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(
      'NEXT_PUBLIC_OPENPANEL_URL must be an origin without a path, query, or fragment.',
    );
  }

  return parsed.origin;
}

const template = await readFile(templatePath, 'utf8');
const origin = url ? parseOrigin(url) : null;
const headers =
  origin && clientId
    ? template
        .replace("script-src 'self' 'unsafe-inline'", `script-src 'self' 'unsafe-inline' ${origin}`)
        .replace("connect-src 'self'", `connect-src 'self' ${origin}`)
    : template;

await writeFile(outputPath, headers);
