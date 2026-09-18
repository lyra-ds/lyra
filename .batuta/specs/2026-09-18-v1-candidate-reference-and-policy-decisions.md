# 1.0.0 candidate: bundle reference promotion and Data and Files status — maintainer decisions (2026-09-18)

**Status:** Approved by the maintainer on 2026-09-18 ("Aprovo as duas, pode seguir"), after the two blockers below were reported during the release-candidate plan (`.batuta/plans/v1-release-candidate.md`).

## Decision 1 — the immutable bundle reference moves to the 1.0.0 candidate

`docs/superpowers/baselines/lyra-v1/bundles.json` still identified `6b26a35` (React and Styles 0.4.2, Alpine 0.5.0). The FileUpload evidence producer (`pnpm evidence:file-upload`) compares the candidate against that reference with a 3000-byte Brotli ceiling per affected entry, and the Alpine adapter has grown 5618 bytes since the Core Beta within its approved 24200-byte absolute cap. The candidate could not produce a passing FileUpload comparison against the historical reference, and `tools/v1-release/check.mjs` requires a passing comparison bound to the candidate revision.

Decision: promote the reference to the release itself. The producer refuses to overwrite `bundles.json`/`bundles.md` (`refusing to overwrite immutable bundle baseline evidence`), so the promotion is two commits: retire the Core Beta files (`git rm`, they remain in Git history) and write the candidate measurement with `pnpm baseline:bundles --write` on the clean tree. The FileUpload evidence then runs on the next head and the accepted pointer moves to it. `tools/bundle-baseline/budgets.mjs` pins the accepted reference revision; it now names the candidate, and the one-time standalone and scenario exceptions approved on 2026-09-11/12/16/17 are removed because their deltas are realized in the reference (keeping them would grant the same headroom again on top of 1.0.0). The complex-or-composition entry list stays explicit so the 3000/1500-byte migration ceilings apply unchanged. From this commit on, `pnpm baseline:bundles --check-budgets` and the FileUpload comparison measure deltas against 1.0.0; the approved absolute caps and one-time migration exceptions in `tools/bundle-baseline/budgets.mjs` stay in force and become no-ops for the candidate. No numerical limit changed.

## Decision 2 — the Data and Files family may read `**Status:** Implemented`

`tools/v1-release/check.mjs` accepts a `qualified` DataTable only when `docs/superpowers/specs/2026-08-15-data-files-family-design.md` carries exactly `**Status:** Implemented`, while `tools/v1-core/check.mjs` accepted only `Approved` or `Implemented under Automated Core — FileUpload wave`. Both checks run in the CI lint job, so DataTable could not be qualified without contradicting one of them.

Decision: amend `tools/v1-core/check.mjs` so `**Status:** Implemented` is a second accepted promoted state, still requiring the exact passing Automated Core evidence that the FileUpload wave status requires; `tools/v1-core/check.test.mjs` covers acceptance with evidence, rejection without evidence and rejection of any other wording. No product, dependency or numerical change.

## Boundaries

Neither decision versions, merges the Version Packages PR or publishes. Publication remains the maintainer's merge of the candidate PR after CI passes on its exact head.
