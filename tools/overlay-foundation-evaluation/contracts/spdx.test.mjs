import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateSpdxExpression } from './spdx.mjs';

for (const expression of [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
  'Unlicense',
  '(MIT OR Apache-2.0) AND BSD-3-Clause',
  'Apache-2.0 WITH LLVM-exception',
]) {
  test(`accepts known SPDX expression ${expression}`, () => {
    assert.deepEqual(validateSpdxExpression(expression), []);
  });
}

for (const [label, expression] of [
  ['empty input', ''],
  ['whitespace input', '   '],
  ['unknown license ID', 'Definitely-Not-SPDX'],
  ['unknown exception', 'Apache-2.0 WITH Unknown-exception'],
  ['missing right operand', 'MIT OR'],
  ['missing operator', 'MIT Apache-2.0'],
  ['leading operator', 'AND MIT'],
  ['unbalanced parentheses', '(MIT OR Apache-2.0'],
  ['WITH on a compound expression', '(MIT OR Apache-2.0) WITH LLVM-exception'],
  ['trailing token', 'MIT OR Apache-2.0 trailing'],
  ['lowercase operator', 'MIT or Apache-2.0'],
]) {
  test(`rejects SPDX ${label}`, () => {
    assert.notDeepEqual(validateSpdxExpression(expression), []);
  });
}
