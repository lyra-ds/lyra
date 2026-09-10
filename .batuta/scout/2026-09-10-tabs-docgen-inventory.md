# Tabs docgen inventory scout

GLM5.3Flash139.39s,exit0,unchanged guard. Controller verified the named exported Props guard and existing stats derivation.

<<<REPORT

## Answer

Correct count is **81**. The three new `TabsListProps`/`TabsTriggerProps`/`TabsContentProps` interfaces in the existing Tabs owner (`packages/react/dist/tabs.d.ts`) each pass docgen's full extraction rules — exported `*Props` name (generate.mjs:169), matching exported component name (generate.mjs:171-173), and category via the ownerCategory fallback `Tabs → Navigation` from `handoff/components/navigation/Tabs.d.ts` (generate.mjs:176). No handoff, catalog, family, subpath, or dependency change is needed.

Narrowest fix:
1. `tools/docgen/generate.mjs:218` — bump `EXPECTED_COMPONENTS = 78` → `81`, and append the Tabs-parts note to the hand-maintained history comment (lines 208-217).
2. Regenerate `tools/docgen/output/props.json` + `llms.txt` via the existing `docgen` script (controller-run; generated files only).
3. Update the one downstream hardcoded assertion: `apps/site/scripts/landing-sections.test.mjs:19` `documentedComponents: 78` → `81` (plus the derived `apps/site/lib/generated/stats.json`, produced by derive-stats, not hand-edited).

**81 vs 78 lives only in the Props-count guard** — `generate.mjs:218-223` is the sole 78 assertion on this domain. `alpine.mjs`/`blade.mjs` have no count guards; CI (`.github/workflows/ci.yml:134-139`) only runs the three `--check`s.

## Files (path:line)

- tools/docgen/generate.mjs:218-223 — the failing guard (`EXPECTED_COMPONENTS = 78`)
- tools/docgen/generate.mjs:166-176 — extraction rules (exported Props + ownerCategory fallback); :208-217 — hand-maintained count-history comment
- packages/react/dist/tabs.d.ts:10-42 — 4 Props interfaces, 4 exported components, `TabItem` type unchanged
- apps/site/scripts/derive-stats.mjs:54 — `documentedComponents: props.length` (derived, no hardcoded count)
- apps/site/scripts/landing-sections.test.mjs:11-23 — only downstream test hardcoding 78; line 19 must become 81
- apps/docs/lib/components.test.ts:41-48 — React parity is one-directional (catalog→props.json); :58-66 reverse check is Alpine-only → new props entries without docs pages do not fail
- apps/docs/lib/components.ts:379 — single `Tabs` catalog entry stays; no test requires entries for parts
- .github/workflows/ci.yml:134-139 — runs `generate.mjs --check` etc., no separate count

## Evidence

```
generate.mjs:218   const EXPECTED_COMPONENTS = 78;
generate.mjs:221   `Expected exactly ${EXPECTED_COMPONENTS} ... extracted ${components.length}.`
generate.mjs:176   const category = categoryByName.get(name) ?? ownerCategory ?? CATEGORY_OVERRIDES.get(name);
tabs.d.ts:42       export { type TabItem, Tabs, TabsContent, type TabsContentProps, TabsList, type TabsListProps, type TabsProps, TabsTrigger, type TabsTriggerProps };
dist scan: TOTAL 81  (tabs.d.ts: TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps)
committed props.json: 78 entries; Tabs/Navigation present, no Tab* parts yet
landing-sections.test.mjs:19   documentedComponents: 78,
```

**78s that are NOT this domain (leave untouched):** `tools/icon-registry/generate.mjs:73` (78 icons + 1 vendored); `apps/site/scripts/metadata-deploy.test.mjs:108` (PNG magic bytes); prose `README.md:20`, `README.pt-BR.md:20`, `packages/styles/package.json:4`, `packages/styles/README.md:3`, `apps/docs/content/docs/{en,pt-BR}/foundations/architecture.mdx:29` ("78 components") — none test-asserted.

## Uncertain

- Prose "78 components" in README/architecture.mdx/styles description: counts catalog families, not Props entries. With parts-as-components but no new CSS family, 78 may remain correct prose — or may be deliberately updated to reflect 81 React wrappers. No test enforces either; needs owner decision, not part of the guard fix.
- Did not run generation (no writes permitted); regenerated props.json/llms.txt exact content (3 new Navigation sections, sorted after Tabs) is inferred from renderLlms ordering, verified structurally only. Also did not confirm whether `apps/site` stats regen runs in the site build (derive-stats.mjs:64 self-invokes on import) vs. test-time.

REPORT>>>

Controller disposition: accept the three-path scope addition (generator count/history, landing test expected documentedComponents, controller-generated stats.json). This counts81 documented React interfaces, not a new CSS/component family; existing78-family prose and all other counts remain unchanged.
