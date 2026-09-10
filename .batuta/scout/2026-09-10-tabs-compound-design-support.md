# Tabs compound design support

GLM5.3Flash99.24s,exit0,unchanged main guard; frozen source/normative excerpts supplied inline. Advisory only; no final API selected.

<<<REPORT

## Answer

**1. Smallest compound React form**

One export, `Tabs`, gains static parts; no `Root` alias, no second component family:

```tsx
<Tabs active="details" onChange={setActive}>
  <Tabs.List>
    <Tabs.Trigger value="details" count={2}>Details</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="details"><Details /></Tabs.Content>
</Tabs>
```

- Root = existing `Tabs` becomes context provider rendering `children` (replaces the auto-panel `Fragment`, tabs.tsx:95-104). Context: `{ tabsId, variant, active, onChange }`. Deleted: `items`, `TabItem`.
- `Tabs.List` = current tablist `div` verbatim (role, `lyra-tabs`/`lyra-tabs--pills`, variant).
- `Tabs.Trigger` = current button; `label`→children, `count`/`icon`→props or children (controller decides).
- `Tabs.Content` = current panel `div`, `children` inside, `hidden` from value match.
- Parts exported as `Tabs.List` etc. — single import path, existing `import { Tabs }` unchanged in all 3 consumers.

**Controlled-only vs hook — no concrete normative requirement for uncontrolled found.** The API template (04:762 §6) only requires the family spec to *address* controlled/uncontrolled behavior; declaring uncontrolled an explicit non-goal satisfies it. Controlled-only is smallest and all three frozen consumers are controlled. Advisory counter-signals only: the migration example uses `defaultValue` (04:644), RCT-09 names Tabs in the locked hook list (use-controllable-state.ts:22-24), and the Alpine option is a required internally-owned initial value. If the controller adopts uncontrolled, it MUST go through `useControllableState` — that hook is the locked pattern; never two parallel mechanisms. One ownership model per component.

**2. Context + DOM-ref collection — exact pitfalls**

Baseline claim: no DOM registration exists at SSR; render derives everything from props.

- **Stable value-based IDs**: ids become pure functions `${tabsId}-tab-${value}` / `-panel-${value}` — derivable server-side, stable across reorder (replaces index-based tabs.tsx:46-47). Pitfall: value doubles as id fragment — whitespace/empty values break ids. Minimal policy: document "value must be an id-safe string"; dev-only warning, no runtime coercion.
- **Initial SSR value**: controlled `active` known from props; uncontrolled `defaultValue` equally deterministic. No registration needed; hydration mismatch risk is the consumer's state, not Tabs.
- **Invalid active value**: current clamp `Math.max(0, findIndex(...))` (tabs.tsx:41-44) silently activates first tab *and* first panel. Compound value-match changes panel side: unknown value → no panel visible (hidden = value match). Behavior divergence from current first-panel-visible. **Product decision required**: clamp-to-first vs none-active vs dev warning.
- **Removal/reorder**: avoid registration arrays entirely. Minimal valid fallback policy, no child introspection, no collection framework: active value travels via context; each Trigger/Content computes its own id/selected/hidden from `value` + context; keyboard nav resolves the target with `document.getElementById(pureId)` at event time (current pattern, tabs.tsx:60) — null → no-op, reorder- and removal-safe. Pitfall: duplicate `value` across Triggers → duplicate ids; dev-only warn, last-wins.
- **Nested roots**: `useId` per root gives distinct prefixes; inner Tabs shadows context; `getElementById` safe via prefix distinctness. No decision needed unless consumer passes colliding explicit `id`.
- **Keyboard consumer-first cancellation**: `Trigger` must compose consumer `onKeyDown` first, then run internal nav only if `!event.defaultPrevented` — current guard (tabs.tsx:50) preserved, but composition order is new surface (data-driven button had no consumer handler). **Click activation is not cancelable** today; the spec must state callback-cancelation status (04:786) — keeping "not cancelable" is valid.

Remain current unchanged: roving focus, automatic activation, wrap/Home/End, `defaultPrevented` guard, all-hostile-clamp behavior. Decisions needed: invalid-active policy, id-safe value contract, `count`/`icon` placement.

**3. Alpine adaptation**

New surfaces required by normative example:
- Option `defaultValue` (04:666) replacing required `active` initial (alpine tabs.ts:2-5) — breaking option change; whether `active` stays as alias is a deprecation decision.
- `ready` state: initialized `false`; `true` only after triggers, panels, active value, and bindings registered (04:742-744). Atomic commit is achieved structurally: every visual/ARIA binding gates on `ready`, so no partial attribute commit can occur. Failed or absent init → `ready` never true → fallback intact.
- Fallback markers: `data-lyra-tabs`, `data-lyra-tabs-fallback`, `data-lyra-tabs-enhanced` (04:666-679). Pre-enhancement: native links + both headed sections available; tablist statically `hidden`; panels carry no tab role, state, or hidden value (04:739-741).
- `data-state="active"|"inactive"` output binding (04:693) — new public data attribute.
- **Cancelable custom events: current adapter dispatches zero custom events** (frozen source has none) — must be explicit. Template requires the spec to list cancelable before-events/result events/detail payloads or mark them intentionally unsupported with evidence (04:792-796). If added: cancelable `before-activate` + result `activate`, `detail: { value }`, dispatched in `activateTab` before mutation. React `onChange` has no cancellation — parity decision for controller: add to both adapters or mark unsupported for V1.

