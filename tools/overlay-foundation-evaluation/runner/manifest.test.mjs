import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateAdapterDescriptor, validateCandidateManifest } from './manifest.mjs';

const sha = 'a'.repeat(64);
const revision = 'b'.repeat(40);
const external = (id, name) => ({
  id,
  adapter: `candidates/${id}.mjs`,
  contracts: ['OF-MODAL'],
  artifacts: [
    {
      source: 'registry',
      name,
      version: '1.2.3',
      tarballUrl: `https://registry.example.invalid/${id}-1.2.3.tgz`,
      sha256: sha,
      license: 'MIT',
      repositoryUrl: `https://github.com/example/${id}`,
    },
  ],
});
const validManifest = {
  schemaVersion: 1,
  lyraRevision: revision,
  toolchain: { node: '24.18.0', pnpm: '11.13.1' },
  candidates: [
    {
      id: 'incumbent',
      adapter: 'candidates/incumbent.mjs',
      contracts: ['OF-MODAL'],
      revision,
      artifacts: [
        {
          source: 'workspace-pack',
          name: '@lyra-ds/react',
          version: '0.5.0',
          sha256: sha,
        },
      ],
    },
    external('radix', '@radix-ui/react-dialog'),
    external('base-ui', '@base-ui-components/react'),
    external('zag', '@zag-js/dialog'),
  ],
};

test('accepts a complete prospective manifest', () => {
  assert.deepEqual(
    validateCandidateManifest(validManifest, { node: '24.18.0', pnpm: '11.13.1' }),
    [],
  );
});

test('rejects duplicate logical artifact identities within one candidate', () => {
  const manifest = structuredClone(validManifest);
  manifest.candidates[1].artifacts.push(structuredClone(manifest.candidates[1].artifacts[0]));
  assert.match(
    validateCandidateManifest(manifest, manifest.toolchain).join('\n'),
    /artifact identities must be unique/u,
  );
});

for (const license of ['', '   ', 'Definitely-Not-SPDX', 'MIT OR']) {
  test(`rejects invalid direct SPDX license ${JSON.stringify(license)}`, () => {
    const manifest = structuredClone(validManifest);
    manifest.candidates[1].artifacts[0].license = license;
    assert.match(
      validateCandidateManifest(manifest, manifest.toolchain).join('\n'),
      /SPDX license/u,
    );
  });
}

for (const version of ['^1.2.3', '~1.2.3', 'latest', 'workspace:*']) {
  test(`rejects non-exact version ${version}`, () => {
    const manifest = structuredClone(validManifest);
    manifest.candidates[1].artifacts[0].version = version;
    assert.match(
      validateCandidateManifest(manifest, manifest.toolchain).join('\n'),
      /exact version/u,
    );
  });
}

test('rejects a missing candidate, duplicate contract, credentialed URL, and uppercase hash', () => {
  const manifest = structuredClone(validManifest);
  manifest.candidates.pop();
  manifest.candidates[1].contracts.push('OF-MODAL');
  manifest.candidates[1].artifacts[0].tarballUrl =
    'https://user:pass@registry.example.invalid/a.tgz';
  manifest.candidates[1].artifacts[0].sha256 = sha.toUpperCase();
  const errors = validateCandidateManifest(manifest, manifest.toolchain).join('\n');
  assert.match(errors, /candidate IDs must be exactly/u);
  assert.match(errors, /contracts must be unique/u);
  assert.match(errors, /credentials/u);
  assert.match(errors, /lowercase SHA-256/u);
});

test('permits a descriptor to declare behavioral contracts beyond the manifest subset', () => {
  const candidate = validManifest.candidates[1];
  assert.deepEqual(
    validateAdapterDescriptor(candidate, {
      candidateId: 'radix',
      supportedContractIds: ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP'],
    }),
    [],
  );
});

test('rejects a descriptor with the wrong ID or that omits a manifest contract', () => {
  const candidate = validManifest.candidates[1];
  const errors = validateAdapterDescriptor(candidate, {
    candidateId: 'zag',
    supportedContractIds: ['OF-MENU'],
  }).join('\n');
  assert.match(errors, /candidate ID/u);
  assert.match(errors, /supportedContractIds/u);
});

for (const [index, id] of [
  ['1', 'radix'],
  ['2', 'base-ui'],
  ['3', 'zag'],
]) {
  test(`rejects a workspace-pack artifact for external candidate ${id}`, () => {
    const manifest = structuredClone(validManifest);
    const artifact = manifest.candidates[Number(index)].artifacts[0];
    manifest.candidates[Number(index)].artifacts = [
      {
        source: 'workspace-pack',
        name: artifact.name,
        version: artifact.version,
        sha256: artifact.sha256,
      },
    ];
    assert.match(
      validateCandidateManifest(manifest, manifest.toolchain).join('\n'),
      /external candidates must use registry artifacts/u,
    );
  });
}

test('rejects a registry artifact for the incumbent candidate', () => {
  const manifest = structuredClone(validManifest);
  manifest.candidates[0].artifacts = [
    {
      source: 'registry',
      name: '@lyra-ds/react',
      version: '0.5.0',
      tarballUrl: 'https://registry.example.invalid/lyra-0.5.0.tgz',
      sha256: sha,
      license: 'MIT',
      repositoryUrl: 'https://github.com/example/lyra',
    },
  ];
  assert.match(
    validateCandidateManifest(manifest, manifest.toolchain).join('\n'),
    /incumbent must use workspace-pack artifacts/u,
  );
});

test('rejects an HTTP registry tarball URL', () => {
  const manifest = structuredClone(validManifest);
  manifest.candidates[1].artifacts[0].tarballUrl =
    'http://registry.example.invalid/radix-1.2.3.tgz';
  assert.match(
    validateCandidateManifest(manifest, manifest.toolchain).join('\n'),
    /must use HTTPS/u,
  );
});

for (const [field, suffix] of [
  ['tarballUrl', '?download=1'],
  ['tarballUrl', '#archive'],
  ['tarballUrl', '?'],
  ['tarballUrl', '#'],
  ['repositoryUrl', '?tab=readme'],
  ['repositoryUrl', '#readme'],
  ['repositoryUrl', '?'],
  ['repositoryUrl', '#'],
]) {
  test(`rejects a registry ${field} with ${suffix[0] === '?' ? 'a query' : 'a fragment'}`, () => {
    const manifest = structuredClone(validManifest);
    manifest.candidates[1].artifacts[0][field] += suffix;
    assert.match(
      validateCandidateManifest(manifest, manifest.toolchain).join('\n'),
      /must not contain a query or fragment/u,
    );
  });
}
