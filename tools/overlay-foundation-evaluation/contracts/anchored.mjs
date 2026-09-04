import { defineScenario, scenariosForCell, validateCatalog } from './scenario-catalog.mjs';

// Each check is [operation index (or phase), target, property, literal expected value].
export const ANCHORED_SCENARIOS = Object.freeze([
  defineScenario('anchored', {
    id: 'popup-trigger-relationships',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher'],
    cells: [
      'chromium',
      'firefox',
      'webkit',
      'react-18',
      'react-19',
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
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
    ],
    checks: [
      [0, 'trigger', 'semantic-trigger-count', 1],
      [0, 'trigger', 'tab-stop-count', 1],
      [0, 'trigger', 'aria-expanded', false],
      [0, 'trigger', 'aria-controls', 'popup-id'],
      [1, 'trigger', 'aria-expanded', true],
      [1, 'popup', 'id', 'popup-id'],
      [2, 'trigger', 'aria-expanded', false],
      [2, 'trigger', 'aria-controls', 'popup-id'],
      [3, 'popup', 'id', 'popup-id'],
      [
        3,
        'trigger',
        'aria-haspopup-by-component',
        {
          Popover: 'dialog',
          Dropdown: 'menu',
          WorkspaceSwitcher: 'listbox',
        },
      ],
    ],
    focus: [3, 'trigger'],
    relationships: [
      [0, 'trigger', 'aria-controls', 'popup-id'],
      [1, 'trigger', 'aria-controls', 'popup-id'],
    ],
    initial: {
      open: false,
      popupId: 'popup-id',
    },
  }),
  defineScenario('anchored', {
    id: 'preferred-flip-shift-constraint',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher', 'Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'forced-colors', 'coarse-pointer'],
    operations: [
      {
        operation: 'updateContent',
        target: 'geometry-standard-bottom-start',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'resize',
        target: 'trigger-bottom-edge',
      },
      {
        operation: 'resize',
        target: 'trigger-right-edge',
      },
      {
        operation: 'resize',
        target: 'content-height-900',
      },
      {
        operation: 'scroll',
        target: 'constrained-popup-bottom',
      },
    ],
    checks: [
      [1, 'popup', 'side', 'bottom'],
      [1, 'popup', 'alignment', 'start'],
      [1, 'popup', 'visual-viewport-contained', true],
      [2, 'popup', 'side', 'top'],
      [2, 'popup', 'visual-viewport-contained', true],
      [3, 'popup', 'shifted', true],
      [3, 'popup', 'visual-viewport-contained', true],
      [4, 'popup', 'bounded-scroll-region', true],
      [4, 'popup', 'visual-viewport-contained', true],
      [5, 'last-content-element', 'reachable', true],
    ],
    focus: [5, 'trigger'],
    initial: {
      viewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      visualViewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      trigger: {
        x: 300,
        y: 200,
        width: 80,
        height: 40,
      },
      content: {
        width: 200,
        height: 120,
      },
      side: 'bottom',
      align: 'start',
      gap: 8,
      padding: 8,
      presets: {
        'trigger-bottom-edge': {
          x: 300,
          y: 550,
          width: 80,
          height: 40,
        },
        'trigger-right-edge': {
          x: 700,
          y: 550,
          width: 80,
          height: 40,
        },
        'content-height-900': {
          width: 200,
          height: 900,
        },
      },
    },
  }),
  defineScenario('anchored', {
    id: 'live-placement-updates',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher', 'Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'reduced-motion'],
    operations: [
      {
        operation: 'updateContent',
        target: 'geometry-standard-bottom-start',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'resize',
        target: 'trigger-width-160',
      },
      {
        operation: 'resize',
        target: 'content-width-280',
      },
      {
        operation: 'resize',
        target: 'viewport-width-640',
      },
      {
        operation: 'resize',
        target: 'visual-viewport-offset-40',
      },
      {
        operation: 'scroll',
        target: 'ancestor-y-80',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'resize',
        target: 'trigger-width-200',
      },
      {
        operation: 'scroll',
        target: 'ancestor-y-120',
      },
    ],
    checks: [
      [3, 'placement', 'updated-since-operation', true],
      [3, 'popup', 'visual-viewport-contained', true],
      [3, 'document-focus', 'current', 'trigger'],
      [3, 'semantic-events', 'count-since-operation', 0],
      [4, 'placement', 'updated-since-operation', true],
      [4, 'popup', 'visual-viewport-contained', true],
      [4, 'document-focus', 'current', 'trigger'],
      [4, 'semantic-events', 'count-since-operation', 0],
      [5, 'placement', 'updated-since-operation', true],
      [5, 'popup', 'visual-viewport-contained', true],
      [5, 'document-focus', 'current', 'trigger'],
      [5, 'semantic-events', 'count-since-operation', 0],
      [6, 'placement', 'updated-since-operation', true],
      [6, 'popup', 'visual-viewport-contained', true],
      [6, 'document-focus', 'current', 'trigger'],
      [6, 'semantic-events', 'count-since-operation', 0],
      [7, 'placement', 'updated-since-operation', true],
      [7, 'popup', 'visual-viewport-contained', true],
      [7, 'document-focus', 'current', 'trigger'],
      [7, 'semantic-events', 'count-since-operation', 0],
      [8, 'placement-observers', 'active-count', 0],
      [9, 'placement', 'measurement-count-since-operation', 0],
      [10, 'placement', 'measurement-count-since-operation', 0],
    ],
    focus: [10, 'trigger'],
    initial: {
      viewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      visualViewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      trigger: {
        x: 300,
        y: 200,
        width: 80,
        height: 40,
      },
      content: {
        width: 200,
        height: 120,
      },
      side: 'bottom',
      align: 'start',
      gap: 8,
      padding: 8,
      presets: {
        'trigger-bottom-edge': {
          x: 300,
          y: 550,
          width: 80,
          height: 40,
        },
        'trigger-right-edge': {
          x: 700,
          y: 550,
          width: 80,
          height: 40,
        },
        'content-height-900': {
          width: 200,
          height: 900,
        },
      },
    },
  }),
  defineScenario('anchored', {
    id: 'logical-direction',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher', 'Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'ltr', 'rtl'],
    operations: [
      {
        operation: 'setDirection',
        target: 'ltr',
      },
      {
        operation: 'updateContent',
        target: 'placement-bottom-start',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'placement-bottom-end',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'placement-top-start',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'placement-inline-start-center',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'placement-inline-end-center',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'setDirection',
        target: 'rtl',
      },
      {
        operation: 'updateContent',
        target: 'placement-bottom-start',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'placement-bottom-end',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'placement-top-start',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'placement-inline-start-center',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'placement-inline-end-center',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'close',
        target: 'popup',
      },
    ],
    checks: [
      [2, 'popup', 'physical-side', 'bottom'],
      [2, 'popup', 'alignment-edge', 'left'],
      [2, 'popup', 'public-placement', 'bottom-start'],
      [5, 'popup', 'physical-side', 'bottom'],
      [5, 'popup', 'alignment-edge', 'right'],
      [5, 'popup', 'public-placement', 'bottom-end'],
      [8, 'popup', 'physical-side', 'top'],
      [8, 'popup', 'alignment-edge', 'left'],
      [8, 'popup', 'public-placement', 'top-start'],
      [11, 'popup', 'physical-side', 'left'],
      [11, 'popup', 'alignment-edge', 'center'],
      [11, 'popup', 'public-placement', 'inline-start-center'],
      [14, 'popup', 'physical-side', 'right'],
      [14, 'popup', 'alignment-edge', 'center'],
      [14, 'popup', 'public-placement', 'inline-end-center'],
      [18, 'popup', 'physical-side', 'bottom'],
      [18, 'popup', 'alignment-edge', 'right'],
      [18, 'popup', 'public-placement', 'bottom-start'],
      [21, 'popup', 'physical-side', 'bottom'],
      [21, 'popup', 'alignment-edge', 'left'],
      [21, 'popup', 'public-placement', 'bottom-end'],
      [24, 'popup', 'physical-side', 'top'],
      [24, 'popup', 'alignment-edge', 'right'],
      [24, 'popup', 'public-placement', 'top-start'],
      [27, 'popup', 'physical-side', 'right'],
      [27, 'popup', 'alignment-edge', 'center'],
      [27, 'popup', 'public-placement', 'inline-start-center'],
      [30, 'popup', 'physical-side', 'left'],
      [30, 'popup', 'alignment-edge', 'center'],
      [30, 'popup', 'public-placement', 'inline-end-center'],
    ],
    focus: [31, 'trigger'],
    initial: {
      viewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      visualViewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      trigger: {
        x: 300,
        y: 200,
        width: 80,
        height: 40,
      },
      content: {
        width: 200,
        height: 120,
      },
      side: 'bottom',
      align: 'start',
      gap: 8,
      padding: 8,
      presets: {
        'trigger-bottom-edge': {
          x: 300,
          y: 550,
          width: 80,
          height: 40,
        },
        'trigger-right-edge': {
          x: 700,
          y: 550,
          width: 80,
          height: 40,
        },
        'content-height-900': {
          width: 200,
          height: 900,
        },
      },
    },
  }),
  defineScenario('anchored', {
    id: 'nested-child-pointer-origin',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher'],
    cells: ['chromium', 'firefox', 'webkit', 'coarse-pointer'],
    operations: [
      {
        operation: 'open',
        target: 'parent-trigger',
      },
      {
        operation: 'open',
        target: 'child-trigger',
      },
      {
        operation: 'point',
        target: 'child-down',
      },
      {
        operation: 'point',
        target: 'child-up',
      },
      {
        operation: 'point',
        target: 'outside-down',
      },
      {
        operation: 'point',
        target: 'inside-up',
      },
      {
        operation: 'point',
        target: 'inside-down',
      },
      {
        operation: 'point',
        target: 'outside-up',
      },
      {
        operation: 'point',
        target: 'outside-down',
      },
      {
        operation: 'point',
        target: 'outside-drag',
      },
      {
        operation: 'point',
        target: 'outside-up',
      },
      {
        operation: 'point',
        target: 'outside-down',
      },
      {
        operation: 'point',
        target: 'outside-pointer-cancel',
      },
      {
        operation: 'point',
        target: 'outside-up',
      },
      {
        operation: 'point',
        target: 'outside-context-menu-down',
      },
      {
        operation: 'point',
        target: 'outside-context-menu-up',
      },
      {
        operation: 'point',
        target: 'outside-down',
      },
      {
        operation: 'point',
        target: 'outside-up',
      },
    ],
    checks: [
      [2, 'parent-popup', 'open', true],
      [2, 'child-popup', 'open', true],
      [3, 'parent-popup', 'open', true],
      [3, 'child-popup', 'open', true],
      [4, 'parent-popup', 'open', true],
      [4, 'child-popup', 'open', true],
      [5, 'parent-popup', 'open', true],
      [5, 'child-popup', 'open', true],
      [6, 'parent-popup', 'open', true],
      [6, 'child-popup', 'open', true],
      [7, 'parent-popup', 'open', true],
      [7, 'child-popup', 'open', true],
      [8, 'parent-popup', 'open', true],
      [8, 'child-popup', 'open', true],
      [9, 'parent-popup', 'open', true],
      [9, 'child-popup', 'open', true],
      [10, 'parent-popup', 'open', true],
      [10, 'child-popup', 'open', true],
      [11, 'parent-popup', 'open', true],
      [11, 'child-popup', 'open', true],
      [12, 'parent-popup', 'open', true],
      [12, 'child-popup', 'open', true],
      [13, 'parent-popup', 'open', true],
      [13, 'child-popup', 'open', true],
      [14, 'parent-popup', 'open', true],
      [14, 'child-popup', 'open', true],
      [15, 'parent-popup', 'open', true],
      [15, 'child-popup', 'open', true],
      [16, 'child-popup', 'open', true],
      [17, 'child-popup', 'open', false],
      [17, 'dismissal', 'close-count', 1],
    ],
    focus: [17, 'child-trigger'],
    initial: {
      nested: true,
    },
  }),
  defineScenario('anchored', {
    id: 'topmost-escape-restoration',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'ltr', 'rtl'],
    operations: [
      {
        operation: 'open',
        target: 'parent-trigger',
      },
      {
        operation: 'open',
        target: 'child-trigger',
      },
      {
        operation: 'focus',
        target: 'child-command',
      },
      {
        operation: 'press',
        target: 'escape-key',
      },
      {
        operation: 'close',
        target: 'parent-popup',
      },
      {
        operation: 'open',
        target: 'parent-trigger',
      },
      {
        operation: 'focus',
        target: 'parent-trigger',
      },
      {
        operation: 'press',
        target: 'escape-key',
      },
    ],
    checks: [
      [3, 'child-popup', 'open', false],
      [3, 'parent-popup', 'open', true],
      [3, 'document-focus', 'current', 'child-trigger'],
      [3, 'child-trigger', 'inside-parent', true],
      [7, 'parent-popup', 'open', false],
      [7, 'document-focus', 'move-count-since-operation', 0],
    ],
    focus: [7, 'parent-trigger'],
  }),
  defineScenario('anchored', {
    id: 'portal-context',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher', 'Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'axe-light', 'axe-dark'],
    operations: [
      {
        operation: 'setDirection',
        target: 'rtl',
      },
      {
        operation: 'updateContent',
        target: 'theme-dark-brand-ocean',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'updateContent',
        target: 'portal-host-secondary',
      },
      {
        operation: 'point',
        target: 'popup-content-down',
      },
      {
        operation: 'point',
        target: 'popup-content-up',
      },
      {
        operation: 'close',
        target: 'popup',
      },
    ],
    checks: [
      [3, 'popup', 'theme', 'dark'],
      [3, 'popup', 'brand', 'ocean'],
      [3, 'popup', 'direction', 'rtl'],
      [3, 'popup', 'portal-host', 'secondary'],
      [3, 'trigger', 'relationship-target-exists', true],
      [5, 'content-handler', 'invocation-count', 1],
      [6, 'document-focus', 'current', 'trigger'],
    ],
    focus: [6, 'trigger'],
    relationships: [[3, 'trigger', 'semantic-relationship', 'popup-id']],
    initial: {
      portalHost: 'primary',
      popupId: 'popup-id',
    },
  }),
  defineScenario('anchored', {
    id: 'trigger-removal-successor',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'focus',
        target: 'popup-command',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'focus',
        target: 'popup-command',
      },
      {
        operation: 'updateContent',
        target: 'remove-trigger-successor-command',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'updateContent',
        target: 'restore-trigger',
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'focus',
        target: 'popup-command',
      },
      {
        operation: 'updateContent',
        target: 'remove-trigger-successor-region',
      },
      {
        operation: 'close',
        target: 'popup',
      },
    ],
    checks: [
      [2, 'document-focus', 'current', 'trigger'],
      [5, 'trigger', 'connected', false],
      [6, 'document-focus', 'current', 'successor-command'],
      [10, 'trigger', 'connected', false],
      [11, 'document-focus', 'current', 'successor-region'],
      [11, 'document-body', 'focus-received', false],
    ],
    focus: [11, 'successor-region'],
    initial: {
      successorCommand: 'successor-command',
      successorRegion: 'successor-region',
    },
  }),
  defineScenario('anchored', {
    id: 'teardown',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher', 'Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'reduced-motion'],
    operations: [
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'point',
        target: 'outside-down',
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'destroy',
        target: 'popup',
      },
      {
        operation: 'destroy',
        target: 'popup',
      },
      {
        operation: 'resize',
        target: 'trigger-width-160',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 500,
      },
    ],
    checks: [
      [2, 'observer', 'active-count', 0],
      [4, 'observer', 'release-count', 1],
      [2, 'listener', 'active-count', 0],
      [4, 'listener', 'release-count', 1],
      [2, 'pointer-record', 'active-count', 0],
      [4, 'pointer-record', 'release-count', 1],
      [2, 'portal', 'active-count', 0],
      [4, 'portal', 'release-count', 1],
      [2, 'stale-callback', 'active-count', 0],
      [4, 'stale-callback', 'release-count', 1],
      [6, 'popup', 'open', false],
      [6, 'placement', 'measurement-count-since-close', 0],
      [6, 'announcements', 'count-since-close', 0],
    ],
    focus: [6, 'trigger'],
    cleanup: [
      ['cleanup', 'observer', 'released-once'],
      ['cleanup', 'listener', 'released-once'],
      ['cleanup', 'pointer-record', 'released-once'],
      ['cleanup', 'portal', 'released-once'],
      ['cleanup', 'stale-callback', 'released-once'],
    ],
  }),
  defineScenario('anchored', {
    id: 'ssr-semantics',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher', 'Tooltip'],
    cells: ['ssr'],
    operations: [
      {
        operation: 'updateContent',
        target: 'server-render-closed',
      },
      {
        operation: 'updateContent',
        target: 'server-render-open',
      },
    ],
    checks: [
      ['server', 'browser-globals', 'accessed', false],
      ['server', 'popup', 'stable-id', 'popup-id'],
      ['server', 'popup', 'named', true],
      ['server', 'popup', 'modal', false],
      ['server', 'trigger', 'relationship-target-exists', true],
      ['server', 'server-render', 'deterministic', true],
    ],
    focus: ['server', 'server-focus-unchanged'],
    relationships: [['server', 'trigger', 'semantic-relationship', 'popup-id']],
    initial: {
      environment: 'server',
      popupId: 'popup-id',
    },
  }),
  defineScenario('anchored', {
    id: 'hydration-stability',
    components: ['Popover', 'Dropdown', 'WorkspaceSwitcher', 'Tooltip'],
    cells: ['react-18', 'react-19', 'hydration'],
    operations: [
      {
        operation: 'updateContent',
        target: 'server-render-open',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'updateContent',
        target: 'hydrate-first-tree',
      },
      {
        operation: 'point',
        target: 'trigger-down',
      },
      {
        operation: 'point',
        target: 'trigger-up',
      },
    ],
    checks: [
      [2, 'first-tree', 'identical', true],
      [2, 'popup', 'id', 'popup-id'],
      [2, 'trigger', 'relationship-target-exists', true],
      [2, 'popup', 'open', true],
      [2, 'document-focus', 'current', 'trigger'],
      [2, 'semantic-events', 'count', 0],
      [2, 'hydration-warnings', 'count', 0],
      [4, 'trigger-handler', 'invocation-count', 1],
    ],
    focus: [4, 'trigger'],
    initial: {
      popupId: 'popup-id',
      open: true,
    },
  }),
]);

export function anchoredScenariosForCell(cellId) {
  return scenariosForCell(ANCHORED_SCENARIOS, cellId);
}
export function validateAnchoredCoverage(scenarios) {
  return validateCatalog(scenarios, ANCHORED_SCENARIOS, 'OF-ANCHORED');
}
