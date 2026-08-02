# Lot 6c-c/4 — FAQ and CTA

Sits on top of `.batuta/brief-6cc-landing.md` — the honesty rules, the `.lw-*` cut criterion,
the conventions, the gates, the evidence contract and the boundaries in it apply unchanged.
Read it first, in full.

## Goal

Add the landing's last two content sections, after `<Community />` in
`apps/site/app/[lang]/page.tsx`:

1. **FAQ** — `<section id="faq" className="lw-section lw-section--alt">`
2. **CTA** — `<section className="lw-cta">` (its own dark band, no `lw-section`)

The header already links `#faq`.

**The copy below is final and was written for this lot.** Do not paraphrase it, do not
"improve" it, and do not translate one locale from the other — both are given. Put it in the
message files verbatim.

## Why the kit's version could not be ported

`handoff/ui_kits/website/sections-marketing.jsx` lines 141–178 hold the original. **Three of
its five FAQ answers sell a Pro plan**, the subtitle sends people to Discord, and the CTA is
"Comece pelo Community. Fique pelo que ele te poupa." — a funnel line for a product with
tiers. There is no Pro, no Discord and no Community edition. The section is rewritten, not
adapted.

Take **only** the layout and CSS from the kit: the two-column FAQ (`.lw-faq`, collapsing to
one column at 900px), and the CTA band (`.lw-cta`, `.lw-cta__inner`, `.lw-cta__mark`,
`.lw-cta__title`, `.lw-cta__ghost`) from `index.html` lines 132–141.

## FAQ

Left column: eyebrow, `h2`, and a short line. Right column: an `Accordion`.

`Accordion` takes `items` of `{ id, title, content }` plus `defaultOpen`. Open the first item
by default. The content strings contain no markup — plain text.

### The copy — English

Eyebrow: `FAQ`
Title: `Questions before you adopt it`
Lead: `Nothing here is behind a login. If your question is missing, open a discussion.`

| id           | title                                        | content                                                                                                                                                                                                                                                                                                                                                |
| ------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `commercial` | `Can I use it commercially, for free?`       | `Yes. Every part of Lyra — components, tokens and themes — is MIT licensed. There is no paid tier, no component behind a paywall, and nothing that expires. Commercial use, modification and redistribution are all covered by the licence.`                                                                                                           |
| `frameworks` | `How does the multi-framework support work?` | `The appearance lives entirely in .lyra-* classes, shipped as plain CSS with no build step. A framework package is a thin wrapper that maps props onto those classes. So the stylesheet already works in Vue, Blade, LiveView or hand-written HTML today — React is simply the wrapper package that exists so far.`                                    |
| `theming`    | `Can I customise the theme?`                 | `Yes, and it needs no build step. Light and dark come from a single data-theme attribute. Re-branding means overriding four tokens — --brand, --brand-contrast, --brand-radius and --brand-font — and the whole accent ramp is derived from them. The white-label guide walks through it.`                                                             |
| `a11y`       | `Are the components accessible?`             | `Accessibility is part of each component's acceptance criteria, not a pass at the end. Every component is rendered in light and dark and scanned with axe on each change, and the contrast of the token palette was checked in Chromium, Firefox and WebKit — 16 base colours across both themes, none below AA.`                                      |
| `maturity`   | `Is it ready for production?`                | `It is a 0.x release, and the version says exactly what that means: usable, not yet frozen. The API can still change before 1.0, so pin the version you install — every change ships through a changeset with its own changelog entry. The components come from a single design handoff and are tested in a real browser rather than a simulated DOM.` |

### The copy — pt-BR

Eyebrow: `FAQ`
Title: `Perguntas antes de adotar`
Lead: `Nada aqui está atrás de login. Se faltou a sua, abra uma discussão.`

