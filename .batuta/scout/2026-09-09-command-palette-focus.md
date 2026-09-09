
## Answer

**Current CommandPalette focus lifecycle (modal mode):**
- Capture: `CommandPalettePanel` open effect captures `document.activeElement` into a local `openerRef` via prop `captureOpener` (command-palette.tsx:214-220, capture callback at 426-428, ref declared at 380). Capture happens BEFORE the rAF focus of the input (line 218). Skipped during closing (`modal && !open` early return, line 215) and not wired in inline mode (`captureOpener={inline ? undefined : captureOpener}`, line 488).
- Initial focus: input focused via `requestAnimationFrame` (line 218); DOM focus stays on the combobox input (APG activedescendant model, lines 209-212 comment).
- Close/restore: local effect keyed on `[inline, open]` (command-palette.tsx:430-434). On `open` true→false (and never inline) it focuses `openerRef.current` if `instanceof HTMLElement`, then nulls it. No eligibility check, no `preventScroll`, no resolver — plain `focus()`.
- Presence: `usePresence(open)` (line 385); panel/overlay stay mounted through exit motion (`closing`, lines 258, 500); restore fires at close-request render, before unmount.
- Inline: no portal, no trap, no capture/restore at all; `open` prop ignored (prop doc line 57; restore guard line 431).

**Existing shared resolver:** `useReturnFocus({ open, returnFocusTo, panelRef, overlayRef }) → { captureOpener }` (use-return-focus.ts:62-118). Consumed by Dialog (dialog.tsx:270, capture threaded into DialogPanel at 306, capture-before-focus at 129) and Drawer (drawer.tsx:187, capture at 211). Semantics: one-shot capture per cycle (`capturedForCycleRef`, lines 79-85, reset line 107); on accepted `open` true→false transition resolves `returnFocusTo()` first, else captured opener (lines 95-104); eligibility filter (lines 36-56: same document, connected, not body/html, not inside panel/overlay, enabled, visible, programmatically focusable); `focus({ preventScroll: true })` (line 109); dev warning when nothing eligible (lines 110-114); resolver captured post-commit via `resolverRef` (lines 71-77).

**Lifecycle mismatches preventing direct reuse (all fixable by rewiring, no new framework):**
1. **Duplicate implementation to remove:** CommandPalette's local `openerRef` + `captureOpener` + restore effect (command-palette.tsx:380, 426-428, 430-434) overlap the hook; stacking both would double-focus. Must be replaced by hook wiring, not added alongside.
2. **No `overlayRef`:** the hook requires it (use-return-focus.ts:10) for panel/overlay containment exclusion (line 44). CommandPalette's overlay div (command-palette.tsx:499-514) has no ref today. Needs a `useRef` + `ref` on that div (Dialog does this at dialog.tsx:164, 262).
3. **No `returnFocusTo` prop:** `CommandPaletteProps` (command-palette.tsx:56-87) lacks it; Dialog/Drawer have it (dialog.tsx:60, drawer.tsx:41).
4. **Inline mode has no hook equivalent:** the hook keys only on `open` transitions and has no "disabled" concept. CommandPalette suppresses capture/restore in inline mode explicitly (lines 431, 488; `open` prop documented as "Ignored in inline mode", line 57). If a consumer renders `inline` with `open` toggling (contradictory but currently tolerated), the hook would run a close transition with no captured opener/resolver → new dev `console.warn` where today it silently no-ops. Migration must keep the inline guard (pass `open=false`/skip capture in inline, mirroring line 488) or the composition regresses.
5. **Behavior deltas on migration (intentional, shared semantics):** plain `focus()` → `focus({ preventScroll: true })` (line 432 vs use-return-focus.ts:109); unconditional HTMLElement focus → eligibility filter + resolver priority (use-return-focus.ts:36-56, 95-104); silent failure → dev warning (lines 110-114). Hotkey-opened palettes with no prepared opener (`document.activeElement` = body at capture) hit the dev warn path after close; today they silently `body.focus()` (body is HTMLElement).
6. **Capture one-shot semantics:** hook's `capturedForCycleRef` ignores repeat captures per cycle; CommandPalette's current capture is unconditional overwrite (line 427). Same element captured either way in current flow (effect runs once per open because deps `open/modal/onReady/captureOpener` are stable while open), so compatible.

