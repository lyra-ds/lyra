import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CANDIDATE_IDS,
  CONTRACT_IDS,
  FAILURE_CLASSIFICATIONS,
  FIXTURE_OPERATIONS,
  RESULTS,
  validateScenario,
} from './protocol.mjs';

const validScenario = {
  schemaVersion: 1,
  revision: 1,
  contractId: 'OF-MODAL',
  scenarioId: 'of-modal.initial-focus.v1',
  components: ['Dialog'],
  initial: { markup: '<button>Open</button>', state: { open: false } },
  operations: [{ operation: 'open', target: 'primary-trigger' }],
  expected: {
    roles: [{ role: 'dialog', name: 'Settings' }],
    relationships: [],
    states: [{ target: 'dialog', name: 'open', value: true }],
    focus: { target: 'first-focusable' },
    events: [],
    announcements: [],
    cleanup: ['body-scroll-unlocked', 'background-interactive'],
  },
  requiredCells: ['chromium', 'firefox', 'webkit'],
  capture: ['dom', 'accessibility-tree', 'events'],
};

test('exports the five immutable contract IDs', () => {
  assert.deepEqual(CONTRACT_IDS, [
    'OF-MODAL',
    'OF-ANCHORED',
    'OF-MENU',
    'OF-TOOLTIP',
    'OF-COMPOSED',
  ]);
  assert.throws(() => CONTRACT_IDS.push('OF-EXTRA'), TypeError);
});

test('exports the shared immutable protocol vocabularies', () => {
  assert.deepEqual(CANDIDATE_IDS, ['incumbent', 'radix', 'base-ui', 'zag']);
  assert.deepEqual(RESULTS, ['PASS', 'FAIL', 'unavailable']);
  assert.deepEqual(FAILURE_CLASSIFICATIONS, [
    'product',
    'fixture',
    'infrastructure',
    'security',
    'packaging',
    'measurement',
    'policy',
  ]);
  assert.deepEqual(FIXTURE_OPERATIONS, [
    'open',
    'close',
    'press',
    'point',
    'setDirection',
    'setMotionPreference',
    'updateContent',
    'destroy',
    'focus',
    'blur',
    'hover',
    'advanceTime',
    'resize',
    'scroll',
  ]);
});

test('accepts only the closed browser-clock timing operation shape', () => {
  const scenario = structuredClone(validScenario);
  scenario.operations = [{ operation: 'advanceTime', target: 'browser-clock', milliseconds: 0 }];
  assert.deepEqual(validateScenario(scenario), []);
});

for (const milliseconds of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
  test(`rejects an invalid timing delay ${milliseconds}`, () => {
    const scenario = structuredClone(validScenario);
    scenario.operations = [{ operation: 'advanceTime', target: 'browser-clock', milliseconds }];
    assert.match(validateScenario(scenario).join('\n'), /milliseconds/u);
  });
}

test('rejects timing fields on ordinary operations and non-clock timing targets', () => {
  const ordinary = structuredClone(validScenario);
  ordinary.operations[0].milliseconds = 1;
  assert.match(validateScenario(ordinary).join('\n'), /unsupported key/u);
  const timing = structuredClone(validScenario);
  timing.operations = [{ operation: 'advanceTime', target: 'page-clock', milliseconds: 1 }];
  assert.match(validateScenario(timing).join('\n'), /browser-clock/u);
});

test('accepts a complete candidate-neutral scenario', () => {
  assert.deepEqual(validateScenario(validScenario), []);
});

for (const forbiddenKey of ['candidateId', 'vendorSelector', 'vendorAttribute']) {
  test(`rejects scenario-owned ${forbiddenKey}`, () => {
    assert.match(
      validateScenario({ ...validScenario, [forbiddenKey]: 'radix' }).join('\n'),
      /unsupported key/u,
    );
  });
}

test('rejects unknown operations and missing expected focus', () => {
  const scenario = structuredClone(validScenario);
  scenario.operations = [{ operation: 'clickVendorNode', target: 'x' }];
  delete scenario.expected.focus;
  const errors = validateScenario(scenario).join('\n');
  assert.match(errors, /operation is invalid/u);
  assert.match(errors, /expected.focus/u);
});

test('accepts closed candidate-neutral relationship, event, and announcement shapes', () => {
  const scenario = structuredClone(validScenario);
  scenario.expected.relationships = [{ source: 'trigger', name: 'controls', target: 'dialog' }];
  scenario.expected.events = [{ target: 'dialog', type: 'opened' }];
  scenario.expected.announcements = [{ message: 'Settings opened' }];
  assert.deepEqual(validateScenario(scenario), []);
});

