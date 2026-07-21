# `@lyra-ds/react` conventions — the Phase 4 conversion recipe

This is the actionable checklist for turning a handoff component contract
(`handoff/**/*.d.ts`) into a shipped `@lyra-ds/react` wrapper. The four Phase 3
pilots — **Button**, **Input**, **Dialog**, **Icon** — already encode every rule
below; their real tests **are** the template (D-25). When you convert component
number five, you copy the pilot whose shape matches yours and follow this
checklist. There is no dead template file to keep in sync.

`@lyra-ds/react` is a **thin wrapper over `@lyra-ds/styles`**. All appearance
comes from `.lyra-*` classes; the React layer only emits class strings, wires
behavior, and forwards DOM. Never make a visual decision here.

---

## Conversion checklist (D-24)

Work top to bottom. Each step cites the locked decision it enforces.

1. **Read the handoff `.d.ts` first.** The exported `interface` and the
   `export declare function` signature are the contract. Note which native
   element the props interface `extends` (`ButtonHTMLAttributes<HTMLButtonElement>`,
   `InputHTMLAttributes<HTMLInputElement>`, `HTMLAttributes<HTMLDivElement>`, …) —
   that element is your rest-spread + ref target.

2. **`forwardRef` on the primary DOM element (D-08).** Every component that
   renders a DOM node forwards its ref to that node (Button → `<button>`, Input →
   `<input>`, Dialog → the panel `<div role="dialog">`). `forwardRef` is the only
   ref pattern safe across the whole `react >=18 <20` peer range — do **not** rely
   on React 19 ref-as-prop.

3. **Omit conflicting native attributes BEFORE redefining them.** If the Lyra
   contract redefines a key the native element already declares, `Omit` it from
   the extended interface first, or TypeScript reports an incompatible-override
   error. Pilot lessons:
   - `InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>` —
     Lyra `size` is a visual token (`'sm' | 'md' | 'lg'`), not the native numeric
     `size` attribute.
   - `DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>` — Lyra
     `title` is `ReactNode` (a rendered heading), not the native string tooltip.
     This step is a Phase 4 rule, not an afterthought.

4. **`cx` + merge consumer `className`/`style` LAST (D-09).** Build the class
   string with the internal `cx()` helper (`internal/cx.ts` — `filter(Boolean)
.join(' ')`, zero deps per D-11). The `.lyra-*` classes are **public API** and
   are always present; the consumer's `className` is appended **after** them and
   `style` is shallow-merged **over** any component inline style. Consumer values
   win — they can extend, never replace, the Lyra classes.

5. **Extract known props, rest-spread `...rest` onto the root (D-10).**
   Destructure the props you handle explicitly, then `{...rest}` onto the element
   the interface extends, so `aria-*`, `data-*`, and event handlers pass through
   predictably. Spread `...rest` **before** the attributes you must control
   (`className`, `ref`, wired handlers) so those cannot be clobbered.

6. **Controlled/uncontrolled state — pick the right wiring (D-14).**
   - When the contract is **value-shaped** (`value` / `defaultValue` + a
     value-callback), compose `useControllableState` from `internal/`; it is
     controlled iff `value !== undefined` and warns on a controlled↔uncontrolled
     switch in dev.
   - When the public `onChange` is a **native DOM event handler**
     (`ChangeEventHandler<HTMLInputElement>` — the Input pilot), do **not** pass it
     as the hook's value callback. Compose instead: the internal handler updates
     `useControllableState` with the new value AND forwards the original event to
     the consumer's `onChange(event)`. Passing a DOM event where a value is
     expected is the D-14 wiring bug the Input pilot exists to prevent.

7. **IDs via the `id` prop else `useId()` — never content-derived.** Use the
   consumer's `id` when provided, otherwise a stable `useId()` value. Never derive
   ids from label text / children (no slugified content ids): they collide across
   instances and break SSR hydration. Dialog wires `aria-labelledby` to a
   `useId()` title id; Input wires its label/message the same way.

