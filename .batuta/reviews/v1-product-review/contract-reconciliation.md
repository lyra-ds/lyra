# Tabs / Alpine Dropdown contract reconciliation — 2026-09-14

Read-only review at `d6bf3e4`, closing the applicability questions in coverage gap5. OpenCode/GLM-5.3-Flash research, one invocation, exit0/280.59s, unchanged-tree guard. Controller checked source clauses, handler ownership, tracked paths and the actual ledger validator. No runtime, canonical-ledger or historical-evidence changes.

## Tabs: authored contract, stale reference, qualification still separate

`docs/superpowers/baselines/lyra-v1/program.json:219` records null/not-authored and `implementationStatus: planned`. The tracked `.batuta/specs/2026-09-10-tabs-owned-content-design.md:3` is an authored, controller-selected contract with recorded technical reviews. Its explicit lack of a separate human API approval or final qualification must remain visible; it does not mean no design selection occurred.

The canonical ledger is a lifecycle record referencing immutable evidence, not itself proved immutable simply by its directory (`docs/superpowers/baselines/lyra-v1/README.md:12`; deliberate-release design:88). The earlier coverage report's phrase "immutable ledger" was too broad. Nevertheless `.batuta/profile.md:338` requires an explicitly scoped baseline update. This review changes only the current reconciliation record.

Smallest later canonical update: reference the existing tracked Tabs contract. A conservative schema representation is `governingSpecification.status: draft` with `implementationStatus: specified`, describing authored-but-not-release-qualified status without inventing human approval. This is a proposed mapping, not a retroactive statement that the selected implementation contract was unapproved. Do not add approved/implemented/qualified or evidence claims merely from source existence. Do not duplicate the specification or change validator policy.

Controller rejected the scout's path/status-only proposal: `tools/v1-release/check.mjs:171-178` permits draft:specified, not draft:planned. The tracked repository-relative `.batuta` path is supported by collectDocuments (:694-717). An attempted in-memory validator probe could not import the existing checker because this checkout lacks the yaml dependency; no validation PASS is claimed and no installation was performed. The eventual scoped edit must run the existing checker in an installed checkout.

The broader release design lists vertical/uncontrolled/manual Tabs capabilities (:126-138), while the later selected bounded contract explicitly retains horizontal controlled automatic activation (:6). This review identifies that scope difference but does not qualify the complete Tabs family or silently waive broader acceptance obligations.

## Alpine Dropdown: typeahead remains an unwaived implementation gap

The approved overlay specification scopes claimed Alpine surfaces (:9), applies OF-MENU to Dropdown (:327), requires localized case-insensitive printable-character matching, one wrap, a 500ms buffer and repeated-character cycling (:348-354), and explicitly requires lyraDropdown to meet the same anchored/menu scenarios (:500). These are applicable requirements, not an inference from React behavior.

`packages/alpine/src/dropdown.ts:182-206` handles ArrowDown/Up, Home/End, Escape and Tab; its item binding delegates to that handler (:256). No printable-character branch is present. Existing Alpine keyboard tests (:123-162) cover the implemented navigation; source inspection is not a runtime failure proof. The historical `.batuta/v1-dropdown-keyboard-brief.md:6` and verification concern React. No later Alpine typeahead exclusion was found in the bounded specs/plans/reviews and relevant Dropdown/Alpine records searched. Tooltip's explicit later CSS/Alpine preservation clause is specific to Tooltip and grants no Dropdown exception.

Disposition: record typeahead as open and required; do not claim Alpine menu parity. The next useful product task is a bounded native reproduction and fix in the existing Alpine Dropdown owner/tests. Reuse current public markup and command labels, preserve consumer key cancellation, no-match behavior, native Tab/Escape semantics and existing lifecycle cleanup. Prove prefix matching, cycling and expiry through meaningful existing-suite cases. Do not introduce new public item variants, a generic keyboard framework or an automatic test queue. Disabled semantics must follow the actual supported public markup; this review does not approve new disabled/submenu/check/radio APIs.

## Evidence and limits

Raw scout transcript/report, unchanged guard, cited-path checks, controller adjudication and failed probe: MAIN `.batuta/runs/contract-reconciliation-20260914/`. Search excluded dependencies, generated output, old raw logs and scout transcripts; a waiver hidden only there is not ruled out. No browser tests, builds, package installs or remote actions ran. This report resolves applicability and a proposed record correction; it does not deliver the Alpine behavior, update the canonical ledger or qualify V1.

## Implementation follow-up — 2026-09-14

The subsequently authorized Alpine typeahead slice is implemented and verified; see [delivery](alpine-dropdown-typeahead.md). The source-absence finding above describes this reconciliation's base revision. Tabs canonical record correction and broader family qualification remain separate.
