# Phase 3: React Infrastructure & Pilot Components - Pattern Map

**Mapped:** 2026-07-18
**Files analyzed:** 34 new/modified files
**Analogs found:** 24 / 34 (10 rely on RESEARCH.md verified patterns — greenfield for this repo)

Repo reality check: this is a 2-phase-old monorepo. There is **no existing TypeScript/React source anywhere** — the only shipped code is `packages/styles` (pure CSS), two zero-dep Node scripts in `tools/`, one Browser Mode test suite, and the CI workflow. The strongest analogs are therefore (a) the Phase 2 tooling scripts (which CONTEXT.md explicitly names as the patterns to extend: D-02 "same pattern as the Phase 2 parity script", D-27 "direct extension of the Phase 2 packed-artifact smoke test"), and (b) the handoff `.jsx`/`.d.ts` prototypes (the canonical contracts each pilot converts). Where no analog exists (tsup config, ESLint flat config, internal hooks), RESEARCH.md Patterns 1–7 carry verified excerpts — referenced below, not duplicated.

## File Classification

### New files

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `packages/react/src/button/button.tsx` | component | request-response (props→DOM) | `handoff/components/buttons/Button.jsx` + `Button.d.ts` | exact (canonical contract) |
| `packages/react/src/input/input.tsx` | component | CRUD (controlled value) | `handoff/components/forms/Input.jsx` + `Input.d.ts` | exact (canonical contract) |
| `packages/react/src/dialog/dialog.tsx` | component | event-driven (open/close, portal) | `handoff/components/feedback/Dialog.jsx` + `Dialog.d.ts` | exact (canonical contract) |
| `packages/react/src/icon/icon.tsx` | component | transform (name→svg) | `handoff/components/icons/Icon.jsx` + `Icon.d.ts` | exact (contract; rendering replaced per D-06) |
| `packages/react/src/icon/icon-registry.ts` | generated data module | transform | RESEARCH.md Pattern 3 (verified against lucide-react 1.25.0) | no repo analog |
| `packages/react/src/index.ts` + per-component `index.ts` | barrel | — | trivial (D-12 named re-exports) | no analog needed |
| `packages/react/src/internal/cx.ts` | utility | transform | `Button.jsx` lines 19-28 (filter(Boolean).join) | exact |
| `packages/react/src/internal/use-controllable-state.ts` | hook | CRUD | RESEARCH.md Pattern 7 row 2 | no repo analog |
| `packages/react/src/internal/use-focus-trap.ts` | hook | event-driven | RESEARCH.md Pattern 7 rows 3-4 (APG) | no repo analog |
| `packages/react/src/internal/use-presence.ts` | hook | event-driven | RESEARCH.md Pattern 7 row 5 + Pitfall 7 | no repo analog |
| `packages/react/src/internal/use-scroll-lock.ts` | hook | event-driven | RESEARCH.md Pattern 7 row 6 | no repo analog |
| `packages/react/src/internal/portal.tsx` | component (utility) | event-driven | RESEARCH.md Pattern 7 row 7 (SSR guard) | no repo analog |
| `packages/react/src/*/*.browser.test.tsx` (×4) | test (browser) | — | `packages/styles/tests/brand-theme.test.ts` | role-match (mechanism identical: CSS-in-test, light/dark toggling, real-browser reads) |
| `packages/react/src/*/*.ssr.test.ts` (×4) | test (node) | — | RESEARCH.md "SSR test shape" code example | no repo analog |
| `packages/react/package.json` (rewrite of placeholder) | config | — | `packages/styles/package.json` + RESEARCH.md Pattern 2 | role-match |
| `packages/react/tsconfig.json` | config | — | `tsconfig.base.json` (extends) | exact |
| `packages/react/tsup.config.ts` | config | — | RESEARCH.md Pattern 1 (verified vs tsup 8.5.1 docs) | no repo analog |
| `packages/react/vitest.config.ts` | config | — | `packages/styles/vitest.config.ts` | exact (browser block copies verbatim; adds `projects` split per RESEARCH Pattern 5) |
| `packages/react/CONVENTIONS.md` | docs | — | `tools/parity/parity.mjs` header comment style (contract-first prose); content from D-24 checklist | partial |
| `packages/react/LICENSE`, `README.md` | docs | — | `packages/styles/LICENSE`, `README.md` | exact |
| `tools/icon-registry/generate.mjs` | script (generator + CI gate) | file-I/O + batch | `tools/parity/parity.mjs` | exact (D-02 says "same pattern") |
| `tools/smoke/smoke.mjs` | script (CI gate) | file-I/O + batch | `tools/pack-smoke/pack-smoke.mjs` | exact (D-27 says "direct extension") |
| `tools/smoke/vite-app/*` (fixture) | config fixture | — | `tools/pack-smoke/fixture/*` | exact |
| `tools/smoke/next-app/*` (fixture) | config fixture | — | `tools/pack-smoke/fixture/*` (structure) + RESEARCH Pattern 6 step 6 (Next specifics) | role-match |
| `packages/react/eslint.config.*` (flat config, CSS-import ban) | config | — | RESEARCH.md (Open Question 2 recommendation) | no repo analog |

