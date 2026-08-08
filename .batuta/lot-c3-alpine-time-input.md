# Lot C3 — `lyraTimeInput`

Sits on top of `.batuta/brief-alpine-wave-c.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the TimeInput state machine from
`packages/react/src/time-input/time-input.tsx`
(tests: `packages/react/src/time-input/time-input.browser.test.tsx`).
Standalone — the future time-picker does NOT use it (PRD decision).

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- Options: `defaultValue` (string `HH:mm`, optional), `step` (minutes,
  default 15), `min`/`max` (inclusive `HH:mm` limits), `invalid`
  (boolean, consumer-driven error styling), `valueText`
  (`(hours, minutes) => string`, default the React English default) —
  used for `aria-valuetext`.
- State: `selected` (`string | null`, normalized `HH:mm`) —
  controllable, `x-modelable`-ready. Internal reactive `text` (the
  editable value) and `bad` (invalid typed text).
- Port the pure helpers EXACTLY: `minutesFromTime` (strict
  `H{1,2}:M{1,2}` in-range or null), `timeFromMinutes` (zero-padded),
  `parseTime` with the tolerant grammar — trim; FIRST `h`/`H` becomes
  `:` (single replace, not global); empty → null (intentional clear);
  with `:` exactly 2 fields required (`9:5:99` is invalid), missing
  minutes field defaults `'0'`; without `:`: ≤2 chars = hours only,
  else last 2 chars are minutes; out-of-range/non-finite → undefined
  (invalid, text preserved). Triple semantics are load-bearing: null =
  clear, undefined = keep text + `bad`, string = normalized value.
- `normalize(raw)`: parsed undefined → `bad = true`, nothing else;
  null → `bad = false`, `selected = null` (text stays as typed — empty);
  string → clamp into `[min ?? 0, max ?? 1439]` minutes, write both
  `text` and `selected` with the normalized clamped value, `bad = false`.
- `bump(delta)`: base = parse of current `text` when valid, else
  `selected`, else `clamp(currentHours * 60)` using the real clock's
  hour; next = clamp(base + delta); write `text`, `selected`,
  `bad = false`.
- Events on the `input` binding: `@input` mirrors the field into `text`;
  `@blur` normalizes; `@keydown`: ArrowUp/ArrowDown preventDefault and
  bump ±`step` (Shift → ±60), Enter normalizes (no preventDefault).
- External `selected` writes (x-model) reset `text = selected ?? ''`
  and `bad = false` (`$watch` — React's prop-transition reset). Internal
  writes already set text explicitly; the watch staying idempotent is
  fine.
- Interaction-driven selection changes (normalize/bump) dispatch a
  bubbling `lyra:change` with `detail: { value }` (`string | null`);
  external writes must NOT dispatch.
- Named bindings:
  - `input`: `:value` = `text`; static `role="spinbutton"`,
    `inputMode="numeric"`, `autocomplete="off"`; `:aria-invalid` true
    when `bad || invalid` (and `:class` OBJECT syntax adds
    `lyra-input--error` for the same predicate — base `lyra-input` and
    size classes are served); `:aria-valuemin`/`:aria-valuemax` from
    min/max (defaults 0/1439); `:aria-valuenow` = selected minutes or
    false when null (attribute removed); `:aria-valuetext` from the
    `valueText` option applied to the selected time, removed when null;
    the three event handlers above.
  - `up` / `down`: `type: 'button'`, `tabindex: '-1'`, `@click` bump
    +step / −step.
  - Label/hint/error text and their ids are consumer-served — no
  bindings; document in the factory JSDoc.
  </task>

<scope>
May change ONLY:
- `packages/alpine/src/time-input.ts` (new)
- `packages/alpine/src/time-input.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-time-input.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (or the direct
   `tsc` fallback; paste real output).
2. `pnpm exec prettier --check packages/alpine` passes (or direct
   fallback).
3. `src/time-input.browser.test.ts` mirrors the React suite's parsing
   and stepping coverage: "9" → 09:00, "0930" → 09:30, "9:5" → 09:05,
   "9h30" → 09:30 on blur/Enter; "9:5:99" and garbage keep the text,
   set `aria-invalid` and `lyra-input--error`; clearing to empty yields
   `selected = null` and dispatches `lyra:change` with null; min/max
   clamp on normalize AND bump; ArrowUp/Down move by step, Shift by 60;
   steppers click-bump and carry `tabindex="-1"`; `aria-valuenow`/
   `aria-valuetext` track the selection and drop when null; external
   x-model write resets text and does NOT dispatch (listener records);
   `x-modelable` + `x-model` works BOTH directions; axe clean (fixture
   includes a served label wired via `for`).
4. `Alpine.plugin(lyra)` now registers `lyraTimeInput`; all existing
   suites pass unmodified.
5. size-limit budget updated per the shared brief's rule (or explicitly
   left for the maestro if pnpm is broken).
   </acceptance_criteria>

<compact_output_contract>
Report back, in order: files touched (paths only); commands run with
their REAL output; the measured size and new budget (or "left to
maestro"); any behavior detail where you diverged from the React source
and why; uncertainties declared as such. No test-result claims for
suites you cannot run.
</compact_output_contract>
