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
  function NestedModal({ open, onOpenChange }) {
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
    return React.createElement(
      React.Fragment,
      null,
      ...parts.entryControls.map((control) => element(React, 'button', {}, control)),
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
          ...parts.contentControls.map((control) => element(React, 'button', {}, control)),
          element(React, 'button', {}, parts.nestedTrigger),
          element(React, 'button', api.getCloseTriggerProps(), parts.close),
        ),
      ),
      nestedOpen
        ? React.createElement(NestedModal, { open: nestedOpen, onOpenChange: onNestedOpenChange })
        : null,
    );
  }
  return Object.freeze({ ModalFixture });
}