### Modified files

| Modified File | What Changes | Pattern Source |
|---------------|--------------|----------------|
| `packages/styles/components/feedback/feedback.css` | additive `.lyra-dialog--closing` (+ overlay counterpart) and `.lyra-dialog__close` (D-18/D-19) | existing dialog block lines 66-119 + `.lyra-tag__remove` (display.css 76-88) |
| `tools/parity/parity.mjs` | additive-extensions allowlist (D-18) | its own `MASK_DIVERGENCE` allowlist, lines 80-95 + `classCheck()` lines 483-500 |
| `.github/workflows/ci.yml` | new STEPS in the four frozen jobs | its own Phase 2 step-comment convention |
| root `package.json` | new devDeps (exact pins) + no script changes needed (`-r --if-present` recursion) | existing devDeps block (save-exact style) |
| `pnpm-workspace.yaml` | none expected (`tools/*` + `packages/*` already globbed) | — |
| `CONTRIBUTING.md` | link to `packages/react/CONVENTIONS.md` (D-23) | existing doc |

## Pattern Assignments

### `tools/icon-registry/generate.mjs` (script, generator + `--check` drift gate)

**Analog:** `/home/franciscpd/Projects/lyra-ds/tools/parity/parity.mjs` — copy its skeleton wholesale.

**Header + path setup pattern** (parity.mjs lines 1-2, 66-78) — same shebang, doc-contract header, zero-dep ESM imports, repo-relative paths, pinned expected count:

```js
#!/usr/bin/env node
/**
 * @lyra-ds/styles — STY-06 parity validator (zero-dependency Node, ESM).
 * ...
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const HANDOFF = join(REPO, 'handoff');
const PKG = join(REPO, 'packages', 'styles');
// ...
const EXPECTED_TOKENS = 209;   // → for the generator: const EXPECTED_ICONS = 54;
```

**Error accumulation + exit pattern** (parity.mjs lines 97-98, 679-690) — collect all failures, print each with ✗, name the canonical source, exit non-zero:

```js
const errors = [];
const fail = (msg) => errors.push(msg);
// ... at the end:
if (errors.length) {
  console.error(`parity FAILED (${errors.length} issue${errors.length === 1 ? '' : 's'}) — handoff/ is canonical:\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`parity OK: ${tokenCount} tokens, ${classCount} classes, ...`);
