# Tabs owned-content candidate — initial technical review

GLM5.3Flash301.61s,exit0,unchanged guard,3DONE with9precision findings. No implementation approval inferred before adjudication.

<<<FINDINGS
- MEDIUM | design "Controlled values, interaction and focus decisions requiring review" + state table row "Parent supplies invalid active" | invalid-active SSR markup undefined. Client policy defines no-selection render; SSR paragraph only declares malformed input "unsupported" without defining server output. Scenario: triggers render from async data; SSR runs `active="overview"` with zero triggers; implementation that clamps or throws server-side hydrates against client no-selection render → React 18/19 hydration mismatch/error. Controller must pin invalid-pair SSR to same deterministic no-selection markup, or document markup/hydration as undefined for unsupported input.
- MEDIUM | design "Controlled values…" | Tab entry when selected trigger is disabled unspecified. "Native Tab enters the selected enabled trigger" + "Disabled buttons … skipped by navigation" leave valid-pair-but-disabled-trigger case undefined. Scenario: app disables active trigger during save; disabled node cannot take focus, so Tab may skip whole list. Removal-repair already uses selected-enabled-else-first-enabled — bind same rule to Tab entry.
- MEDIUM | design "Alpine and static CSS candidate" | Alpine keyboard parity unstated. React contract requires RTL mirror + enabled-only navigation; Alpine scope keeps current handler (packages/alpine/src/tabs.ts:124-141) with neither, and activateTab (packages/alpine/src/tabs.ts:120-122) mutates active after no-op focus() on disabled target → selection changes while focus stays, desync React state table forbids; dir=rtl pages move ArrowRight visually backwards vs React. Port both into Alpine slice scope or record divergence.
- MEDIUM | design "Alpine … cancellation/event mapping" | before-change veto scope ambiguous. "Preventing it aborts the change" does not say whether arrow-nav focus movement aborts. Scenario: consumer vetoes lyra:tabs-before-change on ArrowRight; if adapter still focuses next trigger, focus rests on unselected tab while React veto guarantees "No Lyra focus/selection/callback effect" — identical consumer intent diverges per adapter. Specify veto aborts focus too, or document divergence.
- LOW | same section | dual veto precedence undocumented: native defaultPrevented guard runs before before-change dispatch, so native-prevented activation emits no lyra:tabs-before-change at all. Document precedence so consumers do not double-guard.
- LOW | design "Public React API candidate" | root id fallback unspecified: id optional via HTMLAttributes while "Root id supplies stable instance identity"; current code is `id ?? generatedId` (packages/react/src/tabs/tabs.tsx:39). Specify SSR-safe useId fallback or current consumers omitting id break.
- LOW | same section | duplicate/unpaired value runtime behavior undefined ("unsupported consumer input", no dev signal). Scenario: two `TabsTrigger value="overview"` → silent first-wins, ambiguous content mapping, inconsistent with explicit misuse error for orphan parts. Specify dev-mode misuse error or documented first-wins.
- LOW | design "Compatibility, migration, size and delivery slices" | 04-component-architecture.md:596-828 requires removal "explicitly identified as a SemVer exception in release notes" with recorded unsafe-coexistence rationale, earliest safe release, user impact; candidate requires only "changeset/migration note". Bind SemVer-exception naming and rationale to release-note artifact.
- LOW | design "Alpine and static CSS candidate" | failed-init diagnostics undefined: validation failure retains ready=false silently. Scenario: author typo of data-value pairing → fallback persists forever, no console signal. Require one-time dev diagnostic while fallback stays usable.
FINDINGS>>>

Controller adjudication:
- Accepted1: define deterministic invalid-active SSR and hydration output explicitly.
- Accepted2: disabled-selected Tab entry uses first enabled eligible trigger, with no fabricated selection.
- Accepted3: Alpine must share enabled/eligible-only and RTL navigation semantics.
- Accepted4: before-change veto cancels focus as well as active/DOM/result-event effects.
- Accepted5: native prevention precedes custom before-event; no event emitted when already vetoed.
- Accepted6: unconditional SSR-safe useId fallback when root id omitted.
- Declined7: unique paired nonempty values are a documented input precondition, not a silently normalized first-wins API. A new development validator/logger is not required by the normative template. Explicitly document deterministic per-part markup and unsupported duplicate/unpaired composition, with no claim of safe invalid ARIA or implicit repair. Orphan parts have a distinct missing-owner error because no rendering owner exists.
- Accepted8: changeset/release migration must explicitly name the project SemVer exception, unsafe coexistence rationale, earliest removal and impact.
- Declined9: ready=false and usable native fallback are already explicit observable failure output; a new dev logging/configuration surface is not mandated. Failed setup must never report readiness/success or hide content.

Additional controller concern: author display:flex/grid can override native hidden presentation. Prove the current public Alpine panel/hidden trigger behavior before choosing a narrow CSS-first visibility rule. No production change yet.
