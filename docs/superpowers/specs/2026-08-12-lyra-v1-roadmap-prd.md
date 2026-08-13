# Lyra v1.0 — Product Requirements Document

**Status:** Draft for repository review

**Date:** 2026-08-12

**Owners:** Lyra maintainers

**Scope:** `@lyra-ds/styles`, `@lyra-ds/react`, and `@lyra-ds/alpine`

## 1. Executive summary

Lyra v1.0 will turn the current CSS-first component library into a stable, auditable, and competitive open-source design system. The release will preserve Lyra's semantic CSS, tokens, white-label model, and product-oriented components while replacing high-risk interaction infrastructure with proven primitives where evidence supports the trade-off.

The v1.0 program is spec-first. No implementation wave starts from this PRD alone. The relevant foundational specifications must reach `Approved`; work that changes component contracts also requires an approved component-family specification before an implementation plan or production code is created.

The target runtime scope is CSS, React, and Alpine. The existing Blade port in
the sibling `lyra-ds/blade` repository is a downstream adapter, not an unbuilt
candidate. Its evolution follows affected React contract stabilization as a
separate track and does not block v1.0. Vue, Svelte, Web Components, MCP, and a
broad multi-framework abstraction do not block v1.0.

## 2. Context

The current repository already has a strong engineering base:

- 74 React component directories and 78 documented React exports;
- 98 browser-test files and 74 SSR test files;
- 665 React tests, 268 Alpine tests, and 69 styles tests;
- 180 documentation examples in English and Brazilian Portuguese;
- 211 semantic tokens and 433 public CSS classes protected by parity checks;
- subpath exports, per-entry bundle budgets, package smoke tests, and a real Vite consumer build;
- OIDC publishing with provenance, changesets, security policy, and automated releases.

The audit also identified issues that prevent a credible v1.0 claim:

- known contrast failures are filtered from axe results;
- `Tabs` renders empty focusable panels while application content lives elsewhere;
- `FileUpload` simulates network progress and does not expose a production upload lifecycle;
- `DataTable.onRowClick` encourages pointer-only interaction;
- overlay behavior is duplicated and diverges across Dialog, Drawer, and BottomSheet;
- only Chromium is in the automated browser matrix;
- RTL, forced colors, and assistive-technology acceptance are not system-wide contracts;
- complex components use narrow proprietary interaction infrastructure that is expensive to validate across browsers and assistive technologies;
- React, Alpine, and CSS support boundaries are not expressed as a public conformance matrix.

## 3. Product vision

Lyra should be the design system teams choose when they need:

- a semantic CSS core usable without React;
- a stable React API with production-grade interaction behavior;
- Alpine enhancements for server-rendered applications;
- strong white-label theming without coupling product markup to a utility framework;
- components for application shells, scheduling, workspaces, and files in addition to generic primitives;
- measurable accessibility and performance guarantees rather than aspirational claims.

Lyra does not need to maximize component count. It needs to make every shipped contract trustworthy.

## 4. Goals

### 4.1 Product goals

1. Publish stable v1.0 APIs for CSS, React, and Alpine.
2. Meet WCAG 2.2 AA without silently suppressing known violations.
3. Make keyboard, focus, responsive, RTL, forced-colors, and reduced-motion behavior explicit product requirements.
4. Reduce proprietary interaction code where a mature primitive produces a demonstrated reliability gain.
5. Preserve Lyra's visual language and CSS contract independently of third-party primitive libraries.
6. Define React and Alpine parity precisely instead of promising identical implementation coverage.
7. Support controlled breaking changes before v1.0 with complete migration guidance.
8. Make adoption, evaluation, and contribution credible for external open-source consumers.

### 4.2 Engineering goals

1. Test supported interactive components in Chromium, Firefox, and WebKit.
2. Maintain SSR safety and hydration correctness.
3. Protect bundle size both per entry and in representative application compositions.
4. Remove internal focus, portal, presence, and dismiss implementations when an adopted primitive supersedes them.
5. Keep all third-party primitive types out of Lyra's public API.
6. Require an approved spec and an executable acceptance matrix for every migration wave.

## 5. Non-goals

- Shipping Vue, Svelte, or Web Components adapters before v1.0.
- Making Blade evolution or release a Lyra v1.0 release blocker.
- Making Zag.js the cross-framework foundation before those adapters become active scope.
- Building an enterprise data grid with virtualization, editing, pivoting, or column authoring.
- Replacing semantic CSS with Tailwind utilities.
- Matching every component currently available in shadcn/ui.
- Exposing Radix, Base UI, or React Aria types as part of the public API.
- Adopting a dependency solely to reduce internal implementation effort.
- Shipping an MCP server as a v1.0 requirement.

