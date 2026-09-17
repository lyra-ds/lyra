You are the same Batuta high implementation executor receiving the single controller retry. Correct the concrete verified failures below and add durable regressions within the original scope. The full original self-sufficient brief follows the feedback. No planning/delegation/commits/tests/build/package managers/config/services.

# CreateWorkspaceDialog operation lifecycle — high retry feedback
Initial high worker408.24s. Seven authored product files stayed in scope; controller build/docgen added the two authorized generated outputs. Existing source4/3/3, lint/format, Reactbuild/docgen, built public root/subpath type negatives and exampletypes PASS. React typecheck FAILS at lines78/92. New compiled operation81cases:70PASS/11FAIL, no unexpected page errors; declared close-error exceptions are expected/observed. Commit-boundary lifecycle6cases:0PASS/6FAIL, no pageerrors. Actual two consumer examples6cases/12creates perform the domain update and return focus but produce duplicate-key errors; gate FAIL. No budget/qualification acceptance yet.

## Required corrections, all inside the existing scope
1. create-workspace-dialog.tsx:78,92: `Boolean(result)` does not narrow `unknown` away from null for TypeScript's `in` operator. Exact pinned tsc output: TS18047 `'result' is possibly 'null'` at both lines. Make the normal runtime guard type-safe without casts, assertions or suppressions.
2. create-workspace-dialog.tsx:329: the form has no accessible name, violating the named-form criterion. Allthree native `named-form` cases find zero forms named Create workspace. Name the existing form from its existing title; no new form/public naming API.
3. create-workspace-dialog.tsx:323 and valid-submit transition: in Chromium, clicking the submit button then disabling it moves focus outside the modal. Real Escape cannot reach the modal's existing handler, so five cancellation/held/StrictMode cases stay submitting with no abort. Current native request/current snapshots show focusInDialog=false. Keep keyboard focus meaningfully inside the existing modal as the form transitions to pending, preserving an existing valid in-modal focus when possible. This belongs to the form's own disabling transition, not a new global trap/helper. Keep actual duplicate-submit disabling and readOnly fields; do not prepare focus in the tests, synthesize Escape onto the panel, or weaken the native keyboard proof.
4. create-workspace-dialog.tsx:301: a genuine native Promise created by a same-origin iframe is a valid Promise<CreateWorkspaceResult>, but `instanceof` this window's Promise rejects it immediately as malformed. Allthree cross-realm cases fall into error instead of remaining submitting and processing matching accepted settlement. Honor the declared asynchronous contract across realms; preserve same-task notification, sync result/error context, first-terminal handling and narrow onCreate error mapping. No new dependency or generic async framework.
5. create-workspace-dialog.tsx:148,161: passive-effect invalidation occurs too late after a committed controlled close or component removal. Controller uses React startTransition to close/unmount; a parent layout effect observes that committed DOM state and settles the held promise. Allsix cases then call onClose once with zero aborts; closed exit can change from editing back to accepted. Invalidate the owned operation at the committed close/destroy boundary before that settlement can run, and retain the single-abort/reason guarantee. A forced closed exit must stay editing/nonbusy; destroyed/closed work must not call close, announce, revive state or affect a reopened operation. Keep SSR safety and StrictMode idempotence; no render-phase abort or state side effects, arbitrary timer, DOM polling, new modal owner, warning suppression or unrelated helper edits.
6. basic.tsx:29 and custom-copy.tsx:31: accepted local records use slug as React key, but both demos accept repeated creation with the same name/slug. Exact actualsource native repeated-workspace creation reports duplicate-key console errors in allengines (12errors across6cases). Give accepted records stable unique rendering identity without adding business rules, rejecting allowed example operations, exposing implementation IDs in UI, or adding another demo. Keep real local data updates and trigger returnfocus.
7. create-workspace-dialog.browser.test.tsx: the delivery only changed the legacy assertion to a partial object match, omitting operationId and at-most-once proof, and added no durable tests for the new lifecycle. Add meaningful representative public regressions: invalid name/slug and focus; request ID/data/signal + submitting-before-notify and terminal-before-close; held/duplicate/readOnly/real keyboardcancel + synchronous abort reason and acknowledgment; reject/throw/errorfocus/retry; stale/forcedclose/unmount/StrictMode lifecycle including the diagnosed commit boundary; cross-realm Promise. Retain old slug behavior assertions and use exact operation/close counts. Native controller87cases are not a demand to duplicate every row, but a major new contract needs source regressions. No mock focus/RAF, sleeps, skipped tests, catch-all warning suppression, or changes to older unrelated tests.
8. changeset line5: accepted results request close through a controlled callback; they cannot force the dialog closed. Replace the misleading `Accepted results close the dialog` wording with request semantics. Preserve the mandatory breaking0.x minor migration note and existing public signatures.

