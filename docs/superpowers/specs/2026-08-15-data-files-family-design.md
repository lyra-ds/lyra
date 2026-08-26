# Data and Files Family Design

**Status:** Approved

**Date:** 2026-08-15

**Decision owner:** Lyra maintainer

**First implementation wave:** FileUpload only

## 2026-08-26 amendment: FileUpload evidence simplification

This amendment adopts the approved
[`2026-08-26 FileUpload Evidence Simplification Design`](2026-08-26-file-upload-evidence-simplification-design.md)
for the Task 10 evidence gate. It supersedes the former manual `DF-FU-M03` and
`DF-FU-M04` release conditions; any remaining references to those manual IDs in
this 2026-08-15 document are superseded historical context, not active work or
release conditions.

```text
Manual: DF-FU-M01 and DF-FU-M02, actual AT environments, local media, reviewer approval.
Automated: DF-FU-17 and DF-FU-18, exact immutable deployment revision, workflow ZIP.
Completion: one PASS for each ID, one revision, one immutable deployment, successful ingestion.
```

Manual evidence is collected as a local evidence ZIP. Repository ingestion uses
`pnpm evidence:file-upload:ingest --automation <path> --bundle <path> [--bundle <path>]`.

## 1. Problem, users, and use cases

The current React and Alpine FileUpload implementations start timers after file
selection, advance synthetic progress, and report success without a consumer
upload operation. That behavior cannot represent transport progress, failure,
retry, cancellation, stale completion, or a server-confirmed result. It is a
P1 v1 release blocker under the interaction and accessibility specification.

The Data and Files family covers Table, DataTable, FileUpload, and FileManager.
This specification establishes their ownership boundary and fully specifies
FileUpload as the first implementation wave. It serves consumers that need to:

- select files with a native picker or drag and drop;
- validate selection constraints before starting transport;
- render real consumer-owned upload state and progress;
- request retry, cancellation, and removal without Lyra owning the operation;
- preserve accessible form, keyboard, focus, announcement, and recovery
  behavior across React, Alpine, CSS, SSR, and progressive enhancement.

Lyra owns selection presentation, validation presentation, proposed identity,
semantic state rendering, user intents, focus recovery, and announcements. The
consumer owns the item collection, upload transport, persistence, abort
mechanism, progress source, retry policy, and final result.

## 2. Non-goals

The first implementation wave does not:

- provide an HTTP client, endpoint, storage SDK, queue, worker, or transport;
- retain synthetic progress or synthetic success as a compatibility mode;
- redesign Table, DataTable, or FileManager runtime APIs;
- turn DataTable into an enterprise grid or adopt TanStack Table;
- add an external primitive or shared cross-framework runtime;
- implement the Blade adapter;
- make externally seeded remote items participate in native `FormData` without
  a corresponding local `File` object;
- provide resumable, chunked, directory, image-editing, or preview behavior;
- add a provider, compound API, slot, or `asChild` escape hatch.

After this specification and its FileUpload-only wave, roadmap ordering resumes
with the Overlay family. No other Data and Files runtime migration is implied.

## 3. Family anatomy and ownership

### 3.1 Family boundary

| Surface     | Responsibility                                                                | First wave    |
| ----------- | ----------------------------------------------------------------------------- | ------------- |
| Table       | Semantic static tabular markup and visual styling.                            | Boundary only |
| DataTable   | Lyra-owned data operations and semantic, focusable actions over tabular data. | Boundary only |
| FileUpload  | File selection plus presentation of a consumer-controlled upload lifecycle.   | Implemented   |
| FileManager | Domain composition for browsing and managing persisted files.                 | Boundary only |

FileUpload does not become a miniature FileManager. FileManager may compose a
FileUpload later, but persisted-file navigation, folders, remote metadata,
bulk management, and server actions remain FileManager responsibilities.
Table and DataTable do not inherit FileUpload state or operation types.

### 3.2 FileUpload anatomy

FileUpload has one data-driven root with these owned parts:

1. root container;
2. native `<label>` dropzone associated with a focusable `<input type="file">`;
3. visible label and hint;
4. item list and item row;
5. file identity, metadata, status, and error text;
6. native `<progress>` for uploading and canceling states;
7. retry, cancel, and remove buttons;
8. persistent polite live region.

The native input owns browsing and form participation. The label owns pointer
activation without JavaScript. Drag and drop is enhancement, not a replacement
for the native picker. The consumer owns item data; Lyra renders the supplied
collection and emits intents but never mutates it as authoritative state.

## 4. Variants, sizing, and state model

### 4.1 Variants and sizing

The first wave has one visual variant and one density. `multiple`, `accept`,
`maxSizeMB`, `disabled`, and `required` are behavioral options, not visual
variants. New size or appearance props are out of scope.