## 6. Product principles

### 6.1 Native first

Use semantic HTML when the platform already provides the required behavior. Button, Input, Textarea, native Select, Checkbox, Radio, Progress, and structural components do not gain a third-party primitive by default.

### 6.2 Evidence over library preference

Radix, Base UI, and React Aria are implementation candidates, not product requirements. A dependency enters only when it improves an accepted functional contract and passes the bundle and conformance gates.

### 6.3 Lyra owns the public contract

Consumers interact with Lyra props, data attributes, tokens, and CSS classes. Internals may change without requiring consumers to understand the underlying primitive library.

### 6.4 Shared behavior, stack-appropriate implementation

React and Alpine share behavioral specifications and acceptance cases, not necessarily runtime dependencies. React may use Radix or React Aria while Alpine fulfills the same externally observable contract with an Alpine-compatible implementation.

### 6.5 Domain components remain differentiated

CalendarView, RecurrenceSelector, SlotPicker, WeeklyScheduleEditor, FileManager, WorkspaceSwitcher, and application chrome remain Lyra-owned compositions. External primitives may support their interactions without replacing their product model.

## 7. Architecture decision

Lyra v1.0 will use a hybrid primitive architecture:

- semantic HTML and Lyra CSS for simple controls and structural components;
- one selected overlay/menu primitive family for React;
- React Aria evaluated through bounded spikes for selection and internationalized date/time behavior;
- Lyra-owned domain components and public APIs;
- a shared conformance contract for React and Alpine;
- no simultaneous Radix and Base UI overlay foundations in production.

The active repository guidance currently excludes Radix and assigns a future
behavior layer to Zag.js. This `Draft` proposes reconsidering that locked
decision; it does not bypass it or authorize dependency adoption. Before any
Radix, Base UI, or React Aria production change, maintainers MUST approve this
PRD and the governing foundational and family specifications, approve an ADR
that explicitly supersedes the conflicting repository decision, and update the
repository guidance in the same decision wave. If that transition is rejected,
this architecture and its implementation phases MUST be revised to comply with
the active guidance before approval.

### 7.1 Proposed Radix evaluation

| Lyra component        | Candidate primitive                      | Evaluation intent                                                                                |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Dialog                | Radix Dialog                             | Replace portal, focus scope, Escape, modal semantics, outside interaction, and focus restoration |
| Drawer                | Radix Dialog                             | Share modal behavior while Lyra owns side placement and animation                                |
| BottomSheet           | Radix Dialog                             | Share modal behavior while Lyra owns mobile presentation                                         |
| Popover               | Radix Popover                            | Gain collision handling, focus management, and outside-interaction semantics                     |
| Dropdown              | Radix Dropdown Menu                      | Gain typeahead, disabled items, check/radio items, submenus, and complete keyboard behavior      |
| Tooltip               | Radix Tooltip                            | Gain coordinated delay, focus/hover behavior, and Escape handling                                |
| Tabs                  | Radix Tabs                               | Replace empty panels with a compound trigger/content contract                                    |
| CommandPalette        | Radix Dialog infrastructure              | Preserve Lyra search and command model; replace only overlay behavior                            |
| WorkspaceSwitcher     | Radix Popover or Dropdown infrastructure | Preserve Lyra domain API and presentation                                                        |
| CreateWorkspaceDialog | Radix Dialog infrastructure              | Preserve the composed workflow while standardizing its modal foundation                          |

Radix is a candidate hypothesis, not a selected or preferred production
foundation. The overlay spike compares it with Base UI, the incumbent Lyra
implementation, and the active Zag.js direction using the gates in this
document. The ADR MAY retain the incumbent approach; if it adopts a new
foundation, exactly one may own equivalent production responsibilities.

### 7.2 React Aria evaluation

| Component family                      | Evaluation intent                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Combobox                              | Compare listbox semantics, async behavior, mobile interaction, locale support, and assistive-technology reliability   |
| Calendar, DatePicker, DateRangePicker | Evaluate segmented interaction, locale, calendar arithmetic, keyboard behavior, and mobile use as one coherent family |
| TimeInput, TimePicker                 | Evaluate segmented entry, locale, validation, and keyboard behavior                                                   |
| Tabs                                  | Use as a secondary comparison if the Radix API cannot meet the approved Lyra contract                                 |
| Select                                | Retain the native Select; evaluate React Aria only for a separately specified custom-select requirement               |

