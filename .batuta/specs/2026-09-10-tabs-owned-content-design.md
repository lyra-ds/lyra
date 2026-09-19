# Tabs owned-content contract — selected design, 2026-09-10

**Status:** Implemented

Status: critical/controller selected after two independent GLM technical reviews and recorded adjudication. This is the exact contract for the bounded React high brief; Alpine implementation is a separate cycle. Task27 current actual example baseline is RED in all3 engines. The maintainer's incumbent V1 direction authorizes designing the correction; this document does not claim a separate human API approval or final family qualification. Batuta owns planning. Historical architecture03/04/05 remain normative references, not a Superpowers workflow.

## Problem, users and minimum scope
A consumer's Project summary is currently outside every named tab panel. Keyboard and assistive-technology users encounter empty focusable panels. Replace generated empty placeholders with explicit owned triggers and actual content. Keep existing horizontal automatic arrow activation, line/pills styling, controlled active/onChange ownership, React/Alpine/CSS adapters and current3 Reactconsumers. No new foundation, runtime dependency, generic collection framework, grid, drag/drop, deletion command, vertical mode, manual activation mode, lazy-loading framework, new visual variant or new docs demo. No Colima/Docker/config/service/remote/release action.

## Public React API candidate
Use one compound form with named parts, matching current root/subpath exports and docgen's exported-owner rule. No namespace aliases or second data-driven rendering API. Retain the harmless existing TabItem type unchanged for consumer-owned arrays mapped to parts; remove only TabsProps.items and automatic empty-panel generation. Required controlled active remains the application input. No uncontrolled/defaultActive/defaultValue surface is introduced; the existing useControllableState helper may be used in its controlled mode to honor the repository value-state convention, with no hand-rolled state owner.

