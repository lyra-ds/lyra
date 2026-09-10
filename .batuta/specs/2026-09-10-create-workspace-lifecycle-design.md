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

Requiredproof: nativependingbaselineRED, invalidname/slug, synchronousaccepted/rejected/canceled, asyncaccepted/rejected/throw/undefined, duplicate submit, singleabort ordering+reason, closecancelingwait, accepted/rejectedaftercanceling, mismatchedID, stale/unmounted settlement, reopen/reset, StrictMode, preservedslugediting, realkeyboard/pointer and returnFocusTo. Current3browser/SSR/types/publictypeexports, generateddocs/current2examples, visual375/1280light/dark and size delta. Existing CreateWorkspaceDialog size4107/3200B alreadypendingTask10, no budget waiver. Final packedLinux/AT qualification remains separate.

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
