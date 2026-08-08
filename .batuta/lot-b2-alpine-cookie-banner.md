# Lot B2 — `lyraCookieBanner`

Sits on top of `.batuta/brief-alpine-wave-b.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the CookieBanner state machine from
`packages/react/src/cookie-banner/cookie-banner.tsx`
(tests: `packages/react/src/cookie-banner/cookie-banner.browser.test.tsx`).

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- Options: `storageKey` (string, default `'lyra-cookie-consent'`).
- State: `visible` — controllable, `x-modelable`-ready. Starts false;
  `init()` reads `localStorage.getItem(storageKey)` inside try/catch:
  null → `visible = true`; a stored value → stays hidden; a storage READ
  error → `visible = true` (React parity: fail open).
- Presence: the banner animates out. Reuse `internal/presence.ts` exactly
  like `src/dialog.ts` does: `mounted` single-flag pattern for `x-show`
  (shared-brief lesson 4), `--closing` class while closing via `:class`
  OBJECT syntax (lesson 5 — the server may render the closing class
  never, but the base class must survive), `animationend` finalizes.
- `decide(choice)` with `'all' | 'essentials'`: writes
  `localStorage.setItem(storageKey, choice)` inside try/catch (a write
  error still applies the choice), sets `visible = false`, dispatches
  `lyra:accept` or `lyra:essentials` (bubbling custom events, empty
  detail is fine).
- Named bindings:
  - `root`: `x-show` reading `mounted` only; `:class` object for
    `lyra-cookies--closing`; `@animationend` presence finalize. The
    served markup already carries `lyra-cookies`, `role="region"` and
    `aria-label` — the binding does not manage them.
  - `accept`: `type: 'button'`, `@click` → `decide('all')`.
  - `essentials`: `type: 'button'`, `@click` → `decide('essentials')`.
- SSR-flash note (JSDoc on the factory, one short paragraph): the server
cannot know the visitor's stored choice, so consumers MUST put
`x-cloak` on the root — the banner reveals only after `init()` checks
storage. This is the Alpine translation of React's render-nothing
default.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/cookie-banner.ts` (new)
- `packages/alpine/src/cookie-banner.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-cookie-banner.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real
   output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/cookie-banner.browser.test.ts` covers (clear the storage key in
   a beforeEach/afterEach — tests share one localStorage): empty storage
   → banner visible after init; stored `'all'` or `'essentials'` →
   banner stays hidden; accept click persists `'all'`, dispatches
   `lyra:accept`, adds `--closing`, and the element hides after
   `animationend`; essentials click persists `'essentials'` and
   dispatches `lyra:essentials`; a custom `storageKey` is honoured;
   `x-modelable` + `x-model` works BOTH directions on `visible`; axe
   clean while visible.
4. `Alpine.plugin(lyra)` now registers `lyraCookieBanner`; all existing
   suites pass unmodified.
5. size-limit budget updated per the shared brief's rule.
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output (typecheck, prettier, size-limit); the measured size
and new budget; any behavior detail where you diverged from the React
source and why; uncertainties declared as such. No test-result claims
for suites you cannot run.
</compact_output_contract>