test('accepts neutral prose and strings that merely contain candidate-like text', () => {
  const scenario = structuredClone(validScenario);
  scenario.initial.state = {
    motion: 'zigzag',
    algorithm: 'radix sort',
    account: 'incumbent account',
  };
  scenario.initial.markup =
    '<button title="a > b">Open incumbent account</button><p>2 < 3 and the radix sort is ready.</p>';
  scenario.expected.announcements = [{ message: 'The radix sort is complete.' }];
  assert.deepEqual(validateScenario(scenario), []);
});

for (const [label, state] of [
  ['selector value', { selector: '[data-radix-dialog-content]' }],
  ['attribute value', { configuration: { attribute: 'data-radix-trigger' } }],
  ['part array value', { parts: ['trigger', 'BaseUIOverlay'] }],
  ['event type value', { eventType: 'zag.open' }],
  ['class-like value', { className: 'radix-dialog' }],
  ['ID-like value', { triggerId: '@zag-js/dialog' }],
]) {
  test(`rejects candidate coupling hidden in neutral control ${label}`, () => {
    const scenario = structuredClone(validScenario);
    scenario.initial.state = state;
    assert.match(validateScenario(scenario).join('\n'), /candidate or vendor coupling/u);
  });
}

for (const [label, markup] of [
  ['attribute name', '<button data-radix-trigger>Open</button>'],
  ['quoted greater-than bypass', '<div title="a > b" data-radix-trigger>Content</div>'],
  ['class value', '<div class="base-ui-dialog">Content</div>'],
  ['ID value', '<div id="zag-tooltip">Content</div>'],
  ['custom tag name', '<radix-dialog>Content</radix-dialog>'],
]) {
  test(`rejects candidate coupling in markup ${label}`, () => {
    const scenario = structuredClone(validScenario);
    scenario.initial.markup = markup;
    assert.match(validateScenario(scenario).join('\n'), /candidate or vendor coupling/u);
  });
}

for (const [label, markup] of [
  ['unterminated quoted attribute', '<div title="unterminated>Content</div>'],
  ['missing attribute value', '<div title=></div>'],
  ['incomplete opening tag', '<div title="neutral"'],
  ['missing attribute separator', '<div title="neutral"class="dialog"></div>'],
  ['invalid tag-name delimiter', '<div$invalid></div>'],
  ['invalid attribute-name character', '<div title`invalid></div>'],
]) {
  test(`rejects malformed markup with ${label}`, () => {
    const scenario = structuredClone(validScenario);
    scenario.initial.markup = markup;
    assert.match(validateScenario(scenario).join('\n'), /malformed|incomplete/u);
  });
}

test('accepts neutral prose with valid identifiers in every normative identifier path', () => {
  const scenario = structuredClone(validScenario);
  scenario.components = ['Dialog'];
  scenario.operations = [{ operation: 'open', target: 'primary-trigger' }];
  scenario.expected.roles = [{ role: 'dialog', name: 'radix sort' }];
  scenario.expected.relationships = [{ source: 'trigger', name: 'controls', target: 'dialog' }];
  scenario.expected.states = [{ target: 'dialog', name: 'open', value: true }];
  scenario.expected.focus = { target: 'first-focusable' };
  scenario.expected.events = [{ target: 'dialog', type: 'opened' }];
  scenario.expected.announcements = [{ message: 'The incumbent account is ready.' }];
  assert.deepEqual(validateScenario(scenario), []);
});

