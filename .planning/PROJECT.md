# Lyra Design System (lyra-ds)

## What This Is

Lyra DS é um design system open source, CSS-first e white-label para produtos SaaS, criado para facilitar a vida de desenvolvedores dos mais variados frameworks. Este projeto converte o design handoff completo (protótipos de alta fidelidade em HTML/JSX, 209 tokens, 40 componentes — em `handoff/`) em uma biblioteca real publicável no npm, sob uma nova org GitHub (`lyra-ds`), com monorepo pnpm, site de documentação bilíngue e pipeline de releases.

## Core Value

Qualquer desenvolvedor consegue instalar `@lyra-ds/styles` + `@lyra-ds/react` e ter uma UI pixel-perfect, tematizável (light/dark + white-label em 4 tokens), com o mesmo CSS core reutilizável em outros frameworks.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] `@lyra-ds/styles` 0.1.0 publicado: CSS puro (209 tokens + CSS dos 40 componentes), exports `./styles.css` + `./tokens/*`, compat-shadcn opt-in fora do entry
- [ ] `@lyra-ds/react` 0.1.0 publicado: 40 componentes TS convertidos dos protótipos com os `.d.ts` como contrato, ESM+CJS via tsup, tree-shakeable, peerDeps react/react-dom >=18
- [ ] Fidelidade pixel-perfect: tokens, estados e classes `.lyra-*` idênticos ao handoff (são a API pública compartilhada)
- [ ] Correções obrigatórias da conversão: Icon sem CDN, FileUpload com API real, portals em Dialog/Drawer/CommandPalette, SSR-safety, a11y completa (focus trap, aria-activedescendant, restauração de foco)
- [ ] Site de docs com o design de `ui_kits/website`, bilíngue EN + pt-BR, preview ao vivo dos componentes, deploy na Vercel
- [ ] `llms.txt` gerado no build a partir dos `.d.ts` e servido em `/llms.txt`
- [ ] Testes de fumaça (render dos 40, teclado em Combobox/CommandPalette/Dropdown, tema escuro) + a11y automática (axe-core)
- [ ] Org GitHub `lyra-ds` configurada (avatar/profile de `handoff/assets/github/`), repo público, MIT, CONTRIBUTING.md, Code of Conduct, CI GitHub Actions, changesets

### Out of Scope

- Adapters Vue/Svelte/Web Components (Zag.js) — fase 2, o core CSS já foi desenhado para viabilizá-los
- Registry estilo shadcn (`npx shadcn add @lyra/button`) — fase 2, reaproveita os mesmos fontes
- MCP server — fase 2 do plano LLM-first
- Preset Tailwind — pacote satélite futuro; core é CSS puro sem Tailwind (decisão travada)
- Set de ícones proprietário — Lucide é o sistema; um set próprio seguiria a mesma gramática no futuro
- Ilustrações/imagens — fora da linguagem visual base

## Context

- **Fonte canônica**: `handoff/` na raiz do repo — `design_handoff_lyra_lib/README.md` é a spec de conversão; `tokens/*.css` (valores finais), `components/<grupo>/` (`.jsx` implementação de referência, `.d.ts` contrato de props com JSDoc pt-BR, `.prompt.md` exemplos de uso, `<grupo>.css`), `ui_kits/` (dashboard 6 telas, website landing+docs, auth 4 telas), `guidelines/` (14 specimens + architecture.html), `llms.txt` (referência para agentes), `assets/github/` (branding da org pronto).
- Os protótipos são referência de design/implementação — a tarefa é **recriar como biblioteca real**, não copiar arquivos.
- Não existe codebase de produção anterior, Figma ou marca externa — tudo nasceu no projeto de design.
- Conteúdo: voz direta com "você", sentence case, sem emoji, ícones Lucide, botões verbo+objeto; API/código em inglês.
- O handoff foi escrito para docs pt-BR; a decisão de docs bilíngues EN+pt-BR amplia o alcance global (EN passa a existir junto).

## Constraints

- **Arquitetura**: CSS-first — aparência 100% em classes `.lyra-*`; React é wrapper fino. É o que viabiliza multi-framework. Decisão travada (jul/2026).
- **Sem Tailwind no core** — decisão travada; preset Tailwind só como satélite futuro.
- **Fidelidade**: cores, tipografia, espaçamento, raios, sombras e estados são finais — preservar pixel a pixel a partir de `handoff/tokens/`.
- **Naming**: Lyra é canônico; `compat-shadcn.css` é opt-in e fica fora do entry.
- **Animação**: keyframes de entrada animam apenas transform (nunca `opacity: 0` no frame inicial).
- **Runtime**: nenhuma dependência de CDN em runtime (Icon deve embarcar Lucide localmente).
- **Fontes**: Plus Jakarta Sans + JetBrains Mono como peer (`@fontsource/*`), não embutidas.
- **Stack**: monorepo pnpm workspaces + changesets; tsup para o pacote React; peerDeps react >=18.
- **Licença**: MIT, com CONTRIBUTING.md e Code of Conduct desde o início.
- **Infra**: GitHub org `lyra-ds` (criação manual pelo usuário, guiada), npm org `lyra-ds`, docs na Vercel.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Metodologia GSD (com skills táticos de qualidade na execução) | Projeto multi-fase/multi-milestone com spec existente; GSD dá roadmap, estado persistente e gates | — Pending |
| v0.1.0 = checklist completo (styles + react + docs + npm) | Lançamento único e completo transmite maturidade para OSS | — Pending |
| Docs bilíngues EN + pt-BR desde o início | Alcance global (EN) sem abrir mão da comunidade brasileira (pt-BR era o plano original) | — Pending |
| Testes: fumaça + a11y (axe-core) | Credibilidade OSS de design system sem custo de regressão visual agora | — Pending |
| Hospedagem docs: Vercel | Preview por PR e deploy automático, grátis para OSS | — Pending |
| Licença MIT + governança completa | Padrão de facto em design systems OSS; maximiza adoção | — Pending |
| Stack do site de docs: decidir via research | Requisitos claros (preview React ao vivo, i18n, MDX, llms.txt) — research compara Astro/Next/Vite | — Pending |
| CSS puro no core, sem Tailwind | Viabiliza multi-stack (herdada do handoff, travada) | ✓ Good |
| Zag.js para comportamento multi-framework (fase 2) | State machines agnósticas vs Radix React-only (herdada do handoff) | — Pending |
| Distribuição npm primeiro; registry shadcn-style na fase 2 | Mesmos fontes servem as duas vias (herdada do handoff) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-16 after initialization*