A spike may conclude that the existing Lyra implementation should remain. Rejection must record the measurements and contract comparison just as adoption does.

### 7.3 Components that remain native or Lyra-owned

- Basic forms: Button, IconButton, Input, Textarea, Checkbox, CheckboxGroup, Radio, RadioGroup, Switch, Fieldset, and FormRow.
- Display and feedback: Alert, Avatar, Badge, Card, CodeBlock, EmptyState, PersonCell, Progress, SegmentedRing, Skeleton, Spinner, Stat, Tag, Toast, and ToastProvider.
- Layout and chrome: ActionBar, AppSidebar, BottomNav, Brand, Container, CookieBanner, Footer, Grid, Navbar, NavLink, PageHeader, Separator, Shell, SidebarGroup, Stack, Inline, and TableOfContents.
- Data and files: Table, DataTable, FileUpload, and FileManager.
- Scheduling and domain: CalendarView, RecurrenceSelector, SlotPicker, WeeklyScheduleEditor, and related product compositions.
- System: ThemeProvider and Icon.

Accordion remains Lyra-owned initially because its native disclosure behavior is bounded. TanStack Table is excluded unless a future product spec deliberately expands DataTable into an enterprise grid.

### 7.4 Alternatives and adjacent libraries

- **Base UI** is the direct alternative in the overlay/menu spike. It must be measured against the same API, accessibility, browser, SSR, and bundle criteria as Radix. The production bundle will not contain both foundations for equivalent responsibilities.
- **React Aria** is preferred for spikes where locale, segmented input, selection models, and device or assistive-technology behavior dominate the problem.
- **Ariakit** is a fallback research candidate for menu or combobox behavior if neither the selected overlay foundation nor React Aria can satisfy an approved contract. It is not a third default foundation.
- **Zag.js** is deferred until additional framework adapters become active scope. Its cross-framework state-machine model does not justify a new abstraction for the React and Alpine v1.0 scope alone.
- **TanStack Table** is deferred unless a future spec expands DataTable into a data-grid product with requirements that justify its state model. It does not provide accessibility by itself.

### 7.5 Icon system decision

Lucide remains the default icon library. The curated `Icon` registry and its escape hatch continue as the supported React contract. The v1.0 work will improve discovery, document use of icons outside the registry, and define an adapter path for organization-specific sets without importing all available glyphs into consumer bundles. Brand icons remain separate from the general-purpose registry so trademarked assets and visual-style exceptions do not erode the core set.

## 8. Bundle confidence policy

Small bundle increases are acceptable when they buy proven reliability. Every adoption PR must include a before/after evidence table.

### 8.1 Required evidence

1. The migration fixes a known contract failure or adds an approved, tested capability.
2. Replaced internal behavior and dependencies are deleted in the same migration wave.
3. The component passes Chromium, Firefox, and WebKit.
4. The component passes axe in light, dark, and forced-colors test configurations where automated evaluation applies.
5. Keyboard and focus acceptance cases from the approved spec pass.
6. SSR and hydration tests pass.
7. The public API does not expose primitive-library types.
8. The bundle report includes standalone and representative-composition deltas.

### 8.2 Default budgets

- Simple primitive migration: at most `+1.5 kB` Brotli per consumer entry.
- Complex component migration: at most `+3 kB` Brotli per consumer entry.
- A larger increase requires an architectural decision record with user-facing benefits, rejected alternatives, and maintainer approval.
- Existing budgets are not raised before the replacement code has been removed and the resulting production entry has been measured.

### 8.3 Scenario bundles

CI will protect at least these representative compositions:

- form: Button, Input, Checkbox, Select, and validation messaging;
- overlays: Dialog, Drawer, Popover, Dropdown, and Tooltip;
- application shell: Shell, Navbar, AppSidebar, WorkspaceSwitcher, and CommandPalette;
- scheduling: DatePicker, TimePicker, CalendarView, and SlotPicker;
- files and data: DataTable, FileUpload, and FileManager.

## 9. Spec Gate

No implementation plan, spike code intended for merge, or production migration may begin until the relevant specs are approved.

### 9.1 Lifecycle

Every spec uses one of three states:

- `Draft`: under product and technical review;
- `Approved`: all required decisions and acceptance criteria are present;
- `Implemented`: the shipped behavior and documentation satisfy the approved spec.

