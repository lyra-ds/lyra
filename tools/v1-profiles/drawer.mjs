#!/usr/bin/env node

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runModalProfiles } from './dialog.mjs';

const TOOL_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const FIXTURE_SOURCE = join(TOOL_DIRECTORY, 'fixtures', 'drawer.tsx');

runModalProfiles({
  component: 'Drawer',
  fixtureSource: FIXTURE_SOURCE,
  fixtureName: 'drawer.tsx',
  sourceFiles: [join(TOOL_DIRECTORY, 'dialog.mjs'), fileURLToPath(import.meta.url), FIXTURE_SOURCE],
  exportName: './drawer',
  panelSelector: '.lyra-drawer',
  overlaySelector: '.lyra-drawer-overlay',
  closeSelector: '.lyra-drawer__close',
  titleSelector: '.lyra-drawer__title',
  bodySelector: '.lyra-drawer__body',
  dialogName: 'Edit notification preferences',
  descriptionId: 'drawer-description',
  description: 'Choose how this workspace sends notifications.',
  minimumCloseTarget: 24,
  assertPanelInlineEnd: true,
  assertPanelInlineStartBoundary: true,
  temporaryPrefix: 'lyra-drawer-profiles-',
  reportScope:
    'React19 packed Drawer six-profile browser-media emulation slice only; no OS high-contrast, hydration, coarse-pointer, other-components, historical-baseline, or release claims.',
}).catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
