import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BEHAVIORAL_WAVE_CELLS } from './cells.mjs';
import { validateScenario } from './protocol.mjs';

function leaves(value, path = []) {
  if (value !== null && typeof value === 'object')
    return Object.entries(value).flatMap(([key, entry]) => leaves(entry, [...path, key]));
  return [path];
}
function replace(record, path, value) {
  let target = record;
  for (const key of path.slice(0, -1)) target = target[key];
  target[path.at(-1)] = value;
}
export function frozen(value) {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value));
  Object.values(value).forEach(frozen);
}
export function checkCatalog(name, scenarios, forCell, validate, inventory) {
  test(`${name}: exact immutable inventory, component mapping, literal coverage and protocol`, () => {
    assert.deepEqual(validate(scenarios), []);
    assert.deepEqual(
      scenarios.map((s) => [s.scenarioId, s.requiredCells]),
      inventory,
    );
    frozen(scenarios);
    for (const s of scenarios) {
      assert.equal(s.contractId, `OF-${name.toUpperCase()}`);
      assert.equal(s.revision, 1);
      assert.match(s.scenarioId, /\.v1$/u);
      assert.deepEqual(validateScenario(s), []);
      const popupOnly = /popup-trigger|nested-child|topmost-escape|trigger-removal-successor/u.test(
        s.scenarioId,
      );
      assert.deepEqual(
        s.components,
        name === 'menu'
          ? ['Dropdown']
          : name === 'tooltip'
            ? ['Tooltip']
            : popupOnly
              ? ['Popover', 'Dropdown', 'WorkspaceSwitcher']
              : ['Popover', 'Dropdown', 'WorkspaceSwitcher', 'Tooltip'],
      );
      assert.deepEqual(s.capture, ['dom', 'accessibility-tree', 'events', 'focus', 'resources']);
      assert.ok(s.probes.length >= 3);
      for (const p of s.probes) {
        if (p.phase === 'after-operation') assert.ok(s.operations[p.operationIndex]);
      }
      for (const category of [
        'roles',
        'relationships',
        'states',
        'events',
        'announcements',
        'cleanup',
      ]) {
        assert.equal(
          s.probes.filter((p) => p.category === category).length,
          s.expected[category].length,
          `${s.scenarioId} ${category} must have a probe for every expectation`,
        );
      }
      assert.equal(s.probes.filter((p) => p.category === 'focus').length, 1);
    }
    assert.deepEqual(
      new Set(scenarios.flatMap((s) => s.requiredCells)),
      new Set(BEHAVIORAL_WAVE_CELLS),
    );
    for (const cell of BEHAVIORAL_WAVE_CELLS) {
      assert.deepEqual(
        forCell(cell),
        scenarios.filter((s) => s.requiredCells.includes(cell)),
      );
      frozen(forCell(cell));
    }
    assert.deepEqual(forCell('bundle-standalone'), []);
    assert.ok(validate(null).length);
    assert.ok(validate([...scenarios, scenarios[0]]).length);
  });
  test(`${name}: every row rejects removed required probes and expected outcomes`, () => {
    for (let index = 0; index < scenarios.length; index++) {
      for (const p of scenarios[index].probes) {
        const changed = structuredClone(scenarios);
        changed[index].probes = changed[index].probes.filter((entry) => entry.id !== p.id);
        assert.ok(validate(changed).length, `${scenarios[index].scenarioId} ${p.id}`);
      }
      for (const category of Object.keys(scenarios[index].expected)) {
        const changed = structuredClone(scenarios);
        changed[index].expected[category] = category === 'focus' ? { target: 'body' } : [];
        if (
          JSON.stringify(changed[index].expected[category]) !==
          JSON.stringify(scenarios[index].expected[category])
        )
          assert.ok(validate(changed).length);
      }
    }
  });
  test(`${name}: candidate names, selectors, attributes, events, packages rejected at every normative leaf`, () => {
    const identities = [
      'incumbent',
      'radix',
      'base-ui',
      'zag',
      '@radix-ui/react-popover',
      '@base-ui-components/react',
      '@zag-js/menu',
    ];
    for (const s of scenarios) {
      for (const path of leaves(s))
        for (const identity of identities) {
          const changed = structuredClone(s);
          replace(changed, path, identity);
          assert.ok(
            validateScenario(changed).some((error) => error.includes('coupling')),
            `${s.scenarioId} ${path.join('.')} ${identity}`,
          );
        }
      // Generic protocol permits selector-shaped prose. The immutable contract
      // boundary rejects that same string at every JSON leaf, including prose.
      for (const identity of [
        '[data-incumbent-state]',
        '[data-radix-state]',
        '[data-base-ui-state]',
        '[data-zag-state]',
        'data-incumbent-open',
        'data-radix-open',
        'data-base-ui-open',
        'data-zag-open',
        'incumbent:select',
        'radix:select',
        'baseUiSelect',
        'zag:select',
      ]) {
        for (const path of leaves(s)) {
          const changed = structuredClone(s);
          replace(changed, path, identity);
          // A singleton intentionally isolates record validation. Require the
          // record-mismatch error, never the incidental missing-inventory error.
          assert.ok(
            validate([changed]).some((error) =>
              error.includes('scenarios[0] must match the immutable'),
            ),
            s.scenarioId + ' ' + path.join('.') + ' ' + identity,
          );
        }
      }
    }
  });
  test(`${name}: mutation WebKit omission is rejected`, () => {
    const changed = structuredClone(scenarios);
    for (const s of changed) s.requiredCells = s.requiredCells.filter((c) => c !== 'webkit');
    assert.ok(validate(changed).length);
    assert.ok(forCell('webkit').length > 0);
  });
}
