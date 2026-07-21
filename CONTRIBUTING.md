# Contributing to Lyra DS

Thanks for your interest in contributing to Lyra DS. This guide covers local
setup, the changeset workflow, the decisions that are locked (so we do not
re-litigate them in every PR), the dependency policy, and our commit convention.

By participating, you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites and setup

Lyra DS is a pnpm monorepo.

- **Node.js 24** (the version pinned in [`.nvmrc`](./.nvmrc)). If you use `nvm`,
  run `nvm use`; otherwise install Node 24 by your preferred means. The repo sets
  `engine-strict=true`, so an older Node will refuse to install.
- **pnpm >= 11.13.** There are two supported ways to get it:
  - `corepack enable` — the built-in Node package-manager shim. Note that
    corepack no longer ships with every newer Node line, so this path may not be
    available on your install.
  - **Standalone install** — follow the
    [pnpm installation docs](https://pnpm.io/installation) if `corepack` is not
    present. The exact version is pinned via the `packageManager` field in the
    root `package.json`.

Then install and run the root scripts:

```bash
pnpm install          # install the whole workspace
pnpm lint             # prettier --check .
pnpm format           # prettier --write .
pnpm typecheck        # recursive, per-package (when packages define it)
pnpm test             # recursive, per-package (when packages define it)
pnpm build            # recursive, per-package (when packages define it)
```

## Changesets

Any PR that touches a published package (`@lyra-ds/styles` or `@lyra-ds/react`)
must include a **changeset** describing the change:

```bash
pnpm changeset
```

**Pre-1.0 bump convention:** while Lyra is on the `0.x` line, a **breaking change
is filed as a `minor` changeset**, not `major`. This is a project convention —
changesets has no `0.x` mode, and a `major` changeset would produce `1.0.0`.
`major` is reserved for the deliberate 1.0 release. The full rationale and the
declared public API surface live in [VERSIONING.md](./VERSIONING.md) — read it
before choosing a bump type.

The two packages are versioned in lockstep (see
[VERSIONING.md](./VERSIONING.md)).

## React component conventions

When adding or converting a component in `@lyra-ds/react`, follow the conversion
recipe in [`packages/react/CONVENTIONS.md`](./packages/react/CONVENTIONS.md) — the
actionable checklist (read the `.d.ts` → `forwardRef` → `cx` + merge →
rest-spread → JSDoc → test matrix → gates), the locked-decision table, and the map
from component type to the pilot test suite you copy.

## Locked decisions

These architectural decisions are **settled**. Please do not open PRs or issues to
re-litigate them; doing so wastes everyone's time. If you believe one genuinely
needs to change, open a discussion first and make the case explicitly.

- **CSS-first architecture.** Every visual decision lives in CSS custom properties
  and `.lyra-*` classes. Framework packages are thin wrappers over that CSS core —
  this is what makes Lyra portable across frameworks.
- **No Tailwind in the core.** The core is plain, portable CSS. A Tailwind preset
  may exist later only as an optional satellite, never inside the core packages.
- **Lyra naming is canonical.** The shadcn compatibility layer
  (`compat-shadcn.css`) is **opt-in** and lives outside the default entry — it is
  never imported by the main stylesheet.
- **Entry keyframes animate `transform` only.** Entrance animations never start a
  frame at `opacity: 0`.
- **No runtime CDN dependencies.** Everything a consumer needs is shipped in the
  packages (for example, icons embed locally rather than loading from a CDN).

## Dependency policy

- **New runtime dependencies require maintainer approval.** Propose them in an
  issue or discussion before adding them; each dependency is a cost we all carry.
- **`@lyra-ds/styles` stays zero-dependency.** It is plain CSS with no runtime
  dependencies.

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/) (for example
`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`). Keep commit subjects concise and
scoped. This convention also feeds the generated changelogs.
