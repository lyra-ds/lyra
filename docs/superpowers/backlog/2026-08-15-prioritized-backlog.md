# Prioritized Delivery Backlog — 2026-08-15

## Evidence

The repository baseline is the source of truth. Its recorded `pnpm test` result
is green: styles has 69 tests, React has 665 tests, and Alpine has 268 tests.
No failing baseline gate selects a corrective delivery.

The prescribed unresolved-work search returned no matches:

```text
rtk rg -n "TODO|FIXME|TBD|not implemented" packages apps tools .github --glob '!**/dist/**' --glob '!**/node_modules/**'
exit status: 1 (no matches)
```

The baseline records current public versions `@lyra-ds/react` 0.4.2 and
`@lyra-ds/alpine` 0.5.0. The public adapter documentation states that Alpine
ports the exact React state machines and lists its bindings and controllable
state. The root-barrel inventory reports 74 React export declarations and
Alpine's two utility exports, `TIME_ZONE_PICKER_ZONES` and
`DEFAULT_LABELS, describeRecurrence`. This is inventory evidence, not a parity
claim: Alpine's default plugin and registered bindings remain explicit audit
inputs for `BKL-01`.

The latest 40 commits record Alpine adapter work leading up to the 0.5.0
release commit `b1d77b5e993804add2c14746f66974ec8c04bbc3` (2026-08-12,
`chore(release): version packages (#181)`), including
`fdbafe0a77adb5ab37d9e1b2d9735b2e0c8de774` (2026-08-10,
`feat(alpine): rótulo traduzível no time picker + chave de storage…`) and
`84a7112e44e9c192944a51718ce7ea06fd638295` (2026-08-11,
`fix(alpine): datas relativas nos testes de exceção do weekly-schedule…`).
These relevant adapter commits make Alpine the highest-churn supported adapter
surface in the available history.

Sources consulted: `docs/superpowers/backlog/2026-08-15-current-baseline.md`;
`docs/superpowers/specs/2026-08-15-sequential-delivery-cycle-design.md`;
`packages/react/README.md`; `packages/alpine/README.md`;
`apps/docs/lib/stacks.ts`; and the output of:

```text
rtk git log -40 --format='%H%x09%ad%x09%s' --date=short
rtk rg -n "TODO|FIXME|TBD|not implemented" packages apps tools .github --glob '!**/dist/**' --glob '!**/node_modules/**'
rtk rg -n "export \{.*\}|export function lyra" packages/react/src/index.ts packages/alpine/src/index.ts
```

## Candidates

| Identifier | User impact                                                                                                                                                                          | Evidence                                                                                                                                                                                                                                                                                                              | Scope                                                                                                                                                                                                                                                                                                                                 | Proof                                                                                                                                                                                                 | Exclusions                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| BKL-01     | Consumers of `@lyra-ds/alpine` need its registered component bindings, controllable state, labels, and root exports to remain compatible with the documented React-derived contract. | Baseline versions: Alpine 0.5.0 and React 0.4.2; Alpine README's exact-state-machine and public binding contract; root-barrel exports in `packages/alpine/src/index.ts`; adapter-related commits `fdbafe0a77adb5ab37d9e1b2d9735b2e0c8de774` (2026-08-10) and `84a7112e44e9c192944a51718ce7ea06fd638295` (2026-08-11). | Perform a public API compatibility audit of the highest-churn adapter surface: compare the documented Alpine registrations, bindings, controllable state, labels, and root exports against the relevant React contract; record a follow-up delivery plan for any demonstrated mismatch. This is read-only and makes no source change. | `pnpm --filter @lyra-ds/alpine run test`; `pnpm --filter @lyra-ds/react run test`; plus a documented comparison of `packages/alpine/src/index.ts`, the relevant adapter modules, and the two READMEs. | No Alpine implementation, React implementation, documentation-tab change, generated output, release, version change, or changeset is included. |

## Scoring

Priority = user impact (0–3) + release/accessibility risk (0–3) + automated
proof available now (0–2) + supported-surface reach (0–2).

| Identifier | User impact | Release/accessibility risk | Automated proof available now | Supported-surface reach | Arithmetic    | Priority |
| ---------- | ----------: | -------------------------: | ----------------------------: | ----------------------: | ------------- | -------: |
| BKL-01     |           2 |                          1 |                             2 |                       2 | 2 + 1 + 2 + 2 |        7 |

`BKL-01` is the sole candidate and therefore uniquely highest-ranked. It has
no existing failing gate, so it does not receive the failing-gate risk score.
Its existing package tests provide automated proof without a new test harness;
the explicit contract comparison remains manual evidence.

## Recommendation

BKL-01: Perform a public API compatibility audit of the highest-churn adapter
surface.

No observed defect, failed gate, or documented public-contract mismatch was
found in the allowed evidence. The selection therefore follows the required
fallback and keeps the next delivery bounded to producing evidence for, or
against, a future behavior change.

## Next Delivery Contract

- **Affected public package and consumer-facing behavior:** `@lyra-ds/alpine`
  0.5.0 is the audit target. Confirm that its public registrations, named
  bindings, controllable state, labels, and root exports match the documented
  contract derived from the relevant `@lyra-ds/react` 0.4.2 behavior.
- **React and Alpine parity:** React production code is not affected. React is
  the comparison contract only. Alpine parity is required as the object of the
  audit; no parity implementation begins in this block.
- **Documentation stacks:** no docs stack tab or example changes are required
  for the read-only audit. If a demonstrated mismatch becomes a delivery,
  select exactly one applicable documentation representation: `alpine` or
  `html`. Update `react` only if React behavior changes, and update the
  selected representation's examples according to `apps/docs/lib/stacks.ts`;
  do not add empty tabs.
- **Test-first files and focused commands:** no test-first production test file
  is required because this block changes no production behavior. Run
  `pnpm --filter @lyra-ds/alpine run test` and
  `pnpm --filter @lyra-ds/react run test` after recording the comparison;
  use existing focused component test files if an observed mismatch is planned
  for a subsequent block.
- **Applicable gates:** no SSR, Browser Mode, axe, build, or packaging gate is
  required to complete this read-only audit. A follow-up behavior change must
  select applicable existing SSR, Browser Mode, axe, build, and packaging
  gates before implementation.
- **Compatibility and release policy:** preserve every public contract. This
  audit changes no package behavior, so no changeset is expected. A later
  user-visible package correction requires a changeset under the delivery
  cycle's release policy.
- **Completion condition:** the block is complete when the audit records each
  compared public contract, cites its evidence, states whether a mismatch is
  demonstrated, and creates a bounded follow-up delivery plan only for a
  demonstrated mismatch. It does not start that capability.