Reusable unchanged: `list`/`tab`/`panel` binding objects, keyboard nav, click activation, id preference for supplied ids (alpine tabs.ts:96,100 — preserved supplied IDs), query-at-event-time DOM reads (already dynamic; no MutationObserver needed; unbounded observers forbidden absent a proven contract).

Pitfalls: (a) ordering of consumer `@keydown` vs `x-bind` object `@keydown` on one element is not guaranteed — consumer-first cancellation needs verification or documented non-support; (b) static server `aria-selected="true"` on first button (04:689) must be corrected at the ready commit — check for flash; (c) panel role removal pre-ready relies on `x-bind:role` null removing the attribute (04:716).

**4. Closed file scopes**

React runtime + 3 consumers: `packages/react/src/tabs/tabs.tsx` (compound rewrite, types 5-27 replaced), `packages/react/src/tabs/index.ts` (part types added; path inferred, not in frozen set), `tabs.browser.test.tsx` (items API + keyboard harness migration; class/axe/contrast assertions retained), `tabs.ssr.test.ts` (fixture must render `Content`), `apps/docs/components/examples/tabs/line.tsx`, `.../pills-and-counts.tsx`, `apps/site/components/sections/component-showcase.tsx`.

Alpine/doc migration: `packages/alpine/src/tabs.ts` (ready, defaultValue, markers, data-state, event decision), Alpine tests (paths not supplied), styles package additive classes for fallback/`lyra-tabs__list`/`lyra-tabs__content` (file not supplied; existing retained classes untouched), docs before/after migration pages referencing `lyraTabs` (not supplied).

Type/docgen effects: `TabsProps` (items/active/onChange/variant) and `TabItem` replaced; new part prop types exported; `Omit<..., 'onChange'>` conflict re-evaluated; docgen props table for Tabs changes; `useControllableState` untouched either way. Tests needing intentional migration: both tabs test files; the three consumer examples are JSX swaps with `Project summary` moving inside `Tabs.Content`.

## Files

- packages/react/src/tabs/tabs.tsx:41-47,50,60,95-104
- packages/react/src/internal/use-controllable-state.ts:22-24
- packages/alpine/src/tabs.ts:2-5,46-51,96-100,121-123
- packages/react/src/tabs/tabs.browser.test.tsx:59-123
- packages/react/src/tabs/tabs.ssr.test.ts:5-13
- apps/docs/components/examples/tabs/line.tsx:12-21
- apps/docs/components/examples/tabs/pills-and-counts.tsx:12-16
- apps/site/components/sections/component-showcase.tsx:42-51
- docs/superpowers/specs/lyra-v1/04-component-architecture.md:614-616,629-650,665-679,739-750,784-796

## Evidence

- tabs.tsx:43 `Math.max(0, items.findIndex((item) => item.id === active))` — invalid-active clamp.
- tabs.tsx:60 `document.getElementById(tabId(nextIndex))?.focus();` — event-time lookup, no registration.
- tabs.tsx:50 `if (event.defaultPrevented || items.length === 0) return;` — consumer-first guard.
- use-controllable-state.ts:22-24 "the RCT-09 pattern locked for every Phase 4 component whose public API is value-shaped (Tabs, Accordion, Switch, …)".
- 04:644 `<Tabs.Root defaultValue="details">` — illustrative naming per 04:747-748.
- 04:742-747 "initialize `ready` as `false` … atomically hide the fallback navigation … Failed or absent initialization MUST leave `ready` false".
- 04:792-794 template: spec MUST list "cancelable before events, result events, `detail` payloads" or mark unsupported.
- alpine tabs.ts:3-4 `active: string;` "This controllable state is required."

## Uncertain

- Whether `defaultValue` in the normative example mandates uncontrolled React support or is illustrative only — controller call; controlled-only is compliant if §6 documents it.
- `packages/react/src/tabs/index.ts` path and styles-package CSS file paths not in frozen set.
- Alpine test file paths not supplied.
- `x-bind:attr` null removing the attribute (04:716-731 depends on it) — verify against the repo's Alpine version.
- Whether `active` option name survives as deprecated alias in Alpine.
- Docs example registry/MDX wiring beyond the three frozen consumer files.

REPORT>>>

Controller corrections: pure value IDs must encode arbitrary nonempty stable strings rather than invent an id-safe-only restriction. Event-time keyboard traversal still needs the owning list order; getElementById alone cannot derive a next value without items. Consumer native onClick prevention must follow the existing composition contract. The normative migration names, including defaultValue and new example CSS classes, are illustrative; neither a new option spelling nor new classes is required. Preserve current classes and choose final signatures explicitly. Docgen current ownerCategory fallback supports named exported Tabs parts in the same file; every exported XProps still requires an exported X owner, so static parts alone with named exported Props would need an explicit generation design. Current active-only React support is compatible with keeping that model; no uncontrolled requirement was established. No proposal in this report is implementation authorization.
