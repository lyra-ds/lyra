# Alpine Public API Compatibility Audit — 2026-08-15

## Scope

This record completes `BKL-01` from
`docs/superpowers/backlog/2026-08-15-prioritized-backlog.md`. It compares the
published `@lyra-ds/alpine` 0.5.0 package with its source, the documented
Wave 1 contract, and the corresponding `@lyra-ds/react` 0.4.2 behavior. It
does not change versioned package source, public behavior, documentation tabs,
or release metadata.

## Public Package Surface

`packages/alpine/package.json` exposes ESM-only root import `.` with
`./dist/index.js` and `./dist/index.d.ts`. The built artifact and a tarball
created with `pnpm pack` expose the same runtime surface:

```text
DEFAULT_LABELS, TIME_ZONE_PICKER_ZONES, default, describeRecurrence
```

The default value is a function in both artifacts. The packed
`dist/index.js`, `dist/index.d.ts`, and `README.md` are byte-identical to their
post-build counterparts. The tarball contains only the declared publication
surface: `dist/`, `README.md`, `LICENSE`, and `package.json`.

`packages/alpine/src/index.ts` implements the same public entrypoint. Its
default `lyra(alpine: LyraAlpine): void` plugin registers two stores (`theme`
and `lyraToasts`) and 30 `Alpine.data()` factories. Its named runtime exports
are the three values listed above; option and data contracts are type-only
exports in the declaration file. No runtime source-to-artifact export drift is
demonstrated here; this audit does not make a name-for-name parity claim about
type-only exports.

## Documented Wave 1 Contract

The `Components (wave 1)` table in `packages/alpine/README.md` is explicitly
scoped to that wave; it does not claim to enumerate every plugin registration.
The source currently has 30 registrations, so the additional 23 registrations
are not a contradiction of the documented table.

| Registration    | README bindings                         | Source binding interface | Controllable state            |
| --------------- | --------------------------------------- | ------------------------ | ----------------------------- |
| `lyraDropdown`  | `trigger`, `menu`, `item`               | `LyraDropdownData`       | `open` via `x-modelable`      |
| `lyraDialog`    | `overlay`, `panel`, `title`, `close`    | `LyraDialogData`         | `open` via `x-modelable`      |
| `lyraDrawer`    | `overlay`, `panel`, `title`, `close`    | `LyraDrawerData`         | `open` via `x-modelable`      |
| `lyraTabs`      | `list`, `tab`, `panel`                  | `LyraTabsData`           | `active` via `x-modelable`    |
| `lyraAccordion` | `item`, `trigger`, `panelWrap`, `panel` | `LyraAccordionData`      | `openItems` via `x-modelable` |
| `lyraTooltip`   | `root`, `target`, `bubble`              | `LyraTooltipData`        | none                          |
| `lyraPopover`   | `trigger`, `panel`                      | `LyraPopoverData`        | `open` via `x-modelable`      |

The corresponding React source supports the same state-machine intent:
Dropdown and Accordion are internally managed with their documented default
state; Dialog and Drawer receive `open`; Tabs receives `active` and reports
changes; Tooltip has no consumer-controllable open prop; and Popover supports
controlled or default `open`. Alpine's `x-modelable` state is its documented
adapter mechanism for exposing the applicable state to Alpine and Livewire.
The relevant Alpine browser tests exercise every listed modelable state in
both directions and axe checks for the Wave 1 components.

## Verification Evidence

The browser and React tests were run from the repository worktree before the
Alpine build. The artifact, package, and packed-entrypoint checks were run
after that build; `pnpm pack` was run from `packages/alpine`.

```text
$ rtk pnpm --filter @lyra-ds/alpine run test:browser
exit status: 0

$ rtk pnpm --filter @lyra-ds/react run test
Test Files  74 passed (74)
Tests  94 passed (94)

$ rtk pnpm --filter @lyra-ds/alpine run build
exit status: 0
dist/index.js      196.73 kB
dist/index.d.ts     34.88 kB

$ rtk pnpm --filter @lyra-ds/alpine exec attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm
No problems found

$ cd packages/alpine
$ rtk pnpm pack --pack-destination /tmp/lyra-bkl-01-audit
package: @lyra-ds/alpine@0.5.0

$ cd ../..
$ rtk tar -xzf /tmp/lyra-bkl-01-audit/lyra-ds-alpine-0.5.0.tgz -C /tmp/lyra-bkl-01-audit/package

$ rtk node --input-type=module -e "import * as packed from 'file:///tmp/lyra-bkl-01-audit/package/package/dist/index.js'; console.log(Object.keys(packed).sort())"
DEFAULT_LABELS, TIME_ZONE_PICKER_ZONES, default, describeRecurrence
```

## Result

No documented public-contract mismatch or runtime publication-surface mismatch
was demonstrated. `BKL-01` is complete: the source, built, and packed runtime
entrypoints agree; the declaration file is published identically and passes
the packed `attw` check; and the documented Wave 1 bindings and controllable
state agree with the relevant React-derived behavior.

No follow-up implementation plan, changeset, release, or documentation-stack
change is warranted by this audit. A future delivery must be selected from new
evidence rather than treating the intentional Wave 1 documentation scope as a
defect.
