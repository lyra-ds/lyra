import { createRequire } from 'node:module';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createIdentityMeasurements } from '../fixtures/wave2/measurements.mjs';
import { installWave2ResourceTracker } from '../fixtures/wave2/runtime.mjs';
import {
  validateWave2FixtureRequest,
  validateWave2Observation,
} from '../fixtures/wave2/protocol.mjs';

const CHAIN = [
  ['@arethetypeswrong/cli', '0.18.5'],
  ['marked-terminal', '7.3.0'],
  ['cli-highlight', '2.1.11'],
  ['parse5', '5.1.1'],
];
function fail(message) {
  return Object.assign(new Error(message), { scope: 'run', classification: 'policy' });
}
const inside = (root, path) => {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel);
};
export async function loadWave2HtmlParser(
  repositoryRoot = resolve(import.meta.dirname, '../../..'),
) {
  const root = await realpath(join(repositoryRoot, 'node_modules'));
  let require = createRequire(join(repositoryRoot, 'package.json'));
  const provenance = [];
  let entry;
  for (const [index, [name, version]] of CHAIN.entries()) {
    entry = await realpath(require.resolve(index === 0 ? name + '/package.json' : name));
    if (!inside(root, entry))
      throw fail('SSR parser tool resolved outside repository node_modules');
    let directory = dirname(entry),
      metadata,
      path;
    for (;;) {
      path = join(directory, 'package.json');
      try {
        metadata = JSON.parse(await readFile(path, 'utf8'));
        if (metadata.name === name) break;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const parent = dirname(directory);
      if (parent === directory || !inside(root, parent))
        throw fail('SSR parser tool metadata missing');
      directory = parent;
    }
    if (metadata.version !== version || (await realpath(path)) !== path)
      throw fail('SSR parser tool identity/version drift');
    provenance.push({ name, version, path, entry });
    require = createRequire(entry);
  }
  const parser = require(entry);
  if (typeof parser.parseFragment !== 'function')
    throw fail('pinned SSR parser API is unavailable');
  return { parse: (html) => parser.parseFragment(html), provenance };
}

const attributes = (node) => Object.fromEntries((node?.attrs ?? []).map((a) => [a.name, a.value]));
function nodes(root) {
  const result = [];
  function walk(node) {
    if (node.tagName) result.push(node);
    for (const child of node.childNodes ?? []) walk(child);
  }
  walk(root);
  return result;
}
function text(node) {
  return (
    node?.nodeName === '#text'
      ? node.value
      : (node?.childNodes ?? [])
          .filter((n) => !['script', 'style'].includes(n.tagName))
          .map(text)
          .join('')
  )
    .replace(/\s+/gu, ' ')
    .trim();
}
function visible(node) {
  for (let n = node; n; n = n.parentNode) {
    const attrs = attributes(n);
    if (
      Object.hasOwn(attrs, 'hidden') ||
      attrs['aria-hidden'] === 'true' ||
      /(?:display\s*:\s*none|visibility\s*:\s*hidden)/iu.test(attrs.style ?? '')
    )
      return false;
  }
  return !!node;
}
function semantics(root) {
  const all = nodes(root);
  const target = (name) => {
    const matches = all.filter((n) => attributes(n)['data-overlay-id'] === name);
    return matches.length === 1 ? matches[0] : undefined;
  };
  const id = (name) => {
    const matches = all.filter((n) => attributes(n).id === name);
    return matches.length === 1 ? matches[0] : undefined;
  };
  const name = (node, seen = new Set()) => {
    if (!node || seen.has(node)) return '';
    seen.add(node);
    const a = attributes(node);
    if (a['aria-labelledby'])
      return a['aria-labelledby']
        .split(/\s+/u)
        .map((ref) => name(id(ref), seen))
        .join(' ')
        .trim();
    if (a['aria-label'] !== undefined) return a['aria-label'];
    return text(node);
  };
  const role = (node) =>
    attributes(node).role?.split(/\s+/u)[0] ??
    (node?.tagName === 'button'
      ? 'button'
      : node?.tagName === 'a' && attributes(node).href
        ? 'link'
        : undefined);
  return { all, target, id, name, role };
}

export function observeWave2SsrMarkup({
  request,
  renders,
  parse,
  resources,
  parserProvenance = [],
}) {
  if (validateWave2FixtureRequest(request).length) throw fail('invalid SSR execution request');
  const controls = request.scenario.operations.filter(
    (op) => op.operation === 'updateContent' && op.target.startsWith('server-render-'),
  );
  if (renders.length !== controls.length || !renders.length)
    throw fail('SSR render operation coverage mismatch');
  const identities = createIdentityMeasurements();
  let current;
  const measured = {};
  for (const [index, render] of renders.entries()) {
    if (
      typeof render.html !== 'string' ||
      typeof render.repeatHtml !== 'string' ||
      render.requestJSON !== JSON.stringify(request) ||
      render.renderTarget !== controls[index].target ||
      render.contractId !== 'OF-' + request.scenario.scenarioId.split('.')[0].slice(3).toUpperCase()
    )
      throw fail('SSR render binding mismatch');
    current = semantics(parse(render.html));
    for (const target of [
      { 'OF-ANCHORED': 'popup', 'OF-MENU': 'menu', 'OF-TOOLTIP': 'tooltip' }[render.contractId],
    ]) {
      const node = current.target(target),
        raw = attributes(node).id;
      if (raw) identities.bind(target, raw);
      else {
        const trigger = attributes(current.target('trigger'));
        const attribute = target === 'tooltip' ? 'aria-describedby' : 'aria-controls';
        const refs = (trigger[attribute] ?? '').split(/\s+/u).filter(Boolean);
        if (refs.length === 1 && !current.id(refs[0])) identities.bind(target, refs[0]);
      }
    }
    const expanded = attributes(current.target('trigger'))['aria-expanded'];
    if (['true', 'false'].includes(expanded))
      measured[
        'trigger:' + (render.renderTarget.includes('open') ? 'open' : 'closed') + '-aria-expanded'
      ] = expanded === 'true';
  }
  measured['browser-globals:accessed'] = renders.every(
    (r) => r.facts?.['browser-globals:accessed'] === false,
  )
    ? false
    : null;
  measured['server-render:deterministic'] = renders.every((r) => r.html === r.repeatHtml);
  const relationship = (target, property) => {
    const node = current.target(target),
      a = attributes(node);
    const attribute =
      property === 'semantic-relationship'
        ? a['aria-controls']
          ? 'aria-controls'
          : a['aria-describedby']
            ? 'aria-describedby'
            : undefined
        : property;
    const refs = (a[attribute] ?? '').split(/\s+/u).filter(Boolean);
    return refs.length
      ? refs
          .map((ref) =>
            identities.normalize(
              ref,
              !!current.id(ref) &&
                !['popup', 'menu', 'tooltip'].includes(
                  attributes(current.id(ref))['data-overlay-id'],
                ),
            ),
          )
          .join(' ')
      : 'unobserved';
  };
  const value = (target, property) => {
    const node = current.target(target),
      a = attributes(node),
      trigger = attributes(current.target('trigger'));
    if (Object.hasOwn(measured, target + ':' + property)) return measured[target + ':' + property];
    if (property === 'id' || property === 'stable-id')
      return a.id ? identities.normalize(a.id) : null;
    if (property === 'named') return !!node && !!current.name(node);
    if (property === 'modal') return node ? a['aria-modal'] === 'true' : null;
    if (property === 'relationship-target-exists') {
      const refs = (a['aria-controls'] ?? a['aria-describedby'] ?? '')
        .split(/\s+/u)
        .filter(Boolean);
      return refs.length > 0 && refs.every((ref) => !!current.id(ref));
    }
    if (property === 'item-roles')
      return node
        ? nodes(node)
            .filter(
              (n) =>
                attributes(n)['data-overlay-part'] === 'item' ||
                (attributes(n)['data-overlay-id'] && current.role(n)?.startsWith('menuitem')),
            )
            .map(current.role)
            .filter(Boolean)
        : null;
    if (property === 'description-exists')
      return (trigger['aria-describedby'] ?? '')
        .split(/\s+/u)
        .filter(Boolean)
        .some((ref) => current.id(ref) === node && !!node);
    if (property === 'described-text') return node ? text(node) : null;
    if (property === 'open') return node ? visible(node) : false;
    return null;
  };
  const fields = {
    roles: [],
    relationships: [],
    states: [],
    focus: { target: 'server-focus-unchanged' },
    events: [],
    announcements: [],
    cleanup: [],
  };
  const probes = request.scenario.probes
    .filter((p) => p.phase === 'server-render')
    .map((probe) => {
      let fact;
      if (probe.category === 'states')
        fact = {
          target: probe.target,
          name: probe.property,
          value: value(probe.target, probe.property),
        };
      else if (probe.category === 'roles') {
        const node = current.target(probe.target);
        fact = {
          role: current.role(node) || 'unobserved',
          name: current.name(node) || 'unobserved',
        };
      } else if (probe.category === 'relationships')
        fact = {
          source: probe.target,
          name: probe.property,
          target: relationship(probe.target, probe.property),
        };
      else if (probe.category === 'focus') fact = fields.focus;
      else throw fail('unsupported SSR probe category');
      if (probe.category !== 'focus') fields[probe.category].push(fact);
      return { id: probe.id, category: probe.category, fact };
    });
  const observation = {
    ...fields,
    trace: [
      {
        phase: 'server-render',
        snapshot: {
          roles: fields.roles,
          relationships: fields.relationships,
          states: fields.states,
          focus: fields.focus,
          events: [],
          announcements: [],
          direction: request.cell.direction,
          resources,
          probes,
        },
      },
    ],
    diagnostics: {
      executionCompleted: true,
      cleanupObserved: false,
      renderOperations: controls,
      rawRenders: renders,
      identities: identities.diagnostics(),
      parserProvenance,
    },
  };
  const errors = validateWave2Observation(observation);
  if (errors.length) throw fail('SSR observation invalid: ' + errors.join('; '));
  return observation;
}

export async function executeWave2Ssr({ fixture, request, renderTarget }) {
  const absent = () => {
    for (const key of ['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame'])
      if (key in globalThis) throw fail('SSR requires actual absent browser globals');
  };
  absent();
  const tracker = installWave2ResourceTracker(globalThis);
  let result,
    primary,
    rendering = true;
  try {
    const module = await import(
      pathToFileURL(fixture.ssrPath).href + '?wave2=' + crypto.randomUUID()
    );
    if (typeof module.renderWave2Fixture !== 'function')
      throw fail('SSR bundle must export renderWave2Fixture');
    const controls = request.scenario.operations.filter(
      (op) => op.operation === 'updateContent' && op.target.startsWith('server-render-'),
    );
    const renders = [];
    for (const op of controls)
      renders.push(await module.renderWave2Fixture({ renderTarget: op.target }));
    rendering = false;
    absent();
    const { parse, provenance } = await loadWave2HtmlParser();
    const { persistentListeners, ...resources } = tracker.snapshot();
    const observation = observeWave2SsrMarkup({
      request,
      renders,
      parse,
      resources,
      parserProvenance: provenance,
    });
    result = {
      observation,
      bootstrap: renders.find((r) => r.renderTarget === (renderTarget ?? controls[0].target)),
    };
  } catch (error) {
    primary =
      rendering && error instanceof Error && !error.scope
        ? Object.assign(error, { scope: 'candidate', classification: 'product' })
        : error;
  }
  const cleanupErrors = [];
  try {
    absent();
  } catch (error) {
    cleanupErrors.push(error);
  }
  try {
    tracker.restore();
  } catch (error) {
    cleanupErrors.push(error);
  }
  if (cleanupErrors.length) {
    throw Object.assign(
      new AggregateError(
        primary ? [primary, ...cleanupErrors] : cleanupErrors,
        'SSR tracker/environment cleanup failed',
      ),
      { scope: 'run', classification: 'policy' },
    );
  }
  if (primary) throw primary;
  return result;
}
