# Lyra v1.0 interaction and accessibility

**Status:** Draft

**Date:** 2026-08-12

**Owner:** Lyra maintainers

**Scope:** Keyboard, focus, pointer, touch, overlay, feedback,
internationalization, responsive-input, and assistive-technology contracts for
`@lyra-ds/styles`, `@lyra-ds/react`, and `@lyra-ds/alpine` in Lyra v1.0.

**Governing PRD:**
[Lyra v1.0 roadmap PRD](../2026-08-12-lyra-v1-roadmap-prd.md)

## Decision summary

Lyra v1.0 MUST meet WCAG 2.2 Level AA and MUST provide equivalent access to
primary workflows across supported keyboard, pointer, touch, viewport,
direction, motion, and assistive-technology conditions. Native HTML MUST own
semantics and interaction when it supplies the approved contract. WAI-ARIA
Authoring Practices MAY guide composite and overlay behavior, but an APG pattern
or automated result MUST NOT be treated as conformance evidence by itself.
Every component-family specification MUST complete the applicable contracts in
this document, and current runtime behavior MUST NOT silently weaken them.

## Standards baseline

WCAG 2.2 Level AA MUST be the release baseline for Lyra v1.0. A component and
its documentation MUST satisfy every applicable success criterion across its
supported states, themes, adapters, inputs, browsers, and content conditions.
Automated checks MAY establish repeatable coverage, but they MUST NOT replace
keyboard, zoom, reflow, forced-colors, or assistive-technology evaluation where
those behaviors require human judgment.

WAI-ARIA Authoring Practices MUST be used as behavioral guidance for patterns
such as dialogs, tabs, menus, listboxes, and composite widgets. An implementation
MUST still prove that its chosen semantics, keyboard model, focus behavior,
announcements, and content model satisfy the approved Lyra contract in the
supported environments. Copying an APG role or key map MUST NOT be presented as
automatic WCAG conformance.

Native HTML MUST be preferred when its semantics and behavior meet the user
need. ARIA MUST NOT replace an equivalent native element, and an authored widget
MUST NOT recreate platform behavior without an approved contract gain. A
deviation from native semantics or an established APG behavior MUST identify:

- the user need that the default pattern cannot meet;
- the exact semantic or behavioral difference;
- tested browser and assistive-technology behavior;
- risks, fallbacks, and migration effects; and
- the approving Lyra maintainer.

A deviation affecting a critical workflow MUST retain that evidence with the
family specification and release record.

## Universal interaction contract

Every interactive component MUST expose its purpose, name, value, state, and
available operation programmatically. The accessible name MUST remain aligned
with the visible label or documented naming source. Instructions MUST appear
before the interaction that needs them unless the platform communicates the
same information at the point of use.

Every primary action MUST be reachable and operable without a pointer. A
pointer, touch, drag, hover, long press, swipe, or spatial gesture MAY provide a
convenience, but it MUST have a keyboard-accessible and non-gesture equivalent
that produces the same outcome. A primary action MUST NOT be pointer-only.

### Keyboard reachability and activation

- Interactive elements MUST participate in a logical keyboard order. Native
  controls MUST retain their platform activation keys and events.
- Authored buttons and other single-action widgets MUST implement the keyboard
  activation expected for their semantic role. A family spec MUST identify
  which keys activate, navigate, select, cancel, or move within each composite.
- Composite widgets MAY use roving `tabindex` or `aria-activedescendant` when
  their approved pattern requires one tab stop. Their family specs MUST define
  entry, internal navigation, selection, exit, disabled-item, and typeahead
  behavior.
- Keyboard handling MUST NOT intercept a key used for text editing, browser
  navigation, or assistive technology unless focus is in a widget whose
  documented pattern owns that key.
- A shortcut MUST NOT depend on character case or physical key position when
  the same operation can use the event's semantic key. Character shortcuts MUST
  provide a way to turn them off, remap them, or limit them to focused content
  when WCAG requires it.
