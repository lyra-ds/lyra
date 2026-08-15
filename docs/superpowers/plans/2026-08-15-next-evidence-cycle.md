# Next Delivery Evidence Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one reproducible evidence artifact that uniquely selects Lyra's next bounded delivery without changing product behavior.

**Architecture:** Run a two-stage evidence funnel from an isolated branch based on the latest `origin/main`: first collect broad, inexpensive signals and score eligible candidates, then audit at most two candidates with focused existing checks. Consolidate the baseline, ranking, audit result, and complete next-delivery contract in one dated Markdown artifact.

**Tech Stack:** Git, GitHub CLI, Node.js 24, pnpm 11.13.1, Vitest 4.1.10, TypeScript 5.9.3, repository Markdown documentation.

## Global Constraints

- Start from the latest fetched `origin/main`; run a fast-forward-only pull from `origin/main` before collecting evidence, record the `origin/main` product-baseline SHA and collection time, and record the planning branch `HEAD` separately.
- Preserve the divergent local `main` checkout and its unrelated `.pnpm-store/` directory; do not rewrite, rebase, reset, stage, or delete either.
- Run every shell command through `rtk`.
- Create only `docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md` during execution; do not alter production source, dependencies, public APIs, package versions, generated artifacts, budgets, test infrastructure, or changesets.
- Accept only candidates backed by a public behavior, release gate, or documented support claim; exclude speculative features, unsupported adapters, and internal cleanup without consumer impact.
- Rank candidates by priority class first: failing gate or confirmed blocker, supported-flow gap, React/Alpine/CSS parity gap, then documentation or developer-experience mismatch.
- Score each candidate out of ten: user impact `0–3`, release or accessibility risk `0–3`, automated proof available now `0–2`, and supported-surface reach `0–2`.
- Break score ties by priority class, stronger automated proof, earliest applicable v1 roadmap phase, then older independently recorded consumer-facing evidence.
- Run at most two focused candidate audits. A rejected claim cannot authorize implementation; an inconclusive claim may select only a bounded evidence-producing spike.
- If no candidate survives, select the overlay-foundation readiness audit defined by the approved design; do not choose or adopt a primitive dependency.
- Use canonical English in the evidence artifact.

---

## File Structure

- Create `docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md` — the only execution output. It owns the baseline identity, consulted sources, eligible candidates, score arithmetic, focused audit, unique recommendation, complete next-delivery contract, and verification record.
- Read `docs/superpowers/specs/2026-08-15-next-evidence-cycle-design.md` — authoritative scope, scoring, fallback, and completion rules.
- Read `docs/superpowers/specs/2026-08-12-lyra-v1-roadmap-prd.md` — approved v1 risks, phase order, family-spec order, success metrics, and fallback authority.
- Read `docs/superpowers/specs/2026-08-15-sequential-delivery-cycle-design.md` — selection classes and handoff order.
- Read all five approved foundational specifications: `docs/superpowers/specs/lyra-v1/01-design-product-principles.md`, `docs/superpowers/specs/lyra-v1/02-tokens-visual-language.md`, `docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md`, `docs/superpowers/specs/lyra-v1/04-component-architecture.md`, and `docs/superpowers/specs/lyra-v1/05-quality-performance.md`.
- Read `docs/superpowers/backlog/2026-08-15-current-baseline.md`, `docs/superpowers/backlog/2026-08-15-prioritized-backlog.md`, and `docs/superpowers/backlog/2026-08-15-alpine-public-api-audit.md` — prior evidence that must not be mistaken for a new open candidate.
- Read candidate-specific React, Alpine, package-export, and English/Portuguese documentation files listed in Task 2 only after ranking selects that family.

### Task 1: Capture the Current Evidence Baseline and Candidate Signals

**Files:**

- Create: `docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md`
- Read: `.github/workflows/ci.yml`, `package.json`, the three cycle/roadmap specs, all five foundational specs, and the three prior backlog records listed above

