# Tabs runtime review — first final round

OpenCode / opencode/glm-5.3-flash; 299.58s; exit0; HEAD/status/diff/scoped-file guard unchanged. Three actual TASK lines are DONE.

```text
<<<FINDINGS
1. packages/react/src/tabs/tabs.tsx:231 LOW: `setRootNode` deps `[normalizeEntry, ref]` with `normalizeEntry` deps `[active]` give the root div a new ref callback on every controlled `active` change; React then calls the consumer ref with `null` then the node per accepted selection (spurious detach/attach observable to consumer callback refs, e.g. a ref that unregisters/measures on `null` misfires on every click) plus one redundant `normalizeEntry` pass, since context-driven TabsList/TabsTrigger layout effects already normalize each commit. Fix: keep `setRootNode` stable on `[ref]` and read the latest normalizer through a local ref; mount-time normalization via ref attach stays intact.
FINDINGS>>>
```

Controller adjudication: accepted native callback-ref stability defect; implementation pending. Separately, controller mixed-entry SSR fails all four ESM/CJS root-owner/subpath-owner combinations with TabsList missing its provider. Single-entry checks do not cover this scenario; final runtime verdict is pending until packaging and callback-ref corrections pass.
