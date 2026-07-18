# Phase 2: Styles Package - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 2-Styles Package
**Areas discussed:** Layout & import granularity, CSS comment language, Brand fixtures, Parity source-of-truth

---

## Layout & import granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror handoff 1:1 + `./tokens/*` | Copy handoff structure, single `styles.css` entry, subpaths only for `./tokens/*` (STY-02). No per-component subpath. | ✓ |
| Also per-component subpaths | Expose `./components/button.css` etc. — bigger exports map, tree-shaking risk on CSS. | |
| Single flattened file | One `styles.css`, no separate `tokens/` — breaks STY-02. | |

**User's choice:** Mirror handoff 1:1 + `./tokens/*`
**Notes:** CSS is global cascade; fine-grained tree-shaking is the React package's concern. `compat-shadcn` stays a separate explicit subpath outside the entry.

---

## CSS comment language

| Option | Description | Selected |
|--------|-------------|----------|
| Translate to English | Align with EN governance (Phase 1 D-04) for a global npm audience. | |
| Keep pt-BR | Zero rework, preserves handoff voice. | |
| Strip comments | Leaner CSS; loses inline brand-contract docs. | ✓ |

**User's choice:** Strip comments
**Notes:** Ship readable token/class values without comment prose; keep only a minimal header banner (name + MIT). Implication surfaced and accepted: the brand-contract documentation currently inline in `brand.css` moves to the README `[data-brand]` example (single source), consistent with the Brand fixtures choice below.

---

## Brand fixtures (validation)

| Option | Description | Selected |
|--------|-------------|----------|
| Fixtures in tests + README example | Saturated `acme` brand exercised in Browser Mode (light+dark); documented `[data-brand]` block in README. No importable subpath. | ✓ |
| Ship example brand as subpath | Publish importable `./brands/acme.css`. | |
| Tests only, no public example | Internal validation only. | |

**User's choice:** Fixtures in tests + README example
**Notes:** Avoids implying an official Lyra brand; gives devs a copy-pasteable starting point.

---

## Parity source-of-truth (STY-06)

| Option | Description | Selected |
|--------|-------------|----------|
| `handoff/tokens/` canonical, exact match, tokens only | Value-for-value token diff vs `handoff/tokens/`; classes deferred. | |
| Tokens + `.lyra-*` class inventory | Also inventory component `.lyra-*` class names against `handoff/components/**`. | ✓ |
| Separate committed snapshot | Maintain a `tokens.lock` decoupled from handoff. | |

**User's choice:** Tokens + `.lyra-*` class inventory
**Notes:** `handoff/` stays canonical (compare directly, no separate lockfile). Static class-name inventory only — behavioral/emission parity remains Phase 3/4.

## Claude's Discretion

- Parity-script location/language and normalization mechanics
- Exports-map shape, `publishConfig`, `files` allowlist, header-banner text
- Fonts documented as peer install vs silent
- `compat-shadcn` subpath naming (`./compat-shadcn.css` vs `./compat/shadcn.css`)

## Deferred Ideas

- Per-component CSS subpaths (revisit only if a consumer demands it)
- Importable example-brand subpath / "starter brands" satellite
- Minified single-file dist (Lightning CSS)
- Component behavioral/class-emission parity (Phase 3/4)