**Interfaces:**

- Consumes: current `origin/main`, default-branch CI, open GitHub work, approved roadmap claims, current source/documentation signals, and recent path-scoped history.
- Produces: an evidence artifact with completed `Baseline`, `Evidence Sources`, and `Candidate Evidence` sections. Task 2 consumes only cited facts from these sections.

- [ ] **Step 1: Synchronize and record repository identity**

  Run from the isolated evidence worktree:

  ```bash
  rtk git pull --ff-only origin main
  rtk git rev-parse origin/main
  rtk git rev-parse HEAD
  rtk git log -1 --format='%H%n%ad%n%s' --date=iso-strict
  rtk git status --short --branch
  rtk node --version
  rtk pnpm --version
  ```

  Create the artifact with these exact top-level headings:

  ```markdown
  # Next Delivery Evidence — 2026-08-15

  ## Baseline

  ## Evidence Sources

  ## Candidate Evidence
  ```

  Under `Baseline`, record `origin/main` as the product-baseline SHA and `HEAD` as the planning-branch SHA, followed by the timestamp, branch relationship, runtime versions, and whether the worktree was clean before the artifact was created. Default-branch CI evidence must match the product-baseline SHA, not the documentation-only planning SHA. Do not copy facts from the earlier baseline without checking them against the current product baseline.

- [ ] **Step 2: Capture current default-branch and GitHub signals**

  Run each read-only query once:

  ```bash
  rtk gh run list --branch main --workflow ci.yml --limit 10 --json databaseId,headSha,status,conclusion,createdAt,updatedAt,url
  rtk gh issue list --state open --limit 100 --json number,title,body,labels,createdAt,updatedAt,url
  rtk gh pr list --state open --base main --limit 100 --json number,title,body,labels,createdAt,updatedAt,url,statusCheckRollup
  ```

  In `Evidence Sources`, record the newest completed CI run for the baseline SHA and whether every required job passed. Summarize open issues and pull requests only when they name a supported consumer flow, package contract, accessibility problem, release gate, or documentation mismatch. Preserve their URLs and dates. An empty list is valid evidence and must be stated explicitly.

  If a GitHub query fails for a transient network or service reason, run that exact command one more time. If the retry also fails and the source could alter candidate ranking, stop before Task 2 and report the unavailable source.

- [ ] **Step 3: Collect repository and roadmap signals without running the full suite**

  Run and record the exit status plus material matches from:

  ```bash
  rtk rg -n "TODO|FIXME|TBD|not implemented" packages apps tools .github --glob '!**/dist/**' --glob '!**/node_modules/**'
  rtk rg -n "violationsToIgnore|disableRules|test\.skip|describe\.skip|it\.skip|eslint-disable|@ts-ignore" packages apps tools .github --glob '!**/dist/**' --glob '!**/node_modules/**'
  rtk rg -n "simulated upload progress|progresso simulado|setInterval|onRowClick|generated empty.*tabpanel|elementos vazios.*tabpanel" packages/react/src packages/alpine/src apps/docs/content/docs/en apps/docs/content/docs/pt-BR --glob '!**/dist/**'
  rtk git log -40 --format='%H%x09%ad%x09%s' --date=short
  rtk git log HEAD~40..HEAD --format= --numstat -- packages/react | rtk awk '{ added += $1; deleted += $2 } END { print "react", added, deleted, added + deleted }'
  rtk git log HEAD~40..HEAD --format= --numstat -- packages/alpine | rtk awk '{ added += $1; deleted += $2 } END { print "alpine", added, deleted, added + deleted }'
  rtk git log HEAD~40..HEAD --format= --numstat -- packages/styles | rtk awk '{ added += $1; deleted += $2 } END { print "styles", added, deleted, added + deleted }'
  ```

  Then compare the matches with sections 2, 7–11, and 15 of the v1 PRD and with the five approved foundational specs. Record only present-tense signals. A match in a test, defensive error, generated record, or already-closed audit is not a candidate unless it demonstrates a current public mismatch.