### 4.2 Root and item states

The root is `idle` when `items.length === 0` and `active` otherwise. Disabled is
expressed independently with the native `disabled` attribute and
`data-disabled`, so it does not erase the lifecycle state.

Each item is exactly one member of this state machine:

| State       | Required data                 | Available user operation     |
| ----------- | ----------------------------- | ---------------------------- |
| `selected`  | stable item identity          | remove                       |
| `uploading` | attempt identity and progress | cancel                       |
| `canceling` | attempt identity and progress | none                         |
| `success`   | attempt identity              | remove                       |
| `error`     | validation or transport error | retry when retryable; remove |
| `canceled`  | attempt identity              | retry; remove                |

`removed` is a confirmed transition, not a persistent item literal. A remove
intent does not visually remove a row. Removal occurs only when a later
controlled `items` commit omits its `id`; only then may Lyra move focus and
announce removal.

Determinate progress is a finite number from 0 through 100. Indeterminate
progress has no numeric value. `success` is not inferred from 100 percent;
consumers must commit it explicitly. Validation errors have no upload attempt.
Transport errors and canceled items retain the attempt that produced them.

### 4.3 Transition contract

The supported transitions are:

```text
idle -> selected | validation error
selected -> uploading | removed
uploading -> uploading | canceling | success | transport error
canceling -> canceled | success | transport error
transport error -> uploading (new attemptId) | removed
canceled -> uploading (new attemptId) | removed
success -> removed
validation error -> removed
```

The consumer may replace controlled data from an external source, but a state
change outside this graph is a contract violation and need not receive an
announcement. A late result for an older `attemptId` must not update or
announce the current attempt. Unmount or Alpine teardown emits nothing and does
not abort transport; the consumer owns abort lifecycle.

When `multiple` is false, selection atomically replaces the existing collection
only while every current item is inactive (`selected`, `success`, `error`, or
`canceled`). While an item is `uploading` or `canceling`, picker activation and
drops are rejected, `aria-disabled="true"` exposes the temporary operation
lock, and the persistent live region announces that replacement is unavailable.
The input remains form-enabled; only the public `disabled` prop applies its
native `disabled` attribute.

## 5. React public API

### 5.1 Exported types

The root and `@lyra-ds/react/file-upload` subpath export the following complete
surface:

```ts
export type FileUploadProgress = { kind: 'indeterminate' } | { kind: 'determinate'; value: number };

export type FileUploadError =
  | {
      kind: 'validation';
      code: 'accept' | 'max-size';
      message: string;
      retryable: false;
    }
  | {
      kind: 'transport';
      code?: string;
      message: string;
      retryable: boolean;
    };

export interface FileUploadItemBase {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface FileUploadSelectedItem extends FileUploadItemBase {
  status: 'selected';
}

export interface FileUploadUploadingItem extends FileUploadItemBase {
  status: 'uploading';
  attemptId: string;
  progress: FileUploadProgress;
}

export interface FileUploadCancelingItem extends FileUploadItemBase {
  status: 'canceling';
  attemptId: string;
  progress: FileUploadProgress;
}

export interface FileUploadSuccessItem extends FileUploadItemBase {
  status: 'success';
  attemptId: string;
}

export type FileUploadErrorItem =
  | (FileUploadItemBase & {
      status: 'error';
      error: Extract<FileUploadError, { kind: 'validation' }>;
    })
  | (FileUploadItemBase & {
      status: 'error';
      attemptId: string;
      error: Extract<FileUploadError, { kind: 'transport' }>;
    });

export interface FileUploadCanceledItem extends FileUploadItemBase {
  status: 'canceled';
  attemptId: string;
}

export type FileUploadItem =
  | FileUploadSelectedItem
  | FileUploadUploadingItem
  | FileUploadCancelingItem
  | FileUploadSuccessItem
  | FileUploadErrorItem
  | FileUploadCanceledItem;

export interface FileUploadSelectionBase {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

export type FileUploadSelection =
  | (FileUploadSelectionBase & {
      proposedItem: FileUploadSelectedItem;
      proposedAttemptId: string;
    })
  | (FileUploadSelectionBase & {
      proposedItem: Extract<FileUploadErrorItem, { error: { kind: 'validation' } }>;
      proposedAttemptId?: never;
    });

export interface FileUploadSelectIntent {
  selections: readonly FileUploadSelection[];
}

export interface FileUploadRetryIntent {
  id: string;
  previousAttemptId: string;
  proposedAttemptId: string;
}

export interface FileUploadCancelIntent {
  id: string;
  attemptId: string;
}

export interface FileUploadRemoveIntent {
  id: string;
}

export interface FileUploadMessages {
  label?: string;
  hint?: string;
  browse?: string;
  retry?: (name: string) => string;
  cancel?: (name: string) => string;
  remove?: (name: string) => string;
  selectionUnavailable?: string;
  validationAccept?: (name: string, accept: string) => string;
  validationMaxSize?: (name: string, maxSizeMB: number) => string;
  selected?: (name: string) => string;
  progress?: (name: string, percent: number) => string;
  progressIndeterminate?: (name: string) => string;
  canceling?: (name: string) => string;
  success?: (name: string) => string;
  error?: (name: string, message: string) => string;
  canceled?: (name: string) => string;
  removed?: (name: string) => string;
}

export interface FileUploadProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onSelect' | 'onCancel'
> {
  items: readonly FileUploadItem[];
  onSelect: (intent: FileUploadSelectIntent) => void;
  onRetry: (intent: FileUploadRetryIntent) => void;
  onCancel: (intent: FileUploadCancelIntent) => void;
  onRemove: (intent: FileUploadRemoveIntent) => void;
  name?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  hint?: string;
  messages?: FileUploadMessages;
}
```

