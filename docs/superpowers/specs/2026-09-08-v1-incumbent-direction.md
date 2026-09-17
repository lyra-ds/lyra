# V1 incumbent stabilization decision

**Status:** Approved by the Lyra maintainer on 2026-09-08

## Decision

Retain the existing Lyra implementation for V1. Stabilize its concrete P1
contract gaps through bounded corrections using existing internal owners.
Completing comparisons with Radix, Base UI, or Zag is not a V1 prerequisite.
This is a scope decision, not a measured claim that Lyra outperforms them.

The maintainer approved this direction after comparative evaluation consumed
disproportionate effort and requested that Batuta update the release route.
Existing experimental code, manifests and raw evidence remain historical.
Do not merge the unmerged composed experiment into the stabilization branch,
install a candidate dependency, or restart comparative diagnostics under the
previous plan's authorization. A future substitution needs a new explicit
decision and its own evidence; it cannot be inferred from this update.

## Quality and scope remain binding

All eleven P1 entries, their observable contracts, and the twenty-three
`v1-interactive` acceptance cells remain in force. Keeping the incumbent does
not mark any entry implemented or qualified. The ledger remains in planning.
Existing public behavior may need focused corrections; a public API change
still needs its approved contract and English/Brazilian Portuguese migration
guidance. Tabs and DataTable contract work remains open. FileUpload is not
reopened and DataTable does not become an enterprise grid.

The exact release candidate still requires passing security, accessibility,
SSR/hydration, browser, bundle, types, packed-consumer and full CI evidence.
The release checker must eventually bind qualification to exact versioned
artifacts; its current planning validation is not a release-readiness verdict.
Missing or unavailable evidence stays pending. Existing manual evidence
policy remains `deferred-by-release-profile`, never a fabricated pass.

## Operator environment

Do not change any Colima configuration, including memory, CPUs, disk, VM or
runtime settings. Do not restore previous settings or restart Colima. Prior
resource approvals do not authorize changes under this direction. Do not stop
other projects to make room for verification. Use bounded sequential checks
within the existing environment; record an unavailable heavy gate and stop
that gate rather than modifying the environment or lowering acceptance.

## Delivery route

First record the current contract gaps from source, then reproduce one small
user-visible failure in an existing test. Correct only its owning behavior
and review it independently before the next gap. Do not preplan a replacement
framework or assume all eleven components need rewriting.

After overlay, Tabs and DataTable P1 work is closed: publish applicable
migration/compatibility guidance, qualify exact packed artifacts in consumers,
and prepare coordinated Styles/React/Alpine1.0.0 Changesets. Remote actions,
merge and npm publication retain their separate explicit operator checkpoints.

This decision supersedes only the earlier compulsory comparative-selection
sequence in the deliberate V1/overlay designs and historical evaluation plans.
It does not supersede their product-quality, evidence or compatibility gates.