- Positive `tabindex` values MUST NOT be used to repair visual or DOM order.

## Focus contract

Focus-visible presentation MUST satisfy the visual-state, contrast, and
forced-colors requirements in the tokens and visual-language specification. It
MUST remain visible while keyboard focus remains, MUST be distinct from hover,
selection, validation, and active states, and MUST NOT be clipped by component
overflow.

DOM order MUST define a meaningful reading and focus sequence. Responsive CSS,
portals, and visual reordering MUST NOT create a sequence that changes meaning
or separates a control from the content it operates. A family spec MUST record
any intentional exception and the evidence that the resulting sequence remains
understandable.

Opening a view, layer, or composite MUST place focus according to its approved
task rather than whichever focusable node happens to appear first in the DOM.
A family spec MUST define the initial-focus target for every entry path. It MUST
consider the title or container for large or destructive content, the first
invalid field after failed validation, a selected or active item when resuming a
composite, and the first safe action when immediate activation could cause loss.

A modal layer MUST contain sequential focus for as long as it is logically open.
Tab and Shift+Tab MUST wrap through its current tabbable content, and an empty
modal MUST retain focus on an appropriately named focusable container. Dynamic
content, disabled controls, nested layers, portals, and removed nodes MUST NOT
allow focus to escape into inert background content.

Closing a temporary layer MUST restore focus to its connected opener when that
target remains available and meaningful. If the opener unmounts, the component
or its invoking composition MUST move focus to the documented logical successor
in this order:

1. the control that replaced or logically follows the opener;
2. the nearest stable focusable control in the invoking workflow; or
3. a named, programmatically focusable workflow or page region.

Focus MUST NOT fall silently to `body`, browser chrome, or an inert ancestor.
The family spec MUST identify ownership of the fallback target and MUST include
an acceptance case where the opener unmounts.

Focus MUST NOT be moved merely to announce a status, expose a tooltip, apply a
theme, update asynchronous content, or synchronize controlled state. When a
focused node is removed or becomes unavailable, the component that owns the
removal MUST move focus to the nearest documented continuation point.

## Disabled and read-only contract

A disabled control MUST expose an unavailable state programmatically and MUST
not activate. A native `disabled` control MUST remain outside sequential focus
according to platform behavior. A composite that keeps an `aria-disabled` item
navigable for discovery MUST prevent activation and MUST document its focus and
announcement behavior. CSS alone MUST NOT create a disabled state.

A read-only control MUST preserve its value, name, and relevant reading or
selection behavior. It MUST remain distinguishable from both editable and
disabled content and MUST NOT imply that its value is unavailable. A family
spec MUST define whether a read-only control remains in sequential focus based
on its native semantics and user need.

Disabled and read-only presentation MUST satisfy the interaction-state rules in
the visual-language specification. Neither state MAY hide required validation,
status, or explanatory content.

## Pointer, touch, and target contract

Pointer and touch behavior MUST tolerate the same operation through keyboard
and supported assistive technology. Hover MUST NOT reveal the only instance of
required content or the only route to an action. Content revealed on hover or
focus MUST remain available while the pointer crosses into it, MUST be
dismissible when required, and MUST persist long enough to perceive and use.

Touch behavior MUST NOT depend on hover. A coarse pointer MUST receive controls,
instructions, and dismissal paths that remain discoverable without precision
pointing. Multi-pointer, path-based, drag, swipe, and long-press interactions
MUST provide a single-pointer alternative without a path unless the gesture is
essential to the represented activity.

A drag interaction MUST expose a keyboard or direct-action alternative for
moving the same item to the same valid destinations. It MUST announce pickup,
allowed destinations, position or target changes, successful drop, cancellation,
and invalid movement without flooding the live region. Pointer cancellation
MUST avoid committing an action on the down event when the user can still move
away or abort.

