import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BEHAVIORAL_EXTERNAL_ARTIFACTS,
  MODAL_EXTERNAL_ARTIFACTS,
  WAVE_2_EXTERNAL_ARTIFACTS,
  mergeExternalArtifactCatalogs,
} from './catalog.mjs';

const dialog = {
  source: 'registry',
  name: '@radix-ui/react-dialog',
  version: '1.1.23',
  tarballUrl: 'https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.23.tgz',
  sha256: 'fa3f7e8612eecfc7b889266c0a5f640463de7d534cd54c3aac6c644b6a8294d2',
  license: 'MIT',
  repositoryUrl: 'https://github.com/radix-ui/primitives',
};
const popover = {
  source: 'registry',
  name: '@radix-ui/react-popover',
  version: '1.1.23',
  tarballUrl: 'https://registry.npmjs.org/@radix-ui/react-popover/-/react-popover-1.1.23.tgz',
  sha256: 'c003d54e1716f00bafc5b7ccd4f3f126ffeded2ada9ae4146c272d1cb463e639',
  license: 'MIT',
  repositoryUrl: 'https://github.com/radix-ui/primitives',
};
const dropdownMenu = {
  source: 'registry',
  name: '@radix-ui/react-dropdown-menu',
  version: '2.1.24',
  tarballUrl:
    'https://registry.npmjs.org/@radix-ui/react-dropdown-menu/-/react-dropdown-menu-2.1.24.tgz',
  sha256: '611afe4ccb51032fa5bde4efeb247e466f21cbe6ea749eaa2fb698bed7e6d056',
  license: 'MIT',
  repositoryUrl: 'https://github.com/radix-ui/primitives',
};
const tooltip = {
  source: 'registry',
  name: '@radix-ui/react-tooltip',
  version: '1.2.16',
  tarballUrl: 'https://registry.npmjs.org/@radix-ui/react-tooltip/-/react-tooltip-1.2.16.tgz',
  sha256: '694f4194eaa0631f12335328f614163705b591e76dcb90f1dcdbe3ba9cb455e0',
  license: 'MIT',
  repositoryUrl: 'https://github.com/radix-ui/primitives',
};
const baseUi = {
  source: 'registry',
  name: '@base-ui-components/react',
  version: '1.0.0-rc.0',
  tarballUrl: 'https://registry.npmjs.org/@base-ui-components/react/-/react-1.0.0-rc.0.tgz',
  sha256: 'fd48911d202eb7ae13e7d56888fff503f3e9037c5e4e7991536429fafd7d9931',
  license: 'MIT',
  repositoryUrl: 'https://github.com/mui/base-ui',
};
const zagDialog = {
  source: 'registry',
  name: '@zag-js/dialog',
  version: '1.43.3',
  tarballUrl: 'https://registry.npmjs.org/@zag-js/dialog/-/dialog-1.43.3.tgz',
  sha256: '637e7e8d214deddd0edc6cf183eb70480b9f862862024129e5e793225b5fc517',
  license: 'MIT',
  repositoryUrl: 'https://github.com/chakra-ui/zag',
};
const zagPopover = {
  source: 'registry',
  name: '@zag-js/popover',
  version: '1.43.3',
  tarballUrl: 'https://registry.npmjs.org/@zag-js/popover/-/popover-1.43.3.tgz',
  sha256: 'b11dc92a737efa68cfe06407049fabbd6aa87563239022f84bf5cad00b6a7b48',
  license: 'MIT',
  repositoryUrl: 'https://github.com/chakra-ui/zag',
};
const zagMenu = {
  source: 'registry',
  name: '@zag-js/menu',
  version: '1.43.3',
  tarballUrl: 'https://registry.npmjs.org/@zag-js/menu/-/menu-1.43.3.tgz',
  sha256: 'ca13d29ed055add22c9ea31c817be9fc2003ba2e309edf18ce5ffc3838cbe432',
  license: 'MIT',
  repositoryUrl: 'https://github.com/chakra-ui/zag',
};
const zagTooltip = {
  source: 'registry',
  name: '@zag-js/tooltip',
  version: '1.43.3',
  tarballUrl: 'https://registry.npmjs.org/@zag-js/tooltip/-/tooltip-1.43.3.tgz',
  sha256: 'de95ba7649557e433362d1b11abb38e99d361234aa6336da5d5f60ce4e4e5ace',
  license: 'MIT',
  repositoryUrl: 'https://github.com/chakra-ui/zag',
};
const zagReact = {
  source: 'registry',
  name: '@zag-js/react',
  version: '1.43.3',
  tarballUrl: 'https://registry.npmjs.org/@zag-js/react/-/react-1.43.3.tgz',
  sha256: 'cf435e6fe4857d04aa2037e33dadaf9ec283c3159a95dca3c81023883e7f3f5c',
  license: 'MIT',
  repositoryUrl: 'https://github.com/chakra-ui/zag',
};

test('pins the original modal artifact identities and order exactly', () => {
  assert.deepEqual(MODAL_EXTERNAL_ARTIFACTS, {
    radix: [dialog],
    'base-ui': [baseUi],
    zag: [zagDialog, zagReact],
  });
});

test('pins the six Wave 2 artifact identities and order exactly', () => {
  assert.deepEqual(WAVE_2_EXTERNAL_ARTIFACTS, {
    radix: [popover, dropdownMenu, tooltip],
    'base-ui': [],
    zag: [zagPopover, zagMenu, zagTooltip],
  });
});

test('builds the canonical behavioral union without duplicating monolithic dependencies', () => {
  assert.deepEqual(BEHAVIORAL_EXTERNAL_ARTIFACTS, {
    radix: [dialog, popover, dropdownMenu, tooltip],
    'base-ui': [baseUi],
    zag: [zagDialog, zagPopover, zagMenu, zagTooltip, zagReact],
  });
  assert.deepEqual(Object.keys(BEHAVIORAL_EXTERNAL_ARTIFACTS), ['radix', 'base-ui', 'zag']);
  assert.equal(
    BEHAVIORAL_EXTERNAL_ARTIFACTS['base-ui'].filter(
      ({ name }) => name === '@base-ui-components/react',
    ).length,
    1,
  );
  assert.equal(
    BEHAVIORAL_EXTERNAL_ARTIFACTS.zag.filter(({ name }) => name === '@zag-js/react').length,
    1,
  );
});

test('rejects duplicate artifact identities whose pinned metadata differs', () => {
  const conflicting = {
    radix: [{ ...dialog, sha256: '0'.repeat(64) }],
    'base-ui': [],
    zag: [],
  };
  assert.throws(
    () => mergeExternalArtifactCatalogs(MODAL_EXTERNAL_ARTIFACTS, conflicting),
    /duplicate artifact identity has conflicting metadata/u,
  );
});

test('freezes every exported catalog, candidate list, and artifact record', () => {
  for (const catalog of [
    MODAL_EXTERNAL_ARTIFACTS,
    WAVE_2_EXTERNAL_ARTIFACTS,
    BEHAVIORAL_EXTERNAL_ARTIFACTS,
  ]) {
    assert.equal(Object.isFrozen(catalog), true);
    for (const artifacts of Object.values(catalog)) {
      assert.equal(Object.isFrozen(artifacts), true);
      assert.equal(
        artifacts.every((artifact) => Object.isFrozen(artifact)),
        true,
      );
    }
  }
});
