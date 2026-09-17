# React modal logical-close activity — controller verification
Status: controller gates and independent GLM3/3DONE/no findings/unchanged guard/verifierPASS complete. Task36 is a bounded part of Task31, not full V1/modal qualification. Base ae3e6ce; implementation commit3bf23ef.

## Delivery and routing
Critical/controller design; GLM initial six precision findings adjudicated, revised3DONE/none/unchanged guard/verifierPASS. CodexTerra/high initial422.8s, one test-only retry307.72s, then critical/controller fixture completion. Initial and retry reports, byte snapshots and scope checks retained. Initial11product paths: four owners, four browser tests, private use-modal-activity helper/test and patch changeset. No SSR or public API/generated/dependency/style/config changes.1701protected tracked source files remain SHA-identical. Runtime/changeset bytes are still exactly the initial implementation bytes; retries/critical changes only improve the five scoped tests.

## Criterion1 — accepted logical close and retained presentation
PASS. Owned overlays become inert via their explicit commit ref; no parent/body/portal-host inference. Closed panel aria-modal is absent while role/name/classes and animation remain. Three true-through-presence traps now key on open; CP's existing modal&&open trap/scroll remains. Close defaults/input selection are inactive only for accepted controlledfalse. Existing return/scroll/presence helpers untouched.
Final compiled native close12/12 (four owners × Chromium/WebKit/Firefox): actual trigger opening and entry, acceptedfalse retains connected nodes, inert rejects the deliberate closed-panel focus attempt, no active guards/extra Escape close, exacttrigger focus and released body overflow. Zero console/page errors. Raw MAIN .batuta/runs/v1-modal-logical-close-native/current-result.json, run-current.mjs, current.html, fixture-current.jsx.

## Criterion2 — gesture lifetime and preserved behavior
PASS within the bounded own-scope contract. Final compiled oldgesture12/12: real backdrop down, controlledfalse/true with exactly same panel, nativeup/click sends zero unwantedclose requests; fresh full gesture then closes exactlyonce. Zero console/page errors; gesture-current-result.json.
Retained compiled regression suite: API60, lifecycle42 (initiallyopen/StrictMode/retainedreopen/throw/pendingclose/destroy), ignoredclose12 and crossfamilyEscape48 allPASS, for186primary native scenarios including the24above. Raw result names prefixed logical-close in the existing native directories, and .batuta/runs/v1-react-modal-logical-close-native-checks/results.json. Expected declared-resolver exceptions remain intentionally observed in lifecycle fixtures, not suppressed. No source/runtime changed since those compiled runs.
Final source fixtures use real trigger input and actual modal entry, keyboardEscape leaves old gesture armed until accepted close, eligible returnFocusTo verifies actual restoration, retained identity/guard cleanup/consumer host isolation are asserted. CP inline uses real browser input and verifies no inert/modal scope or modalresolver activity. Direct helper covers StrictMode/retainedreopen/ref-null teardown.
Negative proof: original four HEAD owners under current new tests fail4/4 on inactive-scope assertions; exact byte restoration passes4/4 (.batuta/runs/v1-react-modal-logical-close-negative). Separately, disabling only helper revokeGesture makes allfour final owner regressions fail expected1close/actual2; restoration passes5/5inclhelper (.batuta/runs/v1-react-modal-logical-close-critical-fault). The high retry before this critical correction falsely passed three of those four under the same injected fault because clicking the close glyph overwrote the pending backdrop flag before close; that diagnosis and initialfault output are preserved (.batuta/runs/v1-react-modal-logical-close-retry-fault). No test skip/only was introduced; CLI-filter exclusions are not source skips.

## Criterion3 — source/static/build scope
Final bounded source: {"chromium": "153", "webkit": "139", "firefox": "139"}. Types, scoped ESLint and Prettier PASS. Initial runtime Reactbuild/docgen-check PASS and generated API files remain unchanged; exact runtime/compiled SHA parity makes that evidence current after test-only work. Raw .batuta/runs/v1-react-modal-logical-close-checks and -final-checks. The patch changeset changes behavior only; no package version/publication.
Current source and compiledSHA: {
  "runtimeSHA": {
    "packages/react/src/bottom-sheet/bottom-sheet.tsx": "af1542f1fa4e863a763da0ee6bfdad783b31bf2578329433001887a52f2d7b34",
    "packages/react/src/command-palette/command-palette.tsx": "40aac12efa66d1ba06becc5c58867226a0f60e07bdae69181af4977d0e0dfcf9",
    "packages/react/src/dialog/dialog.tsx": "66dd01e07dcd5e82a7f71cb0474fd849174ebdd99f25df99cf7d282887334d35",
    "packages/react/src/drawer/drawer.tsx": "d1b67b7ddf9d0de89a965c378ba90c9a1d07b56091b269a1f5b2412e985f6743",
    ".changeset/modal-logical-close-activity.md": "9e464a08259516095d78893e521b7ad562807d1a08441cf67699c6ca9ad0ab3f",
    "packages/react/src/internal/use-modal-activity.ts": "84b86a735c48f2f66f7ccad602ec315b7d07f72e5c504be57e82dcb6717502b7"
  },
  "compiledSHA": {
    "dialog": "b81c348be8f76b640cc30ef2767044c41159264ca993dbf042ddb4f7b61c5516",
    "drawer": "146502ddc4df6ab25aa8cc4d846591e47eacf1975121b2c8218cd1415f491856",
    "bottom-sheet": "aefd6a66957ec777ff436bdbbad2f762f1426ca07a56afe7d2a0e495f9f73b43",
    "command-palette": "ee58d81a185f6c3651518a7b98b36216505b9078c75fcf96b247bd6a1c8f6e76"
  }
}

## Honest limits and fixture corrections
Task10 still fails with12React+1Alpineoverages, caps unchanged: Drawer2616/2000B, BottomSheet2640/2000B, CreateWorkspace4194/3200B, Workspace8364/8250B, FileManager9808/9500B, TimePicker4883/4000B, DatePicker5997/5000B, DateRange approximately6.08/5kB (console-rounded), Tooltip1954/1500B, CP10409/9500B, Recurrence7725/7000B, Weekly15143/14500B; Alpine21949/21200B unchanged/notrebuilt. Size gate is explicitly NOT PASS. Raw sizes.log/size-overages.json; no budget waiver or experimental package.
First strict current native runners correctly failed on Firefox Quirks Mode warnings from controller HTML lacking DOCTYPE, despite24/24behavior predicates. Corrected standards-mode HTML now gives clean24/24; first HTML/results retained. This is controller fixture correction, not a worker runtime failure.
An optional modal-inline-modal teardown diagnostic has3/3native gesture predicates but one WebKit return-focus warning. A frozen ae3e6ce CP SOURCE baseline with unchanged helpers produces the same warning; current compiled runtime does too. This pre-existing dynamic-mode concern remains Task31 and is not counted among clean186proof. The source baseline's first loader error from extensionless filesystem URLs is retained; resolved imports/fixture-only JSX config and source-baseline-manifest.json identify the corrected source comparison. Do not confuse its metadata for a compiled baseline. Details .batuta/runs/v1-modal-logical-close-native/controller-fixture-diagnosis.md.
No background-wide isolation/topmost arbitration/focused-node rescue/parent-child transfer or Alpine lifetime parity qualification; no packedLinux/React18 runtime/manualAT/fullV1 claim. Current Node24.18.0, React19 toolchain and three installed local browser engines only. No Colima/Docker/service/remote operation.
