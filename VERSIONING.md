# Versioning policy

Lyra DS follows [Semantic Versioning](https://semver.org/) with independent SemVer
for `@lyra-ds/styles`, `@lyra-ds/react`, and `@lyra-ds/alpine`. Each package
receives the smallest bump required by changes to its own public surface.
Unchanged packages retain their current versions.

## Coordinated shared-contract releases

Independent versions do not remove coordination. When a change affects a shared
CSS, markup, state, or behavior contract, every affected package releases in the
same documented release window. The release publishes one compatibility and
migration record, and each affected package receives the bump appropriate to its
own public surface.

The public [compatibility guide](./apps/docs/content/docs/en/guides/compatibility.mdx)
lists the tested Styles, React, and Alpine ranges. Independent versions do not
imply that every combination is compatible.

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

## Post-1.0 SemVer

After an individual package reaches `1.0.0`, its stable public contract follows
the approved component architecture:

- A **patch** preserves the stable public contract. It may contain compatible
  fixes, documentation, internal refactors, build or test changes, and dependency
  updates that preserve that contract.
- A **minor** may add backwards-compatible public APIs, states, components, or
  adapters, and may deprecate existing APIs.
- A **major** identifies a removal or incompatible change to a public source,
  type, export, required markup, CSS selector, token, DOM or ref target, state,
  event, behavior, SSR contract, or adapter support.

The Lyra v1.0 suite is declared only after all three packages independently
publish `1.0.0` and the public compatibility guide records their tested mutual
ranges. Later patch and minor versions may diverge; a future suite-wide breaking
program bumps only the packages whose own public contracts break.

The sibling `lyra-ds/blade` package keeps independent SemVer and release timing.
It has its own compatibility matrix and does not block the Lyra v1.0 suite.

## Declared public API surface

This versioning policy covers the following as the **public API** of Lyra DS.
A breaking change to any of these requires a breaking (minor, during `0.x`)
release:

1. **Component props** — the published `.d.ts` type contracts of `@lyra-ds/react`.
2. **`.lyra-*` class names** — the shared contract with CSS-only usage and future
   framework adapters.
3. **Design token names** — the CSS custom properties (e.g. `--brand`,
   `--brand-contrast`).
4. **Alpine behavior contracts** — documented plugin registration and component
   names, option and data types, state attributes, and custom events.
5. **Documented public export paths** — the documented entry points of Styles,
   React, and Alpine (for example the styles entry and its `./tokens/*` subpaths).
   This policy covers whichever export paths are documented as public at the time
   of a release.

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
