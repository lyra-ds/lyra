# Plano 09 — Porte do delta do handoff v1.1+v1.2 (a "Fase 8" do mapa)

Aberto em 2026-08-03 por decisão do usuário (antes da trilha de adoção do
marco 08 — anunciar depois, com 75 componentes). **A fonte de tudo aqui é
`.batuta/handoff-v1.2-map.md`** (análise de 2026-07-28): tamanho do delta,
armadilhas por componente, decisões de arquitetura já tomadas e a ordem de
ondas. Este arquivo só registra a execução; não duplica o mapa.

Fonte externa: `~/Documents/design_handoff_lyra_v1_2` (deltas empilhados:
`v1_1/` + raiz v1.2). O maestro copia para o repo no lote de infra; depois
disso `handoff/` volta a ser a única referência.

## Lotes

- [x] **09-0 Infra** (PR #60) — (codex, worktree): overlay dos deltas em `handoff/`
      (renomeando `.txt`), porte integral do CSS novo para `packages/styles`
      (layout.css, primitives.css, scheduling.css novos; appends de
      data/forms/navigation com **re-anexação dos blocos aditivos do repo**;
      as 2 reescritas in-place do forms.css; correções decididas: keyframes
      sem `opacity: 0` via allowlist de divergência, bug do `--sm` na media
      `pointer: coarse`), token `--border-input`, entrada do `styles.css`
      com os 3 imports novos, `pnpm parity --update-baseline` com diff
      revisado pelo maestro. CI inteiro verde ao final (sem React novo —
      docgen segue em 54).
- [x] **Onda 1** (PRs #61, #63; 0.2.0 saiu no incidente do WORK.md): RadioGroup, CheckboxGroup, DataTable + PersonCell,
      ActionBar, delta de 2 linhas do SidebarGroup. (Separator e Fieldset/
      FormRow da Onda 0 do mapa também entram aqui — o resto da Onda 0 já
      saiu na Fase 6.)
- [ ] **Onda 2**: Popover sobre `useFlipPlacement` (decisões 1–6 do mapa,
      § "Popover sobre o useFlipPlacement"), + eixo horizontal no hook.
- [ ] **Onda 3**: Calendar, TimePicker, BottomSheet (variante do Drawer —
      componente ausente do pacote), DatePicker, DateRangePicker.
- [ ] **Onda 4**: AppSidebar (aceitando `children` como o SidebarGroup —
      armadilha pinada no mapa), BottomNav.
- [ ] **Onda 5**: ToastProvider (inlinar os 3 SVGs; SSR-safe; `closeLabel`).
- [ ] **Onda 6**: SegmentedRing e TimeInput → extensão do Combobox
      (`group`/`keywords`/`trailing`) → TimeZonePicker → RecurrenceSelector
      → WeeklyScheduleEditor → SlotPicker → CalendarView (sozinho, o mais
      caro; testes só em Browser Mode).
- [ ] **Docs**: ~30 páginas bilíngues novas, por onda concluída (reabre o
      formato da 6c-b3).

Fora de escopo até haver design: **Dropzone** (sem código e sem CSS no
pacote). Não bloqueia ninguém: DiffCard (reconstrutível do CSS, decidir na
Onda 1 ou depois).

Regras que valem em TODO lote (do mapa e do profile): i18n por props
traduzíveis desde o primeiro componente (nada de pt-BR hardcoded);
componente de bloco com teste da forma real; asserção de existência com
`expect.element`; impeccable na página de demonstração de cada componente.
