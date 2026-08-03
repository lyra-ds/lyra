# UI kit · Lyra Website

Site do próprio Lyra DS, em duas páginas com domínios distintos:

- `index.html` — **Landing (lyra-ds.dev)**: apresenta o Lyra sem área comercial — hero, showcase com tabs preview/código, frameworks, seção de temas/tokens (white-label), comunidade (GitHub, Discussions, docs), FAQ e CTA final. Header enxuto: só GitHub + CTA "Documentação"; dark mode via ThemeProvider.
- `docs.html` — **Docs (docs.lyra-ds.dev)**: referência do site de documentação — header próprio (busca, link de volta para lyra-ds.dev), sidebar com grupos, conteúdo com breadcrumb, blocos de código e navegação anterior/próxima.
- `site.css` — estilos compartilhados das duas páginas.
- `sections.jsx` — `SiteHeader`, `Hero`, `Frameworks`, `ComponentShowcase`, `SiteFooter`.
- `sections-community.jsx` — `ThemingSection`, `CommunitySection`, `FAQSection`, `CTASection`.
- `docs.jsx` — `DocsHeader`, `DocsPage`, `DocsFooter`.

Sem pricing/plano Pro e sem Discord: o posicionamento é 100% open source (MIT), comunidade via GitHub (issues + Discussions). O site dogfooda os componentes do DS — layout com `Container`/`Stack`/`Inline`/`Grid`, tema com `ThemeProvider` — e o CSS próprio (`site.css`) cobre só o visual das seções. Links "Documentação" apontam para `docs.html` (em produção, `https://docs.lyra-ds.dev`).
