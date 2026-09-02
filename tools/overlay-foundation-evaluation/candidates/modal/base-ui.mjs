import { useModalFixtureRuntime, useModalResourceClaim } from '../../fixtures/modal/runtime.mjs';

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
  function NestedModal({ closeControls, open, openControls, onOpenChange, trigger, view }) {
    useModalResourceClaim({ React, active: open, kind: 'scroll-lock', owner: view.panelId });
    return React.createElement(
      Dialog.Root,
      { open, onOpenChange },
      ...openControls.map((control) => element(React, Dialog.Trigger, control)),
      element(React, Dialog.Trigger, trigger),
      React.createElement(
        Dialog.Portal,
        null,
        React.createElement(
          Dialog.Popup,
          {
            'data-modal-id': view.panelId,
            'data-modal-panel': '',
            'data-modal-portal': '',
          },
          React.createElement(Dialog.Title, null, view.title),
          React.createElement('button', { 'data-modal-id': view.safeTargetId }, 'Close'),
          ...closeControls.map((control) => element(React, Dialog.Close, control)),
        ),
      ),
    );
  }
  function ModalFixture({ request, onReady }) {
    const { nestedOpen, onNestedOpenChange, onOpenChange, open, parts } = useModalFixtureRuntime({
      React,
      request,
      onReady,
      diagnostics: { packageName: PACKAGE_NAME, privateProps: PRIVATE_PROPS },
    });
    useModalResourceClaim({
      React,
      active: open,
      kind: 'scroll-lock',
      owner: parts.panel.props['data-modal-id'],
    });
    const onPrimaryOpenChange = (nextOpen) => {
      if (nextOpen === false && nestedOpen) onNestedOpenChange(false);
      return onOpenChange(nextOpen);
    };
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
    const nestedOpenControls = parts.contentControls.filter(
      (control) =>
        control.props['data-modal-operation'] === 'open' &&
        /child|second/iu.test(control.props['data-modal-control']),
    );
    const nestedContentControls = parts.contentControls.filter(
      (control) =>
        control.props['data-modal-operation'] === 'close' &&
        /child|second/iu.test(control.props['data-modal-control']),
    );
    const primaryContentControls = parts.contentControls.filter(
      (control) =>
        !nestedOpenControls.includes(control) && !nestedContentControls.includes(control),
    );
    return React.createElement(
      Dialog.Root,
      { open, onOpenChange: onPrimaryOpenChange },
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
          React.createElement(NestedModal, {
            closeControls: nestedContentControls,
            open: nestedOpen,
            openControls: nestedOpenControls,
            onOpenChange: onNestedOpenChange,
            trigger: parts.nestedTrigger,
            view: parts.nestedView,
          }),
          element(React, Dialog.Close, parts.close),
        ),
      ),
    );
  }
  return Object.freeze({ ModalFixture });
}
