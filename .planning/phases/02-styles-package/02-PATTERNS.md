# Phase 2: Styles Package - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 20 (8 token CSS + 7 component CSS + entry + compat subpath + package.json + parity script + stylelint config + README + ci.yml)
**Analogs found:** 18 / 20 (2 net-new artifacts have no in-repo analog: parity script, stylelint config)

> **Nature of this phase (read first):** This is a **copy-verify** phase. Almost every "new" file in `packages/styles/` is a byte-faithful copy of an existing handoff source file. Therefore the **primary analog for each file is its handoff source** — the pattern to copy is the file's exact bytes, minus the pt-BR comment prose (D-03), plus a minimal EN header banner. The parity script (STY-06) exists precisely to enforce that the copy stayed faithful. Only two artifacts (the parity script and the stylelint config) are genuinely new patterns with no in-repo analog.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/styles/tokens/base.css` | config (design token) | transform (copy-verify) | `handoff/tokens/base.css` | exact (source) |
| `packages/styles/tokens/colors.css` | config (design token) | transform (copy-verify) | `handoff/tokens/colors.css` | exact (source) |
| `packages/styles/tokens/typography.css` | config (design token) | transform (copy-verify) | `handoff/tokens/typography.css` | exact (source) |
| `packages/styles/tokens/spacing.css` | config (design token) | transform (copy-verify) | `handoff/tokens/spacing.css` | exact (source) |
| `packages/styles/tokens/effects.css` | config (design token) | transform (copy-verify) | `handoff/tokens/effects.css` | exact (source) |
| `packages/styles/tokens/brand.css` | config (white-label contract) | transform (copy-verify) | `handoff/tokens/brand.css` | exact (source) |
| `packages/styles/tokens/fonts.css` | config (peer-font stub) | transform (**intentional divergence**) | `handoff/tokens/fonts.css` | source, MODIFIED (strip CDN `@import`) |
| `packages/styles/tokens/compat-shadcn.css` | config (opt-in interop) | transform (copy-verify) | `handoff/tokens/compat-shadcn.css` | exact (source) |
| `packages/styles/components/buttons/buttons.css` | component (style layer) | transform (copy-verify) | `handoff/components/buttons/buttons.css` | exact (source) |
| `packages/styles/components/forms/forms.css` | component (style layer) | transform (copy-verify) | `handoff/components/forms/forms.css` | exact (source) |
| `packages/styles/components/display/display.css` | component (style layer) | transform (copy-verify) | `handoff/components/display/display.css` | exact (source) |
| `packages/styles/components/navigation/navigation.css` | component (style layer) | transform (copy-verify) | `handoff/components/navigation/navigation.css` | exact (source) |
| `packages/styles/components/feedback/feedback.css` | component (style layer) | transform (copy-verify) | `handoff/components/feedback/feedback.css` | exact (source) |
| `packages/styles/components/files/files.css` | component (style layer) | transform (copy-verify) | `handoff/components/files/files.css` | exact (source) |
| `packages/styles/components/data/data.css` | component (style layer) | transform (copy-verify) | `handoff/components/data/data.css` | exact (source) |
| `packages/styles/styles.css` | config (aggregate entry) | transform (`@import` chain) | `handoff/styles.css` | exact (source), MINUS compat-shadcn line |
| `packages/styles/compat-shadcn.css` (or `compat/shadcn.css`) | config (opt-in subpath entry) | transform | `handoff/tokens/compat-shadcn.css` | source-relocated |
| `packages/styles/package.json` | config (package manifest) | request-response (resolution) | `packages/react/package.json` (sibling placeholder) + root `package.json` conventions | role-match (needs full authoring) |
| `packages/styles/README.md` | config (docs) | — | `handoff/tokens/brand.css` comment block (content migrates here, D-03a) | content-source |
| `.github/workflows/ci.yml` | config (CI) | event-driven | existing `ci.yml` (add STEPS, never new jobs) | exact (extend in place) |
| `tools/parity/*` (parity script, STY-06) | utility (validator) | batch / transform | **none** — no analog in repo | no analog |
| `packages/styles/.stylelintrc*` (or root) | config (linter) | — | **none** — no lint config exists yet | no analog |