Only `Approved` specs may generate an implementation plan.

### 9.2 Foundational frontend specs

The following specs must be approved before the first implementation wave:

1. **[Design and product principles](./lyra-v1/01-design-product-principles.md)**
   - identity and differentiation;
   - component inclusion criteria;
   - boundary between primitive, design-system component, and domain component;
   - native versus external versus custom implementation rules.

2. **[Tokens and visual language](./lyra-v1/02-tokens-visual-language.md)**
   - color, typography, spacing, radius, elevation, and density;
   - interaction states;
   - light, dark, white-label, and forced-colors behavior;
   - contrast requirements and exception policy.

3. **[Interaction and accessibility](./lyra-v1/03-interaction-accessibility.md)**
   - keyboard and focus contracts;
   - overlays, live regions, and announcements;
   - touch targets, reduced motion, RTL, locale, zoom, and reflow;
   - WCAG/APG baseline;
   - browser and assistive-technology support matrix.

4. **[Component architecture](./lyra-v1/04-component-architecture.md)**
   - compound versus monolithic APIs;
   - controlled and uncontrolled state;
   - slots, refs, DOM attributes, and composition;
   - dependency and public-type policy;
   - React, Alpine, and CSS contract boundaries;
   - semver and deprecation.

5. **[Quality and performance](./lyra-v1/05-quality-performance.md)**
   - per-entry and scenario bundle budgets;
   - SSR and hydration requirements;
   - contract, accessibility, screenshot, and cross-browser testing;
   - evidence required to adopt external dependencies.

### 9.3 Implementation-family specs

After the foundations are approved, create these specs in order of roadmap need:

1. Overlay foundation: Dialog, Drawer, BottomSheet, Popover, Dropdown, and Tooltip.
2. Selection foundation: Tabs, Select, and Combobox.
3. Forms foundation: fields, groups, validation, errors, and messaging.
4. Data and files: Table, DataTable, FileUpload, and FileManager.
5. Date and scheduling: Calendar, pickers, time inputs, and scheduling compositions.
6. Navigation and application chrome: sidebars, navbar, bottom navigation, command palette, and workspace.
7. Feedback: Toast, Alert, Progress, loading, and empty states.
8. Adapter parity: React, Alpine, and CSS markup/behavior contracts.

### 9.4 Required component-spec template

Every component-family spec defines:

- problem, users, and use cases;
- explicit non-goals;
- anatomy and ownership boundaries;
- variants, sizes, and complete state model;
- proposed public API with examples;
- controlled and uncontrolled behavior;
- composition model;
- keyboard, focus, semantic HTML, and ARIA contract;
- responsive behavior and touch targets;
- RTL, locale, long content, zoom, and reflow;
- forced colors and reduced motion;
- errors, asynchronous states, and recovery;
- React, Alpine, and CSS parity expectations;
- bundle budget and dependency policy;
- browser, SSR, accessibility, visual, and manual test matrix;
- breaking changes and before/after migration examples;
- objective acceptance criteria.

## 10. Roadmap

The phases are quality gates rather than calendar commitments. Work can be developed in parallel only when the governing specs and dependencies are independent.

### Phase 0 — Contract and baseline

**Outcome:** all subsequent decisions can be measured.

- Approve the five foundational frontend specs.
- Create a public behavior/support matrix by component and stack.
- Record current standalone and scenario bundle baselines.
- Define browser and assistive-technology support.
- Create the overlay-foundation evaluation ADR template.
- Define synchronized release/versioning policy for Styles, React, and Alpine.

**Exit gate:** reproducible CI baseline, approved foundational specs, and no unresolved policy required by the first component-family spec.

### Phase 1 — System accessibility

**Outcome:** remove cross-catalog accessibility blockers.

- Remove accepted contrast-pair filtering from axe helpers by correcting the tokens and states.
- Add forced-colors behavior and tests.
- Introduce a direction contract and logical CSS properties for RTL.
- Complete reduced-motion coverage.
- Audit and correct touch targets according to the approved interaction spec.
- Add Firefox and WebKit to browser CI.
- Establish manual NVDA and VoiceOver acceptance workflows.

**Exit gate:** no known WCAG 2.2 AA violation is silently suppressed; the supported browser and assistive-technology matrix is published and exercised.

### Phase 2 — Interaction infrastructure

**Outcome:** one reliable foundation powers overlays and menus.

