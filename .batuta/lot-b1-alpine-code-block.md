# Lot B1 — `lyraCodeBlock`

Sits on top of `.batuta/brief-alpine-wave-b.md`. Read both in full before
writing anything. Work from the repo root; do not commit.

<task>
Port the CodeBlock copy-feedback state machine from
`packages/react/src/code-block/code-block.tsx`
(tests: `packages/react/src/code-block/code-block.browser.test.tsx`).

Behavior contract (verified against the React source — read it anyway; the
source wins on any detail this list compresses):

- State: `copied`, starting false. NOT controllable — no `x-modelable`
  (React parity: copy feedback is internal; record this as the parity
  decision).
- The static structure (`.lyra-code`, `__bar`, `__lang`, `__pre`,
  `--line-numbers`, `--wrap` modifiers, `tabIndex` on a scrolling pre) is
  SERVED markup — the binding does not manage it. The component only owns
  the copy interaction.
- Copy source: `data-copy-text` attribute on the ROOT element when present,
  otherwise the `textContent` of the root's `<pre>` (query
  `.lyra-code__pre` from the captured root, fallback to any `pre`).
- Copy flow, ported exactly: if `navigator.clipboard` is unavailable,
  return silently; `await navigator.clipboard.writeText(text)`; on success
  set `copied = true`, clear any previous timer, and arm a 1500 ms timeout
  that resets `copied = false`; on rejection set `copied = false`. Keep
  1500 as a named constant.
- `destroy()` clears the pending timer.
- Named bindings:
  - `copyButton`: `type: 'button'`, `@click` runs the copy flow. The
    label swap (copy ↔ copied) is the consumer's markup, driven by the
    reactive `copied` property (document this in the JSDoc).
  - `status`: the polite live region — `role="status"`,
  `aria-live="polite"`, `aria-atomic="true"` (static values may be
  plain binding properties). Its text content is the consumer's markup
  driven by `copied`.
  </task>

<scope>
May change ONLY:
- `packages/alpine/src/code-block.ts` (new)
- `packages/alpine/src/code-block.browser.test.ts` (new)
- `packages/alpine/src/index.ts` (registration + type surface if needed)
- `packages/alpine/package.json` (size-limit budget line only)
- `.changeset/alpine-lyra-code-block.md` (new — one-paragraph minor
  changeset for `@lyra-ds/alpine`, mirroring the existing alpine
  changesets' style)
Do not change anything outside this list; if the task requires it, stop
and report.
</scope>

<acceptance_criteria>

1. `pnpm --filter @lyra-ds/alpine run typecheck` passes (paste real
   output).
2. `pnpm exec prettier --check packages/alpine` passes.
3. `src/code-block.browser.test.ts` covers: clicking the copy button
   writes the pre's textContent to the clipboard (stub
   `navigator.clipboard.writeText` with a recording spy via
   `vi.spyOn`/property replacement — the REAL clipboard API is
   permission-gated in the runner; restore it after each test);
   `data-copy-text` wins over textContent; `copied` flips true and back
   to false after the 1500 ms window (use `vi.waitFor` with a widened
   timeout or fake timers — pick what the existing suites do for the
   tooltip timers); a rejected write leaves `copied` false; a second
   click while copied re-arms the timer (no early reset); the status
   region carries `role="status"`/`aria-live="polite"`; axe clean in
   idle and copied states.
4. `Alpine.plugin(lyra)` now registers `lyraCodeBlock`; all existing
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
