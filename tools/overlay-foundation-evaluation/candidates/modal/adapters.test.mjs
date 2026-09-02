import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONTRACT_IDS } from '../../contracts/protocol.mjs';
import { MODAL_SCENARIOS } from '../../contracts/modal.mjs';

const CANDIDATES = Object.freeze(['incumbent', 'radix', 'base-ui', 'zag']);
const request = Object.freeze({
  schemaVersion: 1,
  scenario: MODAL_SCENARIOS[0],
  cell: Object.freeze({
    id: 'chromium',
    reactVersion: '19.2.8',
    direction: 'ltr',
    colorScheme: 'light',
    forcedColors: false,
    reducedMotion: false,
    coarsePointer: false,
  }),
});

function fakeReact() {
  const cleanups = [];
  const hooks = [];
  const stateUpdates = [];
  let cursor = 0;
  function changed(previous, next) {
    return (
      previous === undefined ||
      previous.length !== next.length ||
      previous.some((value, index) => !Object.is(value, next[index]))
    );
  }
  const React = {
    Fragment: 'Fragment',
    createElement(type, props, ...children) {
      return {
        type,
        props: {
          ...(props ?? {}),
          ...(children.length === 0
            ? {}
            : { children: children.length === 1 ? children[0] : children }),
        },
      };
    },
    useCallback(callback, dependencies) {
      const index = cursor++;
      if (hooks[index] === undefined || changed(hooks[index].dependencies, dependencies)) {
        hooks[index] = { dependencies, value: callback };
      }
      return hooks[index].value;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = hooks[index];
      if (previous !== undefined && !changed(previous.dependencies, dependencies)) return;
      if (typeof previous?.cleanup === 'function') {
        previous.cleanup();
        cleanups.splice(cleanups.indexOf(previous.cleanup), 1);
      }
      const cleanup = effect();
      hooks[index] = { cleanup, dependencies };
      if (typeof cleanup === 'function') cleanups.push(cleanup);
    },
    useRef(initialValue) {
      const index = cursor++;
      if (hooks[index] === undefined) hooks[index] = { current: initialValue };
      return hooks[index];
    },
    useState(initialValue) {
      const index = cursor++;
      if (hooks[index] === undefined) {
        hooks[index] = {
          value: typeof initialValue === 'function' ? initialValue() : initialValue,
        };
      }
      return [
        hooks[index].value,
        (nextValue) => {
          hooks[index].value =
            typeof nextValue === 'function' ? nextValue(hooks[index].value) : nextValue;
          stateUpdates.push(hooks[index].value);
        },
      ];
    },
  };
  return {
    cleanups,
    React,
    render(Component, props) {
      cursor = 0;
      return Component(props);
    },
    stateUpdates,
  };
}

function childrenOf(node) {
  if (node === null || typeof node !== 'object' || node.props === undefined) return [];
  return Array.isArray(node.props.children)
    ? node.props.children
    : node.props.children === undefined
      ? []
      : [node.props.children];
}

function elements(root) {
  const found = [];
  const visit = (node) => {
    if (node === null || typeof node !== 'object') return;
    if (node.type !== undefined && node.props !== undefined) found.push(node);
    for (const [name, value] of Object.entries(node.props ?? {})) {
      if (name !== 'children') visit(value);
    }
    for (const child of childrenOf(node)) visit(child);
  };
  visit(root);
  return found;
}

function oneByType(root, type) {
  const matches = elements(root).filter((element) => element.type === type);
  assert.equal(matches.length, 1, `expected exactly one ${type} element`);
  return matches[0];
}

function markerSnapshot(root) {
  return elements(root)
    .flatMap(({ props }) =>
      Object.entries(props)
        .filter(([name]) => name.startsWith('data-fixture-'))
        .map(([name, value]) => [name, value]),
    )
    .sort(([leftName, leftValue], [rightName, rightValue]) =>
      `${leftName}:${leftValue}`.localeCompare(`${rightName}:${rightValue}`),
    );
}

function primitiveModule(names) {
  return Object.fromEntries(names.map((name) => [name, name]));
}

function injectedModules(candidate, capture) {
  if (candidate === 'incumbent') {
    return new Map([['@lyra-ds/react/dialog', primitiveModule(['Dialog'])]]);
  }
  if (candidate === 'radix') {
    return new Map([
      [
        '@radix-ui/react-dialog',
        primitiveModule(['Root', 'Portal', 'Overlay', 'Content', 'Title', 'Description', 'Close']),
      ],
    ]);
  }
  if (candidate === 'base-ui') {
    return new Map([
      [
        '@base-ui-components/react/dialog',
        {
          Dialog: primitiveModule([
            'Root',
            'Portal',
            'Backdrop',
            'Popup',
            'Title',
            'Description',
            'Close',
          ]),
        },
      ],
    ]);
  }
  const partProps = (part) => ({ 'data-private-part': part });
  return new Map([
    [
      '@zag-js/dialog',
      {
        machine(options) {
          capture.machineOptions = options;
          return { machine: options };
        },
        connect(service, normalizeProps) {
          capture.connected = { normalizeProps, service };
          return {
            getBackdropProps: () => partProps('backdrop'),
            getCloseTriggerProps: () => partProps('close'),
            getContentProps: () => partProps('content'),
            getDescriptionProps: () => partProps('description'),
            getPositionerProps: () => partProps('positioner'),
            getTitleProps: () => partProps('title'),
            getTriggerProps: () => partProps('trigger'),
          };
        },
      },
    ],
    [
      '@zag-js/react',
      {
        normalizeProps: { normalized: true },
        useMachine(machine) {
          capture.machine = machine;
          return { service: machine };
        },
      },
    ],
  ]);
}

