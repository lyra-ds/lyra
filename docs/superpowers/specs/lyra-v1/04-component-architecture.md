# Lyra v1.0 component architecture

**Status:** Draft

**Date:** 2026-08-12

**Owner:** Lyra maintainers

**Scope:** Package responsibilities, public component APIs, composition,
adapter equivalence, external-primitive isolation, server rendering, API
lifecycle, and versioning for `@lyra-ds/styles`, `@lyra-ds/react`, and
`@lyra-ds/alpine` in Lyra v1.0.

**Governing PRD:**
[Lyra v1.0 roadmap PRD](../2026-08-12-lyra-v1-roadmap-prd.md)

## Decision summary

Lyra v1.0 MUST expose Lyra-owned contracts through a CSS visual core and
stack-appropriate React and Alpine adapters. Public
[parity](./README.md#shared-vocabulary) means equivalent observable semantics,
states, operations, and outcomes for every adapter that claims support; it does
not require identical source, dependencies, or catalog coverage. React MUST
remain compatible with React 18 and 19. Server-rendered content MUST be
deterministic and useful before enhancement wherever a CSS or server-rendered
baseline is claimed. External primitives MUST remain replaceable behind
internal Lyra adapters.

The three packages MUST use independent SemVer version numbers. A change to a
shared contract MUST coordinate the affected releases and migration record, but
an unaffected package MUST NOT receive an empty lockstep version bump. The Lyra
v1.0 suite MUST NOT be declared released until each package has independently
published `1.0.0` and the public support matrix identifies compatible package
ranges.

## Package and responsibility boundaries

The ownership levels and entry and exit rules in the
[design and product principles specification](./01-design-product-principles.md#ownership-levels)
determine whether a unit is a primitive, design-system component, or domain
component. Moving an implementation between native HTML, Lyra-owned
infrastructure, and an external primitive MUST NOT change that public ownership
level by itself.

| Package           | Public responsibility                                                                                                                                         | Boundary                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `@lyra-ds/styles` | It MUST own the canonical token graph, `.lyra-*` classes, documented markup outlines, responsive presentation, and visual representation of semantic states.  | It MUST remain usable without React, Alpine, or JavaScript. It MUST NOT simulate behavior or make an adapter's private DOM a CSS requirement. |
| `@lyra-ds/react`  | It MUST own typed React components, React composition, state wiring, refs, events, providers, and React-specific lifecycle behavior over the Styles contract. | It MUST NOT own visual values, require consumer access to internal helpers, or expose a primitive vendor's API.                               |
| `@lyra-ds/alpine` | It MUST own opt-in Alpine initialization, state transitions, bindings, cleanup, and custom events for supported server-rendered markup.                       | It MUST NOT become the source of semantic HTML or appearance and MUST NOT require React or a shared React runtime dependency.                 |

The Styles package is the visual source of truth. React and Alpine MUST emit or
enhance the required `.lyra-*` classes and documented semantic states instead of
reimplementing appearance. They MUST consume semantic or approved component
tokens according to the
[tokens and visual-language specification](./02-tokens-visual-language.md#token-tiers).

### Public and internal modules

A package's `exports` map and public documentation MUST be the authoritative
module boundary. A documented root export, component subpath, stylesheet,
token subpath, type, CSS class, data attribute, Alpine registration name, or
custom event is public. A source path that is not exported and documented is
internal even when a build tool can resolve it.

- React MUST provide named root exports and tree-shakable component subpaths.
  The root and a component subpath MUST resolve to the same implementation and
  types for a given package version.
- Styles MUST keep its canonical stylesheet, documented token subpaths, and
  explicitly opt-in compatibility stylesheets exported. Importing the canonical
  stylesheet MUST NOT import `compat-shadcn.css`.
- Alpine MUST expose its documented root plugin and Lyra-owned option and data
  types. Any future subpath MUST pass the same lifecycle and SemVer policy before
  becoming public.
- `src/internal`, unexported vendor adapters, focus helpers, portals, presence
  helpers, and test utilities MUST remain private. Documentation and examples
  MUST NOT instruct consumers to deep-import them.

Removing or renaming a public subpath is a package breaking change. Adding a
subpath is compatible when it does not change existing resolution. An internal
path MAY change in any release only when no documented public DOM, state,
behavior, or type changes with it.

### CSS markup contract

Every component-family specification MUST identify:

- the required `.lyra-*` root, part, and modifier classes;
- the semantic HTML outline and which nodes consumers or Lyra own;
- the public `aria-*`, native, and `data-*` state attributes used by selectors;
- which attributes are inputs, Lyra-managed outputs, or both;
- the applicable semantic, component, theme, brand, direction, motion, and
  forced-color tokens; and
- which structural wrappers, portal hosts, generated IDs, and measurement nodes
  are private.

Required Lyra classes MUST remain present when a consumer adds classes. Public
state selectors MUST represent the same semantic state across React, Alpine,
and server-rendered markup. A family spec MAY permit stack-specific extra nodes,
but consumers MUST NOT need those nodes to obtain the approved appearance or
behavior.

An adapter MAY implement behavior differently when it preserves the approved
observable contract. That contract consists of semantic HTML and accessible
relationships, state names and transitions, keyboard and pointer operations,
focus and layer outcomes, cancellable operations, emitted events or callbacks,
required classes and public data states, async outcomes, and the declared SSR
and no-JavaScript baseline. Source structure and dependency choice are not parity
requirements.

## Accessibility conformance gate

WCAG 2.2 Level AA MUST be the baseline and release gate for every component and
adapter across all claimed states, themes, input methods, browsers, and
assistive-technology support. A known WCAG 2.2 Level AA violation MUST NOT be
hidden, filtered, allowlisted, silenced, or otherwise suppressed in a helper,
test, report, support matrix, or release record. Missing evidence MUST NOT be
recorded as a pass.

Automated results MUST supplement rather than replace the keyboard, focus,
zoom, reflow, forced-colors, and manual browser and assistive-technology evidence
required by the
[interaction and accessibility specification](./03-interaction-accessibility.md#supported-browser-and-assistive-technology-matrix).
A component, adapter, primitive adoption, or release MUST NOT pass its
architecture gate while a known Level AA violation remains in accepted output
or a required browser or assistive-technology result is missing.

## React public API contract

### Native props and deliberate conflicts

A component that owns one primary native element MUST inherit the appropriate
React native-attribute interface for that element and forward applicable
`aria-*`, `data-*`, and native attributes to it. A Lyra prop that deliberately
changes a native name or type MUST first omit that native key and MUST document
the conflict. For example, a visual `size` on an input or rendered `title`
content MUST NOT accidentally preserve the incompatible native definition.

Rest props MUST be applied before Lyra-controlled semantics, class names, refs,
IDs, and composed handlers so a consumer cannot silently invalidate the
approved contract. A prop MUST NOT be accepted merely because it can be spread;
the component's TypeScript signature and documentation MUST identify the native
element that receives it.

### Refs and DOM ownership

Every component that owns a meaningful primary DOM node MUST forward its ref to
that node with `forwardRef`. React 19 ref-as-prop MUST NOT replace this pattern
while React 18 remains in the peer range. A compound part MUST forward a ref to
the element that owns that part's documented semantics.

A component with no single meaningful node MUST NOT invent a wrapper solely to
provide a ref. Its family spec MUST either assign refs to named parts or state
that the root has no ref. A change to the node receiving a stable ref is a
breaking change unless the old and new nodes are observably equivalent for the
documented ref uses.

Consumers own content and application refs; Lyra owns the semantics, IDs,
required relationships, and internal measurement refs promised by the
component. Composing refs MUST preserve both owners. Generated IDs MUST use a
React hydration-stable mechanism such as `useId()` and MUST NOT derive identity
from labels, children, time, randomness, or collection position.

### Controlled, uncontrolled, and read-only state

A stateful React API MUST use a consistent triad such as `value`,
`defaultValue`, and `onValueChange`, or `open`, `defaultOpen`, and
`onOpenChange`. A value other than `undefined` MUST mean controlled. Controlled
state MUST be derived from the prop, MUST NOT be mutated internally, and MUST
reflect a requested next value only after the owner supplies that value through
the controlled prop and the corresponding render commits. After Lyra accepts a
controlled interaction, it MUST invoke the state callback with the requested
next value without presenting that value as current state. Uncontrolled state
MUST use the default only for initialization and MUST then be owned internally;
after accepting an uncontrolled interaction, Lyra MUST enqueue the internal
state update and notify the callback with the same next value.

A component MUST NOT switch between controlled and uncontrolled ownership
during one mounted lifetime. Development builds SHOULD diagnose such a switch.
The callback for a value-shaped state MUST receive the next value, not a native
DOM event. Invoking that callback MUST NOT imply that a React render has
committed or that DOM, ARIA, focus, or other observable semantics already
reflect the next value. If a family requires a post-commit notification, its
spec MUST define a separate callback or event with explicit timing, payload,
at-most-once behavior, and adapter mapping; it MUST NOT reuse the common state
callback for that purpose. When the public contract inherits a native event such
as input `onChange`, the implementation MUST derive the next value from that
event and forward the original event separately.

Read-only is an interaction permission, not a third state-ownership mode. A
read-only component MUST reflect controlled prop updates and its existing
uncontrolled value, but user operations MUST NOT commit a value change. It MUST
preserve the read-only semantics, selection, reading, focus, and presentation
defined by the interaction specification. Disabled and read-only MUST NOT be
treated as interchangeable.

### Composition model

A component whose consumers own meaningful structure or arbitrary content MUST
prefer a compound API with named parts. Tabs, dialogs, menus, fields, and other
patterns in which content placement determines semantics MUST expose real
consumer content through parts rather than manufacture empty or detached
regions. The compound root MAY coordinate IDs and shared state, but each part
MUST retain an explicit semantic responsibility.

A bounded collection MAY use a data-driven API when every item has the same
known anatomy and the consumer benefits from declarative data. Every item MUST
have stable semantic identity independent of its array index. Selection,
expansion, focus, async results, and rendered keys MUST use that identity. A
data-driven API MUST provide typed render or content fields for the approved
variation and MUST NOT grow into a monolithic substitute for consumer-owned
structure.

A family spec MUST choose compound, data-driven, or a deliberately limited
combination and explain the ownership boundary. Two forms that expose the same
capability MUST share state and acceptance cases rather than become divergent
APIs.

### Slots and `asChild`

A slot or `asChild` escape hatch MAY be exposed only when the consumer MUST own
the rendered element and Lyra's semantic responsibility remains explicit. It
MUST accept exactly one element, merge the consumer and Lyra refs, preserve
required Lyra classes, and document which element types satisfy the contract.
It MUST NOT make a `div` acting as a button, a button acting as a link, or an
otherwise incompatible element a supported path.

Consumer classes and inline styles MUST be merged after Lyra values so they can
extend the presentation, but required classes MUST NOT be removed. Consumer
event handlers MUST run before Lyra's cancellable default behavior. If the
consumer calls `preventDefault()`, the Lyra default MUST NOT run. Child handlers
and props MUST NOT silently erase required accessibility attributes, state, or
internal handlers.

`asChild` MUST NOT be added preemptively to every component. A family spec MUST
name the semantic use case, allowed element responsibility, ref target, prop and
handler merge order, invalid-child behavior, and test cases before exposing it.

### Event ordering and cancelation

For a native event that Lyra enhances into a state operation, ordering MUST be:

1. the consumer's handler receives the original event;
2. Lyra checks `defaultPrevented` for a cancellable default operation;
3. if not canceled, Lyra accepts the operation and determines the next value;
4. for controlled state, Lyra requests that value through the state callback;
   for uncontrolled state, Lyra enqueues its internal update and notifies the
   same value through the callback; and
5. observable semantics reflect the current state when the corresponding render
   commits, which for controlled state occurs only after the owner supplies the
   requested prop value.

`stopPropagation()` MUST retain its platform meaning and MUST NOT be repurposed
as state cancelation. A value callback such as `onOpenChange` reports the next
accepted value; it is neither a veto nor a post-commit signal. When a transition
needs an explicit veto independent of a native event, the family spec MUST
define a dedicated cancellable `onBefore*` contract and the corresponding Alpine
event. A canceled transition MUST NOT partially update state, focus, ARIA, data
attributes, or announcements.

Consumer and Lyra handlers MUST each run at most once per semantic operation.
Async completion MUST report the operation identity so late results, retries,
and cancellation cannot commit or announce the wrong attempt.

### Context and providers

A provider MAY be public only for genuinely shared contextual state that cannot
be passed coherently through the owning compound root, such as theme resolution
or an application toast queue. A provider MUST define its scope, nesting,
server default, hydration behavior, imperative surface, and error when a hook is
used outside the required scope.

Component-local state MUST remain in the component or compound root. A provider
MUST NOT become a hidden global registry, compensate for an unclear composition
model, or make unrelated instances share state. Provider values and callbacks
MUST preserve the React 18–19 contract without relying on React 19-only APIs.

### Error, loading, empty, and async lifecycle

A component that initiates or displays asynchronous work MUST expose the
applicable `idle`, `loading`, `success`, `error`, and `canceled` outcomes as
Lyra-owned public state. The family spec MUST define which layer owns the
operation, progress, cancellation request, retry, result identity, and stale
completion handling. Lyra MUST NOT simulate progress or success for work owned
by the consumer.

Loading MUST preserve task identity and applicable dimensions. Error MUST
preserve recoverable input and provide a correction or retry path. Empty MUST be
a meaningful content state, not missing markup, and MUST identify any available
next action. Success, errors, and progress MUST follow the announcement and
deduplication contracts in the interaction specification.

A callback that returns a promise MUST have an explicit rejection and
unmount/cancellation policy. The implementation MUST NOT swallow a rejection,
commit after an operation is obsolete, or move focus merely to announce an
outcome.

### React version support

`@lyra-ds/react` MUST retain the peer range `react >=18 <20` and the equivalent
`react-dom` range through Lyra v1.0. Public APIs and production code MUST use
APIs available in both React 18 and React 19. Release evidence MUST include a
React 18 and React 19 type, build, SSR, hydration, and representative browser
test leg.

A separate approved component-architecture change MUST precede any peer-range
change. That change MUST identify affected consumers, replacement APIs,
framework evidence, bundle impact, migration guidance, and the first permitted
major package version. A package installation warning or current development
version MUST NOT be used as evidence of compatibility.

## Alpine and CSS adapter contract

### Initialization and state reflection

Alpine behavior MUST be opt-in through documented `Alpine.plugin(lyra)`
registration and a stable `x-data="lyra<Component>(options)"` name. Options MUST
be Lyra-owned serializable values unless a documented callback is required.
Required semantic HTML, classes, names, values, and initial state MUST be
present in server markup rather than created only in `init()`.

An Alpine instance MUST initialize idempotently. Re-running its initialization
or reconnecting server-rendered markup MUST NOT duplicate listeners, observers,
timers, portals, focus guards, live regions, IDs, or announcements. Initialization
MUST reconcile the server state before enabling interaction and MAY add a
documented `data-lyra-enhanced` state after that reconciliation completes.

Every public component state MUST be reflected through the same native or ARIA
attribute and documented `data-*` state used by CSS and React. A required state
MUST NOT exist only inside an Alpine object. Alpine bindings MAY calculate
private values, but CSS and consumer automation MUST use the public Lyra state
contract.

### Custom events and transition order

An Alpine operation that maps to a React callback MUST dispatch a bubbling,
composed `CustomEvent` named `lyra:<component>:<event>` from the owning root.
Its `detail` MUST contain the stable component value or operation identity
defined by the family spec and MUST NOT contain an Alpine instance or vendor
object.

When a transition can be vetoed, Alpine MUST first dispatch a cancelable
`lyra:<component>:before-<transition>` event. If it is not canceled, Alpine MUST
commit state, update DOM semantics, and then dispatch the non-cancelable result
event. `preventDefault()` on the before event MUST map to React's `onBefore*`
cancelation. After events MUST be notifications and MUST NOT revert state when
canceled.

A family spec MUST provide an explicit mapping table between React props and
callbacks, Alpine options and custom events, and native, ARIA, or data state.
Equivalent events MUST have the same value meaning, cancelation point, and
accepted state transition even when their language-level shapes differ.

### Cleanup

An interactive Alpine component MUST provide lifecycle cleanup through Alpine's
supported destruction hook. Cleanup MUST remove document and window listeners,
observers, timers, pending animation work, temporary portal nodes, focus guards,
scroll locks, inert background state, and component-owned live regions. It MUST
release shared resources only after the last owning instance releases them.

Destroying during an async operation or layer transition MUST prevent stale DOM
updates and announcements. Reinitializing the same server-rendered root after
cleanup MUST produce one functioning instance.

### Progressive enhancement and server markup

CSS MUST present semantic server-rendered markup without requiring Alpine. A
server-rendered control MUST NOT appear actionable when its no-JavaScript action
cannot complete. The baseline MUST use native behavior, a real navigation or
form fallback, always-visible content, or an explicitly documented unavailable
enhancement state.

Enhancement MUST preserve content, accessible names, form submission semantics,
URLs, reading order, and the initial state. It MAY replace a baseline interaction
with the approved composite or layer behavior only after initialization. A
component that claims an Alpine or server-rendered baseline MUST document and
test both pre-enhancement and enhanced markup.

CSS alone MUST NOT claim keyboard, focus, dismissal, async, or state-machine
behavior that CSS cannot supply. Native pseudo-classes and public native, ARIA,
or data attributes MUST be the selectors for states whose semantics already
exist in markup. A class that only changes appearance MUST NOT be documented as
creating a semantic disabled, selected, invalid, expanded, or modal state.

### React, Alpine, and CSS equivalence

For every component, the public support matrix MUST use only these support
levels:

| Level           | Required meaning                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| CSS             | Documented semantic markup and appearance work without a JavaScript adapter.                                              |
| Alpine-enhanced | Server markup has the documented no-JavaScript baseline and Alpine supplies the approved interactive contract.            |
| React           | React owns rendering or enhancement and supplies the approved interactive contract.                                       |
| Unsupported     | The adapter does not claim the component contract; documentation MUST identify the user impact and supported alternative. |

An adapter MUST NOT be marked supported from appearance alone when the component
has required behavior. React and Alpine support MUST share the observable
semantics, states, operations, and acceptance fixtures defined by the family
spec. A documented difference MUST name the missing capability, reason, user
impact, fallback, evidence, and reevaluation owner.

A component MAY be React-only only when its approved family spec demonstrates
that the component depends on a React-owned composition or ecosystem contract,
that a meaningful Alpine or CSS contract is not feasible within v1.0, and that
the limitation does not violate the inclusion scorecard or a v1.0 product gate.
Its overview, API page, examples, package table, and public support matrix MUST
display `React only`; an Alpine registration or CSS behavior claim MUST NOT be
published for it. React implementation convenience alone MUST NOT justify the
limitation.

## SSR, hydration, and no-JavaScript behavior

This section owns the SSR, hydration, and no-JavaScript behavioral contract.
The
[quality and performance specification](./05-quality-performance.md#browser-ssr-and-flake-policy)
owns test method, execution, aggregation, and release evidence for that
contract.

React rendering and module evaluation MUST NOT access `window`, `document`,
layout, storage, media queries, time, randomness, or browser-only constructors
before a guarded client phase. The server and first client render MUST produce
the same semantic tree, IDs, state, attributes, and text for the same inputs.
Environment-derived values MUST use a deterministic server default and reconcile
after hydration without erasing user input or moving focus.

Portaled content MUST use a documented server strategy. It MAY render inline
and move after hydration, or remain out of the initial tree only when the server
baseline still exposes the content or a usable route to it. The first client
render MUST match the server. Moving a layer into a portal MUST preserve
accessible relationships, theme, brand, direction, event behavior, and logical
focus restoration.

Server-generated or consumer-provided IDs MUST remain stable through hydration.
Collection order MUST NOT be used as semantic identity. Hydration MUST NOT
duplicate live-region messages, replay a state transition as a new user event,
or open a layer solely because the client mounted.

Alpine markup MUST render its initial native, ARIA, data, and class state on the
server. Alpine initialization MUST reconcile rather than replace that markup.
No-JavaScript fixtures MUST verify content access, form or navigation fallback,
visible state, and the absence of dead controls. Progressive enhancement MUST
be tested with delayed initialization so the pre-enhancement state is not merely
theoretical.

A capability that cannot have a meaningful no-JavaScript fallback MUST say so
in the family spec and support matrix. Its server output MUST avoid a misleading
active control and MUST provide an alternate route when the capability is
required for a primary workflow.

## External primitive isolation

Radix, Base UI, React Aria, or another external primitive MAY be adopted only
through an unexported Lyra-owned adapter module. The adapter MUST translate
Lyra props, parts, state, events, refs, and layer behavior into the vendor API
and MUST translate the result back to the documented Lyra DOM and state
contract. Component modules MUST depend on that Lyra boundary rather than import
the vendor throughout the component family.

Public declarations, inferred exported types, callbacks, refs, option objects,
examples, and generated documentation MUST NOT name or structurally require a
vendor type. Vendor enums and event objects MUST be translated into Lyra-owned
types. Public-type checks MUST inspect emitted declaration files as well as
source annotations.

Vendor-specific DOM structure and `data-*` attributes MUST NOT be the documented
public API. When a vendor emits them internally, Lyra CSS, consumer examples,
support promises, and public conformance tests MUST use Lyra-owned classes,
attributes, and semantic relationships instead. Incidental vendor markup MAY
change without a Lyra breaking release only when the documented DOM, accessible
tree, focus behavior, selectors, and consumer-observable events remain intact.

Equivalent production responsibilities MUST NOT ship on simultaneous vendor
foundations. When an adopted primitive replaces Lyra focus, portal, presence,
dismiss, scroll-lock, or positioning infrastructure, the implementation release
MUST remove the superseded runtime path, exports, tests tied only to it, and dead
dependencies. A temporary spike MAY compare alternatives outside the production
entry, but the accepted implementation MUST have one owner and MUST NOT retain a
fallback implementation without an approved separate responsibility.

An architecture adoption decision MUST satisfy the canonical
[Quality budget and replacement requirements](./05-quality-performance.md#budgets-and-replacement-scope).
This specification owns the decision to adopt a primitive, the required
[ADR](./README.md#adr), vendor isolation, and replacement scope; it supplies
candidate-specific contract and ADR inputs. Quality owns the numeric thresholds,
measurement method and tooling, scenario definitions, evidence completeness and
validity criteria, execution, aggregation, and CI and release enforcement.

### External-primitive ADR evidence template

The shared [ADR definition](./README.md#adr) is canonical. This template owns
the architecture-specific decision record and inputs for external-primitive
adoption; it aggregates evidence whose measurement and validity requirements
are owned by Quality and does not create a second evidence owner.

Every adoption or replacement ADR MUST contain all fields below:

| Field                            | Required evidence                                                                                                                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract gain                    | Name the approved requirement the primitive satisfies better, the current failure, and the observable Lyra contract that remains unchanged or intentionally changes.                                                                                                                      |
| Rejected alternatives            | Compare native HTML, the existing Lyra implementation, and viable primitive candidates against the same requirements; record why each was rejected.                                                                                                                                       |
| Browser and assistive technology | Provide automated Chromium, Firefox, and WebKit results plus the applicable manual Windows/NVDA and macOS/VoiceOver scenarios and any required mobile evidence.                                                                                                                           |
| SSR result                       | Record server render, first-client-render, hydration, portal, generated-ID, and no-JavaScript results for the exact revision.                                                                                                                                                             |
| Standalone bundle delta          | Report the built component entry before and after under the [canonical Quality budget classification and limits](./05-quality-performance.md#budgets-and-replacement-scope), with externals, compression method, tool version, removed code, and budget or approved ADR-exception result. |
| Scenario delta                   | Report every representative application composition affected by the shared dependency and whether deduplication changes the total.                                                                                                                                                        |
| Removed code                     | List superseded Lyra files, exports, tests, dependencies, and byte totals removed; explain any retained responsibility.                                                                                                                                                                   |
| Migration impact                 | Identify public API, DOM, state, event, CSS, package, adapter, and documentation effects with before/after examples and the release plan.                                                                                                                                                 |

The ADR MUST identify the exact candidate and version, revision, measurement
commands, expected results, actual results, owner, and approval. Adoption MUST
NOT proceed when the gain is only reduced implementation effort, public types
leak, SSR or WCAG 2.2 Level AA evidence fails, a known violation is suppressed,
the bundle gate fails without an approved exception, or replaced infrastructure
remains duplicated.

## API lifecycle, versioning, and migration

### Stability guarantees

The [shared stability vocabulary](./README.md#shared-vocabulary) and the
[product stability model](./01-design-product-principles.md#stability-model) are
canonical. The guarantees below refine their source, package, and migration
effects for public APIs.

| Stability    | Guarantee                                                                                                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Experimental | It MUST be clearly labeled, governed by a `Draft` spec, and isolated in documentation and its export or name. It MAY change or disappear in any release, but release notes MUST identify the change. Consumers MUST NOT infer compatibility from package SemVer. |
| Beta         | It MUST be governed by an `Approved` spec and expose its incomplete evidence and known limitations. It MAY evolve in compatible package releases before stability, but every change MUST include release and migration notes.                                    |
| Stable       | It MUST be governed by an `Implemented` spec with current acceptance evidence and public documentation. Its source, type, DOM, CSS, behavior, adapter, and migration guarantees MUST follow the package SemVer rules below.                                      |
| Deprecated   | It MUST retain the guarantees of its last stable contract until its published removal version, while documentation, types, warnings where appropriate, replacement or rationale, and migration guidance identify the transition.                                 |

A component or API MUST NOT be stable merely because it appears in a stable
package. Experimental and beta surfaces MUST remain visibly distinct in editor
documentation, generated API references, examples, and the support matrix.

### Current package-version policy

`@lyra-ds/styles`, `@lyra-ds/react`, and `@lyra-ds/alpine` MUST be independently
versioned. This resolves the v1.0 version-policy decision; family specs MUST NOT
choose lockstep package versions. The current distinct versions are valid and
MUST NOT be normalized with empty releases. At this specification's date,
Styles and React are `0.4.2` while Alpine is `0.5.0`; these numbers are baseline
evidence for the independent policy, not versions frozen by this document.

Before a package reaches `1.0.0`:

- a patch release MUST remain backward compatible;
- a minor release MAY contain a controlled breaking change only when an
  approved spec, release note, affected-version list, and complete migration
  guide satisfy the roadmap migration policy; and
- each affected package MUST receive its own appropriate version change.

After a package reaches `1.0.0`, SemVer MUST apply to its stable public
contract:

- a patch MUST preserve the stable public contract and MUST NOT add a public
  feature or introduce an incompatible public API or behavior; it MAY contain
  backward-compatible fixes, documentation, internal refactors, build or test
  changes, and dependency updates that preserve that contract;
- a minor MAY add backward-compatible APIs, states, components, or adapters and
  MAY deprecate existing ones; and
- a major MUST identify any removal or incompatible source, type, package
  export, required markup, CSS selector, token, DOM/ref target, state, event,
  behavior, SSR, or adapter-support change.

A coordinated shared-contract change MUST release every affected package in the
same documented release window and MUST publish one compatibility and migration
record. Each package MUST receive the smallest SemVer increment required by its
own changed surface. An unaffected package MUST retain its version. The public
support matrix MUST list tested compatible ranges for Styles with React and
Alpine so independent versions do not imply arbitrary compatibility.

The Lyra v1.0 suite release MUST require `1.0.0` from all three packages and a
matrix demonstrating their mutual contract. Subsequent minor and patch versions
MAY diverge. A later suite-wide breaking program does not require every package
to bump major unless its own public contract breaks.

### Deprecation and unsafe removal

A stable deprecation MUST publish the first deprecated release, affected
packages and adapters, replacement or removal rationale, warnings where they do
not harm production behavior, before/after examples, and an explicit removal
version. After `1.0.0`, a safe deprecated contract MUST remain available for at
least one documented minor release and MUST NOT be removed before the next major
release of its package. Documentation MUST teach the replacement first while
keeping the old reference discoverable through removal.

An unsafe contract that violates an approved accessibility, security, data
integrity, or primary-workflow requirement MUST NOT be preserved solely to meet
the normal deprecation duration. Maintainer and applicable accessibility or
security review MUST record why coexistence is unsafe, the earliest safe release,
and the user impact. Lyra MAY correct unsafe runtime behavior in the next patch
or minor release when the public source and type surface remains compatible. A
source, type, export, or required-markup removal MUST still wait for a major
release unless retaining that surface necessarily preserves the unsafe outcome;
that exceptional earlier removal MUST be explicitly identified as a SemVer
exception in release notes and MUST include migration examples. Empty tab panels,
simulated uploads, and pointer-only row actions MUST follow this unsafe-contract
path rather than receive compatibility shims that preserve their failures.

### Codemods and migration examples

A breaking migration MUST provide a codemod when the change is a deterministic,
syntax-aware, semantics-preserving transform with no product decision required.
The codemod MUST be idempotent, preserve formatting and unrelated code, report
unhandled cases, cover supported TypeScript and JavaScript syntax, and include
fixture tests. Prop or import renames, subpath moves, and mechanically equivalent
JSX structure MAY qualify. Changes that require choosing content, focus,
fallbacks, stable identity, async ownership, or accessibility semantics MUST use
manual guidance and diagnostics instead of a speculative codemod.

Every affected adapter MUST have concrete before/after examples. For the
approved Tabs correction, the React migration record MUST show the consumer's
real panels moving from content detached from a data-only `items` control into
the compound parts, for example:

```tsx
// Before: the component creates empty panels; content lives elsewhere.
<>
  <Tabs items={[{ id: 'details', label: 'Details' }]} active="details" />
  <Details />
</>

// After: trigger and real panel content share one compound contract.
<Tabs.Root defaultValue="details">
  <Tabs.List>
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="details">
    <Details />
  </Tabs.Content>
</Tabs.Root>
```

The matching Alpine/CSS migration record MUST show equivalent server-owned
content and stable values:

```html
<!-- Before: the generated or detached panel has no owned content relationship. -->
<div x-data="lyraTabs({ active: 'details' })" class="lyra-tabs">
  <button type="button">Details</button>
</div>
<section>
  <h2>Details</h2>
  <p>Workspace details</p>
</section>

<!-- After: semantic triggers and real panels exist in server markup. -->
<div x-data="lyraTabs({ defaultValue: 'details' })" class="lyra-tabs" data-lyra-tabs>
  <div role="tablist" class="lyra-tabs__list">
    <button type="button" role="tab" data-value="details">Details</button>
  </div>
  <section role="tabpanel" data-value="details" class="lyra-tabs__content">
    <h2>Details</h2>
    <p>Workspace details</p>
  </section>
</div>
```

These examples define the required migration shape, not the final Tabs names;
the selection-family spec MUST approve the exact signatures, attributes,
classes, and removal version before implementation.

## Component-family specification API template

Every family specification MUST contain the PRD sections below and MUST make
each requirement objective enough to become an acceptance case:

1. problem, users, and use cases;
2. explicit non-goals;
3. anatomy and primitive, component, domain, consumer, and adapter ownership;
4. variants, sizes, and complete state model;
5. proposed public API with complete usage examples;
6. controlled, uncontrolled, disabled, and read-only behavior;
7. compound, data-driven, slot, and provider composition decisions;
8. keyboard, focus, semantic HTML, and ARIA contract;
9. responsive behavior and touch targets;
10. RTL, locale, long content, zoom, and reflow;
11. forced colors and reduced motion;
12. errors, asynchronous states, cancellation, recovery, and announcements;
13. React, Alpine, CSS, SSR, no-JavaScript, and unsupported-adapter boundaries;
14. simple or complex migration classification, the applicable `+1.5 kB` or
    `+3 kB` Brotli per-consumer-entry bundle budget, external dependency
    decision, ADR exception when exceeded, and removal scope;
15. browser, SSR, hydration, accessibility, visual, parity, and manual test
    matrix;
16. breaking changes, deprecation timing, package versions, codemod decision,
    and before/after migration examples; and
17. objective acceptance criteria and required approvers.

Each family specification MUST also include these exact API artifacts:

### TypeScript signatures

The spec MUST show complete exported React component, part, prop, value, event,
provider, and ref types. Signatures MUST identify inherited native props,
omitted conflicts, controlled and uncontrolled pairs, callback cancelation,
stable item identity, return types, and root and subpath exports. Ellipses and
unresolved generic placeholders MUST NOT stand in for public API.

### Alpine attributes and events

The spec MUST list the `x-data` registration, option type, required server
attributes, public state attributes, bind targets, cancelable before events,
result events, `detail` payloads, bubbling and composition behavior, and cleanup
hook. It MUST map each item to its React equivalent or mark it intentionally
unsupported with the required evidence.

### Required CSS classes and data states

The spec MUST list every required root, part, modifier, and state class; each
public native, ARIA, and `data-*` selector; the owning token tier; and whether
the value is consumer input or adapter output. It MUST distinguish stable
selectors from private vendor or measurement markup.

### Rendered semantic outline

The spec MUST provide an indented HTML outline for rest, each structural
variant, server output, enhanced output, portals, live regions, error and empty
content, and every node referenced by ARIA. It MUST label DOM ownership, ref
targets, stable IDs, optional nodes, reading order, and no-JavaScript fallback.

### State-transition table

The spec MUST tabulate current state, operation or event, precondition,
cancelation point, next state, DOM and ARIA update, focus result, callback or
custom event, announcement, async effect, and recovery. Disabled, read-only,
loading, error, stale-result, nested-layer, reduced-motion, and teardown paths
MUST appear when applicable.

### Compatibility and migration table

The spec MUST map each affected Styles, React, and Alpine version range to its
stability, support level, compatible peer ranges, deprecated surface,
replacement, first deprecation release, removal release, codemod availability,
and linked before/after example. It MUST identify unsupported combinations and
the user-visible failure rather than leave compatibility implicit.

## Acceptance criteria

Before this document moves to `Approved`, reviewers MUST verify every criterion:

- [ ] Styles, React, and Alpine have non-overlapping responsibilities, public
      export boundaries, and CSS markup ownership consistent with the principles
      and token specifications;
- [ ] observable parity permits stack-appropriate internals without weakening
      semantics, state, interaction, CSS, SSR, or no-JavaScript contracts;
- [ ] WCAG 2.2 Level AA is the component, adapter, primitive-adoption, and
      release baseline; known violations cannot be hidden or suppressed, and
      automated evidence does not replace required manual browser and
      assistive-technology evidence;
- [ ] native props, deliberate conflicts, refs, DOM ownership, controlled,
      uncontrolled, read-only, compound, data-driven, slot, handler, provider,
      and async React rules each yield an unambiguous API decision;
- [ ] React 18 and 19 remain in the required peer and verification range until a
      separately approved package-policy change permits a major transition;
- [ ] Alpine initialization, state reflection, events, cleanup, idempotency,
      progressive enhancement, server markup, and React mapping are explicit;
- [ ] React-only classification requires evidence and appears consistently in
      the public support matrix and component documentation;
- [ ] SSR, hydration, portals, IDs, environment-derived state, Alpine
      reconciliation, and no-JavaScript fallbacks have testable requirements;
- [ ] every external primitive remains behind a Lyra adapter, leaks no public
      types or documented vendor attributes, and replaces rather than duplicates
      superseded infrastructure;
- [ ] the external-primitive ADR template requires contract gain, rejected
      alternatives, browser and assistive-technology evidence, SSR result,
      standalone and scenario bundle deltas, removed code, and migration impact;
- [ ] simple primitive migrations add at most `+1.5 kB` Brotli per consumer
      entry, complex component migrations add at most `+3 kB`, and a larger
      delta has an explicit approved ADR exception after replaced code is
      removed and the production entry is measured;
- [ ] independent package SemVer, coordinated shared-contract releases, the
      three-package `1.0.0` suite gate, deprecation, unsafe removal, codemods, and
      migration examples form one resolved version policy;
- [ ] the family-spec template contains every PRD section plus exact TypeScript,
      Alpine, CSS, semantic-outline, transition, compatibility, and migration
      artifacts; and
- [ ] approval authority follows the [shared lifecycle](./README.md#lifecycle):
      design-system maintainers approve the transition, the PRD owner also
      approves any product scope or v1.0 gate change, and required technical or
      accessibility reviews are recorded as evidence rather than as additional
      approval authorities.