```ts
import type {
  ButtonHTMLAttributes, ForwardRefExoticComponent, HTMLAttributes, ReactNode, RefAttributes,
} from 'react';
export interface TabItem {
  id: string;
  label: ReactNode;
  count?: number;
  icon?: ReactNode;
}
export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children' | 'role'> {
  active: string;
  onChange?: (value: string) => void;
  variant?: 'line' | 'pills';
  children: ReactNode;
}
export interface TabsListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children' | 'tabIndex'> {
  children: ReactNode;
}
export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'children' | 'id' | 'role' | 'type' | 'tabIndex' | 'aria-selected' | 'aria-controls'> {
  value: string;
  children: ReactNode;
  count?: number;
  icon?: ReactNode;
}
export interface TabsContentProps extends Omit<HTMLAttributes<HTMLDivElement>,
  'children' | 'id' | 'role' | 'tabIndex' | 'aria-labelledby' | 'hidden'> {
  value: string;
  children: ReactNode;
}
export declare const Tabs: ForwardRefExoticComponent<TabsProps & RefAttributes<HTMLDivElement>>;
export declare const TabsList: ForwardRefExoticComponent<TabsListProps & RefAttributes<HTMLDivElement>>;
export declare const TabsTrigger: ForwardRefExoticComponent<TabsTriggerProps & RefAttributes<HTMLButtonElement>>;
export declare const TabsContent: ForwardRefExoticComponent<TabsContentProps & RefAttributes<HTMLDivElement>>;
```
All four values and their Props plus unchanged TabItem export from root and existing tabs subpath. No new subpath/entry/dependency. Root ref now targets the neutral owning div; a ref/className/aria-label intended for the old tablist moves to TabsList. Root calls useId unconditionally and uses the supplied id when present, otherwise that SSR-safe generated identity; generated IDs use that prefix and collision-free encoding of the stable value, never collection index. Values are nonempty strings, unique per trigger/content pair in that root; spaces, Unicode and percent characters must not collide. Do not restrict callers to an invented id-safe subset. Part IDs and required roles/ARIA/tabIndex/hidden belong to Lyra; native classes/styles/event handlers and trigger disabled remain consumer inputs. Children inside content are opaque and never rewritten/cloned as action controls. Nested roots isolate context, collection, IDs and events. Parts outside a root are an explicit misuse error; no global fallback owner.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lyra-ds/react';
import { useState } from 'react';
export function ProjectTabs() {
  const [active, setActive] = useState('overview');
  return (
    <Tabs id="project-tabs" active={active} onChange={setActive}>
      <TabsList aria-label="Project sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity" count={2}>Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"><p>Project summary</p></TabsContent>
      <TabsContent value="activity"><p>Recent project activity</p></TabsContent>
    </Tabs>
  );
}
```

## Anatomy, state and semantic ownership
Root is a neutral div/context boundary marked data-lyra-tabs, with no tablist role or new visual CSS class. TabsList is the existing div.lyra-tabs[role=tablist], optionally lyra-tabs--pills. Trigger is the existing button.lyra-tab[type=button][role=tab], lyra-tab--active when selected, with existing icon/children/count span.lyra-tab__count. Content is a real div[role=tabpanel][aria-labelledby=matching-trigger-id][tabindex=0] containing the consumer's actual nodes. It has hidden only when inactive, and remains mounted so changing tabs does not destroy form state. No generated empty Content nodes. Trigger aria-controls resolves to the matching Content ID; content's accessible name resolves to its trigger. Trigger and content expose data-state=active|inactive. No aria-live or portal.

Rest outline: neutral root -> named list -> native trigger buttons; then actual content panels in consumer reading order. Line and pills alter only existing list classes. Ref targets are the corresponding actual nodes. Supply a meaningful label on TabsList when context does not already identify the set. Consumer content is responsible for its own heading/form/async semantics. Count is visible supplementary text; meaningful icon labels remain the consumer's native accessible-name choice. Existing appearance/tokens/forced-color/reduced-motion rules are retained. The narrowly scoped native-hidden visibility repair below is required by a fresh three-engine failure.

## Controlled values, interaction and focus decisions requiring review
The root has one application-controlled active value. Accepted user click or supported arrow/Home/End interaction requests onChange exactly once, preserving existing callback semantics; it never mutates active locally. Enter/Space use native button click, not a duplicate key handler. Default-prevented native consumer handlers veto Lyra's corresponding action. Trigger handlers run before the owning List default; List's own consumer handler also runs before its default. Do not intercept unrelated native form/content keys or nested Tabs events. RTL must mirror Left/Right based on the owning list's effective direction; Home/End remain first/last. Disabled, hidden, inert or otherwise nonfocusable buttons never become navigation destinations; disabled buttons never activate. Eligibility is checked within the current owning list, including inherited hidden/inert presentation. No component readOnly mode; application controls active and may disable individual triggers.

For valid active/pair input, selection/panel visibility and IDs derive during render and SSR without DOM registration. Native Tab enters the selected enabled trigger, then reaches its real panel/content; hidden panels never participate. Arrow navigation uses the current owning list DOM order of enabled triggers, including reorder/removal, not a stale registration array or document-global selector. No render-time mutation of collection/context to make SSR appear to know DOM registrations.

Invalid-value policy: stop silently treating an unrelated first value as the selected application value. Selection and hidden always derive independently from exact part-value equality with active. With no matching declared value, SSR and the first client render have every trigger aria-selected=false/tabindex=-1 and every content hidden. The first client commit sets the first eligible enabled trigger as the native Tab entry, without selecting it or emitting onChange. The server never consults DOM registration, clamps, or throws merely for a nonmatching active; hydration starts with identical per-part output. A valid selected trigger is the entry when eligible; if selected but disabled/hidden/inert, the selected content remains readable and the first other eligible trigger becomes the client entry. All-disabled/ineligible input has no interactive trigger Tab stop. SSR selection has the same per-part output but cannot infer eligibility from computed styles or other descendants; client entry normalization is an explicit post-hydration enhancement.

Unique nonempty paired values remain the consumer composition precondition. Duplicate or unpaired composition is unsupported: parts still emit their own deterministic equality-based markup and IDs, so duplicate IDs/ambiguous ARIA are possible and are not advertised as validated or repaired. There is no first-wins normalization or new development logger. Parts missing their root have a separate explicit missing-owner error. An application removing the active pair should update active to a surviving pair in the same state change. External prop changes never echo onChange.

If a focused trigger or focused owned panel is removed while the root survives, repair focus to the selected enabled surviving trigger, else first enabled trigger, else the list as a programmatic fallback. Do not steal focus if it has already moved to a live outside target. Removing the entire root does not focus detached nodes or install a global restoration owner. Reordering retained nodes preserves focused identity and IDs. No deletion-key API. These local lifetime requirements may use owned refs/commit effects; no MutationObserver/polling or generic focus manager is justified.

| Current state/input | Action and cancellation | Result, focus, notification |
|---|---|---|
| Valid selected pair | Native click/Enter/Space, consumer not prevented, enabled | One requested value; parent update drives selected/hidden; native focus preserved |
| Valid pair | ArrowLeft/Right/Home/End, consumer not prevented | Current enabled DOM order, wrap, RTL mirror, focus target, one onChange request |
| Any | Consumer prevents native default | No Lyra focus/selection/callback effect |
| Any | Disabled trigger activation | No callback or navigation to disabled target |
| Controlled parent ignores request | Same user interaction | Props and panel selection unchanged; do not fabricate acceptance |
| Parent changes active | Valid matching pair | Render new selected/visible state; no callback echo, no forced focus transfer from outside |
| Parent supplies invalid active | Candidate behavior above | Deterministic no-selected/hidden SSR and initial hydration; client commit supplies first eligible Tab entry for explicit user recovery |
| Reorder | Same stable values | IDs and content identity retained; next navigation follows live DOM order |
| Focused owned node removed | Root survives | Local focus fallback after commit only when focus was lost, no selection echo |
| Root unmount | Teardown | Release own refs/listeners, no stale focus or callbacks |
| Loading/error/async consumer content | Consumer work | Consumer owns states/retry/live regions; Tabs does not simulate them |
| Reduced motion/forced colors | Existing environment styles | Same state/focus behavior; no new timers or animations |

## Alpine and static CSS candidate (separate implementation cycle)
The exact public option/detail type declarations are:
```ts
export interface LyraTabsOptions { active: string; }
export interface LyraTabsChangeDetail { value: string; previousValue: string; }
```
Export LyraTabsChangeDetail alongside the existing option type; no new runtime entry. Preserve lyraTabs({ active: string }), active state, list/tab/panel bindings, existing classes and supplied native IDs. The normative defaultValue and example new CSS names are illustrative, so no unnecessary rename or classes. Add ready=false and fallback binding; ready is adapter-owned output, not consumer-set state. Root data-lyra-tabs owns exactly one list and matching stable nonempty data-value trigger/panel pairs; queries exclude nested roots. Keep current supplied-ID preference; generated pair IDs must be value-stable and collision-free.

Required server markup: root x-data="lyraTabs({ active: 'overview' })" data-lyra-tabs; visible nav[data-lyra-tabs-fallback][x-bind="fallback"] with native href links to every real headed section; enhanced existing .lyra-tabs[data-lyra-tabs-enhanced][x-bind="list"] statically hidden, native button[data-value][x-bind="tab"] children; real section[id][data-value][x-bind="panel"] with headings, no static hidden/tab role/state before initialization. Existing class styles provide appearance; the required scoped hidden repair keeps this statically hidden flex list concealed even before Alpine starts. No JS or failed/missing initialization leaves navigation and every headed section usable; the enhanced list remains hidden. No x-cloak that conceals fallback content.

The adapter initializes ready=false, validates one owning list, unique paired values/IDs and a valid active target, registers bindings, then commits ready=true only after setup succeeds. At that successful transition, hide fallback, reveal named tablist, synchronize all aria-selected/tabindex/data-state/hidden and ID links in one completed update before user-visible frame. Failure retains ready=false and restores/unsets any adapter-owned enhanced attributes, preserving server content/IDs. Do not claim assignment to ready alone proves atomic DOM state: controller must observe the actual transition. Destroy cancels only owned scheduled work and restores fallback visibility/unenhanced content/attributes so stale initialization cannot re-hide content. No broad observer.

Bindings: fallback controls hidden=ready. List hidden=!ready, role=tablist only ready. Tab role, aria-selected/controls/tabindex/data-state/active modifier apply only ready, native button type remains. Panel role/aria-labelledby/tabindex/data-state/hidden apply only ready; before ready it remains an ordinary headed section. Public state attributes match React active/inactive semantics. Application writes of active are inputs, not user-change events.

Alpine keyboard parity is required: native Enter/Space click, current owning-list eligible enabled DOM order, wrap, Home/End and effective-direction Left/Right mirroring, excluding nested roots. Disabled/hidden/inert targets cannot be activated. List and trigger native consumer prevention runs before Lyra's default; prove this in actual Alpine binding ordering. A native event already defaultPrevented emits no custom before-event and causes no Lyra focus/state effect.

Domain cancellation/event mapping: accepted native activation first emits lyra:tabs-before-change with detail { value: string, previousValue: string }, bubbles/composed/cancelable=true, before focus or active mutation. Preventing it aborts focus movement, active/DOM changes and the result event. Otherwise perform the applicable navigation focus, write active, then emit lyra:tabs-change synchronously once in that interaction task with identical detail, bubbles/composed, cancelable=false. The result observer sees the committed active property and payload; Alpine's reactive DOM bindings settle in their normal flush, so DOM-reading consumers use Alpine's next tick. This timing is explicit and does not claim already-flushed DOM during the result callback. No queued result event, debounce or generic event framework. External active changes do not echo these events. React remains controlled: native-event cancellation plus onChange requests, without a second cancellation callback.

## Proven native-hidden repair
Controller baseline on current compiled Alpine/styles reproduces all three engines: an inactive bound panel with hidden=true and consumer display:flex remains 21px tall; a native hidden button.lyra-tab remains 39px tall. Zero page errors; source driver and results are MAIN .batuta/runs/v1-tabs-hidden-native/. This justifies a CSS-first correction, not a global reset or inline consumer-style override.

Append one documented additive rule in navigation.css covering existing .lyra-tabs[hidden], .lyra-tab[hidden] and [data-lyra-tabs] [hidden], with display:none!important. The existing lyra-tab additive ownership already covers the grouped declaration under the actual parity algorithm; do not modify the parity algorithm, handoff or baseline. This restores ordinary hidden semantics only for existing Tabs controls and marked owned subtrees, including the Alpine fallback/list and flex/grid content. Consumer !important rules deliberately defeating this contract are unsupported. No new class/token/stylesheet or runtime style override. Add a Styles patch changeset; new React/Alpine contract requires the corrected Styles release (earliest pre1 floor0.5.1, or the combined later release containing this change). The CSS visibility correction is additive and compatible with older adapters; older adapter logic is not claimed to satisfy the new keyboard/fallback contract.

## Responsive, locale, async and accessibility boundaries
Retain existing list reflow/overflow, styles, token ownership and responsive behavior; measure actual current examples at375/1280 light/dark, long labels/counts, RTL,200/400 percent zoom, reduced motion and forced colors. Do not invent stylesheet changes from inspection alone. Native buttons preserve keyboard/touch semantics; any44 px touch-guideline finding in existing styles is tracked separately, not silently fixed or called WCAG failure. All new docs English. Existing labels and real panel text remain consumer content. Tabs owns no data loading, cancellation of application panel work, announcements or empty-domain placeholder. Switching tabs preserves mounted panel subtree state. React has deterministic valid-input SSR/hydration; interactive React switching requires hydration. Static/Alpine fallback is the explicit no-JS path; do not claim unsupported React no-JS switching works.

## Compatibility, migration, size and delivery slices
Current React/Alpine0.5.0 and current Styles0.5.x are the baseline. Candidate first correction release is the next0.xminor0.6.0 if published before stable; stable1.0.0 must contain the corrected contract. This declares an earliest removal target, not a version command or scheduled publication. Existing supported React18/19 and Alpine peer ranges remain unchanged; final exact packed matrix is required. New React parts reuse current Styles selectors and require the corrected Styles hidden rule described above. No new runtime dependency is introduced. Older React cannot render new parts; older Alpine lacks ready/fallback and must not be paired with the new enhanced markup. Static CSS fallback remains usable without an adapter.

React removal: items-to-generated-empty-panels is unsafe P1 and cannot coexist as a shim. Keep safe TabItem data type; migrate data arrays by mapping explicit TabsTrigger and TabsContent around the consumer's actual panels. Move old tablist ref/className/label to TabsList. Manual migration because choosing real panel content, stable identity and fallback is a product decision; no speculative codemod. The breaking0.xminor changeset/release note must explicitly name the project SemVer exception, unsafe-empty-panel coexistence rationale, earliest removal0.6.0 (or stable1.0.0), source/markup and invalid-value impacts, Styles compatibility floor, and manual migration. No version or publishing command is authorized. For stable releases later, normal deprecation rules apply; this is the explicit pre1 unsafe-contract correction path.

React slice: tabs.tsx/browser/SSR, tabs/index.ts and rootindex, current docs line/pills-and-counts and current site component-showcase, React minor changeset, packages/react/package.json only for the Tabs size entry name/import (all four parts, same 1.5 kB numeric cap), controller-generated props.json/llms.txt. Include packages/styles/components/navigation/navigation.css and a Styles patch changeset for the proven native-hidden repair. No new entries, classes, generator edits or framework. Docgen supports each named part through existing ownerCategory fallback; new exported XProps must have corresponding X export. If inventory/statistics checks identify public part counting impact, scope that evidence-backed update explicitly before editing it. Public MDX migration follows separately. Alpine slice: current tabs.ts/browser tests, Alpine minor changeset, packages/alpine/src/index.ts for the new detail type export, generated Alpine catalogs via their owner, plus separate MDX/server before/after migration. The React slice delivers the shared scoped CSS hidden repair first; Alpine uses that corrected stylesheet. No further CSS changes are authorized.

Size is a complex owned-content migration; measure exact current standalone Tabs and affected site/docs scenarios against unchanged baseline and the05 quality pipeline. No budget/hash update here. Current global Task10 overages remain open. A part/ref implementation must justify its actual measured cost; no new library is authorized by a complexity allowance.


### Concrete migration shapes
The React ProjectTabs example above is the replacement for this unsafe old shape (manual migration because content is a product decision):
```tsx
<>
  <Tabs items={[{ id: 'overview', label: 'Overview' }]} active="overview" />
  <p>Project summary</p>
