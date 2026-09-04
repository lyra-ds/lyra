export const MODAL_EXTERNAL_ARTIFACTS = Object.freeze({
  radix: Object.freeze([
    Object.freeze({
      source: 'registry',
      name: '@radix-ui/react-dialog',
      version: '1.1.23',
      tarballUrl: 'https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.23.tgz',
      sha256: 'fa3f7e8612eecfc7b889266c0a5f640463de7d534cd54c3aac6c644b6a8294d2',
      license: 'MIT',
      repositoryUrl: 'https://github.com/radix-ui/primitives',
    }),
  ]),
  'base-ui': Object.freeze([
    Object.freeze({
      source: 'registry',
      name: '@base-ui-components/react',
      version: '1.0.0-rc.0',
      tarballUrl: 'https://registry.npmjs.org/@base-ui-components/react/-/react-1.0.0-rc.0.tgz',
      sha256: 'fd48911d202eb7ae13e7d56888fff503f3e9037c5e4e7991536429fafd7d9931',
      license: 'MIT',
      repositoryUrl: 'https://github.com/mui/base-ui',
    }),
  ]),
  zag: Object.freeze([
    Object.freeze({
      source: 'registry',
      name: '@zag-js/dialog',
      version: '1.43.3',
      tarballUrl: 'https://registry.npmjs.org/@zag-js/dialog/-/dialog-1.43.3.tgz',
      sha256: '637e7e8d214deddd0edc6cf183eb70480b9f862862024129e5e793225b5fc517',
      license: 'MIT',
      repositoryUrl: 'https://github.com/chakra-ui/zag',
    }),
    Object.freeze({
      source: 'registry',
      name: '@zag-js/react',
      version: '1.43.3',
      tarballUrl: 'https://registry.npmjs.org/@zag-js/react/-/react-1.43.3.tgz',
      sha256: 'cf435e6fe4857d04aa2037e33dadaf9ec283c3159a95dca3c81023883e7f3f5c',
      license: 'MIT',
      repositoryUrl: 'https://github.com/chakra-ui/zag',
    }),
  ]),
});

export const WAVE_2_EXTERNAL_ARTIFACTS = Object.freeze({
  radix: Object.freeze([
    Object.freeze({
      source: 'registry',
      name: '@radix-ui/react-popover',
      version: '1.1.23',
      tarballUrl: 'https://registry.npmjs.org/@radix-ui/react-popover/-/react-popover-1.1.23.tgz',
      sha256: 'c003d54e1716f00bafc5b7ccd4f3f126ffeded2ada9ae4146c272d1cb463e639',
      license: 'MIT',
      repositoryUrl: 'https://github.com/radix-ui/primitives',
    }),
    Object.freeze({
      source: 'registry',
      name: '@radix-ui/react-dropdown-menu',
      version: '2.1.24',
      tarballUrl:
        'https://registry.npmjs.org/@radix-ui/react-dropdown-menu/-/react-dropdown-menu-2.1.24.tgz',
      sha256: '611afe4ccb51032fa5bde4efeb247e466f21cbe6ea749eaa2fb698bed7e6d056',
      license: 'MIT',
      repositoryUrl: 'https://github.com/radix-ui/primitives',
    }),
    Object.freeze({
      source: 'registry',
      name: '@radix-ui/react-tooltip',
      version: '1.2.16',
      tarballUrl: 'https://registry.npmjs.org/@radix-ui/react-tooltip/-/react-tooltip-1.2.16.tgz',
      sha256: '694f4194eaa0631f12335328f614163705b591e76dcb90f1dcdbe3ba9cb455e0',
      license: 'MIT',
      repositoryUrl: 'https://github.com/radix-ui/primitives',
    }),
  ]),
  'base-ui': Object.freeze([]),
  zag: Object.freeze([
    Object.freeze({
      source: 'registry',
      name: '@zag-js/popover',
      version: '1.43.3',
      tarballUrl: 'https://registry.npmjs.org/@zag-js/popover/-/popover-1.43.3.tgz',
      sha256: 'b11dc92a737efa68cfe06407049fabbd6aa87563239022f84bf5cad00b6a7b48',
      license: 'MIT',
      repositoryUrl: 'https://github.com/chakra-ui/zag',
    }),
    Object.freeze({
      source: 'registry',
      name: '@zag-js/menu',
      version: '1.43.3',
      tarballUrl: 'https://registry.npmjs.org/@zag-js/menu/-/menu-1.43.3.tgz',
      sha256: 'ca13d29ed055add22c9ea31c817be9fc2003ba2e309edf18ce5ffc3838cbe432',
      license: 'MIT',
      repositoryUrl: 'https://github.com/chakra-ui/zag',
    }),
    Object.freeze({
      source: 'registry',
      name: '@zag-js/tooltip',
      version: '1.43.3',
      tarballUrl: 'https://registry.npmjs.org/@zag-js/tooltip/-/tooltip-1.43.3.tgz',
      sha256: 'de95ba7649557e433362d1b11abb38e99d361234aa6336da5d5f60ce4e4e5ace',
      license: 'MIT',
      repositoryUrl: 'https://github.com/chakra-ui/zag',
    }),
  ]),
});

const CANDIDATE_ORDER = Object.freeze(['radix', 'base-ui', 'zag']);
const PACKAGE_ORDER = Object.freeze({
  radix: Object.freeze([
    '@radix-ui/react-dialog',
    '@radix-ui/react-popover',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-tooltip',
  ]),
  'base-ui': Object.freeze(['@base-ui-components/react']),
  zag: Object.freeze([
    '@zag-js/dialog',
    '@zag-js/popover',
    '@zag-js/menu',
    '@zag-js/tooltip',
    '@zag-js/react',
  ]),
});

function artifactIdentity(artifact) {
  return `${artifact.source}\u0000${artifact.name}\u0000${artifact.version}`;
}

function sameArtifact(left, right) {
  return (
    left.source === right.source &&
    left.name === right.name &&
    left.version === right.version &&
    left.tarballUrl === right.tarballUrl &&
    left.sha256 === right.sha256 &&
    left.license === right.license &&
    left.repositoryUrl === right.repositoryUrl
  );
}

export function mergeExternalArtifactCatalogs(...catalogs) {
  const merged = {};
  for (const candidateId of CANDIDATE_ORDER) {
    const byIdentity = new Map();
    for (const catalog of catalogs) {
      for (const artifact of catalog[candidateId] ?? []) {
        const identity = artifactIdentity(artifact);
        const existing = byIdentity.get(identity);
        if (existing !== undefined && !sameArtifact(existing, artifact)) {
          throw new Error('duplicate artifact identity has conflicting metadata');
        }
        if (existing === undefined) byIdentity.set(identity, artifact);
      }
    }
    const packageIndex = new Map(PACKAGE_ORDER[candidateId].map((name, index) => [name, index]));
    merged[candidateId] = Object.freeze(
      [...byIdentity.values()].sort(
        (left, right) => packageIndex.get(left.name) - packageIndex.get(right.name),
      ),
    );
  }
  return Object.freeze(merged);
}

export const BEHAVIORAL_EXTERNAL_ARTIFACTS = mergeExternalArtifactCatalogs(
  MODAL_EXTERNAL_ARTIFACTS,
  WAVE_2_EXTERNAL_ARTIFACTS,
);