- [ ] **Step 4: Write traceable candidate evidence**

  For every potentially eligible signal, add a compact entry under `Candidate Evidence` with these fields:

  ```markdown
  ### Signal: concise public behavior

  - **Source:** exact path, command result, GitHub URL, or approved-spec section
  - **Observed state:** present-tense fact visible in the source
  - **Consumer or gate:** affected supported flow, package, or v1 criterion
  - **Reproduction:** smallest existing command or file comparison that can confirm the claim
  - **Eligibility:** eligible or excluded, followed by the design rule that decides it
  ```

  Include the PRD's known FileUpload lifecycle, DataTable pointer interaction, Tabs panel ownership, and overlay-foundation claims only if the current source or public documentation still corroborates them. Do not promote historical PRD wording by itself into a confirmed defect.

- [ ] **Step 5: Review and commit the baseline evidence**

  Confirm every entry cites a current source and that no candidate ranking has been written yet. Run:

  ```bash
  rtk pnpm exec prettier --check docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md
  rtk git diff --check
  rtk git add docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md
  rtk git commit -m "docs: collect next delivery evidence"
  ```

### Task 2: Rank Eligible Candidates and Run the Focused Audit

**Files:**

- Modify: `docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md`
- Read when selected: `packages/react/src/file-upload/file-upload.tsx`, `packages/react/src/file-upload/file-upload.browser.test.tsx`, `packages/react/src/file-upload/file-upload.ssr.test.ts`, `packages/alpine/src/file-upload.ts`, `packages/alpine/src/file-upload.browser.test.ts`, and both `apps/docs/content/docs/*/components/file-upload.mdx`
- Read when selected: `packages/react/src/data-table/data-table.tsx`, `packages/react/src/data-table/data-table.browser.test.tsx`, `packages/react/src/data-table/data-table.ssr.test.ts`, `packages/alpine/src/data-table.ts`, `packages/alpine/src/data-table.browser.test.ts`, and both `apps/docs/content/docs/*/components/data-table.mdx`
- Read when selected: `packages/react/src/tabs/tabs.tsx`, `packages/react/src/tabs/tabs.browser.test.tsx`, `packages/react/src/tabs/tabs.ssr.test.ts`, `packages/alpine/src/tabs.ts`, `packages/alpine/src/tabs.browser.test.ts`, and both `apps/docs/content/docs/*/components/tabs.mdx`
- Read for the fallback: the Dialog, Drawer, BottomSheet, Popover, Dropdown, and Tooltip source/browser-test pairs under `packages/react/src/` and `packages/alpine/src/`, plus both locale documentation pages for those six components
- Read package exports for the selected family: `packages/react/package.json`, `packages/react/src/index.ts`, the selected component's `packages/react/src/<family>/index.ts`, `packages/alpine/package.json`, and `packages/alpine/src/index.ts`

**Interfaces:**

- Consumes: eligible entries from Task 1's `Candidate Evidence` section.
- Produces: `Candidates`, `Scoring`, `Focused Audit`, and `Recommendation` sections with a unique selected `BKL-##`. Task 3 consumes the selected identifier and audit classification.

- [ ] **Step 1: Build the eligible candidate table**

  Append this exact structure, assigning sequential identifiers from `BKL-02` through `BKL-06`:

  ```markdown
  ## Candidates

  | Identifier | Priority class | User impact | Evidence | Bounded scope | Proof | Exclusions |
  | ---------- | -------------- | ----------- | -------- | ------------- | ----- | ---------- |
  ```

  Include two to five candidates when the evidence supports them. Fewer are allowed only when a paragraph below the table names each investigated signal that failed eligibility and the exact reason. Candidate scope must fit one later delivery plan; split independent component families rather than combining them for a higher reach score.