8. **Overlays: compose the `internal/` primitives, effects INSIDE the portal
   subtree (D-15..D-22).** For modal/overlay components render through `Portal`
   (SSR-guarded, optional `container`, default `document.body`), and place every
   DOM-dependent effect — `useFocusTrap(panelRef)`, `usePresence`,
   `useScrollLock` — on the panel ref **inside** the portal child, never on a
   React-tree ancestor. The focus trap must query focusables on the portal node or
   it silently leaks focus to the page behind (Pitfall 8). Keep the panel mounted
   while closing via `usePresence` (with its `setTimeout` fallback so a
   reduced-motion / `display:none` environment can't wedge it) and restore focus
   to the opener on **every** close path (Esc, overlay click, × button).

9. **Translate JSDoc to canonical English.** The handoff docblocks may be
   terse or mixed-language; rewrite each public prop's JSDoc in clear EN. This is
   the text consumers see in their editor and what `llms.txt` is generated from.

10. **Write the test matrix (copy the matching pilot — D-25/D-26).**
    - **Smoke** (`*.browser.test.tsx`, Browser Mode / chromium): render every
      variant in light **and** `[data-theme="dark"]`, assert the exact `.lyra-*`
      class string, assert no console errors.
    - **Keyboard** where interactive: Dialog focus-trap wrap, Esc/overlay/×
      close, focus restore — real keyboard events (Browser Mode only; jsdom
      renders zero CSS and no focus semantics).
    - **axe** in both themes: `await axe.run(container)` (call `axe-core`
      directly — `vitest-axe` is stale). For portaled components run axe against
      `document.body` so the portal subtree is in scope.
    - **SSR** (`*.ssr.test.ts`, `environment: node`): `renderToString(<Pilot/>)`
      must not throw — proves no module-scope `document`/`window` access. An open
      Dialog renders `null` on the server (the portal mount guard); assert exactly
      that.

11. **Run the gates locally before opening the PR.**
    ```bash
    pnpm --filter @lyra-ds/react run typecheck   # tsc --noEmit
    pnpm --filter @lyra-ds/react run lint         # eslint: jsx-a11y + hooks + CSS-import ban
    pnpm --filter @lyra-ds/react run build        # tsup dual ESM+CJS + dts
    pnpm exec publint packages/react              # exports-map lint
    pnpm --filter @lyra-ds/react exec attw --pack . --profile node16   # type-resolution
    pnpm --filter @lyra-ds/react exec size-limit  # per-import bundle budgets
    ```
    Add a `size-limit` entry for any new subpath whose bundle cost you want gated
    (icon-bearing components especially). And **add a changeset**
    (`pnpm changeset`, `minor` on the `0.x` line) — CONTRIBUTING requires one for
    any change to a published package.

---

## Locked decisions (rationale one-liners)

These are settled; do not re-litigate them in a conversion PR (see CONTRIBUTING).

| ID   | Decision                                                                                                        | Why                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| D-08 | `forwardRef` on every DOM-rendering component                                                                   | Only ref pattern safe across `react >=18 <20`                                 |
| D-09 | Always merge consumer `className`/`style`, Lyra classes first, consumer last                                    | `.lyra-*` classes are public API; consumers extend, never replace             |
| D-10 | Rest-spread known-props-extracted `...rest` onto the extended root element                                      | Predictable `aria-*`/`data-*`/handler pass-through                            |
| D-11 | Zero runtime deps beyond `lucide-react`; internal `cx()` not `clsx`                                             | Every dependency is a shared cost; keep the wrapper thin                      |
| D-12 | Named exports only — no default exports anywhere                                                                | Matches the handoff `export declare function` contracts; clearer tree-shaking |
| D-13 | Import surface = root barrel + per-component subpaths                                                           | Subpaths guarantee isolation even under naive bundlers (RCT-03)               |
| D-14 | Controlled iff `value !== undefined` via `useControllableState`; compose (never replace) a native `onChange`    | Locks the RCT-09 controllable pattern; the Input pilot is the reference       |
| D-15 | Dialog = `div` + `role="dialog"` + `aria-modal`, own focus trap                                                 | Native `<dialog>` fights the handoff overlay CSS and has inconsistent focus   |
| D-16 | Close paths Esc / overlay-click / × each behind opt-out flags (default `true`)                                  | Deliberate extension of the minimal handoff contract                          |
| D-17 | Keep mounted while closing via `usePresence`                                                                    | Exit animation without unmount races; Drawer/Toast reuse it in Phase 4        |
| D-18 | Exit-animation CSS is an additive extension in `@lyra-ds/styles`                                                | Appearance stays in the CSS package; parity allowlist enumerates it           |
| D-19 | Close button gets its own `.lyra-dialog__close` class                                                           | No borrowed Tag class, no inline styles (28px hit area, 14px icon)            |
| D-20 | Initial focus = first focusable, fallback to the panel (`tabIndex={-1}`); title via `aria-labelledby` + `useId` | APG modal-dialog pattern                                                      |
| D-21 | Portal target = optional `container?: HTMLElement`, default `document.body`, SSR-guarded                        | Flexibility for shadow DOM / iframes                                          |
| D-22 | `useScrollLock` with scrollbar-width compensation while open                                                    | No layout shift when the body scroll locks                                    |

---

## Component type → pilot test map (D-25)

Copy the pilot suite whose shape matches your component. The pilots' tests are the
template — there is no separate template file.

| Your component is…                                                     | Copy the tests from | It demonstrates                                                                                                                                    |
| ---------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Simple / presentational** (Badge, Tag, Avatar, Card…)                | `src/button/`       | forwardRef, `cx` + className merge, `...rest` pass-through, exact-class smoke matrix, SSR renderToString, axe both themes                          |
| **Form / controlled** (Textarea, Select, Checkbox, Switch…)            | `src/input/`        | `useControllableState`, native-`onChange` composition (D-14), `useId` id wiring, the `Omit<'size'>` lesson                                         |
| **Overlay / focus / portal** (Drawer, Popover, CommandPalette, Toast…) | `src/dialog/`       | `Portal` + `useFocusTrap` + `usePresence` + `useScrollLock`, close-path + focus-restore keyboard tests, portal-scoped axe, SSR `null` assertion    |
| **Registry / icon-bearing** (anything rendering an `Icon`)             | `src/icon/`         | curated-registry resolution, `icon`-prop escape hatch, dev `console.warn` + `null` on unknown name, size-limit budget with `lucide-react` measured |

---

## Documented deviations & extensions

These are places where the shipped wrapper deliberately differs from, or extends,
the handoff prototype. They are conventions, not accidents — preserve them.

- **`.lyra-icon` class is always emitted (extension over the prototype).** `Icon`
  always renders the `.lyra-icon` class as a stable consumer/test hook. **No CSS
  rule ships for `.lyra-icon`** in `@lyra-ds/styles` — it is a class hook only
  (size/color come from props and `currentColor`, D-06). The prototype's
  `<span>` + CSS-mask approach was a CDN workaround and is dropped.
- **`useId()` id generation replaces label-derived slugs.** Where the prototype
  derived element ids from label text, the wrappers use the `id` prop else
  `useId()`. Content-derived ids collide across instances and break SSR hydration.
- **Native-`onChange` composition wiring (D-14).** The Input pilot forwards the
  original DOM event to the consumer's `onChange` while updating
  `useControllableState` internally — it never passes the event handler as the
  hook's value callback. Follow this for every native-event-shaped contract.

- **Handoff inline layout styles → a `.lyra-*` class (CSS-first promotion).** Some
  handoff prototypes carry appearance/layout decisions as inline `style={{…}}`
  (e.g. Card's actions wrapper `display:flex; gap`). CSS-first forbids appearance
  in the React layer, so the conversion **promotes** that inline style to a real
  `.lyra-*` class in `@lyra-ds/styles` and emits the class instead — exactly as
  D-19 did for the Dialog close button. Add the class to its component CSS file
  and enumerate it in `tools/parity/parity.mjs` `ADDITIVE_EXTENSIONS` (keyed by
  file) so parity accepts a package class with no handoff peer. The Card
  `.lyra-card__actions` class is the reference. **Apply this when converting
  Toast (`display:inline-flex` icon) and Dropdown (`display:inline-flex` trigger)
  in later batches — do not port their inline styles.** The ONLY inline `style`
  that stays is a genuinely dynamic runtime value (Progress/FileUpload bar
  `width: ${n}%`, Skeleton prop-driven size), never a static layout decision.

---

## Accessibility & security rules

- **Icon-only Button requires an `aria-label` (consumer-enforced).** An
  icon-only Button (`className="lyra-btn--icon"` with no `children`) has no
  accessible name unless the consumer supplies `aria-label` / `aria-labelledby`
  (or the Icon gets a `title`). The component makes **no API guarantee** and does
  not throw — this is flagged by the UI-SPEC checker, enforced by the consumer.
  Document it in the component's JSDoc.
- **Never render consumer strings as raw HTML.** Do not use
  `dangerouslySetInnerHTML` (or any HTML-injection path) with consumer-provided
  strings. Render text as text / `ReactNode` children only. This is a standing
  security convention (threat T-03-08 breadcrumb): a wrapper that injected raw
  HTML would turn a `title`/label prop into an XSS sink.

---

## Pre-publish note (before v0.1.0)

- **Run a React 18 test leg.** Everything develops and tests against React 19.2,
  but the published peer range is `react >=18 <20`. The pilots use only 18-safe
  APIs (`forwardRef`, `useId`, `createPortal`), so a React 18 CI matrix leg is
  deferred (RESEARCH Open Question 3) — but it **must** run once before the first
  `0.1.0` publish (Phase 7) as insurance against a 19-only API slipping in during
  the Phase 4 batch conversion.
