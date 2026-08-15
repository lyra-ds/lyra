# Lyra v1 — Phase 1 Wave 2 Contrast Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all seven axe `color-contrast` exceptions by fixing their final rendered CSS sources and make React and Alpine fail on every future contrast violation.

**Architecture:** A Styles Browser Mode fixture is the canonical final-composite contract for the seven known pairs. Correct global semantic tokens only for the three dark `--text-faint` failures; correct CalendarView and the dark accent hover state at their local source. React’s CalendarView test exercises the published adapter, while the unfiltered shared axe helpers make every existing React and Alpine accessibility fixture enforce the result.

**Tech Stack:** CSS custom properties, CSS Color 4/color-mix, Vitest Browser Mode, Playwright Chromium/Firefox/WebKit, axe-core, Docker Compose, Changesets.

## Global Constraints

- Preserve all public component APIs, adapter APIs, class names, theme attributes, and brand custom-property override contracts.
- Correct contrast at the final computed foreground/background/state pair; do not mask findings with an axe filter, rule disablement, severity change, retry, timeout extension, or snapshot.
- Treat Styles as the CSS source of truth; React and Alpine import it rather than duplicating visual behavior.
- Test every state in Chromium, Firefox, and WebKit before the full Docker matrix.
- Preserve the current Phase 1 serial browser/evidence configuration; do not install browsers at runtime.
- Add a patch changeset for `@lyra-ds/styles`; test-only adapter changes do not create package releases.

### Browser command runner

Every focused Browser Mode command in this plan runs inside the pinned `browser-tests` service, never against a locally installed browser. Use this wrapper and substitute only the final `pnpm` command shown in each step:

```bash
UID="$(id -u)" GID="$(id -g)" docker compose -f compose.playwright.yml run --rm --entrypoint sh browser-tests -lc 'mkdir -p /tmp/corepack-shims && corepack enable --install-directory /tmp/corepack-shims && export PATH="/tmp/corepack-shims:$PATH" && corepack pnpm@11.13.1 install --frozen-lockfile && corepack pnpm@11.13.1 --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name firefox'
```

The Docker image already supplies Chromium, Firefox, and WebKit. No command may invoke `playwright install`.

---

## File map

| File                                                                                  | Responsibility                                                                                                       |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `packages/styles/tests/fixtures/contrast-regressions.html`                            | Static DOM for the three dark faint-text surfaces, two CalendarView chips, a light sunken label, and primary action. |
| `packages/styles/tests/contrast-regressions.test.ts`                                  | Browser Mode color conversion, WCAG ratio, theme/brand, and hover regressions.                                       |
| `packages/styles/tokens/colors.css`                                                   | Dark semantic faint text and dark default accent-hover values.                                                       |
| `packages/styles/tokens/brand.css`                                                    | Only if a measured branded hover state fails; it must retain `--brand-contrast` derivation.                          |
| `packages/styles/components/scheduling/scheduling.css`                                | CalendarView session/program-session text treatment.                                                                 |
| `packages/react/src/calendar-view/calendar-view.browser.test.tsx`                     | Published React CalendarView regression.                                                                             |
| `packages/react/src/internal/test-axe.ts`, `packages/alpine/src/internal/test-axe.ts` | Direct, unfiltered axe assertion.                                                                                    |
| `.changeset/bright-contrast-remediation.md`                                           | Styles patch-release note.                                                                                           |

## Task 1: Establish rendered-composite RED coverage in Styles

**Files:**

- Create: `packages/styles/tests/fixtures/contrast-regressions.html`
- Create: `packages/styles/tests/contrast-regressions.test.ts`

**Interfaces:**

- Consumes: the `packages/styles/styles.css` import graph and existing Browser Mode config.
- Produces: probe names `faint-card`, `faint-page`, `faint-sunken`, `session`, `program-session`, `sunken-label`, and `primary`; a `contrast(foreground, background): number` helper.

- [ ] **Step 1: Write the failing real-CSS fixture and ratio tests**

Create a fixture with real shipped classes:

