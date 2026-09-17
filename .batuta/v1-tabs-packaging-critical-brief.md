# Tabs mixed-entry packaging — critical completion
## Goal
Make same-format root and /tabs public parts interoperable in the built and packed package, completing the selected compound API without adding a context singleton or runtime dependency.
## Context
The ongoing Task27 migration has escalated through high initial+retry to critical. Controller actual SSR fails all four ESM/CJS root-owner/subpath-parts and inverse combinations, while separate-entry SSR passes. Each existing separate tsdown build duplicates the private TabsContext. Correct ownership at the existing package entry boundary. Root exports should forward to the already shipped tabs sibling artifact; do not introduce code splitting or a new internal export. Installed tsdown0.22.14 exposes outputOptions callback with format and cjsDts; official Rolldown paths maps external IDs. Actual build/packed checks are required, not inferred API correctness. Existing tools/smoke/smoke.mjs section7 already runs Node proof in a real tarball-installed Vite consumer; extend there with four actual mixed SSR compositions. Research initial214.79s was stopped for excluded dependency traversal, unchanged guard; report-only retry pending.
## Conventions
Reuse the full current `.batuta/v1-tabs-owned-content-critical-brief.md` Conventions. Pinned Node24.18.0 and pnpm11.13.1; English prose; no dependency/version changes. Critical controller owns implementation and verification. Packaging remains dual ESM/CJS plus matching declarations, all150 JS/CJS client directives, codeSplitting:false, same export map/basenames, existing tree-shaking isolation. Keep all prior Tabs behavior and exact1.5kB family cap.
## Acceptance criteria
1. Permanent packed consumer proof actually renders four mixed provider/parts compositions (both directions, ESM/CJS), verifies real visible panel content and tab role, and fails with current independent-root build. The root-only CJS/component and Vite isolation checks remain intact.
2. Root build externalizes only ./tabs to its same-format emitted sibling; CJS declaration routing uses cjsDts when necessary. Built/packed mixed SSR, root/subpath types, publint/attw, client directives, CDN scan and real Vite+Next consumer builds pass. No extra chunk or package export; other148 JS/CJS entries remain byte-identical to pre-packaging build except the separately repaired tabs artifact. Run built native/hydration/current consumers after final build.
3. Independent final review includes this bounded config exception, regression, controller evidence and ref fix. No V1 qualification or size-cap waiver; all13existing overages remain tracked.
## Boundaries
No globalThis/Symbol singleton, dependencies, public API changes beyond selected Tabs design, generic build migration, source rewrite, lockfile/baseline/CI edits, version/release/remote action, Colima/Docker/service operation, hook config or suppression. This explicitly amends the earlier scope ban on build configuration for the reproduced export ownership bug only.
## Scope
- packages/react/tsdown.config.ts (root-only existing Tabs sibling mapping and accurate contract comment)
- tools/smoke/smoke.mjs (additional mixed Tabs SSR inside existing real installed consumer stage)
Previously authorized owner/ref test changes remain in their own recorded critical correction; other Task27 product files read-only. Generated dist must come from existing build only.
## Expected evidence
Actual old-build four-case SSR failure; permanent installed-consumer regression RED then GREEN; config diff, output sibling imports, matching declaration paths, unchanged unrelated artifacts; pinned checks and independent exact review block. No worker claim is evidence.
## Stop conditions
If sibling mapping requires broad build changes, contexts across unrelated formats/versions, new runtime singleton or dependency, stop and revise diagnosis. Do not weaken packed or size checks. Unexpected repeated failure requires cause analysis before another change.

Actual diagnostic refinement: preserve callback input options and map the absolute source module ID (fileURLToPath of ./src/tabs relative to config), as observed by the isolated installed-build probe. The emitted sibling paths remain ./tabs.js and ./tabs.cjs, including CJS declarations.
