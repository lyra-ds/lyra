import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  brotliBytes,
  installPackedArtifacts,
  measureScenario,
  summarizeAssets,
} from './measure.mjs';

const toolDirectory = dirname(fileURLToPath(import.meta.url));

test('brotliBytes is deterministic and uses text input', () => {
  assert.equal(brotliBytes('export const value = 1;'), brotliBytes('export const value = 1;'));
});

test('summarizeAssets keeps JavaScript and CSS separate', () => {
  assert.deepEqual(
    Object.keys(
      summarizeAssets([
        { fileName: 'entry.js', source: 'export{}' },
        { fileName: 'style.css', source: ':root{}' },
      ]),
    ),
    ['javascript', 'css'],
  );
});

test('measureScenario builds a CSS library entry', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const entry = join(fixture, 'entry.css');
    writeFileSync(entry, ':root { --accent: blue; }\n');

    const result = await measureScenario({ entry, name: 'css-entry', root: fixture });

    assert.ok(result.assets.css.rawBytes > result.assets.css.minifiedBytes);
    assert.ok(result.assets.css.brotliBytes > 0);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('measureScenario keeps the React JSX runtime external', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const entry = join(fixture, 'entry.ts');
    const button = pathToFileURL(
      join(toolDirectory, '..', '..', 'packages', 'react', 'dist', 'button.js'),
    ).href;
    writeFileSync(entry, `export { Button } from '${button}';\n`);
    const result = await measureScenario({ entry, name: 'button', root: fixture });

    assert.ok(
      result.modules.every(({ module }) => !module.includes('react-jsx-runtime.development.js')),
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('changed Lyra tarballs install independently of the external lock', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const packageDirectory = join(fixture, 'package-source');
    const packDirectory = join(fixture, 'packed');
    mkdirSync(packageDirectory);
    mkdirSync(packDirectory);
    writeFileSync(
      join(packageDirectory, 'package.json'),
      `${JSON.stringify({ name: '@lyra-ds/react', version: '9.9.9', exports: './index.js' })}\n`,
    );
    writeFileSync(join(packageDirectory, 'index.js'), "export const artifactMarker = 'changed';\n");
    const packed = spawnSync('npm', ['pack', '--pack-destination', packDirectory], {
      cwd: packageDirectory,
      encoding: 'utf8',
    });
    assert.equal(packed.status, 0, packed.stderr);
    const tarball = join(packDirectory, readdirSync(packDirectory)[0]);

    installPackedArtifacts(fixture, { react: tarball });

    const installed = join(fixture, 'node_modules', '@lyra-ds', 'react');
    assert.equal(
      JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version,
      '9.9.9',
    );
    assert.match(readFileSync(join(installed, 'index.js'), 'utf8'), /artifactMarker = 'changed'/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
