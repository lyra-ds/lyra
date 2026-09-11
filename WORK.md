# Current work — V1 incumbent stabilization

## Current priority — 2026-09-10

The maintainer requires Lyra core/Styles/React and Alpine V1 closure before any
Blade migration. This supersedes earlier "next Blade" entries below. Blade
producer/snapshot migration and compatibility qualification are deferred until
core/Alpine V1 closure, without claiming Blade compatibility or weakening
existing checks. Active checkout remains `../lyra-v1-stabilization`, product
HEAD `879b315`. Task28 DataTable and Task31 React modal ownership are locally
verified. Next: Task38 Popover child-layer ownership, Task10 size resolution and
Task39 exact final core/Alpine qualification. Remote/release and resource
boundaries are unchanged. See `.batuta/plans/v1-completion.md` in the active
checkout.

The maintainer retained the existing Lyra base on 2026-09-08 and suspended
comparative foundation work. Active checkout: `../lyra-v1-stabilization`, branch
`feat/v1-incumbent-stabilization`, based on origin/main 9d214bf. Follow
`.batuta/plans/v1-completion.md` for current execution; the incumbent plan/backlog retain earlier context.

- [x] Governance/source-inventory update approved — source commit `2d02444`; critical/self, GLM 5.3 Flash scout and independent review, no retry/escalation. Review 4/4 DONE, unchanged tree, Batuta verifier PASS; cosmetic finding corrected. Baseline 106 tests, new cases RED, current 108 tests and four policy CLIs GREEN. No product/dependency/ledger changes or qualification. See `.batuta/v1-incumbent-direction-review.md`.
- [x] Drawer pointer-origin reproduction — critical/self; trusted local Chromium input confirms incorrect Drawer onClose, Dialog control passes, six scenarios recorded at source `75e536b`. Independent GLM 5.3 Flash 2/2 DONE, unchanged guard, verifier PASS; no retries/escalation. Product files untouched. See `.batuta/v1-drawer-pointer-proof.md`.
- [x] Drawer pointer-origin repair complete — medium/Codex gpt-5.6-terra, two planned stages, no implementation retry/escalation. Controller regression RED then GREEN; Chromium/SSR 43/43, trusted pointer six scenarios PASS, types/lint/format PASS. Independent GLM approved with unchanged guard; normalized verifier 3/3 DONE. WebKit same six baseline focus failures, two new tests pass; Firefox/Linux release matrix pending. See `.batuta/v1-drawer-repair-verification.md` and review.
- [x] WebKit focus diagnosis and fixture correction — critical/self diagnosis with guarded GLM scout; low/OpenCode GLM5.3Flash implementation, no retry/escalation. Prepared-opener fixtures now pass WebKit38/38 and Chromium/SSR43/43; two injected broken-restoration cases fail, original runtime bytes restored. Types/lint/format pass. See `.batuta/v1-webkit-focus-verification.md`.
- [x] Explicit modal return-focus contract drafted — critical/self; GLM5.3Flash independent review, one revision, unchanged guards, final verifier2/2 DONE. Proposal: optional returnFocusTo resolver on React Dialog/Drawer, explicit safety/cycle/successor obligations. See `.batuta/specs/2026-09-08-modal-return-focus-design.md`. Technical review complete; maintainer approved the API on 2026-09-08. Implementation subsequently completed through the approved return-focus plan.
- [x] Maintainer corrected workflow to Batuta and approved returnFocusTo. Contract moved to `.batuta/specs/2026-09-08-modal-return-focus-design.md`; approved implementation plan: `.batuta/plans/v1-modal-return-focus.md`. No further API-approval question is needed.
- [x] Task 1 Dialog/shared returnFocusTo verified (`00d2ded`) — Codex gpt-5.6-terra/high, one retry then critical/self correction; Chromium/SSR52, WebKit48, trusted mouse12 and StrictMode2 PASS, types/lint/format PASS; independent GLM4/4 DONE with unchanged guard. See `.batuta/v1-return-focus-task1-verification.md`.
- [x] Task 2 Drawer returnFocusTo verified (`9f0844d`) — Codex gpt-5.6-terra/medium, one test retry, no escalation; Chromium/SSR70 and WebKit63, trusted mouse12, types/lint/format PASS; mount-only fault RED; GLM3/3 DONE with unchanged guard and no findings. See `.batuta/v1-return-focus-task2-verification.md`.
- [x] Task 3 public examples/docs verified (`ce6d022`) — Codex gpt-5.6-terra/medium, one documentation retry, no escalation; built declarations/docgen/types/lint/format and28 actual example close paths PASS; independent GLM3/3 DONE unchanged guard. Approved returnFocusTo plan complete; see `.batuta/v1-return-focus-verification.md`.
- [x] CommandPalette backdrop gesture repair verified — medium/Codex gpt-5.6-terra, one fixture retry, no escalation; native12/12, Chromium/SSR20, WebKit16, types/lint/format PASS; original-source regression RED; independent GLM3/3 DONE with unchanged guard. Implementation commit `a98a953`. See `.batuta/v1-command-palette-pointer-verification.md`.
- [x] CommandPalette shared return-focus integration verified — Codex gpt-5.6-terra/high, one retry then critical/self test-readiness/docs completion; native48, actual built example6, final Chromium/SSR30 and WebKit26 PASS, build/types/lint/docgen/format PASS. Independent GLM3/3 DONE/no findings/unchanged guard after one evidence-access retry. Implementation commit `4545ddc`; see `.batuta/v1-command-palette-focus-verification.md`.
- [x] Nested Dialog Escape containment verified — Codex gpt-5.6-terra/medium, one formatting-only retry, no escalation; native Escape10/10, final Chromium/SSR64 and WebKit57, types/lint/format PASS. Independent GLM3/3 DONE, unchanged guard; final-byte verification observation resolved by reruns, controller WORK ownership concern declined. Implementation commit e55a1bb; see .batuta/v1-dialog-nested-escape-verification.md. Existing WebKit forward-Tab focus escape remains a separate pending slice.
- [x] Native modal Tab containment verified — Codex gpt-5.6-terra/high, one retry then critical/controller native-oracle fixture and const completion; native16/16, Chromium/SSR115, focused WebKit7/7, types/lint/format PASS. Broader WebKit100/102 retains exactly two original BottomSheet opener-return failures. GLM3/3 DONE/no findings/unchanged guards after a report-format-only retry. Implementation f9cb9d2; see .batuta/v1-webkit-tab-verification.md. Next: bounded BottomSheet return-focus diagnosis.
- [x] BottomSheet return-focus runtime verified — Codex gpt-5.6-terra/high after two medium setup failures, one high verification retry; native6/6, Chromium/SSR24, WebKit21, types/lint/format PASS; GLM3/3 DONE, no findings, unchanged guard. Implementation88c5211; see .batuta/v1-bottom-sheet-focus-verification.md. Documentation/examples follow immediately.
- [x] BottomSheet public examples/docs verified — Codex gpt-5.6-terra/medium, one prose retry; built examples12/12, snippets/types/lint/format/docgen PASS; GLM4/4 DONE including dependency disposition, unchanged guard. Implementation899ed10; see .batuta/v1-bottom-sheet-docs-verification.md. Low owner-JSDoc precision follow-up queued.
- [x] BottomSheet captured-target JSDoc precision completed — OpenCode GLM5.3Flash/low, no retry; owner build/docgen/format PASS and all150 runtime JS/CJS files unchanged. Commitbda7a00; closes the prior low review observation.
- [x] Obsolete experimental checkout freeze repaired — critical/controller, no retry; policy10/10 from baseline8/10, canonical release108/108 + CLI/format PASS; GLM3/3 DONE/no findings/unchanged guard. Commit1b7629e; see .batuta/v1-maintenance-policy-verification.md. Worktree now has its own frozen current dependency installation.
- [x] PR220 pnpm/action-setup6.1.0 adopted locally — OpenCode GLM5.3Flash/low, one validator-pin retry; actionlint/policy10/security/release/deploy80/full evidence349/format PASS; GLM2/2 DONE/no findings/unchanged guard. Commit87f7775. Package manager stays11.13.1; no remote merge.
- [x] WorkspaceSwitcher metadata contrast corrected — Codex gpt-5.6-terra/medium, one config-cleanup retry, no escalation; full React765, focused Chromium/SSR8 and WebKit7, original-CSS RED/fixed GREEN, static gates PASS; GLM2/2 DONE, unchanged guard, three low observations adjudicated. Commita4686af; see .batuta/v1-workspace-contrast-verification.md.
- [x] Selected11 existing-library updates qualified locally — Codex gpt-5.6-terra/high, no retry/escalation; frozen install/four builds/types/lints/React765/evidence349/docs352/site20/export checks PASS;453 generated public files unchanged; GLM3/3 DONE, unchanged guard. Commitc5cfaae; see .batuta/v1-library-maintenance-verification.md.
- [x] Dropdown keyboard contracts verified — Codex gpt-5.6-terra medium initial/retry, high initial/retry, then critical/controller diagnosis and completion; final full React779, focused23/22/22, compiled27 + reorder proof PASS; Dropdown within2kB. Final GLM3/3 DONE/no findings/unchanged guard. Commit d25f433; see .batuta/v1-dropdown-keyboard-verification.md.
- [x] Tooltip focused-lifecycle fixture verified — OpenCode GLM/low, no retry; Chromium/SSR8, WebKit7, Firefox7 plus disabled-blur-close RED/restored GREEN and static gates PASS. Runtime unchanged. Commit1884796; see .batuta/v1-tooltip-focus-fixture-verification.md.
- [x] Calendar native Tab fixtures verified — OpenCode GLM/low, no retry; Chromium/SSR10, WebKit8, Firefox8 and static gates PASS; both exact entry tests fail with the active-day tab stop disabled and pass after restoration. Runtime unchanged. Commitfa0c4fa; see .batuta/v1-calendar-tab-fixtures-verification.md.
- [x] FileUpload removal focus fixtures verified — OpenCode GLM/low, no retry; Chromium/SSR40, WebKit39, Firefox39 and static gates PASS; disabled outside-focus reset RED/restored GREEN. Runtime unchanged. Commitca0ba67; see .batuta/v1-file-upload-focus-fixtures-verification.md.
- [x] TimePicker explicit keyboard stops verified — OpenCode GLM/low, no retry; controller Chromium/SSR7, WebKit6, Firefox6, static/build/docgen PASS; original-source Tab regression RED/restored GREEN. TimePicker Brotli4522B unchanged;9 older size overages remain. Commite287941; see .batuta/v1-time-picker-keyboard-stops-verification.md.
- [x] Full local focus tranche verified at e287941 — controller Chromium/SSR780, WebKit683, Firefox683, all exit0; all6 current WebKit baseline failures closed. See .batuta/v1-focus-tranche-verification.md.
- [x] Tooltip timing/ownership verified — Codex Terra/high initial/retry then critical/controller cleanup and fixture completion; focused14/13/13, native42+actions6, full React786/689/689, static/build/styles/parity/docgen PASS. GLM3/3 DONE, unchanged guard, verifier PASS. Tooltip1954B exceeds1500B; Task10 now tracks10size overages. Commita9265c4; see .batuta/v1-tooltip-timing-verification.md.
- [x] React workspace selected entry verified — OpenCode GLM/low, no product retry; controller9/8/8, native15, original-source RED/restored GREEN, static/build/docgen PASS,8.14/8.25kB. Executor command deviation audited; pinned controller proof only. Commit3c000ab; see .batuta/v1-workspace-react-entry-verification.md.
- [x] Alpine workspace selected entry verified — OpenCode GLM/low, no retry; controller11/11/11, native15, original-source RED/restored GREEN, types/format/build/size PASS21.09/21.2kB. Commitb963657; see .batuta/v1-workspace-alpine-entry-verification.md.
- [x] React workspace keyboard cancellation verified — Codex Terra medium initial/retry then high static-fixture completion; controller11/10/10, native42, original-source RED/restored GREEN, types/lint/format/build/docgen PASS;8.21/8.25kB. GLM3/3 DONE unchanged guard, one informational finding adjudicated. Commit36fe361; see .batuta/v1-workspace-react-cancellation-verification.md.
- [x] React workspace creation command verified — Codex Terra/high initial/retry then critical/controller migration note; controller16/15/15, native9+60+42, source negatives RED/restored GREEN, static/build/docgen/visual PASS. GLM final3/3 DONE no findings unchanged guard;8326/8250B remains Task10. Commit0ac89d0; see .batuta/v1-workspace-create-command-verification.md.
- [x] Workspace public docs verified — GLM low initial/retry then Codex Terra/medium wording completion; current MDX/format PASS, unchanged exact snippets18native/303stack PASS. Independent GLM3/3 DONE unchanged guard; low findings adjudicated. Commitc8fd611; see .batuta/v1-workspace-public-docs-verification.md.
- [x] Workspace click cancellation verified — Codex Terra/medium initial/test-only retry;19/18/18, native60 plus prior keyboard42/command60, original-source RED/restored GREEN, static/build/docgen PASS. Independent GLM3/3 DONE unchanged guard;8364/8250B staysTask10. Commit19bf93a; see .batuta/v1-workspace-click-cancellation-verification.md.
- [x] Alpine native Tab containment verified — Codex Terra/high, no retry; Chromium50/50,Firefox50/50,WebKit44/50 with exactly6oldreturnfailures; new4regressions RED underoldhelper/restoredPASS. Native24/24forward+reverse/liveeligibility/inactivestops/cleanup;types/format/buildPASS. GLM3/3DONEunchangedguard, optionalfindingsadjudicated. Alpine21394/21200B staysTask10. Commit3cb4d50; see .batuta/v1-alpine-native-tab-verification.md.
- [x] Cross-family Escape verified — Codex Terra/medium initial and test-only retry; broad124/110/110 on current runtime, final6fixture regressions perengine, native48/48, originalhandlers RED/restored6/6, types/lint/format/build/docgenPASS. GLM3/3DONE/no findings/unchangedguard. Existing sizeoverages retained. Commita4c024f; see .batuta/v1-cross-modal-escape-verification.md.
- [x] Alpine returnFocusTo design reviewed — critical/controller design, GLM initial review/revised3of3 DONE unchanged guards. Six precision findings accepted; explicit target prevents scroll, eligible legacy fallback retains native scroll behavior. No separate human approval claimed; implementation follows authorized V1 work. See .batuta/specs/2026-09-09-alpine-return-focus-design.md.
- [x] Alpine returnFocusTo runtime verified — Codex Terra/high379.27s initial +418.30s retry, no escalation; source65/65eachengine, native24target+24lifecycle+3ignored+12throw and24Tabcontainment PASS; oldowners RED/restored4/4. GLM3/3DONEunchangedguard, findingsadjudicated, verifierPASS. Alpine21949/21200B remainsTask10; no dependency/export-map changes. Commit3041be4; see .batuta/v1-alpine-return-focus-verification.md.
- [x] Alpine public return examples verified — Codex Terra/medium475.23s +191.10s retry, then high83.40s six-label completion, no highretry. Exact8MDXcompile/format/stack303, currentnative48focus+12labelsPASS; outsideAlpine sections byte-identical, libraryartifact unchanged. InitialGLMlabels accepted; final3DONEunchangedguard/verifierPASS. Commit580169b; see .batuta/v1-alpine-return-focus-docs-verification.md.
- [x] React initialFocusTo design technically reviewed — critical/controller with GLM consultation and exactdesign3DONE; oneCPRAF error-context wording correction, boundedfinal3DONE/no findings/unchangedguard, verifierPASS. Runtime completion is recorded below; fullmodalqualification remains pending.
- [x] React initial destination verified — high CodexTerra367.62s initial +287.50s retry, critical/controller numeric-default and0.xmetadata completion. Source144/130/130 on retryowners, finalhelper17/17 eachengine, native60API+42lifecycle+12ignored+9numeric+9hidden+48Escape PASS; originalowners RED/restored4/4. GLM3DONEunchangedguard/verifierPASS, no concrete findings. Task10 now12React+1Alpineoverages; commit1d5c8e5. See .batuta/v1-react-modal-initial-focus-verification.md. Publicexamples follow immediately.
- [x] React public initial-focus examples verified — CodexTerra/medium341.53s initial +244.81s prose-only retry, no escalation. Exact MDX8/snippet+exampletypes/lint/format/stack303 PASS; actualnative9 and final source/Alpine-tail/runtime SHA parity. GLM3DONEunchangedguard/verifierPASS, no concrete findings. Commite13e300; see .batuta/v1-react-modal-initial-focus-docs-verification.md.
- [x] Alpine additive changeset metadata corrected — OpenCode/GLM5.3Flash low11.69s, no retry/escalation; exact one-line minor-to-patch,473 artifactSHA parity, scopedformatPASS. Commitae3e6ce; see .batuta/v1-alpine-changeset-metadata-verification.md. No version/release action.
- [x] Task36 logical-close activity verified — CodexTerra/high422.8s initial +307.72s test retry, then critical/controller fixture completion. Source153/139/139, native186, originalowners RED/restored4/4, revoked-gesture fault RED4/restored5, static/build/docgenPASS; GLM3DONE/no findings/unchangedguard/verifierPASS. Runtime unchanged after initial delivery. Commit3bf23ef; see .batuta/v1-react-modal-logical-close-verification.md. Existing13sizeoverages and pre-existing WebKit modal-inline-modal warning remain tracked.
- [x] Task26 incumbent lifecycle design technically reviewed — critical/controller plus GLM; six accepted precision findings, one invalid empty-report round, report retry3DONE/no findings/unchangedguard/verifierPASS. No implementation yet. See .batuta/specs/2026-09-10-create-workspace-lifecycle-design.md.
- [ ] Continuous completion authorized on 2026-09-09. Selected11 library updates and PR220 action adopted locally;12 React and1 Alpine source-size overages remain. Resumed on2026-09-10; React and Alpine Tabs runtime/public docs verified with the panel-container teardown correction recorded below. Owning-source Blade migration and remaining DataTable/modal/API ownership/final qualification remain pending.
- [ ] Remaining: other incumbent P1/modal contract slices and full packed Firefox/Linux release qualification. No publication performed.

