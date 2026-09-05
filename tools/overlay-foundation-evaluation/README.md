# Overlay foundation evaluation

This directory contains the approved repository-owned evaluation harness. The
core plan validates manifests, verifies artifact and installation behavior, and
characterizes the incumbent Lyra packages. The modal wave runs a local
diagnostic for `OF-MODAL`. Wave 2 adds `OF-ANCHORED`, `OF-MENU`, and
`OF-TOOLTIP`; neither wave selects a foundation.

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

| Candidate | Package                         | Version      | Registry tarball                                                                            | SHA-256                                                            | License | Repository                               |
| --------- | ------------------------------- | ------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- | ---------------------------------------- |
| Radix     | `@radix-ui/react-dialog`        | `1.1.23`     | `https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.23.tgz`               | `fa3f7e8612eecfc7b889266c0a5f640463de7d534cd54c3aac6c644b6a8294d2` | `MIT`   | `https://github.com/radix-ui/primitives` |
| Base UI   | `@base-ui-components/react`     | `1.0.0-rc.0` | `https://registry.npmjs.org/@base-ui-components/react/-/react-1.0.0-rc.0.tgz`               | `fd48911d202eb7ae13e7d56888fff503f3e9037c5e4e7991536429fafd7d9931` | `MIT`   | `https://github.com/mui/base-ui`         |
| Zag       | `@zag-js/dialog`                | `1.43.3`     | `https://registry.npmjs.org/@zag-js/dialog/-/dialog-1.43.3.tgz`                             | `637e7e8d214deddd0edc6cf183eb70480b9f862862024129e5e793225b5fc517` | `MIT`   | `https://github.com/chakra-ui/zag`       |
| Zag       | `@zag-js/react`                 | `1.43.3`     | `https://registry.npmjs.org/@zag-js/react/-/react-1.43.3.tgz`                               | `cf435e6fe4857d04aa2037e33dadaf9ec283c3159a95dca3c81023883e7f3f5c` | `MIT`   | `https://github.com/chakra-ui/zag`       |
| `radix`   | `@radix-ui/react-popover`       | `1.1.23`     | `https://registry.npmjs.org/@radix-ui/react-popover/-/react-popover-1.1.23.tgz`             | `c003d54e1716f00bafc5b7ccd4f3f126ffeded2ada9ae4146c272d1cb463e639` | `MIT`   | `https://github.com/radix-ui/primitives` |
| `radix`   | `@radix-ui/react-dropdown-menu` | `2.1.24`     | `https://registry.npmjs.org/@radix-ui/react-dropdown-menu/-/react-dropdown-menu-2.1.24.tgz` | `611afe4ccb51032fa5bde4efeb247e466f21cbe6ea749eaa2fb698bed7e6d056` | `MIT`   | `https://github.com/radix-ui/primitives` |
| `radix`   | `@radix-ui/react-tooltip`       | `1.2.16`     | `https://registry.npmjs.org/@radix-ui/react-tooltip/-/react-tooltip-1.2.16.tgz`             | `694f4194eaa0631f12335328f614163705b591e76dcb90f1dcdbe3ba9cb455e0` | `MIT`   | `https://github.com/radix-ui/primitives` |
| `zag`     | `@zag-js/popover`               | `1.43.3`     | `https://registry.npmjs.org/@zag-js/popover/-/popover-1.43.3.tgz`                           | `b11dc92a737efa68cfe06407049fabbd6aa87563239022f84bf5cad00b6a7b48` | `MIT`   | `https://github.com/chakra-ui/zag`       |
| `zag`     | `@zag-js/menu`                  | `1.43.3`     | `https://registry.npmjs.org/@zag-js/menu/-/menu-1.43.3.tgz`                                 | `ca13d29ed055add22c9ea31c817be9fc2003ba2e309edf18ce5ffc3838cbe432` | `MIT`   | `https://github.com/chakra-ui/zag`       |
| `zag`     | `@zag-js/tooltip`               | `1.43.3`     | `https://registry.npmjs.org/@zag-js/tooltip/-/tooltip-1.43.3.tgz`                           | `de95ba7649557e433362d1b11abb38e99d361234aa6336da5d5f60ce4e4e5ace` | `MIT`   | `https://github.com/chakra-ui/zag`       |

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
The checkout is cloned from the read-only bundle into a fresh container-native
owned directory. This avoids Docker Desktop bind-mount ownership drift observed
after pnpm installation. The actual UID, repository owner and clean Git status
are checked after installation. An identity-verified trap removes only the
captured checkout directory; container teardown remains mandatory. Run the
complete Wave 2 setup and diagnostic with one command from a clean checkout:

```sh
env TMPDIR=/private/tmp mise exec node@24.18.0 -- pnpm overlay:evaluate:wave2:auto \
  --output /Volumes/Home/francisross/tmp-builds/lyra-wave2-diagnostic-unique
```

