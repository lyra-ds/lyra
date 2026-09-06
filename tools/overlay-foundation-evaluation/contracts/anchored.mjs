import { defineScenario, scenariosForCell, validateCatalog } from './scenario-catalog.mjs';

// Component mapping is normative applicability. The private anchored fixture uses
// representative Popover semantics; this does not certify composed WorkspaceSwitcher
// behavior. Dropdown is exercised by OF-MENU; composition belongs to OF-COMPOSED.
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [0, 'trigger', 'semantic-trigger-count', 1],
      [0, 'trigger', 'tab-stop-count', 1],
      [0, 'trigger', 'aria-expanded', false],
      [0, 'trigger', 'aria-controls', 'popup-id'],
      [0, 'trigger', 'aria-haspopup', 'dialog'],
      [2, 'trigger', 'semantic-trigger-count', 1],
      [2, 'trigger', 'tab-stop-count', 1],
      [2, 'trigger', 'aria-expanded', true],
      [2, 'trigger', 'aria-controls', 'popup-id'],
      [2, 'trigger', 'aria-haspopup', 'dialog'],
      [2, 'popup', 'id', 'popup-id'],
      [4, 'trigger', 'semantic-trigger-count', 1],
      [4, 'trigger', 'tab-stop-count', 1],
      [4, 'trigger', 'aria-expanded', false],
      [4, 'trigger', 'aria-controls', 'popup-id'],
      [4, 'trigger', 'aria-haspopup', 'dialog'],
      [6, 'trigger', 'semantic-trigger-count', 1],
      [6, 'trigger', 'tab-stop-count', 1],
      [6, 'trigger', 'aria-expanded', true],
      [6, 'trigger', 'aria-controls', 'popup-id'],
      [6, 'trigger', 'aria-haspopup', 'dialog'],
      [6, 'popup', 'id', 'popup-id'],
    ],
    focus: [6, 'trigger'],
    relationships: [
      [0, 'trigger', 'aria-controls', 'popup-id'],
      [2, 'trigger', 'aria-controls', 'popup-id'],
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'resize',
        target: 'trigger-bottom-edge',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'resize',
        target: 'trigger-right-edge',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'resize',
        target: 'content-height-900',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'scroll',
        target: 'constrained-popup-bottom',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [2, 'popup', 'side', 'bottom'],
      [2, 'popup', 'alignment', 'start'],
      [2, 'popup', 'visual-viewport-contained', true],
      [4, 'popup', 'side', 'top'],
      [4, 'popup', 'visual-viewport-contained', true],
      [6, 'popup', 'shifted', true],
      [6, 'popup', 'visual-viewport-contained', true],
      [8, 'popup', 'bounded-scroll-region', true],
      [8, 'popup', 'visual-viewport-contained', true],
      [10, 'last-content-element', 'reachable', true],
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'resize',
        target: 'content-width-280',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'resize',
        target: 'viewport-width-640',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'resize',
        target: 'visual-viewport-width-480',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'scroll',
        target: 'ancestor-y-80',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'resize',
        target: 'trigger-width-200',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'scroll',
        target: 'ancestor-y-120',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [5, 'placement', 'updated-since-operation', true],
      [5, 'popup', 'visual-viewport-contained', true],
      [5, 'document-focus', 'current', 'trigger'],
      [5, 'semantic-events', 'count-since-operation', 0],
      [7, 'placement', 'updated-since-operation', true],
      [7, 'popup', 'visual-viewport-contained', true],
      [7, 'document-focus', 'current', 'trigger'],
      [7, 'semantic-events', 'count-since-operation', 0],
      [9, 'placement', 'updated-since-operation', true],
      [9, 'popup', 'visual-viewport-contained', true],
      [9, 'document-focus', 'current', 'trigger'],
      [9, 'semantic-events', 'count-since-operation', 0],
      [11, 'placement', 'updated-since-operation', true],
      [11, 'popup', 'visual-viewport-contained', true],
      [11, 'document-focus', 'current', 'trigger'],
      [11, 'semantic-events', 'count-since-operation', 0],
      [13, 'placement', 'updated-since-operation', true],
      [13, 'popup', 'visual-viewport-contained', true],
      [13, 'document-focus', 'current', 'trigger'],
      [13, 'semantic-events', 'count-since-operation', 0],
      [15, 'placement-observers', 'active-count', 0],
      [17, 'placement', 'measurement-count-since-operation', 0],
      [19, 'placement', 'measurement-count-since-operation', 0],
    ],
    focus: [19, 'trigger'],
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'setDirection',
        target: 'rtl',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [4, 'popup', 'physical-side', 'bottom'],
      [4, 'popup', 'alignment-edge', 'left'],
      [4, 'popup', 'public-placement', 'bottom-start'],
      [9, 'popup', 'physical-side', 'bottom'],
      [9, 'popup', 'alignment-edge', 'right'],
      [9, 'popup', 'public-placement', 'bottom-end'],
      [14, 'popup', 'physical-side', 'top'],
      [14, 'popup', 'alignment-edge', 'left'],
      [14, 'popup', 'public-placement', 'top-start'],
      [19, 'popup', 'physical-side', 'left'],
      [19, 'popup', 'alignment-edge', 'center'],
      [19, 'popup', 'public-placement', 'inline-start-center'],
      [24, 'popup', 'physical-side', 'right'],
      [24, 'popup', 'alignment-edge', 'center'],
      [24, 'popup', 'public-placement', 'inline-end-center'],
      [31, 'popup', 'physical-side', 'bottom'],
      [31, 'popup', 'alignment-edge', 'right'],
      [31, 'popup', 'public-placement', 'bottom-start'],
      [36, 'popup', 'physical-side', 'bottom'],
      [36, 'popup', 'alignment-edge', 'left'],
      [36, 'popup', 'public-placement', 'bottom-end'],
      [41, 'popup', 'physical-side', 'top'],
      [41, 'popup', 'alignment-edge', 'right'],
      [41, 'popup', 'public-placement', 'top-start'],
      [46, 'popup', 'physical-side', 'right'],
      [46, 'popup', 'alignment-edge', 'center'],
      [46, 'popup', 'public-placement', 'inline-start-center'],
      [51, 'popup', 'physical-side', 'left'],
      [51, 'popup', 'alignment-edge', 'center'],
      [51, 'popup', 'public-placement', 'inline-end-center'],
    ],
    focus: [53, 'trigger'],
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'open',
        target: 'child-trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        target: 'touch-outside-down',
      },
      {
        operation: 'point',
        target: 'touch-outside-pointer-cancel',
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
      [16, 'parent-popup', 'open', true],
      [16, 'child-popup', 'open', true],
      [17, 'parent-popup', 'open', true],
      [17, 'child-popup', 'open', true],
      [18, 'child-popup', 'open', true],
      [19, 'child-popup', 'open', false],
      [19, 'dismissal', 'close-count', 1],
    ],
    focus: [19, 'child-trigger'],
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'open',
        target: 'child-trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'close',
        target: 'parent-popup',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'open',
        target: 'parent-trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'focus',
        target: 'parent-trigger',
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
      [6, 'child-popup', 'open', false],
      [6, 'parent-popup', 'open', true],
      [6, 'document-focus', 'current', 'child-trigger'],
      [6, 'child-trigger', 'inside-parent', true],
      [13, 'parent-popup', 'open', false],
      [13, 'document-focus', 'move-count-since-operation', 0],
    ],
    focus: [13, 'parent-trigger'],
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [5, 'popup', 'theme', 'dark'],
      [5, 'popup', 'brand', 'ocean'],
      [5, 'popup', 'direction', 'rtl'],
      [5, 'popup', 'portal-host', 'secondary'],
      [5, 'trigger', 'relationship-target-exists', true],
      [7, 'content-handler', 'invocation-count', 1],
      [9, 'document-focus', 'current', 'trigger'],
    ],
    focus: [9, 'trigger'],
    relationships: [[5, 'trigger', 'semantic-relationship', 'popup-id']],
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
      {
        operation: 'open',
        target: 'trigger',
      },
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
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
      {
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds: 16,
      },
    ],
    checks: [
      [4, 'document-focus', 'current', 'trigger'],
      [8, 'trigger', 'connected', false],
      [10, 'document-focus', 'current', 'successor-command'],
      [15, 'trigger', 'connected', false],
      [17, 'document-focus', 'current', 'successor-region'],
      [17, 'document-body', 'focus-received', false],
    ],
    focus: [17, 'successor-region'],
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