Do not change any Colima configuration or restart the service. Do not restore
old settings, stop foreign projects, resume comparative diagnostics or merge
the composed experiment. Missing full release evidence stays pending. No
remote or publication action is authorized.

- [x] Task26 CreateWorkspaceDialog operation lifecycle verified — CodexTerra/high408.24s initial +339.27s retry, then critical/controller test-fixture repair. Source12/11/11, native87, actualexamples6/12creates, public types/build/docgen/visual8 PASS; initial-source RED3 and passive-lifetime RED1/restored4, no source suppression. GLM162.94s3DONE/no concrete findings/unchanged guard/verifierPASS. Commit 6f450d2; see .batuta/v1-create-workspace-operation-verification.md. Approximately5.12/3.2kB remainsTask10; next Task37 public MDX, then remaining Tabs/DataTable/modal/final qualification.
- [x] Task37 public creation lifecycle docs verified — CodexTerra/medium260.61s initial +168.7s prose retry, high130.12s two-clause canceled-close completion. MDX2/snippettypes/stack303/format PASS, currentconsumer24native and finalsnippet/453artifactSHAparity, HTML/frontmatter/Exampleids preserved. GLMfinal36.75s3DONE/no findings/unchangedguard/verifierPASS. Commit8987a05; see .batuta/v1-create-workspace-docs-verification.md. High formatter used Node26 against brief; exactdiff/provenance audited and pinnedcontrollerchecks rerun, no config/artifact changes. Next Task27: three-engine currentempty-panel baseline confirmed; exactdesign pending.

