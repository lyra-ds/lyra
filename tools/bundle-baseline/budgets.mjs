// The accepted reference is the 1.0.0 candidate (maintainer decision, 2026-09-18). The one-time
// migration exceptions approved against the Core Beta reference are realized in it and no longer
// apply; every entry is measured against the release itself under the default ceilings.
const REFERENCE_REVISION = 'cd282f198151a7901aad86ff837c4367e9f163cd';
const APPROVED_ROOT_LOCK = '1dd543e240aa7038cc2db2267c87d668ad9ebe8ffcb8f6c2001279beba4c4ecf';
export const APPROVED_FIXTURE_SOURCE_SHA256 =
  '07a32c9a76696fd88efdb0ab9aa16017fe3b6f3023e8d9f64c02e42a69b2c85e';
const TABS_IMPORT =
  "import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lyra-ds/react/tabs'";

export const APPROVED_ABSOLUTE_CAPS = {
  '@lyra-ds/react/drawer': { configuredLimit: '5.3 kB', bytes: 5300 },
  '@lyra-ds/react/bottom-sheet': { configuredLimit: '5.3 kB', bytes: 5300 },
  '@lyra-ds/react/create-workspace-dialog': { configuredLimit: '7.9 kB', bytes: 7900 },
  '@lyra-ds/react/time-picker': { configuredLimit: '7.912 kB', bytes: 7912 },
  '@lyra-ds/react/date-picker': { configuredLimit: '9.1 kB', bytes: 9100 },
  '@lyra-ds/react/date-range-picker': { configuredLimit: '9.2 kB', bytes: 9200 },
  '@lyra-ds/react/dropdown': { configuredLimit: '2.44 kB', bytes: 2440 },
  '@lyra-ds/react/combobox': { configuredLimit: '8.678 kB', bytes: 8678 },
  '@lyra-ds/react/time-zone-picker': { configuredLimit: '10.219 kB', bytes: 10219 },
  '@lyra-ds/react/tooltip': { configuredLimit: '2.1 kB', bytes: 2100 },
  '@lyra-ds/react/command-palette': { configuredLimit: '13.6 kB', bytes: 13600 },
  '@lyra-ds/react/recurrence-selector': { configuredLimit: '11 kB', bytes: 11000 },
  '@lyra-ds/react/weekly-schedule-editor': { configuredLimit: '18.7 kB', bytes: 18700 },
  '@lyra-ds/react/tabs': { configuredLimit: '1.6 kB', bytes: 1600 },
  '@lyra-ds/alpine': { configuredLimit: '24.2 kB', bytes: 24200 },
};

const STANDALONE_EXCEPTIONS = {};
const SCENARIO_EXCEPTIONS = {};
// Complex-or-composition entries keep the 3000-byte migration ceiling; every other entry is simple (1500).
const COMPLEX_STANDALONE = new Set([
  '@lyra-ds/react/drawer',
  '@lyra-ds/react/bottom-sheet',
  '@lyra-ds/react/create-workspace-dialog',
  '@lyra-ds/react/time-picker',
  '@lyra-ds/react/date-picker',
  '@lyra-ds/react/date-range-picker',
  '@lyra-ds/react/command-palette',
  '@lyra-ds/react/recurrence-selector',
  '@lyra-ds/react/weekly-schedule-editor',
  '@lyra-ds/alpine',
]);
const REQUIRED_ENVIRONMENT_FIELDS = ['node', 'pnpm', 'vite', 'sizeLimit'];
const REQUIRED_FIXTURE_FIELDS = [
  'artifactInstallation',
  'packageManager',
  'lockfileSha256',
  'resolvedGraph',
  'resolvedGraphSha256',
];

function fail(message) {
  throw new Error(`bundle budget check: ${message}`);
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function integer(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail(`${label} must be a finite nonnegative integer`);
  }
  return value;
}

function requiredObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`missing ${label}`);
  return value;
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail(`missing ${label}`);
  return value;
}

