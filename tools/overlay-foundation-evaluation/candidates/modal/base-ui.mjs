import { useModalFixtureRuntime } from '../../fixtures/modal/runtime.mjs';

const PACKAGE_NAME = '@base-ui-components/react/dialog';
const PRIVATE_PROPS = Object.freeze(['onOpenChange']);

function element(React, type, part) {
  return React.createElement(type, part.props, part.children);
}

export async function createModalCandidate({
  React,
  importModule = (specifier) => import(specifier),
}) {
  const { Dialog } = await importModule(PACKAGE_NAME);
  function ModalFixture({ request, onReady }) {
    const { nestedOpen, onNestedOpenChange, onOpenChange, open, parts } = useModalFixtureRuntime({
      React,
      request,
      onReady,
      diagnostics: { packageName: PACKAGE_NAME, privateProps: PRIVATE_PROPS },
    });
    const operationControl = (control) => {
      const operation = control.props['data-modal-operation'];
      const target = control.props['data-modal-control'];
      const type =
        operation === 'close'
          ? Dialog.Close
          : operation === 'open' && !/child|second/iu.test(target)
            ? Dialog.Trigger
            : 'button';
      return element(React, type, control);
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
      Dialog.Root,
      { open, onOpenChange },
      ...parts.entryControls.map(operationControl),
      ...parts.externalTargets.map((target) => element(React, 'button', target)),
      element(React, 'span', parts.liveRegion),
      element(React, 'button', parts.trigger),
      React.createElement(
        Dialog.Portal,
        null,
        element(React, Dialog.Backdrop, parts.backdrop),
        React.createElement(
          Dialog.Popup,
          parts.panel.props,
          element(React, Dialog.Title, parts.title),
          element(React, Dialog.Description, parts.description),
          element(React, 'button', parts.initialTarget),
          element(React, 'button', parts.ordinaryAction),
          element(React, 'button', parts.destructiveAction),
          parts.hydrationInput === undefined ? null : element(React, 'input', parts.hydrationInput),
          ...parts.supportingActions.map((action) => element(React, 'button', action)),
          ...primaryContentControls.map(operationControl),
          element(React, 'button', parts.nestedTrigger),
          element(React, Dialog.Close, parts.close),
        ),
      ),
      nestedOpen
        ? React.createElement(
            Dialog.Root,
            { open: nestedOpen, onOpenChange: onNestedOpenChange },
            React.createElement(
              Dialog.Portal,
              null,
              React.createElement(
                Dialog.Popup,
                {
                  'data-modal-id': 'child-modal',
                  'data-modal-panel': '',
                  'data-modal-portal': '',
                },
                React.createElement(Dialog.Title, null, 'Child workspace'),
                React.createElement(
                  'button',
                  { 'data-modal-id': 'child-modal-safe-target' },
                  'Close',
                ),
                ...nestedContentControls.map(operationControl),
              ),
            ),
          )
        : null,
    );
  }
  return Object.freeze({ ModalFixture });
}