- [x] Task27 React runtime verified — CodexTerra/high574.25s initial+314.48s retry then critical/controller focus/ref/packaging completion; final source15/13/13, native78/hydration9/consumers9, real packed Vite+Next/mixedSSR4, static/generated/visual proof PASS. GLMfinal159.11s3DONE/unchanged guard/verifierPASS. Tabs1.45/1.5kB,13other overages unwaived. Commitd1ad2ad; see .batuta/v1-tabs-owned-content-verification.md. Next React MDX, then Alpine runtime/fallback/docs; Task27/V1 not complete.

- [x] Task27 React public docs verified — CodexTerra/medium376.85s initial+88.84s one prose/format retry, no escalation; MDX2/snippettypes/stack303/format/native6 PASS,1716protected/453artifact SHA unchanged. GLM47.49s3DONE/no findings/unchanged guard/verifierPASS; commit49c8447. See .batuta/v1-tabs-public-docs-verification.md. Next Alpine selected fallback/runtime/events: current three-engine baseline3preinit PASS/12contract FAIL, zero errors.

- [x] Task27 Alpine runtime verified — CodexTerra/high initial499.21s + one retry, critical/controller selected-destination fixture and source-coverage completion. Source17/17/17, compiled native63/63 zero errors, static/build/publictypes/docgen and negative5RED/restored15PASS; final GLM245.2s3DONE/no findings/unchanged guard/verifierPASS. Product commit87cd246. Whole Alpine23022/21200bytes remains Task10. Next Alpine public MDX/snippet proof and owning-source Blade migration; Task27/V1 not complete. See .batuta/v1-tabs-alpine-verification.md.

- [x] Pause consumed on confirmed resume2026-09-10 after Alpine Tabs runtime commit87cd246. Next cycle: prepare bounded Alpine public MDX migration brief and prove actual snippets, then owning-source Blade migration/qualification. No executor, native server or loop remains running for this task. Runtime17/17/17source and63native PASS; wholeAlpine23022/21200bytes remains unwaived Task10. Pending WORK.md state accompanies the resumed documentation/focus commit. Both handoffs consumed; preserve all worktrees and raw evidence.

## Historical log — earlier directions are superseded

# WORK — lyra-ds

## In progress

- [x] **Overlay Foundation Wave 2 — local verification and final review complete
      (2026-09-06)** → controller `self` (Codex), independent reviewer OpenCode /
      `opencode/glm-5.3-flash` (one invalid round, successful retry). Kimi provider
      unavailable; Claude attempt failed before review. Tasks 1–8 complete at
      worktree `../lyra-anchored-wave`, branch `feat/v1-overlay-anchored-wave`,
      HEAD `cd08797`, evaluated implementation `ce36f32`. All 328 indexed files,
      all 656 attempt hashes/canonical expected records, exact manifest, 13
      retained final gate results, and protected scope verified. Eight review
      criteria complete; three informational notes adjudicated, no blocking
      findings. Full suites were not rerun. Verdict:
      [.batuta/runs/2026-09-06-wave2-final-review.md](.batuta/runs/2026-09-06-wave2-final-review.md).
