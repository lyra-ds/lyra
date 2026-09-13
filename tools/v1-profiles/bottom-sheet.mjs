#!/usr/bin/env node

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runModalProfiles } from './dialog.mjs';

const TOOL_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const FIXTURE_SOURCE = join(TOOL_DIRECTORY, 'fixtures', 'bottom-sheet.tsx');

runModalProfiles({
  component: 'BottomSheet',
  scriptName: 'bottom-sheet',
  fixtureSource: FIXTURE_SOURCE,
  fixtureName: 'bottom-sheet.tsx',
  sourceFiles: [join(TOOL_DIRECTORY, 'dialog.mjs'), fileURLToPath(import.meta.url), FIXTURE_SOURCE],
  exportName: './bottom-sheet',
  panelSelector: '.lyra-bottomsheet',
  overlaySelector: '.lyra-bottomsheet-overlay',
  closeSelector: '.lyra-bottomsheet__close',
  titleSelector: '.lyra-bottomsheet__title',
  bodySelector: '.lyra-bottomsheet__body',
  dialogName: 'Edit notification preferences',
  descriptionId: 'bottom-sheet-description',
  description: 'Choose how this workspace sends notifications.',
  minimumCloseTarget: 44,
  assertPanelBottomAttachment: true,
  requireIdentityStage: true,
  temporaryPrefix: 'lyra-bottom-sheet-profiles-',
  reportScope:
    'React19 packed BottomSheet six-profile browser-media emulation slice only; no handle contract, OS high-contrast, hydration, coarse-pointer, other-components, historical-baseline, or release claims.',
}).catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
