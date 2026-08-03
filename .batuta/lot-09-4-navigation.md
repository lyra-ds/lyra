# Lote 09-4 — Onda 4: AppSidebar e BottomNav

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum.

<task>
1. `AppSidebar` — handoff/components/navigation/AppSidebar.{d.ts,jsx,prompt.md}.
   The app-shell sidebar: brand slot, groups, footer slot, `width` (260
   default) and the 64px icon-only RAIL mode with native tooltips (the
   SidebarGroup `title` delta shipped for exactly this).
2. `BottomNav` — NO reference .jsx (one of the map's "CSS + llms.txt contract"
   trio): its CSS is complete at the end of
   packages/styles/components/navigation/navigation.css and its contract is
   in handoff/llms.txt (search "### BottomNav"). Reconstruct — it is trivial.
</task>

## Pinned trap (from the map — binding)

The handoff AppSidebar is data-driven (`groups[].items[]`, each item a
`<button>`). The repo's docs sidebar DELIBERATELY passes Next `<Link>`
children through `SidebarGroup` to keep client-side navigation, prefetch,
open-in-new-tab and copy-link — `<button>` gives none of that. REQUIREMENT:
`AppSidebar` accepts `children` with the same contract as `SidebarGroup`
(compose it), with the data-driven `groups` prop as the convenience layer on
top — NOT the only door. If the `.d.ts` declares only `groups`, extend it
with `children` and JSDoc the two modes; the docs app must be able to
dogfood it later without losing `<Link>`s.

## Acceptance criteria

1. AppSidebar: both modes tested in Browser Mode — expanded (brand + groups +
   footer, 260px via custom property per the layout-wrapper doctrine if the
   reference uses inline width) and rail (64px, labels visually hidden,
   native `title` tooltips present on items); children-mode renders anchors
   intact (assert an `<a href>` child survives as an anchor).
2. BottomNav matches its llms.txt contract and renders the navigation.css
   classes; active item semantics per the contract (aria-current).
3. i18n per the phase law; light+dark axe clean; SSR tests; wiring complete
   ×2 (docgen 68 → 70); changeset minor. Report the docgen count.

## Stop conditions

A `.lyra-*` class missing; the rail tooltip mechanism conflicting with the
SidebarGroup delta; same command failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>

## RETRY FEEDBACK (accepted review findings — fix exactly these two)

1. HIGH — data-mode `items[].label` is typed ReactNode but the rail derives
   `title`/accessible name only from strings: a ReactNode label yields an
   unnamed 64px button. The map already decided this trade-off: NARROW the
   data-item `label` to `string` (compile-time guarantee of the rail name,
   consistent with SidebarGroup's string label + its test). JSDoc the reason;
   consumers needing rich labels use the children door.
2. LOW — the toggle test only covers uncontrolled state. Add controlled
   coverage: `<AppSidebar collapsed={...} onCollapsedChange={spy}>` — the
   component must NOT self-mutate (stays expanded until the prop changes)
   and must report through the callback.

Re-run offline gates; the maestro reruns the browser suite.