process.exit(0);
```

**Recursive file walk** (parity.mjs lines 228-240, `listCss`) — reuse shape for walking `handoff/components/**` + `handoff/ui_kits/**` for `.jsx`/`.html` files:

```js
function listCss(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listCss(full));
    else if (name.endsWith('.css')) out.push(full);
  }
  return out;
}
const read = (p) => readFileSync(p, 'utf8');
```

**Generator-specific requirements** (no analog — from RESEARCH Pattern 3, verified):
- Scan regex scoped to `<Icon name="…"` — a bare `name="…"` grep yields 56 (picks up `<meta name="viewport">` and `name="plan"`); scoped yields exactly 54 `[VERIFIED: repo grep]`.
- kebab→Pascal: `trash-2` → `Trash2`, `chevrons-up-down` → `ChevronsUpDown`.
- `github` special-cased: emit a vendored `createLucideIcon('github', [...])` block (path data embedded in the generator; see RESEARCH Pattern 3 for the exact ISC path data from lucide-static@0.469.0) — `Github` does not exist in lucide-react 1.x.
- `--check` mode: regenerate in-memory, byte-diff against the committed `packages/react/src/icon/icon-registry.ts`, `process.exit(1)` on drift — same contract as `pnpm run parity`.
- Add root script alongside parity: root `package.json` scripts block already has `"parity": "node tools/parity/parity.mjs"` — mirror as `"icon-registry": "node tools/icon-registry/generate.mjs"` (or invoke directly in CI like pack-smoke).

---

### `tools/smoke/smoke.mjs` + `tools/smoke/vite-app/` + `tools/smoke/next-app/` (script + fixtures, CI gate)

**Analog:** `/home/franciscpd/Projects/lyra-ds/tools/pack-smoke/pack-smoke.mjs` + `/home/franciscpd/Projects/lyra-ds/tools/pack-smoke/fixture/` — extend, do not rewrite.

**Temp-dir lifecycle + die() cleanup** (pack-smoke.mjs lines 33-67) — the leak-proof failure path is load-bearing:

```js
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';

// `tmp` is created further below; `die` cleans it up before exiting because
// process.exit() terminates immediately and SKIPS the finally block ...
let tmp;
const die = (msg) => {
  console.error(`pack-smoke FAILED: ${msg}`);
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
};
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.error) die(`could not run ${cmd}: ${r.error.message}`);
  return r;
};
```

**Pack + tarball allowlist** (pack-smoke.mjs lines 74-115) — copy REQUIRED/FORBIDDEN shape; react's lists become `package/dist/`, `package/README.md`, `package/LICENSE` required; `package/src/`, `package/tsup.config.ts`, `package/vitest.config.ts`, tests, `package/node_modules/` forbidden:

```js
const REQUIRED = ['package/styles.css', 'package/tokens/', /* … */ 'package/LICENSE'];
const FORBIDDEN = ['package/tests/', 'package/vitest.config.ts', 'package/.stylelintrc.json', 'package/node_modules/'];

