# Versioning policy (0.x)

Lyra DS follows [Semantic Versioning](https://semver.org/), with one deliberate
convention layered on top for the pre-1.0 period. Read this before publishing a
change or filing a changeset.

## Lockstep versioning

`@lyra-ds/styles` and `@lyra-ds/react` are versioned **in lockstep** — they always
share one "Lyra 0.x" version number. A release bumps both packages together, even
if only one of them changed. This keeps the CSS core and the React wrappers
provably compatible: any given `@lyra-ds/react` version targets the matching
`@lyra-ds/styles` version.

## The 0.x convention: 0.MINOR = breaking

While Lyra is on the `0.x` line, we interpret the version segments as follows:

- **`0.MINOR` (the minor segment) = breaking changes.** A bump from `0.3.x` to
  `0.4.0` may contain breaking changes.
- **`0.x.PATCH` (the patch segment) = additive features or fixes**, backwards
  compatible within the same minor.

This mirrors the spirit of SemVer for `0.x`, where the public API is still
considered unstable.

> **Tooling note.** Changesets has no dedicated `0.x` mode — a `major` changeset
> applied to `0.1.0` produces `1.0.0`, not `0.2.0`. The "breaking = minor" rule is
> therefore a **project convention, not something the tooling enforces**. When a
> change is breaking during `0.x`, file a **`minor`** changeset (not `major`). See
> [CONTRIBUTING.md](./CONTRIBUTING.md) for the changeset workflow. `major`
> changesets are **reserved for the deliberate 1.0 release**.

## Declared public API surface

This versioning policy covers the following as the **public API** of Lyra DS.
A breaking change to any of these requires a breaking (minor, during `0.x`)
release:

1. **Component props** — the published `.d.ts` type contracts of `@lyra-ds/react`.
2. **`.lyra-*` class names** — the shared contract with CSS-only usage and future
   framework adapters.
3. **Design token names** — the CSS custom properties (e.g. `--brand`,
   `--brand-contrast`).
4. **Documented public export paths** — the documented entry points of
   `@lyra-ds/styles` and `@lyra-ds/react` (for example the styles entry and its
   `./tokens/*` subpaths). The full per-component export map is finalized in
   Phase 3; this policy covers whichever export paths are documented as public at
   the time of a release.

### Explicitly NOT public API

The following are **not** covered by this policy and may change in any release
without a breaking bump:

- Internal DOM structure of components.
- Undocumented CSS classes.
- The file layout inside each package's `dist/`.

## Migration notes

Every breaking change ships with a **migration note in the changelog** describing
what changed and how to update. Changelogs are generated from changesets via
`@changesets/changelog-github`.