function requiredStringList(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  const names = new Set();
  for (const item of value) {
    requiredString(item, `${label} entry`);
    if (names.has(item)) fail(`${label} contains duplicate entry: ${item}`);
    names.add(item);
  }
  return value;
}

function requiredModules(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  const names = new Set();
  for (const entry of value) {
    const module = requiredObject(entry, `${label} entry`);
    const name = requiredString(module.module, `${label} entry module`);
    if (names.has(name)) fail(`${label} contains duplicate module: ${name}`);
    names.add(name);
    integer(module.renderedBytes, `${label} entry renderedBytes`);
  }
  return value;
}

function exactObjectKeys(value, keys, label) {
  const actual = Object.keys(requiredObject(value, label)).sort();
  const expected = [...keys].sort();
  if (!sameJson(actual, expected)) {
    fail(`${label} keys must be exactly ${expected.join(', ')}`);
  }
}

function measurementDetails(entry, label, css = false) {
  const metrics = css ? entry : entry.assets?.javascript;
  requiredObject(metrics, `${label} JavaScript measurements`);
  return {
    metrics: {
      rawBytes: integer(metrics.rawBytes, `${label}.rawBytes`),
      minifiedBytes: integer(metrics.minifiedBytes, `${label}.minifiedBytes`),
      brotliBytes: integer(metrics.brotliBytes, `${label}.brotliBytes`),
    },
    files: requiredStringList(metrics.files, `${label}.files`),
    modules: requiredModules(entry.modules, `${label}.modules`),
  };
}

function mapEntries(entries, label, key) {
  if (!Array.isArray(entries)) fail(`${label} measurements must be an array`);
  const mapped = new Map();
  for (const entry of entries) {
    requiredObject(entry, `${label} entry`);
    const value = entry[key];
    if (typeof value !== 'string' || value.length === 0) fail(`${label} entry has no ${key}`);
    if (mapped.has(value)) fail(`duplicate ${label} measurement: ${value}`);
    mapped.set(value, entry);
  }
  return mapped;
}

function sameKeys(expected, actual, label) {
  const missing = [...expected.keys()].filter((key) => !actual.has(key));
  const unexpected = [...actual.keys()].filter((key) => !expected.has(key));
  if (missing.length || unexpected.length) {
    fail(
      `${label} measurements differ: ${[
        ...(missing.length ? [`missing ${missing.join(', ')}`] : []),
        ...(unexpected.length ? [`unexpected ${unexpected.join(', ')}`] : []),
      ].join('; ')}`,
    );
  }
}

function verifyArtifacts(baseline, label) {
  const packages = requiredObject(baseline.environment?.packages, `${label} package provenance`);
  const packageNames = ['@lyra-ds/react', '@lyra-ds/styles', '@lyra-ds/alpine'];
  exactObjectKeys(packages, packageNames, `${label} package provenance`);
  for (const name of packageNames) {
    const artifact = requiredObject(packages[name], `${label} ${name} artifact provenance`);
    requiredString(artifact.version, `${label} ${name} artifact version`);
    requiredString(artifact.tarball, `${label} ${name} artifact tarball`);
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256)) {
      fail(`${label} ${name} artifact SHA-256 is invalid`);
    }
  }
  return packages;
}

