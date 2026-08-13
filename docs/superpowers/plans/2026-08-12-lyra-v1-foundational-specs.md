# Lyra v1.0 Foundational Specs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the five foundational frontend specifications that govern every Lyra v1.0 component-family spec and implementation wave, and prepare them for maintainer approval.

**Architecture:** Store the specifications as a numbered, cross-linked set under `docs/superpowers/specs/lyra-v1/`. A shared index owns lifecycle, vocabulary, normative language, and dependency order; each specification owns one decision domain and links to incumbent repository evidence instead of duplicating it. All five documents start as `Draft` and require explicit maintainer approval before their status changes.

**Tech Stack:** Markdown, existing Lyra CSS/React/Alpine source and documentation, Prettier, ripgrep, Git.

## Global Constraints

- Scope is `@lyra-ds/styles`, `@lyra-ds/react`, and `@lyra-ds/alpine`;
  production Blade changes remain in the sibling `lyra-ds/blade` repository and
  follow affected React contract stabilization, while Vue, Svelte, Web
  Components, MCP, and production component changes remain out of scope.
- The roadmap PRD at `docs/superpowers/specs/2026-08-12-lyra-v1-roadmap-prd.md` is the governing product document.
- Every new specification starts with `Status: Draft`, `Owner: Lyra maintainers`, and `Governing PRD` metadata.
- Use RFC 2119 terms `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` only for normative requirements; define them once in the index.
- Do not weaken the PRD gates: WCAG 2.2 AA, Chromium/Firefox/WebKit, NVDA/VoiceOver critical-flow review, SSR, public-type isolation, and bundle evidence remain mandatory.
- Simple primitive migrations may add at most `+1.5 kB` Brotli per consumer entry; complex migrations may add at most `+3 kB`; larger changes require an ADR.
- The documents describe contracts and acceptance criteria. They do not choose an overlay foundation, modify runtime code, or authorize implementation.
- Existing public behavior is evidence, not automatically the desired v1.0 contract. Known audit defects must be named rather than normalized.
- Each task creates a reviewable document and ends with formatting, structural checks, and a focused commit.

---

### Task 1: Create the spec set index and design/product principles

**Files:**

- Create: `docs/superpowers/specs/lyra-v1/README.md`
- Create: `docs/superpowers/specs/lyra-v1/01-design-product-principles.md`
- Reference: `docs/superpowers/specs/2026-08-12-lyra-v1-roadmap-prd.md`
- Reference: `README.md`
- Reference: `apps/docs/content/docs/en/foundations/architecture.mdx`
- Reference: `apps/docs/content/docs/en/foundations/branding.mdx`

**Interfaces:**

- Consumes: PRD sections 3–7, 9, and 14.
- Produces: shared lifecycle vocabulary; normative-language rules; definitions for primitive, component, domain component, adapter, stable, experimental, deprecated, P1/P2/P3, parity, and evidence; product principles and the component inclusion scorecard consumed by Tasks 2–6.

- [ ] **Step 1: Confirm the files do not exist yet**

Run:

```bash
test ! -e docs/superpowers/specs/lyra-v1/README.md
test ! -e docs/superpowers/specs/lyra-v1/01-design-product-principles.md
```

Expected: both commands exit `0`. If either file exists, review it as user-owned work and update this plan before editing.

- [ ] **Step 2: Create the shared index**

Create `README.md` with these sections and decisions:

1. `Purpose`: the directory is the normative frontend contract for Lyra v1.0.
2. `Document map`: numbered links to all five specifications and the PRD.
3. `Dependency order`: principles → tokens/interactions → architecture → quality; family specs depend on all five.
4. `Lifecycle`: `Draft → Approved → Implemented`, with the transition owner and required evidence for each state.
5. `Normative language`: RFC 2119 definitions and the rule that lowercase prose is explanatory.
6. `Shared vocabulary`: exact definitions listed in the Interfaces block.
7. `Conflict resolution`: PRD owns product scope; foundational specs own cross-component requirements; approved family specs own component details; shipped behavior never silently overrides an approved spec.
8. `Change protocol`: substantive requirement changes require review of downstream specs and a changelog note in the index.

- [ ] **Step 3: Write the design and product principles spec**

