import { defineScenario, scenariosForCell, validateCatalog } from './scenario-catalog.mjs';

// Each check is [operation index (or phase), target, property, literal expected value].
export const TOOLTIP_SCENARIOS = Object.freeze([
  defineScenario('tooltip', {
    id: 'focus-immediate-ownership',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'blur',
        target: 'trigger',
      },
      {
        operation: 'focus',
        target: 'outside-control',
      },
      {
        operation: 'hover',
        target: 'trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 500,
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'blur',
        target: 'trigger',
      },
      {
        operation: 'focus',
        target: 'outside-control',
      },
    ],
    checks: [
      [0, 'tooltip', 'open', true],
      [0, 'document-focus', 'current', 'trigger'],
      [0, 'tooltip', 'elapsed-open-delay', 0],
      [1, 'tooltip', 'open', false],
      [4, 'tooltip', 'open', true],
      [6, 'tooltip', 'open', true],
      [7, 'tooltip', 'open', true],
    ],
    focus: [7, 'outside-control'],
  }),
  defineScenario('tooltip', {
    id: 'hover-initial-delay',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit'],
    operations: [
      {
        operation: 'focus',
        target: 'outside-control',
      },
      {
        operation: 'hover',
        target: 'trigger',
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
    ],
    checks: [
      [1, 'tooltip', 'open', false],
      [2, 'tooltip', 'open', false],
      [3, 'tooltip', 'open', true],
      [3, 'document-focus', 'current', 'outside-control'],
    ],
    focus: [3, 'outside-control'],
    initial: {
      coordinator: 'cold',
    },
  }),
  defineScenario('tooltip', {
    id: 'warm-coordinator',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger-a',
      },
      {
        operation: 'blur',
        target: 'trigger-a',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 299,
      },
      {
        operation: 'hover',
        target: 'trigger-b',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 0,
      },
      {
        operation: 'hover',
        target: 'outside',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 100,
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 299,
      },
      {
        operation: 'focus',
        target: 'trigger-b',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 300,
      },
      {
        operation: 'blur',
        target: 'trigger-b',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 299,
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 1,
      },
      {
        operation: 'hover',
        target: 'trigger-a',
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
    ],
    checks: [
      [0, 'coordinator', 'warm', true],
      [1, 'tooltip-a', 'open', false],
      [2, 'coordinator', 'warm', true],
      [3, 'tooltip-b', 'open', true],
      [3, 'open-delay-timer', 'active-count', 0],
      [4, 'tooltip-b', 'open', true],
      [4, 'warm-expiry-timer', 'active-count', 0],
      [6, 'tooltip-b', 'open', false],
      [7, 'coordinator', 'warm', true],
      [8, 'warm-expiry-timer', 'active-count', 0],
      [9, 'tooltip-b', 'open', true],
      [9, 'coordinator', 'warm', true],
      [10, 'tooltip-b', 'open', false],
      [11, 'coordinator', 'warm', true],
      [12, 'coordinator', 'warm', false],
      [13, 'tooltip-a', 'open', false],
      [14, 'tooltip-a', 'open', false],
      [15, 'tooltip-a', 'open', true],
    ],
    focus: [15, 'document-body'],
    initial: {
      tooltipIds: ['tooltip-a', 'tooltip-b'],
      coordinator: 'cold',
    },
  }),
  defineScenario('tooltip', {
    id: 'pointer-transition-grace',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit'],
    operations: [
      {
        operation: 'focus',
        target: 'outside-control',
      },
      {
        operation: 'hover',
        target: 'trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 500,
      },
      {
        operation: 'hover',
        target: 'outside',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 99,
      },
      {
        operation: 'hover',
        target: 'tooltip',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 1,
      },
      {
        operation: 'hover',
        target: 'outside',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 99,
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 1,
      },
    ],
    checks: [
      [2, 'tooltip', 'open', true],
      [4, 'tooltip', 'open', true],
      [5, 'tooltip', 'open', true],
      [5, 'tooltip', 'tab-stop-count', 0],
      [6, 'tooltip', 'open', true],
      [8, 'tooltip', 'open', true],
      [9, 'tooltip', 'open', false],
    ],
    focus: [9, 'outside-control'],
  }),
  defineScenario('tooltip', {
    id: 'combined-focus-hover',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'hover',
        target: 'trigger',
      },
      {
        operation: 'hover',
        target: 'outside',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 100,
      },
      {
        operation: 'hover',
        target: 'trigger',
      },
      {
        operation: 'blur',
        target: 'trigger',
      },
      {
        operation: 'focus',
        target: 'outside-control',
      },
      {
        operation: 'hover',
        target: 'outside',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 99,
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 1,
      },
    ],
    checks: [
      [0, 'tooltip', 'open', true],
      [3, 'tooltip', 'open', true],
      [3, 'document-focus', 'current', 'trigger'],
      [5, 'tooltip', 'open', true],
      [6, 'tooltip', 'open', true],
      [8, 'tooltip', 'open', true],
      [9, 'tooltip', 'open', false],
    ],
    focus: [9, 'outside-control'],
  }),
  defineScenario('tooltip', {
    id: 'escape-no-focus-move',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger-a',
      },
      {
        operation: 'hover',
        target: 'trigger-b',
      },
      {
        operation: 'press',
        target: 'escape-key',
      },
      {
        operation: 'blur',
        target: 'trigger-a',
      },
      {
        operation: 'focus',
        target: 'outside-control',
      },
      {
        operation: 'hover',
        target: 'outside',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 100,
      },
      {
        operation: 'hover',
        target: 'trigger-b',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 0,
      },
      {
        operation: 'press',
        target: 'escape-key',
      },
    ],
    checks: [
      [1, 'tooltip-a', 'open', true],
      [1, 'tooltip-b', 'open', true],
      [2, 'tooltip-b', 'open', false],
      [2, 'tooltip-a', 'open', true],
      [2, 'document-focus', 'current', 'trigger-a'],
      [2, 'trigger-a', 'activation-count', 0],
      [8, 'tooltip-b', 'open', true],
      [9, 'tooltip-b', 'open', false],
      [9, 'document-focus', 'current', 'outside-control'],
      [9, 'trigger-b', 'activation-count', 0],
    ],
    focus: [9, 'outside-control'],
    initial: {
      tooltipIds: ['tooltip-a', 'tooltip-b'],
    },
  }),
  defineScenario('tooltip', {
    id: 'stable-description',
    components: ['Tooltip'],
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
        operation: 'updateContent',
        target: 'consumer-description-existing-help',
      },
      {
        operation: 'focus',
        target: 'outside-control',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'blur',
        target: 'trigger',
      },
      {
        operation: 'hover',
        target: 'trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 0,
      },
    ],
    checks: [
      [1, 'trigger', 'aria-describedby', ['existing-help', 'tooltip-id']],
      [1, 'tooltip', 'id', 'tooltip-id'],
      [1, 'tooltip', 'description-exists', true],
      [2, 'trigger', 'aria-describedby', ['existing-help', 'tooltip-id']],
      [2, 'tooltip', 'visible-text', 'Workspace details'],
      [2, 'tooltip', 'described-text', 'Workspace details'],
      [2, 'announcements', 'duplicate-count', 0],
      [3, 'tooltip', 'id', 'tooltip-id'],
      [5, 'tooltip', 'id', 'tooltip-id'],
      [5, 'announcements', 'duplicate-count', 0],
      [5, 'trigger', 'aria-controls-present', false],
      [5, 'trigger', 'aria-expanded-present', false],
    ],
    focus: [5, 'document-body'],
    relationships: [
      [1, 'trigger', 'aria-describedby', 'existing-help'],
      [1, 'trigger', 'aria-describedby', 'tooltip-id'],
      [2, 'trigger', 'aria-describedby', 'tooltip-id'],
    ],
    roles: [[2, 'tooltip', 'tooltip', 'Workspace details']],
    announcements: [[2, 'tooltip', 'Workspace details']],
    initial: {
      descriptionId: 'tooltip-id',
      text: 'Workspace details',
      consumerDescriptionIds: ['existing-help'],
    },
  }),
  defineScenario('tooltip', {
    id: 'logical-placement',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'ltr', 'rtl'],
    operations: [
      {
        operation: 'setDirection',
        target: 'ltr',
      },
      {
        operation: 'updateContent',
        target: 'placement-inline-start-center',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'resize',
        target: 'trigger-bottom-edge',
      },
      {
        operation: 'blur',
        target: 'trigger',
      },
      {
        operation: 'setDirection',
        target: 'rtl',
      },
      {
        operation: 'updateContent',
        target: 'placement-inline-start-center',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'resize',
        target: 'trigger-bottom-edge',
      },
      {
        operation: 'blur',
        target: 'trigger',
      },
    ],
    checks: [
      [2, 'tooltip', 'physical-side', 'left'],
      [2, 'tooltip', 'public-placement', 'inline-start-center'],
      [2, 'tooltip', 'visual-viewport-contained', true],
      [3, 'tooltip', 'visual-viewport-contained', true],
      [7, 'tooltip', 'physical-side', 'right'],
      [7, 'tooltip', 'public-placement', 'inline-start-center'],
      [7, 'tooltip', 'visual-viewport-contained', true],
      [8, 'tooltip', 'visual-viewport-contained', true],
    ],
    focus: [9, 'document-body'],
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
  defineScenario('tooltip', {
    id: 'coarse-pointer-alternative',
    components: ['Tooltip'],
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
        target: 'touch-help-disclosure-down',
      },
      {
        operation: 'point',
        target: 'touch-help-disclosure-up',
      },
    ],
    checks: [
      [1, 'trigger', 'native-action-count', 1],
      [1, 'trigger', 'default-prevented', false],
      [1, 'tooltip', 'long-press-required', false],
      [1, 'tooltip', 'open', false],
      [3, 'help-disclosure', 'open', true],
      [3, 'help-disclosure', 'visible-text', 'Workspace details'],
      [3, 'help-disclosure', 'operable', true],
    ],
    focus: [3, 'help-disclosure-trigger'],
    initial: {
      essentialText: 'Workspace details',
      alternative: 'help-disclosure',
    },
  }),
  defineScenario('tooltip', {
    id: 'trigger-removal-stale-timer',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'reduced-motion'],
    operations: [
      {
        operation: 'focus',
        target: 'outside-control',
      },
      {
        operation: 'hover',
        target: 'trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 499,
      },
      {
        operation: 'updateContent',
        target: 'remove-trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 1,
      },
      {
        operation: 'resize',
        target: 'viewport-width-640',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 500,
      },
      {
        operation: 'updateContent',
        target: 'restore-trigger',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
      {
        operation: 'updateContent',
        target: 'replace-tooltip-content',
      },
      {
        operation: 'updateContent',
        target: 'remove-trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 500,
      },
    ],
    checks: [
      [2, 'tooltip', 'open', false],
      [3, 'open-delay-timer', 'active-count', 0],
      [3, 'placement-observers', 'active-count', 0],
      [4, 'tooltip', 'open', false],
      [4, 'announcements', 'count', 0],
      [6, 'tooltip', 'open', false],
      [6, 'announcements', 'count', 0],
      [8, 'tooltip', 'open', true],
      [9, 'previous-content', 'pending-callback-count', 0],
      [10, 'placement-observers', 'active-count', 0],
      [11, 'tooltip', 'open', false],
      [11, 'announcements', 'count-since-removal', 0],
    ],
    focus: [11, 'document-body'],
  }),
  defineScenario('tooltip', {
    id: 'final-owner-teardown',
    components: ['Tooltip'],
    cells: ['chromium', 'firefox', 'webkit', 'reduced-motion'],
    operations: [
      {
        operation: 'focus',
        target: 'trigger-a',
      },
      {
        operation: 'blur',
        target: 'trigger-a',
      },
      {
        operation: 'hover',
        target: 'trigger-b',
      },
      {
        operation: 'hover',
        target: 'outside',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 100,
      },
      {
        operation: 'destroy',
        target: 'tooltip-a',
      },
      {
        operation: 'destroy',
        target: 'tooltip-b',
      },
      {
        operation: 'destroy',
        target: 'tooltip-b',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 500,
      },
      {
        operation: 'updateContent',
        target: 'mount-fresh-tooltip',
      },
      {
        operation: 'hover',
        target: 'trigger',
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
    ],
    checks: [
      [5, 'coordinator', 'owner-count', 1],
      [6, 'coordinator', 'owner-count', 0],
      [6, 'coordinator', 'warm', false],
      [6, 'open-delay-timer', 'active-count', 0],
      [7, 'open-delay-timer', 'duplicate-release-count', 0],
      [6, 'pointer-grace-timer', 'active-count', 0],
      [7, 'pointer-grace-timer', 'duplicate-release-count', 0],
      [6, 'warm-expiry-timer', 'active-count', 0],
      [7, 'warm-expiry-timer', 'duplicate-release-count', 0],
      [6, 'listeners', 'active-count', 0],
      [7, 'listeners', 'duplicate-release-count', 0],
      [6, 'observers', 'active-count', 0],
      [7, 'observers', 'duplicate-release-count', 0],
      [8, 'announcements', 'count-since-destroy', 0],
      [11, 'tooltip', 'open', false],
      [12, 'tooltip', 'open', true],
    ],
    focus: [12, 'document-body'],
    initial: {
      tooltipIds: ['tooltip-a', 'tooltip-b'],
    },
    cleanup: [
      ['cleanup', 'timers', 'released'],
      ['cleanup', 'listeners', 'released'],
      ['cleanup', 'observers', 'released'],
      ['cleanup', 'coordinator', 'released'],
    ],
  }),
  defineScenario('tooltip', {
    id: 'ssr-description',
    components: ['Tooltip'],
    cells: ['ssr'],
    operations: [
      {
        operation: 'updateContent',
        target: 'server-render-tooltip-description',
      },
      {
        operation: 'updateContent',
        target: 'server-render-tooltip-description-again',
      },
    ],
    checks: [
      ['server', 'browser-globals', 'accessed', false],
      ['server', 'tooltip', 'id', 'tooltip-id'],
      ['server', 'tooltip', 'description-exists', true],
      ['server', 'tooltip', 'described-text', 'Workspace details'],
      ['server', 'tooltip', 'open', false],
      ['server', 'server-render', 'deterministic', true],
    ],
    focus: ['server', 'server-focus-unchanged'],
    relationships: [['server', 'trigger', 'aria-describedby', 'tooltip-id']],
    roles: [['server', 'tooltip', 'tooltip', 'Workspace details']],
    initial: {
      environment: 'server',
      descriptionId: 'tooltip-id',
      text: 'Workspace details',
    },
  }),
  defineScenario('tooltip', {
    id: 'hydration-stability',
    components: ['Tooltip'],
    cells: ['react-18', 'react-19', 'hydration'],
    operations: [
      {
        operation: 'updateContent',
        target: 'server-render-tooltip-description',
      },
      {
        operation: 'focus',
        target: 'outside-control',
      },
      {
        operation: 'updateContent',
        target: 'hydrate-first-tree',
      },
      {
        operation: 'focus',
        target: 'trigger',
      },
    ],
    checks: [
      [2, 'first-tree', 'identical', true],
      [2, 'tooltip', 'id', 'tooltip-id'],
      [2, 'tooltip', 'described-text', 'Workspace details'],
      [2, 'tooltip', 'open', false],
      [2, 'document-focus', 'current', 'outside-control'],
      [2, 'timers', 'active-count', 0],
      [2, 'semantic-events', 'count', 0],
      [2, 'hydration-warnings', 'count', 0],
      [3, 'tooltip', 'open', true],
      [3, 'trigger-focus-handler', 'invocation-count', 1],
    ],
    focus: [3, 'trigger'],
    relationships: [[2, 'trigger', 'aria-describedby', 'tooltip-id']],
    initial: {
      descriptionId: 'tooltip-id',
      text: 'Workspace details',
      open: false,
    },
  }),
]);

export function tooltipScenariosForCell(cellId) {
  return scenariosForCell(TOOLTIP_SCENARIOS, cellId);
}
export function validateTooltipCoverage(scenarios) {
  return validateCatalog(scenarios, TOOLTIP_SCENARIOS, 'OF-TOOLTIP');
}