function verifyComparableProtocol(reference, candidate) {
  if (reference.schemaVersion !== 1) {
    fail(`unsupported reference schema version: ${reference.schemaVersion ?? 'missing'}`);
  }
  if (candidate.schemaVersion !== 1) {
    fail(`unsupported candidate schema version: ${candidate.schemaVersion ?? 'missing'}`);
  }
  requiredString(reference.revision, 'reference revision');
  requiredString(candidate.revision, 'candidate revision');
  if (reference.revision !== REFERENCE_REVISION) {
    fail(`unknown reference revision: ${reference.revision ?? 'missing'}`);
  }
  const referenceEnvironment = requiredObject(reference.environment, 'reference environment');
  const candidateEnvironment = requiredObject(candidate.environment, 'candidate environment');
  for (const field of REQUIRED_ENVIRONMENT_FIELDS) {
    requiredString(referenceEnvironment[field], `reference ${field}`);
    requiredString(candidateEnvironment[field], `candidate ${field}`);
    if (candidateEnvironment[field] !== referenceEnvironment[field]) {
      fail(
        `unsupported ${field} change: reference=${referenceEnvironment[field]}, candidate=${candidateEnvironment[field]}`,
      );
    }
  }
  requiredString(candidateEnvironment.operatingSystem, 'candidate operating system');
  requiredString(candidateEnvironment.architecture, 'candidate architecture');
  const referenceFixture = requiredObject(
    referenceEnvironment.fixture,
    'reference fixture provenance',
  );
  const candidateFixture = requiredObject(
    candidateEnvironment.fixture,
    'candidate fixture provenance',
  );
  for (const field of REQUIRED_FIXTURE_FIELDS) {
    if (referenceFixture[field] === undefined || candidateFixture[field] === undefined) {
      fail(`missing fixture provenance: ${field}`);
    }
    if (!sameJson(candidateFixture[field], referenceFixture[field])) {
      fail(`unsupported fixture protocol change: ${field}`);
    }
  }
  if (candidateFixture.sourceSha256 !== APPROVED_FIXTURE_SOURCE_SHA256) {
    fail('unsupported fixture source change');
  }
  if (!Array.isArray(reference.externals) || !Array.isArray(candidate.externals)) {
    fail('missing externals provenance');
  }
  if (!sameJson(candidate.externals, reference.externals)) fail('unsupported externals change');
  const referenceBrotli = requiredObject(
    referenceEnvironment.brotli,
    'reference Brotli provenance',
  );
  const candidateBrotli = requiredObject(
    candidateEnvironment.brotli,
    'candidate Brotli provenance',
  );
  if (!sameJson(candidateBrotli, referenceBrotli)) {
    fail('unsupported Brotli protocol change');
  }
  if (candidateEnvironment.lockfileSha256 !== APPROVED_ROOT_LOCK) {
    fail(`unapproved root lockfile change: ${candidateEnvironment.lockfileSha256 ?? 'missing'}`);
  }
  if (candidateEnvironment.exactCommand !== 'pnpm baseline:bundles --check-budgets') {
    fail('candidate exact command must be pnpm baseline:bundles --check-budgets');
  }
  verifyArtifacts(reference, 'reference');
  return verifyArtifacts(candidate, 'candidate');
}

function entryDelta(reference, candidate, label, css = false) {
  const beforeDetails = measurementDetails(reference, `reference ${label}`, css);
  const afterDetails = measurementDetails(candidate, `candidate ${label}`, css);
  const before = beforeDetails.metrics;
  const after = afterDetails.metrics;
  return {
    before,
    after,
    deltas: Object.fromEntries(
      Object.keys(before).map((metric) => [metric, after[metric] - before[metric]]),
    ),
    files: { before: beforeDetails.files, after: afterDetails.files },
    modules: {
      before: beforeDetails.modules,
      after: afterDetails.modules,
      drift: !sameJson(beforeDetails.modules, afterDetails.modules),
    },
  };
}

function verifySizeLimit(reference, candidate, publicEntry) {
  const referenceLimit = requiredObject(reference.sizeLimit, `reference ${publicEntry} Size Limit`);
  const candidateLimit = requiredObject(candidate.sizeLimit, `candidate ${publicEntry} Size Limit`);
  integer(referenceLimit.size, `${publicEntry} reference Size Limit size`);
  const historicalLimitBytes = integer(referenceLimit.sizeLimit, `${publicEntry} reference cap`);
  integer(candidateLimit.sizeLimit, `${publicEntry} candidate cap`);
  const approved = APPROVED_ABSOLUTE_CAPS[publicEntry];
  const limitBytes = approved?.bytes ?? historicalLimitBytes;
  const configuredLimit = approved?.configuredLimit ?? reference.configuredLimit;
  if (candidate.configuredLimit !== configuredLimit) {
    fail(`unapproved configured cap change for ${publicEntry}`);
  }
  if (candidateLimit.sizeLimit !== limitBytes) {
    fail(
      `unapproved Size Limit cap change for ${publicEntry}: expected ${limitBytes}, actual ${candidateLimit.sizeLimit}`,
    );
  }
  const actualBytes = integer(candidateLimit.size, `${publicEntry} Size Limit size`);
  if (actualBytes > limitBytes) {
    fail(`${publicEntry} exceeds absolute cap: ${actualBytes} > ${limitBytes}`);
  }
  return { actualBytes, limitBytes };
}

