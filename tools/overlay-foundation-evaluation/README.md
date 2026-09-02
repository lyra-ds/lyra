# Overlay foundation evaluation

This directory contains the approved repository-owned evaluation harness. The
core plan validates manifests, verifies artifact and installation behavior, and
characterizes the incumbent Lyra packages. The modal wave runs a local
diagnostic for `OF-MODAL`; it does not select a foundation.

`pnpm overlay:evaluate:core:test` runs the core protocol tests.
`pnpm overlay:evaluate:check --manifest <path>` validates an explicit
prospective manifest without network access or installation.
`pnpm overlay:evaluate:incumbent --output <path>` builds and characterizes
the current clean Lyra revision into an explicit disposable output path.
`pnpm overlay:evaluate:modal:test` runs the modal harness tests without running
the live diagnostic.
`pnpm overlay:evaluate:modal:manifest --revision <full-sha> --incumbent <path> --output <path>`
creates an exact manifest outside the repository.
`pnpm overlay:evaluate:modal --manifest <absolute-path> --repository <absolute-path> --evidence <absolute-path>`
runs the strict modal entry point inside the pinned container.

The tracked manifest does not authorize production use, a dependency change,
or any release action. These commands do not produce a winner, score,
recommendation, or accepted ADR.

## Modal-wave scope

Candidate order is exactly `incumbent`, `radix`, `base-ui`, and `zag`. Each uses
the same 17 scenario records and assertions across these 15 behavioral cells:

- `chromium`, `firefox`, `webkit`
- `react-18`, `react-19`, `ssr`, `hydration`
- `keyboard-focus`, `axe-light`, `axe-dark`, `forced-colors`
- `reduced-motion`, `ltr`, `rtl`, `coarse-pointer`

The eight cells `bundle-standalone`, `bundle-composition`, `packed-esm`,
`packed-cjs`, `packed-types`, `consumer-vite`, `consumer-next`, and
`consumer-commonjs` remain owned by the later decision-evidence plan. This
modal wave must not write a result for them.

## Exact external artifacts

| Candidate | Package                     | Version      | Registry tarball                                                              | SHA-256                                                            | License | Repository                               |
| --------- | --------------------------- | ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- | ---------------------------------------- |
| Radix     | `@radix-ui/react-dialog`    | `1.1.23`     | `https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.23.tgz` | `fa3f7e8612eecfc7b889266c0a5f640463de7d534cd54c3aac6c644b6a8294d2` | `MIT`   | `https://github.com/radix-ui/primitives` |
| Base UI   | `@base-ui-components/react` | `1.0.0-rc.0` | `https://registry.npmjs.org/@base-ui-components/react/-/react-1.0.0-rc.0.tgz` | `fd48911d202eb7ae13e7d56888fff503f3e9037c5e4e7991536429fafd7d9931` | `MIT`   | `https://github.com/mui/base-ui`         |
| Zag       | `@zag-js/dialog`            | `1.43.3`     | `https://registry.npmjs.org/@zag-js/dialog/-/dialog-1.43.3.tgz`               | `637e7e8d214deddd0edc6cf183eb70480b9f862862024129e5e793225b5fc517` | `MIT`   | `https://github.com/chakra-ui/zag`       |
| Zag       | `@zag-js/react`             | `1.43.3`     | `https://registry.npmjs.org/@zag-js/react/-/react-1.43.3.tgz`                 | `cf435e6fe4857d04aa2037e33dadaf9ec283c3159a95dca3c81023883e7f3f5c` | `MIT`   | `https://github.com/chakra-ui/zag`       |

These identities are immutable for this wave. Installation is exact,
script-disabled, frozen, offline after fetch, and confined to owned temporary
roots; none of these packages enters the production dependency graph.

## Revision and evidence protocol

All implementation is committed before generating the manifest. That clean
pre-manifest revision is recorded as both `lyraRevision` and the incumbent
revision. The external manifest, repository bundle, external evidence, and
owned work directory live under one mode-`0700` root outside the checkout. The
tracked `candidates.json` is copied only from the manifest bytes already used by
the container. The bundle, manifest, and evidence remain preserved; only the
verified owned work directory is disposable.

Attempt 1 remains the effective result forever. A retry is a separate immutable
attempt and cannot replace it. Repository, policy, ownership, evidence,
unknown-classification, and cleanup failures are run-fatal; candidate product
failures are factual diagnostic output.

The browser command uses only the digest-pinned image
`mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`.
The checkout is cloned from the read-only bundle inside the container; the host
checkout is never mounted writable. With the five external paths bound to the
same clean revision, run:

```sh
node_root="$(mise where node@24.18.0)"
env UID="$(id -u)" GID="$(id -g)" \
  OVERLAY_NODE_ROOT="$node_root" \
  OVERLAY_INPUT_ROOT="$manifest_tmp" \
  OVERLAY_EVIDENCE_ROOT="$evidence_tmp" \
  OVERLAY_OWNED_WORK_ROOT="$work_tmp" \
  OVERLAY_EVALUATION_REVISION="$evaluation_revision" \
  docker compose -f tools/overlay-foundation-evaluation/compose.modal.yml run --rm modal
```

This evidence is local, diagnostic, and non-authoritative. It cannot approve a
remote workflow, production migration, foundation choice, publication, tag,
or release.

## Filesystem threat boundary

Hostile archives, pre-existing symlinks and path replacements, observed identity
or containment changes, and uncertain cleanup are in scope and MUST fail closed.
A non-cooperating same-UID process concurrently renaming already-open evidence
directories is out of scope.
The harness makes no namespace-isolation claim.
If this boundary changes, a Linux-native namespace/openat2 design MUST be
adopted before external candidates are executed.