Create `01-design-product-principles.md` with:

1. Metadata and decision summary.
2. Job, audiences, and open-source positioning.
3. Product truths: CSS-first, semantic tokens, white-label, React plus Alpine, and domain-oriented components.
4. Principles: native first, evidence over preference, Lyra-owned public contract, stack-appropriate implementation, progressive enhancement, composability, accessible defaults, and domain differentiation.
5. Three ownership levels with entry/exit rules: primitive, design-system component, and domain component.
6. Component inclusion scorecard covering repeated user need, semantic ownership, accessibility leverage, cross-product reuse, maintenance cost, adapter feasibility, bundle impact, and differentiation.
7. Decision framework for native HTML versus external primitive versus Lyra-owned behavior.
8. Stability model: experimental, beta, stable, and deprecated, mapped to the shared spec lifecycle.
9. Public commitments and explicit anti-goals copied from the PRD without broadening scope.
10. Icon direction: retain Lucide, curated registry, escape hatch, organization adapter path, and separate brand-icon policy.
11. Acceptance criteria that can be checked before the document moves to `Approved`.

- [ ] **Step 4: Verify structure and cross-links**

Run:

```bash
pnpm exec prettier --write docs/superpowers/specs/lyra-v1/README.md docs/superpowers/specs/lyra-v1/01-design-product-principles.md
pnpm exec prettier --check docs/superpowers/specs/lyra-v1/README.md docs/superpowers/specs/lyra-v1/01-design-product-principles.md
rg -q '^## Shared vocabulary$' docs/superpowers/specs/lyra-v1/README.md
rg -q '^## Component inclusion scorecard$' docs/superpowers/specs/lyra-v1/01-design-product-principles.md
rg -q '^## Native, external, or Lyra-owned decision framework$' docs/superpowers/specs/lyra-v1/01-design-product-principles.md
git diff --check
```

Expected: Prettier reports both files formatted; every `rg` and `git diff --check` exits `0`.

- [ ] **Step 5: Commit the shared foundation**

```bash
git add docs/superpowers/specs/lyra-v1/README.md docs/superpowers/specs/lyra-v1/01-design-product-principles.md
git commit -m "docs: define Lyra v1 product principles"
```

### Task 2: Specify tokens and visual language

**Files:**

- Create: `docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md`
- Reference: `packages/styles/tokens/fonts.css`
- Reference: `packages/styles/tokens/colors.css`
- Reference: `packages/styles/tokens/typography.css`
- Reference: `packages/styles/tokens/spacing.css`
- Reference: `packages/styles/tokens/effects.css`
- Reference: `packages/styles/tokens/brand.css`
- Reference: `packages/styles/tokens/base.css`
- Reference: `packages/styles/compat-shadcn.css`
- Reference: `apps/docs/content/docs/en/foundations/colors.mdx`
- Reference: `apps/docs/content/docs/en/foundations/typography.mdx`
- Reference: `apps/docs/content/docs/en/foundations/spacing.mdx`

**Interfaces:**

- Consumes: vocabulary, ownership model, and product principles from Task 1.
- Produces: normative token tiers, naming and fallback rules, theme/brand contracts, interaction-state visual requirements, and contrast/forced-colors requirements consumed by Tasks 3–6.

- [ ] **Step 1: Capture the incumbent token inventory**

Run:

```bash
node tools/parity/parity.mjs
rg -oP --no-filename -- '--[a-z0-9-]+(?=\s*:)' packages/styles/tokens/*.css | sort -u > /tmp/lyra-v1-token-inventory.txt
wc -l /tmp/lyra-v1-token-inventory.txt
```

Expected: parity reports `211 tokens` and `433 classes`; the inventory command produces a non-empty reference list. The temporary file is evidence only and is not committed.

- [ ] **Step 2: Write the token model and governance**

Create the spec with these normative sections:

1. Metadata and scope.
2. Token tiers: reference scales, semantic aliases, component tokens, and consumer brand overrides.
3. Naming grammar and criteria for adding, changing, aliasing, or removing a token.
4. Fallback rules and browser-safe CSS behavior.
5. Ownership boundaries between `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `brand.css`, `base.css`, and component CSS.
6. Deprecation and migration policy for public custom properties.
7. Rules preventing raw visual values from bypassing semantic tokens in components, with documented exceptions for intrinsic data visualization and consumer-provided values.

- [ ] **Step 3: Define the visual-language contracts**

Add explicit requirements for:

1. Color roles and status semantics.
2. Typography roles, font loading, fallback stacks, and content density.
3. Spacing, sizing, radius, elevation, borders, and focus indicators.
4. Light, dark, system preference, and white-label behavior.
5. Brand derivation and consumer override safety.
6. Interaction states: rest, hover, active, focus-visible, selected, disabled, read-only, loading, error, warning, and success.
7. WCAG 2.2 AA contrast: `4.5:1` for normal text, `3:1` for large text and required non-text UI contrast, with no general color-pair allowlist.
8. Forced-colors behavior: semantic borders, system colors, visible focus, and state differentiation without color alone.
9. Reduced-motion token behavior and prohibition on motion being required to understand state.
10. RTL-safe visual rules using logical properties where direction matters.
11. shadcn compatibility as an adapter layer rather than the canonical token model.

- [ ] **Step 4: Define change evidence and acceptance criteria**

Require each token change to include impacted themes, contrast evidence, affected public classes/components, parity result, screenshots for relevant themes/states, and migration notes for public-token changes. Add approval criteria that cover all token files and every state listed in Step 3.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm exec prettier --write docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md
pnpm exec prettier --check docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md
rg -q '^## Token tiers$' docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md
rg -q '^## Contrast and color independence$' docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md
rg -q '^## Forced colors$' docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md
git diff --check
git add docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md
git commit -m "docs: specify Lyra v1 visual language"
```

Expected: formatting and structural checks pass before the commit is created.

### Task 3: Specify interaction and accessibility

**Files:**

- Create: `docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md`
- Reference: `packages/react/src/internal/test-axe.ts`
- Reference: `packages/react/src/internal/use-focus-trap.ts`
- Reference: `packages/react/src/dialog/dialog.tsx`
- Reference: `packages/react/src/drawer/drawer.tsx`
- Reference: `packages/react/src/bottom-sheet/bottom-sheet.tsx`
- Reference: `packages/react/vitest.config.ts`
- Reference: `packages/alpine/vitest.config.ts`
- Reference: `packages/react/CONVENTIONS.md`

**Interfaces:**

- Consumes: shared severity vocabulary and visual-state requirements from Tasks 1–2.
- Produces: normative keyboard, focus, overlay, announcement, responsive-input, internationalization, and assistive-technology contracts consumed by component architecture, quality gates, and every family spec.

- [ ] **Step 1: Record the standards baseline**

Write a standards section that makes WCAG 2.2 Level AA the release baseline, uses WAI-ARIA Authoring Practices as behavioral guidance rather than automatic proof of conformance, and prefers native HTML semantics. Require deviations to identify the user need, tested assistive-technology behavior, and approving maintainer.

- [ ] **Step 2: Define universal interaction contracts**

Specify:

1. Keyboard reachability and activation.
2. Focus-visible appearance, focus order, initial focus, trapping, restoration, and focus behavior when the opener unmounts.
3. Disabled versus read-only behavior.
4. Pointer, touch, drag, hover, and coarse-pointer equivalence.
5. Minimum target policy: WCAG 2.2 AA minimum as the compliance floor and `44 × 44 CSS px` as the Lyra touch ergonomics target, with documented compact-layout exceptions.
6. Escape, outside interaction, nested layers, scroll locking, portals, and animation-presence behavior.
7. Loading, async success, error, retry, cancel, and destructive-confirmation feedback.
8. Live-region politeness and deduplication.
9. No primary action may be pointer-only.

- [ ] **Step 3: Define environmental and content contracts**

Specify light/dark/forced-colors, reduced motion, RTL, locale-sensitive formatting, 200% text zoom, 400% page zoom/reflow, viewport and container constraints, virtual keyboard, long translations, empty content, and high data density. Separate requirements that are universal from cases a family spec must specialize.

- [ ] **Step 4: Publish browser and assistive-technology support**

Define:

- automated browser gate: the exact Chromium, Firefox, and WebKit revisions supplied by the pinned Playwright version in the lockfile;
- critical manual desktop flows: NVDA with Firefox or Chromium on Windows, and VoiceOver with Safari on macOS;
- mobile assistive-technology checks for components whose approved contract changes materially on touch or narrow viewports;
- evidence format: browser, operating system, assistive technology/version, input method, scenario, expected result, actual result, and artifact link;
- release rule: automated coverage does not replace manual assistive-technology review for critical workflows.

- [ ] **Step 5: Define component-pattern obligations**

Add a table mapping buttons, fields, composites, tabs, disclosures, menus/listboxes, dialogs, tooltips, tables, progress/status, drag-and-drop, and date/time widgets to the semantic owner and the minimum keyboard/focus behaviors that family specs must complete. Name the current Tabs, FileUpload, DataTable, Drawer, and contrast-helper findings as contracts that the v1.0 specs must not preserve.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm exec prettier --write docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md
pnpm exec prettier --check docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md
rg -q '^## Focus contract$' docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md
rg -q '^## Layer and overlay contract$' docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md
rg -q '^## Supported browser and assistive-technology matrix$' docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md
git diff --check
git add docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md
git commit -m "docs: specify Lyra v1 interaction accessibility"
```

Expected: formatting and all required-section checks pass before commit.

### Task 4: Specify component architecture

**Files:**

- Create: `docs/superpowers/specs/lyra-v1/04-component-architecture.md`
- Reference: `packages/react/CONVENTIONS.md`
- Reference: `packages/react/src/internal/use-controllable-state.ts`
- Reference: `packages/react/src/internal/slot.tsx`
- Reference: `packages/react/src/index.ts`
- Reference: `packages/react/package.json`
- Reference: `packages/alpine/src/index.ts`
- Reference: `packages/alpine/package.json`
- Reference: `packages/styles/package.json`
- Reference: `apps/docs/content/docs/en/foundations/architecture.mdx`

**Interfaces:**

- Consumes: ownership levels, token contracts, interaction contracts, and shared lifecycle from Tasks 1–3.
- Produces: public API rules, composition model, adapter boundaries, dependency isolation, SSR behavior, versioning, and deprecation requirements consumed by Task 5 and all family specs.

- [ ] **Step 1: Define package and responsibility boundaries**

Specify the roles of Styles, React, and Alpine; public versus internal modules; CSS markup contracts; subpath exports; component ownership; and the rule that a stack adapter may implement behavior differently while preserving the approved observable contract.

- [ ] **Step 2: Define React API design rules**

Cover:

1. Native-prop inheritance and deliberate prop conflicts.
2. Forwarded refs and DOM ownership.
3. Controlled, uncontrolled, and read-only state.
4. Compound APIs for components with consumer-owned structure or content.
5. Data-driven APIs for bounded collections with stable identity.
6. Slots and `asChild` only where semantic responsibility remains explicit.
7. Event ordering, cancelation, and composition with consumer handlers.
8. Provider use only for genuinely shared contextual state.
9. Error, loading, empty, and async lifecycle contracts.
10. React 18–19 compatibility until a separate approved version policy changes the peer range.

- [ ] **Step 3: Define Alpine and CSS contracts**

Specify initialization, state attributes, custom events, cleanup, idempotency, progressive enhancement, server-rendered markup, no-JavaScript fallback, and how Alpine behavior maps to React behavior. Define when a component is legitimately React-only and how that limitation appears in docs and the public support matrix.

- [ ] **Step 4: Define external primitive isolation**

Require a Lyra-owned adapter boundary for Radix, Base UI, or React Aria; prohibit vendor types and vendor-specific DOM/data attributes as the documented public API; require removal of replaced internal infrastructure; and define an ADR evidence template containing contract gain, rejected alternatives, browser/AT evidence, SSR result, standalone bundle delta, scenario delta, removed code, and migration impact.

- [ ] **Step 5: Define API lifecycle and migration**

Specify experimental, beta, stable, and deprecated API guarantees; semver rules across the three packages; synchronized versus independent package versions; deprecation communication; unsafe-contract removal; codemod criteria; and before/after examples. Resolve the current version-policy decision explicitly rather than leaving it open for family specs.

- [ ] **Step 6: Define the family-spec API template**

Include the PRD's required component-spec sections and add exact API artifacts: TypeScript signatures, Alpine attributes/events, required CSS classes/data states, rendered semantic outline, state-transition table, and compatibility/migration table.

- [ ] **Step 7: Verify and commit**

Run:

```bash
pnpm exec prettier --write docs/superpowers/specs/lyra-v1/04-component-architecture.md
pnpm exec prettier --check docs/superpowers/specs/lyra-v1/04-component-architecture.md
rg -q '^## React public API contract$' docs/superpowers/specs/lyra-v1/04-component-architecture.md
rg -q '^## Alpine and CSS adapter contract$' docs/superpowers/specs/lyra-v1/04-component-architecture.md
rg -q '^## External primitive isolation$' docs/superpowers/specs/lyra-v1/04-component-architecture.md
git diff --check
git add docs/superpowers/specs/lyra-v1/04-component-architecture.md
git commit -m "docs: specify Lyra v1 component architecture"
```

Expected: formatting and all structural checks pass before commit.

### Task 5: Specify quality and performance

**Files:**

- Create: `docs/superpowers/specs/lyra-v1/05-quality-performance.md`
- Reference: `package.json`
- Reference: `packages/react/package.json`
- Reference: `packages/react/vitest.config.ts`
- Reference: `packages/alpine/vitest.config.ts`
- Reference: `packages/styles/vitest.config.ts`
- Reference: `.github/workflows/ci.yml`
- Reference: `tools/parity/parity.mjs`
- Reference: `tools/pack-smoke/pack-smoke.mjs`
- Reference: `tools/smoke/smoke.mjs`

**Interfaces:**

- Consumes: definitions and normative product, visual, interaction, architecture, lifecycle, and dependency requirements from Tasks 1–4.
- Produces: test pyramid, merge/release gates, severity/SLO policy, artifact requirements, bundle measurement protocol, and spec-to-test traceability used by all implementation plans.

- [ ] **Step 1: Define quality levels and severity**

Define P1, P2, and P3 with user impact, examples, response expectation, and release effect. Make any known WCAG AA failure, keyboard-blocked primary task, focus escape from an active modal, data loss, or broken package entry a P1. Define stable-component eligibility and the evidence required for a family spec to move to `Implemented`.

- [ ] **Step 2: Define the test architecture**

Specify required layers:

1. Static checks: formatting, lint, types, public API/type isolation, doc generation, and parity.
2. Unit/pure logic tests.
3. Real-browser component contract tests.
4. SSR and hydration tests.
5. Accessibility automation in light, dark, and forced-colors configurations where supported.
6. Visual regression across required themes, direction, density, and representative viewports.
7. React/Alpine conformance fixtures.
8. Packaging, exports, tarball, and consumer application smoke tests.
9. Manual assistive-technology and exploratory checks for critical workflows.

Define which layers run on pull requests, nightly/scheduled CI, release candidates, and releases. Pull-request gates may be optimized, but no required release evidence may be skipped.

- [ ] **Step 3: Define browser, SSR, and flake policies**

Require deterministic tests, controlled clocks and animations, unique ports, retry evidence rather than retry-only acceptance, quarantine rules with an owner and removal condition, and a failure classification process. A test that passes only after retry does not prove the component contract until the source of nondeterminism is understood.

- [ ] **Step 4: Define performance and bundle measurement**

Specify Brotli measurement, pinned tooling, cold-cache standalone entries, the five PRD scenario bundles, CSS payload measurement, runtime interaction responsiveness for complex components, and comparison artifacts. Copy the `+1.5 kB` and `+3 kB` thresholds exactly; define the ADR path for larger changes and require replaced-code removal before raising a budget.

- [ ] **Step 5: Define traceability and release evidence**

Require every normative family-spec acceptance criterion to map to an automated test, manual test record, or documented non-automatable review. Define the release evidence manifest with spec version, package version, commands, results, artifact links, browser/AT matrix, bundle report, known issues, and migration guide.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm exec prettier --write docs/superpowers/specs/lyra-v1/05-quality-performance.md
pnpm exec prettier --check docs/superpowers/specs/lyra-v1/05-quality-performance.md
rg -q '^## Test architecture$' docs/superpowers/specs/lyra-v1/05-quality-performance.md
rg -q '^## Bundle and runtime performance$' docs/superpowers/specs/lyra-v1/05-quality-performance.md
rg -q '^## Release evidence manifest$' docs/superpowers/specs/lyra-v1/05-quality-performance.md
git diff --check
git add docs/superpowers/specs/lyra-v1/05-quality-performance.md
git commit -m "docs: specify Lyra v1 quality gates"
```

