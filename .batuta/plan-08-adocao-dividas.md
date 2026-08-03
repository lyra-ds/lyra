# Plano 08 — Adoção + dívidas (marco pós-v1)

Definido em 2026-08-03 com o usuário, logo após o fechamento da Fase 7 (v1
lançado) e do 6c-d (favicon theme-aware, PR #50). Racional: a janela de
lançamento perece; Zag.js (fase 2 travada) e o satélite Vue não. A escolha
entre eles fica para o marco seguinte, informada pelo sinal que a divulgação
trouxer (pedidos de Vue → satélite; bugs de interação → Zag).

Decisões do usuário (2026-08-03):

- **Anúncio/blog**: sem infra nova — GitHub Discussion fixada como anúncio
  canônico + cross-post em dev.to com link canonical. Blog próprio só se a
  cadência justificar depois.
- **Starter templates**: repos separados na org (`lyra-ds/starter-vite`,
  `lyra-ds/starter-next`) — clonáveis direto e visíveis na org. Custo aceito:
  manter dois repos em sincronia com os releases.

## Trilha 1 — dívidas de release (sequencial, nesta ordem)

- [x] **08-1 tsup → tsdown** (PR #54, 2026-08-03) — no `@lyra-ds/react`. Caminho sancionado pelo
      próprio tsup; usar `migrate-from-tsup`. Prova de equivalência do dist é
      o job build do CI (publint, attw, size-limit, pack-smoke, dist-scan,
      smoke) — os gates existem exatamente para isso. Atenção: o prepend
      determinístico de `'use client'` vive no `onSuccess` do tsup e precisa
      de equivalente; exports map == entries == basenames do dist continua lei.
      Gera changeset patch (é a mudança de build que o 0.1.1 precisa).
- [ ] **08-2 Release 0.1.1 via OIDC** — merge do Version Packages PR prova o
      caminho trusted publishing de ponta a ponta (provenance por default).
      Primeiro release desde a migração do PR #43.
- [ ] **08-3 Revogar `NPM_TOKEN`** (manual, usuário) — destravado pelo
      release OIDC verde. Remover o fallback documentado no cabeçalho do
      workflow no mesmo PR que registrar a revogação.

## Trilha 2 — adoção (independente da trilha 1, qualquer ordem)

- [ ] **08-4 Templates de contribuição** — issue forms (bug, feature, docs),
      PR template, labels curados. CONTRIBUTING.md e CoC já existem.
- [ ] **08-5 Good first issues curadas** — 3 a 5 issues no molde da #28
      (contexto, arquivos, critério de aceite, sem solução mastigada).
- [ ] **08-6 Conteúdo de lançamento** — texto do anúncio (Discussion fixada,
      bilíngue) + drafts de divulgação para o usuário postar: Show HN,
      r/reactjs, dev.to (canonical → Discussion), X/Bluesky.
- [ ] **08-7 Starter templates** — `lyra-ds/starter-vite` e
      `lyra-ds/starter-next`: mínimos, instalando as versões públicas do npm,
      demonstrando styles + react + white-label em 4 tokens + dark mode.
      Criação dos repos é manual do usuário (guiada); conteúdo vem daqui.
- [ ] **08-8 Snapshot releases** — workflow `workflow_dispatch` com
      `seek-oss/changesets-snapshot` (`0.0.0-snapshot-*`) para contribuidor
      testar PR sem release real.

## Trilha 3 — governança (pedido do usuário, 2026-08-03)

- [ ] **08-9 Documentação do projeto em inglês** — revisitar as regras para que
      toda documentação voltada ao público (README, CONTRIBUTING, templates,
      changesets, comentários) seja em inglês, por ser open source. Decidir o
      destino da prosa interna (WORK.md, `.batuta/`) junto com o usuário antes
      de converter qualquer coisa.
- [ ] **08-10 Limpeza de `.batuta/` e `WORK.md`** — arquivar briefs de lotes já
      entregues, condensar o histórico do WORK.md (as lições migram para o
      profile ou para um arquivo de lições), remover planos concluídos.

## Fora deste marco (registrado para o próximo)

- Fase 2 travada: camada de comportamento Zag.js nos wrappers interativos.
- Satélite `@lyra-ds/vue` (primeiro "Em breve" a cair).
- TS 7 (depende de 08-1 maturar), preset Tailwind satélite.
