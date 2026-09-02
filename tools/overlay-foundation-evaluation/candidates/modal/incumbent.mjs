import { useModalFixtureRuntime, useModalResourceClaim } from '../../fixtures/modal/runtime.mjs';

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
    useModalResourceClaim({
      React,
      active: nestedOpen,
      kind: 'scroll-lock',
      owner: parts.nestedView.panelId,
    });
    const onPrimaryOpenChange = (nextOpen) => {
      if (nextOpen === false && nestedOpen) onNestedOpenChange(false);
      return onOpenChange(nextOpen);
    };
    const operationControl = (control, nested = false) => {
      const operation = control.props['data-modal-operation'];
      if (!['open', 'close'].includes(operation)) {
        return element(React, 'button', control);
      }
      const onInput = control.props.onClick;
      return element(React, 'button', {
        ...control,
        props: {
          ...control.props,
          onClick(event) {
            if (onInput?.(event) !== false) {
              (nested ? onNestedOpenChange : onPrimaryOpenChange)(operation === 'open');
            }
          },
        },
      });
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
      React.Fragment,
      null,
      ...parts.entryControls.map(operationControl),
      ...parts.externalTargets.map((target) => element(React, 'button', target)),
      element(React, 'span', parts.liveRegion),
      element(React, 'button', parts.trigger),
      element(React, 'div', parts.backdrop),
      React.createElement(
        Dialog,
        {
          ...parts.panel.props,
          open,
          onClose: () => onPrimaryOpenChange(false),
          title: element(React, 'span', parts.title),
        },
        element(React, 'p', parts.description),
        element(React, 'button', parts.initialTarget),
        element(React, 'button', parts.ordinaryAction),
        element(React, 'button', parts.destructiveAction),
        parts.hydrationInput === undefined ? null : element(React, 'input', parts.hydrationInput),
        ...parts.supportingActions.map((action) => element(React, 'button', action)),
        ...primaryContentControls.map((control) =>
          operationControl(control, /child|second/iu.test(control.props['data-modal-control'])),
        ),
        element(React, 'button', {
          ...parts.nestedTrigger,
          props: { ...parts.nestedTrigger.props, onClick: () => onNestedOpenChange(true) },
        }),
        element(React, 'button', parts.close),
      ),
      nestedOpen
        ? React.createElement(
            Dialog,
            {
              open: nestedOpen,
              onClose: () => onNestedOpenChange(false),
              title: React.createElement('span', null, parts.nestedView.title),
              'data-modal-id': parts.nestedView.panelId,
              'data-modal-panel': '',
              'data-modal-portal': '',
            },
            React.createElement(
              'button',
              { 'data-modal-id': parts.nestedView.safeTargetId },
              'Close',
            ),
            ...nestedContentControls.map((control) => operationControl(control, true)),
          )
        : null,
    );
  }
  return Object.freeze({ ModalFixture });
}