| id           | title                                          | content                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commercial` | `Posso usar comercialmente sem pagar?`         | `Sim. Cada parte do Lyra — componentes, tokens e temas — é licenciada sob MIT. Não existe plano pago, componente atrás de paywall, nem nada que expire. Uso comercial, modificação e redistribuição estão todos cobertos pela licença.`                                                                                                        |
| `frameworks` | `Como funciona o suporte a vários frameworks?` | `A aparência vive inteira em classes .lyra-*, entregues como CSS puro e sem etapa de build. Um pacote de framework é um wrapper fino que mapeia props nessas classes. Ou seja, a folha de estilos já funciona em Vue, Blade, LiveView ou HTML escrito à mão hoje — o React é só o wrapper que existe até agora.`                               |
| `theming`    | `Dá para customizar o tema?`                   | `Dá, e sem etapa de build. Claro e escuro saem de um único atributo data-theme. Trocar de marca é sobrescrever quatro tokens — --brand, --brand-contrast, --brand-radius e --brand-font — e toda a rampa de destaque é derivada deles. O guia de white-label mostra o caminho.`                                                                |
| `a11y`       | `Os componentes são acessíveis?`               | `Acessibilidade faz parte do critério de aceite de cada componente, não de uma passada no fim. Todo componente é renderizado em claro e escuro e varrido com axe a cada mudança, e o contraste da paleta foi conferido em Chromium, Firefox e WebKit — 16 cores-base nos dois temas, nenhuma abaixo de AA.`                                    |
| `maturity`   | `Está pronto para produção?`                   | `É um release 0.x, e a versão diz exatamente o que isso significa: usável, ainda não congelado. A API pode mudar antes da 1.0, então fixe a versão que instalar — toda mudança sai por um changeset com sua própria entrada de changelog. Os componentes vêm de um handoff único e são testados em navegador de verdade, não em DOM simulado.` |

### Every claim above is verified — do not soften or embellish

- MIT: `LICENSE` at the repo root.
- Four brand tokens: `packages/styles/tokens/brand.css`.
- `data-theme`: `packages/styles/tokens/colors.css`.
- axe on each change: 50 test files in `packages/react/src` exercise it.
- Three engines, 16 colours, none below AA: recorded in `WORK.md` under § Débito técnico,
  resolved 2026-07-31.
- Changesets: `.changeset/` at the repo root.

If you believe any of these is wrong, **stop and report it** rather than watering down the
sentence.

## CTA

The kit's dark band, with new copy.

- Title EN: `Install in a minute. Use it forever.`
- Title pt-BR: `Instale em um minuto. Use para sempre.`
- Primary button → the docs origin (`DOCS_ORIGIN` from `@/lib/links`), label
  `Read the documentation` / `Ler a documentação`.
- Secondary (ghost) button → `https://github.com/lyra-ds/lyra`, label `Star on GitHub` /
  `Dar uma estrela no GitHub`.
- The light mark (`/lyra-mark-light.svg`, already in `apps/site/public/`) above the title,
  `alt=""` — it is decoration next to a heading that already says the name.

**The band is dark in both themes.** It sits on `--indigo-950` and does not follow
`data-theme`, so it is the one place on this page where the light theme does not protect you:
check the contrast of the title, both button labels and the ghost button's border **in the
light theme too**. The shared brief calls this out; this is the section it was written for.

## Acceptance criteria

1. Both sections render on `/en` and `/pt-BR`, every string from the message files, verbatim
   as given above.
2. `#faq` scrolls from the header link.
3. The first FAQ item is open on load; the others open and close by mouse and by keyboard.
4. **No answer mentions a paid plan, a Pro tier, Discord, or cancelling anything.** Grep the
   built HTML for `Pro`, `Discord`, `paywall`, `plano` and report what you find.
5. The CTA band renders dark in **both** themes, and `axe.run` is clean on the page in both —
   report the contrast results for the band specifically.
6. `axe.run` clean on both locale pages in both themes, with the accordion **open and closed**
   — a collapsed panel is a panel you did not scan.
7. The FAQ is two columns above 900px and one below; measured in a browser.
8. Still exactly one `<h1>`; the FAQ and CTA titles are `h2`.
9. The four CI jobs' commands run, with real output reported and anything unrunnable named.

## Boundaries

- **Do not touch `packages/`.**
- Do not touch `apps/docs/`.
- Do not change the Hero, showcase, frameworks, theming, community, header or footer.
- Do not build the CookieBanner — that is lot 5.
- Do not rewrite the copy given above.
- Do not commit, branch or push.
