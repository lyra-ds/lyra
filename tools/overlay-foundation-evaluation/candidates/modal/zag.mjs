import { useModalFixtureRuntime } from '../../fixtures/modal/runtime.mjs';

const PACKAGE_NAMES = Object.freeze(['@zag-js/dialog', '@zag-js/react']);
const PRIVATE_PROPS = Object.freeze([
  'getTriggerProps',
  'getBackdropProps',
  'getPositionerProps',
  'getContentProps',
  'getTitleProps',
  'getDescriptionProps',
  'getCloseTriggerProps',
]);

function element(React, type, privateProps, part, ...children) {
  const props = { ...privateProps, ...part.props };
  for (const [name, handler] of Object.entries(privateProps)) {
    if (!/^on[A-Z]/u.test(name) || typeof handler !== 'function') continue;
    const fixtureHandler = part.props[name];
    if (typeof fixtureHandler !== 'function') continue;
    props[name] = (...args) => {
      const candidateResult = handler(...args);
      const fixtureResult = fixtureHandler(...args);
      return fixtureResult === undefined ? candidateResult : fixtureResult;
    };
  }
  return React.createElement(type, props, ...(children.length === 0 ? [part.children] : children));
}

export async function createModalCandidate({
  React,
  importModule = (specifier) => import(specifier),
}) {
  const dialog = await importModule(PACKAGE_NAMES[0]);
  const { normalizeProps, useMachine } = await importModule(PACKAGE_NAMES[1]);
  function NestedModal({ controls, open, onOpenChange }) {
    const service = useMachine(
      dialog.machine({
        id: 'of-modal-child-fixture',
        open,
        onOpenChange: ({ open: next }) => onOpenChange(next),
      }),
    );
    const api = dialog.connect(service, normalizeProps);
    return React.createElement(
      'div',
      api.getPositionerProps(),
      React.createElement(
        'section',
        {
          ...api.getContentProps(),
          'data-modal-id': 'child-modal',
          'data-modal-panel': '',
          'data-modal-portal': '',
        },
        React.createElement('h2', api.getTitleProps(), 'Child workspace'),
        React.createElement('button', { 'data-modal-id': 'child-modal-safe-target' }, 'Close'),
        ...controls.map((control) => element(React, 'button', api.getCloseTriggerProps(), control)),
      ),
    );
  }
  function ModalFixture({ request, onReady }) {
    const { nestedOpen, onNestedOpenChange, onOpenChange, open, parts } = useModalFixtureRuntime({
      React,
      request,
      onReady,
      diagnostics: {
        packageName: PACKAGE_NAMES[0],
        packageNames: PACKAGE_NAMES,
        privateProps: PRIVATE_PROPS,
      },
    });
    const service = useMachine(
      dialog.machine({
        id: 'of-modal-fixture',
        open,
        onOpenChange: ({ open: nextOpen }) => onOpenChange(nextOpen),
      }),
    );
    const api = dialog.connect(service, normalizeProps);
    const operationControl = (control) => {
      const operation = control.props['data-modal-operation'];
      const target = control.props['data-modal-control'];
      const privateProps =
        operation === 'close'
          ? api.getCloseTriggerProps()
          : operation === 'open' && !/child|second/iu.test(target)
            ? api.getTriggerProps()
            : {};
      return element(React, 'button', privateProps, control);
    };
    const nestedContentControls = parts.contentControls.filter(
      (control) =>
        control.props['data-modal-operation'] === 'close' &&
        /child|second/iu.test(control.props['data-modal-control']),
    );
    const primaryContentControls = parts.contentControls.filter(
      (control) => !nestedContentControls.includes(control),
    );
    return React.createElement(
      React.Fragment,
      null,
      ...parts.entryControls.map(operationControl),
      ...parts.externalTargets.map((target) => element(React, 'button', {}, target)),
      element(React, 'span', {}, parts.liveRegion),
      element(React, 'button', api.getTriggerProps(), parts.trigger),
      element(React, 'div', api.getBackdropProps(), parts.backdrop),
      React.createElement(
        'div',
        api.getPositionerProps(),
        element(
          React,
          'section',
          api.getContentProps(),
          parts.panel,
          element(React, 'h2', api.getTitleProps(), parts.title),
          element(React, 'p', api.getDescriptionProps(), parts.description),
          element(React, 'button', {}, parts.initialTarget),
          element(React, 'button', {}, parts.ordinaryAction),
          element(React, 'button', {}, parts.destructiveAction),
          parts.hydrationInput === undefined
            ? null
            : element(React, 'input', {}, parts.hydrationInput),
          ...parts.supportingActions.map((action) => element(React, 'button', {}, action)),
          ...primaryContentControls.map(operationControl),
          element(React, 'button', {}, parts.nestedTrigger),
          element(React, 'button', api.getCloseTriggerProps(), parts.close),
        ),
      ),
      nestedOpen
        ? React.createElement(NestedModal, {
            controls: nestedContentControls,
            open: nestedOpen,
            onOpenChange: onNestedOpenChange,
          })
        : null,
    );
  }
  return Object.freeze({ ModalFixture });
}
