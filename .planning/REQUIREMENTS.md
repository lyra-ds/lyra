# Requirements: Lyra Design System (lyra-ds)

**Defined:** 2026-07-16
**Core Value:** Qualquer desenvolvedor consegue instalar `@lyra-ds/styles` + `@lyra-ds/react` e ter uma UI pixel-perfect, tematizável (light/dark + white-label em 4 tokens), com o mesmo CSS core reutilizável em outros frameworks.

## v1 Requirements

Requirements for initial release (v0.1.0). Each maps to roadmap phases.

### Fundação do monorepo e governança (OSS)

- [ ] **OSS-01**: Dev encontra no repo um README com pitch (CSS-first, white-label em 4 tokens, roadmap de adapters/registry), instalação e snippet mínimo
- [ ] **OSS-02**: Repo tem MIT LICENSE, CONTRIBUTING.md, Code of Conduct e templates de issue/PR
- [ ] **OSS-03**: Todo PR roda CI visível (lint, typecheck, testes, build, publint/attw, size-limit, scripts de paridade)
- [ ] **OSS-04**: Org GitHub `lyra-ds` configurada com avatar, profile README e social preview (assets de `handoff/assets/github/`)
- [ ] **OSS-05**: Política de versionamento 0.x documentada: 0.MINOR = breaking, e a API declarada inclui props, classes `.lyra-*` e nomes de tokens

### Pacote de estilos (`@lyra-ds/styles`)

- [ ] **STY-01**: Dev instala `@lyra-ds/styles` e importa um único entry (`styles.css`) para obter todos os tokens + estilos dos 40 componentes
- [ ] **STY-02**: Dev importa arquivos de tokens individualmente via subpath exports `./tokens/*`
- [ ] **STY-03**: Dev alterna light/dark apenas com `data-theme="dark"` no `<html>`, sem rebuild
- [ ] **STY-04**: Dev cria uma marca definindo 4 tokens (`--brand`, `--brand-contrast`, `--brand-radius`, `--brand-font`) sob `[data-brand]`, com hover/active/soft/focus-ring derivados via `color-mix` em light e dark
- [ ] **STY-05**: Dev opta pela interop shadcn importando `compat-shadcn.css` separadamente (fica fora do entry padrão)
- [ ] **STY-06**: Script de paridade no CI garante 100% dos tokens do handoff presentes com valores idênticos
- [ ] **STY-07**: Pacote publica com `"sideEffects": ["**/*.css"]` e exports map válido (publint verde) — CSS nunca é descartado por tree-shaking do consumidor

### Pacote React (`@lyra-ds/react`)

- [ ] **RCT-01**: Dev instala `@lyra-ds/react` (peerDeps react/react-dom >=18) e usa os 40 componentes com TypeScript completo
- [ ] **RCT-02**: Cada componente emite exatamente as classes `.lyra-*` do handoff (asserções de paridade nos testes) — são a API pública compartilhada
- [ ] **RCT-03**: Importar um componente não puxa os demais (um arquivo por componente, `sideEffects: false`, zero imports de CSS no pacote — regra verificada no CI)
- [ ] **RCT-04**: Build dual ESM+CJS com types (tsup) validado por publint + attw e testado em apps scratch Vite e Next.js
- [ ] **RCT-05**: Icon renderiza Lucide de dependência local (sem CDN) com registry curado — sem embarcar os ~1.400 ícones (gate de size-limit no CI)
- [ ] **RCT-06**: Dialog, Drawer, CommandPalette e Toast renderizam via portal em `document.body` com guarda SSR
- [ ] **RCT-07**: Os 40 componentes renderizam via `renderToString` sem crash (SSR-safe: sem `document`/`window`/`localStorage` em escopo de módulo)
- [ ] **RCT-08**: FileUpload expõe API real (`onFiles(files)` + `items`/`onChange` controlados); simulação de progresso vira modo demo opcional
- [ ] **RCT-09**: Componentes com estado seguem o contrato controlled/uncontrolled dos `.d.ts` (value/onChange + defaultValue)
- [ ] **RCT-10**: JSDoc dos componentes convertido para inglês canônico (alimenta autocomplete, prop tables e llms.txt)

### Acessibilidade (A11Y)

- [ ] **A11Y-01**: Dialog, Drawer e CommandPalette prendem o foco enquanto abertos, fecham com Esc e restauram o foco ao elemento de origem em todos os caminhos de fechamento
- [ ] **A11Y-02**: Combobox e CommandPalette implementam o padrão APG de listbox com `aria-activedescendant` e navegação completa por teclado
- [ ] **A11Y-03**: axe-core passa sem violações nos 40 componentes, em tema claro e escuro
- [ ] **A11Y-04**: Navegação por teclado dos componentes interativos (Tabs, Dropdown, Accordion, Stepper, Pagination, Switch etc.) coberta por testes reais de teclado em Browser Mode

### Geração de docs e LLM-first (GEN)

- [ ] **GEN-01**: `llms.txt` é gerado no build a partir dos `.d.ts` (regras de geração + tokens + API dos 40 componentes) e servido em `/llms.txt` no site
- [ ] **GEN-02**: Prop tables das páginas de componente vêm da mesma extração dos `.d.ts` — nenhuma tabela mantida à mão

