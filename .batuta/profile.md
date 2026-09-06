# Batuta profile — lyra-ds

Created on 2026-07-20; reconfigured on 2026-09-06. Complements `.claude/CLAUDE.md` —
what is already there (CSS-first architecture constraints, fixed stack, locked
decisions) is NOT repeated here; briefs must point executors to the relevant
CLAUDE.md constraints when they touch style/tokens.

## Documentation language

All newly written or updated project documentation must be in English,
including Batuta profiles, plans, handoffs, work logs, briefs, and review reports.
This user instruction (2026-09-06) supersedes earlier requirements for pt-BR
project prose. Keep immutable evidence and original historical sources intact;
label translated copies explicitly. Conversation language is independent of
this documentation rule.

## Setup

Stack: pnpm 11.13.1 monorepo; Node 24.18.0; TypeScript 5.9.3; React, Alpine.js, CSS; Next.js apps; tsdown builds.
Methodology: tests-after; Conventional Commits; feature branches and protected-main PRs.
Test: pnpm test
Build: pnpm build
Install: pnpm install --frozen-lockfile
Execution: sequential
Worktree: medium+
Template: templates/react.md

React styling uses `.lyra-*` classes from the styles package. Keep the existing
CSS-first constraints. React emits ESM/CJS; Alpine emits ESM; styles have no build.

## Commands and verification

Use the pinned Node version in `.nvmrc` and pnpm version in `package.json`.
Read the complete `.github/workflows/ci.yml` before choosing PR verification;
it is authoritative. Do not substitute this command index for its steps.

- `pnpm lint`: formatting; CI also runs security, phase/release policy,
  actionlint, styles lint, and React/docs/site ESLint.
- `pnpm typecheck`: recursive checks; build React and Alpine first.
- `pnpm test`: security, overlay core, supporting tool tests, and workspace tests.
  CI separately runs `pnpm test:browsers`, `pnpm test:react-compat`, parity,
  and icon-registry drift. Use the workflow's pinned Playwright container for
  the Chromium/Firefox/WebKit matrix.
- `pnpm build`: workspace builds; CI additionally checks bundle baselines,
  React/Alpine/Blade documentation, Blade API snapshots, publint, attw,
  size-limit, packed artifacts, distribution scans, and consumer smoke tests.
- `pnpm overlay:evaluate:wave2:test`: focused Wave 2 runner/contract tests.
  Evaluation commands and immutable manifests follow their approved plan;
  do not run expensive diagnostics or regenerate evidence routinely.

### Historical verification lessons

Two traps those gates concealed:

- **stylelint × additive extension:** restyling an existing class at the end of
  the file is `no-duplicate-selectors` by construction — parity convention and
  rule conflict. Solve with `stylelint-disable no-duplicate-selectors` at the
  start of each file's additive region, leaving the rule on above in the
  handoff-verbatim region.
- **eslint × browser runner:** `jsx-a11y/anchor-is-valid` rejects `href="#"`,
  but a valid href in a Browser Mode fixture makes the tested click navigate the
  runner iframe and **abort the entire suite** (“Cannot connect to the iframe”).
  The rule is for product code, not fixtures: disable it only in
  `src/**/*.test.tsx`.
- **size-limit × convenience import:** `SidebarGroup` importing `Icon` for a
  chevron pulled in the entire registry and cost **5.4 kB** to anyone importing
  only `SidebarGroup`. Inline SVG is the DS convention for chrome icons (Drawer
  close, Stepper check). A feature that deliberately grows the bundle (`asChild`)
  needs its updated budget in the same commit.

## Delegation — historical lessons and current invocation rules

**Kimi hangs on a brief passed through a temporary file (2026-08-04).** Two
`opencode run … "Follow the instructions in $tmpfile"` invocations hung without
output (5min+ each); the inline probe answered in seconds and the SAME content
pasted inline into the argument completed in one clean round. The current low/research model is `opencode/glm-5.3-flash`; pass its brief
inline as verified during the September 6 review and CI correction.

Lessons from the Phase 6b lots, each with the evidence that produced it. They
apply to every executor, not just codex.

**The work lives in the brief file, not the prompt.** The invocation that
delivered Lots 1, 2, and 3 in one clean round each was literally one line:
`Follow the instructions in .batuta/lot-NN-<slug>.md, which sits on top of the shared brief .batuta/brief-phase06b-fanout.md. Read both in full before writing anything. Work from the repo root; do not commit.` Keep the prompt minimal and the brief rich; long inline instructions are where executor-internal workflows get confused.

