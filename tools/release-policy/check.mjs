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

function indentedBlock(source, key) {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  assert.notEqual(start, -1, `release workflow must define the ${key} job`);
  const indentation = lines[start].search(/\S/);
  let end = lines.length;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (line.search(/\S/) <= indentation) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end).join('\n');
}

function stepContaining(source, pattern) {
  const lines = source.split('\n');
  const command = lines.findIndex((line) => pattern.test(line));
  assert.notEqual(command, -1, 'snapshot job must use one Changesets publish operation');

  let start = command;
  while (start >= 0 && !/^\s*-\s/.test(lines[start])) start -= 1;
  assert.notEqual(start, -1, 'snapshot Changesets publish must be a top-level workflow step');
  const indentation = lines[start].search(/\S/);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s*-\s/.test(lines[index]) && lines[index].search(/\S/) === indentation) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function assertSnapshotPolicy(workflow) {
  const snapshot = indentedBlock(workflow, 'snapshot');
  const version = snapshot.search(
    /\bpnpm\s+(?:exec\s+)?changeset\s+version\s+--snapshot\s+snapshot\b/,
  );
  const build = snapshot.search(/\bpnpm\s+(?:run\s+)?build\b/);
  const publishPattern = /\bpnpm\s+(?:exec\s+)?changeset\s+publish\s+--tag\s+snapshot\b/;
  const publish = snapshot.search(publishPattern);
  const publishOperations = snapshot.match(
    /\bpnpm\s+(?:exec\s+)?changeset\s+publish\s+--tag\s+snapshot\b/g,
  );

  assert.notEqual(version, -1, 'snapshot job must version packages with Changesets');
  assert.notEqual(build, -1, 'snapshot job must build versioned packages before publishing');
  assert.equal(
    publishOperations?.length,
    1,
    'snapshot job must have exactly one Changesets publish operation',
  );
  assert.ok(version < build && build < publish, 'snapshot job must version, build, then publish');
  assert.doesNotMatch(
    snapshot,
    /\b(?:npm|pnpm(?:\s+--(?:dir|filter)\s+\S+)?)\s+publish\s+--tag\s+snapshot\b/,
    'snapshot job must not publish packages individually',
  );
  assert.match(snapshot, /\bid-token:\s*write\b/, 'snapshot publishing must retain OIDC');

  const publishStep = stepContaining(snapshot, publishPattern);
  assert.doesNotMatch(
    publishStep,
    /\bworking-directory:\s*packages\//,
    'snapshot Changesets publish must run from the repository root',
  );
  assert.match(
    publishStep,
    /\bNPM_CONFIG_PROVENANCE:\s*['"]?true['"]?/,
    'snapshot publishing must retain npm provenance',
  );
}

function assertSecurityBeforePublish(workflow, jobName, publishPattern) {
  const job = indentedBlock(workflow, jobName);
  const security = job.search(/\bpnpm\s+(?:run\s+)?security:check\b/);
  const publish = job.search(publishPattern);

  assert.notEqual(security, -1, `${jobName} job must run the security lock gate`);
  assert.notEqual(publish, -1, `${jobName} job must retain its package publish operation`);
  assert.ok(security < publish, `${jobName} job must run the security lock gate before publishing`);
}

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
assertSnapshotPolicy(releaseWorkflow);
assertSecurityBeforePublish(releaseWorkflow, 'release', /\bpnpm\s+(?:run\s+)?release\b/);
assertSecurityBeforePublish(
  releaseWorkflow,
  'snapshot',
  /\bpnpm\s+(?:exec\s+)?changeset\s+publish\s+--tag\s+snapshot\b/,
);

console.log('Release policy is configured for independent package versioning.');