Expected: formatting and required-section checks pass before commit.

### Task 6: Integrate and review the foundational set

**Files:**

- Modify: `docs/superpowers/specs/lyra-v1/README.md`
- Modify: `docs/superpowers/specs/2026-08-12-lyra-v1-roadmap-prd.md`
- Review: `docs/superpowers/specs/lyra-v1/01-design-product-principles.md`
- Review: `docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md`
- Review: `docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md`
- Review: `docs/superpowers/specs/lyra-v1/04-component-architecture.md`
- Review: `docs/superpowers/specs/lyra-v1/05-quality-performance.md`

**Interfaces:**

- Consumes: all documents produced by Tasks 1–5 and every foundational requirement in PRD section 9.2.
- Produces: one navigable, internally consistent `Draft` specification set ready for maintainer review; a traceability matrix from PRD requirement to owning spec and acceptance section.

- [ ] **Step 1: Add the document map and traceability matrix**

Update the index with final links, one-sentence ownership descriptions, review order, and a matrix mapping each PRD section 9.2 bullet to exactly one primary owning spec and any secondary dependent specs. Add links from PRD section 9.2 to the five files without changing the PRD requirements.

- [ ] **Step 2: Run the cross-spec terminology review**

Confirm that lifecycle states, severity, stable/experimental/deprecated, component ownership levels, adapter parity, critical workflow, evidence, consumer entry, scenario bundle, and ADR have one definition and consistent capitalization. Replace duplicate definitions in child specs with links to the index unless a domain-specific refinement is required.

