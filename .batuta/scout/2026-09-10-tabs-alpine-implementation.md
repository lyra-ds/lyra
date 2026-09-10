# Alpine Tabs implementation scout

OpenCode / opencode/glm-5.3-flash,71.07s, exit0, unchanged MAIN status/diff guard; inline exact scoped source and selected design, no tool calls.

<<<REPORT
## Answer
Current tabs.ts implements only the enhanced surface: no ready state, no fallback binding, no validation, no custom events, no destroy restoration, defaults registered on the tab not the owning list. Smallest scoped edit set (packages/alpine/src/tabs.ts only, plus one index.ts type export and tabs.browser.test.ts):

1. ready/fallback (design 104,108,110): add `ready = false`; new `fallback` binding with hidden = ready; gate list `role='tablist'` and hidden = !ready; gate tab role/aria-selected/aria-controls/tabindex/data-state/active class; gate panel role/aria-labelledby/tabindex/hidden. init(): ensure root `data-lyra-tabs`, validate exactly one list, unique nonempty paired data-values, valid active; on success commit ready=true in one update; on failure keep ready=false, unset adapter-owned enhanced attributes, fallback stays visible.
2. Nested-root exclusion (design 104): tabElements()/panelElements() filter `element.closest('[data-lyra-tabs]') === this.root` (current queries 53-75 match nested roots).
3. Event mapping (design 114): track previousValue; accepted activation emits cancelable `lyra:tabs-before-change` `{value, previousValue}` bubbles/composed before focus/active mutation; veto aborts everything; else focus, write active, emit non-cancelable `lyra:tabs-change` synchronously in the interaction task. index.ts:130 gains `export type { LyraTabsChangeDetail }`.
4. List-owned defaults (design 180): move `@click`/`@keydown` from tab binding to list binding; resolve owned trigger via `event.target.closest('[data-value]')` within this root; skip when `defaultPrevented` (click guard is new — tab @click at 167-169 has none), when disabled/hidden/inert, or nested root. Recognized nav keys preventDefault before before-change dispatch. Keyboard gains RTL mirror and eligibility checks absent from handleTabKeyDown (125-142).
5. Destroy (design 108,163): restore fallback visibility and unenhanced list/panel attributes; if focus was on a now-hidden enhanced button, move to matching fallback link else first fallback link; cancel owned scheduled work.

Especially flagged — native prevention on the owning list: the design guarantee "List's own consumer handler also runs before its default" (73) cannot follow from bubble order. DOM facts: at-target listeners fire in registration order regardless of capture flag (test comment 185-188); a target-phase trigger listener always precedes an ancestor list bubble listener; but a consumer native listener on the list itself shares element and phase with the proposed Lyra list default — pure registration order. If the consumer attaches after Alpine's directive registers, Lyra's default runs first and the consumer veto is too late. Implementation must (a) keep the defaultPrevented guard for earlier-registered/ancestor consumers and (b) add an empirical proof test of actual Alpine same-element ordering (x-bind spread vs sibling `@keydown` on the list), never claim precedence from bubbling. Existing keydown test (181-202) proves only ancestor-capture precedence, which holds regardless of handler placement.

Smallest tests (tabs.browser.test.ts): fixture gains nav fallback plus real sections per design 143-162. Cases: no-JS/before-ready (fallback visible, list hidden, panels lack role/tabindex/hidden) then after-ready full ARIA; failed init (duplicate values, no list) stays ready=false with usable fallback; before-change veto aborts focus/active/change; accepted flow emits before-change then change with correct detail, change cancelable=false, synchronous; native consumer list click/keydown prevention (bubble registered before initTree vetoes; same-element after-init ordering recorded as proof, not assumed); new click defaultPrevented guard; destroy restoration plus focus-to-fallback-link; RTL mirror; disabled/inert exclusion; nested-root exclusion. Existing suites 81-249 (server-rendered class removal, x-modelable, axe, roving focus) must stay green.

Proposed practical native baseline cases (run before implementation, per design 112/180):
- A: native trigger-level click/keydown listener (target phase) — precedes list-level Lyra default by phase; veto works.
- B: native list bubble listener registered before Alpine init — veto works via guard.
- C: native list bubble listener registered after init — ordering unknown; measure in real Alpine; claim nothing either way.
- D: native list capture listener — capture phase precedes target/bubble; veto works.
- E: pre-defaultPrevented cancelable synthetic keydown — guard at 126 already holds; add click equivalent.
- F: non-cancelable synthetic event — preventDefault is a no-op, guard reads false (noted 191-192).

## Files
- packages/alpine/src/tabs.ts:1-191 — all edits: ready/fallback/gated attrs 144-187, nested-root filters 53-75, list-owned handlers 125-173, events 121-123, destroy.
- packages/alpine/src/index.ts:9-10,130,193-194 — add LyraTabsChangeDetail export only.
- packages/alpine/src/tabs.browser.test.ts:12-42,181-202 — fixture and new cases above.
- Styles navigation.css — no edit in this slice; corrected stylesheet arrives with React slice (design 129).
- New Alpine minor changeset.

## Evidence
- tabs.ts:144-146 list binding lacks hidden/ready gating; 148-187 tab/panel bindings apply role/aria/tabindex/hidden unconditionally vs design 110.
- tabs.ts:53-75 queries include nested roots vs design 104.
- tabs.ts:121-123 activateTab mutates active with no events vs design 114; no previousValue.
- tabs.ts:167-169 @click lacks defaultPrevented guard vs design 112.
- tabs.ts:125-142 no RTL mirror, no disabled/hidden/inert eligibility vs design 112.
- tabs.ts has no destroy/fallback restore vs design 108,163; teardown destroyTree (test 73-78) exercises nothing.
- test:185-188 records the at-target registration-order fact, matching design 180's proof demand.
- INDEX TAB EXPORTS: index.ts:130 exports only LyraTabsOptions; LyraTabsChangeDetail (design 102) missing.

## Uncertain
1. Alpine same-element listener registration order (x-bind spread vs consumer `@keydown` on the list) is unknown and must be proved empirically (design 180). Case C may fail; if so, document the limitation — no redesign.
2. Whether `:role` returning null removes the attribute under Alpine x-bind object syntax, or an explicit removal path is needed — verify.
3. Whether destroyTree reverts x-bind-applied attributes or the adapter must restore them manually (static list `hidden`, fallback visibility) — verify; design 108 requires proof stale init cannot re-hide content.
4. previousValue source under x-modelable external writes (design 110: writes are inputs, not events) — tracking point needs a test.
5. Fallback-link focus mapping (design 163) assumes href ↔ panel id correspondence; custom-id markup needs a fixture to confirm.
REPORT>>>

Controller adjudication: accept the gap map and baseline cases; current source anchors checked against inline source. The suggestion to merely document failed same-element consumer prevention is not accepted as fulfillment: selected design requires native consumer veto before Lyra defaults. If actual list binding order cannot satisfy it, investigate the narrow owned-root bubble boundary and record a design precision before implementation; no asynchronous default or observer/manager. No API/fallback behavior is weakened. No Alpine implementation or qualification has occurred.
