# Plan 08 — Adoption + debt (post-v1 milestone)

Defined with the user on 2026-08-03, immediately after the close of Phase 7
(v1 released) and 6c-d (theme-aware favicon, PR #50). Rationale: the release
window expires; Zag.js (blocked phase 2) and the Vue satellite do not. The
choice between them belongs to the next milestone, informed by the signal
promotion brings (Vue requests → satellite; interaction bugs → Zag).

User decisions (2026-08-03):

- **Announcement/blog**: no new infrastructure — a pinned GitHub Discussion as
  the canonical announcement + a dev.to cross-post with canonical link. A
  dedicated blog only if the cadence later justifies it.
- **Starter templates**: separate repositories in the org
  (`lyra-ds/starter-vite`, `lyra-ds/starter-next`) — directly cloneable and
  visible in the org. Accepted cost: keep two repositories in sync with releases.

## Track 1 — release debt (sequential, in this order)

- [x] **08-1 tsup → tsdown** (PR #54, 2026-08-03) — in `@lyra-ds/react`. The
      path sanctioned by tsup itself; use `migrate-from-tsup`. The CI build job
      proves dist equivalence (publint, attw, size-limit, pack-smoke, dist-scan,
      smoke) — the gates exist precisely for that. Attention: tsup's deterministic
      `'use client'` prepend lives in `onSuccess` and needs an equivalent; exports
      map == entries == dist basenames remains law. Generates a patch changeset
      (this is the build change needed by 0.1.1).
- [x] **08-2 Release 0.1.1 via OIDC** (2026-08-03, run 30838899789, SLSA
      provenance on both packages) — merging the Version Packages PR proves the
      trusted-publishing path end to end (provenance by default). First release
      since the PR #43 migration.
- [x] **08-3 Revoke `NPM_TOKEN`** (2026-08-03, secret removed, header updated)
      — (manual, user) — unblocked by the green OIDC release. Remove the fallback
      documented in the workflow header in the same PR that records the revocation.

## Track 2 — adoption (independent of track 1, any order)

- [ ] **08-4 Contribution templates** — issue forms (bug, feature, docs), PR
      template, curated labels. CONTRIBUTING.md and CoC already exist.
- [ ] **08-5 Curated good first issues** — 3 to 5 issues in the #28 form
      (context, files, acceptance criteria, no spoon-fed solution).
- [ ] **08-6 Release content** — announcement copy (pinned, bilingual
      Discussion) + promotional drafts for the user to post: Show HN, r/reactjs,
      dev.to (canonical → Discussion), X/Bluesky.
- [ ] **08-7 Starter templates** — `lyra-ds/starter-vite` and
      `lyra-ds/starter-next`: minimal, installing public npm versions,
      demonstrating styles + react + white-label in 4 tokens + dark mode.
      Creating the repositories is manual work by the user (guided); the content
      comes from here.
- [ ] **08-8 Snapshot releases** — `workflow_dispatch` workflow with
      `seek-oss/changesets-snapshot` (`0.0.0-snapshot-*`) so a contributor can
      test a PR without a real release.

## Track 3 — governance (requested by the user, 2026-08-03)

- [ ] **08-9 Project documentation in English** — revisit the rules so every
      public-facing document (README, CONTRIBUTING, templates, changesets,
      comments) is English, as this is open source. Decide the fate of internal
      prose (`WORK.md`, `.batuta/`) with the user before converting anything.
- [ ] **08-10 `.batuta/` and `WORK.md` cleanup** — archive delivered lot briefs,
      condense WORK.md history (move lessons to the profile or a lessons file),
      remove completed plans.

## Outside this milestone (recorded for the next one)

- Blocked Phase 2: Zag.js behavior layer in interactive wrappers.
- `@lyra-ds/vue` satellite (the first “Coming soon” item to fall).
- TS 7 (depends on 08-1 maturing), Tailwind satellite preset.
- ~~Phase 8 — port the v1.1+v1.2 handoff delta~~ COMPLETED 2026-08-03 (waves
  1–6d, catalog at 78 components; see WORK.md). Only DiffCard remains, below.
- **dts build debt:** one tsdown configuration per entry does not scale (71
  entries exhaust the 4 GiB heap). It is mitigated with `--concurrency 2` +
  `NODE_OPTIONS=8192`; evaluate the real post-phase fix: a single-pass
  `tsc --emitDeclarationOnly` or tsdown's dts worker once mature.
- **DiffCard:** the one v1.2 handoff component not yet ported; it can be
  reconstructed from its CSS. Decide when it becomes relevant.
