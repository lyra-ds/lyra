import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BEHAVIORAL_WAVE_CELLS } from './cells.mjs';
import { validateScenario } from './protocol.mjs';
import {
  WAVE_2_CONTRACT_IDS,
  WAVE_2_SCENARIOS,
  wave2ScenariosForCell,
  validateWave2Coverage,
} from './wave2.mjs';

import { frozen } from './scenario-catalog.test-support.mjs';

test('Wave 2 owns exactly three contracts, 38 scenarios and no decision evidence cells', () => {
  assert.deepEqual(WAVE_2_CONTRACT_IDS, ['OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP']);
  assert.equal(WAVE_2_SCENARIOS.length, 38);
  assert.deepEqual(validateWave2Coverage(WAVE_2_SCENARIOS), []);
  frozen(WAVE_2_SCENARIOS);
  frozen(WAVE_2_CONTRACT_IDS);
  for (const contractId of WAVE_2_CONTRACT_IDS)
    for (const cellId of BEHAVIORAL_WAVE_CELLS) {
      const selected = wave2ScenariosForCell(contractId, cellId);
      assert.ok(selected.length);
      frozen(selected);
      assert.ok(
        selected.every((s) => s.contractId === contractId && s.requiredCells.includes(cellId)),
      );
    }
  assert.deepEqual(wave2ScenariosForCell('OF-MODAL', 'chromium'), []);
  assert.ok(validateWave2Coverage(null).length);
  assert.ok(validateWave2Coverage(WAVE_2_SCENARIOS.slice(1)).length);
  assert.ok(validateWave2Coverage([...WAVE_2_SCENARIOS, WAVE_2_SCENARIOS[0]]).length);
  assert.ok(validateWave2Coverage([{ contractId: 'OF-COMPOSED' }]).length);
});