- [x] **Wave 2 remote checkpoint (2026-09-06, user authorized)** — pushed the
      28 reviewed implementation commits through `cd08797` and updated draft
      PR #219 with the prepared English title/body. GitHub HEAD, title, body,
      OPEN state, and draft status verified; implementation worktree clean and
      synchronized. CI run `34043225940` started automatically; lint, typecheck,
      test, and build were in progress at verification. No merge, release,
      deployment, ready-for-review transition, or manual dispatch performed.
      Proof: `.batuta/runs/2026-09-06-wave2-pr-219-update.json`.
- [x] **Wave 2 CI checkout ownership fix** → OpenCode / `opencode/glm-5.3-flash`,
      low/testing, commit `cb6bf30`, pushed. CI's two real-Vite tests failed on
      Git dubious ownership; exact-path command-local trust now matches the
      existing policy-test convention. Controller reproduced RED, then verified
      56/56 tests with simulated different ownership, plus formatting/scope.
      No production or manifest change. Trail:
      `.batuta/runs/2026-09-06-wave2-ci-owner-fix.md`.
- [x] **Wave 2 CI and review readiness (2026-09-06)** — all four jobs in run
      `34044794817` passed at `cb6bf30`; PR #219 marked ready for review under
      user authorization. Exact HEAD/body and non-draft OPEN state verified.
      Proof: `.batuta/runs/2026-09-06-wave2-ready-proof.json`.
- [x] **Wave 2 CodeRabbit corrections verified (2026-09-06)** — render readiness
      and deferred hydration cleanup (`247cc4f`, Codex/Terra plus GLM review),
      tracker reinstall (`c2d2f7a`, GLM), canonical bundle roots (`69b8905`, GLM),
      and exact entry rejection tests (GLM plus Codex review). Controller verified
      144 fixture/protocol/entry tests and 88 candidate tests. Strict modal
      resource reconciliation declined with compatibility proof (15/15 legacy
      tests pass, four fail under the proposed strict flag). Full disposition:
      [.batuta/review-pr219.md](.batuta/review-pr219.md).
- [ ] **Wave 2 remote checkpoint** — corrections through `9b5e24c` are published;
      all four Linux CI checks passed in run `34049894386`. The initial five
      threads are resolved. This follow-up clarifies two Batuta instructions
      and removes an unnecessary tracker guard. Inspect checks/review for the
      actual current HEAD before integration.
      Full local core verification is not green on macOS because its existing
      evidence traversal requires Linux `/proc/self/fd`. Reviewer approval and
      merge remain separate. Resume state:
      [.batuta/plan-wave2-resume.md](.batuta/plan-wave2-resume.md).

- [x] **Batuta reconfiguration included with Wave 2 (2026-09-06)** — refreshed
      stack, commands, and project map; migrated routing to low/medium/high/critical
      with domain columns; retained approved models and GLM low/research override.
      English documentation policy and imported handoff checkpoint accompany
      PR #219. Superseded August transit handoff removed; history remains in Git.

- [x] **Documentação multi-stack — frente B completa (PRs #176 e o das tasks
      11–12, 2026-08-12); aba Blade acesa** → maestro (claude). Tasks 1–10 do
      plano `docs/superpowers/plans/2026-08-10-docs-multi-stack-frente-b.md`:
      seletor de stack nas **75** páginas de componente (união corrigida:
      `form-row` vive em `fieldset.mdx`), catálogo do Alpine gerado das
      registrations do pacote publicado (32 entradas — 30 bindings e 2 stores),
      guias por stack, matriz de compatibilidade e `llms.txt` cobrindo React e
      Alpine (o modelo é de **quatro stacks** — HTML e Alpine são a mesma aba
      em dois estados; a cobertura publicada de llms.txt/API ganha o Blade nas
      tasks 11–12). Review do PR: 14 comentários CodeRabbit triados — 3 fixes
      aplicados, 2 pushbacks, o resto encaminhado. **Tasks 11–12 executadas**:
      `api.json` da release v0.10.0 (72 componentes, 30 com binding) ingerido
      com validador próprio (`tools/blade-api/check.mjs`) no CI, aba Blade
      renderizando tag, versão, herança do binding, tabela de props e usage;
      `llms.txt` agora cobre as quatro stacks (`tools/docgen/blade.mjs`
      com `--check`). Restam a frente C (starter Laravel) e a atualização do
      snapshot a cada release do blade.

- [x] **Sistema de toasts no alpine — `lyraToasts` (store) + `lyraToastStack`
      (2026-08-09) [batuta/20260809-025845-alpine-toasts]** → codex
      (`gpt-5.6-terra`, high; worktree), 3 rodadas corretivas. Fecha
      `.batuta/prd-alpine-toasts.md`, vindo do blade: o `toast-provider` React
      tinha escapado do filtro dos 24 interativos, e por isso o toast Blade não
      tinha auto-dismiss. Store com fila, API imperativa (`toast`/`success`/
      `error`/`info`/`dismiss`), ids incrementais, `duration` 4000 default e
      `0` desligando o timer daquele toast; ponte `lyra:toast` no `window` para
      `$this->dispatch(...)` do Livewire. **Decisões do maestro:** nome
      `lyraToasts` (assimétrico com o `theme` já publicado, mas `toasts` colide
      fácil no app do consumidor — escolha do usuário); e **os timers moram no
      store, não no stack** — o PRD sugeria limpar o mapa no `destroy()` do
      stack, o que deixaria itens presos na fila se o stack remontar (rotina no
      Livewire). Consequência: o `unmounted` do React não tem análogo, e push
      sem stack montado enfileira e auto-dismissa normal. `message` vai por
      `x-text`, nunca `x-html` — a fila é alimentada por evento e payload de
      Livewire.
      **Lei 14 de Alpine, custou uma rodada:** `vi.useFakeTimers` e render do
      Alpine NÃO convivem no mesmo teste. Com `setTimeout` fakeado, o
      `Alpine.nextTick()` do helper `flush()` nunca resolve e o teste estoura o
      timeout de 15s — o reveal do `x-for` é rAF-deferido. Separar sempre:
      teste de render com timers reais, teste de tempo store-only sem montar
      nem dar flush.
      Cross-review pegou 4 buracos reais (listener do `lyra:toast` sem guarda
      de idempotência duplicando toast e timer; teste de XSS que passaria com
      `x-html`; `duration` do evento não provado; botão de fechar com um único
      toast, que não prova qual linha ele fecha) e eu peguei um quinto (alias
      `ToastOptions` exportado sem prefixo, fora do brief).

- [x] **`lyraAppSidebar` — binding do modo rail (2026-08-09)
      [batuta/20260809-020030-alpine-app-sidebar]** → codex
      (`gpt-5.6-terra`, high; worktree), 1 rodada corretiva por
      cross-review. Fecha o pedido do PRD `.batuta/prd-alpine-app-sidebar.md`
      vindo do repo `blade`, que corrigiu a classificação do PRD das ondas
      B–F: `app-sidebar` NÃO era estático — o React usa
      `useControllableState` para o rail. Estado único `collapsed`
      (modelable), bindings `root` (`:class` objeto + `:style` com
      `--appsidebar-width` 64px/`width`px, porque o CSS não define largura)
      e `toggle` (`:aria-label`/`:title` alternando, `@click`), evento
      `lyra:collapse`. **Quatro decisões de porte fechadas pelo maestro** e
      documentadas no JSDoc: chevron são dois `<path>` servidos com
      `x-show` (sem binding, igual aos ícones de sort do data-table);
      `title` dos itens é servido sempre pelo consumidor (o binding não
      varre `.lyra-sbgroup__item`); `addRailLinkLabels` não é portado; e
      `collapsible` não existe — a sidebar é colapsável exatamente quando
      o consumidor serve um toggle com `x-bind="toggle"`. Desbloqueia a
      task 7 do plano do blade.
      **Achado fora do lote:** `ade1488` entrou em main sem CI e deixou
      `prettier --check` vermelho em `.batuta/prd-alpine-ondas-b-f.md`;
      o commit deste lote corrige a formatação junto, senão nenhum PR
      passa no gate de lint.

