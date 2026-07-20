// Assert the RSC `"use client";` directive is the first line of every emitted JS/CJS
// bundle (Pitfall 3 suspenders — belt is the tsup onSuccess prepend in tsup.config.ts).
//
// Next.js App Router consumers need this directive; bundlers strip source-file directives
// unpredictably, so the build re-verifies it survived to dist. This is dist-specific (the
// @lyra-ds/react package output); the 03-09 scratch-fixture bundle is a consumer app build
// and is NOT subject to this rule — only the shared no-cdn-scan.mjs is reused there.
//
// Usage: node tools/dist-scan/assert-use-client.mjs <dir>
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIRECTIVE = /^\s*["']use client["']/;

const dir = process.argv[2];
if (!dir) {
  console.error('assert-use-client: a target directory is required');
  process.exit(2);
}

let files;
try {
  files = readdirSync(dir).filter((f) => f.endsWith('.js') || f.endsWith('.cjs'));
} catch (err) {
  console.error(`assert-use-client: cannot read "${dir}": ${err.message}`);
  process.exit(2);
}

const missing = files.filter((f) => !DIRECTIVE.test(readFileSync(join(dir, f), 'utf8')));

if (missing.length > 0) {
  console.error('assert-use-client FAILED — missing "use client" directive:');
  for (const f of missing) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log(`assert-use-client OK: all ${files.length} JS/CJS files in ${dir} carry the directive`);
