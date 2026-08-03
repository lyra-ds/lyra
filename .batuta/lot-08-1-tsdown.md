# Lote 08-1 — migrar o build do @lyra-ds/react de tsup para tsdown

<task>
Replace tsup with tsdown as the build tool of `packages/react`, preserving the
dist contract exactly. tsup's own README recommends tsdown as its successor;
this migration is the patch change for the next release. No API change, no
source change — only build tooling.
</task>

## Context

- `packages/react/tsup.config.ts` is the current build contract and is heavily
  commented — read it in full first. Every comment describes a REQUIREMENT that
  must survive the migration, not a tsup implementation detail.
- `tsdown@0.22.14` is ALREADY installed and pinned in the root `package.json`
  devDependencies. Do NOT run any command that needs the network (`pnpm add`,
  `npx` with uncached packages). `pnpm remove` works offline.
- tsup currently lives in root devDependencies (`tsup@8.5.1`) and must be
  removed in this change (via pnpm, never by hand-editing the lockfile).
- `pnpm exec tsdown migrate` exists and works offline; using it is optional.
- The repo pins exact versions (`save-exact`); `engines` node `>=24 <25`.

## Dist contract (each item is verifiable; all MUST hold)

1. `packages/react/package.json` `"build"` script produces `dist/` with EXACTLY
   the same file basenames as today: for each of the 53 exports-map subpaths,
   `<name>.js`, `<name>.cjs`, `<name>.d.ts`, `<name>.d.cts` (+ sourcemaps).
   No `chunk-*` files, no shared-chunk splitting — the exports map ↔ filename
   1:1 mapping is law. The exports map itself must NOT change.
2. Every emitted `.js`/`.cjs` starts with the `"use client";` directive as its
   first line. Gate: `node tools/dist-scan/assert-use-client.mjs packages/react/dist`.
   (In tsup this needed a post-write step because Rollup strips directive
   prologues — verify what tsdown/Rolldown does and guarantee the result
   deterministically, whatever mechanism that takes.)
3. `react`, `react-dom`, `react/jsx-runtime` never bundled (peers);
   `lucide-react` never bundled (runtime dep). Gate:
   `node tools/dist-scan/no-cdn-scan.mjs packages/react/dist` plus grep.
4. Target es2022, sourcemaps emitted, dist cleaned before build.
5. size-limit budgets in `packages/react/package.json` pass UNCHANGED:
   `pnpm --filter @lyra-ds/react exec size-limit`. Editing any budget is
   forbidden — over budget is a stop condition, not a knob.
6. `node tools/docgen/generate.mjs --check` passes (docgen reads dist types;
   if it reports drift, regenerate with `node tools/docgen/generate.mjs` and
   include the regenerated committed artifacts — never edit them by hand).
7. `pnpm run typecheck` (root) passes after `pnpm --filter @lyra-ds/react run build`.
8. `pnpm run lint` (prettier) and `pnpm --filter @lyra-ds/react run lint` pass.

## Changeset

Add one changeset file (`.changeset/<name>.md`) with a `patch` bump for
`@lyra-ds/react`: build migrated from tsup to tsdown (Rolldown); dist contract
unchanged; no API changes. English, one short paragraph.

## Conventions

- Conventional commits are the repo norm but DO NOT commit — leave the tree
  dirty for the maestro's review.
- Exact versions only; lockfile changes only through pnpm commands.
- Test laws: test the behavior, never the mock; a failing gate means fix the
  config, not the gate; no test-only flags in production code.

## Boundaries

Touch ONLY: `packages/react/tsup.config.ts` (replace/rename it to the tsdown
equivalent), `packages/react/package.json` (the `build` script line only),
root `package.json` (remove tsup), `pnpm-lock.yaml` (via pnpm only),
`.changeset/` (one new file), and `tools/docgen/output/*` ONLY via the
generator. Never touch: `src/**`, the exports map, size-limit budgets,
`packages/styles/**`, `apps/**`, `tools/**` source,
`packages/react/src/icon/icon-registry.ts`.

## Sandbox limits (do not fight them)

Your sandbox cannot bind localhost or reach the network. Do NOT run: vitest
(browser mode), publint, attw, pack-smoke, smoke. The maestro runs those
after your delivery. Run everything in "Dist contract" above — all offline.

<verification_loop>
After the migration builds, run gates 1–8 in order and fix until green. For
gate 1, diff the sorted dist file listing against the exports-map-derived
expectation and show the diff is empty.
</verification_loop>

<default_follow_through_policy>
Proceed without asking questions. Decide config details yourself as long as
every contract item holds and boundaries are respected.
</default_follow_through_policy>

<compact_output_contract>
Report back: files touched (paths); each gate command run with the tail of its
ACTUAL output; any uncertainty declared as such — an unverified claim marked
as verified is worse than a declared gap.
</compact_output_contract>

## Stop conditions

Stop and report (instead of improvising) when: the same command fails twice;
any size-limit budget is exceeded; tsdown cannot express a contract item
(e.g. per-entry no-chunk output or split .d.ts/.d.cts per condition); or the
fix would require edits beyond Boundaries.

## RETRY FEEDBACK (accepted review findings — fix both, change nothing else)

1. HIGH — `onSuccess` is fire-and-forget in tsdown (`executeOnSuccess` is not
   awaited) and the 52 configs build concurrently via `Promise.all`, so a
   late-finishing build can write a `.js`/`.cjs` AFTER the directive scan ran:
   the `"use client"` guarantee is a race, not a mechanism. Fix: REMOVE
   `onSuccess` from the config entirely; move `ensureUseClientDirective` into a
   new standalone script `packages/react/scripts/use-client.mjs` (plain Node,
   no deps) and change the build script to `"build": "tsdown && node
scripts/use-client.mjs"` so the prepend runs exactly once, after ALL builds
   finished. This new file and that script line are now inside Boundaries.
2. MED — no config sets `codeSplitting`; tsdown leaves it unset for non-exe
   builds, so a future dynamic import could emit `chunk-*` files silently. Fix:
   add `outputOptions: { codeSplitting: false }` to every per-entry config.

After both fixes re-run offline gates: build, sorted-dist diff vs exports map,
`node tools/dist-scan/assert-use-client.mjs packages/react/dist`, size-limit,
prettier/eslint. Update the config header comment where it still credits
`onSuccess`.
