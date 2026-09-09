## Answer
Component already owns real-focus roving (open focuses first/last command via `pendingFocus`, arrows/Home/End move real DOM focus). Remaining ownership changes for the approved contract:

1. Explicit roving tabindex. Commands are native `<button>`s with implicit `tabindex=0` (dropdown.tsx:210-224), so every command is a tab stop. Add an active-index state; render `tabIndex={active ? 0 : -1}` per command; navigation writes state + focus; open seeds active index (replacing/absorbing `pendingFocus`, dropdown.tsx:56,75-88). Tab then exits the menu natively (unmount already closes it, dropdown.tsx:132-135).
2. Consumer-cancellation order on menu items. Trigger runs the consumer `onKeyDown` before its own behavior (dropdown.tsx:153-155) and re-checks `defaultPrevented` (103). Menu items do not: item handler (target phase, 215) runs before the root bubble handler that forwards the consumer (168-172), so consumer `preventDefault` cannot precede item Escape/Tab/activation defaults. Move the "consumer first, bail if defaultPrevented" call into `handleMenuItemKeyDown` and stop the root forwarding from double-calling for menu targets (scope root forwarding to non-menu descendants or drop it).
3. Typeahead (absent today). In `handleMenuItemKeyDown`: for single printable characters, append to a buffer (ref + 500ms reset timer), match command text localized + case-insensitively, start strictly after current index, wrap once, focus match, `preventDefault`; repeated identical single chars cycle matches; Escape/arrow handling clears buffer. Extract text via `textContent` — must exclude the icon node (dropdown.tsx:221-222 renders icon before label).
4. Keep unchanged (already contract-conformant): ArrowDown/Up wrap, Home/End endpoints (120-123); trigger Enter/Space/ArrowDown→first, ArrowUp→last (104-109, effect 84); Escape restores trigger (129-131); Tab closes without preventDefault or restoration (132-135); click activation restores trigger (216-219). No new public variants, no deps, no `DropdownItem` shape change; SSR test renders `defaultOpen` so state-based tabIndex must SSR sanely.

## Files
- packages/react/src/dropdown/dropdown.tsx:55-56 — `open`, `pendingFocus` state
- packages/react/src/dropdown/dropdown.tsx:62-78 — command query, focus restore, close/open
- packages/react/src/dropdown/dropdown.tsx:80-100 — pendingFocus effect; outside-mousedown close
- packages/react/src/dropdown/dropdown.tsx:102-136 — trigger + item keydown handlers
- packages/react/src/dropdown/dropdown.tsx:144-157 — trigger props, consumer-first ordering
- packages/react/src/dropdown/dropdown.tsx:163-172 — root onKeyDown forwarding
- packages/react/src/dropdown/dropdown.tsx:198-225 — item render (tabIndex source, icon+label)
- packages/react/src/dropdown/index.ts:1-2 — public exports (no change needed)
- packages/react/src/dropdown/dropdown.browser.test.tsx:87-109 — arrows wrap, Home/End, Escape restore, ArrowUp reopen last
- packages/react/src/dropdown/dropdown.browser.test.tsx:111-132 — select restores trigger; Tab leaves menu
- packages/react/src/dropdown/dropdown.browser.test.tsx:53-77 — one tab stop, ARIA on trigger element
- packages/react/src/dropdown/dropdown.ssr.test.ts:7-17 — SSR open menu, no browser globals

## Evidence
- Trigger cancellation-first: `dropdown.tsx:103` `if (event.defaultPrevented) return;` and `:154-155` `onKeyDown?.(...); handleTriggerKeyDown(event);`
- Item defaults before consumer: `dropdown.tsx:215` `onKeyDown={handleMenuItemKeyDown}` (target) vs `:171` root `onKeyDown?.(event)` (bubble) — order inverted vs trigger.
- No roving tabIndex: `dropdown.tsx:210-214` `<button ... role="menuitem" ...>` — no `tabIndex` prop.
- Tab contract: `dropdown.tsx:133-134` `// Do not prevent Tab: closing must leave native sequential focus navigation intact.` `closeMenu();`
- Escape contract: `dropdown.tsx:129-131` `closeMenu(true)` → `triggerRef.current?.focus()` (66-67).
- Open-last via ArrowUp: `dropdown.tsx:84` `const index = pendingFocus < 0 ? commands.length - 1 : pendingFocus;`
- Existing tests already cover keyboard/Tab/Escape: browser.test 94-97 (wrap), 98-101 (Home/End), 102-104 (Escape→trigger), 106-108 (ArrowUp→last), 127-131 (Tab closes, focus leaves item). No typeahead test exists.

## Uncertain
- "Localized compare" is ambiguous: `localeCompare`-based startsWith vs `toLocaleLowerCase` prefix equality; affects diacritic behavior. Contract text supports either.
- Text extraction source: `textContent` includes icon glyphs if icons carry text; contract says "item text" — unclear whether label-only extraction is required.
- Whether `pendingFocus` is replaced by active-index state or kept as seed-only; both satisfy the contract, exact internal shape unpinned.
- Root `onKeyDown` forwarding intent (dropdown.tsx:160-161) suggests per-descendant consumer contract; whether removing menu targets from it counts as public behavior change (root handler semantics are `HTMLAttributes` passthrough) is a judgment call.
- Activation path uses `onClick` (216-219); whether keyboard Enter/Space activation must also pass the consumer-cancellation gate via keydown vs click ordering is not fully specified.
