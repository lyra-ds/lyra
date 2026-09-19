# Candidate evidence — source revision cd282f198151a7901aad86ff837c4367e9f163cd

The candidate source revision is the squash commit that landed on `main` and was built and published by the Release workflow (PR #236). The branch commit `aae3e0e1e89ba2f642e5463038d5d3da7d35d4a0` on which the same evidence was first bound is not reachable from `main` after the squash merge, so the ledger binds the `main` commit instead; the three package archives are identical (same decompressed tar SHA-256) on both.

Gates, source suites, the packed Alpine run, media screening and the native tap proofs were measured on 812e92f341decf6c9b51da47ee0a729f576ca74d, an earlier commit of the candidate branch whose three package archives are identical to the published ones; only documentation, baseline and tooling files changed in between. The bundle budget report (with the ledger binding) and the FileUpload evidence were produced on the `main` commit itself.

Artifact identity is the SHA-256 of the decompressed tar stream (`artifactSha256`), not of the `.tgz` bytes: the gzip header carries a platform byte, so the same archive hashes differently on macOS and Linux while its tar stream does not. The tarballs downloaded from the npm registry after publication carry the same tar-stream hashes.

Raw producer output (logs, full Vitest JSON, screenshots) stays in the maintainer archive `.batuta/runs/v1-candidate-20260918/`; these files are the bounded, hash-bound summaries the program ledger references.

## Cell mapping

- `chromium`, `firefox`, `webkit`, `keyboard-focus`, `ltr`: `component-suites.json` (owned React/Alpine/Styles suites per component and engine; full per-package results in `browsers/`).
- `react-18`, `react-19`, `ssr`, `hydration`, `packed-esm`, `packed-cjs`, `packed-types`, `consumer-vite`, `consumer-next`, `consumer-commonjs`: `package-gates.md`.
- `bundle-standalone`, `bundle-composition`: `bundle-budgets.json` (72 standalone entries, five compositions, four CSS entries, ledger binding). Dialog has no standalone Size Limit entry of its own; its bytes are measured inside `@lyra-ds/react/create-workspace-dialog`, `drawer`/`bottom-sheet` share its modal core, and the `overlays` composition exercises it directly — a standalone Dialog budget is a post-1.0 follow-up, not a measured failure.
- `axe-light`, `axe-dark`, `forced-colors`, `reduced-motion`, `rtl`, `coarse-pointer`: `media-screening.json` (behavioral and axe screening over the 11 P1 fixtures; RTL and reduced-motion contracts are additionally asserted by the owned suites). Dropdown and Tooltip `coarse-pointer` bind their native tap proofs (`dropdown-native-tap.json`, `tooltip-native-tap.json`); the screening skips Tooltip under a coarse pointer by contract (no hover tooltip).
- Alpine adapters: `alpine-packed.json` (public suites against the extracted archive) is immutable evidence on every entry.

| Artifact                        | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `alpine-packed.json`            | `fb61928155f3b61f0917fc2232f80b9dbd59e2ec2f7889f678c8413eeaca964e` |
| `browsers/alpine-chromium.json` | `103a2b74040260bcc87ab0784b959dda89def917fb39be4fb6bd762d91b61b4c` |
| `browsers/alpine-firefox.json`  | `98e7e716a131d7281bb83ed956f155d3a8074c088a4a8ab873ae0b0cda587c00` |
| `browsers/alpine-webkit.json`   | `b8b7d167da1898582f6f395a93c96368c07325643f2cbd1f6e5fcf9c0f66d776` |
| `browsers/react-chromium.json`  | `bb2b0a89a6d2548b86de39ff53151a385e0a1aea44482d4e0204478fabf7ddcc` |
| `browsers/react-firefox.json`   | `b0df520d985a564a0eb582547a7129d6d9e778908ca5aebc11c27519fa4a7470` |
| `browsers/react-webkit.json`    | `cb2060c2659107e072a4085b18dcd1d6796c67e35125ea4991db97a2e52b809f` |
| `browsers/styles-chromium.json` | `28ac53b12e3a31e22a7b5c139e998555bd9da7dde798fa302f0e15cf0665b28b` |
| `browsers/styles-firefox.json`  | `f56d07cc9ea38ebf11e6af6cc4162c0083fbc6d6a9f5cd927bf56d99b4ece429` |
| `browsers/styles-webkit.json`   | `f6102d98dabd8301428967a606f13df2be546d84965b03e307b51d64f386c969` |
| `browsers/summary.json`         | `1172afd5a24b3af13d9229dd37459257f7accb3c712522c387ac975044b01961` |
| `bundle-budgets.json`           | `3c7233682c7f7353e052dfb5f7462e71a3106dad2bd3b3fbf58a96d2afe6b255` |
| `component-suites.json`         | `074b882d17f2ffd7836a2991d46e5b4735aa52d462ee35e9aac8430a4d490992` |
| `dropdown-native-tap.json`      | `466909775a72ba82e38edac4719c2aabc3597b077c52b98d22eff72759971e5f` |
| `media-screening.json`          | `61212ef741c6547606deec745ec320cdf352e73b9f7cde68648e5c09772ff90d` |
| `package-gates.md`              | `622c81e3a10e0bcc30b167ba8394b0265fc71ff2b8a3f72b5da641ae5fff636f` |
| `tooltip-native-tap.json`       | `e5c784d2d0d230fd2b5e8a39b8df0a700d17daae6e6efd5a4f1948a5be892314` |