- [x] **Promoções pós-catálogo COMPLETAS (2026-08-08) — avaliação dos 3
      adiados fechada com o usuário** — lyraSlotPicker #163 (destravado
      pelo tzpicker #156; agrupamento por dia da ZONA via truque Intl
      en-CA, calendário lateral com marcadores, pills selecionar→confirmar,
      countdown de reserva) e lyraWeeklyScheduleEditor #164 (7 dias,
      intervalos com aritmética exata, popover de cópia profunda, exceções
      de data via picker aninhado). Ambos → codex (medium, worktree);
      s1 teve 1 gate de design (re-disparo verbatim) + 4 defeitos de
      fixture, w1 saiu com typecheck limpo de primeira graças à seção
      `<fixture_laws>` no brief. **calendar-view ADIADO por decisão** —
      porte direto rejeitado (566 linhas de renderização geométrica; num
      app Blade a grade nasce server-rendered); se o blade pedir,
      re-escopar como shell fino (view/anchor, prev/next, popover de
      evento, linha do agora) sobre grade servida.
      **Duas leis novas de Alpine**: (1) `<template x-for>` monta UMA raiz
      igual ao x-if — ramos irmãos precisam de wrapper único, e quando o
      wrapper mudaria o layout use `display: contents`; (2) com guard de
      eventos aninhados no root, os eventos PRÓPRIOS do componente têm de
      sair do root (`$dispatch` dispara do filho que avalia a expressão e
      o guard engole) — bug real pego no w1. Também: `JSON.stringify` em
      atributo `x-data` de aspas duplas trunca a expressão e derruba o
      componente inteiro. 241 testes (31 suítes), size 18.39/18.5 kB.
      22 changesets minor → 0.2.0 via Version Packages (usuário). Trails:
      .batuta/runs/2026-08-08-alpine-{s1-slot-picker,w1-weekly-schedule-editor}.md.

- [x] **Promoção pós-catálogo: lyraRecurrenceSelector COMPLETA
      (2026-08-08)** (PRD §3, promoção pós-D; lot
      `.batuta/lot-r1-alpine-recurrence-selector.md` sobre o brief da onda
      E) — lyraRecurrenceSelector + `describeRecurrence` exportado #161 →
      codex (medium, worktree), 1 rodada + 1 fix de TEMPLATE do maestro.
      Editor RRULE-subset: presets derivados do weekday, editor custom com
      controles nativos, toggle de dia nunca esvazia, resumo vivo
      aria-live via os 13 templates de sentença inteira, date picker
      aninhado via escopo-alias, estado JSON-safe (end.date ISO; payload
      provado por JSON.parse(JSON.stringify)). Divergência declarada:
      label-função conflicts(count) → templates conflictsOne/conflictsMany.
      **13ª lei de Alpine descoberta**: `:value` de `<select>` com options
      de `x-for` roda ANTES das options montarem e fica obsoleto (estado
      certo, DOM errado) — template canônico usa `:selected` POR OPTION.
      228 testes (29 suítes), size 16.53/16.73 kB (primeiro budget medido
      pelo próprio sandbox do codex via tsdown direto). 20 changesets
      minor (B–F + recurrence) → 0.2.0 via Version Packages (usuário).
      Reavaliar com o usuário: weekly-schedule-editor, slot-picker,
      calendar-view. Trail:
      .batuta/runs/2026-08-08-alpine-r1-recurrence-selector.md.

- [x] **Onda F `@lyra-ds/alpine` COMPLETA (2026-08-08) — CATÁLOGO DO PRD
      B–F FECHADO** (PRD: `docs/prd-alpine-ondas-b-f.md`; lot
      `.batuta/lot-f1-alpine-data-table.md` sobre o brief da onda E) —
      lyraDataTable #159 → codex (medium, worktree), 1 rodada limpa de
      código; reparos do maestro só em teste: (1) expectativa contradizia a
      regra travada de nulls-last em desc (esperava o reverse() do React —
      a divergência foi DECLARADA pelo executor, corretamente); (2) prova
      revert-the-fix pegou asserção VACUOSA — a restauração da ordem
      servida era testada de um estado idêntico à ordem original (mutação
      passava); endurecida via desc-by-name, re-mutação morde. Modelo
      DOM-driven: ids `data-row-id` em ordem ORIGINAL, indeterminate
      imperativo, ciclo asc→desc→null com aria-sort, clientSort opt-in
      (insertBefore, localeCompare numeric/base, nulls por último nas duas
      direções, restauração da ordem servida). 221 testes (28 suítes),
      size 14.66/14.75 kB. 19 changesets minor (B–F) → 0.2.0 via Version
      Packages (usuário). Pós-catálogo: promover recurrence-selector
      (decisão com o usuário); reavaliar weekly-schedule-editor,
      slot-picker, calendar-view. Trail:
      .batuta/runs/2026-08-08-alpine-f1-data-table.md.

- [x] **Onda E `@lyra-ds/alpine` COMPLETA (2026-08-08)** (PRD:
      `docs/prd-alpine-ondas-b-f.md`; brief `.batuta/brief-alpine-wave-e.md`,
      lots e1–e3; a pedido "onda 7" — não existia nos planos, usuário
      confirmou Onda E) — busca APG: lyraCombobox +
      `internal/active-descendant.ts` #155, lyraTimeZonePicker #156 (camada
      de dados ESTENDENDO a factory do combobox — padrão novo, sem markup
      aninhado), lyraCommandPalette #157. Todos → codex (medium, worktree),
      1 rodada cada + reparos do maestro: e1 um teste com premissa errada
      (query 'jp' era o VALUE; filtro só olha label+keywords); e2 três
      defeitos de construção de teste (useFakeTimers sem toFake congela o
      próprio flush() → deadlock; Chromium emite GMT+0 para Londres; axe em
      listbox vazio = aria-required-children transitório); e3 um BUG REAL no
      helper compartilhado `internal/focus-trap.ts` exposto pelo primeiro
      trap com options tabindex="-1" — isTabbable não rejeitava
      tabIndex < 0, o wrap do Tab nunca disparava (fix 1 linha, alargamento
      de escopo do maestro). 210 testes (27 suítes), size 13.82/13.9 kB.
      18 changesets minor acumulados (B+C+D+E) → 0.2.0 via Version Packages
      (usuário). Resta do PRD: F (data-table); pós-D: promover
      recurrence-selector. Trails:
      .batuta/runs/2026-08-08-alpine-e{1,2,3}-*.md.

- [x] **Onda D `@lyra-ds/alpine` COMPLETA (2026-08-08)** (PRD:
      `docs/prd-alpine-ondas-b-f.md`; brief `.batuta/brief-alpine-wave-d.md`,
      lots d1–d4) — datas fechadas: lyraCalendar + `internal/date-utils.ts`
      #150 (grade 42 dias, 3 views, range, teclado completo),
      lyraDatePicker #151, lyraDateRangePicker #152, lyraTimePicker #153.
      Todos → codex (medium). Arquitetura dos pickers: coordenador fino
      compondo lyraPopover/lyraBottomSheet/lyraCalendar aninhados com
      x-model encadeado. **Três leis novas de Alpine descobertas na onda**:
      (1) o canal x-model/entangle SERIALIZA Dates para strings JSON — todo
      estado data-like normaliza na LEITURA (`normalizeDay`); (2)
      encadeamento x-modelable com nome igual entangla o componente consigo
      mesmo (conferido no fonte do Alpine) — escopo-alias get/set no
      template canônico; (3) `<template x-if>` monta só UM elemento raiz.
      As leis acumuladas no brief renderam a primeira rodada 100% limpa
      (d4: 180/180 de primeira). 180 testes (23 suítes), size 10.63/10.85
      kB. 15 changesets minor (B+C+D) → 0.2.0 via Version Packages
      (usuário). Restam do PRD: E (combobox/command-palette APG + timezone
      picker) e F (data-table); pós-D: promover recurrence-selector.

