import { useModalFixtureRuntime, useModalResourceClaim } from '../../fixtures/modal/runtime.mjs';

const PACKAGE_NAME = '@radix-ui/react-dialog';
const PRIVATE_PROPS = Object.freeze(['onOpenChange']);

async function importCandidateModule(specifier) {
  if (specifier !== PACKAGE_NAME) throw new Error('unexpected Radix package import');
  return import('@radix-ui/react-dialog');
}

function element(React, type, part) {
  return React.createElement(type, part.props, part.children);
}

export async function createModalCandidate({ React, importModule = importCandidateModule }) {
  const { Root, Portal, Overlay, Content, Title, Description, Close, Trigger } =
    await importModule(PACKAGE_NAME);
  function NestedModal({ closeControls, open, openControls, onOpenChange, trigger, view }) {
    useModalResourceClaim({ React, active: open, kind: 'scroll-lock', owner: view.panelId });
    return React.createElement(
      Root,
      { open, onOpenChange },
      ...openControls.map((control) => element(React, Trigger, control)),
      element(React, Trigger, trigger),
      React.createElement(
        Portal,
        null,
        React.createElement(
          Content,
          {
            'data-modal-id': view.panelId,
            'data-modal-panel': '',
            'data-modal-portal': '',
          },
          React.createElement(Title, null, view.title),
          React.createElement('button', { 'data-modal-id': view.safeTargetId }, 'Close'),
          ...closeControls.map((control) => element(React, Close, control)),
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
          ? Close
          : operation === 'open' && !/child|second/iu.test(target)
            ? Trigger
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
      Root,
      { open, onOpenChange: onPrimaryOpenChange },
      ...parts.entryControls.map(operationControl),
      ...parts.externalTargets.map((target) => element(React, 'button', target)),
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
          element(React, Close, parts.close),
        ),
      ),
    );
  }
  return Object.freeze({ ModalFixture });
}