const pack = run('pnpm', ['pack', '--pack-destination', packDir], { cwd: STYLES });
// ...
const list = run('tar', ['-tzf', tarball]);
const entries = list.stdout.split('\n').filter(Boolean);
for (const req of REQUIRED) {
  if (!entries.some((e) => e === req || e.startsWith(req))) die(`tarball is missing required entry "${req}"`);
}
```

**KEY DIVERGENCE (RESEARCH Pattern 6 / Pitfall 6):** pack-smoke tar-extracts into `node_modules` (lines 117-126) because styles has zero deps. The react tarball has `lucide-react` as a real dependency — replace the extract step with a real install inside the temp fixture:

```js
// instead of tar -xzf + renameSync into node_modules:
const install = run('npm', ['install', '--no-audit', '--no-fund', tarball], { cwd: fixture });
```

**Pinned-binary resolution** (pack-smoke.mjs lines 133-141) — reuse for the vite fixture build (fixture has no vite of its own); next-app instead installs its own pinned `next@16.2.10` (fixture package.json dep):

```js
const require = createRequire(import.meta.url);
const vitePkg = require.resolve('vite/package.json');
const viteBin = join(dirname(vitePkg), require(vitePkg).bin.vite);
const build = run(process.execPath, [viteBin, 'build'], { cwd: fixture });
if (build.status !== 0) die(`vite build exited ${build.status}\n${build.stdout}\n${build.stderr}`);
```

**Fixture shape** (`tools/pack-smoke/fixture/`) — four committed files, each with a purpose comment; the vite config deliberately avoids importing `vite`:

```js
// vite.config.mjs — plain object, no `import ... from "vite"`:
export default {
  logLevel: 'silent',
  build: { outDir: 'dist', emptyOutDir: true, cssCodeSplit: false, rollupOptions: { input: 'main.js' } },
};
```

New fixture entries import the pilots via **subpaths** (RCT-03 proof) — mirror entry.css's "exercises three resolution paths" comment style: root barrel, `@lyra-ds/react/button` subpath, and a `tsc --noEmit` step in the fixture (types through the exports map). Emitted-output assertions follow pack-smoke lines 143-164 (walk dist, assert marker present / forbidden marker absent — e.g. `unpkg.com` must NOT appear; a non-imported component's class emission must NOT appear).

---

### `packages/react/src/button/button.tsx` (component, simple pilot)

**Analog:** `/home/franciscpd/Projects/lyra-ds/handoff/components/buttons/Button.jsx` (canonical DOM + classes) + `Button.d.ts` (canonical props).

**Class assembly + rest-spread + conditional children** (Button.jsx lines 7-37) — keep DOM and class strings byte-identical; this exact `filter(Boolean).join(' ')` becomes `cx()`:

```jsx
export function Button({
  variant = "primary", size = "md", iconLeft, iconRight,
  loading = false, disabled = false, full = false,
  className = "", children, ...rest
}) {
  const cls = [
    "lyra-btn",
    `lyra-btn--${variant}`,
    `lyra-btn--${size}`,
    loading && "lyra-btn--loading",
    full && "lyra-btn--full",
    className,                       // consumer className LAST (D-09)
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <span className="lyra-btn__spinner" aria-hidden="true"></span>}
      {iconLeft}
      {children != null && <span className="lyra-btn__label">{children}</span>}
      {iconRight}
    </button>
  );
}
```

**Props contract** (Button.d.ts lines 5-18) — translate JSDoc pt-BR→EN during conversion (established policy); the interface shape is final:

```ts
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "soft" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  full?: boolean;
}
```

**Conversion deltas (apply to ALL pilots):** wrap in `forwardRef<HTMLButtonElement, ButtonProps>` (D-08), use `cx()` from `internal/` (D-11), named export only (D-12), `style` shallow-merge where the component sets inline styles (D-09), JSDoc in EN.

---

### `packages/react/src/input/input.tsx` (component, form/controlled pilot)

**Analog:** `/home/franciscpd/Projects/lyra-ds/handoff/components/forms/Input.jsx` + `Input.d.ts`.

**Wrapper DOM + derived id + conditional field chrome** (Input.jsx lines 6-33) — preserve exactly; note ref must target the `<input>`, not the wrapper:

```jsx
export function Input({ label, hint, error, size, iconLeft, id, className = "", ...rest }) {
  const inputId = id || (label ? `lyra-in-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  const cls = [
    "lyra-input",
    size === "sm" && "lyra-input--sm",
    size === "lg" && "lyra-input--lg",
    error && "lyra-input--error",
    className,
  ].filter(Boolean).join(" ");
  const control = iconLeft ? (
    <span className="lyra-input-wrap">
      <span className="lyra-input-wrap__icon">{iconLeft}</span>
      <input id={inputId} className={cls} {...rest} />
    </span>
  ) : (
    <input id={inputId} className={cls} {...rest} />
  );
  if (!label && !hint && !error) return control;
  return (
    <div className="lyra-field">
      {label && <label className="lyra-label" htmlFor={inputId}>{label}</label>}
      {control}
      {error ? <span className="lyra-hint lyra-hint--error">{error}</span> : hint ? <span className="lyra-hint">{hint}</span> : null}
    </div>
  );
}
```

**Conversion deltas:** `useControllableState` wires `value`/`defaultValue`/`onChange` (D-14 — controlled iff `value !== undefined`); prefer `useId` over the label-derived id fallback ONLY as an addition (keep the `id` prop override; the derived-id behavior is observable API — planner should keep `id || label-derived` precedence and use `useId` when neither exists, or keep handoff behavior verbatim — flag for plan decision).

---

### `packages/react/src/dialog/dialog.tsx` (component, overlay pilot)

**Analog:** `/home/franciscpd/Projects/lyra-ds/handoff/components/feedback/Dialog.jsx` + `Dialog.d.ts`.

**Canonical DOM to preserve** (Dialog.jsx lines 6-27) — `.lyra-dialog-overlay > .lyra-dialog`, overlay-click via target identity, header/body/footer structure:

```jsx
export function Dialog({ open, onClose, title, footer, className = "", children, ...rest }) {
  if (!open) return null;
  return (
    <div
      className="lyra-dialog-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div className={["lyra-dialog", className].filter(Boolean).join(" ")} role="dialog" aria-modal="true" {...rest}>
        <div className="lyra-dialog__header">
          <h2 className="lyra-dialog__title">{title}</h2>
          {onClose && (
            <button type="button" className="lyra-tag__remove" style={{ width: 28, height: 28 }} aria-label="Fechar" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <div className="lyra-dialog__body">{children}</div>
        {footer && <div className="lyra-dialog__footer">{footer}</div>}
      </div>
    </div>
  );
}
```

**Conversion deltas (D-15…D-22):** replace `if (!open) return null` with `usePresence` (mounted-while-closing); render through `Portal` (`container` prop, default `document.body`, SSR guard); `useFocusTrap` on the panel ref **inside the portal subtree** (PITFALLS Pitfall 8); Esc + overlay + × each behind `closeOnEsc`/`closeOnOverlayClick` flags (default true); × button becomes `className="lyra-dialog__close"` with NO inline style and an EN `aria-label="Close"`; `aria-labelledby={useId()}` wired to the `<h2>`; `useScrollLock(open)`; focus restore on every close path.

---

### `packages/react/src/icon/icon.tsx` + `icon-registry.ts` (component + generated module)

**Analog (contract only):** `/home/franciscpd/Projects/lyra-ds/handoff/components/icons/Icon.d.ts`; the `.jsx` (span + CSS mask + unpkg CDN) is the pattern being **deleted** — keep only its accessibility contract (Icon.jsx lines 13-16):

```jsx
role={title ? "img" : undefined}
aria-label={title}
aria-hidden={title ? undefined : "true"}
```

and its prop surface/defaults (Icon.d.ts: `name` (→ narrowed to `IconName` union, D-04), `size?` default 20, `color?` default currentcolor, `title?`, `className?`, `style?`) plus the D-03 `icon?: LucideIcon` escape hatch.

**Rendering + registry:** copy RESEARCH.md Pattern 3 verbatim (verified against a real lucide-react@1.25.0 install): named barrel imports of the 53 existing icons, vendored `createLucideIcon('github', [...])`, `as const satisfies Record<string, LucideIcon>`, `export type IconName = keyof typeof iconRegistry`. Unknown-name dev warn pattern (D-05, CONTEXT "Specifics"):

```ts
if (process.env.NODE_ENV !== 'production') {
  console.warn(`[lyra-ds] Icon: unknown name "${name}". It is not in the curated registry — pass a lucide-react component via the \`icon\` prop instead.`);
}
return null;
```

---

### `packages/react/src/*/*.browser.test.tsx` (tests, Browser Mode)

**Analog:** `/home/franciscpd/Projects/lyra-ds/packages/styles/tests/brand-theme.test.ts` — the Phase 2 harness these tests extend (per CONTEXT "Reusable Assets").

**Entry-CSS-import-in-test pattern** (brand-theme.test.ts lines 1-7) — CSS loads in the TEST, never in src (RCT-03):

```ts
import { beforeAll, describe, expect, it } from 'vitest';
// Load the built entry CSS. Vite resolves styles.css's @import graph (...) and injects it
// as a <style> into document.head — this is the fixture's stylesheet.
import '../styles.css';   // react tests: import '@lyra-ds/styles' (workspace devDep) or relative '../../../styles/styles.css'
```

**Light/dark permutation toggling** (lines 86-94) — reuse for the smoke × theme matrix:

```ts
function setPermutation(theme: 'light' | 'dark', brand: 'none' | 'acme'): void {
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  // ...
  void root.offsetHeight;   // Force style recalc.
}
```

**Real-browser computed-style reads** (lines 96-98) — the assertion vocabulary for "CSS actually applied":

```ts
const bg = (name: string): RGB => parseColor(getComputedStyle(probe(name)).backgroundColor);
```

**React-specific additions (no repo analog — RESEARCH Pattern 5):** render via `vitest-browser-react`'s `render()` + locators; axe per fixture in light AND dark: `import axe from 'axe-core'; const results = await axe.run(container); expect(results.violations).toEqual([])`; Dialog keyboard suite asserts Tab-wrap, Esc, overlay-click, ×, and focus-restore on each path.

### `packages/react/src/*/*.ssr.test.ts` (tests, node project)

**No repo analog.** Copy RESEARCH.md "SSR test shape" example: `renderToString` from `react-dom/server`, assert string output; Dialog-with-`open` asserts portal renders null server-side.

---

### `packages/react/vitest.config.ts` (config)

**Analog:** `/home/franciscpd/Projects/lyra-ds/packages/styles/vitest.config.ts` — copy the browser block verbatim, wrap in `projects` (RESEARCH Pattern 5):

```ts
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],        // → react: per-project include globs
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

