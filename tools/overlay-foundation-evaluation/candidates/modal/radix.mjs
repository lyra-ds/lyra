import { useModalFixtureRuntime } from '../../fixtures/modal/runtime.mjs';

const PACKAGE_NAME = '@radix-ui/react-dialog';
const PRIVATE_PROPS = Object.freeze(['onOpenChange']);

function element(React, type, part) {
  return React.createElement(type, part.props, part.children);
}

export async function createModalCandidate({
  React,
  importModule = (specifier) => import(specifier),
}) {
  const { Root, Portal, Overlay, Content, Title, Description, Close } =
    await importModule(PACKAGE_NAME);
  function ModalFixture({ request, onReady }) {
    const { nestedOpen, onNestedOpenChange, onOpenChange, open, parts } = useModalFixtureRuntime({
      React,
      request,
      onReady,
      diagnostics: { packageName: PACKAGE_NAME, privateProps: PRIVATE_PROPS },
    });
    return React.createElement(
      Root,
      { open, onOpenChange },
      ...parts.entryControls.map((control) => element(React, 'button', control)),
      element(React, 'span', parts.liveRegion),
      element(React, 'button', parts.trigger),
      React.createElement(
        Portal,
        null,
        element(React, Overlay, parts.backdrop),
        React.createElement(
          Content,
          parts.panel.props,
          element(React, Title, parts.title),
          element(React, Description, parts.description),
          element(React, 'button', parts.initialTarget),
          element(React, 'button', parts.ordinaryAction),
          element(React, 'button', parts.destructiveAction),
          ...parts.contentControls.map((control) => element(React, 'button', control)),
          element(React, 'button', parts.nestedTrigger),
          element(React, Close, parts.close),
        ),
      ),
      nestedOpen
        ? React.createElement(
            Root,
            { open: nestedOpen, onOpenChange: onNestedOpenChange },
            React.createElement(
              Portal,
              null,
              React.createElement(
                Content,
                {
                  'data-modal-id': 'child-modal',
                  'data-modal-panel': '',
                  'data-modal-portal': '',
                },
                React.createElement(Title, null, 'Child workspace'),
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