`items` is intentionally controlled-only. An uncontrolled triad would make
Lyra a second source of truth for an asynchronous operation it cannot observe
or cancel. Selection proposals let a reducer add items, while all transport
updates remain ordinary consumer state updates.

`onSelect` and `onCancel` are omitted from inherited root attributes because
their controlled intent callbacks intentionally replace same-named native
event handlers. The `FileUpload` value and its forwarded-ref signature are
exported by the runtime component.

`onRetry`, `onCancel`, and `onRemove` are required even when a rendered
collection currently has no applicable action; this keeps operation ownership
explicit and avoids action controls that silently do nothing. Message
callbacks may close over React application localization. They are not required
to be serializable.

### 5.2 Identity and intents

React proposes item and attempt IDs with a hydration-stable `useId()` instance
prefix and a monotonically increasing instance counter. A valid selection
includes the proposed ID for its first attempt; retry proposes a new one. IDs
never derive from file names, array positions, time, or randomness. Alpine uses
the required server root `id` plus an instance counter. Consumers must echo
proposed item and attempt IDs when committing the corresponding state. Ignoring
a proposal is allowed and means no state transition occurred; substituting a
different identity is unsupported.

Retry, cancel, and remove intents are at most once for the same visible state.
After dispatch, Lyra keeps the applicable control disabled with a transient
pending-intent lock keyed by `id`, state, and `attemptId`. The lock clears only
after a controlled commit changes or removes that item. It is not a timeout and
does not fabricate state. Selection proposals use unique IDs and are not
rendered until the consumer commits them.

### 5.3 React example

```tsx
function AttachmentUpload() {
  const [items, dispatch] = useReducer(uploadReducer, []);

  return (
    <FileUpload
      name="attachments"
      accept="image/*,.pdf"
      maxSizeMB={10}
      items={items}
      onSelect={({ selections }) => {
        dispatch({ type: 'selected', items: selections.map((entry) => entry.proposedItem) });

        for (const entry of selections) {
          if (entry.proposedItem.status === 'selected') {
            startUpload(entry.file, entry.id, entry.proposedAttemptId, dispatch);
          }
        }
      }}
      onRetry={({ id, proposedAttemptId }) => retryUpload(id, proposedAttemptId, dispatch)}
      onCancel={({ id, attemptId }) => cancelUpload(id, attemptId, dispatch)}
      onRemove={({ id }) => dispatch({ type: 'removed', id })}
    />
  );
}
```

The implementation documentation must provide the complete reducer and
`AbortController` example rather than leaving `startUpload`, `retryUpload`, or
`cancelUpload` unexplained.

## 6. Native form, disabled, and read-only behavior

`name` is optional. Without `name`, FileUpload is transport-only: it forwards
real `File` objects in `onSelect` and resets the input after dispatch so the
same file can be selected again.

With `name`, the enhanced component retains only valid local `File` references
whose proposed IDs were echoed as non-validation items and reconstructs
`input.files` with `DataTransfer` after confirmed commits. Removing an item
removes its local file from native `FormData`. Externally seeded items without a
local `File` remain visible but cannot be synthesized into native form data.
Documentation must state that limitation. Before JavaScript, the visible
labeled input keeps ordinary native form submission behavior.

`required` is always forwarded to the native input and participates in native
constraint validation. Without `name`, a valid file still satisfies the
constraint but contributes no form-data entry. `disabled` disables selection
and every item action, removes no content, and preserves readable state.
FileUpload has no read-only prop: controlled items with omitted product
permissions should instead be presented by a read-only file summary or
FileManager composition. Introducing a disabled action callback conditionally
is not an alternative supported API.

## 7. Composition decisions

FileUpload is data-driven because every upload item has the same bounded
anatomy and stable identity. Consumers provide item data, not row markup.
Arbitrary children, render props, compound parts, providers, slots, and
`asChild` are excluded from the first wave because they would let consumer
markup erase the common semantic and announcement contract.

