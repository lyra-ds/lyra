# Current Baseline and Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one evidence-backed backlog from the repository's current
state and name the next independently releasable capability.

**Architecture:** This is a documentation-only maintenance block. One dated
baseline report records the current package surfaces and verification results;
one dated backlog turns only evidenced gaps into scored candidates and selects
the first delivery item. No package source, public API, dependency, or release
version changes in this block.

**Tech Stack:** Node.js 24, pnpm 11.13.1, Vitest 4.1.10, TypeScript 5.9.3,
Git, GitHub Actions workflow definitions, Markdown.

## Global Constraints

- Treat the checked-out repository and its recorded verification output as the
  source of truth; `.planning/` is historical context only.
- Run commands through `rtk` and preserve any pre-existing untracked files.
- Do not alter `packages/**`, `apps/**`, `.github/**`, dependency manifests,
  lockfiles, package versions, or changesets.
- This block has no production behavior, so test-first implementation is not
  applicable. Its automated proof is the documented command output and the
  deterministic consistency checks in Task 3.
- Use canonical English in the created records.
- The CI workflow's required job names—`lint`, `typecheck`, `test`, and
  `build`—are immutable; this block only inventories them.

---

## File Structure

- Create `docs/superpowers/backlog/2026-08-15-current-baseline.md` — immutable
  evidence snapshot: commit, public surfaces, package versions, test results,
  and CI gates.
- Create `docs/superpowers/backlog/2026-08-15-prioritized-backlog.md` —
  candidate table, scoring rationale, selected next capability, and delivery
  contract for the next cycle.

### Task 1: Capture the Current Repository Baseline

**Files:**

