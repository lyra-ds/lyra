# Batuta profile — lyra-ds

Created on 2026-07-20 via `/batuta:init`. Complements `.claude/CLAUDE.md` —
what is already there (CSS-first architecture constraints, fixed stack, locked
decisions) is NOT repeated here; briefs must point executors to the relevant
CLAUDE.md constraints when they touch style/tokens.

## Stack

- pnpm 11.13.1 monorepo (workspaces + changesets), Node 24, TypeScript 5.9.3.
- `packages/react` (React 19 dev / peer >=18, tsup build) + `packages/styles`
  (plain CSS, no build). Convention template: the Batuta plugin's
  `templates/react.md`, except styling here is ALWAYS `.lyra-*` classes from
  the styles package (never new inline/module CSS in react).

## Methodology

- Tests after implementation (tests-after), Vitest runner (Browser Mode for
  component/a11y).
- Conventional commits; feature branches with PRs to `main` (protected branch
  — never commit directly to main).

Execution: sequential
Worktree: medium+
Install: pnpm install

## Commands

- Test: `pnpm test` · Build: `pnpm build` · Lint: `pnpm lint` (prettier) ·
  Typecheck: `pnpm typecheck` · Parity: `pnpm parity` · Smoke: `pnpm smoke`

**This list is not the gate — CI is.** It was incomplete and cost a PR with 3
of 4 checks red after 55 commits. CI's `lint` job also runs
`pnpm --filter @lyra-ds/styles run lint:css` (stylelint), and `build` also runs
`pnpm --filter @lyra-ds/react exec size-limit`. Before opening a PR, run **what
is in `.github/workflows/ci.yml`**, not what is written here:

```bash
# job lint
pnpm run lint && pnpm --filter @lyra-ds/styles run lint:css \
  && pnpm --filter @lyra-ds/react run lint
# job typecheck
pnpm --filter @lyra-ds/react run build && pnpm run typecheck
# job test
pnpm run test && pnpm run parity && node tools/icon-registry/generate.mjs --check
# job build
pnpm run build && node tools/docgen/generate.mjs --check \
  && pnpm exec publint packages/styles && node tools/pack-smoke/pack-smoke.mjs \
  && pnpm exec publint packages/react \
  && pnpm --filter @lyra-ds/react exec attw --pack . --profile node16 \
  && pnpm --filter @lyra-ds/react exec size-limit \
  && node tools/dist-scan/assert-use-client.mjs packages/react/dist \
  && node tools/dist-scan/no-cdn-scan.mjs packages/react/dist \
  && node tools/smoke/smoke.mjs
```

There are 17 commands. I made this mistake **twice in a row**: first I followed
the abbreviated list above instead of the workflow; then I “fixed” it from a
`grep` of `ci.yml`, which also hid eslint. Read the entire file.

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

## Delegation — what has worked and what has cost a round

**Kimi hangs on a brief passed through a temporary file (2026-08-04).** Two
`opencode run … "Follow the instructions in $tmpfile"` invocations hung without
output (5min+ each); the inline probe answered in seconds and the SAME content
pasted inline into the argument completed in one clean round. In the trivial
lane, always pass the brief INLINE in the argument — the adapter's temporary
file recipe does not work for this model.

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

- `pnpm install` in a non-workspace subdirectory (for example
  `.batuta/starters/*`) walks up to the monorepo root and installs the workspace;
  use `--ignore-workspace`, or give the starter its own `pnpm-workspace.yaml`
  (which also makes it a root).
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
- `@lyra-ds/react`: exports map == tsup entries == dist basenames; `'use client'`
  via tsup `onSuccess` (deterministic prepend); no CSS import in shipped code;
  `lucide-react` is the only runtime dependency, via generated registry
  (`prettier`-ignored, drift gate `--check`).
- Canonical JSDoc is English; conversion conventions are in
  `packages/react/CONVENTIONS.md`.
- **pt-BR terminology (user rule, 2026-07-30):** CLAUDE.md locks code, token,
  and API names in English and prose in pt-BR. Concept jargon rule:
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

(2026-07-27 sweep by the Research-lane scout — kimi-k2.7-code; details stay
with grep and git.)

- pnpm monorepo with three workspaces (`pnpm-workspace.yaml`): `packages/*`,
  `apps/*`, and `tools/*`. Node 24 required.
- `packages/styles`: pure CSS core, NO build; `styles.css` entry imports
  `tokens/` and `components/`. `compat-shadcn.css` is opt-in subpath, never
  entry-imported. Validated by stylelint + Browser Mode tests in `tests/`.
- `packages/react`: thin wrappers over `.lyra-*`; one directory per component
  plus `internal/`, with `index.ts`, `*.tsx`, browser/SSR tests and screenshots
  where applicable. tsup → dual ESM+CJS dist entries. Only runtime dependency
  `lucide-react`, through generated `src/icon/icon-registry.ts` (do not edit).
- `apps/docs`: Next.js 16 + fumadocs-core/fumadocs-mdx; locale layouts via
  next-intl, messages in `messages/{en,pt-BR}.json`, MDX in
  `content/docs/{en,pt-BR}/`, examples under `components/examples/`; static
  build to `out/`, including copied `llms.txt`.
- `tools/`: parity, generated icon registry, docgen, pack-smoke, smoke, and
  dist-scan gates. `handoff/` is read-only pixel-perfect reference.
- `.github/workflows/ci.yml` has lint/typecheck/test/build; it is the real gate.
  Do not touch generated/build directories, `pnpm-lock.yaml` except through pnpm,
  `handoff/**`, screenshots, docgen output, or generated icon registry directly.

## PR automation — post-incident 0.2.0 rules (2026-08-03)

- **Never predict a PR number.** Use the number captured from `gh pr create`
  (or `--json number`). A changesets bot took the predicted number and an
  `--admin merge` published 0.2.0 without the user.
- **Automation never merges Version Packages.** Verify the title and abort if
  it contains “version packages” — a release is always user-triggered.
- **Landing stats track every inventory change** (components, tokens, classes):
  re-derive and update the pin in the SAME commit; the gate is full `pnpm run
test` with exit code — tail/grep filters hid failures twice.
