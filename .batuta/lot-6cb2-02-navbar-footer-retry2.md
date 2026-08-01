# Retry 2 — Lote 2: uma classe apagada com consumidor vivo

Your work is in the tree and everything else is green. **Do not start over.** One defect.

Original brief: `.batuta/lot-6cb2-02-navbar-footer.md`, first retry
`.batuta/lot-6cb2-02-navbar-footer-retry.md`, shared brief `.batuta/brief-6cb2-chrome.md`.

## What I verified independently and accepted

The landmark fix works: axe is **clean** at 1440px, 900px and 375px, in both `en` and
`pt-BR`, and the landmarks now read `nav[Site navigation]` + `nav[Documentation navigation]`
(`Navegação do site` / `Navegação da documentação`). 477 React and 59 styles tests pass,
parity, `docgen --check` at 50 components, lint, typecheck, build and `size-limit` all pass.
`baseline.json` is untouched. The footer renders identically to before.

## The defect: the theme toggle lost all its styling

You deleted `.lw-nav__link` from `apps/docs/app/site.css` — correct, `NavLink` replaced it.
But **`apps/docs/components/theme-toggle.tsx` line 15 still sets
`className="lw-nav__link"`**, a class that no longer exists. The button now renders with the
browser's default `<button>` chrome: a grey box with a border, where before it was a bare
ghost icon matching the rest of the header.

I swept for others; this is the only orphan:

```
$ for c in $(grep -rhoE 'lw-[a-z0-9_-]+' apps/docs/**/*.tsx | sort -u); do
    grep -qF ".$c" apps/docs/app/site.css || echo "ORPHAN: $c"; done
ORPHAN: lw-nav__link
```

This survived my first verification too — I checked axe, overflow, landmarks and the focus
ring, and did not compare the header visually. Deleting a class is only safe once every
consumer is migrated; the sweep above is the check that proves it.

## What to fix

The theme toggle is an **icon-only button in site chrome**, and the project's dogfooding rule
says that where a design-system component exists, the docs use the component and never a raw
class. `IconButton` is that component — it already ships `variant="ghost"`, sizes, and a
`label` prop for the accessible name, which `ThemeToggle` already receives.

Migrate it, and make sure the rendered result matches what the header looked like before the
class was deleted: a borderless icon control that picks up a subtle background on hover, in
line with the other header actions. If `IconButton` cannot match that appearance, stop and
report rather than reintroducing a `.lw-*` class.

## Acceptance

1. No `.lw-*` class referenced anywhere under `apps/docs` is missing from
   `apps/docs/app/site.css`. Run the sweep above and report its output — it must be empty.
2. The theme toggle uses a design-system component, not a raw class, and keeps its accessible
   name.
3. The header renders as it did before this lot at 1440px and 375px: the toggle is a bare
   icon control, not a bordered default button.
4. Everything already green stays green: full test suite, parity, `docgen --check`,
   `lint:css`, eslint, typecheck, build, `size-limit`, and axe clean at all three viewports
   in both locales.
5. `tools/parity/baseline.json` stays untouched.

## Boundaries

Unchanged. Do not touch `Navbar`, `NavLink`, `Footer` or their CSS — they are correct. Do not
touch `.lw-search` or `command-menu.tsx`; that is Lot 3. Do not commit, branch or push.