- Create: `docs/superpowers/backlog/2026-08-15-current-baseline.md`
- Read: `package.json`, `packages/react/package.json`,
  `packages/alpine/package.json`, `packages/styles/package.json`, and
  `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: package manifest scripts and versions; tracked source/test files;
  the four CI jobs defined in `.github/workflows/ci.yml`.
- Produces: a Markdown report with the exact headings `Identity`, `Package
Surface`, `Verification Evidence`, and `CI Gates`. Task 2 consumes those
  headings and their facts.

- [ ] **Step 1: Record repository identity**

  Run the following commands from the repository root and copy their output
  verbatim into the report's `Identity` section:

  ```bash
  rtk git rev-parse HEAD
  rtk git status --short
  rtk git log -1 --format='%H%n%ad%n%s' --date=iso-strict
  rtk node --version
  rtk pnpm --version
  ```

  State whether the worktree has user-owned changes. Do not stage, delete, or
  otherwise modify entries that predate this block.

- [ ] **Step 2: Capture package and documentation surfaces**

  Create a `Package Surface` table with rows for `@lyra-ds/styles`,
  `@lyra-ds/react`, `@lyra-ds/alpine`, `@lyra-ds/docs`, and `@lyra-ds/site`.
  For each row record version (or `private`), public purpose, and its
  verification command from the owning `package.json`.

  Run and record these repeatable inventory commands beneath the table:

  ```bash
  rtk git ls-files 'packages/react/src/*/*.tsx' | rg '/[^/]+\.tsx$' | rg -v '\.(browser\.test|ssr\.test)\.tsx$' | wc -l
  rtk git ls-files 'packages/react/src/*/*.browser.test.tsx' | wc -l
  rtk git ls-files 'packages/react/src/*/*.ssr.test.ts' | wc -l
  rtk git ls-files 'packages/alpine/src/*.ts' | rg -v '\.browser\.test\.ts$' | wc -l
  rtk git ls-files 'apps/docs/content/docs/en/components/*.mdx' | wc -l
  rtk git ls-files 'apps/docs/content/docs/pt-BR/components/*.mdx' | wc -l
  ```

  Explain each count in one sentence, rather than treating it as a release
  claim. For example, React source files and React tests are different
  measures and must remain separate rows.

- [ ] **Step 3: Re-run the baseline library verification**

  Run the root test command once:

  ```bash
  rtk pnpm test
  ```

  Record the command exit status and the per-package passed/failed test-file
  and test counts reported for `packages/styles`, `packages/react`, and
  `packages/alpine`. If a package fails, record its first failing test file
  and stop this plan: the failure becomes the only recommended next item.

- [ ] **Step 4: Inventory the enforced CI gates**

  From `.github/workflows/ci.yml`, transcribe the exact command list in each
  required job—`lint`, `typecheck`, `test`, and `build`—into the `CI Gates`
  section. Group commands by job and include the package-scoped gates such as
  stylelint, ESLint, parity, icon-registry drift, docgen checks, publint,
  attw, size-limit, and smoke tests.

  Do not copy workflow commentary that does not change an executed command.
  The report must be short enough for Task 2 to use as an audit input.

- [ ] **Step 5: Review and commit the snapshot**

  Verify the report contains all four required headings and no claims that
  cannot be traced to one of the commands above. Then commit only this report:

  ```bash
  rtk git add docs/superpowers/backlog/2026-08-15-current-baseline.md
  rtk git commit -m "docs: record current delivery baseline"
  ```

### Task 2: Build the Prioritized Backlog and Select the Next Capability

**Files:**

- Create: `docs/superpowers/backlog/2026-08-15-prioritized-backlog.md`
- Read: `docs/superpowers/backlog/2026-08-15-current-baseline.md`,
  `docs/superpowers/specs/2026-08-15-sequential-delivery-cycle-design.md`,
  `packages/react/README.md`, `packages/alpine/README.md`,
  `apps/docs/lib/stacks.ts`, and the latest 40 Git commits.

**Interfaces:**

- Consumes: the Task 1 baseline headings and evidence; adapter README
  contracts; documentation stack metadata; recent history.
- Produces: a Markdown backlog with `Evidence`, `Candidates`, `Scoring`,
  `Recommendation`, and `Next Delivery Contract` headings. The following
  delivery plan consumes the selected recommendation and its contract.

- [ ] **Step 1: Gather candidate evidence without changing source**

  Run the following read-only commands and use only their output, the baseline
  report, and the referenced public documentation as evidence:

  ```bash
  rtk git log -40 --format='%H%x09%ad%x09%s' --date=short
  rtk rg -n "T''ODO|FIX''ME|T''BD|not implemented" packages apps tools .github --glob '!**/dist/**' --glob '!**/node_modules/**'
  rtk rg -n "export \{.*\}|export function lyra" packages/react/src/index.ts packages/alpine/src/index.ts
  ```

  Classify matches inside test fixtures, explicit defensive errors, generated
  outputs, and historical planning documents as non-candidates unless they
  identify a currently broken public behavior. A candidate must cite a file,
  commit, failed gate, or documented public-contract mismatch.

- [ ] **Step 2: Define bounded, evidence-backed candidates**

  Add one row per candidate to the `Candidates` table. Each row must contain:

  | Field       | Required content                                             |
  | ----------- | ------------------------------------------------------------ |
  | Identifier  | `BKL-01`, `BKL-02`, and so on, in priority order             |
  | User impact | The affected user flow and adapter(s)                        |
  | Evidence    | Exact path, commit, test output, or public-contract citation |
  | Scope       | The smallest independently releasable change                 |
  | Proof       | Exact package-level command(s) that would prove the change   |
  | Exclusions  | Nearby work deliberately outside this item                   |

  Do not create speculative feature ideas. If the evidence reveals no defect
  or mismatch, create exactly one candidate: `BKL-01: perform a public API
compatibility audit of the highest-churn adapter surface`. Its evidence
  must be the current versions and latest adapter-related commits, and its
  scope must be a read-only contract comparison that produces a new plan,
  not source changes.

- [ ] **Step 3: Score candidates deterministically**

  Add a `Scoring` table and assign each candidate integer points using this
  formula:

  ```text
  Priority = user impact (0–3)
           + release/accessibility risk (0–3)
           + automated proof available now (0–2)
           + supported-surface reach (0–2)
  ```

  A candidate with an existing failing gate receives `3` for
  release/accessibility risk. A candidate requiring a new test harness
  receives at most `1` for automated proof. Sort by descending priority; ties
  are resolved by the smaller scope, then by the older evidence date.

- [ ] **Step 4: Record one recommendation and its complete delivery contract**

  In `Recommendation`, name exactly one highest-ranked candidate. In `Next