The WCAG 2.2 Level AA minimum of `24 × 24 CSS px` MUST be the compliance floor,
including its defined spacing and semantic exceptions. Lyra's touch ergonomics
target MUST be at least `44 × 44 CSS px` for interactive targets. A compact
layout MAY use a smaller target only when its family spec documents the user
need, the WCAG exception or spacing that keeps the target conforming, a coarse-
pointer treatment or equivalent action, and manual touch evidence. Dense
presentation MUST NOT reduce targets below the compliance floor.

## Layer and overlay contract

A family spec MUST classify each layer as modal or non-modal and MUST define its
accessible name, description source, focus behavior, dismissal paths, placement,
collision response, and relationship to its trigger. `aria-modal="true"` MUST be
used only while a layer behaves modally: background content is unavailable to
interaction and assistive technology, focus is contained, and the layer owns
the active task.

A modal layer MUST make background content inert or provide an equivalent
tested isolation mechanism, lock background scroll without losing the user's
page position, and preserve usable scrolling inside the layer. Scroll locking
MUST account for scrollbar compensation, zoom, nested layers, touch scrolling,
and the virtual keyboard. Portaling MUST preserve the layer's accessible
relationships, direction, theme, brand, and event contract.

Escape MUST dismiss the topmost dismissible layer and MUST NOT cascade through
its ancestors. A non-dismissible critical step MAY ignore Escape only when its
family spec explains the safety need and supplies an explicit accessible exit
or completion path. A text-editing or assistive-technology interaction that owns
Escape MUST receive its documented behavior before an ancestor layer acts.

Outside interaction MAY dismiss a layer when dismissal cannot lose work or
trigger a destructive result. It MUST be a convenience rather than the sole
dismissal path. A press that begins inside and ends outside, begins outside and
ends inside, or belongs to a child layer MUST NOT be mistaken for an unambiguous
outside activation. The family spec MUST define outside-pointer, outside-focus,
and context-menu behavior independently when they differ.

Only the topmost active layer MUST respond to dismissal, focus containment, and
background isolation. Opening a child layer MUST preserve its parent as the
restoration context; closing the child MUST restore focus within the parent
before the parent can resume interaction. Stacking and portal order MUST NOT be
inferred from arbitrary application z-index values.

Presence animation MAY keep a closing layer in the DOM after its logical open
state becomes false. During that interval the closing layer MUST cease user
interaction, focus containment, dismissal handling, background isolation, and
assistive-technology exposure, and it MUST NOT recapture focus after
restoration. A cancelled exit that reopens the layer MUST establish one coherent
active layer and MUST NOT duplicate focus guards, scroll locks, announcements,
or portal content. Reduced motion MUST complete the same state transitions
without waiting for animation events.

## Async feedback and announcements

An asynchronous operation MUST expose its initiating control or region, current
state, available cancellation, and recovery path. Loading MUST preserve the
task's identity and MUST NOT simulate success. Indeterminate progress MUST be
identified as indeterminate; determinate progress MUST expose the current value,
minimum, and maximum through native or equivalent semantics.

On success, the interface MUST update the affected content and communicate the
outcome when that change is not otherwise evident. On error, it MUST identify
the failed operation, preserve recoverable input, associate field errors with
their controls, and expose a retry or correction path when one exists. Cancel
MUST stop or request cancellation according to the documented lifecycle and
MUST distinguish a pending cancellation from a completed one.

A destructive action MUST communicate its consequence before commitment. A
confirmation step MUST identify the target and irreversible effect, place
initial focus on a safe action, and retain an unambiguous cancel path. A family
spec MAY omit confirmation for an immediately reversible action only when it
defines the undo duration, announcement, and recovery behavior.

Status messages that do not require immediate action SHOULD use a polite live
region. Blocking errors or time-sensitive safety messages MAY use an assertive
live region. A live region MUST exist before the content change it announces,
MUST use concise localized text, and MUST NOT move focus solely to force an
announcement.

