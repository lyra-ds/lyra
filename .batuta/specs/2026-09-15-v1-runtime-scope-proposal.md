# V1 Automated Core runtime-scope decision (approved 2026-09-15)

**Status: approved and enacted by the maintainer on 2026-09-15.** Prepared on 2026-09-15 at candidate `acd4e809ab1a7513b19ad306be5549f57fa809ca`. The earlier maintainer authorization covered continued work only; later the same day the maintainer approved this release-gate change as recorded below. All requirements not explicitly deferred by this decision remain in force.

## Approval record

On 2026-09-15, after reviewing proposal `ba84ecc` and the explicit scope question, the maintainer replied **“aprovado”**. This enacts the V1 Automated Core runtime-scope decision exactly as written in this document and directs the canonical reconciliation it describes. The original proposal and its review remain preserved at `ba84ecc` and in the linked raw evidence; the file name and existing links are unchanged.

## Decision requested and enacted

For the incumbent Styles/React/Alpine **V1 Automated Core release only**, defer the creation and numerical qualification of new family responsiveness budgets where no approved numerical family protocol currently exists. Preserve every existing approved numerical runtime contract, including FileUpload, and every applicable functional, browser, accessibility, media, compatibility, package, security and release requirement.

This is a deliberate reduction in required performance evidence for this release profile. It does not prove that unmeasured operations are fast, establish a universal latency SLA, or turn current browser-test durations into responsiveness evidence. The Full profile is unchanged. No known required performance-budget failure or P1 defect can be waived through this decision.

The bounded audit identifies Overlay, Tabs and DataTable as lacking located approved numerical protocols. This is not an exhaustive exemption list for all components. Before applying the approved deferral to any other family, its governing contract must be checked and its disposition explicitly recorded; an existing approved budget always remains mandatory. No blank ledger cell automatically becomes inapplicable or passed.

## Why the decision was necessary