React forwards the ref to the root `<div>`. Native root attributes and event
handlers are forwarded after Lyra's required semantics are established.
Consumer native handlers run first; `preventDefault()` cancels an enhanced
Lyra default only where an inherited native event has a Lyra default. The four
intent callbacks are notifications with no Lyra transport default to cancel.

## 8. Keyboard, focus, HTML, and ARIA

- The visible dropzone is a native `<label>` associated through `htmlFor` with
  a focusable file input. It is never a button containing an input.
- The input remains in the accessibility tree and receives visible
  `:focus-visible` styling on the associated label.
- Retry, cancel, and remove are native buttons with localized accessible names
  containing the full file name.
- Every item status and error is visible text associated with that item.
- Uploading and canceling use native `<progress>`. Determinate progress has
  `value`; indeterminate progress omits it. Text next to the control supplies
  the accessible name and current status.
- The persistent `aria-live="polite"` and `aria-atomic="true"` region exists in
  server and first-client markup even when empty.
- Announcements are keyed by `(id, attemptId, state)`. Determinate progress is
  announced only when crossing 25, 50, 75, or 100 percent, not on every render.
  Selection, validation error, canceling, success, transport error, canceled,
  unavailable replacement, and confirmed removal are announced once.
- A stale attempt produces neither DOM state nor an announcement.

Actions remain present and disabled while their intent is pending, avoiding
layout movement. When a focused action's item is confirmed removed, focus moves
after commit to the next item's first available action, then the previous
item's first action, then the native file input. If the consumer does not
remove the item, focus does not move.

Drag and drop has no keyboard-only requirement because the native picker is
the equivalent operation. Dropping unsupported content follows the same
validation proposal path as browsing. Disabled and single-active replacement
states reject the drop and announce why.

## 9. Responsive behavior and touch

The dropzone and list fill their container. Item metadata and actions must not
cause horizontal page overflow at 320 CSS pixels or under 400 percent zoom.
Long names truncate visually only when their complete value remains available
to assistive technology and the status/actions remain operable. Actions wrap
below metadata before content is clipped.

Pointer targets are at least 24 by 24 CSS pixels with adequate spacing and at
least 44 by 44 CSS pixels for coarse-pointer or narrow-viewport fixtures. The
dropzone remains operable by touch and does not rely on hover or drag. No
stateful layout difference may depend solely on JavaScript viewport reads.

## 10. RTL, locale, long content, zoom, and reflow

Logical CSS properties own spacing and alignment. RTL reverses inline layout
where appropriate but does not reverse progress meaning or icon semantics.
File names, error codes, byte values, and progress values remain data; every
surrounding phrase comes from messages. English defaults remain available in
React. Alpine server markup and serializable messages own localization.

Fixtures cover English, Portuguese, RTL, long translations, unbroken file
names, 200 percent text zoom, 400 percent page zoom, and narrow reflow without
loss of content, focus, status, or action.

## 11. Forced colors and reduced motion

Forced-colors styling preserves the dropzone boundary, focus indicator, error
boundary, progress, disabled state, and action affordances using system colors
where authored colors are overridden. Status must never depend on color or icon
alone.

Progress and state changes do not animate under reduced motion. In other
contexts, any retained color or width transition follows existing motion
tokens, introduces no autonomous progress, and is not required to understand
the outcome.

## 12. Errors, asynchronous work, cancellation, and recovery

Lyra validates `accept` and `maxSizeMB` at selection time and includes a
validation error proposal alongside the real file. The consumer must echo the
proposal to display it; ignoring it means rejecting that selection. Validation
does not start an attempt and is not retryable.

`accept` matching follows native token shapes: a dot-prefixed extension matches
case-insensitively, an exact MIME token matches `File.type`, and `audio/*`,
`video/*`, or `image/*` matches that MIME family. Empty or invalid tokens are
ignored by Lyra while the original string is still forwarded to the input.
`maxSizeMB` uses decimal megabytes (`1 MB = 1,000,000 bytes`) and rejects only
files strictly greater than the configured maximum.

The consumer begins transport by committing `uploading` with an `attemptId`.
It may update determinate or indeterminate progress and owns every terminal
transition. Cancel emits intent but remains `uploading` until the consumer
commits `canceling`; it becomes `canceled` only after abort is confirmed. A
success or error that wins the consumer's transport race while canceling may be
committed and is rendered truthfully.

Retry is available for every canceled item and only retryable transport errors.
It proposes a new attempt ID. Results from previous attempts must be discarded
by the consumer and are ignored by Lyra if supplied through an obsolete
attempt. Removing an active item is unavailable; cancellation must finish
first. Teardown performs no transport action and emits no lifecycle intent.