**Public examples needing migration:**
- `apps/docs/components/examples/command-palette/trigger.tsx:16-25` — modal palette opened from a `CommandPalette.Trigger` button; pointer-open path, no `returnFocusTo`. Compare migrated pattern: `apps/docs/components/examples/drawer/basic.tsx:18` and `.../drawer/without-footer.tsx:18` (`returnFocusTo={() => triggerRef.current}`).
- Site's own modal palette: `apps/docs/components/command-menu.tsx:57-74` — trigger + ⌘K, pointer-open, no `returnFocusTo` (candidate, same shape as drawer examples).
- `inline.tsx` and `hints.tsx` examples — inline only; nothing to migrate.

**API docs needing migration:**
- `apps/docs/content/docs/en/components/command-palette.mdx:50-51` — "In modal mode, supply `onClose` to update `open`; closing restores focus to the element that opened the palette." Needs a `returnFocusTo` sentence/section mirroring `dialog.mdx:39-55` and `drawer.mdx:40-61` (dedicated "React return focus" section at drawer.mdx:50-94 with resolver example).
- `apps/docs/content/docs/pt-BR/components/command-palette.mdx:49-50` — same sentence in Portuguese; mirror `pt-BR/dialog.mdx:40-56` / `pt-BR/drawer.mdx:41-59`.
- Generated API catalog: `tools/docgen/output/props.json:2664-2744` (CommandPalette section, no `returnFocusTo`) vs Dialog at 1042-1046 and Drawer at 1099-1103; `tools/docgen/output/llms.txt:1277` (CommandPalette heading). Regenerated, not hand-edited.

**Test migration needs (existing suite):**
- `command-palette.browser.test.tsx:239-263` covers opener restore (Escape + backdrop) — keep green; no `returnFocusTo`-variant test exists (compare `dialog.browser.test.tsx:323-363` "explicit mouse returnFocusTo restores its declared target after %s dismissal", `:352` non-forwarding check, `:461` "does not resolve returnFocusTo when a parent ignores a close request", `:506` successor; `drawer.browser.test.tsx:198, 263, 281, 311`).
- `command-palette.ssr.test.ts:8-33` has no "does not invoke or forward returnFocusTo on the server" case (compare `drawer.ssr.test.ts:21-32`).
- `use-return-focus.browser.test.tsx` is the shared hook's own suite (harness at 12-16, cycles/successor/body/inert cases at 67-301).

**Generation commands (report only — not run):**
- `pnpm run docgen` — root package.json:22 → `node tools/docgen/generate.mjs`; writes `tools/docgen/output/{llms.txt, props.json}` (generate.mjs:308-313). Check mode: `node tools/docgen/generate.mjs --check` (generate.mjs:295-305; drift error text tells you to run `pnpm run docgen`, generate.mjs:287).
- `pnpm run docgen:alpine` (package.json:23) and `pnpm run docgen:blade` (package.json:24) — separate stacks.
- docgen reads **built** declarations in `packages/react/dist/*.d.ts` (generate.mjs:25, 148-150), so a React build must precede docgen after editing command-palette.tsx. Hard guard `EXPECTED_COMPONENTS = 78` (generate.mjs:218-223) fails on stale/partial dist.
- Categories come from `handoff/components/*/*.d.ts` (generate.mjs:26, 97-111); CommandPalette is category "Navigation" (props.json:2665) — no handoff change expected for a prop addition.

**Changeset:** `.changeset/explicit-modal-return-focus.md:5` — "Add explicit `returnFocusTo` support for Dialog and Drawer…" — wording is Dialog/Drawer only; extending to CommandPalette implies a new/updated changeset.

## Files