The approved [quality specification](../../docs/superpowers/specs/lyra-v1/05-quality-performance.md#complex-component-responsiveness), lines433-449, requires each complex family to define workloads and a user-facing threshold. It also requires pinned production Chromium, fixed device/viewport and controlled conditions, explicit warm-up, at least30 samples per operation, median/p95/worst, long tasks, rendering assumptions and an event-to-next-paint boundary. It supplies no universal millisecond threshold.

At proposal time, the approved [September14 amendment](2026-09-14-v1-acceptance-policy-amendment.md#runtime-prerequisites-and-immutable-promotion) preserved those family protocols as a prerequisite to core acceptance. Its instruction was: “Approve missing protocol/threshold choices before collecting qualification measurements.” The [Automated Core amendment](../../docs/superpowers/specs/lyra-v1/05-quality-performance.md#2026-08-27-amendment-automated-core-release-profile) deferred manual evidence only; it did **not** already defer automated performance obligations. The dated September15 canonical exception now supplies the approved change.

Consequently, using functional runtime tests instead of missing performance qualification without a new approval would weaken an existing gate silently. This proposal requested that scope change openly instead; the shared quality specification requires maintainer and PRD-owner approval for a V1 gate change, technical review alone is not approval, and that approval is now recorded above.

## Disposition (as enacted)

| Obligation | Enacted V1 Automated Core treatment |
| --- | --- |
| FileUpload numerical runtime | Keep the existing100 controlled items/20 active attempts, at least30 iterations in pinned production Chromium; named operations each p95≤100ms, worst<250ms, no long task>50ms. Preserve its own immutable evidence and validator. Exact-candidate validity remains to be checked; this document grants no PASS. |
| Other already approved numerical runtime budgets, if found | Keep them mandatory. The absence of a budget in this bounded audit does not revoke an existing contract. |
| Overlay, Tabs and DataTable missing numerical family protocols | Record explicitly as deferred under this approved scope decision, with the family, missing protocol and decision link, rather than as PASS or measured non-regression. No new arbitrary dataset, generic100ms SLA or benchmark producer is required for this V1 profile. |
| Public behavior and intentional timing | Keep all applicable assertions: keyboard, focus, open/close, selection, controlled updates, teardown, SSR/hydration and adapter contracts. Tooltip hover/grace/close timing remains a functional contract; these delays are not performance budgets. |
| Packed runtime and package identity | Keep exact artifact binding. The945 packed Alpine public cases and React18/19 compatibility are reusable only within their proven scope and matching identities. They do not establish latency, every acceptance cell or fresh-install compatibility in every environment. |
| Media, direction, coarse pointer and platforms | No new deferral. Required automated evidence stays required. Existing manual deferral rules remain exactly as approved. Native Linux/Windows observations and ordinary required CI remain outstanding. |
| Immutable core acceptance | A later bounded implementation may admit the explicitly approved numerical deferrals while still requiring all preserved numerical budgets, applicable functional evidence, candidate identities and every other acceptance prerequisite. No pointer, validator or canonical status changes merely because this proposal exists or is approved. |

## Alternatives considered (proposal history)

**Recommended for the stated small-lot V1 workflow: approve the narrowly described Automated Core scope adjustment.** It avoids inventing performance targets solely to complete a checklist and preserves already-defined contracts. The cost is explicit: responsiveness outside existing approved numerical protocols is not quantitatively qualified for this V1 release.

**Keep the current broader performance requirement:** leave all gates unchanged, then approve workloads, measurement boundaries, sampling, environment and thresholds for the missing complex families before any qualification run. Reuse FileUpload measurement patterns and existing consumer fixtures where suitable; their suitability must be demonstrated, not assumed. This provides stronger performance assurance but requires additional protocol and measurement work. The current state remains blocked for that requirement until such evidence exists; no arbitrary task count or per-component producer queue is implied.

Do not adopt the representative mobile lab's200ms operation proxy as a release SLA. Do not retroactively extend FileUpload's100/250/50ms contract to unrelated workloads. No new performance measurements were collected while preparing this decision.

## Enactment and stop

As enacted on 2026-09-15, the bounded documentation change adds this exception to the canonical Automated Core/quality contract and reconciles the September12/14 core-acceptance prerequisites, linking this explicit approval. Preserve the general and Full-profile requirements and all immutable historical reports. Existing machine enums, release ledger and validators are not changed until their separately scoped implementation is necessary and reviewed. Deferred results must stay visibly unqualified.

After reconciliation, resume only concrete remaining evidence gaps using existing tools. A later Full-profile claim or performance commitment still needs its own approved protocol and measurements. This decision is not permission to publish V1, mark the ledger qualified, merge/push, change versions/dependencies, launch remote workflows, alter containers/services/resources, start Blade or resume the old38-task loop.

Before approval, work stopped at this reviewable proposal. Enactment is documentation-only: the canonical specification prose now records this exception and the September12/14 prerequisites carry dated superseding notes, while no product, test, CI, machine enum, performance budget, baseline, ledger, validator or executable release check has been changed. The normative performance requirement is narrowed only as explicitly approved above.

## Evidence and review

Read-only OpenCode/GLM research and controller checks located the normative clauses and checked current Overlay/Tabs/DataTable contracts and existing runner ownership. The search was bounded; it is not a complete historical budget audit. Modal profile producers are existing behavioral surfaces, not proven ready-made performance observers. All raw sources, research transcript, guard and review records are in MAIN `.batuta/runs/v1-runtime-policy-20260915/`.

Independent OpenCode/GLM review returned3/3 DONE with no findings and an unchanged-tree guard. Controller checked cited paths, proposal links, exact normative clauses and source hashes. This validates the proposal’s accuracy and explicit boundaries; it was not maintainer approval at the time. Maintainer approval is now recorded in the [approval record](#approval-record). No tests, builds or benchmarks were run for this documentation-only decision.