Delivery Contract`, state all of the following explicitly:

  - affected public package(s) and consumer-facing behavior;
  - whether React is affected, whether Alpine parity is required, and which
    docs stack tabs/examples must change;
  - required test-first test files and focused commands;
  - SSR, Browser Mode, axe, build, or packaging gates that apply;
  - compatibility policy and whether a changeset is expected;
  - the condition that declares the block complete.

  When a failed baseline gate selected the item, the contract must start with
  reproducing that exact failure in a focused test before any production code
  is changed.

- [ ] **Step 5: Commit the backlog**

  Verify every candidate has evidence and proof, the scoring sum is correct,
  and the recommendation is unique. Then commit only the backlog record:

  ```bash
  rtk git add docs/superpowers/backlog/2026-08-15-prioritized-backlog.md
  rtk git commit -m "docs: prioritize delivery backlog"
  ```

### Task 3: Validate the Records and Hand Off the Selected Delivery Item

**Files:**

- Modify: `docs/superpowers/backlog/2026-08-15-current-baseline.md` only if
  Task 3 finds a factual omission; otherwise do not modify it.
- Modify: `docs/superpowers/backlog/2026-08-15-prioritized-backlog.md` only
  if Task 3 finds an evidence, arithmetic, or contract omission.

**Interfaces:**

- Consumes: the two dated Markdown records produced by Tasks 1 and 2.
- Produces: a verified recommendation whose `Next Delivery Contract` is a
  self-contained input for the next implementation plan.

- [ ] **Step 1: Run structural completeness checks**

  Run this command. It fails when a required heading is missing from either
  report:

  ```bash
  rtk node --input-type=module -e "import { readFileSync } from 'node:fs'; const checks = [['docs/superpowers/backlog/2026-08-15-current-baseline.md',['Identity','Package Surface','Verification Evidence','CI Gates']],['docs/superpowers/backlog/2026-08-15-prioritized-backlog.md',['Evidence','Candidates','Scoring','Recommendation','Next Delivery Contract']]]; for (const [file, headings] of checks) { const text = readFileSync(file, 'utf8'); for (const heading of headings) { if (!text.includes('## ' + heading)) throw new Error(file + ' is missing: ' + heading); } }"
  ```

- [ ] **Step 2: Run candidate consistency checks**

  Run this command. It fails if the backlog has no candidate identifier or no
  uniquely named recommendation:

  ```bash
  rtk node --input-type=module -e "import { readFileSync } from 'node:fs'; const text = readFileSync('docs/superpowers/backlog/2026-08-15-prioritized-backlog.md', 'utf8'); const candidates = text.match(/BKL-\\d{2}/g) ?? []; if (candidates.length === 0) throw new Error('No backlog candidate recorded'); const recommendation = text.match(/^## Recommendation\\n\\n([^\\n]+)/m)?.[1]?.trim() ?? ''; if (!/^BKL-\\d{2}:/.test(recommendation)) throw new Error('Recommendation must name exactly one BKL item');"
  ```

- [ ] **Step 3: Verify documentation formatting and tracked changes**

  Run:

  ```bash
  rtk pnpm exec prettier --check docs/superpowers/backlog/2026-08-15-current-baseline.md docs/superpowers/backlog/2026-08-15-prioritized-backlog.md
  rtk git diff --check HEAD~2..HEAD
  rtk git status --short
  ```

  Preserve user-owned entries shown by the final status command. The only
  commits created by this plan must contain the two backlog records, except
  for a correction from Step 1 or Step 2.

- [ ] **Step 4: Commit a correction only when needed and present the handoff**

  If Steps 1–3 required a correction, commit the corrected record:

  ```bash
  rtk git add docs/superpowers/backlog/2026-08-15-current-baseline.md docs/superpowers/backlog/2026-08-15-prioritized-backlog.md
  rtk git commit -m "docs: verify delivery backlog"
  ```

  Report the selected `BKL-##` identifier, its priority score, public
  packages, required gates, and the exact path to its delivery contract. Do
  not begin the selected capability in this plan.

## Plan Self-Review

- **Spec coverage:** Task 1 establishes the baseline; Task 2 creates one
  evidence-backed backlog and selects one capability; Task 3 validates the
  records and provides a reliable handoff. These map directly to the approved
  sequential-delivery specification.
- **Scope:** The plan changes only planning records. It deliberately defers
  every product, adapter, documentation, and release change until a candidate
  is selected with evidence.
- **Verification:** Every output has a command-based proof, and the final
  structural checks make the two records reusable in a later session.