```html
<div id="contrast-root">
  <p data-probe="faint-card" style="background: var(--surface-card); color: var(--text-faint)">
    Quiet card text
  </p>
  <p data-probe="faint-page" style="background: var(--surface-page); color: var(--text-faint)">
    Quiet page text
  </p>
  <p data-probe="faint-sunken" style="background: var(--surface-sunken); color: var(--text-faint)">
    Quiet sunken text
  </p>
  <button class="lyra-calview__evt lyra-calview__evt--session" data-probe="session">
    <span class="lyra-calview__evt-time">09:00</span><span>Session</span>
  </button>
  <button class="lyra-calview__evt lyra-calview__evt--program-session" data-probe="program-session">
    <span class="lyra-calview__evt-time">10:00</span><span>Program session</span>
  </button>
  <span class="lyra-kbd" data-probe="sunken-label">⌘K</span>
  <button class="lyra-btn lyra-btn--primary" data-probe="primary">Save</button>
</div>
```

Import `../styles.css` and fixture `?raw`. Copy the canvas color conversion and WCAG relative-luminance formula from `packages/styles/tests/brand-theme.test.ts`. For each probe, assert opaque computed foreground/background and `contrast(...) >= 4.5`; set `data-theme="dark"` for dark cases, drive `userEvent.hover(primary)`, then finish its animations before the primary assertion. Set `data-brand="acme"` and `--brand: #0D9488` for a representative brand hover assertion.

- [ ] **Step 2: Prove the baseline is red in Firefox**

Run:

```bash
pnpm --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name firefox
```

Expected: FAIL on baseline pairs including dark faint text, CalendarView time text, light sunken label, or dark primary hover. Record exact computed colors and ratios; do not relax an assertion.

- [ ] **Step 3: Prove the same contract in the other engines**

Run:

```bash
pnpm --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name chromium
pnpm --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name webkit
```

Expected: each known rendered pair is red. A serialization difference may change the parser implementation, never the AA threshold.

- [ ] **Step 4: Commit the RED coverage**

```bash
git add packages/styles/tests/fixtures/contrast-regressions.html packages/styles/tests/contrast-regressions.test.ts
git commit -m "test(styles): cover known contrast composites"
```

## Task 2: Correct Styles sources and green the canonical contract

**Files:**

- Modify: `packages/styles/tokens/colors.css:99-129`
- Modify: `packages/styles/components/scheduling/scheduling.css:165-182`
- Modify only if the Acme hover measurement is red: `packages/styles/tokens/brand.css:18-29`
- Modify if reported by an axe node: `packages/styles/components/navigation/navigation.css:614-659`
- Test: `packages/styles/tests/contrast-regressions.test.ts`
- Test: `packages/styles/tests/brand-theme.test.ts`

**Interfaces:**

- Consumes: the probe names and `contrast` helper from Task 1.
- Produces: AA-compliant dark faint text, CalendarView event text, and default/branded dark hover primary text.

- [ ] **Step 1: Confirm ownership before modification**

Use Task 1’s computed-style output to verify this source map:

```text
dark faint text       colors.css [data-theme="dark"] --text-faint
default dark hover    colors.css [data-theme="dark"] --accent-hover
session chip           scheduling.css .lyra-calview__evt--session
program-session chip   scheduling.css .lyra-calview__evt--program-session
light sunken label     navigation.css .lyra-kbd, or the axe-node selector from Task 3
```

If `.lyra-kbd` is already compliant, replace only its fixture probe with the actual selector from the unfiltered axe node. Do not globally change light `--text-muted` or `--text-faint` for a single sunken consumer.

- [ ] **Step 2: Make the narrow CSS correction**

Use existing semantic tokens first; keep modifiers, surfaces, event bars, and brand override names intact:

```css
/* colors.css, [data-theme="dark"] */
--text-faint: var(--night-300);
/* choose a darker AA-compliant hover stop that remains visibly distinct from --accent */
--accent-hover: var(--indigo-700);

/* scheduling.css: selectors stay stable; only their semantic foreground pairing changes */
.lyra-calview__evt--session {
  color: var(--accent-soft-text);
}
.lyra-calview__evt--program-session {
  color: var(--success-text);
}
```