Read (anchors exact):
- `packages/react/src/command-palette/command-palette.tsx` — props 56-87; PanelProps.captureOpener 174; open/capture effect 214-220; trap/scroll 222-223; captureOpener 426-428; restore effect 430-434; overlay div 499-514; inline wiring 479-488, 492.
- `packages/react/src/internal/use-return-focus.ts` — full; options 6-11, owner 13-15, eligibility 36-56, hook 62-118.
- `packages/react/src/dialog/dialog.tsx` — prop 60, initial-focus+capture 125-132, hook call 270, capture threading 306.
- `packages/react/src/drawer/drawer.tsx` — prop 41, hook call 187, capture threading 211.
- `packages/react/src/command-palette/command-palette.browser.test.tsx` — 239-263 (restore), 194-237 (inline focus model), 311-340 (hotkey).
- `packages/react/src/command-palette/command-palette.ssr.test.ts` — 8-33.
- `packages/react/src/internal/use-return-focus.browser.test.tsx` — 12-16, 67-301 (grep-verified anchors).
- `packages/react/src/dialog/dialog.browser.test.tsx` — 322-363, 461-520 (grep-verified anchors).
- `packages/react/src/drawer/drawer.browser.test.tsx` — 198, 214, 227, 263, 281, 311 (grep-verified anchors); `drawer.ssr.test.ts:21-32`.
- `apps/docs/components/examples/command-palette/{inline,trigger,hints}.tsx` (full); `apps/docs/components/examples/index.ts:65-66, 116, 452-454` (registry).
- `apps/docs/components/command-menu.tsx` (full).
- `apps/docs/content/docs/en/components/command-palette.mdx` (full); `pt-BR` 40-69; `en/dialog.mdx` 39-80 & `en/drawer.mdx` 36-95 via grep+read; `pt-BR/dialog.mdx`, `pt-BR/drawer.mdx` anchors via grep.
- `tools/docgen/generate.mjs` (full); `tools/docgen/output/props.json` 1042-1046, 1099-1103, 2664-2744; `output/llms.txt:1277`.
- `.changeset/explicit-modal-return-focus.md`; `package.json:22-24`; `.batuta/specs/2026-09-08-modal-return-focus-design.md` and `.batuta/v1-return-focus-task{1,2,3}-brief.md` anchors via grep only (context docs).

Not read (per constraints): `packages/react/dist/**`, `node_modules`, executor logs under `.batuta/runs/` bodies (only grep anchors).

## Evidence

- CommandPalette capture-before-focus: `captureOpener?.(document.activeElement)` precedes `requestAnimationFrame(() => inputRef.current?.focus())` — command-palette.tsx:216-218; structurally mirrors Dialog's `captureOpener(panel.ownerDocument.activeElement)` then focus — dialog.tsx:129-131.
- Restore-on-close-transition parity: CommandPalette `if (open || inline) return; … openerRef.current.focus()` (430-434) vs hook `if (open || !wasOpen) return; … target.focus({ preventScroll: true })` (use-return-focus.ts:87-109). Same trigger point (the `open` false render, while panel still mounted via `usePresence`), different guard surface and focus call.
- Hook requires `overlayRef` typed `RefObject<HTMLElement | null>` (use-return-focus.ts:10) and uses it only for containment exclusion (line 44); CommandPalette overlay div has no ref today (command-palette.tsx:499).
- Non-forwarding precedent: `expect(panel()!.getAttribute('returnFocusTo')).toBeNull()` (dialog.browser.test.tsx:352; drawer.browser.test.tsx:227) — prop is consumed, never DOM-forwarded; same must hold for CommandPalette.
- SSR safety precedent: hook never evaluated server-side — drawer.ssr.test.ts:21-32 asserts resolver not called and not in HTML; CommandPalette SSR test has no equivalent (gap).
- Generated-catalog asymmetry: props.json has `returnFocusTo` for Dialog (1042) and Drawer (1099), not CommandPalette (2664-2744); docgen derives from dist declarations (generate.mjs:148-150), so props.json drift is a symptom, fixed by rebuild + `pnpm run docgen`.
- Docs asymmetry: dialog.mdx:48-55 and drawer.mdx:52-61 carry the full resolver contract paragraph; command-palette.mdx:51 / pt-BR 50 still say only "restores focus to the element that opened the palette".
- Approved-plan context: WORK.md:14-16 confirms Dialog (00d2ded), Drawer (9f0844d), and public examples/docs (ce6d022) already migrated; CommandPalette was not part of that plan — docs mdx 57 line states the site intentionally owns the ⌘K shortcut (command-palette.mdx:56-57), so hotkey-open is a real composition here.

## Uncertain

- Exact React build command that must precede `pnpm run docgen` was not verified (didn't read package.json scripts beyond the grep hits; likely `build` in packages/react). Ambiguous, unconfirmed.
- Whether `docgen:alpine`/`docgen:blade` outputs carry any focus-restore prose that would also need regeneration was not checked (alpine-llms.txt / blade-llms.txt unread). React-only prop makes this unlikely but unverified.
- Whether the maintainer intends the inline+`open` contradiction (inline true, open toggles) to keep its current silent no-op or to adopt the hook's dev warning — a policy decision the report flags (mismatch 4) but cannot resolve from code alone.
- Whether the changeset should be extended vs a new one added is repo-convention dependent (single patch changeset exists for Dialog/Drawer; not decidable read-only).
- `use-return-focus.browser.test.tsx` interior details (line-by-line assertions) were verified only via grep anchors, not full read; test-name wording beyond those lines not quoted.