## Reproduction and preserved evidence
MAIN .batuta/runs/v1-create-workspace-operation-checks/{types.log,results.json}; current source4/3/3 does not cover the new failures. Native original81fixture/result preserved as initial-result.json; initial-commit-result.json and current commit-result.json preserve0/6; initial-examples-result.json preserves repeated-key errors. First commit marker is now immutable so an erroneous later onClose cannot overwrite the original removal observation; same0/6fail result, no product changes. Native drivers: run.mjs, run-commit.mjs, run-examples.mjs under MAIN .batuta/runs/v1-create-workspace-operation-native. They use actual compiled public code and real browser input/React transitions, not fake clocks/focus. Source/diff/SHA initial snapshot is MAIN .batuta/runs/v1-create-workspace-operation-initial.

## Retry scope and execution
Original ten-file closed scope and exact selected design remain authoritative. No additional API/owner/config/style/dependency/MDX files. Generated props.json/llms.txt are controller-owned regeneration, not manual edits. Only read/edit/report; exact pinned Node24.18.0 scoped Prettier is allowed, controller owns tests/builds/validation. No git writes, services/Colima/Docker/memory/remote operations or orchestration. This is the single high retry; report concrete impossibility instead of expanding scope. Preserve the initial correct behaviors and narrow normal consumer exception propagation.

## Original self-sufficient brief
You are the implementation worker already delegated by Batuta. Edit directly in this worktree, no orchestration/delegation/worktrees/commits/services/configuration/validation.
# CreateWorkspaceDialog request/result lifecycle — high
## Goal
Replace the incumbent composition's premature close with the existing approved operation lifecycle. Keep the same Dialog/Input/Button/styles composition and migrate its public onCreate signature and two actual consumer examples.
## Context
Current source create-workspace-dialog.tsx calls onCreate({name:trimmedName,slug}) and onClose immediately, ignoring any pending result. Controller native3engine baseline reproduced that gap without page errors. Exact existing normative contract and selected incumbent design are embedded below. Dialog now supports safe declared initialFocusTo and returnFocusTo; its own scope/focus/presence/scroll/dismiss ownership is read-only and must be reused. No alternative foundation or new Alpine component.
The existing browser test's plain-payload/unconditional-close assertions describe the behavior intentionally replaced; preserve its slug auto-derivation/manual-edit assertions and migrate callback expectations exactly. Root and subpath index exports currently expose only CreateWorkspaceDialog/Props. Both must also expose the exact named request/result types. Two live examples currently omit onCreate and have no real domain effect; each must update real local workspace data and return matching accepted, rendering the resulting records, without a fake network/delay. Public MDX migration explanation follows in the next documentation cycle; no new live example is promised. Generated props.json/llms.txt are owned by build/docgen commands and must never be hand-edited.
## Conventions
Pinned Node24.18.0/pnpm11.13.1/TypeScript5.9.3, React functional components, Vitest Browser Mode plus SSR. CSS-first existing lyra classes. All new project prose English. Tests-after profile with regression-first implementation. Only read/edit/report: controller owns all execution and validation. You may run only exact pinned Node with scoped Prettier for the listed files if needed; no test/build/install/package-manager or git-write commands. Do not obey hook suggestions to add Impeccable configs/ignores or start unrelated interviews.
- Follow the project's existing state approach (props drilling, context,
  zustand, redux…).
- Components: PascalCase file and export names, one main component per file,
  colocate with the existing folder pattern (check neighbors before creating).
- Hooks: `use` prefix, rules of hooks respected.
- Styling: match the project's existing method (CSS modules, styled-components,
  Tailwind…).
- Derive state where possible; `useEffect` only for real external
  synchronization, with a complete dependency array.