Measure those values in all three engines. If either event still misses 4.5:1, introduce one narrow semantic event-text token in `colors.css` and consume it in the two rules; never hard-code color literals in a component. Change `brand.css` only if the Acme probe proves its own derived hover below AA, deriving from `--brand` and preserving `--brand-contrast` plus the `@supports` fallback.

- [ ] **Step 3: Verify all focused Styles contracts**

Run:

```bash
pnpm --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name chromium
pnpm --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name firefox
pnpm --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name webkit
pnpm --filter @lyra-ds/styles exec vitest run tests/brand-theme.test.ts --browser.name chromium
pnpm --filter @lyra-ds/styles exec vitest run tests/brand-theme.test.ts --browser.name firefox
pnpm --filter @lyra-ds/styles exec vitest run tests/brand-theme.test.ts --browser.name webkit
```

Expected: every probe reaches AA and the brand ordering/override contract stays green.

- [ ] **Step 4: Commit the Styles remediation**

```bash
git add packages/styles/tokens/colors.css packages/styles/tokens/brand.css packages/styles/components/scheduling/scheduling.css packages/styles/components/navigation/navigation.css packages/styles/tests
git commit -m "fix(styles): restore AA contrast composites"
```

Stage only files that changed; do not make unrelated formatting changes.

## Task 3: Prove React CalendarView and remove the React axe exception

**Files:**

- Modify: `packages/react/src/calendar-view/calendar-view.browser.test.tsx:1-64`
- Modify: `packages/react/src/internal/test-axe.ts:1-48`

**Interfaces:**

- Consumes: Task 2 CSS and existing CalendarView kinds `'session' | 'program-session'`.
- Produces: unfiltered `expectNoAxeViolations(container: Element): Promise<void>` and adapter-level AA assertions.

- [ ] **Step 1: Write an adapter assertion that is red under old chip CSS**

Copy the RGB, relative-luminance, and `contrastRatio` helpers from `packages/react/src/tabs/tabs.browser.test.tsx:20-55`. In the existing theme loop, assert the final chip colors:

```ts
expect(
  contrastRatio(getComputedStyle(session).color, getComputedStyle(session).backgroundColor),
).toBeGreaterThanOrEqual(4.5);
expect(
  contrastRatio(
    getComputedStyle(programSession).color,
    getComputedStyle(programSession).backgroundColor,
  ),
).toBeGreaterThanOrEqual(4.5);
```

Temporarily restore the old CalendarView CSS to prove this assertion is red, then restore Task 2’s source correction. Keep the normal `expectNoAxeViolations(screen.container)` call.

- [ ] **Step 2: Make React axe direct**

After the existing animation-finishing loop, replace all contrast filtering with:

```ts
const results = await axe.run(container as HTMLElement);
expect(results.violations).toEqual([]);
```

Delete `ACCEPTED_CONTRAST_PAIRS`, every `flatMap` filter, and accepted-design comments. Preserve the finite-animation `try/catch`.

- [ ] **Step 3: Run React CalendarView in every engine**

```bash
pnpm --filter @lyra-ds/react exec vitest run src/calendar-view/calendar-view.browser.test.tsx --browser.name chromium
pnpm --filter @lyra-ds/react exec vitest run src/calendar-view/calendar-view.browser.test.tsx --browser.name firefox
pnpm --filter @lyra-ds/react exec vitest run src/calendar-view/calendar-view.browser.test.tsx --browser.name webkit
```

Expected: zero axe violations and both chips meet 4.5:1.

- [ ] **Step 4: Commit React enforcement**

```bash
git add packages/react/src/calendar-view/calendar-view.browser.test.tsx packages/react/src/internal/test-axe.ts
git commit -m "test(react): enforce unfiltered axe contrast"
```

## Task 4: Remove the Alpine exception and exhaust shared-CSS fixtures

**Files:**

- Modify: `packages/alpine/src/internal/test-axe.ts:1-40`
- Test: existing `packages/alpine/src/**/*.browser.test.ts`

