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
  return React.createElement(
    type,
    { ...privateProps, ...part.props },
    ...(children.length === 0 ? [part.children] : children),
  );
}

export async function createModalCandidate({
  React,
  importModule = (specifier) => import(specifier),
}) {
  const dialog = await importModule(PACKAGE_NAMES[0]);
  const { normalizeProps, useMachine } = await importModule(PACKAGE_NAMES[1]);
  function ModalFixture({ request, onReady }) {
    const { onOpenChange, open, parts } = useModalFixtureRuntime({
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
    return React.createElement(
      React.Fragment,
      null,
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
          element(React, 'button', {}, parts.nestedTrigger),
          element(React, 'button', api.getCloseTriggerProps(), parts.close),
        ),
      ),
    );
  }
  return Object.freeze({ ModalFixture });
}
