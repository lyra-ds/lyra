# Tabs ledger reference correction — 2026-09-14

Base `f535a07`. The explicitly scoped acceptance-record update changes exactly three leaf values for component id=tabs in `docs/superpowers/baselines/lyra-v1/program.json`: governingSpecification.path now points to the existing tracked `.batuta/specs/2026-09-10-tabs-owned-content-design.md`; its schema status is draft; implementationStatus is specified. The existing validator permits draft/specified and rejects draft/planned.

This conservative ledger mapping acknowledges authorship without claiming separate human API approval, implemented/qualified status, or final family qualification. The source contract remains controller-selected; it was not rewritten or superseded. Every other Tabs field and every other record is identical to base, including evidence, compatibility, migration paths, manual evidence and program release status. No runtime, test, validator, dependency, budget or immutable evidence change.

Controller verified normalized JSON against the base with only the three intended replacements, the referenced file's tracked identity and exact diff scope. Pinned frozen installation resolves the prior checkout's missing yaml prerequisite without changing dependencies or locks. `pnpm v1-release:check` PASS; scoped Prettier PASS; full profile `pnpm test` exit0/160.01s; diff hygiene PASS. No new tests were added for this metadata correction.

Routing: OpenCode/GLM-5.3-Flash low, one invocation33.08s, no implementation retry or escalation. Controller independently repeated the structural and executable checks; no cross-review required for a successful low-lane task. Raw brief, before-image, executor log, scope proof, exact command exits and final commit: MAIN `.batuta/runs/tabs-ledger-reference-20260914/`.

The bounded reference correction from gap5 is complete, following the separate Alpine typeahead delivery. Broader Tabs capability scope and final package/platform/media/runtime acceptance are not qualified by this metadata update. The old loop stays suspended; no remote, release or next lot was started.