## 13. Alpine, CSS, SSR, and adapter boundaries

### 13.1 Alpine contract

Alpine exports item, progress, error, option, message, and event-detail types
equivalent to the React data types, prefixed with `Lyra`. Options and initial
items contain serializable data only:

```ts
export type LyraFileUploadProgress =
  { kind: 'indeterminate' } | { kind: 'determinate'; value: number };

export type LyraFileUploadError =
  | {
      kind: 'validation';
      code: 'accept' | 'max-size';
      message: string;
      retryable: false;
    }
  | {
      kind: 'transport';
      code?: string;
      message: string;
      retryable: boolean;
    };

export type LyraFileUploadItem =
  | { id: string; name: string; size: number; type: string; status: 'selected' }
  | {
      id: string;
      name: string;
      size: number;
      type: string;
      status: 'uploading' | 'canceling';
      attemptId: string;
      progress: LyraFileUploadProgress;
    }
  | {
      id: string;
      name: string;
      size: number;
      type: string;
      status: 'success' | 'canceled';
      attemptId: string;
    }
  | {
      id: string;
      name: string;
      size: number;
      type: string;
      status: 'error';
      error: Extract<LyraFileUploadError, { kind: 'validation' }>;
    }
  | {
      id: string;
      name: string;
      size: number;
      type: string;
      status: 'error';
      attemptId: string;
      error: Extract<LyraFileUploadError, { kind: 'transport' }>;
    };

export type LyraFileUploadSelection =
  | {
      id: string;
      file: File;
      name: string;
      size: number;
      type: string;
      proposedItem: Extract<LyraFileUploadItem, { status: 'selected' }>;
      proposedAttemptId: string;
    }
  | {
      id: string;
      file: File;
      name: string;
      size: number;
      type: string;
      proposedItem: Extract<LyraFileUploadItem, { status: 'error'; error: { kind: 'validation' } }>;
      proposedAttemptId?: never;
    };

export interface LyraFileUploadMessages {
  selectionUnavailable?: string;
  validationAccept?: string;
  validationMaxSize?: string;
  selected?: string;
  progress?: string;
  progressIndeterminate?: string;
  canceling?: string;
  success?: string;
  error?: string;
  canceled?: string;
  removed?: string;
  retry?: string;
  cancel?: string;
  remove?: string;
}

export interface LyraFileUploadOptions {
  items?: LyraFileUploadItem[];
  name?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  messages?: LyraFileUploadMessages;
}

export interface LyraFileUploadSelectDetail {
  selections: LyraFileUploadSelection[];
}

export interface LyraFileUploadRetryDetail {
  id: string;
  previousAttemptId: string;
  proposedAttemptId: string;
}

export interface LyraFileUploadCancelDetail {
  id: string;
  attemptId: string;
}

export interface LyraFileUploadRemoveDetail {
  id: string;
}

export type LyraFileUploadBinding = Record<string, unknown>;
export type LyraFileUploadAction = 'retry' | 'cancel' | 'remove';

export interface LyraFileUploadData {
  items: LyraFileUploadItem[];
  dragging: boolean;
  pendingIntentKeys: string[];
  setItems(items: LyraFileUploadItem[]): void;
  select(fileList: FileList | null): void;
  retry(item: Extract<LyraFileUploadItem, { status: 'error' | 'canceled' }>): void;
  cancel(item: Extract<LyraFileUploadItem, { status: 'uploading' }>): void;
  remove(
    item: Extract<LyraFileUploadItem, { status: 'selected' | 'success' | 'error' | 'canceled' }>,
  ): void;
  zone: LyraFileUploadBinding;
  input: LyraFileUploadBinding;
  liveRegion: LyraFileUploadBinding;
  itemBindings(item: LyraFileUploadItem): LyraFileUploadBinding;
  progressBindings(
    item: Extract<LyraFileUploadItem, { status: 'uploading' | 'canceling' }>,
  ): LyraFileUploadBinding;
  actionBindings(action: LyraFileUploadAction, item: LyraFileUploadItem): LyraFileUploadBinding;
}

export function lyraFileUpload(options?: LyraFileUploadOptions): LyraFileUploadData;
```

Message strings use documented `{name}`, `{percent}`, `{accept}`, and
`{maxSizeMB}` placeholders. Unknown placeholders remain literal in development
with a diagnostic and must not execute code.

The registration remains `x-data="lyraFileUpload(options)"`. The server root
requires `.lyra-upload`, a unique `id`, `data-state`, and `x-data`; its native
label/input, list, row outline, status text, action buttons, native progress,
and empty live region are server-authored. Runtime collections use a served
`<template x-for="item in items" :key="item.id">` rather than client-created
HTML strings.