Choose a new absolute directory under an existing canonical parent outside the
checkout. Existing output, symlinked parents, extra arguments, dirty worktrees,
and toolchain drift fail closed. Linux operators choose their own canonical
persistent output path. No manual browser setup or upload is required.

The host command requires Docker Compose, pnpm 11.13.1, and Node 24.18.0. On
Darwin it creates an owned, never-started helper from official
`node:24.18.0-bookworm@sha256:5711a0d445a1af54af9589066c646df387d1831a608226f4cd694fc59e745059`,
copies only `/usr/local/bin/node`, and removes the captured helper ID in
`finally`. Linux copies its exact running Node binary. Both paths verify
version, architecture, SHA-256, selected PATH executable, and image Corepack
0.35.0 in the pinned browser image without network access. No host browser is
downloaded. The copied toolchain is mounted read-only at `/opt/node`.

Automation supplies `OVERLAY_NODE_ROOT`, `OVERLAY_INPUT_ROOT`,
`OVERLAY_EVIDENCE_ROOT`, `OVERLAY_OWNED_WORK_ROOT`, and
`OVERLAY_EVALUATION_REVISION`, together with the actual UID/GID. Corepack, pnpm,
XDG caches and temporary host builds live under owned work outside the checkout;
the root-install pnpm store is explicitly `/work/pnpm/store`;
HOME is unchanged. A unique Compose project isolates evaluator networking.
The evaluator has only the internal network; its proxy additionally has egress
and permits only literal `registry.npmjs.org:443` CONNECT. Actual direct-denial,
HTTPS success, and seven denied authorities are checked before candidate work.
Native input, clock, viewport and axe capabilities are preflighted before
candidate execution.

`report.json` retains the closed factual result and proxy counters, manifest and
bundle SHA-256 values, copied Node hash, and all preserved paths. `logs/` retains
every automation command's start, stdout, stderr and exit code.
`attempt-checksums.json` binds every immutable scenario attempt 1 to its SHA-256.
Execution counts distinguish completed tuples/underlying observations, core
unavailability, preparation failures and execution failures. An incomplete step
writes `failure.json`, returns nonzero and preserves available evidence. Teardown
addresses only the fresh Compose project and captured helper; only the verified
owned `work` descendant is removed. Input, evidence and logs remain external.

Before the first cumulative manifest is tracked, its final four-contract policy
assertion is intentionally RED against the old modal manifest. Other focused
checks precede the clean implementation commit. After a successful harness-level
diagnostic, copy the exact evaluated external bytes in a separate manifest-only
commit, then run every final gate without filtering. The manifest names its
clean evaluated pre-manifest revision, not its own commit.

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

## Anchored interaction wave

`pnpm overlay:evaluate:wave2:test` runs unit tests with injected Docker and
filesystem boundaries; ordinary tests never start Docker or the live diagnostic.
`pnpm overlay:evaluate:behavioral:manifest --revision <full-sha> --incumbent <path> --output <path>`
creates the cumulative four-contract manifest.
`pnpm overlay:evaluate:wave2 --manifest <absolute-path> --repository <absolute-path> --evidence <absolute-path>`
is the strict container entry point.

Wave 2 has 38 immutable scenarios: 11 anchored, 14 menu, and 13 tooltip. Each
contract covers the same 15 behavioral cells listed above through its exact
required-cell catalog. It writes 656 candidate/scenario/cell attempt records;
when all preparation and execution succeeds, those cover 668 underlying React
executions. Counts of unavailable tuples after core failure are coverage
accounting, not proof of execution. Attempt 1 remains effective even when a
later diagnostic retry passes. This command does not rerun modal scenarios;
the cumulative manifest includes `OF-MODAL` for reproducible subset validation.
The eight packaging/bundle cells remain later decision-evidence work.

The explicit 16ms frame in 16 nontimed anchored/menu scenarios is the observation
point for framework settlement, not a synchronous response-latency claim. Timed
menu and tooltip scenarios and SSR/hydration first-tree scenarios exclude that
settlement; literal 499/1, 299/1 and 99/1 boundaries retain their controlled clock.
The viewport control resizes the real layout and visual viewport together; it
does not certify independent pinch zoom, virtual keyboards or viewport offsets.
Native partial touch/cancel uses exact Playwright 1.62.1 private Firefox/WebKit
protocols with version/capability/receipt guards, and public Chromium CDP.
Chromium axe runs verified axe 4.13.0 in an isolated world over the same DOM;
its timers do not advance the candidate clock. SSR executes in a fresh owned
Node child and verifies disposal for every invocation; hydration checks preserve
the explicit SSR → focus → hydrate first-tree order.

Unavailable private coordinator, layer, or timer-purpose facts remain lack of
evidence. Candidate failures do not justify inventing specific product bugs,
unsupported menu variants, recommendations or production authorization.
