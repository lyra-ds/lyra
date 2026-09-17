# V1 standalone budget decision — 2026-09-11

Status: **accepted by the maintainer for the11explicit standalone CI thresholds below; implemented and locally verified**. This is not final V1 release approval, a quantitative responsiveness result or an automatic scenario/migration-delta exception. Decision owner: Francis / Lyra maintainers. Scope: incumbent Lyra React and Alpine, before Blade.

## Approval and interpretation

The maintainer requested the real-size foundation and the possibility of increasing limits. The controller presented the exact11recommended values in .batuta/v1-budget-foundation.md, explained actual consumer payload plus shared CSS, and distinguished those measurements from the Size Limit pipeline. The maintainer then asked whether the assets would be too large for a web page. After the explanation that increasing thresholds does not increase current assets and that representative mobile qualification remains pending, the maintainer replied: **"De acordo entao"**.

In that context, this records approval to apply the presented11recommended standalone caps while retaining the approved accessibility/lifecycle contracts. No repeated permission was requested. It does not interpret agreement as permission to change other61entries, scenario fixtures/ceilings, historical baselines, package versions, publication, dependencies, services, runtime behavior or Blade.

## Accepted thresholds (decimal bytes)

Policy: ceil(current measured Size Limit bytes ×1.05 /100) ×100. The5% is explicit maintenance allowance, not measured performance headroom, build noise or blanket permission for new features. Rounding adds at most99bytes. The exact accepted values are authoritative for this change.

| Entry | Current bytes | Previous cap | Accepted cap |
| --- | ---: | ---: | ---: |
| import { Drawer } from '@lyra-ds/react/drawer' | 4989 | 2000 | 5300 |
| import { BottomSheet } from '@lyra-ds/react/bottom-sheet' | 5030 | 2000 | 5300 |
| import { CreateWorkspaceDialog } from '@lyra-ds/react/create-workspace-dialog' | 7476 | 3200 | 7900 |
| import { TimePicker } from '@lyra-ds/react/time-picker' | 7512 | 4000 | 7900 |
| import { DatePicker } from '@lyra-ds/react/date-picker' | 8638 | 5000 | 9100 |
| import { DateRangePicker } from '@lyra-ds/react/date-range-picker' | 8733 | 5000 | 9200 |
| import { Tooltip } from '@lyra-ds/react/tooltip' | 1954 | 1500 | 2100 |
| CommandPalette (curated icon registry + portal) | 12901 | 9500 | 13600 |
| RecurrenceSelector (DatePicker composition) | 10444 | 7000 | 11000 |
| WeeklyScheduleEditor (Popover and local inputs) | 17784 | 14500 | 18700 |
| import lyra from '@lyra-ds/alpine' | 23040 | 21200 | 24200 |

The increase relative to old modal caps is substantial (Drawer2000→5300B, +165%). This decision explicitly accepts that standalone download allowance for the retained contract; it is not described as a negligible threshold correction.

## Contract and alternatives

Retain the incumbent fixes already verified in .batuta/v1-modal-isolation-verification.md, v1-modal-dynamic-focus-verification.md, v1-tooltip-timing-verification.md and v1-tabs-alpine-verification.md / v1-tabs-alpine-docs-verification.md. They supply dynamic focus recovery, background inert isolation, per-document/topmost/parent-child ownership, accepted-close restoration, combined Tooltip timing/ownership and eligible native Alpine navigation/teardown. Reverting to old smaller bodies reintroduces failures already demonstrated by meaningful native negatives.

The detailed comparable9d214bf/current standalone, five-composition, CSS, module and compiled-source-region evidence is .batuta/v1-budget-foundation.md and its raw references. Exact package/module contribution stages are labelled; unminified regions including comments are not assigned additive compressed cost. No vendor performance or native-only equivalence is invented. Native/platform-only and external-foundation replacements were not qualified as drop-in equivalents, and comparative foundation work remains suspended under the maintainer's incumbent direction.

