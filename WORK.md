# WORK — lyra-ds

Histórico das fases 1–3 importado do GSD em 2026-07-20 (takeover). Trabalho
restante planejado em `.batuta/plan-04..07-*.md`, em ordem de dependência.

## In progress

## Next

- [ ] Fase 4 — Component Batch Conversion & A11y (`.batuta/plan-04-component-batch-conversion-a11y.md`; pesquisa APG antes de delegar)
- [ ] Fase 5 — Docgen & llms.txt (`.batuta/plan-05-docgen-llms.md`)
- [ ] Fase 6 — Docs Site bilíngue (`.batuta/plan-06-docs-site-bilingue.md`)
- [ ] Fase 7 — Release Pipeline & Launch (`.batuta/plan-07-release-pipeline-launch.md`)

## Done

- [x] Readequação CSS-first do Card — inline `style={{display:flex;gap}}` das ações → classe `.lyra-card__actions` (styles + parity generalizado p/ additive multi-arquivo); regra documentada em `CONVENTIONS.md` p/ Toast/Dropdown dos Lotes C/D. Maestro (crítico), sem mudança visual. 2026-07-21
- [x] Fase 4 / Lote B — 5 componentes de formulário (Textarea, Checkbox, Radio, Switch, FileUpload) → codex (`gpt-5.6-terra`, reasoning high; 1 correção do maestro: `role="img"` no `.lyra-upload__check` do FileUpload, que derrubava o axe em light/dark). Todos os gates verdes, 232 testes. 21/40 componentes. 2026-07-21
- [x] Fase 4 / Lote A — 12 componentes estáticos → codex (`gpt-5.6-terra`, reasoning high; 1 correção do maestro: prettier no root lint), commit 11376ee, 2026-07-20
- [x] Fase 4 — pesquisa WAI-ARIA APG (gate dos lotes C/D) → agente de research (background), relatório em `.batuta/research-apg-focus-models.md`, 2026-07-20
- [x] Fase 1 — Monorepo Foundation & Governance (5 planos) → GSD/claude (importado), merged PR #1, 2026-07-17
- [x] Fase 2 — Styles Package, 209/209 tokens + 248 classes (6 planos) → GSD/claude (importado), merged PR #2 (df75f9a), 2026-07-18
- [x] Fase 3 — React Infrastructure & Pilot Components (9 planos) → GSD/claude (importado), merged PR #3 (cff0234), 2026-07-20
