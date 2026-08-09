# Lot G2 — `lyraToasts` (store) + `lyraToastStack` (binding)

Sits on top of `/home/franciscpd/Projects/lyra-ds/lyra/.batuta/brief-alpine-wave-b.md`
(shared brief: context, conventions, wave-1 lessons, test laws, environment
limits, stop conditions). Read BOTH in full before writing anything.

Correction to the shared brief's `<context>`, written earlier in the wave:
`packages/alpine` is now **0.2.0** with **29 bindings** plus one store
(`theme`). Everything else in it still holds.

Work from the repo root of the worktree you were started in; **do not commit**.

<task>
Port React's ToastProvider to Alpine as TWO pieces that ship together, in ONE
new file `packages/alpine/src/toasts.ts`.

Sources of truth, read all three before writing:

- `packages/react/src/toast-provider/toast-provider.tsx` — the queue, the
  imperative API, the timers, and the inlined ToneIcon.
- `packages/react/src/toast/toast.tsx` — the exact markup and classes the
  stack must reproduce (`.lyra-toast-stack`; `.lyra-toast` with
  `role="status"`; `.lyra-toast__icon lyra-toast__icon--<tone>`; the message
  in a bare `<span>`; `.lyra-toast__close` button with `aria-label` and the
  `×` character as its content).
- `packages/alpine/src/theme.ts` — the ONLY existing store; copy its shape,
  its `init()` convention and its JSDoc voice.

## Piece 1 — `lyraToasts`, an `Alpine.store`

Registered in `src/index.ts` as `alpine.store('lyraToasts', lyraToasts())`,
next to the existing `theme` store. The name is a closed decision: `lyraToasts`,
not `toasts`.

State and configuration (the store replaces React's provider props, which have
no Alpine equivalent — a store takes no arguments):

- `items: QueuedToast[]` — the queue. `QueuedToast` is `{ id, message, tone }`.
- `duration: number` — plain WRITABLE property, default `4000`.
- `closeLabel: string` — plain WRITABLE property, default `'Close notification'`.

API, at parity with React's `ToastApi`:

- `toast(message, options?) => number` — tone defaults to `'info'`.
- `success` / `error` (tone `'danger'`) / `info` — sugar that FORCES the tone,
  exactly as the React `api` memo does.
- `dismiss(id)` — clears that id's timer (clearTimeout + delete from the map)
  and removes the item from `items`.
- `options` is `{ tone?: 'info' | 'success' | 'danger'; duration?: number }`.
  The effective timeout is `options.duration ?? this.duration`; a timer is
  created ONLY when it is `> 0`, so `0` disables auto-dismiss for that toast.
- Ids come from a module/closure-local incrementing counter (`++nextId`) and are
  ALWAYS returned.

CLOSED DECISION — timer ownership. The timers map lives in the STORE, not in
the stack binding. The PRD floated clearing the map from the stack's
`destroy()`; do NOT do that — a stack that unmounts and remounts (routine under
Livewire) would leave queued items stranded with no timer to remove them.
Consequences to implement and to document in the JSDoc:

- React's `unmounted` ref has NO analogue: a store is a singleton that never
  unmounts, so a late `toast()` from a promise continuation simply enqueues.
- Pushing while no stack is mounted is legal: the item enqueues and its timer
  removes it on schedule. Nothing leaks and nothing is stranded.
- `dismiss()` on an unknown id is a no-op.

Global event, per the PRD: the store's `init()` registers a `window` listener
for `lyra:toast` whose `detail` is `{ message, tone?, duration? }` and forwards
it to `toast(...)`. This is the Livewire path
(`$this->dispatch('lyra:toast', ...)`). The listener is never removed —
singleton store; say so in the JSDoc rather than leaving it unexplained.

## Piece 2 — `lyraToastStack`, an `Alpine.data`

A thin renderer over the store, for the container the consumer serves. It adds
no state of its own. Required surface:

- `toasts` — a getter proxying `$store.lyraToasts.items`, so the served
  `<template x-for="toast in toasts">` reads naturally.
