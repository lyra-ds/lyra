import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFixtureProtocol } from './protocol.mjs';

test('shared protocol factories keep independently closed request boundaries', () => {
  const protocol = createFixtureProtocol({
    validateExecutionScenario: (value, errors) => {
      if (value !== 'execution') errors.push('execution required');
    },
  });
  assert.match(
    protocol.validateRequest({ schemaVersion: 1, scenario: 'wrong', cell: {} }).join(' '),
    /execution required/,
  );
  assert.match(protocol.validateObservation({}).join(' '), /observation/);
});
