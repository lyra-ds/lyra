import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { validateWave2Observation } from '../fixtures/wave2/protocol.mjs';
export function fakeReact() {
  const cleanups = [];
  const hookStores = new Map();
  let hooks = [];
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
      const componentHooks = hooks;
      const index = cursor++;
      if (componentHooks[index] === undefined) {
        componentHooks[index] = {
          value: typeof initialValue === 'function' ? initialValue() : initialValue,
        };
      }
      return [
        componentHooks[index].value,
        (nextValue) => {
          componentHooks[index].value =
            typeof nextValue === 'function' ? nextValue(componentHooks[index].value) : nextValue;
          stateUpdates.push(componentHooks[index].value);
        },
      ];
    },
  };
  return {
    cleanups,
    React,
    render(Component, props) {
      if (!hookStores.has(Component)) hookStores.set(Component, []);
      hooks = hookStores.get(Component);
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

export function elements(root) {
  const found = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
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

export const candidateIds = ['incumbent', 'radix', 'base-ui', 'zag'];
export function modulesFor(candidate, family, capture = {}) {
  const kind = { anchored: 'popover', menu: 'menu', tooltip: 'tooltip' }[family];
  const title = kind[0].toUpperCase() + kind.slice(1);
  const primitives = Object.fromEntries(
    [
      'Root',
      'Trigger',
      'Portal',
      'Content',
      'Popup',
      'Positioner',
      'Close',
      'Title',
      'Description',
      'Item',
      'Label',
      'GroupLabel',
      'Separator',
      'Provider',
    ].map((p) => [p, p]),
  );
  if (candidate === 'incumbent')
    return new Map([
      [
        `@lyra-ds/react/${family === 'menu' ? 'dropdown' : kind}`,
        { [family === 'menu' ? 'Dropdown' : title]: family === 'menu' ? 'Dropdown' : title },
      ],
    ]);
  if (candidate === 'radix')
    return new Map([[`@radix-ui/react-${family === 'menu' ? 'dropdown-menu' : kind}`, primitives]]);
  if (candidate === 'base-ui')
    return new Map([[`@base-ui-components/react/${kind}`, { [title]: primitives }]]);
  return new Map([
    [
      `@zag-js/${kind}`,
      {
        machine: { kind },
        connect(service) {
          capture.options = service.options;
          return new Proxy(
            { open: service.options.open },
            {
              get(target, prop) {
                if (prop in target) return target[prop];
                if (String(prop).startsWith('get'))
                  return () => ({ 'data-private-part': String(prop) });
              },
            },
          );
        },
      },
    ],
    [
      '@zag-js/react',
      {
        useMachine(machine, options) {
          return { machine, options };
        },
        normalizeProps: {},
        Portal: 'Portal',
      },
    ],
  ]);
}
export const request = {
  schemaVersion: 1,
  scenario: {
    scenarioId: 'of-anchored.test.v1',
    operations: [{ operation: 'open', target: 'trigger' }],
    probes: [],
  },
  cell: {
    id: 'chromium',
    reactVersion: '19.2.8',
    direction: 'ltr',
    colorScheme: 'light',
    forcedColors: false,
    reducedMotion: false,
    coarsePointer: false,
  },
};
export async function load(candidate, family, { candidateEffect, ...options } = {}) {
  const injected = fakeReact();
  const capture = {};
  const imports = [];
  const modules = modulesFor(candidate, family, capture);
  if (candidateEffect) {
    const connector = modules.get('@zag-js/react');
    const useMachine = connector.useMachine;
    connector.useMachine = (...args) => {
      injected.React.useEffect(candidateEffect, []);
      return useMachine(...args);
    };
  }
  const module = await import(`./${family}/${candidate}.mjs`);
  const title = family[0].toUpperCase() + family.slice(1);
  const result = await module[`create${title}Candidate`]({
    React: injected.React,
    importModule: async (name) => {
      imports.push(name);
      assert.ok(modules.has(name), name);
      return modules.get(name);
    },
    ...options,
  });
  let fixture;
  const props = {
    request: { ...request, scenario: { ...request.scenario, scenarioId: `of-${family}.test.v1` } },
    onReady: (value) => {
      fixture = value;
    },
  };
  const Component = result[`${title}Fixture`];
  const render = () => injected.render(Component, props);
  let tree = render();
  // The adapter shell uses one private owner component so its vendor hooks unmount with that owner.
  function owners(node) {
    return elements(node).filter(
      (n) => typeof n.type === 'function' && n.type.name === 'CandidateOwner',
    );
  }
  const ownerTrees = () => owners(tree).map((n) => injected.render(n.type, n.props));
  return {
    capture,
    imports,
    injected,
    props,
    Component,
    render: () => {
      tree = render();
      return tree;
    },
    ownerTrees,
    unmountOwners() {
      for (const cleanup of injected.cleanups.splice(0)) cleanup();
    },
    get fixture() {
      return fixture;
    },
    get tree() {
      return tree;
    },
  };
}
export function adapterSuite(family) {
  test(`${family} every catalog sequence translates through the neutral driver without oracle input`, async () => {
    const module = await import(`../contracts/${family}.mjs`);
    for (const scenario of module[`${family.toUpperCase()}_SCENARIOS`]) {
      const inputs = [];
      const driver = Object.fromEntries(
        [
          'activate',
          'close',
          'press',
          'hover',
          'point',
          'viewport',
          'visualViewport',
          'motion',
          'lifecycle',
        ].map((name) => [name, async (args) => inputs.push({ name, args })]),
      );
      const loaded = await load('radix', family, { driver });
      loaded.props.request.scenario = {
        scenarioId: scenario.scenarioId,
        operations: scenario.operations,
        probes: scenario.probes,
      };
      for (const operation of scenario.operations) {
        if (operation.operation === 'advanceTime') continue;
        await loaded.fixture.operations[operation.operation](operation);
        loaded.render();
      }
      for (const input of inputs)
        assert.doesNotMatch(JSON.stringify(input), /expected|oracle|radix|base-ui|@zag/);
      const observation = loaded.fixture.observe();
      const { cleanup, diagnostics, ...snapshot } = observation;
      const { direction, ...boundary } = observation;
      assert.deepEqual(
        validateWave2Observation({
          ...boundary,
          trace: [
            {
              phase: 'before-operations',
              snapshot: {
                ...snapshot,
                resources: {
                  listeners: 0,
                  timers: 0,
                  claims: [],
                  listenerEntries: [],
                  listenerLifecycles: [],
                  timerEntries: [],
                  timerLifecycles: [],
                  claimLifecycles: [],
                },
              },
            },
          ],
        }),
        [],
        scenario.scenarioId,
      );
      assert.equal(
        observation.states.length,
        new Set(
          scenario.probes
            .filter((p) => p.category === 'states')
            .map((p) => `${p.target}:${p.property}`),
        ).size,
      );
    }
  });
  for (const candidate of candidateIds) {
    test(`${candidate} ${family} descriptor stays lazy and exports all behavioral paths`, async () => {
      const main = await import(`./${candidate}.mjs`);
      assert.deepEqual(main.adapterDescriptor.supportedContractIds, [
        'OF-MODAL',
        'OF-ANCHORED',
        'OF-MENU',
        'OF-TOOLTIP',
      ]);
      for (const f of ['modal', 'anchored', 'menu', 'tooltip'])
        assert.equal(main[`${f}AdapterPath`], `candidates/${f}/${candidate}.mjs`);
      if (candidate === 'incumbent')
        assert.equal(main.incumbentDescriptor.supportedContractIds.length, 5);
    });
    test(`${candidate} ${family} translates common markers and candidate callbacks`, async () => {
      const loaded = await load(candidate, family);
      const trees = loaded.ownerTrees();
      assert.equal(trees.length, 1);
      const nodes = elements(trees[0]);
      assert.ok(nodes.some((n) => n.props['data-overlay-id'] === 'trigger'));
      const markers = nodes.flatMap((n) =>
        Object.entries(n.props).filter(([key]) => key.startsWith('data-overlay-')),
      );
      assert.ok(markers.length > 0);
      for (const [key, value] of markers)
        assert.doesNotMatch(
          `${key}:${value}`,
          /radix|base-ui|zag|lyra|data-private|Positioner|Popup/,
        );
      assert.equal(typeof loaded.fixture.observe, 'function');
      assert.equal(typeof loaded.fixture.measureRole, 'function');
      const observation = loaded.fixture.observe();
      assert.deepEqual(observation.events, []);
      assert.equal(
        JSON.stringify(observation.states).includes(
          candidate === 'incumbent' ? '@lyra' : candidate,
        ),
        false,
      );
      assert.deepEqual(observation.diagnostics.packageNames, loaded.imports);
      if (candidate !== 'incumbent' || family === 'anchored') {
        const callback =
          candidate === 'zag'
            ? loaded.capture.options.onOpenChange
            : nodes.find((n) => n.type === (candidate === 'incumbent' ? 'Popover' : 'Root')).props
                .onOpenChange;
        callback(candidate === 'zag' ? { open: true } : true);
        assert.ok(loaded.fixture.observe().events.some((e) => e.type === 'opened'));
        await loaded.fixture.destroy();
        const before = loaded.fixture.observe().events.length;
        callback(candidate === 'zag' ? { open: true } : true);
        assert.equal(
          loaded.fixture.observe().events.length,
          before,
          'stale callback cannot revive owner',
        );
      }
    });
    test(`${candidate} ${family} destroy unmounts owners and is idempotent`, async () => {
      const loaded = await load(candidate, family);
      loaded.ownerTrees();
      await loaded.fixture.destroy();
      assert.equal(
        elements(loaded.render()).filter(
          (n) => typeof n.type === 'function' && n.type.name === 'CandidateOwner',
        ).length,
        0,
      );
      assert.deepEqual(await loaded.fixture.destroy(), { status: 'already-destroyed' });
    });
  }
  test(`${family} native input requires the trusted driver`, async () => {
    const loaded = await load('radix', family);
    await assert.rejects(
      loaded.fixture.operations.press({ operation: 'press', target: 'tab-key' }),
      /native.*driver/i,
    );
  });
  test(`${family} role measurements bind the exact DOM target without invented names`, async () => {
    const element = {
      isConnected: true,
      getAttribute: (name) => (name === 'data-overlay-id' ? 'trigger' : null),
    };
    const loaded = await load('radix', family, {
      environment: { document: { querySelectorAll: () => [element] } },
      measureAccessibility: (node) => {
        assert.equal(node, element);
        return { role: 'button', name: '' };
      },
    });
    assert.deepEqual(loaded.fixture.measureRole('trigger'), { role: 'button', name: '' });
    assert.equal(loaded.fixture.measureRole('missing'), undefined);
  });
  test(`${family} imports resolve from exact synthetic isolated package entrypoints`, async (t) => {
    const root = await mkdtemp(join(tmpdir(), `lyra-${family}-adapters-`));
    t.after(() => rm(root, { recursive: true, force: true }));
    const sourceRoot = new URL('../', import.meta.url);
    for (const path of ['fixtures/wave2/react-fixture.mjs', 'fixtures/wave2/measurements.mjs']) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), await readFile(new URL(path, sourceRoot)));
    }
    for (const candidate of candidateIds) {
      const path = `candidates/${family}/${candidate}.mjs`;
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), await readFile(new URL(path, sourceRoot)));
      for (const name of modulesFor(candidate, family).keys()) {
        const bits = name.split('/');
        const packageName = bits.slice(0, 2).join('/');
        const subpath = bits.slice(2).join('/');
        const dir = join(root, 'node_modules', packageName);
        await mkdir(dir, { recursive: true });
        let manifest;
        try {
          manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
        } catch {
          manifest = { name: packageName, type: 'module', exports: {} };
        }
        manifest.exports[subpath ? `./${subpath}` : '.'] = `./${subpath || 'index'}.mjs`;
        await writeFile(join(dir, 'package.json'), JSON.stringify(manifest));
        await writeFile(
          join(dir, `${subpath || 'index'}.mjs`),
          'export const Popover={},Menu={},Dropdown={},Tooltip={},Root={},Trigger={},Portal={},Content={},Popup={},Positioner={},Close={},Title={},Description={},Item={},Label={},GroupLabel={},Separator={},Provider={},machine={},normalizeProps={}; export const connect=()=>({});export const useMachine=()=>({});',
        );
      }
      const title = family[0].toUpperCase() + family.slice(1);
      const entry = join(root, 'entry.mjs');
      await writeFile(
        entry,
        `import {create${title}Candidate} from './${path}';export const loaded=typeof (await create${title}Candidate({React:{}})).${title}Fixture==='function';`,
      );
      const output = join(root, `dist-${candidate}`);
      let resolved = [];
      await build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [
          {
            name: 'closed-imports',
            moduleParsed(info) {
              resolved.push(info.id);
            },
          },
        ],
        build: {
          target: 'esnext',
          outDir: output,
          lib: { entry, fileName: 'entry', formats: ['es'] },
        },
      });
      assert.ok(
        resolved.some((id) => id.includes('node_modules')),
        'bundle must actually resolve an isolated package module',
      );
      assert.ok(
        resolved.filter((id) => id.includes('node_modules')).every((id) => id.startsWith(root)),
      );
      assert.equal((await import(pathToFileURL(join(output, 'entry.mjs')))).loaded, true);
    }
  });
}