Repeated renders, progress ticks, retries, and synchronized adapters MUST NOT
announce the same semantic event more than once. Deduplication MUST use the
operation and meaningful state transition rather than string equality alone.
A new user-requested attempt MAY announce the same localized text again when it
represents a distinct event. High-frequency progress SHOULD announce bounded
milestones instead of every value change.

## Environmental and content contract

The following requirements apply to every component unless its family spec
records that the condition is semantically inapplicable:

- Light, dark, branded, and forced-color presentations MUST preserve the same
  content, accessible name, state, focus, and available operations. Their visual
  output MUST satisfy the tokens and visual-language specification.
- Under `prefers-reduced-motion: reduce`, state transitions MUST remain complete
  and understandable without decorative or spatial motion. Focus, dismissal,
  restoration, and asynchronous completion MUST NOT depend on an animation end
  event.
- Direction-sensitive layout and interaction MUST work in LTR and RTL. DOM and
  reading order MUST remain logical, direction keys MUST follow the approved
  pattern and writing direction, and only icons with directional meaning MAY
  mirror.
- User-facing dates, times, numbers, units, names, sorting labels, validation,
  and announcements MUST use locale-sensitive content. A family spec MUST define
  the locale, calendar, time-zone, numbering, collation, parsing, and hour-cycle
  inputs it owns rather than infer them from display text.
- At 200% text zoom, content and controls MUST remain readable and operable
  without clipping, overlap, or loss of information. Fixed heights MUST NOT cut
  off required labels, values, errors, or actions.
- At 400% page zoom, content MUST reflow without loss of information or
  functionality and without two-dimensional page scrolling at the WCAG reflow
  dimensions. Content that intrinsically requires two-dimensional layout MAY
  scroll within a named bounded region, but surrounding controls and guidance
  MUST reflow independently.
- Components MUST tolerate supported viewport and container widths without
  detaching labels, errors, controls, or overlays from their semantic owner.
  Responsive changes MUST preserve content and task order.
- When a virtual keyboard appears, the focused field, its label, relevant error,
  and next required action MUST remain reachable. A fixed or portaled surface
  MUST respond to the usable visual viewport and MUST NOT assume that `100vh`
  remains unobscured.
- Long translations, user-generated strings, unbroken tokens, and larger local
  formats MUST wrap, scroll within a documented region, or expand without
  covering controls. Truncation MAY supplement an accessible full-value path,
  but it MUST NOT remove information required to identify or complete an action.
- Empty, missing, or asynchronously absent content MUST expose a meaningful
  empty state or omit the inapplicable region. It MUST NOT leave an unnamed or
  misleading focusable shell.
- High data density MUST preserve headers, relationships, focus, target-size
  compliance, reading order, and a route to every action. Density MUST NOT be
  achieved by hiding required labels or relying on hover.

## Family-spec specialization

Universal requirements define the minimum outcome. Each component-family spec
MUST complete the cases below with values and acceptance scenarios appropriate
to its content model:

