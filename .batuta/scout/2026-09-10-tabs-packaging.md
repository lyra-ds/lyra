# Tabs packaging scout

Initial214.79s stopped for excluded dependency traversal; exit-15/unchanged guard. Report-only retry29.29s exit0/unchanged guard. All cited project paths and config/smoke symbols checked by controller.

<<<REPORT

## Answer

Smallest scope: one file, `packages/react/tsdown.config.ts`. Change only the root `index` build (the mapped config for `index: 'src/index.ts'`), leave all 77 other entries untouched:

1. Add `'./tabs'` to that build's `deps.neverBundle` (extend existing peer list `['react','react-dom','react/jsx-runtime','lucide-react']` with the internal subpath).
2. Change `outputOptions` from the static object to the callback form verified in the installed tsdown 0.22.14 types: `(options, format, context) =>` set `paths: { './tabs': format === 'cjs' ? './tabs.cjs' : './tabs.js' }`, branching dts via `context.cjsDts` (map to `./tabs.cjs` there so `.d.cts` declarations resolve to the CJS owner).

Keep per-entry `codeSplitting: false`, no new chunks, dual `format: ['esm','cjs']`, `dts: true`, `outExtensions`, `clean`/`treeshake`/`sourcemap` exactly as-is. The `scripts/use-client.mjs` post-step already prepends to every `.js`/`.cjs` in dist, so the externalized-root output keeps its directive with zero script change.

Why this is the smallest correct shape: root currently bundles a private copy of tabs source; consumer importing root + `./tabs` subpath gets two module instances (mixed provider/parts SSR fails 4/4). Externalizing makes root's output reference the already-emitted `tabs.js`/`tabs.cjs` subpath output, so both import specifiers resolve to one emitted owner per format. Rolldown `outputOptions.paths` is the documented mechanism for mapping an externalized ID to a replacement specifier (https://rolldown.rs/reference/OutputOptions.paths).

Risks, ranked:

- **dts `paths` branching**: if `context.cjsDts` is not honored as typed, `.d.ts`/`.d.cts` may point at the wrong extension → attw FalseCJS/FalseESM or broken subpath declarations. Type signature verified; runtime behavior not yet proven. Controller must run the build and attw before trusting it.
- **callback contract**: whether tsdown expects mutation of `options` in place vs return value (`OutputOptions | void | null`). Returning the mutated object is safest given the type.
- **ESM relative specifier**: `./tabs.js` with explicit extension is required for Node ESM resolution; if tsdown rewrites or normalizes differently in CJS dts, require() of declarations/types breaks. Packed-consumer proof covers this.
- **scope creep of internals**: only `./tabs` is externalized. If root barrel source imports any other internal subpath (e.g., theme-provider, fieldset), same two-instance bug persists for those — each must be added to the same neverBundle + paths pair. Evidence given covers only the tabs failure; other internals unknown without reading root source (excluded by scope).
- **dual-format instance hazard remains**: consumer mixing `require()` and `import` of the same package still gets two instances (one per format). Inherent to dual ESM/CJS; the fix only unifies within a format.
- **publint/attw 1:1 filename contract**: no change — no new output files, basenames unchanged, so the 03-08 dist assertions stay valid.

Exact existing gate location for a permanent mixed-entry regression: `tools/smoke/smoke.mjs`, section 7 "CJS require() consumer proof" (lines 254–275). It already does the right harness: real `npm install` of packed tarballs into `viteDir`, then `node -e` proof. Today it asserts barrel `Button` and `./icon` `Icon` separately (lines 266–269) — separate resolution, not same-format mixed-instance. Permanent gate: extend `cjsProof` to `require('@lyra-ds/react')` and `require('@lyra-ds/react/tabs')` in the same eval and assert a shared singleton (e.g., both resolve to the same context/object identity where the bug manifested), and add the mirrored ESM case (`import` root + `./tabs` in one module) next to the existing vite production-build/tsc assertions (lines 240–252, 277–280). That converts the current 4/4 SSR failure into a checked assertion on every smoke run, before any consumer ever sees it.

## Files

- packages/react/tsdown.config.ts:100-117 — per-entry defineConfig map; `outputOptions.codeSplitting:false` at 111-113; `deps.neverBundle` peer list at 114-116; root entry at 23.
- packages/react/tsdown.config.ts:3-5 — 1:1 dist-basename ↔ exports-map contract, publint/attw gates reference.
- tools/smoke/smoke.mjs:254-275 — section 7 CJS require() consumer proof (gate extension point for permanent mixed-entry regression).
- tools/smoke/smoke.mjs:261-271 — cjsProof script body (extend here for root+`./tabs` same-instance assertion).
- tools/smoke/smoke.mjs:277-280 — smoke OK summary; ESM vite build/tsc assertions in same harness.
- packages/react/scripts/use-client.mjs:9-17 — post-build directive prepend; no change needed (covers root output too).

## Evidence

- tsdown.config.ts:111-116 shows the exact static `outputOptions` and `deps.neverBundle` to convert to callback + extended list.
- tsdown.config.ts:6-9 documents per-entry builds and `codeSplitting:false` invariant that must survive.
- Installed tsdown 0.22.14 type (provided, verified by requester): `outputOptions?: OutputOptions | ((options: OutputOptions, format: NormalizedFormat, context:{cjsDts:boolean}) => Awaitable<OutputOptions|void|null>)`; `deps.neverBundle` accepts string list.
- Rolldown official docs (provided URL): `OutputOptions.paths` maps external IDs to replacement paths.
- smoke.mjs:254-275 shows packed-tarball install + `node -e` proof pattern already in repo; lines 266-269 prove barrel+subpath are proven separately today, never mixed — the gap the regression gate must close.
- Requested correction: built same-format root/subpath mixed provider/parts SSR currently fails 4/4; each separate entry passes → failure is instance duplication, not component defect.

## Uncertain

- Whether tsdown invokes the `outputOptions` callback for dts builds per-format with `cjsDts` as typed — type-verified only; controller must run build + attw + packed consumer proof.
- Whether callback must mutate `options` in place or return; returning mutated object chosen per type.
- Whether root barrel source imports internal subpaths other than `./tabs` (root source not in evidence; discovery excluded). If yes, same fix needed per subpath.
- Exact line numbers of the ESM-side smoke assertions (only lines 249-280 provided; ESM section location inferred from summary at 277-280).
- Whether `paths` replacement in CJS dts needs `./tabs.cjs` or extensionless mapping — docs say replacement path; extension form is the safe choice for Node resolution, unverified at runtime.

REPORT>>>

Controller adjudication: select root-only external ./tabs and format-aware output paths with existing packed-consumer SSR gate. The report count77other entries is inaccurate (75total/74other); no inventory change selected. Do not act on speculative other-context expansion. Actual mixed SSR is the permanent oracle, not an identity-only assertion. Validate callback/declaration behavior through the installed build, not advisory inference.