**Interfaces:**

- Consumes: Task 2 shared CSS corrections.
- Produces: an Alpine axe helper with the exact direct assertion used by React.

- [ ] **Step 1: Make Alpine axe direct**

Keep animation finishing and replace the filtered result handling with:

```ts
const results = await axe.run(container as HTMLElement);
expect(results.violations).toEqual([]);
```

Delete the pair set, contrast filters, and their comments. Do not change Alpine component state, `x-bind`, focus, or ARIA behavior unless an unfiltered axe node proves a CSS source defect.

- [ ] **Step 2: Prove full Alpine coverage in Chromium**

```bash
pnpm --filter @lyra-ds/alpine exec vitest run --browser.name chromium
```

Expected: PASS. If axe reports a node, add that exact final composite to Task 1, write its red ratio assertion, correct the narrow Styles source in Task 2, and rerun the red/green cycle. Never restore an exception.

- [ ] **Step 3: Prove full Alpine coverage in Firefox and WebKit**

```bash
pnpm --filter @lyra-ds/alpine exec vitest run --browser.name firefox
pnpm --filter @lyra-ds/alpine exec vitest run --browser.name webkit
```

Expected: PASS with no browser-specific contrast code path.

- [ ] **Step 4: Commit Alpine enforcement**

```bash
git add packages/alpine/src/internal/test-axe.ts packages/styles
git commit -m "test(alpine): enforce unfiltered axe contrast"
```

Stage only the helper and any Styles correction proven necessary by an axe node; never stage `.artifacts/`.

## Task 5: Release metadata, complete matrix, and review gate

**Files:**

- Create: `.changeset/bright-contrast-remediation.md`
- Create or update: `.superpowers/sdd/2026-08-14-lyra-v1-phase-1-browser-infrastructure/wave-2-contrast-report.md` if repository evidence policy keeps it ignored.

**Interfaces:**

- Consumes: Tasks 1–4 and the pinned container in `compose.playwright.yml`.
- Produces: release note, fresh three-engine evidence, and a review-ready branch.

- [ ] **Step 1: Add the Styles patch changeset**

```md
---
'@lyra-ds/styles': patch
---

Fix WCAG AA contrast for CalendarView event chips, quiet dark text, and dark hover controls.
```

- [ ] **Step 2: Run the complete pinned browser matrix**

```bash
UID="$(id -u)" GID="$(id -g)" docker compose -f compose.playwright.yml run --rm browser-tests
```

Expected: exit 0 with Styles, React, and Alpine passing in Chromium, Firefox, and WebKit. Preserve screenshots/traces if red and fix each reported node at source.

- [ ] **Step 3: Run release, lint, type, and Phase 1 guards**

```bash
pnpm test
pnpm lint
pnpm --filter @lyra-ds/alpine typecheck
node --test tools/phase1/browser-matrix.test.mjs tools/phase1/browser-config.test.mjs
git diff --check
```

Expected: every command exits 0, apart from a documented pre-existing warning only when its command exits 0. Confirm `git status --short` shows no Docker cache or generated artifacts.

- [ ] **Step 4: Record evidence and commit metadata**

Record the seven before/after foreground/background ratios, owning selector/token, focused three-engine outcomes, matrix exit, and all command exits. Then:

```bash
git add .changeset/bright-contrast-remediation.md
git commit -m "docs: record Phase 1 contrast evidence"
```

Do not force-add ignored evidence; cite its on-disk path in the future PR description.

- [ ] **Step 5: Request independent review before PR creation**

Ask a read-only reviewer to verify:

```text
1. Neither helper retains ACCEPTED_CONTRAST_PAIRS or color-contrast filtering.
2. All seven ledger pairs have rendered regression coverage, including dark hover.
3. CSS source preserves CalendarView classes, brand derivation, and public APIs.
4. Fresh Docker matrix and Phase 1 guardrails are green.
```

Address every confirmed finding with a new RED/GREEN cycle, rerun affected engines and the complete matrix, then request re-review before creating the PR.