| Condition                  | Universal contract                                                       | Family-spec decision                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breakpoints and containers | Content and operations MUST remain available and ordered.                | The family spec MUST name layout modes, container or viewport triggers, intrinsic overflow regions, and transitions between modes.                |
| Touch and coarse pointer   | Every operation MUST have equivalent access and conforming targets.      | The family spec MUST name gestures, alternatives, `44 × 44 CSS px` exceptions, and device scenarios.                                              |
| Keyboard composite         | Entry, exit, activation, and navigation MUST be defined.                 | The family spec MUST choose roving focus or `aria-activedescendant`, orientation, wrapping, typeahead, selection, and disabled-item behavior.     |
| Overlays                   | Layers MUST satisfy the layer, focus, and restoration contracts.         | The family spec MUST classify modality, initial focus, dismissal safety, nesting, placement, scroll ownership, and opener-unmount fallback.       |
| Locale and direction       | Meaning and functionality MUST survive locale and direction changes.     | The family spec MUST name locale-owned inputs, parsing and formatting rules, directional keys, mirrored visuals, and bidirectional-content cases. |
| Zoom and dense content     | Required content MUST reflow or use a bounded intrinsic overflow region. | The family spec MUST identify intrinsic two-dimensional exceptions, sticky content, responsive alternatives, and 200%/400% acceptance fixtures.   |
| Async and live feedback    | State and recovery MUST be perceivable without duplicated announcements. | The family spec MUST define lifecycle states, cancellation semantics, progress cadence, message priority, deduplication key, and focus behavior.  |
| Empty and long content     | Empty and expanded content MUST preserve semantics and operations.       | The family spec MUST provide empty, long-translation, unbroken-string, missing-label, and high-density fixtures that match its public API.        |

An adapter MAY use stack-appropriate internals, but every adapter that claims
support MUST preserve the externally observable family contract. An intentional
adapter difference MUST be published in the support matrix with its user impact
and evidence.

## Supported browser and assistive-technology matrix

The automated browser gate MUST run the current stable Chromium, Firefox, and
WebKit builds supplied by the Playwright version pinned in the repository
lockfile. An upgrade to the pinned version MUST rerun every interactive
component's conformance suite before it changes the supported gate. A local or
CI configuration that runs only one engine MUST NOT be presented as the v1.0
release matrix.

Critical desktop workflows MUST receive both of these manual reviews:

| Platform | Browser and assistive technology             | Minimum input coverage                                                                                                                |
| -------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Windows  | NVDA with current stable Firefox or Chromium | Screen-reader browse and focus modes, keyboard navigation, activation, forms, announcements, and layer transitions MUST be exercised. |
| macOS    | VoiceOver with current stable Safari         | VoiceOver navigation, keyboard interaction, forms, announcements, and layer transitions MUST be exercised.                            |

A component whose approved contract changes materially for touch or narrow
viewports MUST also receive manual mobile assistive-technology checks. Its
family spec MUST name the supported device, operating system, browser,
assistive technology and version, touch or external-keyboard input, and every
scenario that differs from desktop. Distinct iOS VoiceOver and Android TalkBack
behavior MUST each be tested when the component claims support for both.

Every manual evidence record MUST contain:

- browser and version;
- operating system and version;
- assistive technology and version;
- input method;
- scenario and exact revision;
- expected result;
- actual result; and
- artifact link.

An artifact MAY be a test record, recording, screenshot, trace, or linked issue
appropriate to the result. A failure MUST be assigned the shared `P1`, `P2`, or
`P3` severity and MUST link to the affected acceptance criterion. Missing
evidence MUST NOT be recorded as a pass.

Automated browser, axe, DOM, and keyboard coverage MUST NOT replace manual
assistive-technology review for critical workflows. A Lyra v1.0 release
candidate MUST NOT ship while a required critical review is missing, a known
WCAG 2.2 Level AA violation is suppressed, or a `P1` interaction or
accessibility issue remains open.

## Component-pattern obligations

The semantic owner identifies the layer that MUST own the primary behavior.
Family specs MUST complete, test, and document the minimum obligations rather
than treating this table as a complete component contract.

