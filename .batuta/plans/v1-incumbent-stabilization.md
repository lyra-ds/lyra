# Plan — V1 incumbent stabilization

<!-- inputs: profile.md@sha256:44e9c9ccb2e9 routing.md@sha256:99f96b92331f -->

**Goal:** Retain Lyra's existing base, remove compulsory comparative research from the V1 route, and establish the next small regression-driven correction without weakening release acceptance.
**Created:** 2026-09-08 · **Status:** done

The maintainer approved the direction and this update in conversation on 2026-09-08.
This authorizes the governance update, source inventory and bounded first proof;
it does not preapprove every future API design or publication. The remaining
release streams below are a roadmap, not a speculative multi-file executor task.

## Tasks

<!-- prettier-ignore -->
- [x] 1. Record incumbent retention and update the release policy — governance/critical
      Scope: docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md, docs/superpowers/specs/2026-08-30-overlay-family-design.md, docs/superpowers/specs/2026-09-08-v1-incumbent-direction.md, docs/superpowers/baselines/lyra-v1/README.md, tools/overlay-foundation-evaluation/README.md, tools/v1-release/check.mjs, tools/v1-release/check.test.mjs
      Accept: Decision-policy regressions pass → node --test tools/v1-release/check.test.mjs; Ledger remains internally consistent without qualification → node tools/v1-release/check.mjs; Current docs consistently retain the incumbent and preserve all acceptance requirements

- [x] 2. Record the source-backed gap inventory and first correction boundary — planning/critical
      Depends on: 1
      Scope: .batuta/v1-incumbent-backlog.md, .batuta/scout/2026-09-08-v1-incumbent-gaps.md, .batuta/profile.md, WORK.md
      Accept: Every priority names a real current owner and distinguishes source observations from historical or unverified behavior; The first task has one observable failure hypothesis and does not introduce a replacement framework

- [x] 3. Reproduce Drawer backdrop pointer-origin behavior — evidence/critical
      Depends on: 2
      Scope: .batuta/v1-drawer-pointer-proof.md
      Accept: A real pointer interaction compares direct backdrop dismissal with press-inside/release-outside behavior using the existing Drawer and Dialog precedent, recording exact source/environment/results; If required execution is unavailable record that limitation without a PASS claim or environment change

- [x] 4. Repair Drawer pointer-origin dismissal — frontend/medium
      Depends on: 3
      Scope: packages/react/src/drawer/drawer.tsx, packages/react/src/drawer/drawer.browser.test.tsx
      Accept: Colocated regression and trusted pointer replay prove RED/GREEN; Chromium/SSR checks pass and WebKit introduces no failure relative to exact original-source baseline, with existing failures explicitly retained; API/dependency scope and independent review pass

- [x] 5. Diagnose WebKit focus failures and correct prepared-opener test fixtures — frontend/low
      Depends on: 4
      Scope: packages/react/src/dialog/dialog.browser.test.tsx, packages/react/src/drawer/drawer.browser.test.tsx
      Accept: Trusted-input diagnosis establishes cause; full local Chromium/WebKit suites pass for prepared compositions; restoration fault injection still fails exact assertions; production unchanged and unprepared mouse restoration remains explicitly unresolved

- [x] 6. Draft explicit modal return-focus contract — governance/critical
      Depends on: 5
      Scope: docs/superpowers/specs/2026-09-08-modal-return-focus-design.md
      Accept: Concrete API/lifecycle/compatibility and invalid-target obligations are consistent with existing modal requirements; independent review passes and proposal remains distinct from maintainer approval and implementation

Preparation, Drawer repair, fixture correction and contract drafting are complete.
This does not complete V1 stabilization. The unprepared WebKit mouse-return-to-body
gap has a technically reviewed returnFocusTo proposal awaiting maintainer API
approval; no implementation is authorized merely by this plan entry.
Full release qualification remains pending.

## Decisions and context

Active checkout: `../lyra-v1-stabilization`, branch
`feat/v1-incumbent-stabilization`, based on integrated 9d214bf. Experimental
`feat/v1-overlay-composed-wave` remains separate at 94aa4b5 plus managed suspension
notes only. Its incomplete diagnostic is not a blocker for this direction.
Do not merge the experiment or resume candidate comparisons. Keep raw history.

Never change ANY Colima configuration or restart it, including restoration to
4GiB. Never stop other projects to free capacity. Run small checks sequentially
with existing resources. A missing required gate remains pending; it is not
waived. No new dependencies, resource workaround or remote operation.

**Task 3.** Start from Drawer backdrop handler and existing Dialog WR-02 test.
This is a reproduction task only: no production change or public API decision.
Do not combine reopen focus, nested layers, CommandPalette or other observations.
Use actual interaction; no mock of the success behavior. If the failure is
confirmed, create a separate atomic repair brief with the narrow owner/test
scope and existing regression checks. A source allegation alone is insufficient.

The V1 roadmap after that first proof is: close confirmed overlay P1 gaps in
small reviewed tasks, author the Tabs contract and amend DataTable's contract,
implement their approved changes, then qualify exact packed release artifacts.
Specifications, migration guidance and compatibility remain required where
public contracts change. FileUpload remains closed; no enterprise grid.

All11P1 entries remain unqualified and all23acceptance cells stay required.
Before publication the planning-only release gate needs its separately scoped
candidate/evidence-binding stage. Then exact versioned tarballs, browsers,
SSR/hydration, security, bundle/runtime, types and real consumers must pass.
Manual AT absence remains deferred-by-release-profile. Major Changesets target
Styles/React/Alpine1.0.0; push/PR/merge/publication require their own authorization.
