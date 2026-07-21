# Plan: Fase 6 — Docs Site (Bilíngue)

Importado do roadmap GSD em 2026-07-20. Depende da Fase 5.

**Goal**: devs aprendem, avaliam e adotam Lyra num site EN + pt-BR que
dogfooda o próprio sistema.

**Requirements**: DOC-01..DOC-10

## Critérios de sucesso

1. Getting-started (install → import CSS → primeiro componente) em <5 min,
   EN ou pt-BR.
2. Página por componente (40) com preview vivo, prop table gerada e código
   copiável, nos dois idiomas.
3. Guia white-label com demo multibrand vivo (3 brands × light/dark); página
   HTML pura mostrando `.lyra-*` sem React; página compat-shadcn documentando
   o mapeamento opt-in.
4. Site estilizado 100% com `@lyra-ds/styles` + `@lyra-ds/react`, theme
   switcher, busca client-side, landing adaptada de `ui_kits/website` (sem
   pricing/testimonials fictícios).
5. Rotas EN (default) + pt-BR com fallback de locale; `/llms.txt` como texto
   puro; deploy Vercel com previews por PR.

## Riscos herdados

- Stack decidido: Next.js 16 + fumadocs-core headless (NUNCA fumadocs-ui);
  Astro Starlight é o fallback documentado.
- Flag de pesquisa: fumadocs-core headless com design system próprio tem só
  um exemplo comunitário (confiança LOW) — validar i18n routing + next-intl
  cedo; recomendação do GSD era scaffoldar o framework de docs logo após a
  Fase 3 para de-riscar.