- Tests: follow the project's runner (vitest/jest + testing-library). Query by
  role/label, not by test-id, unless the project already standardizes test-ids.

Never:

- Class components in new code.
- A second state or styling library alongside the project's existing one.
- Conditional hooks.
- `any` in a TypeScript project — type props and returns explicitly.
- Follow the existing code style of the files you touch — naming, formatting,
  import order.
- Change only what the brief asks. Every changed line must trace directly
  back to the brief.
- Clean up only your own mess: remove imports/variables/functions that YOUR
  change made unused. Leave pre-existing dead code alone — mention it in your
  output instead of deleting it.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what
  a line does.
- If the brief references tests, make them deterministic: no real network, no
  time-dependent assertions.

Never:

- Reformat code you were not asked to change.
- Add a dependency the brief does not explicitly allow; no lockfile changes
  except from an allowed dependency.
- Drive-by refactors or "improvements" outside the brief's scope.
- Touch CI config, license, or anything listed under the brief's Boundaries.
- Silence a signal instead of fixing its source (casts, empty catch blocks,
  sleeps, copy-paste to dodge the real fix) — the method line says how to
  mark an unavoidable workaround.

Test the behavior, never the mock.
A failing test means fix the code, not the test.
No test-only flags or branches in production code.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.
## Acceptance criteria
1. Exact public CreateWorkspaceRequest/Result types and onCreate signature from design, root+subpath exported, optional returnFocusTo forwards to Dialog; real named form exposes editing/submitting/canceling/error/accepted, busy only for pending phases and duplicate-submission guard. Normal modal entry declares name field through Dialog's existing initialFocusTo. Invalid name/empty slug stays open, no consumer call, exact firstinvalidfocus and accessible field errors; preserve trim/slug/touched/reset behavior. Controller type/API/SSR/browser and native form proof verify this.
2. Every valid request has a fresh operationId, copied data and initially unaborted operation-only signal; submitting must be committed before exactly-one consumer call in the same interaction task. Matching sync/async accepted commits terminal then requestsclose; rejected/undefined/throw/rejection/malformed current result preserves values and exposes focused nonempty error; canceled returns editing. Stale IDs/later terminal results cannot mutate/close/announce. Internal close pending commits canceling before exactly-one synchronous abort({operationId}), stays busy and waits for acknowledgment; repeatedclose no duplicateabort; accepted/rejected aftercanceling keep their defined outcomes. Forced controlledfalse/unmount abort+invalidate with no extraonClose; logicalclosed exit editing/nonbusy, reopenblank, stale settlement harmless. Narrow exception mapping must not swallow an onClose error or turn accepted into rejected. Current source/native held-promise, immediate-callback DOM observations, real key/pointer, repeat/stale/StrictMode/teardown proof verifies outcomes. No timers, fake resolution or secondary cancellation API.
3. Exactly scoped composition/exports/examples/changeset, no helper-framework/other-owner/dependency/style/config changes. Current0.x breaking minor changeset contains explicit what-changed/how-to-migrate: plain/void callback to request/result with matchingID/signal and accepted/rejected/canceled acknowledgment; do not predict/publish a version. Two actual examples visibly apply real local accepted data and restore focus to their existing trigger after accepted close through the declared returnFocusTo composition channel, with no manually prepared trigger focus. Controller source3engine/SSR/types/lint/format/build/docgen/publicexports/actualexamples/visual375+1280light+dark and size measurement, plus independentreview. Existing Task10 budgets remain failures, not waived; fullpackedLinux/React18+19/manualAT qualification stays separate.
## Boundaries
Only read/edit/report in this worker. No tests/build/install/package manager/gitwrites: the controller runs those. Exact pinned Node24.18.0 is /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node; scoped Prettier with that absolute binary is the only allowed formatting execution. No PATH Node26. No generated-file hand edits. No silent onCreate success, invented accepted result, timeout/sleep/mockfocus, suppression, skip/only, unsafe cast, parallel legacy callback mode, public controller/onCancel/API beyond the declared request/result/onCreate/returnFocusTo surface, new generic async framework, modal helper or DOM focus trap. Use existing normal React/event error propagation outside onCreate's contractual error mapping. Preserve styles/class names; all CSS, Dialog/Input/Button/Avatar/shared owners, CI/config/manifests/lockfiles/versions/otherdocs/MDX stay read-only. No Colima/Docker/service/memory/remote/publication operation. Stop hooks do not authorize configs or unrelated interviews.
## Scope
- packages/react/src/create-workspace-dialog/create-workspace-dialog.tsx
- packages/react/src/create-workspace-dialog/create-workspace-dialog.browser.test.tsx
- packages/react/src/create-workspace-dialog/create-workspace-dialog.ssr.test.ts
- packages/react/src/create-workspace-dialog/index.ts
- packages/react/src/index.ts
- apps/docs/components/examples/create-workspace-dialog/basic.tsx
- apps/docs/components/examples/create-workspace-dialog/custom-copy.tsx
- .changeset/create-workspace-operation-lifecycle.md
- tools/docgen/output/props.json
- tools/docgen/output/llms.txt
Do not change anything outside this list; if the task requires it, stop and report. Generated files are listed for controller-owned regeneration only.
## Expected evidence
List touchedfiles and their requirement, exactcommands/output actuallyrun, unresolved issues and all unrunchecks. No passingproof claims from unrunchecks. Controller owns verification.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
Report the discrepancy instead of broadening architecture or reopening planning.
## Exact selected design
# CreateWorkspaceDialog incumbent lifecycle — selected design