Also copy the config's comment discipline (WHY Browser Mode, fixture mechanism, CI prerequisite note about `playwright install chromium` ordering). The react version becomes two `test.projects` entries: `browser` (include `src/**/*.browser.test.tsx`, block above) and `ssr` (include `src/**/*.ssr.test.ts`, `environment: 'node'`). RESEARCH Open Question 1 recommends the package-level config (keeps the styles harness and root `pnpm -r --if-present run test` untouched).

### `packages/react/package.json` (config, rewrite of placeholder)

**Analogs:** `/home/franciscpd/Projects/lyra-ds/packages/styles/package.json` (repo conventions) + RESEARCH.md Pattern 2 (exports-map mechanics — split `.d.ts`/`.d.cts` per condition, attw-verified shape).

From styles/package.json, copy the conventions: `"license": "MIT"`, `"type": "module"`, `files` allowlist ending in `"README.md", "LICENSE"`, `"publishConfig": { "access": "public" }`, scripts named `test`/`lint*`. **Deltas:** `"sideEffects": false` (NOT the styles `["**/*.css"]` — safe only because zero CSS imports in src, the CI-enforced RCT-03 rule); drop `"private": true` and the placeholder description from the current 6-line file; add `peerDependencies` `react >=18 <20` / `react-dom >=18 <20`, `dependencies` `lucide-react` (exact pin), per-subpath exports map with `types` first in each condition block, top-level `main`/`module`/`types` fallbacks, and the `size-limit` array (RESEARCH Pattern 4 — `lucide-react` NOT in `ignore`).

