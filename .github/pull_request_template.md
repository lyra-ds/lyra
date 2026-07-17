## Summary

<!-- What does this PR change and why? Link any related issues. -->

## Checklist

- [ ] PR title follows the Conventional Commits format (e.g. `feat(react): ...`, `fix(styles): ...`)
- [ ] A changeset was added if any package under `packages/` is touched (`pnpm changeset`).
      **While Lyra is 0.x, a breaking change uses a `minor` changeset** — `major` is
      reserved for the deliberate 1.0 release (see VERSIONING.md).
- [ ] Documentation was updated if user-facing behavior changed.
- [ ] CI is green (lint, typecheck, test, build).
