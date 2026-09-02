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
    const { onOpenChange, open, parts } = useModalFixtureRuntime({
      React,
      request,
      onReady,
      diagnostics: { packageName: PACKAGE_NAME, privateProps: PRIVATE_PROPS },
    });
    return React.createElement(
      Dialog.Root,
      { open, onOpenChange },
      ...parts.observationMarkers.map((marker) => element(React, 'span', marker)),
      ...parts.operationTargets.map((target) => element(React, 'button', target)),
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
          element(React, 'button', parts.nestedTrigger),
          element(React, Dialog.Close, parts.close),
        ),
      ),
    );
  }
  return Object.freeze({ ModalFixture });
}
