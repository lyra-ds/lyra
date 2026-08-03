import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';

const appRoot = resolve(import.meta.dirname, '..');
const templatePath = resolve(appRoot, 'scripts', '_headers.template');
const headerPath = resolve(appRoot, 'public', '_headers');
const generatorPath = resolve(appRoot, 'scripts', 'generate-headers.mjs');
const analyticsPath = resolve(appRoot, 'components', 'consent-analytics.tsx');
const configuredOrigin = 'https://metrics.example.test';

function generate(environment = {}) {
  const env = { ...process.env, ...environment };
  if (!('NEXT_PUBLIC_OPENPANEL_URL' in environment)) delete env.NEXT_PUBLIC_OPENPANEL_URL;
  if (!('NEXT_PUBLIC_OPENPANEL_CLIENT_ID' in environment))
    delete env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;

  return spawnSync(process.execPath, [generatorPath], { encoding: 'utf8', env });
}

test('unconfigured headers are byte-identical to the committed template', () => {
  const result = generate();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readFileSync(headerPath), readFileSync(templatePath));
});

test('configured headers allow the OpenPanel origin only for scripts and connections', () => {
  const result = generate({
    NEXT_PUBLIC_OPENPANEL_URL: configuredOrigin,
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID: 'test-client',
  });
  assert.equal(result.status, 0, result.stderr);

  const headers = readFileSync(headerPath, 'utf8');
  assert.match(headers, new RegExp(`script-src 'self' 'unsafe-inline' ${configuredOrigin}`));
  assert.match(headers, new RegExp(`connect-src 'self' ${configuredOrigin}`));
  assert.equal(headers.split(configuredOrigin).length - 1, 2);
});

test('a malformed configured OpenPanel URL fails the build', () => {
  const result = generate({
    NEXT_PUBLIC_OPENPANEL_URL: 'not an origin',
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID: 'test-client',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NEXT_PUBLIC_OPENPANEL_URL must be a valid origin/);
});

test('the consent owner loads OpenPanel once after all consent without replay or identification', () => {
  const source = readFileSync(analyticsPath, 'utf8');

  assert.match(source, /useState<Consent \| null>\(\(\) => readConsent\(\)\)/);
  assert.match(source, /consent === 'all' && mayLoadAnalytics\(\)/);
  assert.match(source, /onAccept=\{\(\) => setConsent\('all'\)\}/);
  assert.match(source, /onEssentials=\{\(\) => setConsent\('essentials'\)\}/);
  assert.match(source, /const \[shouldLoadOpenPanel, setShouldLoadOpenPanel\] = useState\(false\)/);
  assert.match(source, /if \(!canLoad \|\| !openPanelOrigin \|\| initialized\.current\) return/);
  assert.match(source, /window\.op \|\|\s+function \(\.\.\.args: OpenPanelCommand\)/);
  assert.match(source, /\(op\.q = op\.q \|\| \[\]\)\.push\(args\)/);
  assert.match(source, /window\.op = op/);
  assert.match(source, /op\('init', \{/);
  assert.match(source, /setShouldLoadOpenPanel\(true\)/);
  assert.match(source, /canLoad && openPanelOrigin && shouldLoadOpenPanel/);
  assert.match(source, /id="openpanel"/);
  assert.match(source, /src=\{`\$\{openPanelOrigin\}\/op1\.js`\}/);
  assert.match(source, /apiUrl: `\$\{openPanelOrigin\}\/api`/);
  assert.match(source, /sessionReplay: \{ enabled: false \}/);
  assert.match(source, /trackScreenViews: true/);
  assert.match(source, /initialized\.current/);
  assert.doesNotMatch(source, /onLoad=/);
  assert.doesNotMatch(source, /identify|trackOutgoingLinks|trackAttributes/);
});

test('restores unconfigured headers for subsequent local commands', () => {
  const result = generate();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readFileSync(headerPath), readFileSync(templatePath));
});
