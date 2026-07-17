# Phase 1: Monorepo Foundation & Governance - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The repo becomes a credible OSS home: pnpm workspace scaffolding, governance files, visible CI on GitHub, and a written 0.x versioning policy — all before any package code lands. Requirements: OSS-01, OSS-02, OSS-03, OSS-05. Package code, tokens, and components belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### GitHub org & repo (timing and naming)
- **D-01:** Create the GitHub org **`lyra-ds`** during Phase 1 (user creates it manually, guided step). Availability verified 2026-07-16: `lyra` and `lyra-ui` are taken on GitHub; `@lyra` npm scope is occupied (`@lyra/core` exists); `lyra-ds` is free on GitHub and `@lyra-ds/react`/`@lyra-ds/styles` are unclaimed on npm. Org handle matches the npm scope 1:1.
- **D-02:** Repository is **`lyra-ds/lyra`** (short URL, "Lyra" is the product; the org already says "ds"). Local directory stays `lyra-ds` — only the remote name matters.
- **D-03:** Full org branding (avatar, profile README, social preview from `handoff/assets/github/`) remains Phase 7 scope (OSS-04). Phase 1 only creates the org + repo and pushes.
  - **D-03 partial override (2026-07-17, user-directed during execution):** The user explicitly requested the org **profile README** now. Created `lyra-ds/.github` with `profile/README.md` (handoff copy, emoji bullets stripped per Lyra voice) + `assets/lyra-mark.svg` (from `org-avatar.svg`; raw URL verified HTTP 200). **Still deferred to Phase 7:** org avatar upload and social preview. Scope of this override is the profile README only.

### Repo/governance language
- **D-04:** Governance surface is **English**: README, CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue/PR templates.
- **D-05:** README gets a **pt-BR mirror** (`README.pt-BR.md`) linked prominently from the top of README.md (badge/link "Português"). Only the README is mirrored — CONTRIBUTING/CoC/templates are EN-only.

### Package versioning strategy
- **D-06:** **Lockstep versioning** — changesets `fixed` group covering `@lyra-ds/styles` + `@lyra-ds/react`. "Lyra 0.x" is one version; compatibility between the two packages is self-evident to users. Aligned with research (class contract couples the packages).

### Repo workflow
- **D-07:** **PRs from day one** — branch protection on `main`, all work (including each GSD phase) lands via PR with green CI. The PR history doubles as the project's public build log, and the flow contributors will use is exercised from the start.
- **D-08:** Planner must reconcile the GSD commit flow with branch protection: `.planning/` docs ride the same feature-branch → PR flow (GSD's branching strategy setting / `/gsd-ship`), or branch protection is configured to allow the workflow. Don't leave planning commits stranded on protected main.

### Claude's Discretion
- Linter/formatter choice (ESLint+Prettier vs Biome vs oxlint), CI job layout, tsconfig.base details, .gitignore/.npmrc specifics, changesets config beyond the fixed group, CODEOWNERS — standard patterns per research STACK.md; decide at planning/execution time.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Conversion spec & architecture (project-wide)
- `handoff/design_handoff_lyra_lib/README.md` — canonical conversion spec: locked architecture decisions, suggested monorepo layout, publication checklist
- `.planning/research/STACK.md` — prescriptive tooling versions/configs (pnpm, TS 5.9.3 pinned, tsup 8.5.1, changesets + OIDC flow, CI shape)
- `.planning/research/ARCHITECTURE.md` — package boundaries, shared config approach (tsconfig.base, no TS project refs), build order
- `.planning/research/PITFALLS.md` — packaging metadata pitfalls to prevent at authoring time (sideEffects, exports maps, publishConfig, 0.x policy)

### Requirements & policy
- `.planning/REQUIREMENTS.md` — OSS-01, OSS-02, OSS-03, OSS-05 (this phase)
- `.planning/PROJECT.md` — locked constraints (MIT + full governance, pnpm+changesets, CI gates)

### Assets
- `handoff/assets/github/org-profile.md` — org name/description/profile README copy (Phase 7 uses it fully; Phase 1 may reuse the short description when creating the org)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `handoff/` (committed): design reference bundle — no production code exists yet; Phase 1 scaffolds around it
- `handoff/assets/github/org-profile.md`: ready-made org description and README copy (EN) usable for repo README pitch
- `.planning/` + `.claude/CLAUDE.md`: GSD state already committed on `main` — first push carries this history

### Established Patterns
- Repo history so far is conventional commits (`docs:`, `chore:`) — keep the convention
- GSD config: yolo, parallel plans, commit_docs=true — interacts with D-07/D-08 (branch protection)

### Integration Points
- CI must leave hooks for later gates (publint/attw/size-limit/token+class parity) that Phases 2–4 will add
- `pnpm-workspace.yaml` must anticipate `packages/*`, `apps/*`, `tools/*` (docgen arrives in Phase 5)

</code_context>

<specifics>
## Specific Ideas

- User explored org handles `lyra` and `lyra-ui` — both taken; settled on `lyra-ds` org + `lyra` repo after live availability check
- README pitch should lead with CSS-first, white-label in 4 tokens, and the adapter/registry roadmap (OSS-01)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Monorepo Foundation & Governance*
*Context gathered: 2026-07-16*
