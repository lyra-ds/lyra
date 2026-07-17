# Pitfalls Research

**Domain:** Open source, CSS-first design system library (prototype → published npm packages: `@lyra-ds/styles` + `@lyra-ds/react`)
**Researched:** 2026-07-16
**Confidence:** MEDIUM (web research cross-checked against official docs — webpack, MDN, lucide.dev, changesets — plus documented library post-mortems; specifics verified for the exact stack in this project)

## Critical Pitfalls

### Pitfall 1: `sideEffects: false` silently deletes CSS in consumers' production builds

**What goes wrong:**
The handoff checklist says "sideEffects false" for tree-shaking. If any module in `@lyra-ds/react` ever does `import './x.css'` (or a consumer imports `@lyra-ds/styles` through a package marked `sideEffects: false`), webpack/Rspack drop the CSS import entirely in production. The app looks fine in dev, unstyled in prod. This is a documented, recurring failure (ng-select #1717, vue-loader #1435, webpack docs).

**Why it happens:**
CSS imports are side effects by definition — they export nothing. `sideEffects: false` tells the bundler every file is pure and removable when its exports are unused.

**How to avoid:**
- Lyra's architecture already protects itself: **keep all CSS in `@lyra-ds/styles` and never import CSS from `@lyra-ds/react` source files.** Then `sideEffects: false` on the React package is genuinely safe.
- In `@lyra-ds/styles`, set `"sideEffects": ["**/*.css"]` (or omit the field) so no bundler ever prunes it.
- Add a CI check (grep) that no `.tsx` in `packages/react` imports a `.css` file — this rule is easy to violate accidentally later.

**Warning signs:**
Any PR adding `import '...css'` inside `packages/react/src`; consumer bug reports "components render unstyled in production only."

**Phase to address:**
Package infrastructure / build setup phase (when `package.json` for both packages is authored).

---

### Pitfall 2: Broken `exports` map / dual ESM+CJS publish that type-checks but crashes at runtime

**What goes wrong:**
Classic failure modes: `require()` resolves to an ESM file (`ERR_REQUIRE_ESM`), `import` resolves to CJS and the default-export shape changes, `types` condition missing from one branch so TS "cannot find module" under `moduleResolution: bundler` vs `node16`, or relative imports without extensions in ESM output. Worse for a component library: if a consumer's app loads the package **twice** (once via `import`, once via `require` through a CJS dependency), React context and module-level state (e.g., a ToastStack registry) split into two instances and silently break.

**Why it happens:**
The exports map is hand-written, error-prone, and failures only appear in *specific consumer configurations* — your own build and tests pass.

**How to avoid:**
- Let tsup generate both formats with per-format `.d.ts`/`.d.cts`.
- Order conditions correctly (`types` first inside each condition block).
- **Run `npx publint` and `npx @arethetypeswrong/cli --pack .` in CI on every PR** — these two tools catch essentially all of these mistakes before publish.
- Test the packed tarball (`pnpm pack` + install into a scratch Vite app and a scratch Next.js app) before the first publish.
- For `@lyra-ds/styles`: the `"."` export points at a CSS file — verify bundlers accept it (some tooling expects a `default` condition; test `import '@lyra-ds/styles'` and `@import '@lyra-ds/styles'` in CSS) and that `./tokens/*` wildcard exports resolve.

**Warning signs:**
attw output showing "masquerading" cells; issues titled "cannot find module @lyra-ds/react" from Node16-resolution users; context/provider bugs only in mixed ESM/CJS apps.

**Phase to address:**
Package infrastructure phase (build config); verification in the pre-publish/release phase.

---

### Pitfall 3: String-name `<Icon name="..."/>` API pulls all 1,400+ Lucide icons into every bundle

**What goes wrong:**
The prototype's Icon uses CDN CSS masks (must go — locked constraint). The naive local replacement — a `name → component` lookup map over `lucide-react` — defeats tree-shaking: any static object referencing all icons bundles every icon (~500KB+ raw). Barrel imports (`import * as icons from 'lucide-react'`) do the same. This is the single most common bundle-size disaster in icon wrappers.

**Why it happens:**
Preserving the prototype's string-based API (`<Icon name="check"/>`) requires *some* runtime mapping, and tree-shaking cannot see through a dynamic `icons[name]` lookup.

**How to avoid:**
Decide the Icon API deliberately in the conversion phase; the viable options are:
1. **Curated registry**: `@lyra-ds/react` ships a fixed subset registry of only the icons the DS actually uses (the handoff screens use a bounded set), each imported directly (`lucide-react/icons/x` bypasses the barrel, ~0.5KB/icon). String API preserved; consumers needing arbitrary icons pass a component: `<Icon icon={Camera}/>`.
2. **Component-prop API only**: drop string names; `<Icon icon={Check}/>`. Perfect tree-shaking, but diverges from the handoff `.d.ts` contract — needs an explicit decision because the `.d.ts` files are the API contract.
Whichever is chosen, add a **bundle-size check in CI** (e.g., size-limit) asserting that importing `Button` + `Icon` stays under a threshold.

**Warning signs:**
`import * from 'lucide-react'` or a module-level object literal listing many icons; size-limit CI failing; first bundle analysis showing lucide as the largest chunk.

**Phase to address:**
Component conversion phase (Icon is called out in the handoff as requiring real design work) — do it early, since 39 other components consume Icon.

---

### Pitfall 4: Pixel-fidelity drift during prototype → library conversion, with no baseline to detect it

**What goes wrong:**
The `.lyra-*` classes and tokens are the public API and the fidelity contract. During conversion (Babel-standalone JSX → tsup TS, in-place rendering → portals, CDN icon → local icon), small drifts creep in: a class renamed "for cleanliness," a wrapper `div` added for the portal that changes stacking/spacing, default props diverging from the `.d.ts`, dark-theme selectors reordered. Visual regression testing was explicitly descoped, so nothing catches it — and once published, `.lyra-*` class changes are **breaking changes for future Vue/Svelte adapters and any CSS-only consumer**.

**Why it happens:**
"Recreate as a real library, don't copy files" invites well-intentioned refactoring; portals and SSR guards genuinely change DOM structure; 40 components × many states is too much surface to eyeball.

**How to avoid:**
- Treat `handoff/tokens/*.css` and the component CSS as **copy-verbatim, then patch minimally** — diff-able against source. Never hand-retype values.
- Write a token parity script: parse the 209 tokens from handoff vs `packages/styles/tokens` and fail CI on any mismatch (name or value).
- Write a class-name parity check per component: render each converted component in the smoke tests and assert the exact `.lyra-*` classes from the prototype appear.
- When portals change DOM position, keep the *element structure and classes inside the portal* identical to the prototype.
- Even without full visual regression, one cheap guard: render the 14 guideline specimens / a kitchen-sink page in the docs app and do a manual side-by-side pass against the handoff HTML as a UAT gate.

**Warning signs:**
PR diffs touching CSS files that were supposed to be verbatim; smoke test snapshots showing different class strings; "looks slightly off" reports on radius/spacing in dark theme.

**Phase to address:**
Styles package phase (token/CSS parity checks) and component conversion phase (class parity in smoke tests). The parity scripts should exist *before* mass conversion starts.

---

### Pitfall 5: A11y completion done as a checkbox, wrong pattern chosen (real focus vs `aria-activedescendant`), portals breaking the trap

**What goes wrong:**
The prototypes have basic a11y; the library must complete focus traps, `aria-activedescendant`, and focus restore. Common failures:
- **Combobox/CommandPalette**: moving DOM focus into the option list (breaks typeahead, confuses screen readers). Correct pattern: DOM focus stays on the input; `aria-activedescendant` on the *focused element* points to the active option's id. Putting the attribute on the listbox instead of the focused input is a frequent, silent mistake.
- **Dialog/Drawer via portal**: a naive Tab-key trap queries focusables inside the original React subtree, but the portal content lives elsewhere in the DOM; overlays under `document.body` also let focus escape to the page behind.
- **Focus restore**: closing via Escape restores focus, but closing via overlay click or an action button doesn't — because the trigger reference was captured in the wrong place.
- IDs for `aria-activedescendant`/`aria-controls` generated with counters collide or mismatch under SSR (use `useId`).

**Why it happens:**
Each widget follows a different APG pattern; implementing them generically ("one useFocusTrap for everything") misses per-pattern rules; portals invalidate DOM-order assumptions; axe-core does **not** catch focus-management bugs (it's static analysis — it will pass a dialog that never traps focus).

**How to avoid:**
- Implement against the **WAI-ARIA APG patterns by name** (Dialog Modal, Combobox with listbox popup, Menu button) rather than inventing behavior; the acceptance criteria per component should cite the APG keyboard table.
- The planned keyboard smoke tests (Combobox/CommandPalette/Dropdown) must include: Tab cycles inside open Dialog, Shift+Tab wraps, Escape closes and focus lands on trigger, arrow keys move `aria-activedescendant` while `document.activeElement` stays on the input.
- Know axe-core's limits: keep it for static ARIA/contrast issues, and cover focus behavior with jsdom/Playwright keyboard tests.
- Build focus trap + restore + scroll lock as **one shared internal utility** used by Dialog, Drawer, and CommandPalette so it's fixed in one place.

**Warning signs:**
Tests asserting `document.activeElement` moved into the listbox; axe passing while manual Tab testing escapes the dialog; hardcoded `id="lyra-option-1"` in components.

**Phase to address:**
Dedicated a11y hardening phase (or the overlay-components sub-phase) — after portal architecture is settled, before the docs site showcases the components. Flag this phase for deeper research (APG per-pattern specifics).

---

### Pitfall 6: SSR breakage — module-scope `document`, hydration mismatches, and missing `'use client'` in build output

**What goes wrong:**
Multiple prototype behaviors are SSR-hostile: the ⌘K global listener touches `document`, Dialog/Drawer/CommandPalette will use `createPortal(document.body)`, theme/screen persistence reads `localStorage`. Three distinct failure modes:
1. `window is not defined` crash at import time (module-scope access).
2. Hydration mismatch: branching on `typeof window` **in render** makes server HTML differ from first client render.
3. Next.js App Router users get "createContext/useState only works in Client Components" because the built output lost the `'use client'` directive (bundlers strip directives by default).

**Why it happens:**
Prototypes ran browser-only via Babel standalone; SSR was never exercised. tsup/esbuild remove `'use client'` unless configured.

**How to avoid:**
- Rule: browser APIs only inside `useEffect`/event handlers; portals render `null` until mounted (mounted-state pattern); ids via `useId`.
- Configure tsup to preserve/inject `'use client'` (banner or `esbuild` plugin) on the built entry — and verify it survives in `dist/`.
- Add an SSR smoke test to CI: `renderToString` every one of the 40 components (this catches module-scope `document` and most render-time branching instantly, and is nearly free to write).
- Docs site itself (likely SSR/SSG) becomes a live SSR test — but don't let it be the *only* one.

**Warning signs:**
Any top-level `const isMac = navigator...` in a component module; hydration warnings in the docs app console; GitHub issues from Next.js users right after launch.

**Phase to address:**
Component conversion phase (rules baked into the conversion checklist per component) + test phase (renderToString suite).

---

### Pitfall 7: `color-mix()` white-label derivations that fail contrast or grey out per brand

**What goes wrong:**
The white-label contract derives hover/active/soft/focus-ring/link colors from 4 brand tokens via `color-mix()`. Two failure modes: (1) mixing in `srgb` desaturates midpoints (soft backgrounds turn muddy grey for saturated brands); (2) derived states pass contrast for the default indigo but **fail WCAG for arbitrary brand colors** (e.g., a yellow or light-teal `--brand` makes `--brand-contrast` text unreadable on derived hover states). Since brands are consumer-supplied, the library can't fix it after the fact — but it can fail to *warn*.

**Why it happens:**
`color-mix()` guarantees a color, not a contrast ratio; the demo (`multibrand-demo.html`) proves 3 hand-picked brands, not the general case.

**How to avoid:**
- Keep the exact mix formulas from the handoff tokens (fidelity constraint) — but verify the color space used; if the handoff mixes in `srgb`, test saturated brands and document the behavior rather than silently changing formulas.
- Document the white-label contract with explicit constraints: recommended lightness/chroma range for `--brand`, requirement that the brand owner validates contrast, and a docs page showing how to check.
- Test the derivation chain with at least: default indigo, one dark brand, one light brand, in both light and dark themes (the multibrand demo is the fixture).
- `color-mix()` is Baseline in evergreen browsers — declare the browser support matrix in the README so "doesn't work in old Safari" issues are answerable by policy, not debate.

**Warning signs:**
Soft/hover tokens visually grey in the multibrand demo; contrast checker failures on `--brand-contrast` over derived hovers; no browsers-support statement in README at launch.

**Phase to address:**
Styles/tokens package phase (verification), docs phase (white-label guidance page).

---

### Pitfall 8: Release pipeline mistakes — wrong tarball contents, failed first scoped publish, forgotten changesets

**What goes wrong:**
Recurring changesets/npm failures for exactly this setup:
- First publish of `@lyra-ds/*` fails or publishes **private** without `"publishConfig": { "access": "public" }` (scoped packages default to restricted).
- Missing/wrong `files` field ships the whole workspace or omits `dist/`/`tokens/` — consumers install a broken package (changesets discussion #1440).
- Changesets' "Version Packages" PR blocked by branch protection (bot can't push) — releases silently stall.
- Contributors forget changeset files, so releases go out with empty changelogs or missed bumps.
- Mid-publish network failure with two packages leaves npm in a half-released state (styles published, react not).
- Long-lived `NPM_TOKEN` in secrets when npm **trusted publishing (OIDC)** is now the recommended path for public repos.

**Why it happens:**
Each failure only manifests at publish time, which happens rarely; the first release exercises every untested path at once.

**How to avoid:**
- Dry-run the entire pipeline before 0.1.0: `pnpm pack` both packages, inspect tarball contents (`tar -tf`), install into a scratch app.
- Set `publishConfig.access: public`, `files`, `repository` (+ `directory` per package) from day one.
- Decide **fixed vs independent versioning** for styles/react up front — for a DS where `.lyra-*` classes couple the two packages, *fixed* (lockstep) versioning avoids "react 0.3 needs styles 0.2" support pain. Document the choice in `.changeset/config.json`.
- Enable the changeset-bot + a CI check requiring a changeset on package-touching PRs.
- Use npm trusted publishing (OIDC) with provenance; grant the changesets action PR-creation permissions explicitly.

**Warning signs:**
`npm publish --dry-run` listing `handoff/` or `node_modules`; Version Packages PR never appearing; release workflow green but npm shows nothing.

**Phase to address:**
Release/CI phase — but `package.json` correctness (files/access/exports) belongs to the package infrastructure phase, verified again at release.

---

### Pitfall 9: 0.x semver ambiguity + OSS launch without breaking-change hygiene

**What goes wrong:**
At 0.x, semver technically promises nothing, and many projects abuse this ("0-based versioning") — every 0.x+1 may break consumers, changelogs don't distinguish breaking from additive, and early adopters churn. For a design system the public API is unusually broad: component props (the `.d.ts` contracts), **the `.lyra-*` class names**, token names, and CSS import paths. Renaming a token in 0.2.0 breaks white-label consumers with no signal. Separately, launching without governance signals (CONTRIBUTING, CoC, issue templates, support expectations) invites drive-by PRs that force API decisions prematurely.

**Why it happens:**
0.x feels like a free pass; maintainers underestimate that class names and token names are API, not implementation.

**How to avoid:**
- Adopt the common 0.x convention explicitly in the README: **0.MINOR is breaking, 0.x.PATCH is safe** — and enforce it via changesets (`minor` = breaking pre-1.0).
- Declare the API surface in writing: props per `.d.ts`, `.lyra-*` classes, token names, export paths. Anything else (internal DOM structure, private classes prefixed `lyra--internal` or similar) is explicitly non-API.
- Every release goes through changesets changelogs; breaking entries must include a migration line.
- Ship CONTRIBUTING.md + CoC + issue/PR templates at launch (already an active requirement) and state the roadmap (adapters, registry) so contributors don't re-litigate locked decisions (CSS-first, no Tailwind).

**Warning signs:**
A token rename merged as `patch`; PRs proposing Tailwind integration in week one with no locked-decisions doc to point at; changelog entries saying only "improvements."

**Phase to address:**
Governance/launch phase for docs and policy; the API-surface declaration belongs in the first package phase (it shapes what tests protect).

---

### Pitfall 10: Library CSS wins (or loses) specificity wars in consumer apps — no cascade strategy

**What goes wrong:**
`@lyra-ds/styles` ships global `.lyra-*` rules. In consumer apps these collide with resets, Tailwind preflight, or the consumer's own overrides. Two symmetric failures: library styles override consumer customizations (too specific), or a consumer's reset nukes library defaults (import order roulette — bundlers order CSS by first-import occurrence, which differs between dev and prod in Next.js). Post-publish fixes to specificity are breaking changes.

**Why it happens:**
Cascade behavior depends on the *consumer's* bundler and import order — invisible in the library's own dev environment.

**How to avoid:**
- Decide the cascade posture before 0.1.0. The modern answer is documenting (or offering) **`@layer` usage**: consumers can `@import '@lyra-ds/styles' layer(lyra);` to make every override trivially win. Caveat to document: unlayered consumer styles always beat layered ones — which is exactly the desired behavior for a DS.
- Keep selector specificity flat and low (single class where possible) — the handoff CSS mostly is; preserve that during any edits.
- Test consumption in a Tailwind-preflight app and a plain app as part of the pre-release scratch-app check.
- Document the recommended import order (tokens → styles → app CSS) with a "customizing" docs page.

**Warning signs:**
Component CSS with descendant chains 3+ deep or `!important`; "my button padding override doesn't apply" issues; styles differing between `next dev` and `next build`.

**Phase to address:**
Styles package phase (posture decision + docs), verified in pre-release consumer testing.

---

### Pitfall 11: Bilingual docs (EN + pt-BR) drift into two unequal sites

**What goes wrong:**
The handoff content is pt-BR; EN is new. Common bilingual-OSS failure: EN launches as a partial translation (or machine-translated), then every component doc change lands in one language only. Within months the locales disagree on props and examples — worse than one good language. Component reference pages are especially prone because they mix generated content (props tables from `.d.ts`, JSDoc currently **in pt-BR**) with authored prose.

**Why it happens:**
Translation is treated as a one-time task instead of a pipeline; the source of truth per content type is never declared.

**How to avoid:**
- Split content by kind: **generated** (props tables from `.d.t.s`, code examples from `.prompt.md`, llms.txt) vs **authored** (guides). Generated content should have one canonical source — which forces a decision: JSDoc stays pt-BR (EN props table needs translation layer) or JSDoc migrates to EN (docs translate to pt-BR). Decide this *before* the docs stack is chosen; it constrains the i18n approach.
- Pick a docs framework with first-class i18n routing and "missing translation falls back to default locale" behavior, so an untranslated page shows EN content rather than a 404.
- CI check or checklist item: component doc changes touch both locales (or the fallback covers it).
- English is the discovery language for OSS — make EN the default locale even though pt-BR content exists first.

**Warning signs:**
Locale pages hand-copied then edited separately; props tables written by hand instead of generated; `/pt-BR/` pages newer than `/en/` equivalents.

**Phase to address:**
Docs site phase — the JSDoc-language decision earlier, in the component conversion phase (it affects the `.d.ts` files).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hand-copying props tables into docs instead of generating from `.d.ts` | Docs ship faster | Docs drift from API; bilingual drift doubles; llms.txt disagrees with site | Never — generation is already a build requirement (llms.txt) |
| Skipping the packed-tarball scratch-app test ("CI is green") | Saves an hour pre-release | Broken 0.1.0 first impression; npm unpublish restrictions make cleanup ugly | Never for 0.1.0; acceptable for patch releases once pipeline is proven |
| Keeping FileUpload's simulated progress as the default behavior | Matches prototype demos | Users ship fake progress to production; API redesign later is breaking | Only as explicit opt-in demo prop (as handoff prescribes) |
| One shared `useFocusTrap` copy-pasted per component | Faster per component | Trap bugs fixed in one component recur in others | Never — single internal utility |
| Publishing with `main`/`module` fields only, no `exports` map | Simpler package.json | No deep-export control, broken Node16 TS resolution, can't do `./tokens/*` | Never — `./tokens/*` requirement forces exports map anyway |
| Deferring the token/class parity scripts until "after conversion" | Start converting sooner | Drift accumulates undetected across 40 components; retrofitting parity means re-auditing everything | Never — scripts are small, write first |
| Machine-translating pt-BR → EN docs for launch | Bilingual at launch | EN reads poorly to the primary OSS audience; erodes credibility | Draft acceptable if human-reviewed before launch |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| npm (scoped org) | First publish without `publishConfig.access: public` fails/publishes restricted | Set in both package.json files from day one; create npm org before release phase |
| npm provenance | Long-lived NPM_TOKEN secret | Trusted publishing (OIDC) + `--provenance` for public repo; badge signals supply-chain hygiene |
| changesets + GitHub Actions | Branch protection blocks the "Version Packages" PR; workflow can't trigger workflows | Bot bypass rule or fine-grained PAT; trigger deploys off `release published`, not tag push |
| lucide-react | `import * as icons` or full name→component map | Curated registry with per-icon imports (`lucide-react/icons/x`); component-prop escape hatch |
| @fontsource peer fonts | Bundling fonts into `@lyra-ds/styles` (license/weight bloat, duplicate loads) | Document as peer install exactly as handoff prescribes; docs app imports them itself |
| Vercel docs deploy | Serving `llms.txt` as a page route (HTML-wrapped) | Emit as static file at `/llms.txt` during build; verify `curl` returns `text/plain` |
| React 18/19 peer range | Pinning `react: ^18` blocks React 19 apps; or using APIs removed in 19 | `peerDependencies: react >=18`; note `forwardRef` still works but plan for ref-as-prop; test against 18 and 19 in CI matrix |
| pnpm workspaces | Docs app importing `packages/react/src` directly, masking broken `dist` builds | Docs app consumes built output via `workspace:*` so it exercises the real exports map |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Icon registry bundling all of Lucide | 500KB+ vendor chunk; slow docs site | Curated subset + size-limit CI gate | Immediately, for every consumer |
| Single monolithic styles.css only (no token/component granularity) | Consumers ship 40 components' CSS to use 2 | Keep `./tokens/*` exports; consider per-component CSS files as non-entry exports (already the source layout) | Matters for perf-sensitive consumers; decide before 1.0 since export paths are API |
| Entry animations on properties beyond transform | Paint/layout jank on low-end devices; violates locked animation rule | Lint/review rule: keyframes animate transform only, never `opacity: 0` start frame | Any consumer with many animated mounts |
| Docs live previews mounting all 40 components per page | Docs page TTI degrades | Lazy-mount previews per section/route | ~10+ previews per page |
| ToastStack/portal re-render storms | Whole-app re-renders on toast push | Keep toast state in isolated subtree/store, not app-level context re-render | Apps with frequent toasts |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Long-lived npm token in CI secrets | Token leak = malicious package published under `@lyra-ds` | npm trusted publishing (OIDC) + 2FA on npm org; provenance attestation |
| No `files` allowlist in package.json | Leaking handoff assets, scratch files, or env files into the tarball | `files: ["dist", "tokens", ...]` + tarball inspection in release checklist |
| Accepting drive-by dependency-adding PRs post-launch | Supply-chain surface growth in a zero-dependency-ish DS | CONTRIBUTING rule: new runtime deps require maintainer approval; `@lyra-ds/styles` stays zero-dep, react package keeps deps minimal (lucide only) |
| `dangerouslySetInnerHTML` for icon SVGs or code examples in docs | XSS in docs site or consumer apps | Icons as React components (lucide-react does this); syntax highlighting via safe libraries |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Docs showing only happy-path component usage | Developers misuse composition; Select vs Combobox confusion the handoff explicitly warns about | Per-component "when to use / when not to" (handoff already mandates the Select→Combobox guidance) |
| White-label docs without contrast guidance | Brands ship inaccessible themes and blame the DS | White-label page with the 4-token contract + contrast validation instructions + live multibrand demo |
| Installation docs assuming one bundler | "It doesn't work in Next/Remix/Vite" issues flood the tracker | Quickstart per environment (Vite, Next App Router with `'use client'` notes) validated in scratch apps |
| Error-less failure when CSS isn't imported | Blank unstyled components, no hint why | README + docs make the two-import contract (`@lyra-ds/styles` + component import) the first code block; consider a dev-mode console warning when `.lyra-*` computed styles are missing |
| ⌘K shortcut conflicting with consumer app shortcuts | Palette hijacks keys | Shortcut only registered when `onOpen` provided (prototype behavior) + documented opt-out |

## "Looks Done But Isn't" Checklist

- [ ] **Dialog/Drawer/CommandPalette:** renders and closes in demos — verify focus trap cycles, Escape closes, **focus returns to trigger**, body scroll locked, works inside a portal under `document.body`
- [ ] **Combobox/CommandPalette listbox:** arrows highlight options — verify DOM focus stays on input and `aria-activedescendant` (on the focused element) tracks the option id; `useId`-based ids
- [ ] **Icon:** renders locally — verify no CDN URL anywhere in dist, bundle contains only registry icons, `size` prop matches prototype rendering
- [ ] **npm packages:** `pnpm build` passes — verify `publint` + `attw --pack` clean, tarball contents correct, scratch Vite + Next installs work, `'use client'` present in dist
- [ ] **Tree-shaking:** sideEffects set — verify with a real bundle analysis that importing one component excludes the rest (and that styles package CSS is never pruned)
- [ ] **SSR:** docs site renders — verify `renderToString` passes for all 40 components and no hydration warnings in the docs app console
- [ ] **Theming:** dark theme toggles in demos — verify every component in `[data-theme="dark"]` AND `[data-brand]` combinations (multibrand demo as fixture)
- [ ] **Token parity:** styles package builds — verify all 209 tokens match handoff names+values via the parity script
- [ ] **FileUpload:** demo uploads work — verify the *real* API (`onFiles`, controlled `items`/`onChange`) is the primary path and simulation is opt-in
- [ ] **llms.txt:** file exists — verify it's regenerated from current `.d.ts` in the build (not a stale copy of the handoff file) and served as plain text at `/llms.txt`
- [ ] **Bilingual docs:** both locales navigable — verify component pages content-equivalent and untranslated pages fall back rather than 404
- [ ] **Release:** changesets configured — verify Version Packages PR actually opens on a test changeset and branch protection lets it merge

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Broken exports map / missing files in published 0.1.0 | MEDIUM | Publish 0.1.1 immediately (npm unpublish is restricted after 72h/downloads); `npm deprecate` the broken version with a pointer |
| CSS pruned by sideEffects at consumers | LOW–MEDIUM | Patch release fixing `sideEffects` array; pin known-bad versions in changelog |
| Icon API bundled all of Lucide | MEDIUM | Introduce registry in a minor; keep old API as deprecated re-export for one cycle; document migration |
| `.lyra-*` class drift discovered post-publish | HIGH | Restoring old names is itself breaking; publish compat CSS aliasing old→new classes, schedule removal at a declared version |
| Focus/a11y bugs reported post-launch | MEDIUM | Centralized trap utility means one fix propagates; add regression keyboard test per report |
| Bilingual docs drifted | MEDIUM | Declare EN canonical, regenerate pt-BR from it in one sweep, add the per-PR locale checklist that was skipped |
| Half-published release (styles out, react failed) | LOW | Re-run changesets publish (idempotent — skips already-published versions); verify both tags exist |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| sideEffects kills CSS (#1) | Package infrastructure | Bundle analysis in scratch app: CSS present in prod build; no CSS imports in react src (CI grep) |
| Broken exports/dual publish (#2) | Package infrastructure → Release | `publint` + `attw --pack` green in CI; scratch Vite+Next installs |
| Lucide full-bundle Icon (#3) | Component conversion (early — Icon first) | size-limit CI gate; bundle analysis shows only registry icons |
| Pixel-fidelity drift (#4) | Styles package + component conversion | Token parity script (209/209); class parity assertions in smoke tests; specimen side-by-side UAT |
| A11y wrong patterns (#5) | A11y hardening (flag: needs APG-level research) | Keyboard tests: trap cycle, Escape+restore, activedescendant semantics; axe for static issues |
| SSR breakage (#6) | Component conversion + testing | `renderToString` suite for all 40; `'use client'` in dist; no hydration warnings in docs |
| color-mix contrast per brand (#7) | Styles/tokens + docs | Multibrand fixture contrast audit; white-label docs page with constraints |
| Release pipeline failures (#8) | Release/CI | Dry-run pack + tarball inspection; test Version Packages PR end-to-end before 0.1.0 |
| 0.x semver / governance (#9) | Governance/launch (policy written at package phase) | README versioning policy; changeset-bot + CI changeset check; locked-decisions in CONTRIBUTING |
| Cascade/specificity wars (#10) | Styles package | `@layer` guidance documented; Tailwind-preflight scratch-app check |
| Bilingual drift (#11) | Docs site (JSDoc-language decision in conversion phase) | Generated props tables in both locales; locale fallback works; launch content parity review |

## Sources

- [webpack Tree Shaking guide (sideEffects semantics)](https://webpack.js.org/guides/tree-shaking/) — HIGH (official docs)
- [ng-select #1717: sideEffects:false drops imported styles](https://github.com/ng-select/ng-select/issues/1717), [vue-loader #1435](https://github.com/vuejs/vue-loader/issues/1435) — MEDIUM (documented issue reports)
- [Publishing dual ESM+CJS packages — Mayank](https://mayank.co/blog/dual-packages/), [Snyk: ESM+CJS compatible packages](https://snyk.io/blog/building-npm-package-compatible-with-esm-and-cjs-2024/), [exports map mistakes](https://dev.to/gabrielanhaia/the-packagejson-exports-map-is-the-most-important-file-youre-writing-wrong-5a0o) — MEDIUM (cross-checked practitioner sources; publint/attw are the verifying tools)
- [Lucide React official docs (tree-shaking, dynamicIconImports, per-icon imports)](https://lucide.dev/guide/packages/lucide-react) — HIGH (official docs)
- [Chrome Developers: CSS color-mix()](https://developer.chrome.com/docs/css-ui/css-color-mix), [color-mix for dynamic theming edge cases](https://www.edge-cases.com/css/css-color-mix-dynamic-theming), [Design Systems Collective: state tokens with color-mix](https://www.designsystemscollective.com/simplifying-state-tokens-with-color-mix-e0a8cd744296) — MEDIUM–HIGH
- [changesets GitHub repo + action](https://github.com/changesets/changesets), [changesets discussion #1440 (tarball contents)](https://github.com/changesets/changesets/discussions/1440), [Infinum handbook: Changesets](https://infinum.com/handbook/frontend/changesets) — MEDIUM–HIGH
- [MDN: aria-activedescendant](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant), [Sarah Higley: activedescendant is not focus](https://sarahmhigley.com/writing/activedescendant/), [CSS-Tricks on dialog focus](https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/) — HIGH (MDN) / MEDIUM
- [Fixing hydration mismatch errors in SSR](https://oneuptime.com/blog/post/2026-01-24-fix-hydration-mismatch-errors-ssr/view) — MEDIUM
- [CSS-Tricks: Cascade Layers guide](https://css-tricks.com/css-cascade-layers/), [Next.js CSS ordering issue #72846](https://github.com/vercel/next.js/issues/72846) — MEDIUM–HIGH
- [Hynek: SemVer will not save you](https://hynek.me/articles/semver-will-not-save-you/), [opentelemetry-js #4548: 0.x anti-pattern](https://github.com/open-telemetry/opentelemetry-js/issues/4548) — MEDIUM
- Design system failure post-mortems: [The dumbest design system mistakes](https://learn.thedesignsystem.guide/p/the-dumbest-design-system-mistakes), [The Dark Side of Design Systems](https://dev.to/eransakal/the-dark-side-of-design-systems-mistakes-missteps-and-lessons-learned-1onf), [My Five Biggest Design System Mistakes](https://medium.com/@subcide/my-five-biggest-design-system-mistakes-4725859926c2) — LOW–MEDIUM (opinion pieces, convergent themes)
- Project-internal: `handoff/design_handoff_lyra_lib/README.md` "Pontos que exigem decisão/trabalho real" — HIGH (canonical spec)

---
*Pitfalls research for: open source CSS-first design system library (Lyra DS)*
*Researched: 2026-07-16*