**Always redirect `< /dev/null` to codex stdin** (user rule, 2026-07-26). Without
it codex fails intermittently and **lies about why**: in Lots 4 and 5 it claimed
three times to be blocked by workspace permission, first “I can only write in
`packages/react/src`”, then “only in `packages/styles/components`” — two false
limits; a 10-second probe proved it could write `apps/docs`. Four launches and
one mistaken diagnosis were wasted. Correct invocation:

```bash
codex exec --sandbox workspace-write -m <model> -c model_reasoning_effort="high" \
  "Follow the instructions in .batuta/lot-NN.md …" < /dev/null
```

**When re-dispatching after a hang, repeat the original prompt verbatim.** In
Lot 4 codex stopped to request approval for its “design workflow”; I retried
with “APPROVED”, “design approval”, and “do not ask questions”, which fed the
gate and the next round invented a permission wall. Naming the gate invokes it.
Do not argue with an executor's internal flow; return the same instruction that
already worked.

**An executor failure report is a claim, not a fact — verify before escalating.**
Codex said it could write only `packages/react/src` and that `apps/docs` was
read-only. A 10-second probe (`codex exec … "create apps/docs/PROBE.txt with
'ok'"`) disproved it; the repo's `.codex/`/`.agents/` are empty. Escalating to
the expensive lane on a false report wastes money; use the cheap probe first.

**Codex's sandbox cannot run Browser Mode, so it never executes the tests it
writes.** It cannot bind localhost. In Lot 08 that cost 8 falsely reported
successes: new `it()` blocks were inserted inside an existing `it()` and inside
the theme×tone double `for`; Vitest rejects this at runtime. Typecheck, eslint,
and prettier passed. Therefore the maestro always runs `pnpm run test`; its
test report is worth zero. The same applies to `pack-smoke`, `smoke`, and
`publint`, which do not survive the sandbox.

**Existence assertions in Browser Mode require `expect.element` — a locator is
never null.** In Lot 09, 12 of 20 tests used
`expect(screen.getByRole(...)).not.toBeNull()`: the Browser Mode locator is
always an object. The revert-the-fix proof caught tests still green for a
missing button. Correct form:
`await expect.element(screen.getByRole(...)).toBeInTheDocument()`. Briefs with
existence tests must pin this. Four pre-existing vacuous uses in
`file-manager.browser.test.tsx` remain debt in WORK.md.

**In a worktree with no commits, `git checkout -- <file>` destroys executor
work.** The brief says do not commit, so HEAD is still main. In Lot 09 checkout
deleted both `.tsx` files after a regression experiment; recover from the
reviewed diff. Experiment backup is by copy: `cat file > backup` before and
`cat backup > file` after — `cat`, not `cp`, because the interactive `cp` alias
silently defeats even `-f`.

**Integration always runs from the main checkout, never inside the worktree.**
`git merge --squash batuta/<slug>` executed inside the worktree merges the
branch into itself and reports "Already up to date"/"nothing to squash". This
bit three times in one night (2026-08-04) because verification commands chain
`cd` into the worktree and the merge rode the same shell. Check
`git branch --show-current` before the merge — it must print the feature
branch on the main checkout.

**A passing test is not a test that proves.** Still in Lot 08, revert the fix
and see the test fail: edit with `sed`, run only the directory, restore. It
took 30 seconds and produced `expected 'Loading' to be 'Carregando'`, proving
it catches silent loss. (Beware `cp` without `-f`: an interactive alias can
leave the file reverted.)

**A prop that works but is absent from the interface does not exist to the
consumer.** Docgen reads the interface, not destructuring. `Breadcrumb` and
`Pagination` always honored `aria-label`, but no one knew because it came from
`HTMLAttributes` and was absent from the table. Redeclare it with JSDoc when a
component treats an inherited prop specially.

**A success report is insufficient too.** `next build` prerenders a broken
example without failing, and the executor cannot open dev in its sandbox. Every
lot verification opens pages in a browser and exercises interaction; that found
the third-party CDN avatar in Lot 2 and what green gates miss.

**A clean round comes from pinning what the executor cannot derive.** It is not
brief size but specificity: exact type shapes, API traps (`actions` on
FileManager replaces rather than extends the menu; Tabs renders its own empty
panels), an actually existing class, and lessons from earlier rounds. Collect
this by reading source before writing the brief.

