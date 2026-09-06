import { createRequire } from 'node:module';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fork } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
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

export function sameWave2ExecutionRequest(serialized, request) {
  if (typeof serialized !== 'string') return false;
  try {
    const parsed = JSON.parse(serialized);
    return validateWave2FixtureRequest(parsed).length === 0 && isDeepStrictEqual(parsed, request);
  } catch {
    return false;
  }
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
      !sameWave2ExecutionRequest(render.requestJSON, request) ||
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

// Only the private, newly forked worker executes candidate modules. A restored
// tracker cannot safely be reused, and restoring globals does not dispose timers.
export async function executeWave2SsrInWorker({ fixture, request, renderTarget }) {
  if (!process.send || process.env.LYRA_WAVE2_SSR_WORKER !== '1')
    throw fail('SSR execution requires the private owned worker');
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
    // This worker is already fresh. A query would split entry-module identity
    // from dynamic chunks importing it, creating a second React dispatcher.
    const module = await import(pathToFileURL(fixture.ssrPath).href);
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
  let resources;
  try {
    const { persistentListeners, ...snapshot } = tracker.snapshot();
    resources = snapshot;
  } catch (error) {
    cleanupErrors.push(error);
  }
  try {
    absent();
  } catch (error) {
    cleanupErrors.push(error);
  }
  try {
    if (tracker.restore() !== true) throw fail('SSR instrumentation was not fresh');
  } catch (error) {
    cleanupErrors.push(error);
  }
  if (cleanupErrors.length) {
    throw Object.assign(
      new AggregateError(
        primary ? [primary, ...cleanupErrors] : cleanupErrors,
        'SSR tracker/environment cleanup failed',
      ),
      { scope: 'run', classification: 'policy', ssrDiagnostics: { resources } },
    );
  }
  if (primary) throw Object.assign(primary, { ssrDiagnostics: { resources } });
  return result;
}

const MAX_IPC_BYTES = 16 * 1024 * 1024;
function errorFromWorker(value, depth = 0) {
  if (
    !value ||
    typeof value !== 'object' ||
    depth > 8 ||
    typeof value.message !== 'string' ||
    typeof value.name !== 'string' ||
    !['run', 'candidate'].includes(value.scope) ||
    !['product', 'policy'].includes(value.classification) ||
    (value.scope === 'candidate') !== (value.classification === 'product') ||
    Object.keys(value).some(
      (k) =>
        ![
          'name',
          'message',
          'scope',
          'classification',
          'errors',
          'cause',
          'ssrDiagnostics',
        ].includes(k),
    )
  )
    throw fail('invalid SSR worker error');
  const errors = value.errors?.map((error) => errorFromWorker(error, depth + 1));
  const constructors = { Error, ReferenceError, TypeError, RangeError, SyntaxError };
  const error = errors
    ? new AggregateError(errors, value.message)
    : new (constructors[value.name] ?? Error)(value.message);
  if (value.cause) error.cause = errorFromWorker(value.cause, depth + 1);
  return Object.assign(error, {
    scope: value.scope,
    classification: value.classification,
    ...(value.ssrDiagnostics ? { ssrDiagnostics: value.ssrDiagnostics } : {}),
  });
}

export async function executeWave2Ssr(
  { fixture, request, renderTarget },
  { forkWorker = fork, timeoutMs = 30_000, terminationMs = 1000 } = {},
) {
  if (!isAbsolute(fixture?.ssrPath ?? '') || validateWave2FixtureRequest(request).length)
    throw fail('invalid SSR worker input');
  const input = {
    fixture: { ssrPath: fixture.ssrPath },
    request,
    ...(renderTarget === undefined ? {} : { renderTarget }),
  };
  const envelope = { schemaVersion: 1, type: 'execute', input };
  if (Buffer.byteLength(JSON.stringify(envelope)) > MAX_IPC_BYTES)
    throw fail('SSR worker input too large');
  let child,
    primary,
    response,
    closed = false,
    terminationRequested = false;
  let responseCount = 0,
    outputBytes = 0,
    timer;
  const cleanupErrors = [];
  let ready, done;
  const outcome = new Promise((resolve) => {
    ready = resolve;
  });
  const disposal = new Promise((resolve) => {
    done = resolve;
  });
  const waitForDisposal = () =>
    new Promise((resolve) => {
      const timeout = setTimeout(resolve, terminationMs);
      disposal.then(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  const reject = (error) => {
    primary = primary
      ? Object.assign(
          new AggregateError([primary, error], 'SSR execution and worker protocol failed'),
          { scope: 'run', classification: 'policy' },
        )
      : error;
    ready();
  };
  try {
    child = forkWorker(new URL('./wave2-ssr-worker.mjs', import.meta.url), [], {
      execPath: process.execPath,
      execArgv: [],
      serialization: 'json',
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env, LYRA_WAVE2_SSR_WORKER: '1' },
    });
    child.on('message', (message) => {
      responseCount++;
      if (responseCount !== 1) return reject(fail('SSR worker sent multiple responses'));
      try {
        if (
          Buffer.byteLength(JSON.stringify(message)) > MAX_IPC_BYTES ||
          message?.schemaVersion !== 1 ||
          !['result', 'error'].includes(message.type) ||
          message.pid !== child.pid ||
          Object.keys(message).sort().join(',') !==
            ['schemaVersion', 'type', 'pid', message.type].sort().join(',')
        )
          throw fail('invalid SSR worker response');
        if (message.type === 'error') {
          const incoming = errorFromWorker(message.error);
          if (primary) reject(incoming);
          else primary = incoming;
        } else {
          if (
            validateWave2Observation(message.result?.observation).length ||
            !sameWave2ExecutionRequest(message.result?.bootstrap?.requestJSON, request)
          )
            throw fail('invalid SSR worker result');
          response = message.result;
        }
        ready();
      } catch (error) {
        reject(error?.scope ? error : fail('malformed SSR worker response'));
      }
    });
    child.on('error', (error) =>
      reject(Object.assign(fail('SSR worker process failed'), { cause: error })),
    );
    child.on('disconnect', () => {
      if (!terminationRequested && !responseCount)
        reject(fail('SSR worker disconnected before response'));
    });
    child.on('close', (code, signal) => {
      closed = true;
      if (!responseCount) reject(fail('SSR worker closed without response'));
      if (code !== 0 && !(terminationRequested && ['SIGTERM', 'SIGKILL'].includes(signal)))
        cleanupErrors.push(fail('SSR worker exited unexpectedly'));
      done();
    });
    for (const stream of [child.stdout, child.stderr])
      stream?.on('data', (bytes) => {
        outputBytes += bytes.length;
        if (outputBytes > 64 * 1024) reject(fail('SSR worker output exceeded limit'));
      });
    timer = setTimeout(() => reject(fail('SSR worker response timed out')), timeoutMs);
    child.send(envelope, (error) => {
      if (error) reject(Object.assign(fail('SSR worker request failed'), { cause: error }));
    });
    await outcome;
  } catch (error) {
    primary = error?.scope
      ? error
      : Object.assign(fail('SSR worker startup failed'), { cause: error });
  } finally {
    clearTimeout(timer);
    if (child) {
      terminationRequested = true;
      if (!closed) {
        try {
          child.kill('SIGTERM');
        } catch (error) {
          cleanupErrors.push(error);
        }
        await waitForDisposal();
      }
      if (!closed) {
        try {
          child.kill('SIGKILL');
        } catch (error) {
          cleanupErrors.push(error);
        }
        await waitForDisposal();
      }
      if (!closed) cleanupErrors.push(fail('SSR worker disposal could not be verified'));
    }
  }
  if (cleanupErrors.length)
    throw Object.assign(
      new AggregateError(
        primary ? [primary, ...cleanupErrors] : cleanupErrors,
        'SSR worker cleanup failed',
      ),
      {
        scope: 'run',
        classification: 'policy',
        ...(primary?.ssrDiagnostics ? { ssrDiagnostics: primary.ssrDiagnostics } : {}),
      },
    );
  if (primary) {
    if (primary.ssrDiagnostics)
      primary.ssrDiagnostics.ssrProcess = { pid: child.pid, disposed: true };
    throw primary;
  }
  if (!response || !closed) throw fail('SSR worker result/disposal missing');
  response.observation.diagnostics.ssrProcess = { pid: child.pid, disposed: true };
  return response;
}