- `closeLabel` — a getter proxying the store, for the close button binding.
- a binding for the close button: `type: 'button'`, `:aria-label` from
  `closeLabel`, `@click` calling `dismiss` for the row's toast.
- whatever the tone icon and tone class need, chosen by you, so the served
  markup can pick the right icon per tone and set
  `lyra-toast__icon--<tone>`.

The tone icons are the inlined Lucide paths from the React `ToneIcon` —
17×17, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
`stroke-width="2"`, round caps/joins, `aria-hidden="true"`, a shared
`<circle cx="12" cy="12" r="10" />` plus, per tone: success
`<path d="m9 12 2 2 4-4" />`; danger the two `<line>` elements; info the two
`<path>` elements. Copy them EXACTLY from the React source. They are inlined
for the same reason stated there: importing `Icon` would pull the 79-icon
registry into every consumer. Serve all three and select with `x-show`, the
same shape `app-sidebar.ts` documents for its chevrons and `data-table.ts` for
its sort icons.

`message` renders through `x-text`, never `x-html`: the queue is fed by events
and a Livewire payload, so HTML there is an XSS hole. State this as a declared
adaptation in the JSDoc (React accepts a ReactNode; rich content stays possible
through a statically served toast).

The JSDoc of the stack carries the canonical served markup as a usage example,
the way every other binding in this package does.
</task>

<scope>
May change ONLY:

- `packages/alpine/src/toasts.ts` (new — BOTH pieces live here)
- `packages/alpine/src/toasts.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (store registration, data registration,
  exported types)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-toasts.md` (new — one-paragraph minor changeset in
  the exact style of the existing `.changeset/alpine-lyra-*.md` files)

Do not change anything outside this list; if the task requires it, stop and
report.
</scope>

<fixture_laws>
Traps that cost real rounds in this package. Ignore them and the suite fails
in ways typecheck cannot see.

1. `vi.useFakeTimers()` with no restricted `toFake` freezes the timers that
   the test's own flush helper needs and DEADLOCKS the suite. For this lot use
   `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })`, and
   restore with `vi.useRealTimers()` in `afterEach`.
2. `<template x-for>` mounts exactly ONE root element, like `x-if`; sibling
   branches need a single wrapper.
3. Assertions after a synthetic `dispatchEvent` need a microtask flush plus
   `Alpine.nextTick`; a reveal deferred to requestAnimationFrame needs
   `vi.waitFor`.
4. Existence assertions must read real DOM state — elements, attributes,
   classList — never locator truthiness.
5. A store is a SINGLETON across the whole test file. Reset its queue,
   `duration` and `closeLabel` between tests, or an earlier test's leftovers
   will silently satisfy a later one.
   </fixture_laws>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (paste real output).
3. `Alpine.plugin(lyra)` registers the `lyraToasts` store AND the
   `lyraToastStack` data; the public option/queue types are exported from
   `src/index.ts` following the neighbouring pattern.
4. `src/toasts.browser.test.ts` covers, each as its own `it()`:
   - auto-dismiss at the store's default `duration`, and at a per-toast
     `duration` override;
   - `duration: 0` schedules NO timer and the toast survives well past the
     default;
   - `dismiss(id)` before the timer both removes the item and clears the timer
     (advancing time afterwards must not throw or double-remove);
   - `success` / `error` / `info` force their tone; `toast` defaults to `info`;
   - ids are incremental and always returned;
   - a `lyra:toast` window event enqueues with its `tone` and `duration`;
   - the rendered row carries `role="status"`, the right
     `lyra-toast__icon--<tone>` class and the right tone icon visible;
   - the close button exposes `closeLabel` as its accessible name and removes
     its own row when clicked;
   - pushing with NO stack mounted enqueues and still auto-dismisses;
   - axe clean with a populated stack.
5. size-limit budget updated per the shared brief's rule (≤0.25 kB headroom
   over the measured size; paste the measurement).
6. No existing file's behavior changes.
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with their REAL
output (typecheck, prettier, size-limit); the measured size and the new budget;
any behavior detail where you diverged from the React source and why;
uncertainties declared as such. No test-result claims for suites you cannot run
(Browser Mode does not work in your sandbox — the maestro runs it).
</compact_output_contract>