Public Alpine state is `items`, `dragging`, and the pending intent keys. Public
methods are `setItems(items)`, `select(fileList)`, `retry(item)`, `cancel(item)`,
and `remove(item)`. Public bind targets are `zone`, `input`, `liveRegion`, and
the per-item helpers `itemBindings(item)`, `progressBindings(item)`, and
`actionBindings(action, item)`. `setItems` and `x-modelable="items"` converge on
the same replace-only reconciliation path; neither starts transport or invents
an intermediate state. `x-modelable="dragging"` is removed because dragging is
ephemeral presentation, not consumer data.

Alpine dispatches exactly these events:

| Event                     | Detail                                       |
| ------------------------- | -------------------------------------------- |
| `lyra:file-upload:select` | selections with `File` and proposed item     |
| `lyra:file-upload:retry`  | id, previous attempt ID, proposed attempt ID |
| `lyra:file-upload:cancel` | id and attempt ID                            |
| `lyra:file-upload:remove` | id                                           |

All four are `CustomEvent`s with `bubbles: true` and `composed: true`. They are
intent notifications, not cancelable before-events, because Lyra has no
transport or collection mutation default after dispatch. There are no result
events; controlled `items` reconciliation is the result channel. Destroy and
reinitialization remove listeners, drag state, pending locks, retained local
files, and announcement history without emitting events. Reconnection must not
duplicate handlers or replay announcements.

### 13.2 CSS contract

`@lyra-ds/styles` remains the visual owner. These classes remain public:

```text
.lyra-upload
.lyra-upload__zone
.lyra-upload__zone--drag
.lyra-upload__zone-icon
.lyra-upload__zone-label
.lyra-upload__zone-hint
.lyra-upload__input
.lyra-upload__list
.lyra-upload__item
.lyra-upload__item--error
.lyra-upload__item-icon
.lyra-upload__item-body
.lyra-upload__item-row
.lyra-upload__item-name
.lyra-upload__item-meta
.lyra-upload__bar
.lyra-upload__check
.lyra-upload__retry
.lyra-upload__cancel
.lyra-upload__remove
.lyra-upload__live
```

The root exposes `data-state="idle|active"` and optional `data-disabled`. Each
row exposes `data-state="selected|uploading|canceling|success|error|canceled"`.
Native `disabled`, `required`, `accept`, `multiple`, `value` on determinate
progress, and omission of `value` on indeterminate progress are the public
native selectors. `data-progress-kind` is not added because the native
`:indeterminate` state already expresses that distinction.

`.lyra-upload__bar-fill` is removed: the native progress element owns value and
its platform pseudo-elements own styling. This is the only intentional removal
from the current FileUpload anatomy. New input focus, progress, action, state,
forced-colors, reduced-motion, coarse-pointer, and reflow selectors use semantic
component tokens and existing global token tiers; no literal brand palette or
new token tier is introduced.

### 13.3 SSR, hydration, and no JavaScript

React server output and the first client render have the same semantic tree,
IDs, item state, input attributes, progress attributes, and empty live region.
No `File`, `DataTransfer`, window API, randomness, or time is read during server
render. File retention and form synchronization begin only after a real client
selection.

The exact React fixture is
`packages/react/src/file-upload/file-upload.hydration.browser.test.tsx`. It must
render server HTML, hydrate that HTML, capture console and recoverable hydration
errors, prove stable relationships and event counts, preserve a pre-hydration
native file selection, and verify that hydration neither replays an intent nor
announces the initial state.

Without JavaScript, server-authored Alpine/HTML keeps a visible label, focusable
native input, constraints, existing item/status content, and form submission.
Retry, cancel, removal, drag enhancement, and live updates are explicitly
unavailable until enhancement; controls for those unavailable operations must
not be rendered as dead controls. Blade remains deferred until the React,
Alpine, and Styles ranges are released and the separate Blade follow-up proves
the same claimed contract. Documentation StackTabs must display an explicit
Blade absence/deferred explanation, never an empty or aspirational example.

## 14. Migration, dependencies, bundles, and runtime performance

This is a complex controlled-breaking migration. It adds no dependency and no
ADR unless the measured bundle delta exceeds the approved ceiling. React,
Alpine, and Styles change together because semantics, events, markup, native
progress, focus styling, and public selectors all change.

Synthetic timers, timer cleanup, autonomous list state, `uploadDuration`,
`defaultItems`, `onFiles`, `onChange`, `doneLabel`, `removeLabel`, Alpine
`defaultItems`, Alpine `updateItems`, `lyra:files`, `lyra:change`, and
`x-modelable="dragging"`, and `.lyra-upload__bar-fill` are removed. No
compatibility shim retains synthetic success. The implementation plan must
remove superseded tests and code before measuring the replacement.

