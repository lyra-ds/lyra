# Candidate evidence — source revision aae3e0e1e89ba2f642e5463038d5d3da7d35d4a0

Gates, source suites, the packed Alpine run, media screening and the native tap proofs were measured on 812e92f341decf6c9b51da47ee0a729f576ca74d, an earlier commit of the candidate branch whose three package archives are identical (same decompressed tar SHA-256) to the candidate source revision; only documentation, baseline and tooling files changed in between. The bundle budget report (with the ledger binding) and the FileUpload evidence were produced after the reference promotion under the tar-stream identity.

Artifact identity is the SHA-256 of the decompressed tar stream (`artifactSha256`), not of the `.tgz` bytes: the gzip header carries a platform byte, so the same archive hashes differently on macOS and Linux while its tar stream does not.

Raw producer output (logs, full Vitest JSON, screenshots) stays in the maintainer archive `.batuta/runs/v1-candidate-20260918/`; these files are the bounded, hash-bound summaries the program ledger references.

## Cell mapping

- `chromium`, `firefox`, `webkit`, `keyboard-focus`, `ltr`: `component-suites.json` (owned React/Alpine/Styles suites per component and engine; full per-package results in `browsers/`).
- `react-18`, `react-19`, `ssr`, `hydration`, `packed-esm`, `packed-cjs`, `packed-types`, `consumer-vite`, `consumer-next`, `consumer-commonjs`: `package-gates.md`.
- `bundle-standalone`, `bundle-composition`: `bundle-budgets.json` (72 standalone entries, five compositions, four CSS entries, ledger binding). Dialog has no standalone Size Limit entry of its own; its bytes are measured inside `@lyra-ds/react/create-workspace-dialog`, `drawer`/`bottom-sheet` share its modal core, and the `overlays` composition exercises it directly — a standalone Dialog budget is a post-1.0 follow-up, not a measured failure.
- `axe-light`, `axe-dark`, `forced-colors`, `reduced-motion`, `rtl`, `coarse-pointer`: `media-screening.json` (behavioral and axe screening over the 11 P1 fixtures; RTL and reduced-motion contracts are additionally asserted by the owned suites). Dropdown and Tooltip `coarse-pointer` bind their native tap proofs (`dropdown-native-tap.json`, `tooltip-native-tap.json`); the screening skips Tooltip under a coarse pointer by contract (no hover tooltip).
- Alpine adapters: `alpine-packed.json` (public suites against the extracted archive) is immutable evidence on every entry.

| Artifact                        | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `alpine-packed.json`            | `175db79b633bb0b84a380433946551ca75bf7694cefb21a41de60d391c806ca6` |
| `browsers/alpine-chromium.json` | `336481488751b958457795e62a3994425f1daea4208112ca2d8aeb86f55b56e9` |
| `browsers/alpine-firefox.json`  | `0f493707ee6d3bd67fdc97d52551dd7127d690e0fdb87d396cfa329fd1d16160` |
| `browsers/alpine-webkit.json`   | `e7721af5a239cd3e522c7fd5bb8b19dbfbab31af5dbf1daaa42cfb1f70636ba7` |
| `browsers/react-chromium.json`  | `80e0005c31e2db7423416c1afe178896583bb7fba3b3f8d42a37aa8baee91f53` |
| `browsers/react-firefox.json`   | `51a1e5cf0cf7202fabc559bbe6607db7977713e0de47dbb584afcbbb8fc8725f` |
| `browsers/react-webkit.json`    | `db9c73f8f53f8c4ed31c6eeec11240a4d04ca386bacaba9bded624468be76fbb` |
| `browsers/styles-chromium.json` | `09c181237038adfb2129d8575bb975adcaffe6f4adedec5ce5d56adef55cf97e` |
| `browsers/styles-firefox.json`  | `c028d01bb6ccc1cb73e4b6c1face071b7e86b8829384b9608bc2cd42894cce8e` |
| `browsers/styles-webkit.json`   | `b7afad7241de7845f1058894994e4511e4ff37817b9357a93a676034085cc99c` |
| `browsers/summary.json`         | `9feddb61c8e66777a8b454cd42533e51c9fec51fd0daff8a33797c0494751fd5` |
| `bundle-budgets.json`           | `d0f958f0d7dac007e6aab678d09e93b070656f1266e2477c5b9429921e9c4068` |
| `component-suites.json`         | `f74b0ebbcda97ad5d49c233d6ded5845f727abf0ba09a5dc73d63b69e360005b` |
| `dropdown-native-tap.json`      | `f5b81d0fba6e67ac39ba7516f101bb9e49f2bc50a7eaf9b170626a0a2db2316c` |
| `media-screening.json`          | `d93efdf6213e5b1380e216e09289be2bed4a64c2d64a17076c31364bf0ae0714` |
| `package-gates.md`              | `d46045dddc1b458fd09bc1dbdb6719483ccabfbdf016870a187946dcc2b3adea` |
| `tooltip-native-tap.json`       | `35e94596e1412de2baec50f93173bf35517b6360c2da9f9aa83328a996117595` |
