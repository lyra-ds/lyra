---
"@lyra-ds/react": minor
---

Introduce `@lyra-ds/react` as a real dual-format (ESM + CJS) package with four
pilot components and the machinery Phase 4 repeats for the rest of the set:

- **Pilots:** `Button` (simple), `Input` (form / controlled), `Dialog`
  (overlay / focus-trap / portal), and `Icon` (curated registry) — thin wrappers
  over `@lyra-ds/styles` `.lyra-*` classes, named exports only, `forwardRef` on
  every DOM-rendering component.
- **Curated icon registry:** a committed, CI-drift-guarded 70-icon registry
  (69 `lucide-react` imports + a vendored `github` node) — no CDN, no full
  ~1,400-icon set in consumer bundles.
- **Root barrel + per-component subpaths** (`@lyra-ds/react` and
  `@lyra-ds/react/button`, …) with a split-types exports map validated by
  publint + attw; per-minimal-import `size-limit` budgets enforce component
  isolation and icon-registry containment.
- **Additive Dialog CSS** (`.lyra-dialog--closing`, `.lyra-dialog__close`) shipped
  from `@lyra-ds/styles` as documented parity-allowlisted extensions.

Versioned in lockstep with `@lyra-ds/styles` (pre-1.0 convention: `minor` is the
ceiling until the deliberate 1.0 release).