function expectedImport(reference, publicEntry) {
  return publicEntry === '@lyra-ds/react/tabs' ? TABS_IMPORT : reference.name;
}

function verifyStandalone(referenceEntries, candidateEntries, category) {
  const reference = mapEntries(referenceEntries, `reference ${category} standalone`, 'publicEntry');
  const candidate = mapEntries(candidateEntries, `candidate ${category} standalone`, 'publicEntry');
  sameKeys(reference, candidate, `${category} standalone`);
  const results = [];
  for (const [publicEntry, before] of reference) {
    const after = candidate.get(publicEntry);
    if (after.name !== expectedImport(before, publicEntry)) {
      fail(`unapproved import change for ${publicEntry}`);
    }
    if (after.sizeLimit?.name !== after.name) {
      fail(`candidate Size Limit name does not match import for ${publicEntry}`);
    }
    const delta = entryDelta(before, after, publicEntry);
    const absolute = verifySizeLimit(before, after, publicEntry);
    const exception = STANDALONE_EXCEPTIONS[publicEntry];
    const limitBytes = exception ?? (COMPLEX_STANDALONE.has(publicEntry) ? 3000 : 1500);
    if (delta.deltas.brotliBytes > limitBytes) {
      fail(
        `${publicEntry} Brotli increase exceeds ${exception === undefined ? 'migration ceiling' : 'approved exception'}: ${delta.deltas.brotliBytes} > ${limitBytes}`,
      );
    }
    results.push({
      publicEntry,
      ...delta,
      absolute,
      migration: {
        limitBytes,
        approvedException: exception ?? null,
        passed: true,
      },
      moduleDrift: delta.modules.drift,
    });
  }
  return results;
}

function verifyScenarios(referenceScenarios, candidateScenarios) {
  const reference = mapEntries(
    Object.entries(requiredObject(referenceScenarios, 'reference scenarios')).map(
      ([name, entry]) => ({
        name,
        ...entry,
      }),
    ),
    'reference scenario',
    'name',
  );
  const candidate = mapEntries(
    Object.entries(requiredObject(candidateScenarios, 'candidate scenarios')).map(
      ([name, entry]) => ({
        name,
        ...entry,
      }),
    ),
    'candidate scenario',
    'name',
  );
  sameKeys(reference, candidate, 'scenario');
  return [...reference].map(([name, before]) => {
    const after = candidate.get(name);
    const delta = entryDelta(before, after, `scenario ${name}`);
    const exception = SCENARIO_EXCEPTIONS[name];
    const limitBytes = exception ?? 3000;
    if (delta.deltas.brotliBytes > limitBytes) {
      fail(
        `scenario ${name} Brotli increase exceeds ${exception === undefined ? 'migration ceiling' : 'approved exception'}: ${delta.deltas.brotliBytes} > ${limitBytes}`,
      );
    }
    return {
      name,
      ...delta,
      migration: { limitBytes, approvedException: exception ?? null, passed: true },
      moduleDrift: delta.modules.drift,
    };
  });
}

