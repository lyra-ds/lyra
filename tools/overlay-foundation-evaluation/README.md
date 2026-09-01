# Overlay foundation evaluation

This directory contains the approved repository-owned evaluation harness.
The core plan validates prospective manifests, verifies synthetic artifact and
installation behavior, and characterizes the incumbent Lyra packages.

No tracked `candidates.json` exists yet. Radix, Base UI, and Zag artifacts may
be added only after a separate operator approval that names every exact package,
version, registry tarball URL, SHA-256, license, and repository URL.

`pnpm overlay:evaluate:core:test` runs the core protocol tests.
`pnpm overlay:evaluate:check --manifest <path>` validates an explicit
prospective manifest without network access or installation.
`pnpm overlay:evaluate:incumbent --output <path>` builds and characterizes
the current clean Lyra revision into an explicit disposable output path.

These commands do not select a foundation or authorize production changes.