### `packages/react/tsconfig.json` (config)

**Analog:** `/home/franciscpd/Projects/lyra-ds/tsconfig.base.json` — extend it, don't restate:

```jsonc
{
  "compilerOptions": {
    "strict": true, "target": "ES2022", "module": "ESNext",
    "moduleResolution": "bundler", "skipLibCheck": true,
    "isolatedModules": true, "forceConsistentCasingInFileNames": true, "noEmit": true
  }
}
```

React package adds: `"extends": "../../tsconfig.base.json"`, `"jsx": "react-jsx"`, `include: ["src"]`. Root `pnpm run typecheck` (`pnpm -r --if-present run typecheck`) picks up a package `typecheck: "tsc --noEmit"` script with zero root changes (the CI comment at ci.yml line 58 anticipates exactly this: "no-op until Phase 3 adds package scripts").

### `packages/react/tsup.config.ts` (config)

**No repo analog.** Copy RESEARCH.md Pattern 1 verbatim (object-form entries keyed to subpath names, `format: ['esm','cjs']`, `dts: true`, `external: ['react','react-dom','react/jsx-runtime']`, `banner: { js: '"use client";' }`). Pair with a build-job dist-grep verifying the banner survived (Pitfall 3).

---

## Shared Patterns

### Additive CSS extension (`.lyra-dialog--closing`, `.lyra-dialog__close`) — modifies `packages/styles/components/feedback/feedback.css`