**Lot economics:** Context + Conventions are built once and reused across the
whole lot; only Goal, criteria, and boundaries vary per item.

## Verification outside the monorepo (starters, 2026-08-04)

- The starters live in their own repos (`lyra-ds/starter-next`,
  `lyra-ds/starter-vite`) and are cloned outside this monorepo; the local copies
  under `.batuta/starters/` were removed on 2026-08-09.
- `pnpm install` in a non-workspace subdirectory of the monorepo walks up to the
  root and installs the workspace; use `--ignore-workspace`, or give the starter
  its own `pnpm-workspace.yaml` (which also makes it a root). This is why the
  starters are verified from a clone outside the repo.
- pnpm 11.13 renamed `onlyBuiltDependencies` to `allowBuilds:` (a name→bool
  map) in `pnpm-workspace.yaml`; the `pnpm` field in package.json is no longer
  read.
- The user's machine has `minimumReleaseAge` policy (~24h) that blocks a newly
  published package — when verifying a starter on release day, use
  `--config.minimum-release-age=0` (also on `pnpm build`, which rechecks deps).
  Never write that override into the template.

## GSD takeover (2026-07-20)

The user retired GSD; Batuta took over orchestration. Imported: phases 1–3 →
`WORK.md` (Done), phases 4–7 → `.batuta/plan-04..07-*.md`, durable decisions →
below. `.planning/` stays intact as historical archive (REQUIREMENTS.md,
research/PITFALLS.md, and phase decision logs remain reading references); the
user archives it when desired.

## Inherited decisions that briefs must respect

- Branch flow: NEVER commit to main (ruleset requires PR + 4 green checks:
  lint, typecheck, test, build + 1 approval).
- Always exact versions (`save-exact` in `.npmrc`); engines `>=24 <25`.
- `@lyra-ds/styles` CSS is handoff-verbatim: no prettier; stylelint validates
  only `.lyra-*` namespace; extras go at the END + parity
  ADDITIVE_EXTENSIONS allowlist. The handoff inventory (209 tokens / 248 classes
  / 14 entry imports) is no longer literal code: since 2026-07-28 it lives in
  `tools/parity/baseline.json`, a committed snapshot regenerated with
  `pnpm parity --update-baseline`. It is versioned, not immutable: advance the
  handoff by updating `handoff/`, regenerating, and reviewing the diff. Do not
  regenerate without intended `handoff/` change; the baseline holds names
  because counts miss a two-sided rename.
- `@lyra-ds/react`: exports map == tsdown entries == dist basenames; `'use client'`
  via `scripts/use-client.mjs` after tsdown builds (deterministic prepend); no CSS import in shipped code;
  `lucide-react` is the only runtime dependency, via generated registry
  (`prettier`-ignored, drift gate `--check`).
- Canonical JSDoc is English; conversion conventions are in
  `packages/react/CONVENTIONS.md`.
- **Historical pt-BR terminology (2026-07-30; superseded for project
  documentation on 2026-09-06):** the former rule used English code, token,
  and API names with pt-BR prose. The historical terminology guidance was:
  - Keep in English what a Brazilian developer **types into search and says
    aloud**: build, deploy, bundler, viewport, overflow, token, hook, rebuild.
  - Translate where pt-BR has a dominant term: folha de estilos, marca, escopo,
    superfície, contraste, anel de foco.
  - **Never invent a translation to avoid a dominant foreign term.** “semente”
    for _seed_ (`--brand` in white-label) was botanical and odd.
  - When both options sound bad, **replace the metaphor with a description**:
    `--brand` became **“cor-base”**. The same applied to the targeting hook of
    `.lyra-icon`: rather than “gancho” or “hook” (which would collide with the
    React hook mentioned two words earlier), rewrite it as “para você conseguir
    selecionar o ícone no seu CSS”.
  - One form per concept across the site. The sweep found “folha de estilo” vs.
    “folha de estilos” and “rederiva” vs. “recalcula”; normalized to plural and
    “recalcula”.