- [x] **Onda C `@lyra-ds/alpine` COMPLETA (2026-08-08)** (PRD:
      `docs/prd-alpine-ondas-b-f.md`; brief `.batuta/brief-alpine-wave-c.md`,
      lots c1–c6) — 6 entregas: lyraBottomSheet #143 (desbloqueia os pickers
      da onda D), lyraTableOfContents + `internal/scroll-spy.ts` #144,
      lyraTimeInput #145, lyraFileUpload #146, lyraFileManager #147, theme
      store (primeiro `Alpine.store` do pacote, contrato anti-flash com o
      blade) #148. Todos → codex (`gpt-5.6-terra`, medium); 2 re-disparos
      verbatim (gate de design nos lots c3/c4). A verificação do maestro
      pegou e corrigiu: foco inicial fora da paridade React (c1), teste de
      drag guard vacuoso (c1), geometria mascarando o branch de fim de
      documento no scroll-spy (c2), steppers invisíveis sem wrapper (c3),
      espera por existência de span x-show (c4), clearInterval vacuoso (c4)
      e o flake do empty state com DUAS causas (c5): estado reativo escrito
      em `$watch` mata o efeito x-show dependente → derivar DENTRO do efeito; + corrida do reveal rAF-deferido nos testes → `vi.waitFor` por
      transição. 150 testes Browser Mode (19 suítes), size 8.14/8.35 kB.
      11 changesets minor acumulados (B+C) → 0.2.0 via Version Packages
      (usuário). Restam: D (datas — calendar/date-picker/range/time-picker),
      E (busca APG), F (data-table).

- [x] **Onda B `@lyra-ds/alpine` COMPLETA (2026-08-08)** (PRD:
      `docs/prd-alpine-ondas-b-f.md`; brief `.batuta/brief-alpine-wave-b.md`,
      lots b1–b5) — 5 bindings novos portados do React: lyraCodeBlock #136,
      lyraCookieBanner #138, lyraSidebarGroup #139, lyraSegmentedControl
      #140, lyraWorkspaceSwitcher #141. Todos → codex (`gpt-5.6-terra`,
      lane medium), 1 rodada limpa cada; sandbox do codex degradou a partir
      do b3 (pnpm ERR_SQLITE_ERROR — nenhum gate rodou lá), então budget de
      size, prettier-fix e todas as provas ficaram com o maestro na
      integração (trails em `.batuta/runs/2026-08-08-alpine-b*.md`).
      102 testes Browser Mode (13 suítes), revert-the-fix por lot,
      size-limit 5.46/5.65 kB. 5 changesets minor acumulados → próxima
      release 0.2.0 via Version Packages (usuário). Próximas ondas do PRD:
      C (médios + infra: bottom-sheet, TOC/scroll-spy, time-input,
      file-upload, file-manager, theme store), D (datas), E (busca APG),
      F (data-table).

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

- [x] alpine: chave de storage do `$store.theme` configurável por `<html data-lyra-theme-key>` [batuta/20260810-182007-alpine-theme-key] → codex

- [x] alpine: `lyraTimePicker` aceita `labels.timeOptions` para o `aria-label` da listbox [batuta/20260810-180448-alpine-tp-labels] → codex

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

- 2026-09-08: Approved returnFocusTo plan executing: Task 1 delegated to Codex gpt-5.6-terra, high reasoning; no retry yet. Controller verification pending. No Colima/resource changes.

- [x] Resumed with maintainer confirmation2026-09-10 at Alpine Tabs public MDX migration/snippet proof. Runtime87cd246 is complete; do not redispatch it. Documentation/medium Codex gpt-5.6-terra with GLM5.3Flash discovery/review; preserve React/Blade sections and all resource/release boundaries. Pending WORK.md bookkeeping will accompany the verified documentation commit.

- [x] Task27 Alpine public MDX and panel-container teardown verified — CodexTerra/medium127.86s, invalid orchestration retry138.49s then high104.96s docs completion; newly discovered section-focus repair high185.20s +23.53s format-only retry. Final source20/20/20, exact snippets90/90 and prior runtime63/63 native, zero JS errors; old runtime2RED/restored2PASS, MDX2/stack303/types/build/publicexports/docgen/formatPASS. GLM257.01s3DONE/1975-file unchanged guard/verifierPASS; sole size observation accepted as existing unwaived Task10. WholeAlpine23051/21200B (+29B). See .batuta/v1-tabs-alpine-docs-verification.md. Product commit3446d98. Next owning-source Blade migration; Task27/V1 incomplete.

- [x] Task28 DataTable semantic actions accepted locally — Codex gpt-5.6-terra/high285.17s + one74.68s retry, no escalation; GLM review73.13s3DONE/no findings/unchanged1980-file guard/verifierPASS. Source10eachengine/SSR2/native66/actualSSR4/publictypes/MDX2/stack303/build/docgen PASS; oldsourceRED/restoredPASS. DataTable1661→1638/2250B;12existingReact size failures remain Task10. See .batuta/v1-data-table-verification.md. Product commita8bf1d1; next31modal/38Popover,10size,39final core/Alpine qualification. Blade deferred.

- [ ] Task31 current native baseline ata8bf1d1: initial9PASS; background inert12FAIL and focused-removal9FAIL, zero probe/page errors. Prior baseline re-run against current artifacts with historical evidence retained. Next bounded dynamic-focus contract/review, then implementation; background/topmost ownership still requires separate design. See .batuta/v1-modal-ownership-current.md.

- [x] Task40 / Task31 local dynamic focus recovery accepted — Codex gpt-5.6-terra/high367.14s +399.85s retry, escalated to critical/controller for bounded completion. Final shared35eachengine +fourowners121eachengine, SSR14, native252, types/lint/build/docgen/publicAPI/hash PASS; original2RED/restoredPASS and critical4RED→PASS. GLM full174.23s then delta124.49s3DONE/no findings/unchanged1986-file guard/verifierPASS.12React size failures remain UNWAIVED. See .batuta/v1-modal-dynamic-focus-verification.md. Product commit6b9645c.

- [ ] Task31 next: background isolation and sibling/topmost/parent-child ownership. Fresh native baseline at6b9645c: initial9PASS/removal9PASS/backgroundinert12FAIL, zero probe errors. Dynamic recovery Task40 is closed locally. Continue with a bounded current-owner isolation/coordination design and native proof. Task38Popover, Task10size and Task39final core/Alpine qualification follow; Blade deferred.

- [x] Task31 modal isolation and branch ownership accepted locally — product commit879b315. CodexTerra/high601.24s +446.33s retry then critical/controller correction. Final201source each engine, SSR14,342compiled native, types/lint/build/docgen/publicAPI/hash proof PASS;153protected files and450React artifacts bound. GLM final80.86s3DONE/no findings/1995-file unchanged guard/verifierPASS; review's two proof/behavior corrections completed, retained-reopen hit-proof finding declined with exact three-engine rows. Empty review responses diagnosed as output limits and recovered in the same session.12React+1Alpine size failures remain UNWAIVED. See .batuta/v1-modal-isolation-verification.md. This closes the pending Task31 entries above; no final V1 qualification. Next38Popover,10size,39final core/Alpine; Blade deferred.

