# WORK — lyra-ds

## In progress

- [x] **Onda 1 `@lyra-ds/alpine` COMPLETA — 0.1.0 PUBLICADO (2026-08-07)**
      (plan: `.batuta/plan-09-alpine.md`, todas as 9 tasks) — plugin Alpine
      com os 7 interativos core portados do React: Dropdown #116, Dialog
      #117, Drawer #118, Tabs #119, Accordion #120, Tooltip #124, Popover
      #125; README/release #126; scaffold #113 (sessão anterior). 64 testes
      Browser Mode contra o CSS real; size-limit 4.22/4.45 kB. Saga de CI do
      dia (4 falhas em 3 suites, sempre verde local) resolvida em 3 camadas:
      #121 waitFor, #122 flush sincronizado com Alpine.nextTick, e a RAIZ em
      #123 — reveal do x-show é rAF/setTimeout deferido vs $nextTick em
      setTimeout, ordem não-determinística; `internal/when-visible.ts` faz
      poll de layout antes de focar/medir (lição irmã do x-show/mounted do
      #117). Publish 0.1.0 LOCAL com OTP do usuário (OIDC não faz primeiro
      publish — npm/cli#8544, mesmo rito de styles/react); tag + GitHub
      Release criados; guard do release.yml passa a ver 0.1.0 publicado.
      Trusted publisher do @lyra-ds/alpine configurado pelo usuário no
      npmjs.com (2026-08-07) — OIDC com provenance assume do 0.1.1 em
      diante, zero pendências. 0.1.1 PUBLICADO 2026-08-07 via OIDC
      (primeiro release 100% automático do pacote): fix accordion/tabs —
      `:class` string nunca remove classe pré-existente no markup; estado
      SSR (`lyra-acc__item--open`, `lyra-tab--active`) ficava preso ao
      fechar/trocar; sintaxe de objeto reconcilia (PR #130, squash
      3757c78 + Version PR #131; regressões `serverRenderedOpen`/
      `serverRenderedActive`, 66 testes; demais `:class` auditados —
      `--closing` e placement não são pré-renderizáveis). Trails:
      .batuta/runs/2026-08-06-alpine-dropdown.md,
      2026-08-07-alpine-dialog.md, 2026-08-07-alpine-wave1-fanout.md.

- [ ] **Satellite direction `lyra-ds/blade` (decided 2026-08-05)** — Blade as
      the first framework satellite (before Vue/Svelte), then a Filament v4
      token-bridge theme. PRDs in `~/Documents/prd-lyra-blade.md` and
      `~/Documents/prd-lyra-filament-theme.md`; each satellite lives in its
      own repo with its own Claude/Batuta session. Status: announcement
      article PUBLISHED 2026-08-04 (bilingual, personal site,
      `francisross/src/content/blog/lyra-ds-css-first-design-system.*`);
      blade phase 1 IN PROGRESS in its own session. This repo's role: serve
      the satellites (CSS stays npm-only; class-emission parity with React
      is the central gate) and syndicate the article: files ready in
      `~/Documents/lyra-ds-devto-en.md` (canonical_url, published: false)
      and `~/Documents/lyra-ds-tabnews-pt.md`; publishing is user-side.

## Done

- [x] **Sponsors pipeline + landing section (2026-08-07)** — org GitHub
      Sponsors profile approved (github.com/sponsors/lyra-ds, public, goal 10
      monthly). Wiring done outside the cycle: org-default FUNDING.yml in
      lyra-ds/.github; PR #133 (funding field in the 3 published
      package.json + README badges). Cycle (worktree `batuta/sponsors`, both
      lots one clean round each): lot 01 SponsorKit 18.0.0 pipeline
      (config + update-sponsors script with committed contract
      data/sponsors.json + public/sponsors.svg, weekly sponsors.yml opening a
      PR — main is protected) → codex, commit 157be3c (trail:
      .batuta/runs/2026-08-07-sponsors-01-pipeline.md); lot 02 bilingual
      Sponsors landing section (empty state + heart CTA; renders self-hosted
      /sponsors.svg when populated; static-export test extended) → codex,
      commit 7123efd (trail:
      .batuta/runs/2026-08-07-sponsors-02-section.md); lot 03 zero-sponsor
      fixes (JSON newline normalization + safe svg staging) after the first
      real sponsors.yml run failed → codex (trail:
      .batuta/runs/2026-08-07-sponsors-03-zerofix.md). Research-lane note:
      kimi scout hung with an INLINE brief too (5+ min, zero output, killed)
      — first inline-brief hang on record; maestro did the research (lane
      fallback). USER ACTION pending: create SPONSORKIT_GITHUB_TOKEN secret
      (PAT with read:user + read:org) for sponsors.yml. Site debt noted: no
      scroll-margin on section anchors (all anchors land under the sticky
      header).