**Source (visual to reproduce):** `.lyra-tag__remove` (`packages/styles/components/display/display.css` lines 76-88) + the prototype's inline 28px override (Dialog.jsx line 17) — merge into one class, 28px hit area / 14px icon:

```css
.lyra-tag__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px; height: 14px;      /* → .lyra-dialog__close: width: 28px; height: 28px */
  border: 0; padding: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-faint);
  cursor: pointer;
}
.lyra-tag__remove:hover { background: var(--surface-sunken); color: var(--text-primary); }
```

**Source (exit animation to reverse):** feedback.css lines 66-119 — entry animations are `lyra-fade-in` (overlay) and `lyra-pop-in` (panel):

```css
.lyra-dialog-overlay { /* ... */ animation: lyra-fade-in var(--duration-base) var(--ease-out); }
.lyra-dialog { /* ... */ animation: lyra-pop-in var(--duration-base) var(--ease-out); }
@keyframes lyra-fade-in { from { opacity: 0.6; } to { opacity: 1; } }
@keyframes lyra-pop-in {
  from { transform: scale(0.97) translateY(4px); }
  to { transform: scale(1) translateY(0); }
}
```

`.lyra-dialog--closing` plays the reverse of `lyra-pop-in` (exits MAY fade; the transform-only constraint applies to entries only). Follow the file's declaration style (tokens for duration/easing, shorthand `animation`).

### Parity-script allowlist (D-18) — modifies `tools/parity/parity.mjs`

**Pattern:** its own `MASK_DIVERGENCE` allowlist (lines 80-95) — a named, commented, exact-payload Map at the top of the file:

```js
// Intentional-divergence allowlist: ...
// The allowlist pins the EXACT canonical data: payload per file (...), so a truncated,
// malformed, or swapped chevron SVG fails parity instead of being waved through (WR-03).
const MASK_DIVERGENCE = new Map([
  ['components/forms/forms.css', { icon: 'chevron-down', payload: CHEVRON_DOWN_MASK }],
  // ...
]);
```

The new `ADDITIVE_EXTENSIONS` list follows the same discipline: enumerate the exact new class names (`.lyra-dialog--closing`, `.lyra-dialog__close`, any new keyframes) with a D-18/D-19 comment. Two check sites need it:
- `classCheck()` (lines 483-500): the "present in package but not in canonical handoff" branch (lines 495-498) must skip allowlisted classes; `EXPECTED_CLASSES = 248` stays a handoff-side count (unchanged).
- `diffFile()` / `placementCheck()` (lines 418-469): the "Extra declaration" branch (lines 431-436) must skip declarations whose selector chain is rooted in an allowlisted class/keyframe. Handoff declarations still match exactly (handoff ⊆ package).

### CI step additions — modifies `.github/workflows/ci.yml`

**Pattern:** Phase 2's own step convention — steps appended inside the four FROZEN jobs, each with a `# Phase N, REQ-ID:` comment, tools invoked via pinned lockfile deps (`pnpm exec`), never `dlx`/`npx` (ci.yml lines 90-97):

```yaml
      # Phase 2, STY-07: publint validates the exports map (...)
      # Invoked via the pinned lockfile devDep (pnpm exec), never floating dlx/npx.
      - run: pnpm exec publint packages/styles
      # Phase 2, STY-01/STY-02: packed-artifact smoke test — pnpm pack, install into a
      # throwaway fixture, real vite@8.1.5 consumer build, assert a .lyra-* class + a token.
      - run: node tools/pack-smoke/pack-smoke.mjs
      # future hooks (Phases 3-4, OSS-03): attw --pack, size-limit
```

