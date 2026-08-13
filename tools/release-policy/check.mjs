import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [changesetsText, versioning, contributing, releaseWorkflow] = await Promise.all([
  readFile('.changeset/config.json', 'utf8'),
  readFile('VERSIONING.md', 'utf8'),
  readFile('CONTRIBUTING.md', 'utf8'),
  readFile('.github/workflows/release.yml', 'utf8'),
]);

const changesets = JSON.parse(changesetsText);
const normalizedPolicy = `${versioning}\n${contributing}`
  .replace(/[`*_@/—-]/g, ' ')
  .replace(/\s+/g, ' ');

assert.deepEqual(changesets.fixed, []);
assert.deepEqual(changesets.linked, []);
assert.match(versioning, /independent SemVer/);
assert.match(versioning, /all three packages.*1\.0\.0/s);
assert.doesNotMatch(
  normalizedPolicy,
  /(?:lyra ds )?styles and (?:lyra ds )?react.{0,120}always share (?:a|one|the same).{0,30}version/i,
);
assert.doesNotMatch(
  normalizedPolicy,
  /(?:lyra ds )?styles and (?:lyra ds )?react(?: packages)? (?:always )?(?:receive|publish|get) empty lockstep releases?/i,
);
assert.match(contributing, /affected package/);
for (const packagePath of ['packages/styles', 'packages/react', 'packages/alpine']) {
  assert.match(releaseWorkflow, new RegExp(packagePath));
}

console.log('Release policy is configured for independent package versioning.');
