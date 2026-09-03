import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BEHAVIORAL_WAVE_CELLS, MODAL_WAVE_CELLS } from './cells.mjs';

const CELLS = [
  'chromium', 'firefox', 'webkit', 'react-18', 'react-19', 'ssr', 'hydration',
  'keyboard-focus', 'axe-light', 'axe-dark', 'forced-colors', 'reduced-motion',
  'ltr', 'rtl', 'coarse-pointer',
];

test('exports the exact deeply frozen behavioral cells and modal compatibility alias', () => {
  assert.deepEqual(BEHAVIORAL_WAVE_CELLS, CELLS);
  assert.strictEqual(MODAL_WAVE_CELLS, BEHAVIORAL_WAVE_CELLS);
  assert.equal(Object.isFrozen(BEHAVIORAL_WAVE_CELLS), true);
  assert.throws(() => BEHAVIORAL_WAVE_CELLS.push('decision-evidence'), TypeError);
});

test('keeps behavioral cells unique and includes rtl without decision evidence', () => {
  assert.equal(new Set(BEHAVIORAL_WAVE_CELLS).size, BEHAVIORAL_WAVE_CELLS.length);
  assert.equal(BEHAVIORAL_WAVE_CELLS.includes('rtl'), true);
  assert.equal(BEHAVIORAL_WAVE_CELLS.includes('decision-evidence'), false);
});