- Approve the overlay-foundation spec.
- Run the overlay-foundation evaluation spike.
- Select exactly one React overlay/menu foundation.
- Introduce a Lyra-owned internal abstraction without leaking vendor types.
- Migrate Dialog, Drawer, BottomSheet, Popover, Dropdown, and Tooltip.
- Reuse the foundation in CommandPalette, WorkspaceSwitcher, and CreateWorkspaceDialog.
- Delete superseded focus, portal, presence, scroll-lock, and dismiss code.
- Publish migration guidance for behavior or API changes.

**Exit gate:** consistent overlay behavior across supported browsers; bundle policy satisfied; no duplicate production interaction foundation remains.

### Phase 3 — Critical public APIs

**Outcome:** no public API encourages inaccessible or simulated behavior.

- Approve the selection and data/files specs.
- Replace Tabs with a compound trigger/content API containing real panel content.
- Separate file selection/dropzone behavior from controlled upload lifecycle and presentation.
- Remove pointer-only DataTable row actions and document the boundary between Table, DataTable, and a future data grid.
- Add initial-focus, description, and safe focus-restoration contracts to modal surfaces.
- Normalize controlled/uncontrolled behavior, errors, and accessible naming.
- Publish migration guides with before/after examples.

**Exit gate:** all four audited P1 component contracts pass their approved acceptance matrices.

### Phase 4 — Advanced inputs

**Outcome:** React Aria adoption decisions are evidence-based.

- Approve date/scheduling and relevant selection specs.
- Spike Combobox.
- Spike Calendar, DatePicker, and DateRangePicker as one family.
- Spike TimeInput and TimePicker as one family.
- Compare Tabs only if the selected overlay foundation cannot meet the approved API.
- Record adoption or rejection for each family.
- Migrate only accepted families and delete superseded behavior.

**Exit gate:** every family has a recorded decision, measured bundle impact, conformance evidence, and migration guidance when shipped.

### Phase 5 — React, Alpine, and CSS parity

**Outcome:** stack support is explicit and testable.

- Approve the adapter-parity spec.
- Classify each component as visual CSS, Alpine-enhanced, React component, or stack-specific composition.
- Build shared conformance fixtures for observable attributes, keyboard behavior, and state classes.
- Document intentional adapter differences.
- Verify that public CSS does not require React-exclusive markup unless explicitly documented.

**Exit gate:** a public support matrix matches tests and documentation; no package description promises unshipped adapter behavior.

### Phase 6 — Open-source product experience

**Outcome:** external teams can evaluate, adopt, migrate, and contribute.

- Document component anatomy, full states, edge cases, and composition.
- Turn examples into conformance-oriented product flows rather than isolated showcases only.
- Consolidate migration guides and changelog navigation.
- Publish contribution criteria for new components and primitives.
- Add issue templates for bugs, accessibility defects, and component proposals.
- Document shadcn token compatibility accurately.
- Treat a copyable registry as a separate product stream with its own spec and release decision.

**Exit gate:** a consumer with no repository context can install, evaluate, migrate, and contribute using public documentation.

### Blade follow-up — after React contract stabilization

**Outcome:** the existing Blade port evolves against stable React, Alpine, and
CSS contracts without delaying Lyra v1.0.

The governing sequencing decision is recorded in the
[Blade follow-up integration design](./2026-08-13-blade-follow-up-design.md).

- Record the affected stable React contract, CSS markup and class contract,
  Alpine behavior, migration examples, and compatible package ranges.
- Create a scoped plan in the sibling `lyra-ds/blade` repository.
- Update only Blade components affected by approved contract changes.
- Verify class parity, observable interaction conformance, rendered HTML,
  documentation-artifact freshness, Laravel/PHP support, and compatibility
  ranges.
- Publish Blade independently when its evidence is complete.

**Scheduling rule:** this track MUST start only after the affected React
family specification reaches `Implemented`, its public API and migration
material are published, and compatible Styles and Alpine ranges are known. It
MAY complete before or after Lyra v1.0 and MUST NOT block the v1.0 release gate.

### Phase 7 — Release candidate and v1.0

**Outcome:** stable release with an explicit support promise.

- Freeze public APIs for the release-candidate window.
- Resolve all P1 issues.
- Resolve or formally reject every dependency spike.
- Pass the complete unit, browser, SSR, accessibility, visual, parity, bundle, packaging, and consumer-smoke suites.
- Complete manual assistive-technology review of critical workflows.
- Validate the release candidate in at least two real consumer applications.
- Publish the migration guide from the final `0.x` line.
- Publish semver, deprecation, support, and security policies.