</>
```
The static/Alpine replacement keeps existing class and option names. This is the exact candidate successful/fallback structure, not a claim that every current Alpine example already has it:
```html
<div id="project-tabs" data-lyra-tabs x-data="lyraTabs({ active: 'overview' })">
  <nav aria-label="Project sections" data-lyra-tabs-fallback x-bind="fallback">
    <a href="#project-overview-panel">Overview</a>
    <a href="#project-activity-panel">Activity</a>
  </nav>
  <div class="lyra-tabs" aria-label="Project sections" data-lyra-tabs-enhanced x-bind="list" hidden>
    <button id="project-overview-tab" type="button" class="lyra-tab" data-value="overview" x-bind="tab">Overview</button>
    <button id="project-activity-tab" type="button" class="lyra-tab" data-value="activity" x-bind="tab">Activity</button>
  </div>
  <section id="project-overview-panel" data-value="overview" x-bind="panel">
    <h2>Overview</h2>
    <p>Project summary</p>
  </section>
  <section id="project-activity-panel" data-value="activity" x-bind="panel">
    <h2>Activity</h2>
    <p>Recent project activity</p>
  </section>
</div>
```
Before enhancement, links/sections are native readable content and all enhanced controls hidden; after ready, the existing bound list/buttons/panels acquire the selected semantic state. Migrate unsafe detached content or permanently hidden inactive server panels into these real headed sections; do not fabricate panels. If Alpine is destroyed while the root survives and focus is on a soon-hidden enhanced button, return focus to its matching native fallback link (else the first fallback link). Preserve focus in a live panel that remains visible; root removal never targets detached elements. No new modal return-focus owner.

Measurement precision: a new compound root alone is not a complete usable Tabs control. Its standalone size fixture must include Tabs plus TabsList/TabsTrigger/TabsContent, keeping the existing numeric cap. Record that import-shape adjustment and compare old complete data-only Tabs against new complete parts with the same pipeline; never claim a smaller tree-shaken root alone proves a whole-family saving. Any existing consumer fixture still using the removed items surface must be discovered before the implementation scope is frozen.

## Required evidence and approvers
Before implementation: controller selects exact invalid/SSR/focus and Alpine event/ready decisions, independent GLM reads this whole candidate plus original normative clauses, records concrete findings, and the controller adjudicates. No human reapproval is presumed needed for ordinary incumbent implementation already authorized, but this record must not invent approval that was not given.
Before each commit: current source browser3 engines/SSR/types/native actualconsumer/negative proofs, exact root/subpath/part types and native props, generated catalogs and inventory checks, preserved styles/classes/consumer effects, scoped lint/format/build, independent review. Runtime/source baseline must turn RED then current GREEN for real panel ownership. Test native Tab/ShiftTab, arrows/Home/End/RTL/disabled/cancellation/ignoredcontrolledrequest, live reorder/removal/nestedroots, stableIDs, realcontent/formstate and SSR/hydration. Alpine must separately prove noJS, absent/failed initialization, ready transition, before-event veto, accepted events, supplied/generated IDs and destroy restoration. Final packedLinux/React18/19/security/consumer/visual/manualAT/size and the23-cell ledger remain unqualified until bound to final artifacts. No task in this design claims all of V1 is done.

## Controller scope inventory before design review
A direct current source search across apps/packages/tools confirms the same three public React consumers plus the two Tabs source test files; docs component-page/guide-page have unrelated local functions named Tabs and must not be rewritten. No Tabs consumer was found in the current bundle-baseline/pack-smoke/smoke/react-compat sources. The current size entry is packages/react/package.json:1261-1269, path dist/tabs.js, import { Tabs }, cap1.5 kB, React/ReactDOM ignored. Only its family import/name must change with the new parts, never its numeric cap. Docgen already uses ownerCategory fallback for exported parts, but validates each exported XProps has an exported X. All new code remains in the current Tabs owner and current three consumers.

## Initial review disposition
Seven precision findings are resolved above: deterministic invalid SSR, disabled-selected entry, Alpine RTL/eligibility, focus veto, native-before-custom precedence, useId fallback and explicit SemVer exception. Duplicate-pair normalization and a failed-init development logger are declined with the reasons preserved verbatim in .batuta/runs/2026-09-10-tabs-owned-content-design.review.md. Failed initialization remains observably ready=false with usable native fallback and must never report success. Final independent review completed346.17s with3DONE/unchanged guard/verifierPASS. Its five precision findings are adjudicated in .batuta/runs/2026-09-10-tabs-owned-content-design-final.review.md and resolved or explicitly declined below. No release qualification claimed.

## Final review precision — selected before implementation
Entry normalization is a per-commit invariant for this React root/parts, not a one-time initialization: recompute selected-eligible else first-eligible after active/disabled/hidden/inert/structure updates committed by React, and recheck live eligibility at each owned keyboard interaction. External CSS-only changes without a React commit or owned event are not an observed synchronization channel; no arbitrary style observer/polling is claimed. SSR and first hydration still use deterministic per-part equality before that client normalization.

Alpine click/keydown defaults belong to the owning list's bubble handling so native consumer trigger and list prevention can run first; resolve the closest owned trigger and exclude nested roots. Actual same-element Alpine consumer ordering must be proved, not inferred from DOM bubble ordering. After consumer guards, recognized owned navigation keys prevent native default before custom before-change dispatch. Its veto then cancels only Lyra focus/state/result effects, while preventing unwanted Home/End scrolling. React recognized navigation similarly prevents native default only after the consumer veto guards.

Alpine paired trigger/section structure is complete before initialization and structurally static for that enhancement lifetime. Replacing pairs requires corrected markup and reinitialization, no new refresh API or broad observer. Valid external active input updates bindings without user events. Invalid external active input restores fallback until a valid input revalidates the existing declared structure; a failed structural setup requires correction and reinitialization rather than promising automatic discovery of injected pairs.

An unsupported unpaired React Content still emits the deterministic expected matching-trigger ID from root prefix and value, even if that node does not exist. No empty/omitted normalization or first-wins promise. This is defined output, not validated accessible composition.

## Evidence-backed inventory scope extension
Initial built declarations correctly expose81 exported Props interfaces; the historical78Props guard fails. Add only tools/docgen/generate.mjs count/history, apps/site/scripts/landing-sections.test.mjs documentedComponents expectation and controller-generated apps/site/lib/generated/stats.json. Strict guard/owner/category/extraction logic and78-family/CSS/catalog prose remain intact. Native failures in initial high delivery require one same-lane retry; no API expansion.

Composition precision: React supports exactly one TabsList per Tabs root; a nested root owns its own list. Caller-supplied root id follows the native unique non-whitespace ID contract; generated useId and encoded part values preserve valid wiring. No multi-list mode or extra composition validator is selected.

## Alpine listener-boundary precision selected after actual mechanism proof
The selected consumer-veto contract requires list-owned defaults to run after native trigger and list consumers. Actual Alpine3.15.12 probe24/24 (three engines, click/keydown, consumer directive before/after x-bind, native listener added after init, and no-veto controls) shows list x-bind listeners run before the list consumer, while the owning root bubble listener sees defaultPrevented correctly. Therefore implement these list-owned defaults on a native listener attached to the owning root, resolving only the target in its one owned list. Remove listener on destroy, reject nested ownership, keep all events synchronous. The list remains the semantic/tab-order owner. This replaces the overly specific earlier physical "owning list bubble" placement without weakening the public order, changing public bindings or adding async scheduling/observer/global manager. Initial probe's four macOSWebKit key cases missed a plain button without explicit tabindex; corrected probe uses tabindex=0 matching real tab controls. No Lyra product behavior is claimed from that mechanism-only probe.

Required static sections already have native IDs for fallback links; generated ID coverage applies to a missing root and/or trigger IDs, with value-stable encoded suffixes. Preserve valid supplied native IDs. The imported current Blade Tabs snapshot lacks the new required fallback markup and stays explicitly unqualified; no snapshot regeneration or compatibility claim is part of this runtime slice.

## Native panel-container teardown precision — 2026-09-10
Actual public-snippet proof found that removing the enhanced section tabindex loses focused panel-container focus in all three engines. On destroy of a connected root, a focused owned panel container returns to its matching eligible native fallback link, else first eligible fallback link, like the focused enhanced trigger. Native focusable descendants within visible panels and live outside targets retain focus. Ordinary fallback sections retain no enhancement-only tabindex or role. This bounded correction refines the earlier general live-panel-focus statement; no new API or generic restoration owner. See .batuta/v1-tabs-panel-teardown-diagnosis.md.