- [x] Task38 bounded Popover child ownership accepted locally atb471a5c. High353.55s +319.16s retry then critical/controller completion;40source each engine, SSR5,51compiled native, static/build/docgen/public153/modalESM parity PASS. Original owner14RED/restored23PASS; native microtask loss3RED corrected. GLM23.29s3DONE/no behavioral findings/unchanged2002-file guard/verifierPASS. Popover1755/3000B;12React+1Alpine size failures remain unwaived. See .batuta/v1-popover-child-ownership-verification.md. Next Task10 exact measured size resolution, then Task39 automated core/Alpine qualification with explicit anchored placement/ownership audit; constrained BottomSheet observation is not waived. Manual evidence follows the selected release profile. Blade deferred.

- [ ] Task10 current packed diagnostic atbd9bb5d complete: critical/controller35.98s,72standalone/5scenario/4CSS measurements,450React artifact parity;13standalone budget failures retained. GLM7.24s3DONE/unchanged2003-file guard/verifierPASS for evidence honesty only. Same consumer lock/tools but historical repository lock differs; no final before/after qualification or cap change. Exact tarballs retained, temporary checkout/borrowed links removed. Next same-lock comparison and measured optimization scope; see .batuta/v1-focus-size-diagnosis.md. Task39 and Blade boundaries unchanged.

- [x] Task10 size evaluation locally complete (Task10 resolution remains open): controller same-lock/config/consumer before9d214bf and after570fe37 plus3isolated measured hypotheses;72entries/5scenarios/4CSS eachrun,453candidate artifact parity,15tarball hashes and5guarded cleanups PASS. GLM scout43.08s +35.81s corrected stale/unsupported claims; final13.35s3DONE/no findings/unchanged2006-file guard/verifierPASS. FileManager and WorkspaceSwitcher icon subsets each remove their own failed cap in separate prototypes; focus-only deduplication does not. No active product/cap changes; current13failures remain. Next qualify FileManager icons, WorkspaceSwitcher icons, then address remaining modal/Tooltip/Alpine budgets. See .batuta/v1-size-limit-evaluation.md; raw MAIN .batuta/runs/v1-size-evaluation/run-trail.md.

- [x] Task10 FileManager icon optimization accepted locally atae229b2. CodexTerra/medium151.97s +75.67s retry, controller formatter and animation-settlement fixture correction;40source perengine/SSR1/native36exactSVG+pixel andkeyboard/static/build/docgen/153protected/453packedartifact identity PASS. Size9808→5530/9500B, files/data15599→11315B;12remaining budgets unwaived. GLM12.83s3DONE/2010-file unchanged guard/verifierPASS; informational alias suggestion declined with no actual collision. See .batuta/v1-file-manager-icons-verification.md. Next WorkspaceSwitcher icons, then remaining Task10/39; Blade deferred.

- [x] Task10 WorkspaceSwitcher icon optimization accepted locally atf4336e0. CodexTerra/medium65.40s, no retry;18source perengine/SSR1/native18exactSVG+pixel andorderedselection/create callbacks/static/build/docgen/153protected/453packedartifact identity PASS. Size8364→2889/8250B, application-shell17000→16954B; final FileManager5530/9500 andfiles/data11315B unchanged. GLM36.24s3DONE/no actual findings/2012-file unchanged guard/verifierPASS. Combined58source perengine,SSR2,native54exactframes;10React+1Alpine=11remaining budget failures unwaived. See .batuta/v1-workspace-switcher-icons-verification.md. Next remaining modal/Tooltip/Alpine budget decisions andTask39; Blade deferred.

- [x] Task10 remaining-budget evaluation at47d0dc1: critical/controller three packed hypotheses; GLM5.3Flash/low scouts75.71s/49.40s, both2013-file guards; final review10.32s missing-verdict format then12.77s3DONE/no findings/2014-file guard/verifierPASS. Tooltip12B andAlpine14B reductions leave failures; modal extraction grows7entries/2scenarios; all rejected.72imports/5scenarios/4CSS perrun,9tarball hashes/3cleanups/453unchanged active artifacts PASS.11budgets remain unwaived; no product changes. See .batuta/v1-remaining-size-limits.md. Next architecture/budget decision with runtime/module-contribution evidence; Task39 and Blade boundaries unchanged.

- [x] Task10 budget foundation prepared afterafa7f36 at maintainer request: critical/controller exact72entry/5scenario/4CSS/package explanation and11entry preliminary caps (5%maintenance allowance, round100B; tighter option also shown). GLM scout47.27s, selected historical metric/absence claims corrected; final23.75s3DONE/no findings/2015-file guard/verifierPASS. Existing6tarballs/453active artifacts/buildoverlay verified; extra fresh packed root-import comparison38.51s/3tarballs/453sameartifacts/cleanupPASS retains all72standalone results. All5root variants growBrotli; form1878→15135B, overlays11030→19043B; no consumer migration recommended. No source/cap/baseline edit or exception approval. See .batuta/v1-budget-foundation.md; latency/scenario disposition/ADRapproval andTask39 remain pending, Blade deferred.

- [x] Task10 standalone caps approved/applied after maintainer "De acordo entao": lowGLM5.3Flash59.63s/no retry, exactly10React+1Alpine fields; controller cold packed37.91s72/72PASS, same72actual sizes/453compiled artifacts/5scenarios/4CSS; all packed file contents identical except2manifests. Workspace71+1/Prettier/diff/scope/3tarball hashes/cleanup PASS. GLM final7.80s3DONE/no defects/2016-file guard/verifierPASS. See .batuta/specs/2026-09-11-v1-standalone-budget-decision.md. No asset growth; Task10 broader performance/scenario/delta/baseline disposition andTask39/mobile qualification remain pending, Blade deferred.

- [x] Task39 representative mobile lab at6dacf7e: critical/controller protocol/production packed measurement; GLM scout52.15s; Terra/medium fixture initial101.46s blocked by evidence-directory write permission, explicit-directory retry207.56s completed six files; no product edits.60coldloads+510trusted timedops (3warmups/30samples perseries), 390x844/DPR2/CPU4x/1.6Mbps/150ms Chromium151.0.7922.34. React/AlpineLCPp75 836/520ms; encodedHTML+JS+CSS77724/53471B inclframeworks; routine p95≤55.5ms and1000rowexpand83.1/151.5ms; native nestedDate/Time/Cancel p95≤52.6ms. Controls detect300ms block; longtasks, rawfailed harness preflights and all samples retained.453product hashes/exact3tarballs/fullguard/cleanup PASS. GLM final13.48s3DONE/no findings/2018guard/verifierPASS. See .batuta/v1-mobile-validation.md. Bounded lab complete; physicalphone/fieldINP/formal family responsiveness and remaining Task39/scenario/delta/baseline release qualification not claimed; Blade deferred.

- [x] Task39 documentation production-build prerequisite: GLM5.3Flash/low27.90s, no retry, exact two-line client directive in DataTableBasic. Controller original production build RED; restored docs production build/lint/types PASS and actual exported DataTable page click Atlas + Enter Orbit PASS with no page errors. Initial diagnostic routes were nonexistent and corrected to the actual /en/components/data-table route; no product fixture change. Package/runtime bytes unchanged. Full release gates remain in progress; raw MAIN .batuta/runs/v1-final-gates/.

- [x] Task39 formatting ownership repair: GLM5.3Flash/low27.43s partial +46.79s retry; .prettierignore excludes operational .batuta and generated hook cache, preserving verbatim evidence and all product paths. WORK whitespace-only formatting. Controller pinned full lint/scope/diff PASS; independent CodexTerra/medium final27.05s2DONE/no findings/unchanged guard/verifierPASS after correcting reviewer checkout/scope context. Prior docs fix5ff3aa8 verified production build/native actions. Final matrix remains in progress; no library code, caps or baseline changed.