Phase 3 steps (per RESEARCH "CI step additions", lines 604-617): lint job += react eslint; typecheck job unchanged (recursion picks up the new package script — comment at line 58 already reserves this); test job += `node tools/icon-registry/generate.mjs --check`; build job += publint(react), `attw --pack`, size-limit, `node tools/smoke/smoke.mjs`, `'use client'` dist grep, no-`unpkg.com` dist grep. Chromium install already precedes the test step (line 74) — no change needed for the react browser project.

### `cx()` utility — the one shared class-merge pattern

**Source:** the handoff's own inline idiom, repeated identically in Button.jsx (lines 19-28), Input.jsx (lines 8-16), Dialog.jsx (line 13): `[...].filter(Boolean).join(' ')` with consumer `className` last. `cx(...args) => args.filter(Boolean).join(' ')` extracts it once; every component calls `cx('lyra-x', cond && 'lyra-x--mod', className)`.

### Root devDeps addition — modifies root `package.json`

**Pattern:** existing devDependencies block (exact versions, alphabetized, `save-exact=true` already in npmrc). New entries per RESEARCH Installation block (tsup, @arethetypeswrong/cli, size-limit + preset, eslint stack, vitest-browser-react, axe-core, react/react-dom + @types). Note the six SUS-flagged fresh releases require one grouped human-verify checkpoint before install (RESEARCH legitimacy audit).

### Doc-contract header comments (all new tools/ scripts + configs)

Every Phase 2 artifact opens with a header explaining WHAT is proven, WHY the mechanism was chosen, and the failure contract (see parity.mjs lines 1-64, pack-smoke.mjs lines 1-31, vitest.config.ts lines 4-21). New scripts and configs must keep this discipline — it is the de facto repo convention.

## No Analog Found

Files with no close repo match (planner uses RESEARCH.md patterns instead):

| File | Role | Data Flow | Pattern Source |
|------|------|-----------|----------------|
| `packages/react/tsup.config.ts` | config | — | RESEARCH Pattern 1 (verified vs tsup 8.5.1) |
| `packages/react/src/icon/icon-registry.ts` | generated module | transform | RESEARCH Pattern 3 (verified vs lucide-react 1.25.0 local install) |
| `packages/react/src/internal/use-controllable-state.ts` | hook | CRUD | RESEARCH Pattern 7 row 2 |
| `packages/react/src/internal/use-focus-trap.ts` | hook | event-driven | RESEARCH Pattern 7 rows 3-4 + Pitfall 8 |
| `packages/react/src/internal/use-presence.ts` | hook | event-driven | RESEARCH Pattern 7 row 5 + Pitfall 7 (timeout fallback ~250ms) |
| `packages/react/src/internal/use-scroll-lock.ts` | hook | event-driven | RESEARCH Pattern 7 row 6 |
| `packages/react/src/internal/portal.tsx` | utility component | event-driven | RESEARCH Pattern 7 row 7 (mounted-state SSR guard) |
| `packages/react/src/*/*.ssr.test.ts` | test (node) | — | RESEARCH "SSR test shape" example |
| `packages/react/eslint.config.*` | config | — | RESEARCH Supporting table + Open Question 2 (flat config, `no-restricted-imports` `*.css`) |
| `tools/smoke/next-app` Next specifics (app/page.tsx, next.config) | fixture | — | RESEARCH Pattern 6 step 6 (App Router server page + client boundary for Dialog) |

## Metadata

**Analog search scope:** `tools/**`, `packages/**`, `.github/workflows/`, `handoff/components/{buttons,forms,feedback,icons}/`, root configs (`package.json`, `tsconfig.base.json`, `pnpm-workspace.yaml`)
**Files scanned:** ~25 (all non-handoff source in the repo — the repo is 2 phases old)
**Pattern extraction date:** 2026-07-18
