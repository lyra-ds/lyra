# Candidate evidence — source revision f688716c16bf6f3f1584ae618f926d0376e65d44

Gates, source suites, the packed Alpine run, media screening and the native tap proofs were measured on 812e92f341decf6c9b51da47ee0a729f576ca74d, an earlier commit of the candidate branch whose three package archives are byte-identical (same SHA-256) to the candidate source revision; only documentation and baseline files changed in between. The bundle budget report (with the ledger binding) and the FileUpload evidence were produced after the reference promotion.

Raw producer output (logs, full Vitest JSON, screenshots) stays in the maintainer archive `.batuta/runs/v1-candidate-20260918/`; these files are the bounded, hash-bound summaries the program ledger references.

## Cell mapping

- `chromium`, `firefox`, `webkit`, `keyboard-focus`, `ltr`: `component-suites.json` (owned React/Alpine/Styles suites per component and engine; full per-package results in `browsers/`).
- `react-18`, `react-19`, `ssr`, `hydration`, `packed-esm`, `packed-cjs`, `packed-types`, `consumer-vite`, `consumer-next`, `consumer-commonjs`: `package-gates.md`.
- `bundle-standalone`, `bundle-composition`: `bundle-budgets.json` (72 standalone entries, five compositions, four CSS entries, ledger binding). Dialog has no standalone Size Limit entry of its own; its bytes are measured inside `@lyra-ds/react/create-workspace-dialog`, `drawer`/`bottom-sheet` share its modal core, and the `overlays` composition exercises it directly — a standalone Dialog budget is a post-1.0 follow-up, not a measured failure.
- `axe-light`, `axe-dark`, `forced-colors`, `reduced-motion`, `rtl`, `coarse-pointer`: `media-screening.json` (behavioral and axe screening over the 11 P1 fixtures; RTL and reduced-motion contracts are additionally asserted by the owned suites). Dropdown and Tooltip `coarse-pointer` bind their native tap proofs (`dropdown-native-tap.json`, `tooltip-native-tap.json`); the screening skips Tooltip under a coarse pointer by contract (no hover tooltip).
- Alpine adapters: `alpine-packed.json` (public suites against the extracted archive) is immutable evidence on every entry.

| Artifact                        | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `alpine-packed.json`            | `12afc6763a1898b41b392beb2cd41c5b1784b8d777996aa1fcbee9aefaa3df04` |
| `browsers/alpine-chromium.json` | `6bd8f130d8b4cd6afca4cc9d6a2294a39fcd5923f0dfbff2c928c5f9349d5da8` |
| `browsers/alpine-firefox.json`  | `1ace7f656245fee9f49bc814749bf0ccd6e53203a3e2a9dce9210e35c085bda6` |
| `browsers/alpine-webkit.json`   | `094717a81a9d3af3ede865ca06253824ecdefb15dc25e3b0166f1e8df14eab91` |
| `browsers/react-chromium.json`  | `ae0abb11efbfbe2d68895f1fbe3724c6af3dba3c6b12f72a34de89e64a3f07ff` |
| `browsers/react-firefox.json`   | `0a907cee43a93ffa4b5582e770ef7913b463cc02c2aa3c66fdafa537a065be17` |
| `browsers/react-webkit.json`    | `fb62c5575be1d6a95eee1d6f6888d89d2ed2fcf7fef320d60987ebe94211615e` |
| `browsers/styles-chromium.json` | `d8b0d8c75028078391b0f91ea5cd36a895b2cef354d47e7db34e18522ad58176` |
| `browsers/styles-firefox.json`  | `f50c797b22cef855b8d8bf61b10471a7082b8bb3c03e635511b38ad9f286fce6` |
| `browsers/styles-webkit.json`   | `50f83e5330b723c43d13ca6bf5e7e583565d37a5a681eb3225aa8db30b9dd745` |
| `browsers/summary.json`         | `a9aba032bee7a719c5a35d72ee01f80f82cf5781e082f8def5757c74da9c9d81` |
| `bundle-budgets.json`           | `8278fbe2cbab7287ce42a062b23feb33f91d585ddbbe20960e53ebb92e06420c` |
| `component-suites.json`         | `4d1c4fd83fbb4f0d5bcbe395360610fe85a494decf89fa89690ffb16284079bf` |
| `dropdown-native-tap.json`      | `fba18dee5c90d85267f1f543e0db54ab17565956060e6ecf29566ccfabd1ab7b` |
| `media-screening.json`          | `045063ad7d914d6ca93e3e7ed09ea43f67942f48446424d0b07fbe1c348d5491` |
| `package-gates.md`              | `37c45a3ca876ed563dd45f0b6bee7a79dabc05b514d3da435329180b6fee5683` |
| `tooltip-native-tap.json`       | `25ccd009a992ee7fee4ce6bf13236892de08e5e1abfe2a77194fa9cd71ce7a69` |
