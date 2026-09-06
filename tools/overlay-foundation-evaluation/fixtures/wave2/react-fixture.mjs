import {
  createIdentityMeasurements,
  markerProps,
  targetElement,
  visible,
  rect,
  placementFacts,
} from './measurements.mjs';

const COMMANDS = Object.freeze([
  { id: 'alpha', label: 'Álpha' },
  { id: 'label', type: 'label', label: 'Group' },
  { id: 'beta', label: 'Beta', disabled: true },
  { id: 'separator', type: 'separator' },
  { id: 'alpine', label: 'Álpine' },
  { id: 'bravo', label: 'Bravo' },
]);
const keyNames = {
  'enter-key': 'Enter',
  'space-key': 'Space',
  'arrow-down-key': 'ArrowDown',
  'arrow-up-key': 'ArrowUp',
  'arrow-left-key': 'ArrowLeft',
  'arrow-right-key': 'ArrowRight',
  'home-key': 'Home',
  'end-key': 'End',
  'escape-key': 'Escape',
  'tab-key': 'Tab',
  'shift-tab-key': 'Shift+Tab',
};
const RUNNER_FACT_KEYS = new Set([
  'browser-globals:accessed',
  'server-render:deterministic',
  'first-tree:identical',
  'hydration-warnings:count',
  'trigger:closed-aria-expanded',
  'trigger:open-aria-expanded',
]);
export function physicalPlacement(placement, direction) {
  return placement
    .replace('inline-start', direction === 'rtl' ? 'right' : 'left')
    .replace('inline-end', direction === 'rtl' ? 'left' : 'right')
    .replace(/-center$/, '');
}
export function mergeHandlers(candidate, consumer) {
  const result = { ...candidate, ...consumer };
  for (const name of Object.keys(consumer))
    if (
      /^on[A-Z]/.test(name) &&
      typeof consumer[name] === 'function' &&
      typeof candidate[name] === 'function'
    )
      result[name] = (event) => {
        consumer[name](event);
        if (!event.defaultPrevented) candidate[name](event);
      };
  return result;
}
export function createReactFixture({
  React,
  ReactDOM = {},
  family,
  packageNames,
  CandidateOwner,
  Provider,
  environment = globalThis,
  driver,
  measureAccessibility,
  instrumentation,
  readPrivate,
  limitations = [],
}) {
  const h = React.createElement;
  function Fixture({ request, onReady, renderTarget }) {
    const [, setVersion] = React.useState(0);
    const reference = React.useRef();
    if (!reference.current) {
      const ops = request.scenario.operations;
      if (
        renderTarget !== undefined &&
        (!renderTarget.startsWith('server-render-') ||
          !ops.some(
            (operation) =>
              operation.operation === 'updateContent' && operation.target === renderTarget,
          ))
      )
        throw new Error('server render target must be a declared execution control');
      const paired = ops.some((o) => o.target === 'trigger-a');
      const nested = ops.some((o) => o.target === 'parent-trigger');
      const initiallyOpen = /server-render.*open/.test(
        renderTarget ?? (ops[0]?.operation === 'updateContent' ? ops[0].target : ''),
      );
      const primary = family === 'tooltip' ? 'tooltip' : family === 'menu' ? 'menu' : 'popup';
      const owners = (
        paired ? ['tooltip-a', 'tooltip-b'] : nested ? ['parent-popup', 'child-popup'] : [primary]
      ).map((id, index) => ({
        id,
        trigger: paired
          ? `trigger-${index ? 'b' : 'a'}`
          : nested
            ? `${index ? 'child' : 'parent'}-trigger`
            : 'trigger',
        domId: paired ? `${id}-id` : nested ? `${id}-id` : `${primary}-id`,
        mounted: true,
        triggerMounted: true,
        open: initiallyOpen,
        generation: 0,
      }));
      reference.current = {
        owners,
        identities: createIdentityMeasurements(),
        ssrMenu: ['server-render-menu-closed', 'server-render-menu-open'].includes(
          renderTarget ?? ops[0]?.target,
        ),
        direction: request.cell.direction,
        placement: 'bottom-start',
        text: 'Workspace details',
        events: [],
        announcements: [],
        counts: {},
        focusCounts: {},
        selection: null,
        cancelSelection: false,
        description: false,
        destroyed: false,
        context: undefined,
        theme: request.cell.colorScheme,
        brand: 'default',
        host: 'primary',
        geometry: { x: 300, y: 200, width: 80, height: 40, contentWidth: 200, contentHeight: 120 },
        before: { events: 0, focus: 0, measurements: 0 },
        focusMoves: 0,
        removalAnnouncements: 0,
        destroyAnnouncements: 0,
        closeAnnouncements: 0,
      };
    }
    const state = reference.current;
    const document = environment.document;
    const bump = () => setVersion((v) => v + 1);
    const flush = (callback) =>
      typeof ReactDOM.flushSync === 'function' ? ReactDOM.flushSync(callback) : callback();
    const count = (name) => {
      state.counts[name] = (state.counts[name] ?? 0) + 1;
    };
    const refresh = () => {
      for (const owner of state.owners) owner.identify?.(document);
      for (const owner of state.owners) {
        const content = targetElement(document, owner.id);
        if (content?.id) state.identities.bind(owner.id, content.id);
        else {
          const trigger = targetElement(document, owner.trigger);
          const attribute = family === 'tooltip' ? 'aria-describedby' : 'aria-controls';
          const references = (trigger?.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
          const ownedReferences =
            family === 'tooltip'
              ? references.filter((id) => id !== 'existing-help' && !document?.getElementById?.(id))
              : references;
          if (ownedReferences.length === 1) state.identities.bind(owner.id, ownedReferences[0]);
        }
      }
    };
    const find = (target) => {
      refresh();
      return targetElement(document, target);
    };
    const input = async (action, args) => {
      if (typeof driver?.[action] !== 'function')
        throw new Error(`native ${action} driver is required`);
      return driver[action](args);
    };
    const settle = async () => {
      flush(() => {});
      await Promise.resolve();
      refresh();
    };
    const measure = (callback) =>
      instrumentation?.read ? instrumentation.read(callback) : callback();
    const change = (owner, next, event) => {
      if (state.destroyed || !owner.mounted || event?.defaultPrevented) return false;
      if (owner.open === next) return true;
      owner.open = next;
      state.events.push({ target: owner.id, type: next ? 'opened' : 'closed' });
      if (!next) {
        owner.generation++;
        state.closeAnnouncements = state.announcements.length;
        state.closeMeasurements = instrumentation?.snapshot().measurementCount;
      }
      bump();
      return true;
    };
    const select = (owner, id, event) => {
      if (state.destroyed || !owner.mounted) return false;
      count('selection-handler');
      count(`${id}:activation`);
      if (state.cancelSelection) event?.preventDefault?.();
      state.selectionPrevented = event?.defaultPrevented === true;
      if (!state.selectionPrevented) {
        state.selection = id;
        state.events.push({ target: id, type: 'selected' });
      }
      return !state.selectionPrevented;
    };
    const before = () => {
      state.before = {
        focusCalls: instrumentation?.snapshot().focusCalls?.length ?? 0,
        events: state.events.length,
        focus: state.focusMoves,
        measurements: instrumentation?.snapshot().measurementCount ?? 0,
        rect: rect(find(family === 'tooltip' ? 'tooltip' : family === 'menu' ? 'menu' : 'popup')),
      };
    };
    const ownerFor = (target) =>
      state.owners.find((o) => [o.id, o.trigger].includes(target)) ?? state.owners[0];
    async function update(target, context) {
      if (target.startsWith('server-render') || target === 'hydrate-first-tree')
        return input('lifecycle', { target });
      if (target.startsWith('placement-')) state.placement = target.slice(10);
      else if (target === 'geometry-standard-bottom-start') {
        state.placement = 'bottom-start';
        state.geometry = {
          x: 300,
          y: 200,
          width: 80,
          height: 40,
          contentWidth: 200,
          contentHeight: 120,
        };
      } else if (target === 'theme-dark-brand-ocean') {
        state.theme = 'dark';
        state.brand = 'ocean';
      } else if (target === 'portal-host-secondary') state.host = 'secondary';
      else if (target === 'menu-disabled-boundary-rows') state.boundaryRows = true;
      else if (target === 'cancel-selection-default') state.cancelSelection = true;
      else if (target === 'consumer-description-existing-help') state.description = true;
      else if (target.startsWith('remove-trigger')) {
        const owner = state.owners[0];
        owner.triggerMounted = false;
        state.successor = target.endsWith('-command')
          ? 'successor-command'
          : target.endsWith('-region')
            ? 'successor-region'
            : undefined;
        if (family === 'tooltip') {
          owner.mounted = false;
          owner.generation++;
          context?.invalidate(owner.id);
        }
        state.removalAnnouncements = state.announcements.length;
      } else if (target === 'restore-trigger') {
        state.successor = undefined;
        const owner = state.owners[0];
        owner.triggerMounted = true;
        owner.mounted = true;
        owner.open = false;
        owner.generation++;
      } else if (target === 'replace-tooltip-content') {
        state.text = 'Updated workspace details';
        state.owners[0].generation++;
        context?.invalidate(state.owners[0].id);
      } else if (target === 'mount-fresh-tooltip') {
        state.owners = [
          {
            id: 'tooltip',
            trigger: 'trigger',
            domId: 'tooltip-id',
            mounted: true,
            triggerMounted: true,
            open: false,
            generation: 0,
          },
        ];
      } else if (target !== 'current-public-command-label-separator-model')
        throw new Error(`unknown fixture content control: ${target}`);
      flush(bump);
    }
    async function resize(target) {
      let match;
      if (target === 'trigger-bottom-edge') {
        state.geometry.x = 300;
        state.geometry.y = 550;
      } else if (target === 'trigger-right-edge') {
        state.geometry.x = 700;
        state.geometry.y = 550;
      } else if ((match = /^trigger-width-(\d+)$/.exec(target)))
        state.geometry.width = Number(match[1]);
      else if ((match = /^content-width-(\d+)$/.exec(target)))
        state.geometry.contentWidth = Number(match[1]);
      else if ((match = /^content-height-(\d+)$/.exec(target)))
        state.geometry.contentHeight = Number(match[1]);
      else if ((match = /^viewport-width-(\d+)$/.exec(target)))
        await input('viewport', { width: Number(match[1]), height: environment.innerHeight });
      else if ((match = /^visual-viewport-width-(\d+)$/.exec(target)))
        await input('visualViewport', { width: Number(match[1]) });
      else throw new Error(`unknown fixture resize: ${target}`);
      flush(bump);
    }
    const actions = {
      async open({ target }) {
        await input('activate', { target: ownerFor(target).trigger });
      },
      async close({ target }) {
        const owner = ownerFor(target);
        if (visible(find(owner.id), environment) || owner.open)
          await input('close', { target: owner.id, trigger: owner.trigger });
      },
      async focus({ target }) {
        find(target)?.focus();
      },
      async blur({ target }) {
        find(target)?.blur();
      },
      async press({ target }) {
        const key =
          keyNames[target] ?? (target.startsWith('character-') ? target.slice(10) : undefined);
        if (!key) throw new Error(`unknown keyboard control: ${target}`);
        await input('press', { key });
      },
      async hover({ target }) {
        await input('hover', { target: target === 'outside' ? 'outside-control' : target });
      },
      async point({ target }) {
        if (target === 'touch-menu-scroll-start') state.menuScrollStart = find('menu')?.scrollTop;
        const pointerType = target.startsWith('touch-') ? 'touch' : 'mouse';
        let name = target.replace(/^touch-/, '');
        const phase = name.includes('pointer-cancel')
          ? 'cancel'
          : name.endsWith('-down') || name.endsWith('-start')
            ? 'down'
            : name.endsWith('-up') || name.endsWith('-end')
              ? 'up'
              : 'move';
        name = name
          .replace(/-(?:context-menu-)?(?:down|up|drag|pointer-cancel|start|move|end)$/, '')
          .replace(/-scroll$/, '');
        const mapped = {
          outside: 'outside-control',
          inside: state.owners[0].id,
          child: 'child-popup',
          'popup-content': 'popup-command',
          'help-disclosure': 'help-disclosure-trigger',
        };
        await input('point', {
          target: mapped[name] ?? name,
          phase,
          pointerType,
          button: target.includes('context-menu') ? 'right' : 'left',
          drag: target.includes('drag') || target.includes('scroll-move'),
        });
      },
      async resize({ target }) {
        await resize(target);
      },
      async scroll({ target }) {
        if (target.startsWith('ancestor-y-')) {
          const node = find('scroll-ancestor');
          if (node) node.scrollTop = Number(target.slice(11));
        } else if (target === 'constrained-popup-bottom') {
          const node = find('popup');
          if (node) node.scrollTop = node.scrollHeight;
        } else throw new Error(`unknown fixture scroll: ${target}`);
      },
      async setDirection({ target }) {
        state.direction = target;
        if (document?.documentElement) document.documentElement.dir = target;
        flush(bump);
      },
      async setMotionPreference({ target }) {
        await input('motion', { reducedMotion: target });
      },
      async updateContent({ target }, context) {
        await update(target, context);
      },
      async destroy({ target }, context) {
        const owner = ownerFor(target);
        if (!owner.mounted) return { status: 'already-destroyed' };
        owner.mounted = false;
        owner.generation++;
        context?.invalidate(owner.id);
        state.destroyAnnouncements = state.announcements.length;
        flush(bump);
        return { status: 'destroyed' };
      },
    };
    const operations = Object.fromEntries(
      Object.entries(actions).map(([name, action]) => [
        name,
        async (operation, context) => {
          state.context = context;
          measure(before);
          state.operation = operation;
          if (['focus', 'hover'].includes(operation.operation)) {
            const owner = state.owners.find((owner) => owner.trigger === operation.target);
            if (owner) owner.inputStartedAt = environment.performance?.now?.();
          }
          const result = await action(operation, context);
          await settle();
          return result;
        },
      ]),
    );
    const observe = () =>
      measure(() => {
        refresh();
        const resources = environment.__LYRA_OVERLAY_RESOURCE_TRACKER__?.snapshot();
        const metrics = instrumentation?.snapshot();
        state.liveTexts ??= new WeakMap();
        for (const node of document?.querySelectorAll?.(
          '[aria-live], [role="status"], [role="alert"]',
        ) ?? []) {
          const message = node.textContent?.trim();
          if (
            message &&
            node.getAttribute('aria-live') !== 'off' &&
            node.getAttribute('aria-hidden') !== 'true' &&
            state.liveTexts.get(node) !== message
          ) {
            state.announcements.push({ message });
            state.liveTexts.set(node, message);
          }
        }
        const focusNode = document?.activeElement;
        const focusTarget =
          document && focusNode === document.body
            ? 'document-body'
            : (focusNode?.getAttribute?.('data-overlay-id') ?? 'unobserved');
        const normalizeReference = (id, name) =>
          state.identities.normalize(
            id,
            name !== 'aria-controls' &&
              (id === 'existing-help' || Boolean(document?.getElementById?.(id))),
          );
        const states = [];
        const relationships = [];
        const add = (target, name, value) => states.push({ target, name, value: value ?? null });
        const privateFacts = readPrivate?.({ state, document, find }) ?? {};
        for (const owner of state.owners) {
          const open = privateFacts[`${owner.id}:open`] ?? visible(find(owner.id), environment);
          if (open && !owner.lastObservedOpen && owner.inputStartedAt !== undefined) {
            const now = environment.performance?.now?.();
            if (now !== undefined) owner.elapsedOpenDelay = now - owner.inputStartedAt;
          }
          owner.lastObservedOpen = open;
        }
        const valueFor = (target, name) => {
          const element = find(target);
          const owner = state.owners.find((o) => o.id === target);
          const triggerOwner = state.owners.find((o) => o.trigger === target);
          const popup = find(
            owner?.id ??
              triggerOwner?.id ??
              (family === 'tooltip' ? 'tooltip' : family === 'menu' ? 'menu' : 'popup'),
          );
          const trigger = find(owner?.trigger ?? triggerOwner?.trigger ?? state.owners[0]?.trigger);
          const attr = (name) => element?.getAttribute?.(name);
          const descendants = (selector) => [...(element?.querySelectorAll?.(selector) ?? [])];
          if (Object.hasOwn(privateFacts, `${target}:${name}`))
            return privateFacts[`${target}:${name}`];
          if (name === 'open')
            return target === 'help-disclosure'
              ? element?.open === true
              : visible(element, environment);
          if (name === 'elapsed-open-delay') return owner?.elapsedOpenDelay ?? null;
          if (name === 'restoration-count')
            return (
              instrumentation
                ?.snapshot()
                .focusCalls?.slice(state.before.focusCalls ?? 0)
                .filter((id) => id === target).length ?? null
            );
          if (target === 'menu' && name === 'scroll-position-changed')
            return state.menuScrollStart === undefined
              ? null
              : element?.scrollTop !== state.menuScrollStart;
          if (target === 'menu' && name === 'scroll-prevented')
            return state.scrollNativeEvent?.defaultPrevented ?? null;
          if (target === 'synthetic-hover' && name === 'event-count')
            return state.touchHoverCount ?? 0;
          if (target === 'help-disclosure' && name === 'operable') {
            const summary = element?.querySelector?.('summary');
            return Boolean(summary?.tagName === 'SUMMARY' && summary.tabIndex >= 0);
          }
          if (name === 'id' || name === 'stable-id')
            return element?.id ? state.identities.normalize(element.id) : null;
          if (name === 'connected' || name === 'description-exists')
            return Boolean(element?.isConnected);
          if (name === 'current' && target === 'document-focus') return focusTarget;
          if (name === 'move-count-since-operation') return state.focusMoves - state.before.focus;
          if (name === 'focus-count') return state.focusCounts[target] ?? 0;
          if (name === 'focus-received')
            return focusTarget === target || (state.focusCounts[target] ?? 0) > 0;
          if (name === 'activation-count' || name === 'native-action-count')
            return state.counts[`${target}:activation`] ?? 0;
          if (name === 'invocation-count') return state.counts[target] ?? 0;
          if (name === 'aria-expanded' || name === 'aria-disabled')
            return attr(name) == null ? null : attr(name) === 'true';
          if (name === 'aria-haspopup') return attr(name);
          if (name === 'aria-controls')
            return (
              attr(name)
                ?.split(/\s+/)
                .filter(Boolean)
                .map((id) => state.identities.normalize(id))
                .join(' ') ?? null
            );
          if (name === 'aria-describedby')
            return (attr(name) ?? '')
              .split(/\s+/)
              .filter(Boolean)
              .map((id) => normalizeReference(id, name));
          if (name.endsWith('-present') && name.startsWith('aria-'))
            return element?.hasAttribute?.(name.slice(0, -8)) ?? false;
          if (name === 'semantic-trigger-count')
            return trigger
              ? [trigger, ...trigger.querySelectorAll('button,[role="button"]')].filter(
                  (n) => n.tagName === 'BUTTON' || n.getAttribute('role') === 'button',
                ).length
              : 0;
          if (name === 'tab-stop-count')
            return element
              ? [element, ...descendants('button,input,select,textarea,a[href],[tabindex]')].filter(
                  (n) => n.tabIndex >= 0 && !n.disabled && visible(n, environment),
                ).length
              : 0;
          if (name === 'tabindex')
            return target === 'other-command-items'
              ? [...(document?.querySelectorAll?.('[data-overlay-part="item"]') ?? [])]
                  .filter((n) => n !== focusNode)
                  .map((n) => n.tabIndex)
              : element?.tabIndex;
          if (name === 'tabindex-zero-item-count')
            return descendants('[role="menuitem"]').filter((n) => n.tabIndex === 0).length;
          if (name === 'selection') return state.selection;
          if (name === 'default-prevented')
            return target === 'selection-event'
              ? (state.selectionPrevented ?? false)
              : (state.prevented ?? false);
          if (name === 'active-item') return focusTarget;
          if (name === 'inside-parent') return find('parent-popup')?.contains(element) ?? false;
          if (name === 'relationship-target-exists') {
            const id =
              element?.getAttribute?.('aria-controls') ??
              element?.getAttribute?.('aria-describedby');
            return Boolean(id?.split(/\s+/).some((id) => document?.getElementById?.(id)));
          }
          if (name === 'named') return Boolean(element && measureAccessibility?.(element)?.name);
          if (name === 'modal') return element?.getAttribute?.('aria-modal') === 'true';
          if (name === 'direction')
            return element
              ? (environment.getComputedStyle?.(element)?.direction ?? element.dir)
              : null;
          if (name === 'theme' || name === 'brand')
            return element?.closest?.(`[data-${name}]`)?.getAttribute?.(`data-${name}`);
          if (name === 'portal-host')
            return element?.closest?.('[data-overlay-host]')?.getAttribute('data-overlay-host');
          if (
            [
              'side',
              'alignment',
              'physical-side',
              'alignment-edge',
              'public-placement',
              'shifted',
              'visual-viewport-contained',
              'bounded-scroll-region',
            ].includes(name)
          )
            return placementFacts(popup, trigger, environment, state.direction)[name];
          if (name === 'reachable') {
            const box = rect(element);
            return Boolean(
              box &&
              visible(element, environment) &&
              box.top >= 0 &&
              box.bottom <= environment.innerHeight,
            );
          }
          if (name === 'updated-since-operation')
            return JSON.stringify(rect(popup)) !== JSON.stringify(state.before.rect);
          if (name === 'measurement-count-since-operation')
            return metrics ? metrics.measurementCount - state.before.measurements : null;
          if (name === 'measurement-count-since-close')
            return metrics && state.closeMeasurements !== undefined
              ? metrics.measurementCount - state.closeMeasurements
              : null;
          if (name === 'count-since-operation' && target === 'semantic-events')
            return state.events.length - state.before.events;
          if (name === 'count' && target === 'semantic-events') return state.events.length;
          if (name === 'close-count') return state.events.filter((e) => e.type === 'closed').length;
          if (target === 'announcements') {
            if (name === 'count') return state.announcements.length;
            if (name === 'duplicate-count')
              return (
                state.announcements.length - new Set(state.announcements.map((a) => a.message)).size
              );
            return (
              state.announcements.length -
              (name === 'count-since-removal'
                ? state.removalAnnouncements
                : name === 'count-since-destroy'
                  ? state.destroyAnnouncements
                  : state.closeAnnouncements)
            );
          }
          if (name === 'visible-text' && target === 'help-disclosure')
            return element?.open ? element.querySelector?.('p')?.textContent?.trim() : null;
          if (name === 'visible-text')
            return visible(element, environment) ? element?.textContent?.trim() : null;
          if (name === 'described-text') return element?.textContent?.trim();
          if (target === 'public-model') return 'not-applicable-current-public-model';
          if (name === 'allowed-item-roles' || name === 'item-roles') {
            const roles = descendants('[role], hr, [data-overlay-part="label"]')
              .map((node) => measureAccessibility?.(node)?.role ?? node.getAttribute('role'))
              .filter((role) => typeof role === 'string');
            if (name === 'item-roles') return roles.filter((role) => role.startsWith('menuitem'));
            return [
              ...new Set(
                roles.filter(
                  (role) =>
                    role.startsWith('menuitem') || ['separator', 'presentation'].includes(role),
                ),
              ),
            ];
          }
          if (name === 'menuitemcheckbox-count' || name === 'menuitemradio-count')
            return descendants(`[role="${name.slice(0, -6)}"]`).length;
          if (name === 'submenu-trigger-count') return descendants('[aria-haspopup="menu"]').length;
          if (name === 'nested-menu-count') return descendants('[role="menu"]').length;
          if (name === 'checked-state-count') return descendants('[aria-checked]').length;
          if (name === 'active-count') {
            if (['observers', 'observer', 'placement-observers'].includes(target))
              return metrics?.observerCount ?? null;
            if (['listeners', 'listener', 'dismissal-listeners'].includes(target))
              return resources?.listeners ?? null;
            if (target === 'timers') return resources?.timers ?? null;
            if (
              [
                'open-delay-timer',
                'pointer-grace-timer',
                'warm-expiry-timer',
                'typeahead-timer',
              ].includes(target) &&
              resources?.timers === 0
            )
              return 0;
            if (target === 'portal')
              return document
                ? [...document.querySelectorAll('[data-overlay-portal]')].filter(
                    (n) => n.isConnected,
                  ).length
                : 0;
          }
          // Runner-only SSR/hydration and inaccessible machine state remain unobserved.
          return RUNNER_FACT_KEYS.has(`${target}:${name}`)
            ? (driver?.facts?.()?.[`${target}:${name}`] ?? null)
            : null;
        };
        for (const probe of request.scenario.probes) {
          if (
            probe.category === 'states' &&
            !states.some((s) => s.target === probe.target && s.name === probe.property)
          )
            add(probe.target, probe.property, valueFor(probe.target, probe.property));
        }
        for (const owner of state.owners) {
          const node = find(owner.trigger);
          for (const name of ['aria-controls', 'aria-describedby', 'aria-labelledby'])
            for (const id of (node?.getAttribute?.(name) ?? '').split(/\s+/).filter(Boolean))
              relationships.push({
                source: owner.trigger,
                name,
                target: normalizeReference(id, name),
              });
          const related = node?.getAttribute?.('aria-controls');
          if (related)
            relationships.push({
              source: owner.trigger,
              name: 'semantic-relationship',
              target: related
                .split(/\s+/)
                .filter(Boolean)
                .map((id) => normalizeReference(id, 'aria-controls'))
                .join(' '),
            });
        }
        const cleanup = [];
        if (state.destroyed) {
          if (resources?.timers === 0) cleanup.push('timers-released');
          if (resources?.listeners === 0) cleanup.push('listeners-released');
          if (metrics?.observerCount === 0) cleanup.push('observers-released');
        }
        return {
          direction: state.direction,
          roles: [],
          relationships,
          states,
          focus: { target: focusTarget },
          events: [...state.events],
          announcements: [...state.announcements],
          cleanup,
          diagnostics: {
            limitations,
            identities: state.identities.diagnostics(),
            packageNames,
            ...(readPrivate ? { privateMeasurements: privateFacts } : {}),
          },
        };
      });
    const handle = {
      operations,
      observe,
      measureRole(target) {
        const element = find(target);
        return element && measureAccessibility ? measureAccessibility(element) : undefined;
      },
      async destroy() {
        if (state.destroyed) return { status: 'already-destroyed' };
        state.destroyed = true;
        for (const owner of state.owners) {
          owner.mounted = false;
          owner.generation++;
        }
        flush(bump);
        await settle();
        return { status: 'destroyed' };
      },
    };
    React.useEffect(() => {
      onReady?.(handle);
    }, []);
    React.useEffect(
      () => () => {
        state.destroyed = true;
        for (const owner of state.owners) owner.mounted = false;
      },
      [],
    );
    const eventProps = (target) => ({
      onFocus: () => {
        if (target.startsWith('trigger')) count('trigger-focus-handler');
      },
      onClick: (event) => {
        count(`${target}:activation`);
        if (target.includes('trigger')) count('trigger-handler');
        state.prevented = event.defaultPrevented === true;
      },
    });
    const buildOwner = (owner, children) => {
      if (!owner.mounted) return null;
      const generation = owner.generation;
      const live =
        (callback) =>
        (...args) => {
          if (!state.destroyed && owner.mounted && owner.generation === generation)
            return callback(...args);
          return false;
        };
      const model = {
        owner,
        family,
        state,
        document,
        environment,
        ReactDOM,
        children,
        successor:
          owner === state.owners[0] && state.successor ? () => find(state.successor) : undefined,
        trigger: {
          props: {
            ...markerProps(owner.trigger, 'trigger'),
            ...eventProps(owner.trigger),
            id: `${owner.trigger}-id`,
            style: { width: state.geometry.width, height: state.geometry.height },
            ...(state.description ? { 'aria-describedby': 'existing-help' } : {}),
          },
          children: 'Workspace',
        },
        content: {
          props: {
            ...markerProps(owner.id, 'content'),
            'data-overlay-panel': '',
            id: owner.domId,
            dir: state.direction,
            'data-theme': state.theme,
            'data-brand': state.brand,
            style: { width: state.geometry.contentWidth, minHeight: state.geometry.contentHeight },
          },
          children: state.text,
        },
        command: {
          props: {
            ...markerProps(
              owner.id === 'child-popup' ? 'child-command' : 'popup-command',
              'command',
            ),
            onPointerUp: () => count('content-handler'),
          },
          children: 'Workspace command',
        },
        items: (state.boundaryRows
          ? [
              { id: 'disabled-first', label: 'Unavailable first', disabled: true },
              ...COMMANDS,
              { id: 'disabled-last', label: 'Unavailable last', disabled: true },
            ]
          : state.ssrMenu
            ? COMMANDS.filter((item) => item.id !== 'alpine')
            : COMMANDS
        ).map((item) => ({
          ...item,
          onSelect: live((event) => select(owner, item.id, event)),
        })),
        onOpenChange: live((next, event) => change(owner, next, event)),
        select: live((id, event) => select(owner, id, event)),
        portalContainer: targetElement(document, `portal-host-${state.host}`),
      };
      return h(CandidateOwner, { key: owner.id, model });
    };
    let owners;
    if (state.owners.some((o) => o.id === 'child-popup'))
      owners = [buildOwner(state.owners[0], buildOwner(state.owners[1]))];
    else owners = state.owners.map((owner) => buildOwner(owner));
    const group = Provider
      ? h(Provider, { key: state.owners.some((o) => o.mounted) ? 'active' : 'empty' }, ...owners)
      : owners;
    const button = (id, text) =>
      h(
        'button',
        {
          ...markerProps(id, 'external'),
          ...eventProps(id),
          style: { position: 'relative', zIndex: 1 },
        },
        text,
      );
    return h(
      'div',
      {
        'data-overlay-fixture-root': '',
        dir: state.direction,
        'data-theme': state.theme,
        'data-brand': state.brand,
        onTouchMoveCapture: (event) => {
          state.scrollNativeEvent = event.nativeEvent ?? event;
        },
        onPointerMoveCapture: (event) => {
          if (event.pointerType === 'touch') state.scrollNativeEvent = event.nativeEvent ?? event;
        },
        onMouseOverCapture: () => {
          if (state.operation?.target?.startsWith('touch-'))
            state.touchHoverCount = (state.touchHoverCount ?? 0) + 1;
        },
        onFocusCapture: (event) => {
          refresh();
          const target = event.target?.getAttribute?.('data-overlay-id') ?? 'unobserved';
          state.focusMoves++;
          state.focusCounts[target] = (state.focusCounts[target] ?? 0) + 1;
        },
      },
      button('outside-control', 'Outside'),
      button(family === 'menu' ? 'before-menu' : 'before-trigger', 'Before'),
      h(
        'div',
        {
          ...markerProps('scroll-ancestor', 'ancestor'),
          style: {
            height: 600,
            width: 800,
            overflow: 'auto',
            position: 'absolute',
            left: 0,
            top: 0,
          },
        },
        h(
          'div',
          {
            style: {
              height: 1200,
              width: 1000,
              paddingTop: state.geometry.y,
              paddingInlineStart: state.geometry.x,
              boxSizing: 'border-box',
            },
          },
          group,
        ),
      ),
      button(family === 'menu' ? 'after-menu' : 'after-trigger', 'After'),
      button('successor-command', 'Successor'),
      h(
        'section',
        {
          ...markerProps('successor-region', 'region'),
          tabIndex: -1,
          'aria-label': 'Workspace region',
        },
        'Workspace region',
      ),
      h('span', { id: 'existing-help' }, 'Existing help'),
      family === 'tooltip'
        ? h(
            'details',
            { ...markerProps('help-disclosure', 'alternative') },
            h('summary', { ...markerProps('help-disclosure-trigger', 'trigger') }, 'Help'),
            h('p', null, state.text),
          )
        : null,
      h('div', {
        ...markerProps('portal-host-primary', 'portal-host'),
        'data-overlay-host': 'primary',
      }),
      h('div', {
        ...markerProps('portal-host-secondary', 'portal-host'),
        'data-overlay-host': 'secondary',
      }),
    );
  }
  Object.defineProperty(Fixture, 'name', {
    value: `${family[0].toUpperCase() + family.slice(1)}Fixture`,
  });
  return Fixture;
}