The standalone React FileUpload and Alpine adapter entries must remain under
their existing absolute size-limit tripwires unless clean packed-artifact
measurement justifies a separately approved change. The complex-migration
ceiling is at most `+3,000` Brotli bytes per affected consumer entry, not a
target or automatic budget increase. React JavaScript, Alpine JavaScript, CSS,
and the Files and Data scenario are reported separately.

The immutable Phase 0 baseline is not overwritten. The implementation produces
versioned JSON and Markdown reports under
`docs/superpowers/baselines/lyra-v1/comparisons/file-upload/`, containing the
before and after revisions, packed checksums, exact commands, raw/minified/
Brotli bytes, metafiles, removed code, absolute and percentage deltas, budgets,
and result. If the existing exact baseline gate cannot accept a versioned
comparison without rewriting history, the implementation plan must extend the
tool to select an approved current reference while retaining the original
files. A budget is never raised merely to make the candidate pass.

Runtime measurement uses 100 controlled items, including 20 active attempts,
and at least 30 iterations in the pinned production Chromium fixture. Selection
intent dispatch, controlled progress reconciliation, cancel intent, retry
intent, confirmed removal plus focus recovery, and teardown each have a p95 of
at most 100 ms, a worst result below 250 ms, and no long task over 50 ms.

## 15. Verification and traceability matrix

### 15.1 Automated evidence

Stable acceptance scenarios run against React and Alpine where both adapters
claim the behavior:

| ID         | Scenario                                                     | Required evidence                    |
| ---------- | ------------------------------------------------------------ | ------------------------------------ |
| `DF-FU-01` | native selection and validation proposals                    | React and Alpine browser tests       |
| `DF-FU-02` | controlled state graph and no synthetic progress             | React and Alpine browser tests       |
| `DF-FU-03` | determinate and indeterminate native progress                | three-engine browser and axe tests   |
| `DF-FU-04` | retry creates a new attempt and rejects stale results        | React and Alpine conformance tests   |
| `DF-FU-05` | cancel, canceling race, canceled, and teardown               | React and Alpine conformance tests   |
| `DF-FU-06` | confirmed removal and post-commit focus fallback             | three-engine browser tests           |
| `DF-FU-07` | single-file atomic replacement and active rejection          | React and Alpine browser tests       |
| `DF-FU-08` | pending-intent idempotence                                   | React and Alpine browser tests       |
| `DF-FU-09` | native form synchronization and same-file reselection        | React hydration/browser tests        |
| `DF-FU-10` | SSR, hydration, and pre-hydration input preservation         | React 18 and 19 hydration fixture    |
| `DF-FU-11` | Alpine delayed init, reconnect, no-JS, and cleanup           | Alpine browser fixture               |
| `DF-FU-12` | announcements and 25 percent milestones                      | three-engine browser and axe tests   |
| `DF-FU-13` | themes, RTL, long names, zoom, reflow, forced colors, motion | visual and semantic browser fixtures |
| `DF-FU-14` | public types, exports, packaging, and consumer installs      | type/build/pack/consumer gates       |
| `DF-FU-15` | standalone, CSS, scenario bundle, and runtime budgets        | versioned comparison report          |
| `DF-FU-16` | React/Alpine classes, data states, operations, and outcomes  | parity/conformance fixture           |
| `DF-FU-17` | responsive, coarse-pointer, keyboard, focus, and overflow    | revision-bound workflow ZIP          |
| `DF-FU-18` | native no-JavaScript submission and delayed Alpine lifecycle | revision-bound workflow ZIP          |

Test-first work begins in:

- `packages/react/src/file-upload/file-upload.browser.test.tsx`;
- `packages/react/src/file-upload/file-upload.ssr.test.ts`;
- `packages/react/src/file-upload/file-upload.hydration.browser.test.tsx`;
- `packages/alpine/src/file-upload.browser.test.ts`;
- the affected Styles browser and parity fixtures.

The browser matrix is Chromium, Firefox, and WebKit. React compatibility runs
types, build, SSR, hydration, and representative browser behavior with both
React 18 and React 19. Hydration evidence must actually invoke hydration and
capture server markup, first client output, console/recoverable errors, DOM and
accessible relationships, focus, form values, announcements, and event counts.

### 15.2 Manual critical workflows

| ID          | Environment                                        | Workflow                                                                                         |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `DF-FU-M01` | Windows, current NVDA, current Firefox or Chromium | browse, hear validation, follow real progress, cancel, retry, complete, remove, and verify focus |
| `DF-FU-M02` | macOS, current VoiceOver, current Safari           | repeat the complete workflow with determinate and indeterminate progress                         |