Status: technically reviewed on2026-09-10. Initial GLM review identified six precision gaps, now resolved; a later exit0 round emitted no report and was invalid; the report-focused retry returned3DONE/no findings/unchanged guard/verifierPASS. Implementation is next after verified Task36. Existing V1 continuation authorizes this incumbent compatibility/migration work; no separate human approval or final release qualification claimed. The exact established overlay-family operation contract remains normative.

## Public contract
```ts
export interface CreateWorkspaceRequest {
  operationId: string;
  data: { name: string; slug: string };
  signal: AbortSignal;
}
export type CreateWorkspaceResult =
  | { operationId: string; status: 'accepted' }
  | { operationId: string; status: 'rejected'; error: string }
  | { operationId: string; status: 'canceled' };
export interface CreateWorkspaceDialogProps {
  open?: boolean;
  onClose?: () => void;
  onCreate?: (request: CreateWorkspaceRequest) => CreateWorkspaceResult | Promise<CreateWorkspaceResult>;
  title?: string;
  slugPrefix?: string;
  returnFocusTo?: () => HTMLElement | null;
}
```
Export request/result alongside existing component/props at root and existing subpath. No public state setter/controller or second cancellation interface. Optional onCreate remains source shape optional, but missing handler/undefined result is an explicit rejection, never simulated success. Passing a legacy void handler no longer type-checks; this is an intentional minor changeset on current0.5.0 (actual version is determined by the full release tooling, no version command now), final stable1.0 retains the new signature. No parallel legacy mode preserving premature close. Manual migration required because accepting a domain operation is a product decision; no speculative codemod.

## State and form
Use existing Dialog, Button, Input and styles. Replace composition div with a real named form carrying class lyra-wscreate and data-state editing/submitting/canceling/error/accepted. External footer submit button uses type=submit and form=id; Cancel type=button routes same close request as Dialog Escape/backdrop/header. aria-busy=true and duplicate-submit disabled only during submitting/canceling. Existing loading button supports visible state without extra styles. Name/slug are readOnly (not disabled) while an operation is current; no data edits during pending work. Preserve existing trim/slugify/touched behavior and reset only for each newly opened cycle. Invalid name/emptyslug keeps dialog, reports existing field-style errors, focuses firstinvalidfield and never calls onCreate. Submit must remain operable for validation, not permanently disabled on empty name. Error summary uses existing hint-error style, named focusable alert with single announcement. No new visual variants.

## Operation ownership
One current record{id,controller,phase,closeRequested,settled}; a per-instance useId prefix plus monotonic sequence produces unique IDs across retries/reopens. Each valid native submit commits submitting/aria-busy/duplicate guard BEFORE calling consumer exactly once in the same task (ReactDOM flushSync allowed for this observable ordering, no forced async tick). Preserve copied request data and initiallyunaborted signal. Process synchronous result or nativePromise settlement through one current-id/first-terminal path. accepted commits accepted then calls onClose once; rejected commits error, preserves values, exposes and focuses summary, permits retry with freshID; canceled without pendingclose returnsediting preservingvalues. Undefined/throw/rejection becomes explicit error with nonempty fallbackmessage, never success. Different operationId result is ignoredasstale; it cannot close/announce/replace current operation.

