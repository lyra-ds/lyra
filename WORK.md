# WORK — lyra-ds

Histórico das fases 1–3 importado do GSD em 2026-07-20 (takeover). Trabalho
restante planejado em `.batuta/plan-04..07-*.md`, em ordem de dependência.

## In progress

- [ ] Fase 4 / Lote C2 — 2 widgets restantes (Dropdown menu-button, Combobox APG activedescendant); gate APG cumprido (`.batuta/research-apg-focus-models.md`). Aplicar regra CONVENTIONS "inline layout do handoff → classe `.lyra-*`" no Dropdown (inline-flex no trigger).

## Next

- [ ] Alinhar Checkbox/Radio/Switch à fidelidade do handoff — wrapper `<label>` de linha inteira (`.lyra-check-row` / `.lyra-switch`) em vez de `<span>` + `htmlFor` só no texto (decisão do usuário, 2026-07-21)
- [ ] Fase 4 — Component Batch Conversion & A11y (`.batuta/plan-04-component-batch-conversion-a11y.md`; pesquisa APG antes de delegar)
- [ ] Fase 5 — Docgen & llms.txt (`.batuta/plan-05-docgen-llms.md`)
- [ ] Fase 6 — Docs Site bilíngue (`.batuta/plan-06-docs-site-bilingue.md`)
- [ ] Fase 7 — Release Pipeline & Launch (`.batuta/plan-07-release-pipeline-launch.md`)

## Done

- [x] Fase 4 / Lote C1 — 6 componentes (Tabs, Accordion, Stepper, Pagination, Tooltip, Select nativo) → codex (`gpt-5.6-terra`, reasoning high). Maestro escalou p/ si próprio o fix de 2 testes com bug (retry do codex morreu por instabilidade de ambiente): Pagination test com off-by-one no índice do botão (contava o Prev), Tooltip test lia `data-state` sem await do flush — componentes estavam corretos (Pagination = verbatim do handoff). 254 testes, todos gates verdes. Descoberta: Select do handoff é `<select>` nativo estilizado (recipe FORM), não combobox APG. 27/40 componentes. 2026-07-21
- [x] Readequação CSS-first do Card — inline `style={{display:flex;gap}}` das ações → classe `.lyra-card__actions` (styles + parity generalizado p/ additive multi-arquivo); regra documentada em `CONVENTIONS.md` p/ Toast/Dropdown dos Lotes C/D. Maestro (crítico), sem mudança visual. 2026-07-21
- [x] Fase 4 / Lote B — 5 componentes de formulário (Textarea, Checkbox, Radio, Switch, FileUpload) → codex (`gpt-5.6-terra`, reasoning high; 1 correção do maestro: `role="img"` no `.lyra-upload__check` do FileUpload, que derrubava o axe em light/dark). Todos os gates verdes, 232 testes. 21/40 componentes. 2026-07-21
- [x] Fase 4 / Lote A — 12 componentes estáticos → codex (`gpt-5.6-terra`, reasoning high; 1 correção do maestro: prettier no root lint), commit 11376ee, 2026-07-20
- [x] Fase 4 — pesquisa WAI-ARIA APG (gate dos lotes C/D) → agente de research (background), relatório em `.batuta/research-apg-focus-models.md`, 2026-07-20
- [x] Fase 1 — Monorepo Foundation & Governance (5 planos) → GSD/claude (importado), merged PR #1, 2026-07-17
- [x] Fase 2 — Styles Package, 209/209 tokens + 248 classes (6 planos) → GSD/claude (importado), merged PR #2 (df75f9a), 2026-07-18
- [x] Fase 3 — React Infrastructure & Pilot Components (9 planos) → GSD/claude (importado), merged PR #3 (cff0234), 2026-07-20
