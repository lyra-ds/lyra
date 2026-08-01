import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(siteRoot, '../..');

export const sourcePaths = {
  baseline: resolve(repoRoot, 'tools/parity/baseline.json'),
  props: resolve(repoRoot, 'tools/docgen/output/props.json'),
  brand: resolve(repoRoot, 'packages/styles/tokens/brand.css'),
};
export const outputPath = resolve(siteRoot, 'lib/generated/stats.json');
const primitiveTokenPattern = /^--(?:amber|blue|green|indigo|night|red|slate)-\d+$/;
const brandInputPattern = /var\((--brand(?:-contrast|-radius|-font)?)/g;

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected ${label} to be a positive integer; received ${value}.`);
  }

  return value;
}

function countBrandInputs(brandCss) {
  const inputs = new Set();

  for (const match of brandCss.matchAll(brandInputPattern)) {
    inputs.add(match[1]);
  }

  return requirePositiveInteger(inputs.size, 'white-label input count');
}

export async function deriveStats({ sources = sourcePaths, destination = outputPath } = {}) {
  const [baselineRaw, propsRaw, brandCss] = await Promise.all([
    readFile(sources.baseline, 'utf8'),
    readFile(sources.props, 'utf8'),
    readFile(sources.brand, 'utf8'),
  ]);
  const baseline = JSON.parse(baselineRaw);
  const props = JSON.parse(propsRaw);
  const tokenNames = Object.keys(baseline.tokens?.byName ?? {});
  const palettePrimitives = tokenNames.filter((name) => primitiveTokenPattern.test(name));
  const stats = {
    tokenDeclarations: requirePositiveInteger(baseline.tokens?.declarations, 'token declarations'),
    tokenNames: requirePositiveInteger(tokenNames.length, 'unique token names'),
    palettePrimitives: requirePositiveInteger(palettePrimitives.length, 'palette primitives'),
    semanticTokens: requirePositiveInteger(
      tokenNames.length - palettePrimitives.length,
      'semantic token count',
    ),
    cssClasses: requirePositiveInteger(baseline.classes?.count, 'CSS class count'),
    documentedComponents: requirePositiveInteger(props.length, 'documented component count'),
    whiteLabelInputs: countBrandInputs(brandCss),
  };

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(stats, null, 2)}\n`);

  return stats;
}

await deriveStats();