Accepted userclose while submitting: commitcanceling before calling abort({operationId}) synchronously once; do NOT callonCloseuntilmatching canceled result. Repeatedclosewhilecanceling noabort/close duplication. Matchingaccepted aftercanceling stillaccepts thencloses; matchingrejected remainsopenerror. On externalcontrolledopen=false or unmount, abortpending once and invalidate operation; later results ignored, no additionalonClose. Cleanup cannot flushReactstate duringunmount; setinternalphasebeforeabort, marknotlivebefore any synchronoussettlement. StrictMode setup/cleanup must not replaycreate or duplicateabort. A consumer that never settles leaves canceling; no timeout or fictional success.

## Compatibility, composition and evidence
returnFocusTo simply forwards the already approved Dialog resolver; no new capture/trap/presence/scroll/dismiss owner. Dialog now exposes verified initialFocusTo; use that existing declaration channel for the workspace-name field on entry. Validation and rejected-result focus remain owned by the current form interaction, not another opening timer or modal helper. Existing2liveexamples currently omitonCreate; they must be migrated to real local consumer state that appends accepted workspace data, then returnsmatchingaccepted. No simulatednetworkdelay; cancellation/error proof uses controlled source/native fixtures; the subsequent MDX cycle explains those outcomes. No additional live example is introduced. Both MDXpages must describe request/result, signal/error/retry/cancel handshake andbreakingbefore/after; newlywrittenproseEnglish. Regenerate docs via current build+docgen, no manualgeneratededits.

Requiredproof: nativependingbaselineRED, invalidname/slug, synchronousaccepted/rejected/canceled, asyncaccepted/rejected/throw/undefined, duplicate submit, singleabort ordering+reason, closecancelingwait, accepted/rejectedaftercanceling, mismatchedID, stale/unmounted settlement, reopen/reset, StrictMode, preservedslugediting, realkeyboard/pointer and returnFocusTo. Current3browser/SSR/types/publictypeexports, generateddocs/current2examples, visual375/1280light/dark and size delta. Existing CreateWorkspaceDialog size4194/3200B alreadypendingTask10, no budget waiver. Final packedLinux/AT qualification remains separate.

## Revised lifetime and callback precision
A forced controlled open=false destroys the current form operation logically even if Dialog still renders an inert CSS exit. Abort and invalidate pending ownership without requesting another close; reopening starts a blank editing cycle, and an old settlement cannot enter it. This is distinct from an internal user close request while submitting, which enters the canceling handshake and waits for matching acknowledgment.
Only onCreate's synchronous throw or asynchronous rejection maps to the creation error result. Do not accidentally catch a later onClose exception and reinterpret an already accepted operation as rejected. Commit terminal state before callbacks and clear its ownership first so reentrant consumers cannot settle the same operation twice. Consumer values remain typed and copied; no global operation registry or generic async framework is warranted.
Mismatched noncurrent operation IDs are stale and ignored. Undefined or malformed results for the current operation must never imply acceptance. No timeout, fabricated result or swallowed error. Abort remains the only cancellation interface and exactly once for one operation, including synchronous abort observers and teardown.
Existing browser test asserting a plain payload and unconditional onClose must be migrated with exact request/result assertions because that behavior is intentionally replaced, while its slug auto-derivation/manual-edit assertions remain. Existing root/subpath type exports must both expose the two named contract types.

## Selected delivery boundaries
Runtime task: current composition source/browser/SSR, two existing type-export entries, two generated React docs artifacts, one breaking0.x minor changeset and the two actual examples whose consumer behavior depends on the new contract. Public MDX explanation/migration can follow immediately as a separate documentation cycle. No source path outside that bounded composition needs modification; Dialog, Input, Button and styles stay read-only. The high implementation brief must carry this closed scope and verifiable criteria before dispatch.

