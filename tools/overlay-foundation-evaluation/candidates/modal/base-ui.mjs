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
    return React.createElement(
      Dialog.Root,
      { open, onOpenChange },
      ...parts.entryControls.map((control) => element(React, 'button', control)),
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
          ...parts.contentControls.map((control) => element(React, 'button', control)),
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
              ),
            ),
          )
        : null,
    );
  }
  return Object.freeze({ ModalFixture });
}
