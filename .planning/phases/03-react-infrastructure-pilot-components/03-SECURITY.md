---
phase: 03
slug: react-infrastructure-pilot-components
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-20
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all 9 PLANs carried a `<threat_model>` block); verified retroactively at ASVS L1 (grep-depth) after execution.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → workspace | Third-party packages enter the build/dev environment at install time | Package tarballs, install scripts |
| consumer app → library API | Untrusted props/children/strings cross into the pilot components | `name`, `title`, `className`, `label`, `hint`, `error`, `value`, `children` |
| handoff/ (canonical design) → packages | Drift between canonical CSS/inventory and shipped code is the integrity surface | CSS declarations, icon inventory, vendored SVG path data |
| dist artifacts / packed tarball → consumers | Published output is the supply-chain surface consumers trust | ESM/CJS bundles, type declarations, tarball file set |
| CI config → release gates | Gate steps are the enforcement point; weakening them silently is the threat | Job/step definitions |
| page ↔ modal (Dialog) | Focus and scroll containment between background page and dialog | Focus, keyboard events, scroll lock |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-SC | Tampering | npm installs (root devDeps + lucide-react + fixture deps) | high | mitigate | Blocking-human package-legitimacy checkpoint (executed + approved for the six [SUS] packages); exact pins + `.npmrc save-exact`; `--frozen-lockfile` in CI; no postinstall scripts in the approved set | closed |
| T-03-01 | Tampering | exports map / packaging metadata | medium | mitigate | publint + attw (`--profile node16`) gates green (03-08); `files` allowlist limits tarball contents | closed |
| T-03-02 | Information disclosure | source maps in published dist | low | accept | Accepted: sourcemaps aid debugging of an MIT OSS library; no secrets exist in source | closed |
| T-03-03 | Tampering | parity allowlist scope creep | medium | mitigate | Exact-name `ADDITIVE_EXTENSIONS` enumeration (no wildcards); negative-proof test (03-02); decision-ID comments | closed |
| T-03-04 | Tampering | generated icon-registry drift | medium | mitigate | `generate.mjs --check` byte-diff + lucide-exports validation wired in CI (03-08); GENERATED banner; exact-count assertion; negative-drift proof | closed |
| T-03-05 | Tampering | vendored SVG path-data corruption | low | mitigate | Path data pinned as a literal, byte-compared to RESEARCH Pattern 3 (03-03); deterministic regeneration | closed |
| T-03-06 | Denial of service | `usePresence` wedge (dialog stuck mounted) | medium | mitigate | ~250ms `setTimeout` fallback alongside animation events (03-04); browser test asserts eventual unmount (03-07) | closed |
| T-03-07 | Elevation of privilege | focus escaping the modal to the page behind | medium | mitigate | Live focusable-query on portal subtree per keydown (`useFocusTrap`, 03-04) + `aria-modal`; keyboard suite asserts wrap both directions and no background focus (03-07) | closed |
| T-03-08 | Tampering | icon markup injection | medium | mitigate | Icons are React elements from lucide-react/`createLucideIcon`; no raw-HTML API (0 `dangerouslySetInnerHTML`/`innerHTML` in src) | closed |
| T-03-09 | Information disclosure | dev warning echoing consumer strings | low | mitigate | Warning goes to console only (never rendered) and is stripped from production via the `NODE_ENV` guard | closed |
| T-03-10 | Spoofing | prototype-chain lookup on registry (e.g. `name="constructor"`) | low | mitigate | `Object.hasOwn` guard before key access (`icon.tsx`) | closed |
| T-03-11 | Tampering | consumer-string rendering (Input) | low | mitigate | All strings render as React children (auto-escaped); no raw-HTML API | closed |
| T-03-12 | Information disclosure | error text exposure (Input) | low | accept | Accepted: error copy is consumer-owned and consumer-rendered by design (UI-SPEC) | closed |
| T-03-13 | Tampering | Dialog children content injection | low | mitigate | Children render as React nodes (auto-escaped); no raw-HTML API | closed |
| T-03-14 | Tampering | full icon set silently entering consumer bundles | high | mitigate | `size-limit` Icon entry measures lucide-react (ignore list is only `react`/`react-dom`); 7.5 kB budget with >10× margin to the full-set cost | closed |
| T-03-15 | Repudiation | gate steps removed/renamed, breaking the required-check contract | medium | mitigate | Steps live inside the four frozen job names; actionlint in CI; REQ-ID comments make removals visible in review | closed |
| T-03-16 | Tampering | runtime CDN reference reintroduced | high | mitigate | `tools/dist-scan/no-cdn-scan.mjs` dist-wide CDN-host scan wired as a CI build-job step; smoke fixtures re-assert independently (03-09); dist confirmed CDN-free | closed |
| T-03-17 | Elevation of privilege | malicious build-time scripts in fixture installs | medium | mitigate | Fixtures committed with exact pins; `npm install --no-audit --no-fund` of a local tarball + pinned registry deps only; no postinstall in the approved dep set | closed |
| T-03-18 | Tampering | tarball leaking source/config/test files | medium | mitigate | REQUIRED/FORBIDDEN allowlist check before install (03-09); `files` allowlist in `package.json` (03-01) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-02 | Source maps ship with the dist to aid debugging of an MIT OSS library; the source is public and contains no secrets, so the disclosure surface is nil | Francisross (project owner) | 2026-07-20 |
| AR-03-02 | T-03-12 | Input error text is consumer-owned copy, consumer-rendered by design per UI-SPEC; the library never sources or stores it | Francisross (project owner) | 2026-07-20 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-20 | 19 | 19 | 0 | gsd secure-phase (ASVS L1, grep-depth verification) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-20