### Site de documentação (DOC)

- [ ] **DOC-01**: Dev segue o getting-started (install → import do CSS → primeiro componente) em menos de 5 minutos, em EN e pt-BR
- [ ] **DOC-02**: Cada um dos 40 componentes tem página com preview ao vivo, prop table gerada e código copiável, em EN e pt-BR
- [ ] **DOC-03**: Guia de white-label documenta o contrato de 4 tokens com demo multibrand ao vivo (3 marcas × light/dark)
- [ ] **DOC-04**: Site tem theme switcher light/dark e é estilizado inteiramente com `@lyra-ds/styles` + `@lyra-ds/react` (dogfooding)
- [ ] **DOC-05**: Dev busca componentes e páginas via busca client-side
- [ ] **DOC-06**: Página de uso plain-HTML mostra as classes `.lyra-*` funcionando sem React
- [ ] **DOC-07**: Página compat-shadcn documenta o mapeamento opt-in de tokens
- [ ] **DOC-08**: Landing page adaptada do design (hero, showcase com tabs preview/código, frameworks, FAQ, CTA) sem o pricing/depoimentos fictícios
- [ ] **DOC-09**: Site roteia EN (default) + pt-BR com fallback de locale, estrutura i18n definida no setup do framework
- [ ] **DOC-10**: Site deployado na Vercel com preview deployments por PR

### Pipeline de release (REL)

- [ ] **REL-01**: `@lyra-ds/styles` e `@lyra-ds/react` 0.1.0 publicados no npm com `access: public`, após dry-run (pack → inspeção do tarball → install em apps scratch)
- [ ] **REL-02**: Releases automatizadas via changesets (Version Packages PR → publish com OIDC trusted publishing ou fallback documentado) + GitHub Releases com changelog

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Fase 2 (já planejada no handoff)

- **F2-01**: Adapters Vue/Svelte/Web Components via Zag.js sobre o mesmo CSS core
- **F2-02**: Registry estilo shadcn (`npx shadcn add @lyra/button`) reaproveitando os mesmos fontes
- **F2-03**: MCP server para agentes
- **F2-04**: Preset Tailwind como pacote satélite

### Pós-validação (v0.x)

- **PV-01**: Algolia DocSearch (após aprovação do programa OSS)
- **PV-02**: Playground editável ao vivo (Sandpack ou similar)
- **PV-03**: Testes de regressão visual (quando surgirem contribuições externas)
- **PV-04**: Guia de localização de strings de componentes via props

## Out of Scope

| Feature | Reason |
|---------|--------|
| Theme-object API estilo Mantine | Contradiz a história white-label de 4 tokens; escape hatch é o próprio CSS |
| God-components (Table com sort/filter/paginação embutidos) | Failure mode documentado; composição via recipes nos docs |
| Set de ícones proprietário | Lucide é o sistema; custo de design contínuo injustificado |
| Ilustrações/imagens decorativas | Fora da linguagem visual base do Lyra |
| Sistema de i18n runtime nos componentes | ~3 componentes têm strings; props de string resolvem |
| Tailwind no core | Decisão travada — CSS puro viabiliza multi-stack |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OSS-01 | Phase 1 | Pending |
| OSS-02 | Phase 1 | Pending |
| OSS-03 | Phase 1 | Pending |
| OSS-04 | Phase 7 | Pending |
| OSS-05 | Phase 1 | Pending |
| STY-01 | Phase 2 | Pending |
| STY-02 | Phase 2 | Pending |
| STY-03 | Phase 2 | Pending |
| STY-04 | Phase 2 | Pending |
| STY-05 | Phase 2 | Pending |
| STY-06 | Phase 2 | Pending |
| STY-07 | Phase 2 | Pending |
| RCT-01 | Phase 4 | Pending |
| RCT-02 | Phase 4 | Pending |
| RCT-03 | Phase 3 | Pending |
| RCT-04 | Phase 3 | Pending |
| RCT-05 | Phase 3 | Pending |
| RCT-06 | Phase 4 | Pending |
| RCT-07 | Phase 4 | Pending |
| RCT-08 | Phase 4 | Pending |
| RCT-09 | Phase 4 | Pending |
| RCT-10 | Phase 4 | Pending |
| A11Y-01 | Phase 4 | Pending |
| A11Y-02 | Phase 4 | Pending |
| A11Y-03 | Phase 4 | Pending |
| A11Y-04 | Phase 4 | Pending |
| GEN-01 | Phase 5 | Pending |
| GEN-02 | Phase 5 | Pending |
| DOC-01 | Phase 6 | Pending |
| DOC-02 | Phase 6 | Pending |
| DOC-03 | Phase 6 | Pending |
| DOC-04 | Phase 6 | Pending |
| DOC-05 | Phase 6 | Pending |
| DOC-06 | Phase 6 | Pending |
| DOC-07 | Phase 6 | Pending |
| DOC-08 | Phase 6 | Pending |
| DOC-09 | Phase 6 | Pending |
| DOC-10 | Phase 6 | Pending |
| REL-01 | Phase 7 | Pending |
| REL-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 40 total (corrected from 31 — actual REQ-ID count)
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-16*
*Last updated: 2026-07-16 after roadmap creation (traceability populated)*