Measured bounded alternatives are documented in .batuta/v1-size-limit-evaluation.md and v1-remaining-size-limits.md. Private icon changes were accepted and removed the FileManager/WorkspaceSwitcher failures without raising their caps. Focus/timer/scan deduplication saved only12/14 or19–30bytes; shared panel extraction grew output. Root-import variants also grew all five compressed compositions. Those prototypes remain absent from production. This does not claim every possible optimization was exhausted.

## Removal and migration accounting

This cap-only decision removes/adds no production runtime, public export, dependency, test or CSS rule and requires no consumer API migration. It does not create an alternate implementation path. Previous focused runtime corrections replaced their owning bodies, and their source/regression proofs remain authoritative. The two private icon optimizations remain applied; legitimate other Icon consumers retain their public behavior. No old runtime path is restored or additional old/new foundation bundled by this policy change.

Only10limit strings in packages/react/package.json and1in packages/alpine/package.json change. Dependency graph, lockfile, versions, imports/externals, format, public props/declarations and build configuration remain identical. React/Alpine tarball checksums change because their package.json metadata changed; the453compiled runtime/declaration assets remain byte-identical. No changeset/version increase is created for a CI-threshold-only change.

## Validation and remaining qualification

Controller scope proof: complete before/after file guard permits only the two manifests before the managed decision records were written; parsed JSON confirms exactly11limit-field changes and61untouched entries. A clean detached15e1170 checkout receives the explicitly declared cap-only manifest overlay, builds fresh, packs and installs into a frozen cold consumer/store. All72SizeLimit entries pass with **exactly the same actual sizes** as before. Raw/minified/Brotli for72entries, five canonical compositions and fourCSS assets are unchanged. Same pinned tools/configuration/lock/consumer graph/externals,453compiled artifact hashes, three retained tarball hashes and guarded cleanup verified. Root/subpath fixtures and historical baselines are unchanged.

Existing scoped behavioral verification is not rerun or relabelled as new performance evidence for this JSON-only edit. Additional workspace SizeLimit and scoped formatting checks are recorded in the verification trail. This work is not a full PR/CI run.

Applicable quantitative responsiveness, representative mobile-page validation, explicit scenario/migration-delta disposition and final exact-artifact core/Alpine qualification remain pending. Existing+1.5/+3kB delta ceilings are separate from these absolute caps; this accepted numeric change does not silently waive them. The prior assistant assessment that the measured payload is reasonable is engineering judgment about download scale, not a measured runtime PASS. Task10's standalone cap failures are resolved locally; broader performance/baseline qualification andTask39 are not declared complete.

## Evidence

MAIN .batuta/runs/v1-approved-budgets/ retains the eight-section low-lane brief, exact executor report, whole-tree/config proof, declared build overlay, actual installed-tarball gate output,72standalone/5scenario/4CSS report, tarballs, source/artifact hashes and cleanup. Prior observed failures remain in the older immutable raw directories. Diagnostic collector messages stating no budget waiver mean no additional waiver beyond this explicit accepted cap change; the new threshold values are recorded in size-gate.json and this decision.

Independent final review: GLM5.3Flash/low7.80s,3DONE/no defects,2016-file unchanged guard and Batuta verifierPASS. Separate workspace gates also pass71React+1Alpine; scoped Prettier and git diff --check pass. Complete retained-tarball content comparison confirms that only the two package.json files differ; every other packed file is identical, including all Styles files. Raw executor GLM5.3Flash/low59.63s, no retry or escalation; fresh packed controller verification37.91s.

## Follow-up representative mobile evidence — 2026-09-11

The maintainer requested and received the bounded production-consumer mobile lab in .batuta/v1-mobile-validation.md.60coldloads/510trusted timedoperations on unchanged6dacf7e packed assets meet predeclared diagnostic references; React/AlpineLCPp75 836/520ms, no observed cold-layout shifts;1000row updates produce83.1/151.5msp95 and reported long tasks. Actual framework-inclusive pagepayload77724/53471B. Independent review/asset binding/cleanupPASS. This supplies the requested local page validation without changing accepted caps or pretending synthetic throttling is a physical-device/fieldINP result. Remaining exact release, formal family responsiveness and scenario/delta/historical-baseline dispositions stay explicit.
