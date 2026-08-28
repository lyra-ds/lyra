import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { parse } from 'yaml';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u;

function parsedVersion(version) {
  const match = SEMVER.exec(version);
  if (match === null) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

function compareTo(version, floor) {
  for (const part of ['major', 'minor', 'patch']) {
    if (version[part] !== floor[part]) return version[part] - floor[part];
  }
  if (version.prerelease === undefined) return 0;
  return -1;
}

function resolvedVersions(lockfile, packageName) {
  const prefix = `${packageName}@`;
  const versions = new Set();

  for (const graph of [lockfile?.packages, lockfile?.snapshots]) {
    if (graph === null || typeof graph !== 'object' || Array.isArray(graph)) continue;
    for (const key of Object.keys(graph)) {
      if (!key.startsWith(prefix)) continue;
      versions.add(key.slice(prefix.length).split('(', 1)[0]);
    }
  }

  return [...versions].sort();
}

const RULES = [
  {
    packageName: 'brace-expansion',
    vulnerable: (version) => compareTo(version, { major: 1, minor: 1, patch: 18 }) < 0,
    requirement: 'require >=1.1.18',
  },
  {
    packageName: 'js-yaml',
    vulnerable: (version) =>
      version.major === 3 && compareTo(version, { major: 3, minor: 15, patch: 1 }) < 0,
    requirement: 'require 3.15.1 within the 3.x line',
  },
  {
    packageName: 'nanoid',
    vulnerable: (version) => compareTo(version, { major: 3, minor: 3, patch: 18 }) < 0,
    requirement: 'require >=3.3.18',
  },
];

export function validateSecurityLock(lockfile) {
  const errors = [];

  for (const rule of RULES) {
    for (const versionText of resolvedVersions(lockfile, rule.packageName)) {
      const version = parsedVersion(versionText);
      if (version === undefined) {
        errors.push(
          `pnpm-lock.yaml contains an unparseable ${rule.packageName} version: ${versionText}.`,
        );
      } else if (rule.vulnerable(version)) {
        errors.push(
          `pnpm-lock.yaml resolves vulnerable ${rule.packageName}@${versionText}; ${rule.requirement}.`,
        );
      }
    }
  }

  return errors;
}

async function main() {
  const lockfilePath = resolve(process.cwd(), 'pnpm-lock.yaml');
  const lockfile = parse(await readFile(lockfilePath, 'utf8'));
  const errors = validateSecurityLock(lockfile);

  if (errors.length !== 0) {
    console.error('Security lock policy failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log('Security lock policy passed: no governed vulnerable resolutions.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
