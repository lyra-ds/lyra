import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { parse } from 'yaml';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u;

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

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

function nonCanonicalGovernedKeys(lockfile, packageName) {
  const prefix = `/${packageName}@`;
  const keys = new Set();

  for (const graph of [lockfile.packages, lockfile.snapshots]) {
    for (const key of Object.keys(graph)) {
      if (key.startsWith(prefix)) keys.add(key);
    }
  }

  return [...keys].sort();
}

const RULES = [
  {
    packageName: 'browserslist',
    vulnerable: (version) => compareTo(version, { major: 4, minor: 28, patch: 7 }) < 0,
    requirement: 'require >=4.28.7',
  },
  {
    packageName: 'brace-expansion',
    vulnerable: (version) => compareTo(version, { major: 1, minor: 1, patch: 18 }) < 0,
    requirement: 'require >=1.1.18',
  },
  {
    packageName: 'fast-uri',
    vulnerable: (version) =>
      version.major === 3 && compareTo(version, { major: 3, minor: 1, patch: 6 }) < 0,
    requirement: 'require >=3.1.6 within the 3.x line',
  },
  {
    packageName: 'js-yaml',
    vulnerable: (version) =>
      (version.major === 3 && compareTo(version, { major: 3, minor: 15, patch: 2 }) < 0) ||
      (version.major === 4 && compareTo(version, { major: 4, minor: 3, patch: 2 }) < 0),
    requirement: 'require >=3.15.2 within the 3.x line and >=4.3.2 within the 4.x line',
  },
  {
    packageName: 'nanoid',
    vulnerable: (version) => compareTo(version, { major: 3, minor: 3, patch: 18 }) < 0,
    requirement: 'require >=3.3.18',
  },
  {
    packageName: 'sharp',
    vulnerable: (version) => compareTo(version, { major: 0, minor: 35, patch: 4 }) < 0,
    requirement: 'require >=0.35.4',
  },
  {
    packageName: 'vitest',
    vulnerable: (version) =>
      compareTo(version, { major: 2, minor: 1, patch: 0 }) >= 0 &&
      compareTo(version, { major: 4, minor: 1, patch: 11 }) < 0,
    requirement: 'require versions outside >=2.1.0 and <4.1.11',
  },
  {
    packageName: '@vitest/mocker',
    vulnerable: (version) =>
      compareTo(version, { major: 2, minor: 1, patch: 0 }) >= 0 &&
      compareTo(version, { major: 4, minor: 1, patch: 11 }) < 0,
    requirement: 'require versions outside >=2.1.0 and <4.1.11',
  },
];

export function validateSecurityLock(lockfile) {
  if (!isPlainRecord(lockfile)) return ['pnpm-lock.yaml root must be a plain record.'];
  if (lockfile.lockfileVersion !== '9.0') {
    return ['pnpm-lock.yaml lockfileVersion must be the pnpm 11 canonical value "9.0".'];
  }

  const errors = [];

  for (const section of ['packages', 'snapshots']) {
    if (!isPlainRecord(lockfile[section])) {
      errors.push(`pnpm-lock.yaml ${section} must be a plain record.`);
    }
  }
  if (errors.length !== 0) return errors;

  for (const rule of RULES) {
    for (const key of nonCanonicalGovernedKeys(lockfile, rule.packageName)) {
      errors.push(`pnpm-lock.yaml contains non-canonical governed key ${key}.`);
    }
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
