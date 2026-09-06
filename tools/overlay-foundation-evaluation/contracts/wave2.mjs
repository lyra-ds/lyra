import { ANCHORED_SCENARIOS, validateAnchoredCoverage } from './anchored.mjs';
import { MENU_SCENARIOS, validateMenuCoverage } from './menu.mjs';
import { TOOLTIP_SCENARIOS, validateTooltipCoverage } from './tooltip.mjs';

export const WAVE_2_CONTRACT_IDS = Object.freeze(['OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP']);
export const WAVE_2_SCENARIOS = Object.freeze([
  ...ANCHORED_SCENARIOS,
  ...MENU_SCENARIOS,
  ...TOOLTIP_SCENARIOS,
]);
export function wave2ScenariosForCell(contractId, cellId) {
  return Object.freeze(
    WAVE_2_SCENARIOS.filter((s) => s.contractId === contractId && s.requiredCells.includes(cellId)),
  );
}
export function validateWave2Coverage(scenarios) {
  if (!Array.isArray(scenarios)) return ['Wave 2 scenarios must be an array'];
  const errors = scenarios.some((s) => !WAVE_2_CONTRACT_IDS.includes(s?.contractId))
    ? ['Wave 2 contains an out-of-wave contract']
    : [];
  for (const [contract, validate] of [
    ['OF-ANCHORED', validateAnchoredCoverage],
    ['OF-MENU', validateMenuCoverage],
    ['OF-TOOLTIP', validateTooltipCoverage],
  ])
    errors.push(...validate(scenarios.filter((s) => s?.contractId === contract)));
  return errors;
}
