# Local review rules

Use this guide for local Claude and Codex reviews. Lyra is a CSS-first, white-label design system: `@lyra-ds/styles` owns appearance, while framework packages provide behavior. For project constraints and locked decisions, see [CLAUDE.md](../.claude/CLAUDE.md). Review `CONTRIBUTING.md` for contribution expectations and `VERSIONING.md` for release policy. Routine release commits (`chore(release)`) and generated or large inputs under `handoff/**` and `pnpm-lock.yaml` were excluded from the former bot reviews.

## 1. No Tailwind

**Scope:** `packages/**`, `apps/**`. The CSS-first and no-Tailwind decisions are in [CLAUDE.md](../.claude/CLAUDE.md#constraints). Review app chrome for ad-hoc CSS or utility classes in place of Lyra components and `.lyra-*` classes.

## 2. Design tokens are final

**Scope:** `packages/styles/**`. See [CLAUDE.md](../.claude/CLAUDE.md#constraints) for the locked fidelity rule. Changes to color, typography, spacing, radius, shadow, or state values need explicit justification against the design handoff.

## 3. Transform-only entry keyframes

**Scope:** `packages/styles/**`. See [CLAUDE.md](../.claude/CLAUDE.md#constraints): entry animations animate `transform` only and their initial frame must not set `opacity: 0`.

## 4. Opt-in shadcn compatibility

**Scope:** `packages/styles/**`. See [CLAUDE.md](../.claude/CLAUDE.md#constraints): `compat-shadcn.css` stays an opt-in subpath and is never imported by the main entry stylesheet.

## 5. Preserve styles CSS side effects

**Scope:** `packages/styles/package.json`. See [CLAUDE.md](../.claude/CLAUDE.md#lyra-dsstyles--css-package-no-build-step): CSS files must remain side-effectful; the styles package cannot declare `"sideEffects": false`.

## 6. Keep React wrappers thin

**Scope:** `packages/react/**`. See [CLAUDE.md](../.claude/CLAUDE.md#constraints) for the shared CSS architecture and [its React configuration](../.claude/CLAUDE.md#lyra-dsreact--tsup-config) for per-component entries and tree shaking. Review for inline appearance styles, CSS-in-JS, or imports that couple components. Public props and types must match the hand-written `.d.ts` contracts.

## 7. No runtime CDN dependency

**Scope:** `packages/react/**`, `packages/alpine/**`. See [CLAUDE.md](../.claude/CLAUDE.md#constraints) for the runtime rule and font peer dependencies. Icons use a local static Lucide name-to-component map; dynamic imports must not pull the complete icon set into consumer bundles.

## 8. Single-root Alpine templates

**Scope:** `packages/alpine/**`. Each `x-for` template renders exactly one root; use a `display: contents` wrapper when needed. Dispatch guarded custom events from the component root. For `select` options produced by `x-for`, bind `:selected` per option. Components revealed with `x-show` use the rAF-deferred `mounted` flag and `whenVisible` pattern. Blade components build on Alpine bindings rather than forming an independent stack.

## 9. Object syntax for Alpine classes

**Scope:** `packages/alpine/**`. Use object syntax for `:class` bindings: string syntax cannot remove classes already present in server-rendered markup.

## 10. Correct documentation stacks and locales

**Scope:** `apps/**`. Component pages keep the API inside `<StackTabs>` and show only manifest-supported stacks in canonical `react, html, alpine, blade` order. `html` and `alpine` are two states of one tab, never separate tabs. Every component has canonical HTML; only components with a binding show its Alpine state. Two or three tabs can be correct. Add user-facing strings to both `en` and `pt-BR`, and build site chrome from Lyra components.
