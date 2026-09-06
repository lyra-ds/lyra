import { defineScenario, scenariosForCell, validateCatalog } from './scenario-catalog.mjs';

// Each check is [operation index (or phase), target, property, literal expected value].
// Disabled rows evaluate the required behavior; they do not claim production API support.
export const MENU_SCENARIOS = Object.freeze([
  defineScenario('menu', {
    id: 'trigger-entry-keys',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'react-18', 'react-19', 'keyboard-focus'],
    operations: [
      { operation: 'updateContent', target: 'menu-disabled-boundary-rows' },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'menu',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'space-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'menu',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'menu',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'arrow-up-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'menu',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'point',
        target: 'trigger-down',
      },
      {
        operation: 'point',
        target: 'trigger-up',
      },
      {
        operation: 'press',
        target: 'home-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [3, 'menu', 'open', true],
      [3, 'document-focus', 'current', 'alpha'],
      [8, 'menu', 'open', true],
      [8, 'document-focus', 'current', 'alpha'],
      [13, 'menu', 'open', true],
      [13, 'document-focus', 'current', 'alpha'],
      [18, 'menu', 'open', true],
      [18, 'document-focus', 'current', 'bravo'],
      [22, 'menu', 'reachable', true],
      [24, 'document-focus', 'current', 'disabled-first'],
    ],
    focus: [24, 'disabled-first'],
    initial: {
      items: [
        { id: 'disabled-first', text: 'Unavailable first', kind: 'command', disabled: true },
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
        { id: 'disabled-last', text: 'Unavailable last', kind: 'command', disabled: true },
      ],
      locale: 'en',
      open: false,
    },
    roles: [[24, 'menu', 'menu', 'Workspace']],
  }),
  defineScenario('menu', {
    id: 'arrow-wrap-roving-focus',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-up-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-up-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-up-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-up-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [4, 'document-focus', 'current', 'beta'],
      [4, 'menu', 'tabindex-zero-item-count', 1],
      [4, 'beta', 'tabindex', 0],
      [4, 'other-command-items', 'tabindex', -1],
      [4, 'menu', 'aria-activedescendant-present', false],
      [6, 'document-focus', 'current', 'alpine'],
      [6, 'menu', 'tabindex-zero-item-count', 1],
      [6, 'alpine', 'tabindex', 0],
      [6, 'other-command-items', 'tabindex', -1],
      [6, 'menu', 'aria-activedescendant-present', false],
      [8, 'document-focus', 'current', 'bravo'],
      [8, 'menu', 'tabindex-zero-item-count', 1],
      [8, 'bravo', 'tabindex', 0],
      [8, 'other-command-items', 'tabindex', -1],
      [8, 'menu', 'aria-activedescendant-present', false],
      [10, 'document-focus', 'current', 'alpha'],
      [10, 'menu', 'tabindex-zero-item-count', 1],
      [10, 'alpha', 'tabindex', 0],
      [10, 'other-command-items', 'tabindex', -1],
      [10, 'menu', 'aria-activedescendant-present', false],
      [12, 'document-focus', 'current', 'bravo'],
      [12, 'menu', 'tabindex-zero-item-count', 1],
      [12, 'bravo', 'tabindex', 0],
      [12, 'other-command-items', 'tabindex', -1],
      [12, 'menu', 'aria-activedescendant-present', false],
      [14, 'document-focus', 'current', 'alpine'],
      [14, 'menu', 'tabindex-zero-item-count', 1],
      [14, 'alpine', 'tabindex', 0],
      [14, 'other-command-items', 'tabindex', -1],
      [14, 'menu', 'aria-activedescendant-present', false],
      [16, 'document-focus', 'current', 'beta'],
      [16, 'menu', 'tabindex-zero-item-count', 1],
      [16, 'beta', 'tabindex', 0],
      [16, 'other-command-items', 'tabindex', -1],
      [16, 'menu', 'aria-activedescendant-present', false],
      [18, 'document-focus', 'current', 'alpha'],
      [18, 'menu', 'tabindex-zero-item-count', 1],
      [18, 'alpha', 'tabindex', 0],
      [18, 'other-command-items', 'tabindex', -1],
      [18, 'menu', 'aria-activedescendant-present', false],
    ],
    focus: [18, 'alpha'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
  defineScenario('menu', {
    id: 'home-end-structural-skip',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'end-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'home-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [4, 'document-focus', 'current', 'bravo'],
      [6, 'document-focus', 'current', 'alpha'],
      [8, 'document-focus', 'current', 'beta'],
      [10, 'document-focus', 'current', 'alpine'],
      [10, 'label', 'focus-count', 0],
      [10, 'separator', 'focus-count', 0],
    ],
    focus: [10, 'alpine'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
  defineScenario('menu', {
    id: 'disabled-discovery-no-activation',
    components: ['Dropdown'],
    cells: [
      'chromium',
      'firefox',
      'webkit',
      'keyboard-focus',
      'axe-light',
      'axe-dark',
      'forced-colors',
    ],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'space-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'point',
        target: 'beta-down',
      },
      {
        operation: 'point',
        target: 'beta-up',
      },
    ],
    checks: [
      [4, 'beta', 'aria-disabled', true],
      [4, 'document-focus', 'current', 'beta'],
      [4, 'beta', 'tabindex', 0],
      [4, 'menu', 'tabindex-zero-item-count', 1],
      [6, 'beta', 'activation-count', 0],
      [6, 'selection-handler', 'invocation-count', 0],
      [6, 'menu', 'selection', null],
      [6, 'menu', 'open', true],
      [8, 'beta', 'activation-count', 0],
      [8, 'selection-handler', 'invocation-count', 0],
      [8, 'menu', 'selection', null],
      [8, 'menu', 'open', true],
      [10, 'beta', 'activation-count', 0],
      [10, 'selection-handler', 'invocation-count', 0],
      [10, 'menu', 'selection', null],
      [10, 'menu', 'open', true],
    ],
    focus: [10, 'beta'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
    roles: [[4, 'beta', 'menuitem', 'Beta']],
  }),
  defineScenario('menu', {
    id: 'typeahead-reset-wrap',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'ltr', 'rtl'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'press',
        target: 'character-b',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 499,
      },
      {
        operation: 'press',
        target: 'character-r',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 499,
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 1,
      },
      {
        operation: 'press',
        target: 'end-key',
      },
      {
        operation: 'press',
        target: 'character-á',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 500,
      },
      {
        operation: 'press',
        target: 'character-B',
      },
      {
        operation: 'press',
        target: 'character-z',
      },
    ],
    checks: [
      [2, 'document-focus', 'current', 'beta'],
      [3, 'typeahead', 'buffer', 'b'],
      [4, 'document-focus', 'current', 'bravo'],
      [5, 'typeahead', 'buffer', 'br'],
      [6, 'typeahead', 'buffer', ''],
      [8, 'document-focus', 'current', 'alpha'],
      [9, 'typeahead', 'buffer', ''],
      [10, 'document-focus', 'current', 'beta'],
      [10, 'beta', 'aria-disabled', true],
      [11, 'document-focus', 'current', 'beta'],
      [11, 'typeahead', 'search-wrap-count', 1],
      [11, 'selection-handler', 'invocation-count', 0],
      [11, 'menu', 'open', true],
    ],
    focus: [11, 'beta'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
  defineScenario('menu', {
    id: 'repeated-character-cycle',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'press',
        target: 'character-b',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 499,
      },
      {
        operation: 'press',
        target: 'character-b',
      },
      {
        operation: 'press',
        target: 'character-b',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 499,
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 1,
      },
      {
        operation: 'press',
        target: 'character-b',
      },
    ],
    checks: [
      [2, 'document-focus', 'current', 'beta'],
      [3, 'typeahead', 'buffer', 'b'],
      [4, 'document-focus', 'current', 'bravo'],
      [4, 'typeahead', 'buffer', 'b'],
      [5, 'document-focus', 'current', 'beta'],
      [6, 'typeahead', 'buffer', 'b'],
      [7, 'typeahead', 'buffer', ''],
      [8, 'document-focus', 'current', 'bravo'],
      [8, 'selection-handler', 'invocation-count', 0],
    ],
    focus: [8, 'bravo'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
  defineScenario('menu', {
    id: 'cancelable-selection',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'react-18', 'react-19'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'updateContent',
        target: 'cancel-selection-default',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'end-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'space-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [4, 'selection-handler', 'invocation-count', 1],
      [4, 'menu', 'selection', 'alpha'],
      [4, 'menu', 'open', false],
      [12, 'selection-handler', 'invocation-count', 2],
      [12, 'menu', 'selection', 'alpha'],
      [12, 'menu', 'open', true],
      [12, 'selection-event', 'default-prevented', true],
    ],
    focus: [12, 'bravo'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
  defineScenario('menu', {
    id: 'tab-native-exit',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'tab-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'shift-tab-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [4, 'menu', 'open', false],
      [4, 'document-focus', 'current', 'after-menu'],
      [4, 'trigger', 'restoration-count', 0],
      [9, 'menu', 'open', false],
      [9, 'document-focus', 'current', 'before-menu'],
      [9, 'trigger', 'restoration-count', 0],
    ],
    focus: [9, 'before-menu'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
  defineScenario('menu', {
    id: 'escape-successor-restoration',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'escape-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'updateContent',
        target: 'remove-trigger-successor-command',
      },
      {
        operation: 'press',
        target: 'escape-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [4, 'menu', 'open', false],
      [4, 'document-focus', 'current', 'trigger'],
      [10, 'menu', 'open', false],
      [10, 'document-focus', 'current', 'successor-command'],
      [10, 'document-body', 'focus-received', false],
    ],
    focus: [10, 'successor-command'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
  defineScenario('menu', {
    id: 'public-model-variant-boundary',
    components: ['Dropdown'],
    cells: [
      'chromium',
      'firefox',
      'webkit',
      'axe-light',
      'axe-dark',
      'forced-colors',
      'ltr',
      'rtl',
    ],
    operations: [
      {
        operation: 'updateContent',
        target: 'current-public-command-label-separator-model',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-right-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'arrow-left-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'press',
        target: 'space-key',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [3, 'public-model', 'submenu', 'not-applicable-current-public-model'],
      [3, 'public-model', 'checkbox', 'not-applicable-current-public-model'],
      [3, 'public-model', 'radio', 'not-applicable-current-public-model'],
      [3, 'menu', 'allowed-item-roles', ['menuitem', 'separator', 'presentation']],
      [3, 'menu', 'menuitemcheckbox-count', 0],
      [3, 'menu', 'menuitemradio-count', 0],
      [3, 'menu', 'submenu-trigger-count', 0],
      [5, 'menu', 'nested-menu-count', 0],
      [7, 'menu', 'nested-menu-count', 0],
      [9, 'menu', 'checked-state-count', 0],
    ],
    focus: [9, 'trigger'],
    initial: {
      publicItemKinds: ['command', 'separator', 'label'],
    },
    roles: [[3, 'menu', 'menu', 'Workspace']],
  }),
  defineScenario('menu', {
    id: 'coarse-pointer-selection',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'coarse-pointer'],
    operations: [
      {
        operation: 'point',
        target: 'touch-trigger-down',
      },
      {
        operation: 'point',
        target: 'touch-trigger-up',
      },
      {
        operation: 'point',
        target: 'touch-menu-scroll-start',
      },
      {
        operation: 'point',
        target: 'touch-menu-scroll-move',
      },
      {
        operation: 'point',
        target: 'touch-menu-scroll-end',
      },
      {
        operation: 'point',
        target: 'touch-alpha-down',
      },
      {
        operation: 'point',
        target: 'touch-alpha-up',
      },
    ],
    checks: [
      [1, 'menu', 'open', true],
      [1, 'menu', 'reachable', true],
      [4, 'menu', 'scroll-prevented', false],
      [4, 'menu', 'scroll-position-changed', true],
      [6, 'selection-handler', 'invocation-count', 1],
      [6, 'menu', 'selection', 'alpha'],
      [6, 'menu', 'open', false],
      [6, 'synthetic-hover', 'event-count', 0],
    ],
    focus: [6, 'trigger'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
  defineScenario('menu', {
    id: 'teardown',
    components: ['Dropdown'],
    cells: ['chromium', 'firefox', 'webkit', 'reduced-motion'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
      {
        operation: 'press',
        target: 'character-b',
      },
      {
        operation: 'close',
        target: 'menu',
      },
      {
        operation: 'destroy',
        target: 'menu',
      },
      {
        operation: 'destroy',
        target: 'menu',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 500,
      },
      {
        operation: 'press',
        target: 'arrow-down-key',
      },
    ],
    checks: [
      [3, 'roving-owner', 'active-count', 0],
      [5, 'roving-owner', 'release-count', 1],
      [3, 'typeahead-timer', 'active-count', 0],
      [5, 'typeahead-timer', 'release-count', 1],
      [3, 'dismissal-listeners', 'active-count', 0],
      [5, 'dismissal-listeners', 'release-count', 1],
      [3, 'portal', 'active-count', 0],
      [5, 'portal', 'release-count', 1],
      [3, 'stale-callback', 'active-count', 0],
      [5, 'stale-callback', 'release-count', 1],
      [7, 'menu', 'open', false],
      [7, 'selection-handler', 'invocation-count', 0],
    ],
    focus: [7, 'trigger'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
    cleanup: [
      ['cleanup', 'roving-owner', 'released-once'],
      ['cleanup', 'typeahead-timer', 'released-once'],
      ['cleanup', 'dismissal-listeners', 'released-once'],
      ['cleanup', 'portal', 'released-once'],
      ['cleanup', 'stale-callback', 'released-once'],
    ],
  }),
  defineScenario('menu', {
    id: 'ssr-semantics',
    components: ['Dropdown'],
    cells: ['ssr'],
    operations: [
      {
        operation: 'updateContent',
        target: 'server-render-menu-closed',
      },
      {
        operation: 'updateContent',
        target: 'server-render-menu-open',
      },
    ],
    checks: [
      ['server', 'browser-globals', 'accessed', false],
      ['server', 'trigger', 'closed-aria-expanded', false],
      ['server', 'trigger', 'open-aria-expanded', true],
      ['server', 'menu', 'id', 'menu-id'],
      ['server', 'server-render', 'deterministic', true],
      ['server', 'menu', 'item-roles', ['menuitem', 'menuitem', 'menuitem']],
    ],
    focus: ['server', 'server-focus-unchanged'],
    roles: [
      ['server', 'trigger', 'button', 'Workspace'],
      ['server', 'menu', 'menu', 'Workspace'],
    ],
    relationships: [['server', 'trigger', 'aria-controls', 'menu-id']],
    initial: {
      environment: 'server',
      menuId: 'menu-id',
    },
  }),
  defineScenario('menu', {
    id: 'hydration-stability',
    components: ['Dropdown'],
    cells: ['react-18', 'react-19', 'hydration'],
    operations: [
      {
        operation: 'updateContent',
        target: 'server-render-menu-open-active-alpha',
      },
      {
        operation: 'focus',
        target: 'alpha',
      },
      {
        operation: 'updateContent',
        target: 'hydrate-first-tree',
      },
      {
        operation: 'press',
        target: 'enter-key',
      },
    ],
    checks: [
      [2, 'first-tree', 'identical', true],
      [2, 'menu', 'id', 'menu-id'],
      [2, 'menu', 'active-item', 'alpha'],
      [2, 'menu', 'open', true],
      [2, 'document-focus', 'current', 'alpha'],
      [2, 'selection-handler', 'invocation-count', 0],
      [2, 'hydration-warnings', 'count', 0],
      [3, 'selection-handler', 'invocation-count', 1],
    ],
    focus: [3, 'trigger'],
    initial: {
      items: [
        {
          id: 'alpha',
          text: 'Álpha',
          kind: 'command',
        },
        {
          id: 'label',
          text: 'Group',
          kind: 'label',
        },
        {
          id: 'beta',
          text: 'Beta',
          kind: 'command',
          disabled: true,
        },
        {
          id: 'separator',
          kind: 'separator',
        },
        {
          id: 'alpine',
          text: 'Álpine',
          kind: 'command',
        },
        {
          id: 'bravo',
          text: 'Bravo',
          kind: 'command',
        },
      ],
      locale: 'en',
      open: false,
    },
  }),
]);

export function menuScenariosForCell(cellId) {
  return scenariosForCell(MENU_SCENARIOS, cellId);
}
export function validateMenuCoverage(scenarios) {
  return validateCatalog(scenarios, MENU_SCENARIOS, 'OF-MENU');
}