- [ ] **Step 3: Run the contradiction review**

Check these boundaries explicitly:

- token states match interaction states;
- accessibility requirements have quality evidence owners;
- public API rules do not leak vendor contracts;
- React/Alpine parity means observable contract equivalence, not identical internals;
- bundle thresholds match the PRD exactly;
- browser and assistive-technology matrices match across interaction and quality specs;
- no document authorizes production code before approval;
- no document expands v1.0 to Blade or unapproved adapters.

Record resolved wording directly in the owning spec. Do not create a separate unresolved-questions file.

- [ ] **Step 4: Run structural and formatting verification**

Run:

```bash
set -e
pnpm exec prettier --write docs/superpowers/specs/2026-08-12-lyra-v1-roadmap-prd.md docs/superpowers/specs/lyra-v1/*.md
pnpm exec prettier --check docs/superpowers/specs/2026-08-12-lyra-v1-roadmap-prd.md docs/superpowers/specs/lyra-v1/*.md
for file in docs/superpowers/specs/lyra-v1/0*.md; do
  rg -q '^\*\*Status:\*\* Draft$' "$file"
  rg -q '^## Acceptance criteria$' "$file"
done
rg -q '^## PRD traceability$' docs/superpowers/specs/lyra-v1/README.md
git diff --check
```

Expected: all commands exit `0`; all five specs remain `Draft` pending human approval.

- [ ] **Step 5: Inspect the final documentation-only diff**

Run:

```bash
git status --short
git diff --stat HEAD~5
git diff -- docs/superpowers/specs/2026-08-12-lyra-v1-roadmap-prd.md docs/superpowers/specs/lyra-v1
```

Expected: only the PRD links, index, and five foundational specification files appear in the integration diff. Read the complete diff before committing.

- [ ] **Step 6: Commit the integrated spec set**

```bash
git add docs/superpowers/specs/2026-08-12-lyra-v1-roadmap-prd.md docs/superpowers/specs/lyra-v1
git commit -m "docs: integrate Lyra v1 foundational specs"
```

- [ ] **Step 7: Hand the Draft set to maintainers**

Provide links to all five specs, summarize material decisions and any deliberate differences from current behavior, and request explicit approval or corrections. Do not create the overlay-family implementation plan until all five foundational specs are `Approved`.