**Exit gate:** all v1.0 success metrics in section 11 are met.

## 11. Success metrics

### 11.1 Accessibility and interaction

- Zero known WCAG 2.2 AA violations hidden by test helpers.
- One hundred percent of interactive React components covered by their approved keyboard contract.
- Equivalent observable Alpine behavior for every component claimed in the Alpine support matrix.
- Chromium, Firefox, and WebKit required in CI for interactive-component conformance.
- Forced-colors, RTL, reduced-motion, 200% zoom, and narrow-viewport cases covered at the system level and applied according to component specs.
- Critical workflows reviewed with NVDA and VoiceOver before v1.0.

### 11.2 API and reliability

- Zero P1 issue open at v1.0 release.
- Zero public API type imported from Radix, Base UI, or React Aria.
- Every breaking change from the final `0.x` release represented in the migration guide.
- No component marked stable without an approved and implemented spec.
- No simulated production lifecycle in FileUpload.
- No pointer-only action offered as a primary component API.

### 11.3 Performance and distribution

- All approved per-entry and scenario bundle budgets pass.
- Every accepted dependency migration includes measured before/after artifacts.
- No superseded proprietary interaction infrastructure remains in the relevant production entries.
- SSR, package exports, type declarations, package contents, and real-consumer builds pass for release artifacts.

### 11.4 Documentation and adoption

- Every stable component documents anatomy, states, accessibility, responsive behavior, React usage, Alpine/CSS support, and migration notes where applicable.
- The public support matrix matches package behavior.
- Two external or production-like consumer applications validate the release candidate.
- Contribution guidance explains how a component earns stable status.

## 12. Migration policy

Breaking changes are permitted before v1.0 when they improve the public contract.

Every breaking migration must provide:

- rationale tied to an approved spec;
- affected components and package versions;
- before/after code for React and Alpine/CSS when applicable;
- automated codemod when a safe mechanical transform is possible;
- deprecation period when old and new contracts can coexist without maintaining an unsafe behavior;
- explicit removal version;
- accessibility, behavior, and bundle impact.

Unsafe contracts such as empty tab panels, simulated uploads, or pointer-only row actions may be removed without a long deprecation period, but still require release notes and migration examples.

## 13. Risks and mitigations

| Risk                                      | Mitigation                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Radix or Base UI increases bundles        | Enforce before/after scenario measurements, delete replaced code, and require ADR approval above default thresholds |
| React and Alpine behavior diverge         | Share conformance specifications and fixtures at the observable-contract level                                      |
| Blade drifts after React contract changes | Run the post-React Blade track against explicit CSS, Alpine, markup, migration, and compatibility evidence          |
| Vendor APIs leak into Lyra                | Wrap primitives behind Lyra-owned props and compile-time public-type checks                                         |
| React Aria date stack is too heavy        | Evaluate the family as a spike; rejection is allowed and documented                                                 |
| Migration breadth delays v1.0             | Prioritize P1 contracts and gates; component count and registry work do not override core readiness                 |
| Visual identity becomes generic           | Keep tokens, class contracts, motion, composition, and domain components owned by Lyra                              |
| Specs become ceremony without decisions   | Require executable acceptance criteria, examples, and named exit gates; reject specs with unresolved placeholders   |
| Cross-browser CI becomes slow or flaky    | Separate fast PR gates from scheduled full matrices while keeping release gates mandatory                           |
| Existing consumers face breaking changes  | Provide migration guides, codemods where safe, release candidates, and real-consumer validation                     |

## 14. Governance

- The PRD owner approves scope and v1.0 product gates.
- Design-system maintainers approve foundational and family specs.
- Accessibility-sensitive specs require review against the published interaction standard.
- Dependency adoption requires bundle evidence and an architectural decision record.
- A component cannot move from experimental to stable until its spec is `Implemented`.
- A release candidate cannot become v1.0 while any P1 is open or any required success metric lacks evidence.

## 15. Deliverables before implementation

The next work after approval of this PRD is documentation, not component migration:

1. Design and product principles spec.
2. Tokens and visual-language spec.
3. Interaction and accessibility spec.
4. Component-architecture spec.
5. Quality and performance spec.
6. Overlay-foundation spec as the pilot family spec.
7. Overlay-foundation evaluation plan generated only after the overlay spec is approved.

No production component code changes are authorized by this PRD alone.
