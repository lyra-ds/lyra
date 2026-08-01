# Retry — Lote 2: o exemplo do `ThemeProvider` não demonstra o `ThemeProvider`

Most of the lot is right. **Do not start over.** One defect, and it is the one the brief
warned about.

Files: `.batuta/lot-6cb3-02-system-nav.md`, `.batuta/brief-6cb3-docs.md`,
`.batuta/brief-phase06b-fanout.md`.

## What I verified independently and accepted

Eight pages build and serve in both locales with their prop tables. `typecheck`, `lint` and
`build` pass. The `system` group is wired in all four places.

**The theme-safety requirements hold** — this is the part that most easily goes wrong and it
did not:

```
storage key do docs: lyra-docs-theme   (o exemplo usa outra)
host carrega dark → frames espelham dark
depois de interagir com os exemplos:
  host:    dark   (inalterado)
  storage: [["lyra-docs-theme","dark"]]   (inalterado)
```

The reader's theme and stored preference survive the page. `Navbar`, `Footer` and
`TableOfContents` are clean, and the TOC example avoided the duplicate-name trap.

## The defect: the mirror always wins, so the example's own toggle does nothing

Measured in a real browser, on the built page:

```
host light → clico "Light" no exemplo → frame html=light   (ok, mas era o que já estava)
host light → clico "Dark"  no exemplo → frame html=light   ✗
host dark  → clico "Light" no exemplo → frame html=dark    ✗
```

The frame follows the **host** in both directions, never the example's control. And the
second example says so out loud: its text reads _"Preference: system; applied theme: light"_
while the frame's `documentElement` carries `dark`. **The status text contradicts what is
rendered.**

This is exactly the conflict the lot brief named — the isolated preview mirrors the host's
`data-theme`, and `ThemeProvider` owns that attribute inside the frame. Two writers, one
attribute. You resolved it in the mirror's favour, which makes the `ThemeProvider` page unable
to demonstrate `ThemeProvider`: its toggle is inert and its readout lies.

The brief's first required statement was: _"Toggling the theme inside the example changes the
example, and nothing outside it."_ That is the one to fix. The other two — the host toggle not
stranding the example, and the reader's preference surviving — already hold and must keep
holding.

The likely shape of the answer is that an example which brings its own `ThemeProvider` opts
out of mirroring (it is its own theme authority), while every other isolated example keeps
mirroring. Implement whatever you judge correct, and state it.

## Also: your previews were never audited, and now they are

`axe.run(document)` **does not descend into iframes**. My earlier sweeps reported the host
page only, so everything inside the isolated previews was unaudited — a gap in my
verification, now closed. Running axe **inside** the frames reports:

```
theme-provider     page-has-heading-one
navbar / footer    document-title · landmark-one-main · page-has-heading-one
shell              document-title · page-has-heading-one
page-header        document-title · landmark-one-main
```

Judge these; do not fix reflexively.

- `document-title` is WCAG A and the frame is a real document. The `<title>` resolved to
  "Lyra DS" in dev, so verify whether it is missing in the **built export** and fix it there
  if so. A per-preview title would be better than a shared one.
- `landmark-one-main` and `page-has-heading-one` are best-practice rules that assume a full
  page. A preview fragment is not a page, and adding a fake `<h1>`/`<main>` to satisfy a
  linter would put the very elements back that isolation exists to keep out.

Decide per rule, implement, and **say which you dismissed and why**. A reasoned dismissal is
a fine answer; a silent one is not.

## Acceptance

1. In the example, clicking `Light` renders light and clicking `Dark` renders dark,
   regardless of the host's theme. Report the four combinations (host light/dark × click
   light/dark).
2. The second example's readout matches what is rendered.
3. Toggling the theme on the docs site does not strand the example in a stale theme, and the
   reader's `lyra-docs-theme` and site theme are untouched after interacting. Re-report this —
   it holds today and must keep holding.
4. Other isolated previews (`Shell`, `PageHeader`, `Navbar`, `Footer`) still mirror the host
   theme. Confirm one of them still follows a host toggle.
5. axe stays at zero on the host pages, at 1440/900/375 in both locales; and inside the
   frames, every remaining finding is either fixed or dismissed with a stated reason.
6. `pnpm typecheck`, `pnpm lint`, `pnpm build` pass with real output.

## Boundaries

`packages/` is read-only — `ThemeProvider` writing to `documentElement` is its contract, not a
bug to work around in the component. Do not touch Lot 3's components. Do not commit, branch or
push.