- **Dogfooding the site — docs AND landing (Jul/2026; expanded 2026-07-28):**
  the point is not internal aesthetics. The user decided landing and docs use
  Lyra components **because other users can reuse them** — the site is the
  first proof that the DS builds a real product. When the site needs something
  Lyra lacks, ask “would a Lyra consumer want this?” If yes, **make it a DS
  component** (with changeset and test), not `.lw-*`. `ThemeProvider` and
  `PageHeader` entered Phase 6 by this rule. `.lw-*` is only genuinely
  site-specific composition, hero, CTA, and marketing chrome. `apps/docs` uses
  the DS, never raw `.lyra-*` where a React component exists (for example
  `<Table>`, `<Card>`, `<Badge>`, `<Button asChild>`). `apps/docs/app/site.css`
  `.lw-*` classes are only docs-site layout; preview layout also uses `.lw-*`,
  never inline `style={{}}`. Extend the DS when needed. Specificity warning:
  `.lw-docs__content a:not(.lyra-btn)` and `.lw-docs__content p` beat a loose
  `.lw-*` class — prefix an override.
- **Impeccable per component (user rule, 2026-07-25):** every created component
  goes through the `impeccable` skill on its demo page, not just a showcase;
  run after lot verification and before commit. The first round (14/20) found
  375px horizontal scroll, sticky sidebar without `max-height`, 39 targets
  under 44px, missing `<main>`, and a preview flattening a block component.
  Site-chrome findings go to `apps/docs`; component findings become DS lots/issues.

## Project map

Refreshed on 2026-09-06 against the Wave 2 branch, with a read-only
OpenCode / `opencode/glm-5.3-flash` scout and controller path/source checks.

The pnpm workspace covers `packages/*`, `apps/*`, and `tools/*`.
`package.json` holds orchestration scripts; `.nvmrc` pins the Node toolchain.
`packages/styles/styles.css` imports the CSS tokens and component groups.
Its `tests/` directory contains style browser tests; styles need no build.
`packages/react/src/` holds per-component entries, browser tests, and internals.
`packages/react/tsdown.config.ts` maps exports to separate ESM/CJS entries.
`packages/react/scripts/use-client.mjs` prepends the client directive after build.
`packages/alpine/src/index.ts` registers the Alpine plugin and component modules.
Alpine browser tests sit alongside sources; its tsdown build emits ESM.
`apps/docs` is the Next.js documentation app with Fumadocs and localized content.
`apps/site` is the separate Next.js landing app; both consume workspace packages.
Each app's `next.config.ts` controls its production static export.
`tools/overlay-foundation-evaluation/` owns contracts, candidates, fixtures,
runners, manifests, and the modal/Wave 2 evaluation scripts.
`tools/docgen/` generates React, Alpine, and Blade documentation artifacts.
`tools/blade-api/` validates the imported external Blade API snapshot.
`tools/parity/` compares CSS with the versioned handoff baseline.
`tools/icon-registry/` generates the React icon registry; do not edit it by hand.
`tools/pack-smoke/`, `tools/smoke/`, and `tools/react-compat/` check consumers.
`tools/dist-scan/` and `tools/bundle-baseline/` inspect published build outputs.
Security and phase/release policy checks live in their named `tools/` directories.
`docs/superpowers/plans/` and `specs/` hold the approved development contracts.
`WORK.md` and `.batuta/plan-*.md` record current coordination and resume state.
`.planning/` and historical handoffs preserve earlier decisions and evidence.
`.github/workflows/ci.yml` defines the complete lint/typecheck/test/build gates.
Regenerate docgen output and the icon registry through their owning tools.
Do not hand-edit dist, app build output, lockfiles, or immutable evaluation data.
Change handoff/baseline files only within an explicitly scoped baseline update.

## PR automation — post-incident 0.2.0 rules (2026-08-03)

- **Every PR: assignee franciscpd + content labels (user rule, 2026-08-06).**
  Use the existing scheme (`pkg: styles|react|alpine`, `docs site`,
  `documentation`, `github_actions`, `dependencies`, `a11y`, `bug`,
  `enhancement`); pass `--assignee franciscpd --label ...` on `gh pr create`.

- **Never predict a PR number.** Use the number captured from `gh pr create`
  (or `--json number`). A changesets bot took the predicted number and an
  `--admin merge` published 0.2.0 without the user.
- **Automation never merges Version Packages.** Verify the title and abort if
  it contains “version packages” — a release is always user-triggered.
- **Landing stats track every inventory change** (components, tokens, classes):
  re-derive and update the pin in the SAME commit; the gate is full `pnpm run
test` with exit code — tail/grep filters hid failures twice.
