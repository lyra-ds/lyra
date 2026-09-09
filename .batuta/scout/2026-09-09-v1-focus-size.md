## Answer

Three hypotheses, all micro-scale. None touches a contract (WebKit native intermediate-Tab, cancellation, safe dynamic eligibility, sentinel lifetime/teardown, no body fallthrough, optional `returnFocusTo` resolver semantics, fresh/ignored close cycle). Honest caveat: combined ceiling is small; none of these alone proves closure of the 9 measured excesses.

**H1 — use-focus-trap.ts:33-34 (owner: `isTabbable`, used by both wrap-target paths)**
Hypothesis: merge `el.closest('[inert]')` and `el.closest('[aria-hidden="true"]')` into one list selector `el.closest('[inert], [aria-hidden="true"]')`.
Why safe: `closest` with a selector list returns the nearest ancestor (or self) matching any selector; the result only feeds a boolean early-return, so outcome is identical. Matches existing combined-selector precedent at use-return-focus.ts:46.
Re-prove: existing trap suites — WebKit intermediate-Tab navigation and cancellation (guard filtering feeds wrap-target choice). Zero-candidate containment unaffected.
Measurement: required before accepting; only the dist diff proves any saving.

**H2 — use-return-focus.ts:22-29 (owner: `isProgrammaticallyFocusable`)**
Hypothesis: fold standalone `if (target.matches('input')) return true;` into the single `matches()` list (`..., embed, input, audio[controls], ...`).
Why safe: every branch in this block returns true, so order is irrelevant; `input[type="hidden" i]` exclusion (line 18) already ran before either path; summary/details fallback (lines 30-33) unreachable for `input` in both versions.
Re-prove: safe dynamic eligibility tests (hidden input, media controls, summary/details).
Measurement: required; expected tiny.

**H3 — cross-file dedupe (owners: `isTabbable` use-focus-trap.ts:36-38; `isEligibleReturnFocusTarget` use-return-focus.ts:49-55)**
Hypothesis: extract one internal rendered-visibility predicate (`defaultView?.getComputedStyle` + display/visibility + `getClientRects().length > 0`) shared by both files inside `packages/react/src/internal`.
Why safe: both predicates are pure boolean ANDs over the same signals; `display:none` implies zero client rects, so adding the display check to `isTabbable` is a no-op; AND is commutative so evaluation order can follow the helper. Same package, same internal owner — no boundary crossed, no API change.
Re-prove: zero-candidate containment, WebKit Tab wrap, return-focus eligibility; detached-node case must keep optional-chaining semantics (`style?`) so the rects check still decides.
Measurement: REQUIRED and decisive — dedupe only shrinks entries bundling both hooks (modal entries); single-hook picker entries may shrink less or not at all, and the extra module hop could even add bytes per entry. Do not accept on reasoning alone; compare per-entry budgets old vs new.

Rejected (checked, not safe — do not do these):
- Dropping `el.hasAttribute('disabled')` (use-focus-trap.ts:31): NOT redundant — the `[tabindex]:not([tabindex="-1"])` selector branch can still match disabled form controls.
- Unifying disabled handling with `matches(':disabled')` (use-return-focus.ts:45 style): behavior change — fieldset-inherited disabled differs from attribute presence.
- Replacing `Number.parseInt` (use-return-focus.ts:20) with `Number()`: edge-case diff on `tabindex=""` (NaN vs 0).

## Files

- packages/react/src/internal/use-focus-trap.ts @ a4686af — lines 33-34, 36-38
- packages/react/src/internal/use-return-focus.ts @ a4686af — lines 22-29, 49-55

## Evidence

- Inline source only; read-only checkout, no files read, no commands run.
- Selector list at use-focus-trap.ts:7-14 leaves the `[tabindex]` branch unfiltered for disabled → line 31 check is load-bearing.
- Combined-selector precedent: use-return-focus.ts:46; optional-chaining style precedent: use-return-focus.ts:49.
- Controller measurements taken as given: baseline 9d214bf passes all 71 entries; current has 9 excesses; pickers +0.77-0.83kB, modal return-focus entries +0.81-0.94kB; library-maintenance diffs leave all 453 dist files identical.

## Uncertain

- Actual byte effect of H1-H3 unmeasured; may be near-zero post-gzip; no claim that these close any of the 9 excesses.
- Whether H3 survives tree-shaking per entry depends on the bundler graph, not inspected here.
- Whether pickers bundle `useFocusTrap`, `useReturnFocus`, or both is not visible from the supplied source; determines which entries H3 can help.
- Line numbers cite the supplied a4686af listing; may drift on other commits.