- [ ] **Step 2: Score and order candidates deterministically**

  Append:

  ```markdown
  ## Scoring

  | Identifier | User impact | Release/accessibility risk | Automated proof | Supported-surface reach | Arithmetic | Total |
  | ---------- | ----------: | -------------------------: | --------------: | ----------------------: | ---------- | ----: |
  ```

  Assign integer values using the approved ranges. Show arithmetic in the form `3 + 3 + 2 + 2`, recompute every total, then sort by total descending. Apply tie-breaks in this exact order: priority class, automated proof, earliest v1 phase, older independent consumer evidence. State each applied tie-break beneath the table. Name the highest-ranked candidate only as the provisional audit target; scoring alone does not confirm its claim.

- [ ] **Step 3: State the target as a falsifiable claim and inspect its complete contract**

  Add `## Focused Audit` and write one sentence that can be confirmed or rejected from current behavior. Compare the selected family's React implementation, React browser and SSR tests, Alpine implementation when the adapter exposes it, Alpine browser tests, English docs, Portuguese docs, package exports, and the applicable foundational requirements. The audit's evidence entry must cite every applicable repository-relative path from the selected read set, including each package-export file; grouped or filename-only references are insufficient.

  Use the matching source inspection command:

  ```bash
  rtk rg -n "simulated|setInterval|progress|status|onChange|FileList" packages/react/src/file-upload packages/alpine/src/file-upload.ts packages/alpine/src/file-upload.browser.test.ts apps/docs/content/docs/en/components/file-upload.mdx apps/docs/content/docs/pt-BR/components/file-upload.mdx
  rtk rg -n "onRowClick|onClick|onKeyDown|tabIndex|role|hover" packages/react/src/data-table packages/alpine/src/data-table.ts packages/alpine/src/data-table.browser.test.ts apps/docs/content/docs/en/components/data-table.mdx apps/docs/content/docs/pt-BR/components/data-table.mdx
  rtk rg -n "tabpanel|aria-controls|children|content|active|hidden" packages/react/src/tabs packages/alpine/src/tabs.ts packages/alpine/src/tabs.browser.test.ts apps/docs/content/docs/en/components/tabs.mdx apps/docs/content/docs/pt-BR/components/tabs.mdx
  rtk rg -n "createPortal|Escape|focus|pointerdown|keydown|outside|restore" packages/react/src/dialog packages/react/src/drawer packages/react/src/bottom-sheet packages/react/src/popover packages/react/src/dropdown packages/react/src/tooltip packages/alpine/src/dialog.ts packages/alpine/src/drawer.ts packages/alpine/src/bottom-sheet.ts packages/alpine/src/popover.ts packages/alpine/src/dropdown.ts packages/alpine/src/tooltip.ts
  ```

  Run only the command matching the selected family. For a candidate outside these four known families, use its exact source, tests, documentation, and approved contract paths and record those paths before running a command.

- [ ] **Step 4: Run the smallest existing focused verification**

  Run only the block matching the selected candidate.

  FileUpload:

  ```bash
  rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx
  rtk pnpm --filter @lyra-ds/react exec vitest run --project ssr src/file-upload/file-upload.ssr.test.ts
  rtk pnpm --filter @lyra-ds/alpine exec vitest run --browser.name chromium src/file-upload.browser.test.ts
  ```

  DataTable:

  ```bash
  rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/data-table/data-table.browser.test.tsx
  rtk pnpm --filter @lyra-ds/react exec vitest run --project ssr src/data-table/data-table.ssr.test.ts
  rtk pnpm --filter @lyra-ds/alpine exec vitest run --browser.name chromium src/data-table.browser.test.ts
  ```

  Tabs:

  ```bash
  rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/tabs/tabs.browser.test.tsx
  rtk pnpm --filter @lyra-ds/react exec vitest run --project ssr src/tabs/tabs.ssr.test.ts
  rtk pnpm --filter @lyra-ds/alpine exec vitest run --browser.name chromium src/tabs.browser.test.ts
  ```

  Overlay readiness fallback:

  ```bash
  rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/dialog/dialog.browser.test.tsx src/drawer/drawer.browser.test.tsx src/bottom-sheet/bottom-sheet.browser.test.tsx src/popover/popover.browser.test.tsx src/dropdown/dropdown.browser.test.tsx src/tooltip/tooltip.browser.test.tsx
  rtk pnpm --filter @lyra-ds/alpine exec vitest run --browser.name chromium src/dialog.browser.test.ts src/drawer.browser.test.ts src/bottom-sheet.browser.test.ts src/popover.browser.test.ts src/dropdown.browser.test.ts src/tooltip.browser.test.ts
  ```

  Record exact exit results and relevant assertions. A passing test may confirm that the currently documented behavior exists; it does not prove that the behavior satisfies the v1 contract.