- [x] **Foundations styleguide (2026-08-05)** — 15 `handoff/guidelines/`
      cards ported into a manifest-driven docs section: /foundations/{colors,
      typography,spacing,branding,architecture}, bilingual, live-token
      examples. Lot f1 (infra + Colors) PR #107 → codex (`gpt-5.6-terra`,
      high, worktree; 1 verbatim re-dispatch past its design-approval gate;
      trail: .batuta/runs/2026-08-05-foundations-colors.md), merged 3b39e0f.
      Lot f2 (typography + spacing, 7 live examples) PR #108 → codex (1 retry
      fixing 4 verification findings; trail:
      .batuta/runs/2026-08-05-foundations-type-spacing.md), merged 66585c9.
      Lot f3 (branding + architecture) PR #109 → codex (1 legitimate
      collision stop — slug renamed `branding`; cross-review accepted 1
      fact-check finding; trail:
      .batuta/runs/2026-08-05-foundations-brand-arch.md), merged f3c2a7a.
- [x] **Dependency triage (was Dependabot #92) — CLOSED 2026-08-05.** Tier D1
      (12 safe minor/patch) PR #110, merged 1effb5d — root cause of the old
      red: duplicate React from stale peer resolution, fixed with pnpm dedupe
      (trail: .batuta/runs/2026-08-05-deps-d1.md). Tier D2 (next 16.3.0 +
      fumadocs-core 16.14.0) PR #111, merged cb7b4da, browser-proven (trail:
      .batuta/runs/2026-08-05-deps-d2.md). Tier D3 (lucide-react 1.28.0 +
      @fontsource 5.3.0) PR #112, merged 769c2f5 — icon registry
      byte-identical, budgets hold (trail:
      .batuta/runs/2026-08-05-deps-d3.md). All → claude (critical). Not taken
      by decision: typescript 7 / @types/node 26 (policy #104); size-limit 13
      major = own future decision.
- [x] **Workspace restructure — DONE (user, 2026-08-05).** Repo now lives at
      `~/Projects/lyra-ds/lyra` under the org umbrella; persistent memory
      migrated to the new path key.

- [x] **0.4.1 published through OIDC (2026-08-05, user trigger)** — Version PR
      #90 verified (two changesets: npm metadata 211/78 + AA contrast), run
      30969067799, SLSA provenance on both packages, npm description confirmed
      fixed. Two dropped GitHub push events tonight required an empty-commit
      retrigger (#102 branch) and a close/reopen (#90). → claude (critical).
- [x] **Color-contrast sweep executed and resolved (PR #103, 2026-08-05)** —
      the blanket axe filter hid: measurement artifacts (axe measured
      mid-`lyra-fade-in`; fixed by finishing animations before `axe.run`), 26
      real deep failures (light `--text-faint` at 2.34–2.56:1 → raised to
      slate-500 = 4.76:1, pinned as exact parity divergence
      LIGHT_TEXT_CONTRAST_DIVERGENCES, adversarially proven), and 7 borderline
      pairs now explicit in `src/internal/test-axe.ts` (includes
      `#ffffff/#6e6ade` — the hover accent, measured only when CI's pointer
      rests at 0,0). New contrast regressions now FAIL CI (proven by removing
      a pair → 5 tests red). Sweep + token/parity → claude (critical); 36-file
      test refactor → codex (`gpt-5.6-terra`, high, worktree; 1 recursive-
      wrapper fix in tabs by maestro). Codex cross-review: 2 findings, both
      rejected with rationale.
- [x] **Adoption milestone (plan-08 tracks 2–3) — COMPLETE (2026-08-04/05).**
      First lot shipped in PR #98 (`feat/adocao-repo-readiness`):
  - FUNDING.yml → kimi (`kimi-k2.7-code`, inline brief), commit `362090b`;
    corrected to the org in #99 (the user enabled Sponsors directly on the
    lyra-ds org, not the personal profile). DONE end to end the same night:
    the user filled the Sponsors profile with the short bio + introduction
    (English) from `~/Documents/github-sponsors-profile-draft.md` and set the
    suggested initial goal (10 monthly sponsors, description tied to the
    Vue/Svelte adapters). GitHub approval still pending for the button to
    appear.
  - 08-4 residual: most already existed (bug/feature forms, config, PR
    template). Docs form → kimi, commit `f32e2af`; curated labels (a11y,
    pkg: styles, pkg: react, docs site) created through gh → claude.
  - 08-5 good-first issues → claude (critical): #95 (DateRangePicker,
    accessible period announcement). Honest curation: only #28 + #95 are good
    entry points today; #96 (tzpicker without CSS) and #97 (SlotPicker mobile
    overflow) are help wanted — the color-contrast sweep will produce the next
    good-first issues.
  - 08-6 REFORMULATED by the user in this session: the announcement is a
    bilingual article on their personal site, not a Discussion. PRD delivered
    in `~/Documents/prd-artigo-anuncio-lyra-ds.md` (verified stats.json numbers,
    honest claims, acceptance criteria).
  - 08-8 snapshot releases → codex (`gpt-5.6-terra`, worktree), commit
    `3e9375a`. PLAN DEVIATION: `seek-oss/changesets-snapshot` was discarded —
    nested publish breaks OIDC (npm/cli#8976 lesson from release.yml); a
    hand-rolled workflow mirrored the proven path. Same-night CORRECTION
    (critical → claude, triggered by the user's question): a separate
    snapshot.yml was wrong — npm permits ONE trusted publisher per package,
    scoped to one workflow file; registering it would replace release.yml and
    break release. Snapshot became a job in release.yml itself (manual dispatch
    runs only it; main push runs only release). NO action on npmjs.com is needed.
  - 08-7 starters → codex (`gpt-5.6-terra`, high reasoning, 2 lots): COMPLETE
    and VERIFIED content in `.batuta/starters/starter-{vite,next}/` (excluded
    from git via info/exclude). Both install public npm 0.4.0, build green, and
    were browser-proven (dark mode + four-token brand change, clean console).
    Lessons: pnpm 11.13 renamed `onlyBuiltDependencies` to `allowBuilds` in
    pnpm-workspace.yaml (Vite needs it for esbuild); the user's local
    `minimumReleaseAge` blocks packages younger than 24h (verification-only
    override). Published at the user's request that night: repos created through
    gh (`lyra-ds/starter-vite`, `lyra-ds/starter-next`), content live and proven
    by clean clone + green build straight from GitHub.
  - Remaining: 08-9/08-10 governance — public docs in English and cleanup of
    `.batuta/`/WORK.md, decided jointly with the user.

## Done

- [x] **0.4.0 published through OIDC** — Version PR #74 was verified; run
      30961279120, SLSA provenance, tags, and GitHub Releases shipped on 2026-08-04.
      → claude (critical).
- [x] **OSS showcase** — honest READMEs, npm badges, metadata, Dependabot, and
      disabled empty Wiki shipped in PR #88 (2026-08-04). → codex (`gpt-5.6-terra`, medium).
- [x] **Phase 8, waves 6a–6d** — SegmentedRing/TimeInput, Combobox extensions/
      TimeZonePicker, RecurrenceSelector/WeeklyScheduleEditor/SlotPicker, and
      CalendarView completed on 2026-08-03; docgen grew 71→78. → codex
      (`gpt-5.6-terra`, high, worktree; one retry per wave) with claude fixes/review.
- [x] **Phase 8, waves 4–5** — AppSidebar/BottomNav and ToastProvider/useToast
      shipped on 2026-08-03; the latter recorded the 71-entry dts heap mitigation.
      → codex (`gpt-5.6-terra`, high) + claude.
- [x] **Phase 8, waves 1–3** — RadioGroup, CheckboxGroup, Fieldset, FormRow,
      Separator, DataTable, PersonCell, ActionBar, Popover, Calendar, BottomSheet,
      TimePicker, DatePicker, and DateRangePicker shipped on 2026-08-03. → codex
      (`gpt-5.6-terra`, high, worktree; retries/cross-review fixes) + claude.
- [x] **v1.2 delta-port infrastructure** — handoff, CSS, parity baseline, icon
      registry, and budgets advanced in 09-0 (2026-08-03). → codex (`gpt-5.6-terra`, high) + claude.
- [x] **0.3.0 published through OIDC** — Version PR #64, run 30857749858, SLSA
      provenance, tags, and releases; catalog 59→68 on 2026-08-03. → claude (critical).
- [x] **Documentation wave** — 24 bilingual component pages completed,
      PRs #83–#87 merged and run 30960423986 green (2026-08-04). → codex
      (`gpt-5.6-terra`, high; five lots) + claude verification.
- [x] **Mobile docs polish** — responsive drawer sidebar in PR #81 and three
      mobile overflow fixes in PR #82, production-proven on 2026-08-04. → codex
      (`gpt-5.6-terra`, high) / kimi (`opencode/kimi-k2.7-code`, three inline cycles) + claude.
- [x] **CodeBlock wrap** — opt-in `wrap`, parity allowlist, mutation proof, and
      docs adoption shipped in PR #80 (2026-08-04). → codex (`gpt-5.6-terra`, high) + claude.
- [x] **Docs navigation polish** — component manifest/sidebar/TOC/⌘K sorting and
      title-to-grid spacing completed on 2026-08-03. → kimi (`opencode/kimi-k2.7-code`).
- [x] **Unauthorized 0.2.0 incident** — content was intact but an automated
      `--admin merge` used a predicted PR number; prevention rules were added on
      2026-08-03. → claude (critical).
- [x] **08-1 tsup→tsdown** — PR #54 (`b4cc3bc`) migrated React builds, made the
      `'use client'` step deterministic, and shipped 2026-08-03. → codex
      (`gpt-5.6-terra`, high; capacity redispatch + review retry).
- [x] **08-2 OIDC release 0.1.1** — Version PR #55 and run 30838899789 proved
      publishing plus SLSA provenance on 2026-08-03. → claude (critical).
- [x] **08-3 `NPM_TOKEN` revoked** — the user revoked it, gh removed the secret,
      and release.yml recorded it on 2026-08-03. → claude (critical).
- [x] **Docs chrome and landing** — 6c-b1 through 6c-d delivered layout,
      ThemeProvider, chrome components, docs pages, semantic element overrides,
      marketing site, and theme-aware favicons (PRs #23, #27, #50; 2026-07-30–08-03).
      → codex (`gpt-5.6-terra`, high; retries where noted) + claude.
- [x] **Landing lots 1–8** — app/chrome/Hero, showcase/frameworks, themes/community,
      FAQ/CTA, privacy/consent, metadata/CSP, docs consent, and self-hosted OpenPanel
      shipped in commits `5ae1075`, `60c3d5b`, `0eaca7e`, `1e2a9d9`, `a4ca1c3`,
      `8f75ce0`, `d053a42`, `fa2223f`; lots 2, 5–7 had retries. → codex.
- [x] **Docs component documentation** — 6c-a/6c-b3/Phase 6b built bilingual
      guides, data-driven pages, single-source examples, and 40/40 documentation.
      PRs #13, #15, #17, #22; 2026-07-23–30. → codex (`gpt-5.6-terra`, high) + claude.
- [x] **Accessible, translatable DS** — Lots 08 and 09 translated 17 accessible
      names and 10 visible strings, repaired 12 vacuous tests on retry, and shipped
      PRs #15 and #17 (2026-07-27–28). → codex (`gpt-5.6-terra`, high) + maestro.
- [x] **Docs/mobile/a11y verification cycle** — Impeccable audit corrected
      overflow, landmarks, touch targets, contrast, and preview layout (14/20→clean)
      on 2026-07-25. → claude/maestro.
- [x] **OpenPanel repair** — real script contract fixed in both apps; PR #40
      (`0c18be8`) live-proven with `POST /api/track → 200` on 2026-08-03. → codex
      (`gpt-5.6-terra`, worktree; one verbatim redispatch) + maestro.
- [x] **Contribute link and WhatsApp preview** — footer 404 fixed in PR #41
      (`939388a`); three-part social preview repair in PRs #47–#48 (2026-08-03).
      → kimi (`opencode/kimi-k2.7-code`) / codex + claude.
- [x] **Phase 7 launch** — npm 0.1.0, trusted OIDC publisher configuration,
      release workflow, Cloudflare direct-upload deployment, org showcase, and
      launch checklist completed in PRs #34–#44 (2026-08-03). → claude (critical).
- [x] **Phase 6 chrome** — Shell, Navbar, NavLink, Footer, TOC/useScrollSpy,
      CodeBlock, SegmentedControl, Brand, and docs dogfooding were shipped in five
      lots (commits `1f26db7`, `0628b78`, `f713085`, `ed465e1`, `a41de53`). → codex
      (`gpt-5.6-terra`, high; retries) + maestro.
- [x] **Phase 5 docgen** — `tools/docgen/generate.mjs` generates `llms.txt` and
      `props.json` with CI drift check (2026-07-23). → codex (`gpt-5.6-terra`, high).
- [x] **Phase 4 complete** — all 40 handoff components, CSS-first React wrappers,
      Browser Mode coverage, and APG research delivered in Lots A–D (2026-07-20–23).
      → codex (`gpt-5.6-terra`, high) + research agent/maestro.
- [x] **Phases 1–3** — monorepo governance, styles package (209 tokens / 248
      classes), and React infrastructure/pilot components imported from GSD;
      merged PRs #1–#3 on 2026-07-17–20. → GSD/claude.
