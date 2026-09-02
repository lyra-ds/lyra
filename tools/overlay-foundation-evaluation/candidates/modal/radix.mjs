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
    const { onOpenChange, open, parts } = useModalFixtureRuntime({
      React,
      request,
      onReady,
      diagnostics: { packageName: PACKAGE_NAME, privateProps: PRIVATE_PROPS },
    });
    return React.createElement(
      Root,
      { open, onOpenChange },
      ...parts.observationMarkers.map((marker) => element(React, 'span', marker)),
      ...parts.operationTargets.map((target) => element(React, 'button', target)),
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
          element(React, 'button', parts.nestedTrigger),
          element(React, Close, parts.close),
        ),
      ),
    );
  }
  return Object.freeze({ ModalFixture });
}