- [ ] **Step 5: Confirm, reject, or bound the selected claim**

  Record one classification under `Focused Audit`:

  - `Confirmed` only when current implementation or public documentation contradicts an approved requirement or demonstrates the claimed gap.
  - `Rejected` when current behavior and public contract already satisfy the cited requirement.
  - `Inconclusive` only when the missing proof itself can become a bounded evidence-producing spike.

  If rejected, audit the next ranked eligible candidate using Steps 3–5. Do not exceed two focused audits. If both are rejected, or no eligible candidate exists, record the overlay-readiness fallback as an `Inconclusive` evidence-producing audit rather than a product defect.

- [ ] **Step 6: Record the unique recommendation and commit the decision**

  Append this exact structure:

  ```markdown
  ## Recommendation

  **Selected:** BKL-02

  **Classification:** Confirmed

  **Reason:** One paragraph connecting current evidence, score, tie-breaks, and audit result.
  ```

  Replace `BKL-02` with the identifier that survived the audit and use exactly one classification allowed by Step 5. If the fallback is needed, add it as the final sequential candidate before naming it here. Then run:

  ```bash
  rtk pnpm exec prettier --check docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md
  rtk git diff --check
  rtk git add docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md
  rtk git commit -m "docs: select next delivery candidate"
  ```

### Task 3: Complete and Verify the Next Delivery Contract

**Files:**

- Modify: `docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md`

**Interfaces:**

- Consumes: the unique selected identifier, classification, evidence, and focused commands from Task 2.
- Produces: a self-contained `Next Delivery Contract` that can generate the selected capability's design and plan without reopening candidate selection.

- [ ] **Step 1: Write the complete delivery contract**

  Append these exact headings and fill each with a concrete decision supported by the selected evidence:

  ```markdown
  ## Next Delivery Contract

  ### Affected Contract

  ### Scope

  ### Adapter and Documentation Impact

  ### Verification Gates

  ### Compatibility and Release

  ### Completion Condition
  ```

  `Affected Contract` names the public package, component family, consumer flow, and observed gap. `Scope` lists inclusions and exclusions. `Adapter and Documentation Impact` explicitly decides React, Alpine, CSS, English docs, Portuguese docs, and stack-tab effects. `Verification Gates` names test-first files or evidence artifacts plus every applicable browser, axe, SSR, hydration, build, bundle, packaging, and consumer-smoke command. `Compatibility and Release` decides API compatibility, migration material, and whether a changeset is required. `Completion Condition` is objective and contains no unresolved choice.

- [ ] **Step 2: Add the verification record**

  Append:

  ```markdown
  ## Verification

  - Baseline and evidence-source completeness
  - Candidate eligibility and score arithmetic
  - Focused audit result
  - Unique recommendation
  - Delivery-contract completeness
  - Documentation-only branch scope
  ```

  For each line, record `PASS` followed by the exact evidence or command that proves it. Do not mark a line `PASS` from expectation alone.