| Pattern                    | Semantic owner                                                                                                                                 | Minimum keyboard and focus obligations the family spec MUST complete                                                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buttons and icon buttons   | Native `button`, or native link when the operation is navigation                                                                               | Tab reaches enabled actions; Enter and Space follow native button behavior; disabled behavior, pending activation, accessible naming, repeated activation, and post-action focus MUST be defined.                                                                            |
| Fields and field groups    | Native `input`, `textarea`, `select`, `fieldset`, `legend`, `label`, and form semantics                                                        | Label, description, requirement, value, validation, error association, read-only and disabled behavior, editing keys, submission, and focus after validation MUST be defined.                                                                                                |
| Composites                 | Lyra family contract guided by the applicable ARIA pattern                                                                                     | The spec MUST choose one tab stop model and define entry, arrows, Home/End where applicable, typeahead, selection versus focus, disabled items, orientation, wrapping, and exit.                                                                                             |
| Tabs                       | Lyra Tabs family contract guided by the ARIA tabs pattern                                                                                      | Tab reaches the active tab and panel content; arrows, Home/End, activation mode, focus/selection synchronization, panel naming, real panel ownership, deletion if supported, and focus fallback MUST be defined.                                                             |
| Disclosures                | Native `button` plus controlled content region; native `details`/`summary` MAY own bounded cases                                               | Trigger activation, expanded state, content relationship, retained focus, nested disclosure order, and optional region naming MUST be defined.                                                                                                                               |
| Menus and listboxes        | Lyra family contract guided by the applicable ARIA menu or listbox pattern; the two roles MUST NOT be interchanged                             | Opening focus, arrows, Home/End, typeahead, activation or selection, disabled items, Escape, Tab exit, trigger restoration, nested submenus, and multi-selection where applicable MUST be defined.                                                                           |
| Dialogs and modal surfaces | Native `dialog` when it meets the contract, otherwise a Lyra-owned dialog primitive                                                            | Accessible name and description, initial focus, Tab containment, safe focus restoration including opener removal, Escape and outside dismissal, nested layers, inert background, scroll lock, and closing presence MUST be defined.                                          |
| Tooltips                   | Lyra tooltip family with a semantic trigger and non-interactive descriptive content                                                            | Keyboard focus and hover MAY reveal the same content; Escape dismissal, hover persistence, timing, `aria-describedby` relationship, touch alternative, and focus retention on the trigger MUST be defined. Interactive content MUST use a different non-modal layer pattern. |
| Tables and data views      | Native table semantics for tabular data; a future grid contract MUST own cell navigation before `grid` roles appear                            | Caption or name, headers and associations, sort controls, selection controls, row actions, focus order, responsive overflow, empty content, and keyboard equivalence for every pointer action MUST be defined.                                                               |
| Progress and status        | Native `progress`, `output`, and status semantics where applicable                                                                             | Determinate or indeterminate state, value text, live-region priority, update cadence, completion, failure, cancellation, deduplication, and post-completion focus MUST be defined.                                                                                           |
| Drag and drop              | Lyra family contract over native pointer events and explicit direct actions                                                                    | Keyboard pickup or direct move, valid destinations, position changes, drop, cancel, invalid movement, focus retention, live feedback, and pointer cancellation MUST be defined.                                                                                              |
| Date and time widgets      | Native date/time controls when they meet the locale contract, otherwise a Lyra family contract informed by tested date-input and grid patterns | Locale parsing and formatting, segmented editing or grid navigation, arrows, Home/End/Page keys where applicable, selection, min/max and unavailable values, validation, time zone, touch behavior, and focus restoration MUST be defined.                                   |

## Current findings that v1.0 MUST remove

Current shipped behavior is baseline evidence, not normative precedent. The
following findings MUST be represented as failing acceptance cases in their
family or quality specifications and MUST NOT be preserved by a migration:

| Finding                                                                                                                                                    | Severity and v1.0 obligation                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tabs` renders empty focusable panels while application content is owned elsewhere.                                                                        | `P1`: the Tabs family MUST provide a compound trigger-and-content contract with real, correctly named panel content and a complete keyboard/focus model.                                                          |
| `FileUpload` simulates network progress as if it were a production upload lifecycle.                                                                       | `P1`: the data-and-files family MUST separate file selection and dropzone presentation from a consumer-controlled upload lifecycle, including real progress, failure, retry, cancellation, and completion states. |
| `DataTable.onRowClick` exposes a pointer-only row action.                                                                                                  | `P1`: the data-and-files family MUST replace or supplement row activation with semantic focusable actions that offer keyboard and assistive-technology equivalence.                                               |
| Drawer and related overlays duplicate behavior and diverge in focus capture, dismissal, presence, scroll locking, and restoration when an opener unmounts. | `P1`: the overlay family MUST adopt one approved observable contract and MUST include focus containment, nested-layer, cancelled-exit, and opener-unmount acceptance cases across every claimed adapter.          |
| React and Alpine axe helpers filter known contrast pairs from reported violations.                                                                         | `P1`: the quality contract MUST remove the filters by correcting every accepted output and MUST fail any known WCAG 2.2 Level AA violation rather than suppress it.                                               |

The preexisting Alpine BottomSheet focus-trap baseline failure MUST remain
visible evidence for the overlay work. This specification MUST NOT be interpreted
to approve that behavior, require parity with the failure, or authorize a
runtime change before the overlay family specification is approved.

## Change evidence

An interaction or accessibility change MUST identify the affected component,
adapter, public API, state, input method, browser, assistive technology, locale,
direction, viewport, zoom level, theme, forced-colors behavior, and motion
preference when applicable. It MUST link each artifact to an expected result and
the exact revision tested.

Evidence MUST include automated semantic, keyboard, browser, SSR or hydration,
and axe coverage where applicable, plus the manual matrix required by this
document. A screenshot MAY support a visual result, but it MUST NOT replace a
keyboard sequence, accessibility-tree assertion, contrast measurement, reflow
inspection, or assistive-technology record.

A substantive behavior change MUST include migration guidance and before/after
examples for every affected public adapter. A known failure MUST retain its
severity until fresh evidence demonstrates the approved acceptance criterion;
moving or suppressing the check MUST NOT close the finding.

## Acceptance criteria

Before this document moves to `Approved`, reviewers MUST verify every criterion:

- [ ] WCAG 2.2 Level AA, native semantics, APG guidance, and deviation approval
      form one explicit standards baseline without treating automation or APG
      markup as automatic conformance;
- [ ] keyboard reachability and activation cover native controls, composites,
      shortcuts, editing conflicts, and the prohibition on pointer-only primary
      actions;
- [ ] focus-visible, DOM order, initial focus, modal containment, dynamic
      content, restoration, opener unmount, and removed focused nodes have
      explicit ownership and acceptance behavior;
- [ ] disabled and read-only behavior remain semantically and visually distinct;
- [ ] pointer, touch, hover, drag, coarse-pointer, cancellation, WCAG target
      minimum, and the `44 × 44 CSS px` Lyra target have verifiable rules;
- [ ] modal and non-modal layers define semantics, Escape, outside interaction,
      nested layers, scroll locking, portals, presence animation, reduced
      motion, and restoration without preserving current overlay divergence;
- [ ] loading, progress, success, error, retry, cancel, destructive confirmation,
      live-region priority, and event-based deduplication have complete contracts;
- [ ] light, dark, forced colors, reduced motion, RTL, locale, 200% text zoom,
      400% page zoom and reflow, containers, virtual keyboards, long content,
      empty content, and high density distinguish universal outcomes from family
      decisions;
- [ ] Chromium, Firefox, and WebKit automated gates plus NVDA, VoiceOver, and
      conditional mobile review define evidence fields and release blockers;
- [ ] every named component pattern has a semantic owner and minimum family-spec
      keyboard and focus obligations;
- [ ] the Tabs, FileUpload, DataTable, overlay, and contrast-helper findings are
      `P1` contracts that v1.0 specs and migrations MUST NOT preserve;
- [ ] downstream component architecture, quality, and family specifications can
      cite these contracts without an unresolved interaction or accessibility
      decision; and
- [ ] the PRD owner, design-system maintainers, and required interaction-standard
      reviewer have recorded the approvals assigned to them by governance.