for (const [label, mutate] of [
  [
    'scenarioId',
    (scenario) => {
      scenario.scenarioId = 'radix.modal.v1';
    },
  ],
  [
    'components item',
    (scenario) => {
      scenario.components = ['radix-dialog'];
    },
  ],
  [
    'PascalCase components item',
    (scenario) => {
      scenario.components = ['RadixDialog'];
    },
  ],
  [
    'uppercase acronym components item',
    (scenario) => {
      scenario.components = ['BaseUIDialog'];
    },
  ],
  [
    'operation.operation',
    (scenario) => {
      scenario.operations[0].operation = 'radix-open';
    },
  ],
  [
    'operation.target',
    (scenario) => {
      scenario.operations[0].target = 'radix-trigger';
    },
  ],
  [
    'role',
    (scenario) => {
      scenario.expected.roles[0].role = 'radix-dialog';
    },
  ],
  [
    'relationship source',
    (scenario) => {
      scenario.expected.relationships = [
        { source: 'radix-trigger', name: 'controls', target: 'dialog' },
      ];
    },
  ],
  [
    'relationship name',
    (scenario) => {
      scenario.expected.relationships = [
        { source: 'trigger', name: 'radix-controls', target: 'dialog' },
      ];
    },
  ],
  [
    'relationship target',
    (scenario) => {
      scenario.expected.relationships = [
        { source: 'trigger', name: 'controls', target: 'radix-dialog' },
      ];
    },
  ],
  [
    'state target',
    (scenario) => {
      scenario.expected.states[0].target = 'radix-dialog';
    },
  ],
  [
    'state name',
    (scenario) => {
      scenario.expected.states[0].name = 'radix-open';
    },
  ],
  [
    'focus target',
    (scenario) => {
      scenario.expected.focus.target = 'radix-focus';
    },
  ],
  [
    'camelCase focus target',
    (scenario) => {
      scenario.expected.focus.target = 'radixDialog';
    },
  ],
  [
    'event target',
    (scenario) => {
      scenario.expected.events = [{ target: 'radix-dialog', type: 'opened' }];
    },
  ],
  [
    'event type',
    (scenario) => {
      scenario.expected.events = [{ target: 'dialog', type: 'radix-opened' }];
    },
  ],
  [
    'cleanup item',
    (scenario) => {
      scenario.expected.cleanup = ['radix-cleanup'];
    },
  ],
  [
    'requiredCells item',
    (scenario) => {
      scenario.requiredCells = ['radix-browser'];
    },
  ],
  [
    'capture item',
    (scenario) => {
      scenario.capture = ['radix-events'];
    },
  ],
]) {
  test(`rejects candidate token in identifier path ${label}`, () => {
    const scenario = structuredClone(validScenario);
    mutate(scenario);
    assert.match(validateScenario(scenario).join('\n'), /candidate or vendor coupling/u);
  });
}

test('requires the terminal scenario revision suffix to match revision', () => {
  const scenario = structuredClone(validScenario);
  scenario.revision = 2;
  assert.match(validateScenario(scenario).join('\n'), /scenarioId.*revision/u);
});

for (const key of ['candidateIndex', 'candidateVariant', 'vendorMode']) {
  test(`rejects nested coupling key ${key}`, () => {
    const scenario = structuredClone(validScenario);
    scenario.initial.state[key] = 'neutral';
    assert.match(validateScenario(scenario).join('\n'), /candidate or vendor coupling/u);
  });
}

for (const identity of ['radix', 'base-ui', 'zag', 'incumbent']) {
  test(`rejects exact candidate identity ${identity} in generic state`, () => {
    const scenario = structuredClone(validScenario);
    scenario.initial.state.library = identity;
    assert.match(validateScenario(scenario).join('\n'), /candidate or vendor coupling/u);
  });
}

for (const identity of ['@radix-ui/react-popover', '@base-ui-components/react/menu', '@zag-js/tooltip']) {
  test(`rejects additional candidate package identity ${identity} in normative state`, () => {
    const scenario = structuredClone(validScenario);
    scenario.initial.state.library = identity;
    assert.match(validateScenario(scenario).join('\n'), /candidate or vendor coupling/u);
  });
}

for (const [label, mutate] of [
  [
    'nested initial state',
    (scenario) => {
      scenario.initial.state.vendorAttribute = 'data-radix';
    },
  ],
  [
    'operation target',
    (scenario) => {
      scenario.operations[0].target = 'radix-trigger';
    },
  ],
  [
    'relationship',
    (scenario) => {
      scenario.expected.relationships = [
        { source: 'trigger', name: 'controls', target: 'dialog', vendorSelector: '[data-radix]' },
      ];
    },
  ],
  [
    'event',
    (scenario) => {
      scenario.expected.events = [{ target: 'dialog', type: 'opened', vendorEvent: 'radix:open' }];
    },
  ],
  [
    'announcement',
    (scenario) => {
      scenario.expected.announcements = [{ message: 'base-ui' }];
    },
  ],
  [
    'identifier token',
    (scenario) => {
      scenario.expected.events = [{ target: '@zag-js/dialog', type: 'opened' }];
    },
  ],
]) {
  test(`rejects candidate coupling in ${label}`, () => {
    const scenario = structuredClone(validScenario);
    mutate(scenario);
    assert.match(validateScenario(scenario).join('\n'), /candidate or vendor coupling/u);
  });
}