- [ ] **Step 3: Run structural and selection checks**

  Run this exact check. It fails when a required section, candidate, recommendation, or allowed audit classification is missing:

  ```bash
  rtk node --input-type=module -e "import { readFileSync } from 'node:fs'; const file = 'docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md'; const text = readFileSync(file, 'utf8'); const headings = ['Baseline','Evidence Sources','Candidate Evidence','Candidates','Scoring','Focused Audit','Recommendation','Next Delivery Contract','Verification']; for (const heading of headings) if (!new RegExp('^## ' + heading + '$', 'm').test(text)) throw new Error('Missing heading: ' + heading); const candidates = [...new Set(text.match(/\\bBKL-\\d{2}\\b/g) ?? [])]; if (candidates.length === 0) throw new Error('No candidate recorded'); const recommendation = text.split(/^## /m).find((section) => section.startsWith('Recommendation\\n')); if (!recommendation) throw new Error('Missing Recommendation section'); const selected = recommendation.match(/^\\*\\*Selected:\\*\\* (BKL-\\d{2})$/m); if (!selected || !candidates.includes(selected[1])) throw new Error('Recommendation must select one recorded candidate'); const classes = recommendation.match(/^\\*\\*Classification:\\*\\* (Confirmed|Rejected|Inconclusive)$/gm) ?? []; if (classes.length !== 1) throw new Error('Recommendation must contain one allowed classification');"
  ```

  Recompute each scoring row manually from its four integer dimensions. Confirm table ordering and every applied tie-break against the design before continuing.

- [ ] **Step 4: Verify formatting, scope, and repository state**

  Run:

  ```bash
  rtk pnpm exec prettier --check docs/superpowers/specs/2026-08-15-next-evidence-cycle-design.md docs/superpowers/plans/2026-08-15-next-evidence-cycle.md docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md
  rtk git diff --check
  rtk git diff --name-only
  rtk git diff --name-only -- .changeset packages apps tools .github package.json pnpm-lock.yaml
  rtk git status --short --branch
  ```

  Run these commands before the final commit so the checks include Task 3's uncommitted contract and verification edits. The scoped path command must print nothing, and the working-tree path list may contain only the evidence artifact. Preserve any user-owned untracked entry and report it separately.

- [ ] **Step 5: Commit the final contract and hand off**

  Apply any factual, arithmetic, or contract correction required by Steps 3–4, then commit the completed evidence artifact:

  ```bash
  rtk git add docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md
  rtk git commit -m "docs: complete next delivery contract"
  rtk git diff --check origin/main...HEAD
  rtk git diff --name-only origin/main...HEAD
  rtk git diff --name-only origin/main...HEAD -- .changeset packages apps tools .github package.json pnpm-lock.yaml
  ```

  After the commit, the scoped path command must again print nothing, and the full committed path list may contain only the approved design, this plan, and the evidence artifact. Report the selected identifier, score, classification, affected public surfaces, applicable gates, and exact path to `Next Delivery Contract`. Do not begin the selected capability in this plan.

## Plan Self-Review

- **Spec coverage:** Task 1 captures the synchronized baseline and all seven evidence-source classes. Task 2 applies eligibility, priority, scoring, tie-breaks, the two-audit limit, rejection behavior, and the overlay fallback. Task 3 writes every required delivery-contract decision and verifies the single-artifact, documentation-only result.
- **Scope:** The plan creates one execution artifact and does not authorize source, dependency, API, version, generated-output, budget, test-infrastructure, changeset, Blade, adapter, or release changes.
- **Consistency:** Candidate identifiers start at `BKL-02`, recommendation syntax is fixed, classifications are restricted to `Confirmed`, `Rejected`, or `Inconclusive`, and the structural check consumes those exact forms.
- **Verification:** The plan uses current GitHub and repository evidence, focused existing tests only after selection, deterministic score arithmetic, formatter and diff checks, and an explicit no-changeset/source-path assertion.
