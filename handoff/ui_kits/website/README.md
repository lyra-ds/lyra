# UI kit · Lyra Website

Landing page + docs do próprio Lyra DS.

- `index.html` — site interativo com duas páginas: **Landing** (hero, showcase com tabs preview/código, frameworks, pricing Community/Pro com ciclo mensal/anual + dialog de checkout, comparação de recursos, depoimentos, FAQ em Accordion, CTA final e banner de cookies LGPD) e **Docs** (sidebar de tópicos + conteúdo). Tema claro/escuro persistente.
- `sections.jsx` — `SiteHeader`, `Hero`, `Frameworks`, `ComponentShowcase`, `SiteFooter`.
- `sections-marketing.jsx` — `PricingSection`, `Testimonials`, `FAQSection`, `CTASection`.
- `docs.jsx` — `DocsPage` (sidebar + conteúdo).

Composto com os primitivos de `components/` via `window.LyraDesignSystem_e82d95`.
