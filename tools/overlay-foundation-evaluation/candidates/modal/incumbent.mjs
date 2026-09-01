import { useModalFixtureRuntime } from '../../fixtures/modal/runtime.mjs';

const PACKAGE_NAME = '@lyra-ds/react/dialog';
const PRIVATE_PROPS = Object.freeze(['onClose']);

function element(React, type, part, ...children) {
  return React.createElement(
    type,
    part.props,
    ...(children.length === 0 ? [part.children] : children),
  );
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
      React.Fragment,
      null,
      element(React, 'button', parts.trigger),
      element(React, 'div', parts.backdrop),
      React.createElement(
        Dialog,
        {
          ...parts.panel.props,
          open,
          onClose: () => onOpenChange(false),
          title: element(React, 'span', parts.title),
        },
        element(React, 'p', parts.description),
        element(React, 'button', parts.initialTarget),
        element(React, 'button', parts.ordinaryAction),
        element(React, 'button', parts.destructiveAction),
        element(React, 'button', parts.nestedTrigger),
        element(React, 'button', parts.close),
      ),
    );
  }
  return Object.freeze({ ModalFixture });
}
