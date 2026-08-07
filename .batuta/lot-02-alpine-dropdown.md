# Lot 02 — `lyraDropdown`

Sits on top of `.batuta/brief-alpine-wave1.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the Dropdown state machine from `packages/react/src/dropdown/dropdown.tsx`
(tests: `packages/react/src/dropdown/dropdown.browser.test.tsx`) to
`Alpine.data('lyraDropdown', ...)`, including the shared placement utility it
depends on (`packages/react/src/internal/use-flip-placement.ts` → port to
`packages/alpine/src/internal/flip-placement.ts` as a plain function module —
Popover will reuse it in a later lot).

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):
- State: `open` (seeded by an optional `defaultOpen` argument, default false).
  `open` is the controllable state for `x-modelable`.
- Named bindings (consumed via `x-bind`): `trigger` (the button), `menu` (the
  menu container), `item` (each menu item). The React component also renders
  a danger variant per item (`lyra-menu__item--danger`) — in Alpine that class
  stays in the consumer's markup; your bindings must not strip or fight it.
- Classes on the menu: `lyra-menu`, `lyra-menu--${align}` (align argument),
  `lyra-menu--up` when the placement flips (from the ported flip-placement
  logic, driven by the same window/visualViewport listeners the React hook
  uses).
- ARIA on the trigger: `aria-haspopup="menu"`, `aria-expanded` reflecting
  `open`, `aria-controls` pointing at the menu id (generate one when absent —
  match how the React component derives ids).
- Keyboard and focus: port the React component's roving focus and key
  handling for menu navigation exactly (arrows/Home/End/Escape/typed
  behavior as implemented there — mirror what its test suite proves).
- Outside click: `mousedown` on `document` closes when the click lands
  outside trigger+menu; listeners attach only while open and are removed on
  close/destroy.
</task>

<scope>
May change ONLY:
- `packages/alpine/src/dropdown.ts` (new)
- `packages/alpine/src/dropdown.browser.test.ts` (new)
- `packages/alpine/src/internal/flip-placement.ts` (new)
- `packages/alpine/src/internal/test-axe.ts` (new, ported)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
Do not change anything outside this list; if the task requires it, stop and
report.
</scope>

<acceptance_criteria>
1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/dropdown.browser.test.ts` mirrors the coverage of the React suite for
   ported behavior: open/close via trigger, class emission
   (`lyra-menu--up`/`--${align}` incl. a flip scenario), ARIA trio, keyboard
   navigation, outside-click close, listener cleanup after close, axe clean
   (open and closed), and the two-way `x-modelable`/`x-model` test.
4. `Alpine.plugin(lyra)` now registers `lyraDropdown`; the existing smoke
   suite still passes unmodified.
5. size-limit budget updated per the shared brief's rule.
</acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with their
REAL output (typecheck, prettier, size-limit); the measured size and new
budget; any behavior detail where you diverged from the React source and why;
uncertainties declared as such. No test-result claims for suites you cannot
run.
</compact_output_contract>