for (const candidate of CANDIDATES) {
  test(`${candidate} exposes one private OF-MODAL entry without loading a vendor`, async () => {
    const main = await import(`../${candidate}.mjs`);
    assert.equal(main.adapterDescriptor.candidateId, candidate);
    assert.deepEqual(main.adapterDescriptor.supportedContractIds, ['OF-MODAL']);
    assert.equal(main.modalAdapterPath, `candidates/modal/${candidate}.mjs`);
    if (candidate === 'incumbent') {
      assert.deepEqual(main.incumbentDescriptor.supportedContractIds, CONTRACT_IDS);
    }
  });

  test(`${candidate} translates the neutral controlled modal fixture`, async () => {
    const capture = {};
    const imports = [];
    const modules = injectedModules(candidate, capture);
    const injected = fakeReact();
    const adapter = await import(`./${candidate}.mjs`);
    const { ModalFixture } = await adapter.createModalCandidate({
      React: injected.React,
      importModule: async (specifier) => {
        imports.push(specifier);
        assert.equal(modules.has(specifier), true, `unexpected import ${specifier}`);
        return modules.get(specifier);
      },
    });
    let fixture;
    const fixtureProps = {
      request,
      onReady(value) {
        fixture = value;
      },
    };
    const tree = injected.render(ModalFixture, fixtureProps);
    injected.render(ModalFixture, fixtureProps);
    assert.equal(fixture.observe().diagnostics.destroyed, false);

    assert.deepEqual(
      imports,
      {
        incumbent: ['@lyra-ds/react/dialog'],
        radix: ['@radix-ui/react-dialog'],
        'base-ui': ['@base-ui-components/react/dialog'],
        zag: ['@zag-js/dialog', '@zag-js/react'],
      }[candidate],
    );
    assert.deepEqual(markerSnapshot(tree), [
      ['data-fixture-action', 'destructive'],
      ['data-fixture-action', 'ordinary'],
      ['data-fixture-control', 'close'],
      ['data-fixture-control', 'nested-opener'],
      ['data-fixture-control', 'opener'],
      ['data-fixture-part', 'backdrop'],
      ['data-fixture-part', 'description'],
      ['data-fixture-part', 'initial-target'],
      ['data-fixture-part', 'panel'],
      ['data-fixture-part', 'title'],
    ]);
    assert.deepEqual(
      elements(tree)
        .filter(({ props }) => props['data-modal-control'] !== undefined)
        .map(({ props }) => [props['data-modal-operation'], props['data-modal-control']]),
      request.scenario.operations.map(({ operation, target }) => [operation, target]),
    );
    const scenarioControls = elements(tree).filter(
      ({ props }) => props['data-modal-control'] !== undefined,
    );
    assert.equal(
      scenarioControls.every(({ props }) => props.hidden !== true),
      true,
    );
    assert.equal(
      scenarioControls.every(({ props }) =>
        ['onClick', 'onKeyDown', 'onPointerDown', 'onContextMenu'].some(
          (handler) => typeof props[handler] === 'function',
        ),
      ),
      true,
    );
    assert.equal(
      elements(tree).some(({ props }) =>
        Object.keys(props).some((name) => name.startsWith('data-modal-observation')),
      ),
      false,
    );
    const panel = elements(tree).find(({ props }) => props['data-fixture-part'] === 'panel');
    for (const semanticProp of [
      'role',
      'aria-modal',
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
    ]) {
      assert.equal(
        Object.hasOwn(panel.props, semanticProp),
        false,
        `candidate primitive must own ${semanticProp}`,
      );
    }

    if (candidate === 'incumbent') {
      const root = oneByType(tree, 'Dialog');
      assert.equal(root.props.open, false);
      root.props.onClose();
    } else if (candidate === 'radix' || candidate === 'base-ui') {
      const root = oneByType(tree, 'Root');
      assert.equal(root.props.open, false);
      root.props.onOpenChange(true);
    } else {
      assert.equal(capture.machineOptions.id, 'of-modal-fixture');
      assert.equal(capture.machineOptions.open, false);
      assert.deepEqual(capture.connected.normalizeProps, { normalized: true });
      capture.machineOptions.onOpenChange({ open: true });
    }
    const opener = elements(tree).find(({ props }) => props['data-fixture-control'] === 'opener');
    opener.props.onClick();
    const close = elements(tree).find(({ props }) => props['data-fixture-control'] === 'close');
    close.props.onClick?.();
    const nested = elements(tree).find(
      ({ props }) => props['data-fixture-control'] === 'nested-opener',
    );
    nested.props.onClick();

    const updatedTree = injected.render(ModalFixture, fixtureProps);
    const announcement = elements(updatedTree).find(({ props }) => props['aria-live'] === 'polite');
    assert.match(announcement.props.children, /opened$/u);

    assert.deepEqual(
      injected.stateUpdates,
      candidate === 'incumbent'
        ? [
            false,
            'Workspace details dialog closed',
            true,
            'Workspace details dialog opened',
            false,
            'Workspace details dialog closed',
            true,
            'Child workspace dialog opened',
          ]
        : [
            true,
            'Workspace details dialog opened',
            true,
            'Workspace details dialog opened',
            false,
            'Workspace details dialog closed',
            true,
            'Child workspace dialog opened',
          ],
    );
    const beforeTeardown = fixture.observe();
    assert.equal(beforeTeardown.diagnostics.packageName, imports[0]);
    assert.equal(Array.isArray(beforeTeardown.diagnostics.privateProps), true);
    assert.equal(beforeTeardown.diagnostics.privateProps.length > 0, true);
    assert.deepEqual(beforeTeardown.events.at(-1), { target: 'child-modal', type: 'opened' });
    for (const field of ['roles', 'relationships', 'states', 'events']) {
      assert.doesNotMatch(JSON.stringify(beforeTeardown[field]), /lyra|radix|base-ui|zag|vendor/iu);
    }
    const publicMarkers = JSON.stringify(markerSnapshot(tree));
    assert.doesNotMatch(publicMarkers, /lyra|radix|base-ui|zag|vendor/iu);
    const normative = JSON.stringify(
      Object.fromEntries(
        ['roles', 'relationships', 'states', 'events'].map((field) => [
          field,
          beforeTeardown[field],
        ]),
      ),
    );
    for (const privateProp of beforeTeardown.diagnostics.privateProps) {
      assert.equal(normative.includes(JSON.stringify(privateProp)), false);
      assert.equal(publicMarkers.includes(JSON.stringify(privateProp)), false);
    }

    assert.equal(injected.cleanups.length, 1);
    injected.cleanups[0]();
    assert.equal(fixture.observe().diagnostics.destroyed, true);
    assert.equal(fixture.openNested(), false);
  });

  test(`${candidate} keeps controlled close pending until the explicit commit`, async () => {
    const capture = {};
    const modules = injectedModules(candidate, capture);
    const injected = fakeReact();
    const adapter = await import(`./${candidate}.mjs`);
    const { ModalFixture } = await adapter.createModalCandidate({
      React: injected.React,
      importModule: async (specifier) => modules.get(specifier),
    });
    const controlledRequest = {
      ...structuredClone(request),
      scenario: MODAL_SCENARIOS.find(({ scenarioId }) =>
        scenarioId.endsWith('.controlled-close-commit.v1'),
      ),
    };
    const props = { request: controlledRequest, onReady() {} };
    const renderedOpen = (tree) => {
      if (candidate === 'incumbent') return oneByType(tree, 'Dialog').props.open;
      if (candidate === 'radix' || candidate === 'base-ui') {
        return oneByType(tree, 'Root').props.open;
      }
      return capture.machineOptions.open;
    };

    let tree = injected.render(ModalFixture, props);
    const open = elements(tree).find(
      ({ props: elementProps }) =>
        elementProps['data-modal-operation'] === 'open' &&
        elementProps['data-modal-control'] === 'controlled-modal',
    );
    open.props.onClick();
    tree = injected.render(ModalFixture, props);
    assert.equal(renderedOpen(tree), true);
    const controlledPanel = elements(tree).find(
      ({ props: elementProps }) => elementProps['data-fixture-part'] === 'panel',
    );
    assert.equal(
      elements(controlledPanel).some(
        ({ props: elementProps }) =>
          elementProps['data-modal-operation'] === 'press' &&
          elementProps['data-modal-control'] === 'dismiss-control',
      ),
      true,
    );

    if (candidate === 'incumbent') oneByType(tree, 'Dialog').props.onClose();
    else if (candidate === 'radix' || candidate === 'base-ui') {
      oneByType(tree, 'Root').props.onOpenChange(false);
    } else capture.machineOptions.onOpenChange({ open: false });
    tree = injected.render(ModalFixture, props);
    assert.equal(renderedOpen(tree), true);

    const commit = elements(tree).find(
      ({ props: elementProps }) =>
        elementProps['data-modal-operation'] === 'updateContent' &&
        elementProps['data-modal-control'] === 'controlled-close-commit',
    );
    commit.props.onClick();
    tree = injected.render(ModalFixture, props);
    assert.equal(renderedOpen(tree), false);
  });
}
