# Handoff — 2026-08-11

> **Histórico (fechado em 2026-08-12):** tudo que este handoff deixava pendente foi
> executado — PR #176 mergeado, correções de spec/planos aplicadas (PR das correções),
> tasks 11–12 desbloqueadas pela release `v0.10.0` do `lyra-ds/blade` (o `api.json` está
> anexado; 72 componentes, 30 com binding). As "open questions" abaixo foram respondidas:
> o #176 foi mergeado antes da junção com a frente A, e a frente C ainda não começou.
> O estado vivo está no `WORK.md`.

## Cycle point

A frente B da documentação multi-stack está **entregue e no PR #176**
(`feat/docs-multi-stack` → `main`, 15 commits, assignee `franciscpd`, labels
`docs site` e `pkg: alpine`). A branch foi preservada de propósito: é onde o
review se resolve.

O ciclo parou logo depois de abrir o PR, com **o CI ainda rodando** (lint,
typecheck, test, build no run `31499607669`). Localmente a suíte inteira passou
antes do push — styles 69, alpine 268, react 665, docs 20 mais 313 casos de
`node --test`, além de prettier, eslint, typecheck, build e os três `--check` de
artefato gerado. Quem retomar deve **conferir o CI antes de mergear**, não
assumir verde.

Das 12 tasks do plano, as 10 primeiras estão feitas. As tasks 11 e 12 — ingestão
do `docs/api.json` e acender a aba Blade — estão bloqueadas até a **primeira
release do `lyra-ds/blade` com o artefato anexado**; não basta a frente A fechar
em `main` de lá. O usuário está implementando a frente A naquele repositório.

A frente C (starter Laravel e demo) está planejada e não foi iniciada. Ela não
depende de A nem de B: só a task 10 dela, das ligações cruzadas, espera a aba
Blade existir.

**Próxima ação, já decidida pelo usuário e não executada:** atualizar a spec e os
planos com as correções da seção abaixo. O pedido veio no fim da sessão e a
pausa chegou antes da execução — nenhum documento foi tocado, então não há nada
pela metade. Os pontos exatos a mudar estão mapeados:

- `docs/superpowers/specs/2026-08-10-documentacao-multi-stack-design.md`: linha 55
  (fonte do catálogo Alpine), linha 58 ("quase de graça"), linha 76 e 78 (órfãos e
  contagem da união), linhas 83, 115, 230 e 274 ("três stacks" → quatro).
- `docs/superpowers/plans/2026-08-10-docs-multi-stack-frente-b.md`: as mesmas três
  correções, mais uma nota de execução no topo — o plano virou registro de trabalho
  feito, não previsão.
- `docs/superpowers/plans/2026-08-11-starter-laravel-frente-c.md`: conferir se cita
  "três stacks".
- As cópias em `~/Documents/` precisam ser ressincronizadas depois.

## Decisions not yet written

Três correções de desenho foram descobertas **durante a execução** e estão no
código e no PR, mas **os planos e a spec não foram atualizados** para refleti-las:

1. **O catálogo do Alpine não sai das interfaces `Lyra*Options`.** O plano da
   frente B dizia isso; está errado. Derivar delas inventa `lyraToast` e perde
   `lyraCodeBlock`, `lyraToastStack` e os dois stores globais. A lista de verdade
   são as chamadas `Alpine.data()`/`Alpine.store()` no `dist/index.js` publicado.
2. **Existem quatro stacks, não três.** `html` e `alpine` são a mesma aba em dois
   estados: todo componente tem HTML canônico, só 31 têm binding. A spec já
   previa isso no exemplo do Button (`React | HTML | Blade`), mas o plano tinha
   colapsado os dois.
3. **O `@lyra-ds/alpine` não publicava as interfaces de opções.** A spec dizia
   que o Alpine sairia "quase de graça" porque já publica `.d.ts`; publicava 29
   linhas. As 29 interfaces das ondas iniciais foram exportadas neste PR (há
   changeset `minor`), e um scanner novo impede a regressão.

Também não está registrado em lugar nenhum além do PR: **`form-row` nunca foi
órfão** — está documentado dentro de `fieldset.mdx`, junto do Fieldset. A spec
lista ele entre os 6 componentes sem página, e isso é um erro de levantamento.
Com ele fora da conta, os órfãos são **cinco** e a união tem **75 páginas**, não
76 — 75 é o número real de arquivos em `content/docs/en/components/` e de
entradas no manifesto, conferido. A mensagem do commit `66d1f68` diz 76; o texto
está errado, o trabalho não.

## Background

Nada rodando sob o Batuta. Nenhuma sessão de executor foi aberta neste ciclo —
a frente B inteira foi executada pelo maestro, inline.

O que segue em voo fora daqui:

- **CI do PR #176** — termina sozinho. `gh pr checks 176` diz o estado.
- **Frente A, no `lyra-ds/blade`** — com o usuário. O plano está commitado lá, na
  branch `docs/blade-docs-api-plan` (commit `65220a1`), e uma cópia está em
  `~/Documents/2026-08-10-docs-api-frente-a.md`.

Achado que vale carregar para qualquer sessão futura deste repo: um teste que
clica em data fixa num calendário com `min: new Date()` apodrece à meia-noite.
Dois testes do `weekly-schedule-editor` estavam nessa condição e deixaram o CI
vermelho sem ninguém notar; foram consertados com datas derivadas do dia da
execução (commit `cf7c469`). O `recurrence-selector` usa data fixa também, mas
com `min` vindo de um `startDate` fixo — aquele não apodrece. A diferença é essa.

## Open questions

1. **Mergear o #176 antes ou depois da frente A?** As tasks 11 e 12 acrescentam a
   aba Blade sobre este trabalho. Mergear agora entrega Alpine ao público já;
   esperar junta tudo numa release só.
2. **Quando começar a frente C?** Ela é independente e o plano está pronto em
   `~/Documents/2026-08-11-starter-laravel-frente-c.md`.