Each record names the revision, operating system, browser, assistive technology
and versions, input method, expected and actual result, reviewer approval, and
local evidence ZIP. `DF-FU-17` and `DF-FU-18` each require a `PASS` in the
workflow ZIP for that same immutable deployment revision. Completion requires
one `PASS` for each of `DF-FU-M01`, `DF-FU-M02`, `DF-FU-17`, and `DF-FU-18`, one
revision, one immutable deployment, and successful
`evidence:file-upload:ingest` ingestion.

### 15.3 Required commands

The implementation plan may add focused commands, but it cannot omit applicable
repository gates:

```text
rtk pnpm --filter @lyra-ds/react run test:ssr
rtk pnpm --filter @lyra-ds/react run test:browser
rtk pnpm --filter @lyra-ds/alpine run test:browser
rtk pnpm --filter @lyra-ds/react run typecheck
rtk pnpm --filter @lyra-ds/alpine run typecheck
rtk pnpm --filter @lyra-ds/react run build
rtk pnpm --filter @lyra-ds/alpine run build
rtk pnpm run parity
rtk pnpm baseline:bundles --check
rtk pnpm --filter @lyra-ds/react exec attw --pack . --profile node16
rtk pnpm --filter @lyra-ds/alpine exec attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm
rtk pnpm --filter @lyra-ds/react exec size-limit
rtk pnpm --filter @lyra-ds/alpine exec size-limit
rtk node tools/docgen/generate.mjs --check
rtk node tools/docgen/alpine.mjs --check
rtk node tools/pack-smoke/pack-smoke.mjs
rtk node tools/smoke/smoke.mjs
rtk pnpm test
rtk pnpm test:browsers
```

## 16. Compatibility, release, and migration examples

The specification itself changes no package and receives no changeset. The
runtime wave gives `@lyra-ds/react`, `@lyra-ds/alpine`, and `@lyra-ds/styles`
coordinated controlled-breaking minor changesets. Compatible package ranges are
published together. Styles receives a real changeset because its public markup
and selectors change; it is not an empty bump.

Release notes and English and Portuguese FileUpload pages explain consumer
ownership of transport, controlled state, retry, cancel, stale results, form
semantics, and the Blade deferral. Compatibility guides receive the tested
Styles/React/Alpine ranges. No codemod is provided because choosing a transport,
abort policy, reducer, and retry behavior is a consumer product decision.

Before:

```tsx
<FileUpload
  uploadDuration={1800}
  defaultItems={existingItems}
  onFiles={startUpload}
  onChange={setItems}
/>
```

After:

```tsx
<FileUpload
  items={items}
  onSelect={handleSelection}
  onRetry={handleRetry}
  onCancel={handleCancel}
  onRemove={handleRemove}
/>
```

Before Alpine:

```html
<div x-data="lyraFileUpload({ uploadDuration: 1800, defaultItems })"></div>
```

After Alpine:

```html
<div
  id="attachment-upload"
  class="lyra-upload"
  x-data="lyraFileUpload({ items })"
  x-modelable="items"
  x-model="items"
  @lyra:file-upload:select="startUploads($event.detail)"
  @lyra:file-upload:retry="retryUpload($event.detail)"
  @lyra:file-upload:cancel="cancelUpload($event.detail)"
  @lyra:file-upload:remove="removeUpload($event.detail)"
></div>
```

The final docs replace these abbreviated migration shapes with complete working
React and Alpine/HTML examples.

## 17. Acceptance criteria and approval

The specification is approved when:

- [x] the P1 synthetic lifecycle is replaced by one consumer-controlled state
      and intent contract with no unresolved state, identity, or race decision;
- [x] React signatures, Alpine options/events/bindings, CSS classes/selectors,
      and adapter differences are exact and complete;
- [x] controlled-only ownership and native form participation have complete
      rationale and examples;
- [x] keyboard, focus, native semantics, announcements, responsive behavior,
      RTL, localization, zoom, forced colors, and reduced motion are objective;
- [x] React 18/19, three-engine browser, SSR, hydration, Alpine reconnection,
      no-JavaScript, automated accessibility, visual, parity, package, bundle,
      runtime, and manual evidence each have a stable scenario;
- [x] the immutable baseline and versioned comparison path preserve both
      historical evidence and enforceable current gates;
- [x] the migration names every removed API, coordinated package changeset,
      documentation update, and Blade absence boundary;
- [x] Table, DataTable, and FileManager remain boundary-only and the first
      implementation plan is limited to FileUpload;
- [x] the Lyra maintainer approves this document; runtime merge remains gated on
      accessibility-reviewer approval of `DF-FU-M01` and `DF-FU-M02`, passing
      `DF-FU-17` and `DF-FU-18` workflow ZIP results, and successful
      `evidence:file-upload:ingest` ingestion for one immutable deployment
      revision.

Once this document reaches `Approved`, the next artifact is a test-first,
FileUpload-only implementation plan. Production code must not begin before that
plan is reviewed.