function verifyCss(referenceCss, candidateCss) {
  const reference = mapEntries(
    Object.entries(requiredObject(referenceCss, 'reference CSS')).map(([name, entry]) => ({
      name,
      ...entry,
    })),
    'reference CSS',
    'name',
  );
  const candidate = mapEntries(
    Object.entries(requiredObject(candidateCss, 'candidate CSS')).map(([name, entry]) => ({
      name,
      ...entry,
    })),
    'candidate CSS',
    'name',
  );
  sameKeys(reference, candidate, 'CSS');
  return [...reference].map(([name, before]) => {
    const after = candidate.get(name);
    if (after.publicEntry !== before.publicEntry) fail(`CSS public entry changed: ${name}`);
    const delta = entryDelta(before, after, `CSS ${name}`, true);
    return {
      name,
      ...delta,
      moduleDrift: delta.modules.drift,
    };
  });
}

function verifyCandidateBinding(packages, ledgerCandidate) {
  if (ledgerCandidate === null || ledgerCandidate === undefined) return null;
  const candidatePackages = requiredObject(ledgerCandidate.packages, 'candidate ledger packages');
  const verified = {};
  for (const key of ['styles', 'react', 'alpine']) {
    const packageName = `@lyra-ds/${key}`;
    const ledgerArtifact = requiredObject(
      candidatePackages[key],
      `candidate ledger ${packageName}`,
    );
    const packedArtifact = packages[packageName];
    if (
      ledgerArtifact.name !== packageName ||
      ledgerArtifact.version !== packedArtifact.version ||
      ledgerArtifact.tarball !== packedArtifact.tarball ||
      ledgerArtifact.sha256 !== packedArtifact.sha256
    ) {
      fail(
        `candidate artifact binding mismatch for ${packageName}: ledger=${ledgerArtifact.sha256}, packed=${packedArtifact.sha256}`,
      );
    }
    verified[key] = {
      name: packageName,
      version: packedArtifact.version,
      tarball: packedArtifact.tarball,
      sha256: packedArtifact.sha256,
    };
  }
  return {
    result: 'pass',
    sourceRevision: requiredString(
      ledgerCandidate.sourceRevision,
      'candidate ledger sourceRevision',
    ),
    packages: verified,
  };
}

export function checkBundleBudgets(reference, candidate, options = {}) {
  requiredObject(reference, 'reference');
  requiredObject(candidate, 'candidate');
  const packages = verifyComparableProtocol(reference, candidate);
  const candidateBinding = verifyCandidateBinding(packages, options.ledgerCandidate);
  const standalone = requiredObject(reference.standalone, 'reference standalone');
  const candidateStandalone = requiredObject(candidate.standalone, 'candidate standalone');
  exactObjectKeys(standalone, ['react', 'alpine'], 'reference standalone');
  exactObjectKeys(candidateStandalone, ['react', 'alpine'], 'candidate standalone');
  const react = verifyStandalone(standalone.react, candidateStandalone.react, 'React');
  const alpine = verifyStandalone(standalone.alpine, candidateStandalone.alpine, 'Alpine');
  const scenarios = verifyScenarios(reference.scenarios, candidate.scenarios);
  const css = verifyCss(reference.css, candidate.css);
  if (react.length + alpine.length !== 72 || scenarios.length !== 5 || css.length !== 4) {
    fail(
      `expected 72 standalone, 5 scenario, and 4 CSS measurements; found ${react.length + alpine.length}, ${scenarios.length}, ${css.length}`,
    );
  }
  return {
    schemaVersion: 1,
    kind: 'bundle-budget',
    result: 'pass',
    referenceRevision: reference.revision,
    candidateRevision: candidate.revision,
    environment: {
      operatingSystem: candidate.environment.operatingSystem,
      architecture: candidate.environment.architecture,
      node: candidate.environment.node,
      pnpm: candidate.environment.pnpm,
      vite: candidate.environment.vite,
      sizeLimit: candidate.environment.sizeLimit,
      lockfileSha256: candidate.environment.lockfileSha256,
      fixture: candidate.environment.fixture,
      exactCommand: candidate.environment.exactCommand,
      cacheState: candidate.environment.cacheState,
      brotli: candidate.environment.brotli,
    },
    externals: candidate.externals,
    artifacts: packages,
    candidateBinding,
    entries: { react, alpine, scenarios, css },
  };
}