- [x] Task39 Tooltip focused-expiry fixture isolation: GLM5.3Flash/low35.57s/no retry,5test-only lines. Pinned Linux full Chromium817PASS/1FAIL reproduced physical hover shifting onto second trigger during removal; instrumented no-expiry timer/trusted mouseover proof. Native pointer parking outside both roots retains exact300/499/1ms assertions. Controller13tests each engine/static3PASS; disabled real expiry1RED/restored1PASS, temporary coordinator restored byte-for-byte. No runtime/size/API changes; full matrix rerun follows. Raw MAIN .batuta/runs/v1-final-gates/.

- [x] Task39 usePresence scheduling fixture: CodexTerra medium459.54s +226.73s retry failed flush/act sequencing; high343.12s corrected only internal.browser.test.tsx. Controller10tests eachengine/static4PASS; four real-hook faults each1RED andrestored10PASS, runtime restoredbytes. Initial highFirefox browserdisconnect retained; unchanged retryPASS. GLM final18.35s3DONE/no findings/unchangedguard/verifierPASS after inline-evidence/format corrections. Original animation durations and unrelated six tests preserved. Full matrix follows; raw MAIN .batuta/runs/v1-final-gates/presence-disposition.md.

- [ ] Task39 final-gate audit at4b324ef:13static/21of22build-package commands pass after docs/format corrections; baselineFAIL unwaived. Linuxcore691PASS+2opt-in skips/support201PASS; native35PASS separately; hostworkspace820PASS. LinuxStyles89eachPASS, fullReact/Alpine matrix repeatedly disconnects, including six-file batches with misleading JSONsuccess; LinuxReactbuild137 unavailable. HostStyles89each/React818each/Alpine315Chromium+315Firefox+313WebKitPASS,2WebKitfocusFAIL reproduced2/13. PlainWebKitmacOS Tab skipsbuttons/click blursfocusedbutton; disposableDatePicker capturesBODY and eligibilityrejectsBODY, actualcontract remainspending.453artifact identity preserved; ownLinux/scratch cleanupPASS/allrawdiagnostics retained. GLM audit102.39s+195.04s evidence correction, final3DONE/no findings/unchangedguard/verifierPASS; finalformatPASS. See .batuta/v1-final-gates.md. Next nativeAlpine/WebKitfocus disposition, exactLinuxbuild/matrix, historicalbaseline decision and23-cell/P1evidence. No V1stable/Blade/publication claim.

- [x] Task39 Accordion nativeTab fixture: CodexTerra/medium240.96s/no retry, one test file; controller7cases eachengine onhost andpinnedLinux384MiB, types/format/diffPASS. Closed/open sameinput native traversal removes macOSWebKit skipped-button assumption. Productioninert negativecaught structurally; supplemental structural-bypass nativeprobe stillpasses, retained without inert-only causalclaim. GLM15.54s2DONE/informationalonly/unchangedguard/verifierPASS. Runtime unchanged. Raw MAIN .batuta/runs/v1-focus-closure/. Linux fullReact now completes818cases withoutconnectionloss at384MiB but has1CommandPalette rapidreopenfixtureFAIL; remainsopen afterDatePickercomposition migration.

- [x] Task39 Alpine DatePicker consumer and public template: Codex Terra/high 270.99s plus one corrective high retry 521.38s. Scoped returnFocusTo handles native pointer and per-instance targets; literal JSDoc regression exposed and repaired malformed/sibling-root HTML. Controller 27 tests per engine on host and pinned Linux, resolver-only WebKit RED/restored PASS, types/format/build/docgen/docs lint+build/size PASS. Executable source and consistently minified bundle unchanged; raw JS +150B and source maps changed, declarations unchanged; current size 23.05/24.2kB. GLM60.36s three DONE, unchanged guard/verifier PASS; timeout observation adjudicated against unchanged existing polling contract. See .batuta/v1-datepicker-focus-verification.md and MAIN raw v1-focus-closure. Remaining full matrices, CommandPalette timing and baseline/qualification stay open.

- [x] Task39 CommandPalette retained-panel fixture: Codex Terra medium448.17s + retry133.21s, high107.26s for scoped React act ownership. Controller31cases per engine on host and pinned Linux, zero introduced act warnings; production presence/resolver faults each RED/restored PASS and real350ms delayed-reopen proof PASS. Native CSS pause/release,249+1 clock and same-panel/fresh-focus assertions retained. Static checks and450React artifact identities PASS. GLM29.48s three DONE/unchanged guard/verifier PASS; two low reporting/motion-profile limitations explicitly adjudicated. See .batuta/v1-cmdk-reopen-verification.md. Separate full Alpine Linux matrix319cases/34files each engine PASS. Full React Linux matrix running; baseline/build/qualification remain open.

- [x] Task39 bundle-path portability: Codex Terra medium205.80s + one retry144.88s. Fixture/repository aliases normalize in owner order; controller caught and added the mixed fixture-alias/real-repository precedence case. Controller29unit tests PASS, original owner real-symlink RED/restored2PASS, scoped format/diff PASS. GLM45.15s three DONE/unchanged guard/verifier PASS; alleged literal # regression disproved, bounded report-time filesystem cost accepted. All actual metrics/budgets/comparators/history unchanged. Owned fixture/cache cleanup complete. See .batuta/v1-bundle-path-verification.md; fresh collector and baseline policy remain pending. Full Linux React Chromium/Firefox818each PASS; WebKit continuous and fourth shard disconnected. Isolated WebKit recheck exposed a Drawer backdrop test with no exposed backdrop in its narrow screenshot; diagnosis pending, no aggregate WebKit PASS.

- [x] Task39 Drawer native backdrop fixture: Codex Terra medium194.79s/no retry, one test. Controller native geometry/target establishes narrow333px header hit vs1280px overlay; explicit desktop branch restores viewport/listener.20cases each engine host+Linux, actual resolver fault RED/restoredPASS, static and450React artifact identity PASS. GLM23.51s +4.24s verdict-format correction,3DONE/unchangedguards/verifierPASS; informational animation geometry concern already covered by native target capture. Complete partitioned Linux WebKit82files/818cases nowPASS; continuous command and failed fourth shard remain resource failures. Chromium/Firefox818each and Alpine319eachPASS. See .batuta/v1-drawer-backdrop-verification.md. Fresh collector72capsPASS/no absolute module paths; historicalbaseline stillFAIL with actual scenario growth. Linuxbuild/formalqualification pending.

- [x] Task39 canonical bounded React build: Codex Terra medium142.18s/no retry; config name labels and three-file runner integration. Controller host39.81s/Linux51.73s both450files SHA-identical, actual syntax-fault2.39s nonzero/postprocess-not-run, restoredLinux50.41s450same. FullReact ESLint/types/scopedformat/diff/publint/attw PASS. GLM21.74s3DONE/informationalonly/unchangedguards/verifierPASS. No dependency or VM/service changes. See .batuta/v1-bounded-build-verification.md. Separate P1 high407.07s draft preserved outside active product: real coldReact18types fail on Vitest BufferEncoding, and missing-required-check mock exposes incomplete guard. Awaiting explicit test-only @types/node exception; no new dependencies or P1 qualification. Historicalbaseline/composition and formal253cells remain open.

- [x] Authorized React compatibility fixture Node types: GLM5.3Flash/low15.36s/no retry, two manifest additions; controller generated only their locks. @types/node24.13.3 + transitive undici-types7.18.2, unchanged existing package records and root lock. Full existing packed React18.3.1/19.2.8 types/build/SSR/hydration/browser PASS, frozen locks stable,450React outputs identical and own consumer cleanup PASS. See .batuta/v1-compat-node-types-verification.md. User exception applies only these test fixtures; P1 producer retry follows.