## Resolved support-review decisions
 exactly the two existing live examples demonstrate synchronous accepted local workspace creation. Cancellation/rejection are exercised by controlled native/source fixtures and described in the subsequent MDX cycle; no new live example promised.

 the runtime breaking changeset itself must include what changed and how to migrate the plain/void callback to request/result, including matching ID, signal and explicit accepted/rejected/canceled acknowledgment. Later MDX is supplementary.

 forced controlledfalse invalidates/aborts then presents an inert exit in editing with aria-busy absent, preserving values only through that exit. Reopen resets values and errors. No pending ownership remains behind a busy attribute.

 missing/undefined/malformed current response, unknown status, or rejected response with missing/empty error maps to rejected with nonempty fallback. A different string operationId remains stale and ignored. Add exact malformed-result proof.

 pending name/slug fields are readOnly (not disabled), retaining their existing focusability while preventing edits. Duplicate submission remains disabled and logically guarded; cancel routes the handshake.

 prove no settlement is fabricated with a held consumer promise, observed abort, repeated close, and subsequent native frames/tasks retaining canceling/current ID/busy and zero onClose; release via matching canceled afterward in the fixture. Static review rejects timers/fictional result paths. A finite test does not prove infinite waiting alone.

## Exact existing normative contract
  available, and change/create effects MUST remain consumer operations.
- CreateWorkspaceDialog MUST compose `OF-MODAL` through Dialog and MUST NOT
  implement another focus scope, portal, presence controller, scroll lock, or
  dismiss listener. Its creation state machine MUST expose `editing`,
  `submitting`, `canceling`, `error`, or `accepted` through a Lyra-owned
  `data-state` on the composition root and MUST retain at most one current
  operation ID. `submitting` and `canceling` MUST also expose `aria-busy="true"`
  on the form and disable duplicate submission. An invalid submit MUST stay in
  `editing` or enter `error`, MUST NOT notify the consumer, and MUST focus the
  first invalid field under the modal focus order. A valid submit MUST create a
  fresh operation ID and one Lyra-owned `AbortController`. The public
  Lyra-owned `CreateWorkspaceRequest` is
  `{ operationId: string; data: { name: string; slug: string }; signal: AbortSignal }`.
  Lyra MUST commit `submitting` and then notify the consumer exactly once in the
  same interaction task with that request; duplicate submits for its ID MUST be
  ignored. The signal MUST be initially un-aborted, MUST belong only to that
  operation ID, and MUST be the only cancellation interface exposed to the
  consumer.
  The consumer handler MUST synchronously return or asynchronously settle with
  a Lyra-owned `CreateWorkspaceResult`. `CreateWorkspaceResult` MUST carry the
  same `operationId`. Its status MUST be exactly `accepted`, `rejected` with an
  error message, or `canceled`. Returning `undefined`, throwing, or rejecting
  the asynchronous operation MUST be treated as `rejected` for the current ID,
  never as implicit acceptance.
  `accepted` MUST commit the `accepted` state and domain result and only then
  request modal close; `rejected` MUST commit `error`, keep the dialog open,
  preserve the entered values, expose the error, and focus its summary or first
  invalid field; `canceled` MUST return to `editing` with values preserved. On
  an accepted user close while `submitting`, Lyra MUST retain `aria-busy="true"`
  and the current ID. Lyra MUST commit `canceling` before calling
  `controller.abort({ operationId })` synchronously in the same accepted close
  interaction task. The consumer MUST observe exactly one `abort` event during
  that call, `signal.aborted` MUST be `true`, and `signal.reason` MUST equal
  `{ operationId }`. Duplicate close requests while `canceling` MUST NOT call
  `abort` again. Destroying a pending composition MUST use the same single-abort
  path before releasing the operation and MUST NOT request another close. Lyra
  MUST then wait for the result carrying that ID; `canceled` MUST allow the
  pending user close, while the other terminal results retain their outcomes
  above. The first terminal result wins. A terminal result with a noncurrent
  `operationId` MUST be ignored as stale. Results after destroy and any later
  settlement MUST likewise be ignored without closing, announcing, or changing
  state.

React controlled props and domain callbacks remain application inputs. A Lyra
close or selection callback communicates one requested next state or committed
domain selection according to its documented timing; it MUST NOT mutate a
controlled value. Alpine modelable state and bubbling, composed Lyra custom
events MUST preserve the same accepted transition, payload meaning,
cancelation point, and at-most-once effect.