---

## Pattern Assignments

### Token CSS files (config, copy-verify) — the 8 `packages/styles/tokens/*.css`

**Analog / source of truth:** the identically-named file under `handoff/tokens/`. Copy the bytes verbatim; strip the pt-BR comment prose (D-03); prepend one minimal EN header banner.

**Current handoff header style to REPLACE** (`handoff/tokens/colors.css` lines 1-2 — pt-BR prose that D-03 strips):
```css
/* Lyra DS — color tokens
   Base scales + semantic aliases. Dark theme via [data-theme="dark"]. */
```

**Banner pattern to ADOPT instead** (D-03 / UI-SPEC "File header banner"; exact text is Claude's Discretion — minimal EN, package name + MIT):
```css
/* @lyra-ds/styles — <file purpose> · MIT */
```

**Token body pattern — copy exactly** (`handoff/tokens/spacing.css` lines 3-36 is the cleanest example; every `:root { --token: value; }` block is preserved value-for-value — this is the STY-06 parity target):
```css
:root {
  /* ---- spacing scale ---- */
  --space-0:  0;
  --space-1:  4px;
  /* … through --space-24: 96px; --radius-*; --control-*; --container-max etc. */
}
```
> Note: inline structural comments like `/* ---- spacing scale ---- */` and `/* default */` are grouping labels, not pt-BR prose. Planner should decide (Claude's Discretion) whether these thin labels stay; the *explanatory paragraph* blocks are what D-03 strips.

**Dark-theme override pattern — copy exactly** (STY-03; `handoff/tokens/colors.css` lines 100-138 and `handoff/tokens/effects.css` lines 27-32). The dark block re-assigns semantic tokens under `[data-theme="dark"]` with **no rebuild**. Preserve the elevation rule verbatim (`--shadow-xs: none; --shadow-sm: none;` in dark — deliberate contract, UI-SPEC line 117):
```css
[data-theme="dark"] {
  --shadow-xs: none;
  --shadow-sm: none;
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.5);
}
```

---

### `packages/styles/tokens/brand.css` (config, white-label contract) — STY-04

**Analog / source:** `handoff/tokens/brand.css`.

**Copy the derivation blocks verbatim** (`handoff/tokens/brand.css` lines 16-40 — the `[data-brand]` light group and the `[data-theme="dark"][data-brand]` dark group). This `color-mix(in oklab, …)` derivation is the STY-04 contract and must ship unchanged:
```css
[data-brand] {
  --accent:           var(--brand);
  --accent-hover:     color-mix(in oklab, var(--brand), black 12%);
  --accent-active:    color-mix(in oklab, var(--brand), black 22%);
  --accent-soft:      color-mix(in oklab, var(--brand) 12%, var(--surface-card));
  --accent-soft-text: color-mix(in oklab, var(--brand), var(--text-primary) 32%);
  --on-accent:        var(--brand-contrast, #FFFFFF);
  --focus-ring:       color-mix(in oklab, var(--brand) 24%, transparent);
  --text-link:        var(--accent);
  --border-accent:    var(--accent);
  --radius-md:        var(--brand-radius, 10px);
  --font-sans:        var(--brand-font, "Plus Jakarta Sans", system-ui, sans-serif);
  --font-display:     var(--brand-font, "Plus Jakarta Sans", system-ui, sans-serif);
}
```

**MIGRATE, don't ship** (D-03a): the pt-BR contract comment at `handoff/tokens/brand.css` lines 1-14 (the 4-token input table + usage example) must be **stripped from the shipped CSS** and rewritten in **English in `packages/styles/README.md`** as the canonical `[data-brand="acme"]` block. That README block is the single source of brand documentation.

---

### `packages/styles/tokens/fonts.css` (config, peer-font stub) — INTENTIONAL DIVERGENCE

**Analog / source:** `handoff/tokens/fonts.css` — but this is the **one file that must NOT be copied byte-faithfully**.

**The forbidden line to DROP** (`handoff/tokens/fonts.css` line 5 — runtime CDN dependency, banned by CLAUDE.md "nenhuma dependência de CDN em runtime"):
```css
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:…&family=JetBrains+Mono:…&display=swap");
```

**Ship instead:** an empty/comment-only stub documenting the `@fontsource/*` peer install (Claude's Discretion: empty file with EN banner, or a `@font-face`-free note). Carries **zero tokens** → exempt from the 209-token parity count (UI-SPEC line 41). The parity script must special-case `fonts.css` (no token assertions).

---

### Component CSS files (component, copy-verify) — the 7 `packages/styles/components/<category>/<name>.css`

**Layout fact (verified):** each category ships **one aggregate CSS file**, not per-component files. The 7 files are `buttons/buttons.css`, `forms/forms.css`, `display/display.css`, `navigation/navigation.css`, `feedback/feedback.css`, `files/files.css`, `data/data.css`. (`icons/` has **no** CSS — icons are React/Lucide, Phase 3; UI-SPEC line 26. Do not create `components/icons/`.)

**Analog / source:** the identically-pathed file under `handoff/components/<category>/`. Copy verbatim, strip pt-BR prose, add EN banner.

**Class-authoring pattern — copy exactly** (`handoff/components/buttons/buttons.css` lines 3-38; BEM-ish `.lyra-<block>` / `.lyra-<block>--<modifier>` referencing tokens):
```css
.lyra-btn {
  display: inline-flex;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-out), …;
}
.lyra-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.lyra-btn--primary { background: var(--accent); color: var(--on-accent); box-shadow: var(--shadow-xs); }
.lyra-btn--primary:hover:not(:disabled) { background: var(--accent-hover); }
```

**Class inventory the parity script must match** (D-06 — verified counts of unique `.lyra-*` class names in `handoff/components/**`):

| Category | Unique `.lyra-*` classes | Aggregate file |
|----------|--------------------------|----------------|
| buttons | 13 | `buttons/buttons.css` |
| forms | 29 | `forms/forms.css` |
| display | 34 | `display/display.css` |
| navigation | 72 | `navigation/navigation.css` |
| feedback | 40 | `feedback/feedback.css` |
| files | 44 | `files/files.css` |
| data | 16 | `data/data.css` |
| **total (deduped across all)** | **248** | — |

Parity extraction command the script can reuse: `grep -rho '\.lyra-[a-zA-Z0-9_-]*' handoff/components/**/*.css | sort -u` (canonical set) vs the same over `packages/styles/components/**`.

---

### `packages/styles/styles.css` (config, aggregate entry) — STY-01

**Analog / source:** `handoff/styles.css` (14 lines). Reproduce the `@import` order **exactly** (UI-SPEC lines 33-37 make the order a contract).

**Copy this chain verbatim** (`handoff/styles.css` lines 1-14):
```css
@import "./tokens/fonts.css";
@import "./tokens/colors.css";
@import "./tokens/typography.css";
@import "./tokens/spacing.css";
@import "./tokens/effects.css";
@import "./tokens/brand.css";
@import "./tokens/base.css";
@import "./components/buttons/buttons.css";
@import "./components/forms/forms.css";
@import "./components/display/display.css";
@import "./components/navigation/navigation.css";
@import "./components/feedback/feedback.css";
@import "./components/files/files.css";
@import "./components/data/data.css";
```
**Critical:** `handoff/styles.css` already **omits** `compat-shadcn.css` — good. The packaged entry must keep it out (STY-05, locked). The parity/import-order test asserts this omission.

---

### `packages/styles/compat-shadcn.css` (config, opt-in subpath) — STY-05

**Analog / source:** `handoff/tokens/compat-shadcn.css`. Relocated to a top-level subpath (`./compat-shadcn.css` or `./compat/shadcn.css` — pick cleaner exports entry at planning, D-02).

**Copy the mapping block verbatim** (`handoff/tokens/compat-shadcn.css` lines 8-28 — maps shadcn semantic vars → Lyra tokens under `:root, [data-theme="dark"]`):
```css
:root, [data-theme="dark"] {
  --background:  var(--surface-page);
  --foreground:  var(--text-primary);
  --primary:     var(--accent);
  --destructive: var(--danger);
  --ring:        var(--focus-ring);
  --radius:      var(--radius-md);
  /* …full map… */
}
```
**Never** `@import`ed by `styles.css`; reachable **only** via its explicit export entry.

---

### `packages/styles/package.json` (config, MODIFIED — full authoring)

**Analog:** the sibling placeholder `packages/react/package.json` (same current shape) shows the starting point; **root `package.json`** shows repo conventions (`packageManager`, `engines: node >=24 <25`, `private` flag semantics). The authoritative shape guidance is `.planning/research/PITFALLS.md` Pitfalls 1 & 2.

**Current placeholder to REPLACE** (`packages/styles/package.json` lines 1-6):
```json
{
  "name": "@lyra-ds/styles",
  "version": "0.0.0",
  "private": true,
  "description": "Lyra DS — tokens + component CSS, zero JS. Placeholder until Phase 2."
}
```

**Fields to author (patterns + hard rules):**
- **`"sideEffects": ["**/*.css"]`** — MANDATORY exact value (PITFALLS.md line 19; CLAUDE.md "What NOT to Use"). Never `false` — it silently drops the CSS import in consumer prod builds.
- **`"exports"` map** — `"."` → `"./styles.css"`; `"./tokens/*"` wildcard → `"./tokens/*"` (STY-02, D-02); one explicit compat entry (`"./compat-shadcn.css"` → `"./compat-shadcn.css"`). Do **not** add per-component subpaths (D-02, deferred). PITFALLS.md line 43: verify `"."` CSS export resolves for both `import '@lyra-ds/styles'` and `@import '@lyra-ds/styles'`.
- **`"files"` allowlist** — include `styles.css`, `tokens`, `components`, `compat-shadcn.css`, `README.md` (PITFALLS.md line 306 — prevents leaking handoff assets/scratch files).
- **Flip publishability** — remove `"private": true` per Phase-1 lockstep policy (CONTEXT "Reusable Assets"); add `"publishConfig"` (Claude's Discretion; PITFALLS notes provenance/access).
- **`"version"`** stays lockstep with the monorepo (Phase 1 D-06).

---

### `.github/workflows/ci.yml` (config, MODIFIED — add STEPS, never jobs)

**Analog:** the existing `ci.yml` itself. The header (lines 1-7) is a **FROZEN CONTRACT**: the four job names (`lint`, `typecheck`, `test`, `build`) are required-status-check contexts — **never add or rename jobs**; new gates land as STEPS inside these four.

**Pre-placed hooks to fill (exact lines):**
- `ci.yml` line 45 — `# future hook (Phase 2): stylelint on packages/styles` → add a stylelint step in the `lint` job.
- `ci.yml` line 70 — `# future hook (Phase 2, STY-06): token/class parity script` → add the parity-script run in the `test` job.
- `ci.yml` line 83 — `# future hooks (Phases 2-4, OSS-03): publint, attw --pack, size-limit` → add `publint` (STY-07) in the `build` job.

**Step pattern to copy** (existing steps use `pnpm run <script>` after `pnpm install --frozen-lockfile`, e.g. `ci.yml` line 35 `- run: pnpm run lint`). Prefer wiring new gates as root/package `package.json` scripts invoked by a one-line `pnpm run …` step (matches the existing style and keeps CI thin).

---

### `packages/styles/README.md` (config, docs — new)

**Content source (not a code analog):** the pt-BR comment block at `handoff/tokens/brand.css` lines 1-14 migrates here, rewritten in **English** (EN governance, D-03a) as: the 4-token contract table (`--brand` / `--brand-contrast` / `--brand-radius` / `--brand-font`) + a copy-pasteable `[data-brand="acme"]` example (teal, `--brand: #0D9488`) + the `@fontsource/*` peer-install note (UI-SPEC "Fonts peer note"). This README is the canonical brand + fonts documentation.

---

## Shared Patterns

### EN header banner (applies to ALL shipped `.css` files)
**Source rule:** CONTEXT D-03 / UI-SPEC "File header banner" line 150.
**Apply to:** all 8 token files, 7 component files, entry, compat subpath.
Strip the pt-BR explanatory comment blocks (e.g. `handoff/tokens/brand.css` lines 1-14, `handoff/tokens/compat-shadcn.css` lines 1-6, `handoff/tokens/fonts.css` lines 1-4); replace with one minimal EN line (package name + MIT). Exact text is Claude's Discretion.

### Token reference convention (applies to all component + semantic CSS)
**Source:** every handoff CSS file. Components reference tokens via `var(--token)` never hard-coded values; semantic tokens alias base scales via `var()` (`handoff/tokens/colors.css` lines 57-63). Preserve this indirection exactly — it is what makes `[data-theme="dark"]` and `[data-brand]` work without rebuild.

### Dark + brand permutation contract (applies to colors, effects, brand)
**Source:** `handoff/tokens/colors.css` line 100, `effects.css` line 27, `brand.css` lines 16 & 31.
**Apply to:** parity + Browser Mode test design. Every semantic token has a `[data-theme="dark"]` override; brand adds a `[data-brand]` (light) and `[data-theme="dark"][data-brand]` (dark) derivation layer. The `acme` teal fixture must assert `hover/active/soft/focus-ring` resolve via `color-mix` in both themes (STY-04, D-04).

### CI gate wiring convention (applies to every new quality gate this phase)
**Source:** `.github/workflows/ci.yml` header lines 1-7 + step style line 35.
**Apply to:** stylelint, parity, publint. New gates are STEPS in the four frozen jobs, ideally invoked as `pnpm run <script>`; never new jobs.

---

## No Analog Found

Files/artifacts with no in-repo precedent — planner should design from the cited spec, not copy an existing file:

| File | Role | Data Flow | Reason / Guidance |
|------|------|-----------|-------------------|
| `tools/parity/*` (token + class parity script, STY-06) | utility (validator) | batch/transform | No script exists anywhere in repo (`scripts/`, `tools/` are empty; `pnpm-workspace.yaml` reserves `tools/*` for Phase 5). Design fresh: plain Node script (Claude's Discretion re: location — `tools/` vs inline). Canonical inputs already proven above: `grep -rho '^\s*--[a-zA-Z0-9-]*:' handoff/tokens/{base,brand,colors,effects,spacing,typography}.css` for tokens (excludes `fonts.css` per divergence), `grep -rho '\.lyra-[a-zA-Z0-9_-]*' handoff/components/**/*.css` for the 248-class inventory. Normalize whitespace only; values must match exactly; emit an error naming the drifted token/class + `handoff/` as canonical (UI-SPEC line 148). Assert the "209" token count. |
| `packages/styles/.stylelintrc*` (or root) | config (linter) | — | No lint config exists (root `lint` script is `prettier --check` only). Stylelint 17.14.0 is the styles package's only automated quality gate besides Browser Mode (STACK.md). Design fresh; wire into the `lint` CI job (ci.yml line 45 hook). |

---

## Metadata

**Analog search scope:** `handoff/tokens/`, `handoff/components/**`, `handoff/styles.css`, `packages/styles/`, `packages/react/`, root `package.json`, `pnpm-workspace.yaml`, `.github/workflows/`, `scripts/`, `tools/`, `.planning/research/PITFALLS.md`, `.planning/REQUIREMENTS.md`.
**Files scanned:** ~30 (8 token sources, 7 component sources + tree, entry, 2 package.json, root config, CI, PITFALLS/REQUIREMENTS).
**Verified counts:** 248 unique `.lyra-*` classes across components; per-category breakdown table above; `fonts.css` = 0 tokens (CDN divergence).
**Pattern extraction date:** 2026-07-17
