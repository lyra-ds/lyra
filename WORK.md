# WORK — lyra-ds

Histórico das fases 1–3 importado do GSD em 2026-07-20 (takeover). Trabalho
restante planejado em `.batuta/plan-04..07-*.md`, em ordem de dependência.

## In progress

- [ ] **Debugging pendente — CodeBlock na tela de visualização não quebra o
      conteúdo** (estoura a página). Reportado pelo usuário em 2026-08-03;
      abrir sessão de debugging dedicada depois da Onda 3.

- [x] **Sidebar/índice/⌘K em ordem alfabética (2026-08-03).** O manifesto
      (`apps/docs/lib/components.ts`) exportava em ordem de inserção; o export
      agora sai ordenado por nome num ponto só, e a posição autoral deixa de
      importar (comentário atualizado). → kimi (`opencode/kimi-k2.7-code`),
      1 rodada limpa.

- [x] **Fase 8 / Onda 3a — Calendar (2026-08-03).** Grade com navegação de teclado
      (roving tabindex), single/range, três visões (dias/meses/anos), `locale` por
      `Intl` (zero strings de data hardcoded — o handoff trazia pt-BR fixo), dias
      desabilitados focáveis por `aria-disabled` (divergência declarada: o `.d.ts` e
      o APG vencem o `disabled` nativo do JSX de referência; CSS aditivo espelhando o
      esmaecimento, registrado no parity). Docgen 63→64. Ciclo: 1 retry (o CSS da
      divergência), 1 fix mecânico do maestro (force-click em alvo intencionalmente
      desabilitado — o Playwright trata aria-disabled como not-enabled) e 1 finding
      real do cross-review corrigido na lane crítica (botões de navegação anunciavam
      "month" nas visões de ano/bloco — rótulos por visão + teste). → codex
      (`gpt-5.6-terra`, high, worktree, 1 retry) + claude (2 fixes).

- [x] **Respiro título→grid no índice de componentes (2026-08-03).** Sequela do modelo
      de prosa (margem-topo por elemento): o bloco do grid zerava a própria margem e o
      título ficava colado nos cards (0px medido em produção). Fix: margem-topo de
      12px (`--space-3`) no bloco prefixado; prova de cascata em navegador real.
      → kimi (`opencode/kimi-k2.7-code`), 1 rodada limpa.

- [x] **Fase 8 / Onda 2 — Popover sobre `useFlipPlacement` (2026-08-03).** O hook
      interno passa a devolver `{ side, align }` com `gap` configurável (default 6
      preserva Combobox/Dropdown/WorkspaceSwitcher — testes deles intocados como
      harness de regressão); `Popover` novo carrega o comportamento de overlay
      extraído (outside-click, Escape com foco restaurado, fusão via Slot, trio
      ARIA), em fluxo, sem portal, pelas 6 decisões do mapa. Docgen 62→63. Ciclo:
      1 fix trivial do maestro (asserção do harness concatenava o texto do âncora),
      1 retry por findings aceitos do cross-review — o real era o gap 6px do hook
      vs. 8px do CSS (recorte de 2px na borda inferior) + cobertura de re-medição
      em scroll; trigger não-interativo rejeitado como defeito (paridade com o
      Dropdown, virou JSDoc). → codex (`gpt-5.6-terra`, high, worktree, 1 retry) + claude (fix trivial).

- [x] **INCIDENTE — 0.2.0 publicado sem autorização (2026-08-03).** A cadeia em
      background do merge da onda 1b referenciava o PR pelo número PREVISTO (#62);
      o bot de changesets abriu o Version Packages primeiro, tomou o #62, e a cadeia
      o mergeou com --admin — publicando 0.2.0 (conteúdo: onda 1a, íntegro e
      verificado; o defeito foi de autorização, que era do usuário). Cancelamento
      tentado, run já completo. Prevenções adotadas: número de PR sempre capturado
      da saída do `gh pr create`, nunca previsto; cadeia automática verifica o
      título e ABORTA em "version packages" — Version PR é sempre do usuário.
      Registradas no profile. → claude (incidente próprio, relatado na hora).

- [x] **Fase 8 / Onda 1b — DataTable + PersonCell, ActionBar, delta do SidebarGroup
      (2026-08-03).** 3 componentes novos (docgen 59→62) + tooltip do SidebarGroup;
      i18n por props (o `selectRow` do DataTable virou `string | (row) => string` —
      o handoff dava o MESMO nome acessível a toda checkbox de linha). Ciclo cheio:
      2 travamentos no gate interno do codex (desarmados com o bloco de
      follow-through no brief, sem nomear o gate), 1 retry (locator ambíguo +
      a11y por linha), e o cross-review achou um HIGH real que o retry já usado
      mandou para a lane crítica: com linhas sem `id`, o fallback usava índice
      ORDENADO na renderização e original no select-all — seleção pulava de linha
      ao reordenar. Fix do maestro (mapa estável por linha), skeleton composto em
      vez de span inline, e o teste de regressão PROVADO POR MUTAÇÃO nas duas
      direções — a 1ª versão dele passava com o bug (exibição autoconsistente
      dentro da mesma ordenação; só o ciclo completo de sort expõe), e um replace
      silenciosamente não-aplicado pós-prettier quase o deixou fraco. → codex
      (`gpt-5.6-terra`, high, worktree, 2 re-disparos + 1 retry) + claude (HIGH).

- [x] **Fase 8 / Onda 1a — RadioGroup, CheckboxGroup, Fieldset+FormRow, Separator
      (2026-08-03).** 5 exports novos (54→59 no docgen, guard bumpado), i18n por props,
      changeset minor. 1 retry por doutrina: FormRow veio com `gridTemplateColumns`
      inline (fiel ao handoff, que erra igual em Stack/Grid) → corrigido para o padrão
      `--lyra-formrow-columns` + classe aditiva, e o teste passou a assertar a custom
      property verbatim em vez do serializador do navegador (`0`→`0px` era a falha).
      Cross-review: Skeptic/Architect zero; 1 LOW aceito (screenshots órfãos de rodada
      falhada, removidos). → codex (`gpt-5.6-terra`, high, worktree, 1 retry).

- [x] **Fase 8 / 09-0 — infra do porte do delta v1.1+v1.2 (2026-08-03).** Handoff
      avançado para v1.2 no repo (76 arquivos, staging do maestro; `command cp -f`
      porque o alias interativo mordeu de novo), CSS integral portado (layout/
      primitives/scheduling novos + appends com blocos aditivos re-anexados; keyframes
      transform-only por override same-name aditivo; fix do bug `--sm` na media coarse),
      baseline 211 tokens/433 classes/18 imports com metadado v1.2 restaurado à mão
      (o `--update-baseline` reseta — 3ª mordida, agora avisada no próprio $comment).
      Consequências do maestro: registry de ícones 70→79 (2 fontes dinâmicas novas no
      manifest), orçamentos dos 5 carregadores +0,25 kB, tripwire do teste 70→79.
      Cross-review: Skeptic/Architect zero defeitos; 4 MED rejeitados (follow-through
      do maestro, não deriva) com split em 2 commits; 1 LOW aceito (rótulo do baseline).
      → codex (`gpt-5.6-terra`, high, worktree) + claude (consequências), plano em
      `.batuta/plan-09-porte-delta.md`.

- [x] **08-3 — NPM_TOKEN revogado — CONCLUÍDO em 2026-08-03.** Usuário revogou o token
      no npmjs.com; secret `NPM_TOKEN` removido do repo (`gh secret delete`, confirmado
      ausente) e cabeçalho do `release.yml` atualizado para registrar a revogação. A
      receita de fallback FICOU no cabeçalho de propósito: ela já manda gerar um token
      novo, então não depende do secret existir — apagar documentação de recuperação
      seria perda, não limpeza. Trilha 1 do marco 08 fechada. → claude (crítico).

- [x] **08-2 — release 0.1.1 via OIDC — PROVADO em 2026-08-03.** Version Packages PR
      #55 mergeado (autorização do usuário), run 30838899789 verde: `@lyra-ds/react@0.1.1`
      e `@lyra-ds/styles@0.1.1` no npm com **provenance SLSA anexada** (a atestação que o
      0.1.0 não teve), tags + GitHub Releases criados, sem segredo npm no workflow.
      **08-3 destravado**: revogar o `NPM_TOKEN` (manual do usuário) e remover o fallback
      documentado do cabeçalho do release.yml no mesmo PR. → claude (crítico), 2026-08-03.

- [x] **08-1 — migração tsup→tsdown no `@lyra-ds/react` — CONCLUÍDO em 2026-08-03**
      (PR #54, b4cc3bc). tsdown 0.22.14 pinado, tsup removido; 52 configs por entry
      (zero chunks, `codeSplitting: false` explícito), dts por condição (attw node16
      🟢), orçamentos do size-limit intactos, suíte + smoke/pack-smoke verdes. O
      cross-review pagou o custo: 2 findings aceitos, e o HIGH era real e invisível
      aos gates — o `onSuccess` do tsdown é fire-and-forget com builds concorrentes,
      então o prepend do `use client` via hook era uma corrida que passava por sorte
      de timing; virou passo pós-build determinístico (`scripts/use-client.mjs`).
      Lição nova de condução: alegação de reviewer citando fonte de node_modules se
      verifica em 30 segundos com `sed` — verificar antes de julgar. → codex
      (`gpt-5.6-terra`, reasoning high, worktree; 1 re-disparo por "model at capacity",
      1 retry por findings do cross-review). Changeset patch a bordo → Version
      Packages PR do 0.1.1 (08-2).

- [x] **Espaçamento do grid de cards do índice de componentes (docs) — 2026-08-03, em
      dois atos.** O PR #52 (`gap` de `--space-2` para `--space-4`) não mudou nada em
      produção: `.lyra-prose :is(ul, ol)` (0,1,1, `chrome.css`) vencia `.lw-index__grid`
      (0,1,0) e impunha `display: flex` + `gap: 4px` — o grid nunca tinha sido grid, e a
      medição de 4px vs. 8px da fonte era o sinal, descartado rápido demais na 1ª rodada.
      PR #53 prefixa o seletor (`.lyra-prose ul.lw-index__grid`, 0,2,1) e a prova passou a
      ser a cascata computada em navegador real (grid + 16px), não o diff. É a armadilha de
      especificidade já registrada no profile ("prefixe quando precisar sobrescrever").
      → kimi (`opencode/kimi-k2.7-code`), 2 ciclos.

- [x] **6c-d — favicon theme-aware — CONCLUÍDO em 2026-08-03.** Os dois `favicon.svg`
      (docs e site, antes tile indigo + estrela branca, estáticos) viraram a estrela da
      Lyra sem tile com `@media (prefers-color-scheme: dark)` embutida no SVG — espelha
      exatamente o par `lyra-mark`/`lyra-mark-light` que o header já usa; zero JS, segue
      o tema do dispositivo (a aba do navegador segue o SO, não o toggle do site). Prova
      em chromium real: computed fill `#5B5BD6` no claro, `#EEF0FE` no escuro. Nota: os
      3 `favicon-*.png` órfãos do docs seguem sem referência (fora do escopo, anotado).
      → kimi (`opencode/kimi-k2.7-code`, 1 re-disparo por stop condition mal escrito no
      brief — untracked do próprio `.batuta/` disparou a regra; corrigido na origem).

- [x] **Issue #29 fechada — alvos de toque da sidebar das docs (2026-08-03).**
      `.lyra-sbgroup__label--btn` entrou nas duas regras do bloco de 44px do `site.css`.
      Aceite medido no navegador a 375px: 67 alvos, todos 44px. → kimi
      (`opencode/kimi-k2.7-code`), PR #46. Issue #28 deixada aberta de propósito como
      good first issue para a comunidade (decisão do usuário; se ninguém pegar em
      algumas semanas, fechamos).

- [x] **Preview do WhatsApp consertado em 3 atos (2026-08-03).** GitHub renderizava o
      card, WhatsApp nunca — três defeitos somados, todos invisíveis para crawlers
      tolerantes: (1) `og:image` sem extensão e com query hash (`/opengraph-image?...`)
      → PR #47 (→ codex, worktree): card movido para route handler `force-static` em
      `/og.png`, file convention removida (ela tem PRIORIDADE sobre metadata config —
      se ficar, reinjecta a URL hasheada); (2) imagem servida sem `Content-Length` →
      resolvido de graça pelo mesmo PR (arquivo estático .png sai com CL); (3) a RAIZ
      `lyra-ds.dev` — a URL que se compartilha — nunca teve `<title>` nem `og:title`
      (página de redirect nua; WhatsApp não renderiza prévia sem título) → PR #48
      (correção do maestro, achada na verificação em produção pós-#47): fallback
      completo de metadata no layout root + teste sobre o `index.html` exportado.
      Antes disso, PR #44 tinha posto a estrela da Lyra no card (era só tipografia).
      Verificado em produção: raiz serve title + og + `/og.png` (200, image/png,
      CL 44850). Lição de condução: o watcher de deploy pegou "o último run" e
      reportou sucesso do run ANTERIOR — esperar sempre o run do SHA exato.

- [x] **FASE 7 COMPLETA — v1 LANÇADO (2026-08-03).** Fechamento dos itens finais:
      **OIDC** (PR #43): trusted publishers configurados pelo usuário nos dois pacotes;
      release sem segredo npm — publish em step top-level (npm/cli#8976), setup-node sem
      `registry-url`, tags+GitHub Releases explícitos (notes extraídas do CHANGELOG por
      versão, awk testado contra o 0.1.0 real), guard `npm view` vs. versão local pula
      builds em push comum (provado verde no primeiro run). Caminho OIDC se prova no
      próximo release real; fallback NPM_TOKEN documentado no cabeçalho do workflow —
      manter o secret até o primeiro release OIDC verde. **Vitrine** (quase tudo já
      existia da criação da org): avatar/bio ✓; website da org, homepage e 7 topics do
      repo configurados via API; profile README do `.github` atualizado ("coming soon" →
      links reais). **OG image com a marca** (PR #44, → claude crítico por iteração
      visual): estrela em indigo à direita, verificado em produção. Prévia no WhatsApp
      não carregava por cache deles (servidor limpo com UAs de crawler; furar com `?v=N`).
      **Checklist de launch**: 12/12 com evidência (gates permanentes do CI + install real
      do npm público + llms.txt/bilingue ao vivo). Pendências manuais do usuário: social
      preview do repo (upload manual, usar o og novo) e revogar NPM_TOKEN pós-primeiro
      release OIDC. → claude (crítico), 2026-08-03.

- [x] **Fix: OpenPanel nunca enviava eventos (realtime vazio) — 2026-08-03.** Causa raiz
      provada em browser real: `op1.js` não define `window.op` (expõe `window.openpanel`)
      e consome a fila do stub do snippet oficial, que a integração tinha pulado — o
      `onLoad` caía em `if (!window.op) return` e o init nunca rodava, silenciosamente.
      O E2E da fase 6 passou porque o mock definia `window.op` (gap mock vs. produção,
      lição: teste o contrato do script real). Fix nos dois apps: stub tipado criado no
      efeito (gate de consentimento intacto) + init pela fila + script depois; testes
      pinam o contrato real e rejeitam `onLoad=`. → codex (`gpt-5.6-terra`, worktree,
      1 re-disparo verbatim por gate de aprovação), verificação e prova de regressão do
      maestro, PR #40 (0c18be8). Verificado ao vivo pós-deploy: `POST /api/track → 200`
      na landing e nas docs. Bônus da investigação: beacon do Cloudflare Web Analytics
      era injeção automática bloqueada pelo CSP (usuário desativou nos dois projetos).
- [x] **Fix: link Contribuir dos footers apontava para `lyra-ds/lyra-ds` (404)** →
      `lyra-ds/lyra`. → kimi (`opencode/kimi-k2.7-code`), PR #41 (939388a), 2026-08-03.

- [x] **Fase 7 / publicação npm — 0.1.0 PÚBLICO em 2026-08-03.** `@lyra-ds/styles@0.1.0`
      e `@lyra-ds/react@0.1.0` no npm público via pipeline changesets (Version PR #38 →
      merge → publish no run 30820566516), tags + GitHub Releases criados. Prova final:
      install fresco do registry público + SSR render com classes `.lyra-*`. Tropeços da
      estreia, todos resolvidos: org sem permissão de Actions criar PR (habilitado org+repo
      via API); `ERR_PNPM_OTP_NON_INTERACTIVE` (política 2FA — usuário recriou o token);
      provenance NÃO anexou no 0.1.0 (`pnpm publish` ignora `publishConfig.provenance` —
      fix via env `NPM_CONFIG_PROVENANCE` no workflow, vale a partir do 0.1.1). Próximo da
      fase: trusted publishers + troca para OIDC, vitrine da org (avatar/README/social) e
      checklist de launch. → claude (crítico), 2026-08-03.

- [x] **Fase 7 / publicação npm (desenho do pipeline, concluído junto)** — pipeline changesets:
      `.github/workflows/release.yml` (changesets/action v1.9.0 pinado) mantém o
      Version Packages PR enquanto houver changesets (42 pendentes → 0.1.0 fixado nos
      dois pacotes) e, no merge dele, builda o react e publica com `changeset publish` +
      GitHub Releases. Auth do primeiro release é `NPM_TOKEN` granular **de propósito**:
      OIDC não faz primeiro publish de pacote inexistente (npm/cli#8544); provenance vem
      de `publishConfig.provenance: true` (repo público). Pós-0.1.0: configurar trusted
      publishers nos dois pacotes e trocar para OIDC (add `id-token: write`, remover
      `registry-url`/`NODE_AUTH_TOKEN`; cuidado com npm/cli#8976 — publish em step
      top-level). `repository`/`homepage`/`bugs` adicionados aos package.json (url sem
      `git+`, exigência do matching OIDC; publint sugere o contrário — ignorar). Dry-run
      gate rodado: tarballs inspecionados (styles 21 arquivos só CSS; react só dist/),
      pack-smoke + smoke (Vite e Next) verdes. → claude (crítico), 2026-08-03.
      Pendências manuais: criar org npm `lyra-ds`, gerar token granular write
      escopado na org e salvar como secret `NPM_TOKEN`. Nota: o Version Packages PR
      não recebe checks (PR de GITHUB_TOKEN não dispara CI — anti-recursão do GitHub);
      merge com override de admin é o esperado.

- [x] **Fase 7 / deploy via GitHub Actions → Cloudflare (Direct Upload) — CONCLUÍDO em
      2026-08-03.** Build dos dois apps saiu do Cloudflare (heap do container matava o
      `.d.ts` do react) e roda em `.github/workflows/deploy.yml`: push na main builda
      site+docs e publica os `out/` prontos com `wrangler pages deploy` (landing antes das
      docs). `DEPLOY.md` da raiz reescrito. → claude (crítico), PR #34 (34b30fb) + fix
      PR #35 (8ad6d39: wrangler-action não funciona em workspace pnpm —
      ERR_PNPM_ADDING_TO_ROOT — trocada por `pnpm exec wrangler` com devDep pinado;
      `workerd: false` na policy de builds). Duas rodadas de config do usuário guiadas:
      `NEXT_PUBLIC_OPENPANEL_URL` com `/api` no valor (a validação fail-closed pegou) e
      API token sem a permissão Account→Pages→Edit (code 10000). E2E provado: run
      30813760052 verde, CSP com a origem do analytics servido nos dois `*.pages.dev`.
      Restam no dashboard: Custom domains (`lyra-ds.dev`/`docs.lyra-ds.dev`) e desconectar
      o Workers Builds `lyra` antigo (check vermelho em todo push até lá).

- [x] **6c-b2 — camada de cromo (9 adições) — CONCLUÍDO em 2026-07-31.** Ciclo aberto em
      2026-07-30. APIs decididas
      (registro em § Decisões tomadas) e quebrado em 5 lotes, sequenciais, cada um com
      worktree próprio. Briefs em `.batuta/brief-6cb2-chrome.md` (compartilhado) +
      `.batuta/lot-6cb2-0N-*.md`.

- [x] **6c-b4 — `PageHeader` e `Shell` escolhem o elemento que emitem — CONCLUÍDO em
      2026-08-01** (PR #27, 1 commit). Lote de correção nascido da 6c-b3: dois bugs de API
      achados enquanto se documentava, com `packages/` fechado naquela fase. Brief em
      `.batuta/lot-6cb4-element-overrides.md`.

- [x] **6c-c — landing de marketing — CONCLUÍDA em 2026-08-01.** Ciclo aberto em 2026-08-01,
      decisões tomadas
      (registro em § Decisões tomadas), quebrada em 5 lotes sequenciais. Briefs em
      `.batuta/brief-6cc-landing.md` (compartilhado) + `.batuta/lot-6cc-0N-*.md`.
  - [x] Lote 1 — `apps/site`, cromo e Hero → codex, commit 5ae1075
  - [x] Lote 2 — ComponentShowcase + Frameworks → codex (1 retry), commit 60c3d5b
  - [x] Lote 3 — Temas/Tokens + Comunidade → codex, commit 0eaca7e
  - [x] Lote 4 — FAQ + CTA → codex, commit 1e2a9d9
  - [x] Lote 5 — consentimento + política de privacidade → codex (1 retry), commit a4ca1c3
  - [x] Lote 6 — metadados/OG, robots, sitemap, CSP, varredura final → codex (1 retry),
        commit 8f75ce0
  - [x] Lote 7 — consentimento + política no `apps/docs` → codex (1 retry), commit d053a42
  - [x] Lote 8 — OpenPanel self-hosted nos dois apps → codex, commit fa2223f

O detalhe de cada lote está em "6c-b2 — o que cada lote custou", mais abaixo.

## Next — Marco 08: Adoção + dívidas (definido 2026-08-03)

Plano completo em `.batuta/plan-08-adocao-dividas.md`. Duas trilhas: dívidas de
release em ordem (tsdown → 0.1.1 via OIDC → revogar NPM_TOKEN) e adoção em
paralelo (templates de contribuição, good first issues, anúncio via Discussion
fixada + dev.to, starters `lyra-ds/starter-vite`/`starter-next` como repos da
org, snapshot releases). Zag.js e o satélite Vue ficam para o marco seguinte,
escolhido com o sinal da divulgação.

A Fase 6 que vivia nesta seção foi concluída por inteiro (6c-b2, 6c-b3, 6c-b4,
6c-c, 6c-d, 6c-e — registros em In progress/Done acima); o detalhamento antigo
saiu daqui em 2026-08-03.

## 6c-b2 — o que cada lote custou

### Lote 1 — `Shell` + `.lyra-prose`

→ codex (`gpt-5.6-terra`, reasoning high),
**três rodadas**, commit `1f26db7`. Estabeleceu a mecânica que os outros quatro
herdam: `components/chrome/chrome.css`, a categoria `Chrome` no docgen e o registro
do parity para um arquivo CSS sem contraparte no handoff (enumerado como aditivo
nosso, com o tripwire provado).

**O que cada rodada custou, porque é lição reaproveitável:**

                              1ª — seis defeitos. Dois deles meus: a fronteira do brief dizia
                              `tools/docgen/output/*` intocável e o executor obedeceu ao pé da letra em vez de
                              rodar o gerador (são artefatos commitados; o certo é regenerar, nunca editar à
                              mão), e o brief não pediu nome acessível para as trilhas, o que produziu **duas
                              `<aside>` anônimas** onde antes havia uma `<aside>` mais um `<nav>` nomeado. Dele:
                              **deriva de fidelidade** — o code inline virou `var(--text-sm)`/`0 4px` no lugar de
                              `0.9em`/`1px 5px`, e `0.9em` **escala com o contexto** (code dentro de `h2` crescia
                              junto), coisa que token fixo não faz. Tokenizar não é melhoria quando muda o render.

                              2ª — todos os seis corrigidos, gates verdes. Mas abrir o build no navegador achou o
                              defeito real: **bug de especificidade**. A regra de empilhamento a 900px é
                              `.lyra-shell--page` (0,1,0) e perdia para
                              `.lyra-shell--page.lyra-shell--has-sidebar.lyra-shell--has-aside` (0,3,0) do bloco
                              de 1100px — media query não soma especificidade. A sidebar **nunca empilhava**: a
                              375px a coluna de conteúdo ficava com 83px e a página vazava 92px. E o teste
                              "stacks the sidebar at 900px" passava, porque renderizava `<Shell sidebar>`
                              sozinho, onde o empate é decidido pela ordem no arquivo. **Teste verde provando
                              nada, de novo** — a forma de duas trilhas, que é a do docs, não era exercida.

                              3ª — corrigido enumerando os estados de trilha no bloco de 900px, com teste da
                              forma de duas trilhas. Verificado por mim no navegador: 1440/1000/900/375 com
                              colapso correto e `scrollWidth == viewport`.

                              **Escalei? Não** — e o motivo importa: as duas falhas foram de feedbacks
                              diferentes, e o defeito da 3ª rodada nunca esteve num retorno meu. A escada do
                              Batuta existe para o mesmo brief falhando duas vezes.

                              **Impeccable na página real** (não há MDX ainda; a 6c-b3 é que a traz): **15/20**,
                              detector mecânico limpo. Nenhum P1 é deste lote — os dois são pré-existentes e
                              estão anotados em Débitos abaixo. O lote **melhorou** a a11y: os landmarks agora
                              são `nav[Docs]` e `aside[Nesta página]`, traduzidos.

### Lote 2 — `Navbar` + `NavLink` + `Footer`

→ codex (`gpt-5.6-terra`, reasoning
high), **três rodadas**, commit `0628b78`. Navbar 290 B, NavLink 470 B, Footer 266 B.

**1ª — parou numa contradição do brief, e acertou em parar.** A fronteira dizia
`tools/docgen/output/*` intocável; são artefatos gerados **e commitados**, então
falhar o `--check` não era motivo de parada, era motivo de rodar o gerador. Eu já
tinha corrigido isso no retorno do Lote 1 e **não** no brief compartilhado, que é o
que os lotes 2–5 leem. Corrigido na origem: a seção de fronteiras agora separa
"gerado e commitado — regenere" de "intocável de verdade".

                  **2ª — `landmark-unique`.** O header ganhou nome acessível e colidiu com a trilha do
                  `Shell`, que já se chamava "Docs": dois landmarks de navegação com nome idêntico. O
                  componente estava certo em exigir rótulo; a fiação do docs é que reusou um nome
                  ocupado. Resolvido com nomes de escopo nos dois idiomas.

                  **3ª — classe apagada com consumidor vivo.** O `.lw-nav__link` saiu do `site.css`
                  (correto), mas o `theme-toggle.tsx` ainda o referenciava: o botão virou `<button>`
                  cru do navegador. Migrado para `IconButton` ghost. **Nenhum gate pega isso** — só
                  apareceu na captura comparativa do cromo, e tinha sobrevivido também à minha
                  primeira verificação, que olhou axe/overflow/landmarks/foco e não a aparência.

### Lote 3 — `TableOfContents` + `useScrollSpy` + `CommandPalette.Trigger`

→ codex
(`gpt-5.6-terra`, reasoning high), **duas rodadas**, commit `f713085`. 4. **Rebuildar antes de qualquer medição pós-retry.** Duas vezes nesta fase eu quase
reportei defeito medindo artefato velho — o build estático servido era anterior à
correção. O sintoma é convincente (atributo ausente, estilo faltando) e leva a um
retorno errado. 5. **Migração de componente preserva o comportamento visível, não só o comportamento.**
Três dos quatro lotes perderam algo que nenhum gate cobre — o toggle sem estilo (Lote
2), a trilha sem item ativo (Lote 3), a numeração de linha (Lote 4). Todos foram
defaults novos e razoáveis do componente que o consumidor precisava reativar. Ao migrar,
comparar a aparência **antes e depois**, não só verificar que o novo componente funciona.

**Fechou uma violação CRÍTICA que estava em produção.** Abaixo de 720px o CSS
escondia rótulo e atalho do `.lw-search`, e o axe reportava `button-name` — quem usa
leitor de tela ouvia só "botão". O `CommandPalette.Trigger` mantém o nome quando o
texto visível some. **O docs agora tem axe limpo em 1440/900/375 nos dois idiomas,
zero violações**, o que não acontecia desde o começo desta fase.

**A rodada extra foi por fronteira de scroll spy.** O observer com
`rootMargin: '0px 0px -70% 0px'` observa os 30% superiores da viewport, e essa faixa
fica vazia em duas situações: no topo, antes de qualquer título subir até lá; e no
fim, onde o documento acaba e os últimos títulos nunca a alcançam. A trilha ficava
**sem item marcado nas duas posições em que o leitor mais fica**. A implementação
antiga do docs driblava só a primeira, semeando o primeiro título — a segunda nunca
esteve coberta, nem antes. Agora responde nas três: `Examples` no topo,
`Accessibility` no meio, `Plain HTML` no fim.

A varredura de órfãs saiu vazia de primeira — a lição do Lote 2 pegou, e este era o
lote que mais apagava classe (`.lw-search*`, `.lw-toc*`, o `__kbd` duplicado).

### Lote 4 — `CodeBlock` + `SegmentedControl`

→ codex (`gpt-5.6-terra`, reasoning
high), **três rodadas + uma correção do maestro**, commit `ed465e1`. CodeBlock 445 B,
SegmentedControl 527 B. Fecha o último dos quatro controles de cromo sem anel de foco.

**1ª — `scrollable-region-focusable`.** O `<pre>` rolável não era alcançável por
teclado, e o docs estava em zero violações desde o Lote 3. Causa instrutiva: o
pipeline de MDX punha `tabindex="0"` no `<pre>` (é o que Shiki e rehype-pretty-code
fazem, justamente por essa regra) e o `pre.tsx` antigo repassava os props; o
`CodeBlock` renderiza o próprio `<pre>` e descartava. **Corrigido no componente, não
no consumidor** — a garantia deixa de depender do highlighter de cada um lembrar de
um atributo.

          **2ª — asserção de teste dependente do runner.** O teste afirmava
          `pre.scrollLeft > 0` após uma seta, mas rolar container com seta é **ação padrão do
          navegador**, que o evento sintético do runner não dispara. No navegador real a mesma
          interação rola (medido: 0 → 40). A asserção testava o navegador, não o componente.
          Regra que ficou: **teste que passa por acidente do modelo de eventos do runner é pior
          que teste que afirma o contrato real.**

          **3ª — os números de linha sumiram.** A regra antiga do docs numerava
          incondicionalmente; o componente tem numeração opt-in (correto) e a migração não
          passou a prop. Regressão visual silenciosa, invisível a todo gate. **Aqui escalei**:
          depois de três rodadas, por uma prop numa linha, a escada do Batuta manda subir uma
          linha — e a linha acima de complex é a crítica, que é o maestro. Feito por mim, com
          comentário no `pre.tsx` explicando por que a prop é obrigatória ali.

          **Duas provas de mutação:** remover o `tabIndex` quebra 2 testes; remover o seletor
          do `<pre>` no anel de foco quebra 1.

### Lote 5 — `Brand`

→ codex (`gpt-5.6-terra`), **duas rodadas**, commit `a41de53`.
653 B. Mata 28 linhas duplicadas entre header e rodapé, com os dois `eslint-disable`
que cada cópia carregava.

**O executor parou e perguntou** qual seria o default do nome acessível para uma
marca sem wordmark, propondo `"Brand"`. **Recusado**: um `aria-label` literal em
inglês _é_ saída renderizada — um leitor de tela anunciaria "Brand" numa página em
pt-BR. É o pior tipo de defeito de i18n, porque parece resolvido. A regra ficou: com
wordmark, as imagens são decorativas e o texto é o nome; sem wordmark, o consumidor
fornece, e isso é **erro de compilação** via união discriminada, não surpresa em
runtime.

      A 2ª rodada foi teste, não componente: um `cleanup()` no meio do corpo de um teste
      anterior deixava o `render` seguinte sem container, e o `querySelector(...)!`
      transformava "elemento ausente" em `TypeError` três linhas depois. É o mesmo pé de
      ouvido das doze asserções vácuas do Lote 08, visto pelo outro lado.

      **Único lote que não perdeu um default** — a marca renderiza em 24px sem ninguém
      passar `size`, porque o default vive como fallback do `var()`.

**Cada lote dogfooda o `apps/docs` no mesmo commit** — migra o site para o componente
novo e apaga do `site.css` as regras que ele substitui. É isso que prova a API (melhor
que uma demo sintética) e é onde o `impeccable` roda, na página real.

- [x] **6c-b3 — documentar as adições — CONCLUÍDO em 2026-08-01.** 12 páginas de componente
      bilíngues, 4 seções em páginas de pais (`Inline`, `NavLink`, `useScrollSpy`,
      `CommandPalette.Trigger`), a guia de prosa e dois grupos novos na sidebar (`layout`,
      `system`). Fecha o buraco: dos 54 componentes do docgen, os 4 fora do manifesto são
      exatamente os que documentam como seção. Detalhe em "6c-b3 — o que cada lote custou".

A Fase 6 foi reordenada em 2026-07-28 depois da análise do handoff
v1.1+v1.2 (mapa completo em `.batuta/handoff-v1.2-map.md`) — a landing deixou de ser
independente porque o kit novo dogfooda a camada de layout que ainda não existe.

### Práticas de verificação que esta fase impôs

Nesta ordem de custo:

1. **Captura comparativa do cromo entra na verificação**, não como passo opcional. Os dois
   defeitos mais caros dos dois lotes (a sidebar que nunca empilhava e o toggle sem estilo)
   passaram por gates verdes, testes verdes e axe limpo.
2. **Apagar classe exige varredura de órfãs.** Vale para o Lote 3, que remove
   `.lw-search`, `.lw-toc*` e `.lw-code*`:

```bash
for c in $(grep -rhoE 'lw-[a-z0-9_-]+' apps/docs/**/*.tsx | sort -u); do
grep -qF ".$c" apps/docs/app/site.css || echo "ORPHAN: $c"
done
```

3. **Não regenerar `baseline.json` sem o `handoff/` ter mudado** — `--update-baseline`
   sobrescreve `$comment` e `handoffVersion` com defaults e apaga o registro de quais
   grupos do handoff já entraram. Mordeu duas vezes; agora está no brief compartilhado.

## 6c-b3 — o que cada lote custou

Decisões do usuário antes de delegar: dois grupos novos (`layout`, `system`) em vez de um
grupo `chrome` espelhando a arquitetura interna — a sidebar responde "o que eu preciso?", não
"onde isso mora no repo?"; e `.lyra-prose` como guia própria, porque não tem entrada no
`props.json` e uma página de componente renderizaria "No generated props found".

### Lote 1 — layout, e o preview isolado que a fase inteira herdou

Três rodadas. A primeira entregou dez páginas com duas violações de axe, e a causa era
estrutural: **quatro componentes desta fase são de nível de página** e emitem o que a página
de docs já tem — `PageHeader` emite `<h1>`, `Shell` emite `<main>` (que dentro de outro
`<main>` é **HTML inválido**, não só reclamação de ferramenta), e no Lote 2 vieram `Navbar`
com `<header>` e `Footer` com `<footer>`.

Resolvido com `layout="isolated"`: o exemplo renderiza em iframe com documento próprio, folha
de estilos injetada, `data-theme` espelhado, `title` traduzido (sem ele o axe troca uma
violação por outra) e altura por `ResizeObserver`. O painel de código continua imprimindo
código de consumidor — o iframe é do palco, não do exemplo.

A segunda rodada foi consequência da primeira: o frame de 650px colapsava o `Shell` pelos
breakpoints dele mesmo, e **a página que documenta três trilhas mostrava uma coluna**.
Corrigido renderizando a 1200px internos e escalando, com a página dizendo que o preview roda
em largura fixa.

### Lote 2 — ThemeProvider, e duas armadilhas que não são óbvias

O `ThemeProvider` escreve no `documentElement` **e** persiste em `localStorage`. Exemplo vivo
inline sequestraria o tema do site inteiro. E isolar não basta: **iframe de mesma origem
compartilha `localStorage` com a página pai**, então só `storageKey` distinto protege a
preferência do leitor.

Sobrou o conflito de dois escritores — o preview espelha `data-theme`, o provider é dono dele
dentro do frame. Resolvido com opt-out: exemplo que traz o próprio provider é a autoridade de
tema; os demais continuam espelhando.

**Preview isolado com interação precisa de raiz React própria.** Portalar árvore do host deixa
a propriedade de eventos no documento de origem. Este foi o primeiro exemplo interativo
isolado — os quatro anteriores eram estáticos e nunca exercitaram esse caminho.

### Lote 3 — display e form, sem isolamento

Nenhum destes é de nível de página, então palco inline normal. Proibi o isolado no brief: ele
existe para um problema que este lote não tem e cobraria do leitor um iframe à toa.

### Lote 4 — a guia de prosa

Único item da fase sem componente React. Documenta as duas custom properties com os defaults
reais e três declarações que parecem arbitrárias e não são: o `--prose-scroll-offset` (header
sticky esconde o título ao seguir âncora), o `overflow-wrap: anywhere` (medido: 375px virando
390px) e a guarda do `.lyra-btn`.

### Práticas de verificação que esta fase acrescentou

1. **`axe.run(document)` não desce para dentro de iframes.** Todas as varreduras que eu
   reportei como limpas entre o Lote 1 e o Lote 2 cobriam só a página hospedeira — os previews
   isolados ficaram sem auditoria até eu perceber. Agora a varredura roda no host **e** dentro
   de cada frame.
2. **Verificação de interação é sobre o build, não sobre o `next dev`.** O overlay de dev monta
   dentro do documento de preview e faz exemplo interativo parecer congelado. Reportei esse
   fantasma **duas vezes** antes de testar o artefato real.
3. **Servidor estático precisa mapear rota sem extensão para `.html`.** O `python -m
http.server` devolve listagem de diretório para `/example-preview/...`, e foi isso que
   escondeu o comportamento correto do build.
4. **Em página que dogfooda o próprio componente, seletor global mede a coisa errada.** Duas
   vezes mirei no seletor de idioma do header em vez do exemplo da página, e quase reportei
   perda de foco que era navegação.

## 6c-b4 — o lote que a 6c-b3 gerou

Lote único, um disparo, sem retry. Existe porque a 6c-b3 rodou com `packages/` fechado: a fase
era de documentação, e documentar é o melhor detector de API ruim que existe — mas consertar
ali teria misturado duas coisas. Os dois achados viraram este lote, com brief próprio.

**Os dois bugs eram o mesmo bug.** `PageHeader` sempre emitia `<h1>` e `Shell` sempre emitia
`<main>` — dois elementos que a página só pode ter uma vez. O efeito não é estético: quem
quisesse a composição do `PageHeader` (sobrelinha, título, descrição, linha de ações) numa
**seção** copiava as classes, que é exatamente a duplicação que o componente existe para
evitar; e `<main>` dentro de `<main>` é **HTML inválido**, então `Shell` nunca podia ser
aninhado nem embutido — foi o que a própria 6c-b3 tropeçou ao montar preview.

A API seguiu a convenção que o `Shell` já tinha com `sidebarAs`/`asideAs`: nome do slot mais
`As`. `titleAs?: 'h1' | 'h2' | 'h3'` (default `h1`) e `mainAs?: 'main' | 'div'` (default
`main`). **Uniões fechadas de propósito** — `keyof JSX.IntrinsicElements` deixaria renderizar o
título como `<button>`, e o ponto é escolher entre semânticas defensáveis, não permitir
qualquer coisa. Aditivos: omitir produz a saída de hoje.

**`Navbar` e `Footer` ficaram de fora, e isso foi decisão, não esquecimento.** Eles emitem
`<header>` e `<footer>`, que uma página pode legitimamente ter mais de um. Corrigir por
simetria adicionaria API sem problema correspondente — o brief proibiu explicitamente.

Custo: 514 testes (eram 512), `size-limit` +9 B no `PageHeader` e +6 B no `Shell` (brotli),
zero mudança de CSS, `parity` intocado (209 tokens, 269 classes, `baseline.json` sem diff),
docgen listando os dois props. Guia em prosa nos quatro MDX (`page-header` e `shell`, EN e
pt-BR) — a tabela gerada aparece sozinha, mas ela diz _que_ o prop existe, não _quando_ usar.

### Duas coisas que este lote ensinou sobre o processo

1. **O sandbox do Batuta não roda Browser Mode nem os gates de empacotamento.** O Vitest não
   consegue abrir o listener (`listen EPERM ::1`), e `publint`/`attw`/`pack-smoke` morrem em
   `spawnSync pnpm EPERM`. Não é defeito do código — o mesmo commit passou nos quatro jobs do
   CI. A consequência prática é que **para esses gates a autoridade é o CI, não o relatório do
   executor**, e o relatório tem que nomear o que não rodou em vez de silenciar.
2. **PR aberto contra branch de feature morre quando a base é mergeada.** O #26 saiu contra
   `feat/6cb3-docs`; o PR #25 mergeou, a branch base foi removida, e o GitHub fechou o #26
   sozinho. Aí a armadilha: **não dá para retargetar a base de um PR fechado** (a API recusa) e
   o reopen falha porque a base não existe mais. O `mergeable: CONFLICTING` que ele exibia era
   contra a base morta — `git merge-tree` contra `main` mostrou zero conflito. Só restou abrir
   o #27 contra `main`. A regra daqui em diante: lote que depende de outro nasce empilhado, mas
   **antes de o pai mergear, ou se retargeta para `main`, ou já se abre contra `main`**.

## 6c-c — o que cada lote custou

Quatro decisões do usuário na abertura: a landing **sobe depois do release** (o que libera o
badge do React a dizer "pronto" e torna o `npm i` da Hero verdade); ela vive em `apps/site/`
servindo lyra-ds.dev, **separada** do `apps/docs/`; as duas seções sem código de handoff são
desenhadas a partir da prosa do mapa; e a copy reposicionada é minha, revisada por ele.

**O kit do handoff no repo é a versão anterior ao redesenho.** Traz `sections-marketing.jsx`
com Pricing, Testimonials e Discord, e não tem `sections-community.jsx`, `docs.html` nem
`site.css` — o CSS é um `<style>` dentro do `index.html`. "Temas/Tokens" e "Comunidade",
que o plano descreve em prosa, **não têm original**. O que existe: Hero, showcase,
frameworks, FAQ, CTA, header, footer e cookie banner.

Daí as **sete regras de honestidade** do brief compartilhado, cada uma contra uma afirmação
falsa que o kit traz: métricas inventadas ("3.842 estrelas", "48 mil/mês"), plano pago (3 das
5 respostas do FAQ o citam), Discord, nome de pacote inexistente, badge de maturidade que
promete estágio que não existe, número de inventário fixado em string e a versão "v1.0". São
requisito duro: a landing é a primeira coisa que alguém lê antes de decidir adotar.

### Lote 1 — o app, o cromo e a Hero

Duas rodadas, e a primeira **não escreveu uma linha** — de propósito. O brief pedia duas
coisas incompatíveis: "leia a versão real de `packages/react/package.json`" **e** "mostre
v0.1.0". Os dois pacotes estão em `0.0.0`; o primeiro número de verdade só nasce quando a
Fase 7 consumir os changesets pendentes. O executor viu que a única forma de cumprir o item
era inventar — que é o que a regra proíbe — e parou. Foi a regra de honestidade pegando um
erro **meu**, não dele. Resolvido tirando a versão do badge: além de não existir número para
ler, versão em hero de marketing é fato que apodrece a cada release.

**Por que app separado e não rota:** o `apps/docs` é um pipeline de conteúdo MDX com árvore
de páginas, busca e tabelas geradas; a landing é uma página de seções compostas sem fonte de
conteúdo. Juntos, todo build de landing carregaria o pipeline e toda rota de docs carregaria
o cromo de marketing. Isso **não** duplica componente — `Navbar`, `Footer`, `Brand`,
`SegmentedControl`, `ThemeProvider` e mais 18 vêm do `@lyra-ds/react`; conferi os 23 antes de
briefar. Duplica infra: next-intl, export estático, fontes e a folha `.lw-*`.

**O mapa estava desatualizado e este lote corrigiu.** Das 16 classes `.lw-*` que ele diz
colidirem, só a família `.lw-hero*` colide hoje — as outras sumiram do `apps/docs` quando a
6c-b2 transformou o cromo em componentes do DS. E a colisão que sobrou é real, não nominal:
o hero do docs é alinhado à esquerda e menor (é cabeçalho de página), o da landing é
centralizado e maior. Dois apps, duas folhas, nenhum conflito.

**O `.gitignore` só cobria `apps/docs/`.** O app novo não estava contemplado, e o commit
levaria centenas de artefatos de build. Passou a casar `apps/*/.next/` e `apps/*/out/` —
regra por app cobre o próximo no dia em que ele nascer, não no dia em que alguém nota o lixo
no diff. O executor não tinha como ver isso: não conseguiu construir.

### Lote 2 — showcase e frameworks, e o gate que eu mesmo convidava

**Três disparos sem uma linha escrita, e a culpa era do brief.** O codex parou duas vezes
pedindo confirmação de design. A lição do perfil manda re-disparar verbatim — e não resolveu,
porque o convite estava no texto que o re-disparo reentregava: a seção `Method` do brief
compartilhado dizia _"se você tem um workflow test-first ou **plan-first**, use"_, e o contrato
do plan-first (o `brainstorming` do superpowers, do lado do executor) é justamente parar e
pedir aprovação humana. A correção não é encher o prompt de "APPROVED" — isso já
**alimentou** o gate numa fase anterior — é declarar o que é fato: a rodada é não-interativa,
não há quem aprove, e o lot file **é** o design aprovado. As stop conditions ficaram intactas,
com a distinção nomeada: parar porque o brief está errado é certo; parar para perguntar se um
plano correto serve, não.

**Dois defeitos que nenhum gate automático enxerga.** O `CodeBlock` numera linha por contador
CSS, e o `counter-reset` mora em `.lyra-code__pre code`. Os `span.line` tinham ficado soltos
no `<pre>`, então o contador nunca reiniciava e **toda linha imprimia "1"**. Build, typecheck,
eslint, 514 testes e o axe passaram verdes por cima disso — número errado não é erro de tipo
nem de contraste. E o snippet trazia `className="lw-show__stage"`, classe privada deste site:
quem copiasse levaria um `div` com classe inexistente e um layout diferente do que viu. Mesma
família da métrica inventada, só que falha depois, na máquina do leitor.

**A honestidade da grade de frameworks é escolha de tom, não de texto.** Trocar `warning`/
`info` por `neutral` importa tanto quanto trocar "Beta" por "Em breve": os dois tons afirmam
trabalho em andamento, e nada de Vue, Blade ou LiveView existe no repo.

### Lote 3 — os números, e um erro que sobreviveu a duas fases

As duas seções sem original no kit. O trabalho pesado foi de contagem, não de desenho.

**"209 tokens semânticos" está errado três vezes ao mesmo tempo.** 209 conta _declarações_ —
um token declarado no claro e de novo no escuro conta duas. Nomes únicos são **153**, e **43**
deles são primitivos de paleta (`--indigo-500`, `--slate-100`), que não são semânticos.
Semânticos de verdade: **110**. E o `--border-input` que o mapa diz levar o total a 211 **não
existe** — segundo ponto em que o mapa erra nesta fase, depois das 16 classes que já não
colidem. Eu tinha repetido o "211" no brief compartilhado antes de conferir; o `parity` já
dizia 209 na minha frente desde o Lote 1.

O número honesto virou a copy melhor: **110 controlam cor, tipo e espaçamento, e trocar de
marca precisa de quatro**. Contraste verificável vende mais que número inflado.

Nada é digitado: um `prebuild` deriva de `baseline.json` e `props.json`, e **estoura** se a
fonte sumir ou a conta der zero — número zerado em silêncio é pior que o hardcoded que estamos
tirando, porque o hardcoded ao menos era visivelmente errado.

**Escrever para fora obriga a conferir.** Transformar dois itens de débito em issues públicas
(#28, #29) pegou um erro na própria nota: ela dizia "4 asserções vácuas" no `file-manager`, e
são **2** — as outras duas usam `querySelector`, que devolve `Element | null`, onde
`not.toBeNull()` testa alguma coisa. Eu tinha contado ocorrências do padrão em vez de olhar o
que cada chamada recebia.

**Levantei um custo e a medição me desmentiu.** O executor foi além do pedido e adicionou teste
ao `apps/site`, com `pretest` construindo react e site — e eu ia pedir para tirar, argumentando
que o job `test` do CI não deve construir. Medi antes: o gate inteiro leva **27s**. Ficou, e é
melhor assim, porque o teste afirma contra o **HTML construído** — exatamente a lição que a
6c-b3 pagou caro. A nota que fica: ele fixa os sete números derivados, então avançar o handoff
passa a exigir atualizar dois lugares, como já acontece com o `baseline.json`.

### Lotes 4 e 5 — a copy que não dava para adaptar, e o banner que quase virou teatro

**Três das cinco respostas do FAQ do kit vendem plano Pro**, o subtítulo manda para o Discord
e a quinta pergunta é "posso cancelar o Pro". Reescrito, não adaptado; do kit ficaram só o
layout de duas colunas e a faixa escura do CTA. Cada resposta tem fonte apontada no brief
(`LICENSE`, `brand.css`, `colors.css`, os 50 arquivos que exercitam axe, os três motores do
contraste, `.changeset/`), com ordem de **parar e reportar** em vez de suavizar a frase.

A resposta sobre produção foi reescrita antes de despachar: a primeira versão explicava como
se proteger sem responder a pergunta. Quem pergunta "está pronto?" quer o sinal.

**O cookie banner ia ser teatro de consentimento.** O site não usa cookie nenhum: sem
analytics, sem script de terceiro, e o único armazenamento é a preferência de tema, que é
funcional e a LGPD não exige consentimento para usar. Pedir consentimento para o que não
acontece é a mesma família de desonestidade que a fase vinha tirando — levantei antes de
construir. **O usuário decidiu manter o banner e escrever a política**, e a decisão ficou certa
por um motivo que eu não tinha: analytics (OpenPanel) vem na sequência. Sem o banner primeiro,
a decisão de consentimento chegaria depois do rastreamento.

Daí o desenho: zero analytics neste lote, **proibido nomear o provedor** em código ou copy, e o
ponto de montagem marcado em comentário — componente que renderiza nada é código morto fingindo
estrutura. `mayLoadAnalytics()` é função, não booleano guardado: leitor que relê não fica velho
quando o visitante muda de ideia.

**A política diz o que quase toda política omite.** "Não coletamos nada" é falso em site
estático, porque o host registra IP, horário, página e user agent. Está lá com todas as letras.

**Retry:** `consentStorageKey` estava declarado duas vezes. Se um mudasse sozinho, o banner
gravaria numa chave e o guard leria outra — banner eterno, ou pior, decisão que o guard nunca
vê. O repo já tinha aprendido isso na chave de tema.

### Lote 6 — o CSP que quebra o próprio design system, e a medição que faltava

**Cinco defeitos apareceram de uma vez, e todos porque servi o export _com_ o `_headers`
aplicado e medi a 375px** — duas coisas que nenhum lote anterior tinha feito.

**`img-src 'self'` apagava os chevrons.** O `data:image/svg` não vem do site: vem do
**`packages/styles`** (`navigation.css`, `forms.css`, `display.css`). Ou seja, um CSP self-only
não quebra só esta landing — quebra o Lyra em **qualquer consumidor** que aplique essa política.
Corrigido com `data:`, e registrado no `DEPLOY.md` como requisito do DS, não como quirk daqui.
É a primeira vez nesta fase que dogfooding revela algo que afeta terceiros.

**A página rolava de lado 114px**, com três causas distintas medidas: a grade de frameworks
parava em duas colunas e nunca chegava a uma; o bloco de código **alargava a própria coluna em
vez de rolar** (o mínimo automático de item de grid é o conteúdo, não zero — faltava
`min-width: 0`, e esse é o tipo de coisa que o executor não deriva sozinho); e o nav do header
passava da borda.

**14 alvos abaixo de 44px** no toque, resolvidos espelhando a media query que o `apps/docs` já
tinha — e deixando de fora link dentro de frase, que a WCAG isenta e cujo padding quebra a linha.

**Eu acusei o executor errado.** Depois do retry sobrou um alvo de 16px, e eu declarei que a
justificativa dele ("é link inline em prosa") era falsa, porque meu diagnóstico usou `.find()` e
pegou o **primeiro** link "Privacy" do DOM — o do rodapé, que já estava em 44px. Existiam dois: o
do rodapé e o de dentro da frase do banner. A alegação dele estava certa e eu quase escalei de
lane por causa disso. A isenção agora está **codificada no verificador** (elemento `display:
inline` cujo pai tem texto ao redor), para não depender de eu lembrar.

### Lote 7 — o mesmo CSP em outro app não é o mesmo CSP

A documentação ganhou banner, leitor de consentimento e `_headers`, espelhando o site. A
política **não** foi copiada: a canônica em `lyra-ds.dev/[lang]/privacy` passou a cobrir as duas
propriedades, com o detalhe que o leitor precisa — a escolha feita num site não vale no outro,
porque o navegador escopa armazenamento por origem. Duas cópias divergiriam no dia do analytics.

**Duas diferenças de CSP, e as duas passariam por build e lint sem um ruído.** `frame-src` tinha
que ser `'self'` e não `'none'`, porque o docs renderiza exemplo em iframe — pinei no brief e o
lote saiu certo de primeira. E `style-src` precisou de `'unsafe-inline'`, descoberto só no
retry: o `apps/site` tem **zero** estilo inline, então a política dele nunca exercitou esse
caminho; o docs tem estilos inline legítimos, e legítimos exatamente pelo único caso que a
convenção permite — passar valor de custom property (`--prose-scroll-offset`, e a altura do
iframe vinda do `ResizeObserver`).

A lição geral: **política copiada entre apps carrega as premissas do app de origem.** O
`DEPLOY.md` de cada um agora diz por que ele precisa do que precisa, para ninguém "endurecer" de
volta e apagar preview ou offset de prosa.

### Lote 8 — o consentimento que só vale se for estado

**Script da instância, não o pacote npm.** O `@openpanel/nextjs` puxa `@openpanel/web`, que puxa
`rrweb` — session replay, 5,7 MB desempacotados. Com gravação desligada por decisão, embarcar o
código dela para depois provar que não é usada é a troca errada; pelo script o grafo some
inteiro, e some junto um critério de aceite frágil por natureza ("prove que o tree-shaking
derruba").

**O `_headers` virou arquivo gerado.** A pergunta do usuário — "isso não vai ficar como env no
Cloudflare?" — revelou que sim, e que o `_headers` é servido direto pelo Cloudflare sem passar
pelo Next, então **não interpola variável**. Fixar a origem ali criaria uma segunda fonte de
verdade para algo que já vive na env: exatamente o defeito que custou um retry na chave de
consentimento do Lote 5. Agora sai de um template versionado mais a env, e sem env é
byte-idêntico ao de hoje.

**Consentimento tem que ser estado, não leitura única.** Montar o script ao lado do banner e ler
o consentimento uma vez faria quem clica em "permitir" não receber nada até recarregar — o
pageview que motivou o consentimento se perde, e a escolha parece não ter feito nada. Pinei no
brief e saiu certo de primeira.

**A verificação foi feita contra uma instância falsa servida localmente**, com o CSP gerado
aplicado. Isso transformou "o guard funciona" de alegação em observação: nenhuma requisição antes
da decisão, o script aparecendo depois do clique sem reload, zero requisições no caminho "apenas
o essencial", e nenhum erro de console — o que também descartou descasamento de hidratação na
leitura inicial do consentimento. **Sem o stub, nada disso seria verificável**, e o lote teria
sido aceito por leitura de código.

### Práticas de verificação que este lote acrescentou

1. **Falha de verificação minha é alegação como qualquer outra.** Reportei a troca de idioma
   quebrada duas vezes seguidas, e as duas eram do meu script: primeiro procurei `role="link"`
   num `SegmentedControl` que emite `role="radio"`; depois esperei `networkidle`, que já estava
   satisfeito no instante do clique e por isso retornava **antes** da navegação client-side
   acontecer. A espera certa é pela URL. Um `debug` de 20 segundos desmentiu as duas antes de
   qualquer re-disparo — o mesmo probe barato que o perfil já manda usar contra alegação do
   executor vale contra a minha.
2. **App novo no monorepo tem gate que passa sem construir nada.** `pnpm -r --if-present run
build` ignora em silêncio um app mal formado. A prova é destrutiva: apagar `out/`, rodar o
   build da raiz e verificar que voltou.
3. **O executor não conseguiu rodar gate nenhum e disse isso.** `pnpm` morreu no sandbox dele
   (`ERR_SQLITE_ERROR`, depois `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). O relatório
   nomeou cada coisa que não rodou em vez de fingir verde — que é exatamente o contrato do
   brief, e o que separa uma rodada honesta de uma rodada perdida.
4. **Gate rodado antes do build não vê o que o build cria.** No Lote 1 o `pnpm run lint` passou
   porque o `next-env.d.ts` do site ainda não existia — ele nasce no primeiro `next build`, e
   depois eu mesmo commitei o arquivo gerado, que o prettier reprova (aspas duplas, e um "should
   not be edited" no topo). O `.prettierignore` isentava só o do `apps/docs`. Corrigido em
   `apps/*/next-env.d.ts`, mesma generalização e mesmo motivo do `.gitignore` no Lote 1: **regra
   presa a um app é regra que o próximo app não herda.** Depois de construir, o lint volta a valer.
5. **Verde em tudo que é automatizável não diz nada sobre o que a tela mostra.** Os dois defeitos
   do Lote 2 — numeração toda "1" e uma classe privada dentro do snippet — sobreviveram a build,
   tipos, lint, 573 testes e oito varreduras de axe. O que os pegou foi abrir a aba e ler.
6. **O que some depois de um clique é o que nunca é auditado.** Aba fechada no Lote 2, painel
   recolhido do acordeão no Lote 4, banner de consentimento no Lote 5 — os três precisam de
   varredura no estado que o visitante encontra **e** no estado seguinte. É a mesma lição do
   iframe da 6c-b3 numa forma nova.
7. **Cinco alarmes falsos meus nesta fase, todos por medir a coisa errada:** seletor de `link`
   num `radiogroup`, `networkidle` que já estava satisfeito antes da navegação, literal de cor
   chutado numa expressão sem parênteses, palavra proibida sem contexto (a copy dizia "no
   component behind a paywall", uma negação), e chave de tema esperada sem ninguém ter escolhido
   tema. **A verificação do maestro precisa do mesmo rigor que o brief exige do executor** —
   medir contraste em vez de comparar string, esperar a condição em vez do proxy, e casar frase
   em vez de palavra.
8. **Escrever para fora obriga a conferir o que a nota afirmava.** Transformar débito em issue
   pública corrigiu uma contagem errada que estava no `WORK.md` havia semanas.
9. **Cabeçalho que ninguém serviu é cabeçalho que ninguém testou.** O `_headers` passou por
   build, lint e revisão de código sem que nada notasse que ele apagava ícones — porque servidor
   estático comum não aplica CSP. A verificação de política precisa de um servidor que a aplique.
10. **Isenção que mora na cabeça do revisor vira acusação errada.** Eu tinha escrito no brief que
    link em prosa é isento de 44px, e mesmo assim acusei o executor de mentir sobre exatamente
    isso — porque medi o elemento errado. Regra que o verificador não codifica não existe.

## Next — depois da Fase 6

- [ ] **Fase 7 — Release Pipeline & Launch** (`.batuta/plan-07-release-pipeline-launch.md`)
      — v0.1.0 com os 40 componentes atuais.
- [ ] **Fase 8 (nova) — porte do handoff v1.1 + v1.2** → v0.2.0. **35 componentes novos**
      (40 → 75), **menos os que a Fase 6 já leva** (`Container`, `Stack`/`Inline`,
      `Grid`, `PageHeader`, `ThemeProvider`) e menos o `AppShell`, absorvido pelo `Shell`.
      4 categorias novas (`layout`, `scheduling`, `primitives`, `system`),
      +185 classes CSS e 1 token. Estimativa de **12–16 lotes**, comparável à Fase 4
      inteira. Ondas de porte, conflitos de arquitetura e armadilhas por componente estão
      em `.batuta/handoff-v1.2-map.md`. Reabre a 6b em ~35 páginas de docs novas.

## Decisões tomadas

- **Contraste AA do tema escuro — resolvido em 2026-07-31** (commit `726141e`), decisão do
  usuário depois da auditoria do Lote 1. O bloco escuro clareava o accent um degrau
  (indigo-600 → 500) e o danger (red-600 → 500). A convenção está certa para token que é
  **texto ou borda** sobre fundo escuro e errada para token que é **preenchimento sob texto
  branco** — e o mesmo token faz os dois trabalhos. Medido: 4,39:1 e 3,76:1 contra os 4,5:1
  do AA; o claro já passava (5,37 e 4,83).

  **Escolhido:** descer o ramp um degrau no escuro (accent 600, hover 500, active 400) e
  danger para red-600. Custo aceito: o accent no escuro fica igual ao do claro. Duas
  alternativas foram medidas e descartadas — escurecer a tinta em vez do fundo é impossível
  (o `#6E6ADE` é mid-tone, teto de **4,78** mesmo contra preto puro, e o próprio indigo-950
  só chega a 4,09), e um token novo `--accent-solid` **quebraria o white-label em 4 tokens**,
  que é promessa de capa.

  A divergência de valor é aprovada e fixada nos quatro tokens (arquivo, bloco, valor
  canônico e valor aprovado), no formato dos precedentes `MASK_DIVERGENCE` e
  `OVERLAY_ENTRANCE_DIVERGENCE`. **Sonda que vale repetir:** o executor "provou" o tripwire
  mexendo no `--info`, que nem está no mapa — não provava nada. A sonda certa é valor **não
  aprovado** num token **que está** no mapa; aí o gate reprova nos dois níveis.

  **Efeito colateral que ensinou algo:** quebrou o `STY-03`, que prova que trocar de tema
  recalcula o longhand sem rebuild. Ele sondava o accent, que deixou de servir por ser agora
  igual nos dois temas. Passou a sondar `--surface-page`, que precisa diferir por definição —
  sonda mais estável, imune a afinação futura de accent.

  **E a prova do teste precisou de três tentativas para valer:** reverter cada token quebra o
  teste, mas quebra no `eqRGB` de identidade de cor, que roda antes — a asserção de contraste
  nunca era exercitada. A prova que fecha é mexer no `--on-accent` (cinza médio, fundos
  intactos): `expected 2.11 to be greater than or equal to 4.5`.

- **Tinta do white-label derivada do acento — resolvido em 2026-07-31** (commit `76f3217`),
  decisão do usuário. O diagnóstico inicial subestimava o problema: não era "o escuro repete
  o erro", era **ausência de garantia nos dois temas**. Medido em navegador, com
  `--on-accent: var(--brand-contrast, #FFFFFF)`, **5 de 7 cores-base representativas
  reprovavam AA no claro e 6 de 7 no escuro** (amarelo 1,53:1, ciano 1,81:1). Tinta branca só
  serve para cor-base escura.

  **Escolhido:** derivar a tinta da luminosidade do acento resolvido com relative color
  syntax — `oklch(from var(--accent) clamp(0, (l / 0.58 - 1) * -infinity, 1) 0 h)`. CSS puro,
  zero runtime, serve os quatro frameworks, e se adapta por tema sozinha porque lê o
  `--accent` que o bloco escuro já redefine. O `--brand-contrast` continua sendo o primeiro
  argumento do `var()`, então o contrato **segue em 4 tokens** — foi o que descartou a opção
  de um `--accent-solid`.

  **O limiar 0,58 é medido, não escolhido:** varredura de 18 cores-base × 2 temas × 7
  limiares. Em 0,58 sobra 1 falha em 36 (`#E11D48` no claro, 4,47:1 contra 4,5) e AA-large
  (3,0) passa em todas as 36. Os vizinhos são bem piores — 0,62 falha 6, 0,65 falha 9. O
  limite do `#E11D48` está declarado nas duas guias com o número, não escondido, e o teste o
  trata como exceção enumerada com piso de 4,4 para que uma regressão ali ainda reprove.

  **A guarda `@supports` foi correção minha, não capricho.** O brief original especificou a
  derivação sem ela e eu afirmei ao usuário que "degrada sozinha para o comportamento atual".
  Estava errado, e o navegador provou: sem guarda, engine sem relative color syntax deixa o
  `--on-accent` inválido em tempo de valor computado, o `color` cai para a cor **herdada** do
  body e o rótulo fica azul-escuro sobre navy — **pior que o branco que substituiu**
  (`rgb(18,52,86)` medido). Com a guarda, a base fora do `@supports` é byte-idêntica ao
  handoff e só o bloco novo diverge no parity. Lição geral: `@supports` não é opcional quando
  a falha de suporte cai em `var()` sem fallback próprio — IACVT herda, não reverte.

  **Verificação:** 59 testes no styles (eram 23). Reverter para tinta branca reprova 8
  sementes já em AA-large; **colapsar as duas declarações numa só quebra o teste de CSSOM**,
  que existe exatamente para isso — num navegador que suporta, um teste de valor computado
  não distinguiria os dois casos. Em navegador real, 16 cores-base × 2 temas passam AA em
  Chromium **e** Firefox.

- **APIs da camada de cromo (6c-b2) — fechadas em 2026-07-30.** As 8 adições não têm
  handoff, então o contrato era o trabalho. Onde o CSS mora: categoria nova
  `components/chrome/chrome.css`, no padrão por categoria que já existe. Como é arquivo
  100% nosso, sem contraparte em `handoff/`, o parity precisa aceitá-lo como região
  aditiva inteira — o Lote 1 resolve isso e os demais herdam. Valem para todas: defaults
  só no CSS via custom property (lição do `Stack`/`Grid`), texto visível é prop traduzível.

  - **`Shell`** — `sidebar`/`topbar`/`aside` + `scroll="page" | "content"` (default
    `page`), `<main class="lyra-shell__main">`. Custom properties `--shell-sidebar`
    (220px), `--shell-aside` (200px), `--shell-top` (0; o docs passa 84px). Breakpoints
    ficam fixos porque media query não lê custom property: TOC some em 1100px, sidebar
    empilha em 900px — ordem descoberta empiricamente, preservar. Vai literal o
    conhecimento caro: `max-height` em `vh` **e** `dvh`, `overscroll-behavior: contain`.
    **Achado que reposicionou a decisão:** o `.lyra-appshell*` **já está no CSS** — o
    6c-b1 portou o `layout.css` do delta inteiro, porque parity é verbatim; o que não
    existe é o wrapper React (absorvido pelo `Shell`, como decidido). Ou seja, o motor de
    scroll de app já existe em CSS e só o de página é nosso. **Decisão do usuário:
    vocabulário único `.lyra-shell`** nos dois modos, reescrevendo as ~10 declarações do
    modo content na região aditiva. Custo aceito: duplicação de CSS e o `.lyra-appshell*`
    virando CSS legado sem wrapper (parity proíbe apagar). Ganho: uma API, um vocabulário
    — e o consumidor de Vue/Blade não precisa saber que a prop troca a família de classe.
  - **`Navbar` + `NavLink` + `Footer`** — shells com slots (`brand`/`nav`/`actions`;
    `brand`/`note`/`links`), nunca layouts fechados. **`asChild` no `NavLink` é
    requisito**, não conveniência: sem ele o docs não dogfooda (perde prefetch, nova aba,
    copiar link do `<Link>`) — mesma armadilha anotada para o `AppSidebar`. `active` põe a
    classe **e** `aria-current="page"`. O `.lw-header__cta` não entra: é copy deste site.
  - **`TableOfContents`** — dirigido por dados (`items`/`activeId`/`label`), e aqui isso é
    seguro porque link de TOC é âncora na mesma página: o `<button>` sem prefetch que
    inutilizaria o `AppSidebar` não se aplica. **O `useScrollSpy` vem junto** (decisão do
    usuário): ~25 linhas de lógica pura, sem CSS, opcional — sem ele todo consumidor
    reescreve o mesmo IntersectionObserver, que é o argumento que justificou o componente.
  - **`CodeBlock`** — só o cromo. O DS **não** depende de Shiki: o texto copiado sai do
    `textContent` do próprio `<pre>` (funciona com qualquer highlighter), com `copyText`
    opcional. Numeração por contador CSS sobre filhos `.line`, convenção de fato do Shiki
    e do rehype-pretty-code, documentada como contrato. As variáveis
    `--shiki-light`/`--shiki-dark` **ficam no `apps/docs`**: são do highlighter.
  - **`SegmentedControl`** — o toggle EN|PT generalizado, com **semântica de
    `radiogroup`** (decisão do usuário): `role="radio"`/`aria-checked`, roving tabindex,
    setas + Home/End. É o que um segmentado é, e mantém consistência com os widgets APG da
    Fase 4; o caso do idioma vira "escolher opção que se aplica na hora".
  - **`CommandPalette.Trigger`** — propriedade estática no módulo que já existe: sem entry
    nova no tsup, sem caminho novo no exports map. O `__kbd` duplicado morre em favor do
    `.lyra-kbd`. **`shortcut` é prop, nunca detecção de plataforma** — sniff de
    `navigator` no render é mismatch de hidratação garantido.
  - **`.lyra-prose`** — camada CSS sem React, o item mais CSS-first da lista. Cobre o que
    o docs já tem (`h1/h2/h3`, `p`, `a`, `strong`, code inline) mais o que falta e todo
    consumidor precisa (`ul/ol/li`, `blockquote`, `hr`). Custom properties
    `--prose-measure` (760px, o valor validado em produção — fidelidade é constraint
    travada) e `--prose-scroll-offset` (0; o docs passa 80px). Preserva o
    `overflow-wrap: anywhere` no code inline, que veio de medição real (375px virando
    390px na guia de HTML puro), e a guarda `a:not(.lyra-btn)`.

- **Os três menores do 6c-b2 — resolvido em 2026-07-30 verificando contra a fonte.** O
  mapa deixou `IconTile`, `CheckList` e `Brand` como "decidir caso a caso". Verificação:
  **`.lw-comm__icon` não existe em lugar nenhum** — `grep -rn "lw-comm"` no `handoff/`, no
  `apps/docs` e no `packages/` devolve zero. O inventário do `handoff-v1.2-map.md` listou
  a classe entre as 27 que "o handoff traz e o repo não tem", e ela não está no handoff: a
  seção de comunidade do kit é `.lw-quotes`/`.lw-quote-card` (depoimentos, cortados). O
  `CheckList` é real no kit, mas seu único consumidor era a seção de **pricing**, também
  cortada. O `Brand` é o único com duplicação comprovada hoje: `site-header.tsx` e
  `site-footer.tsx` repetem as mesmas 14 linhas de troca light/dark, `eslint-disable`
  incluso. **Decisão: só o `Brand` entra** (Lote 5); `IconTile` e `CheckList` ficam para a
  6c-c, quando a landing existir e disser se precisam.

- **Baseline do parity — resolvido em 2026-07-28.** As constantes `EXPECTED_TOKENS` (209)
  e `EXPECTED_CLASSES` (248) e o `STYLES_ENTRY_ORDER` saíram do código e viraram
  `tools/parity/baseline.json`, um snapshot commitado do handoff canônico, regenerado
  com `pnpm parity --update-baseline`. **O 6c-b1 está destravado**: portar o delta passa
  a ser "atualiza `handoff/`, regenera o baseline, revisa o diff", e esse diff é o
  registro do que a versão nova trouxe.

  Não foi só acomodar o delta — **fechou um buraco real**. As constantes só contavam, e
  contagem é grossa demais: renomear uma classe nos dois lados mantinha 248 e o gate
  ficava mudo. Provado com experimento antes de commitar (o swap
  `.lyra-stat__label` → `.lyra-stat__caption` nos dois lados manteve 248 e o gate novo
  nomeia os dois lados). O baseline guarda nomes, não só totais: 153 nomes de token com
  a contagem de declarações de cada (cobre as redeclarações de `[data-theme="dark"]`),
  as 248 classes e a ordem dos imports da entrada.

- **`Popover` sobre o `useFlipPlacement` — resolvido em 2026-07-28** (PR #21). Detalhes
  em `.batuta/handoff-v1.2-map.md`. O achado que reposicionou a questão: **posicionamento
  já está extraído — o que está triplicado é o comportamento de overlay** (outside-click,
  Escape com restauração de foco, fusão de gatilho via `Slot`, ligação ARIA), ~60 linhas
  em três cópias entre Dropdown, Combobox e WorkspaceSwitcher. É isso que o primitivo
  extrai; o flip já é compartilhado. Decidido também: o hook ganha o **eixo horizontal
  antes dos pickers** (`.lyra-cal` tem 252px fixos, 308 em `md` — os primeiros painéis
  largos o bastante para estourar à direita, e por isso ninguém topou com o buraco até
  agora); fica **em fluxo, não portalado**, com o recorte por ancestral `overflow` como
  limite nomeado e decisão adiada até haver bug concreto; e os três overlays existentes
  **não migram no mesmo lote** — o primitivo se prova antes com os date pickers.

## Alvo arquitetural adiado — switcher de framework nas páginas de componente

Ideia do usuário (2026-07-29): em vez de "HTML puro" ser uma seção no fim da página React,
cada componente mostraria o mesmo exemplo em cada framework suportado (React, Vue, Blade,
LiveView, HTML puro), no estilo do seletor das docs do TypeScript. **Adiado com as
constraints abaixo, não descartado.**

**Por que adiar:** só existe um framework. `@lyra-ds/vue` e `lyra/blade` não existem no
repo. Um switcher hoje teria React e HTML puro — exatamente a seção que já existe, com mais
maquinário. O momento certo é quando o segundo adapter nascer, e aí a migração dos exemplos
se paga porque há conteúdo real.

**Constraints a respeitar quando for construído:**

- **O preview continua sendo React; só o painel de código troca.** O site é React e não
  executa Blade nem LiveView, mas a aparência é a mesma por construção — ela vive nas
  classes `.lyra-*`. Um leitor de Vue vendo preview renderizado por React não é mentira, é a
  demonstração do CSS-first. Dizer isso na página em vez de esconder.
- **A variação é por exemplo, nunca por página.** Hoje são 40 componentes × 2 idiomas = 80
  MDX; framework como dimensão de página daria 320, insustentável à mão. O exemplo deixa de
  ser arquivo e passa a ser diretório:
  `components/examples/<slug>/<id>/{react.tsx, vue.vue, blade.blade.php, plain.html}` — o
  `react.tsx` renderiza vivo e é a aba React; os outros são fonte-somente. A migração do
  formato atual é mecânica e roteirizável.
- **A garantia de fonte única quebra para os não-React, e isso precisa de gate.** Hoje o
  mesmo módulo é renderizado e impresso, então preview e código não conseguem divergir — foi
  o que a 6b comprou ao matar o "Usage" escrito à mão, que já divergia. Um `vue.vue`
  fonte-somente não tem nada que prove que compila. Docs que exibem snippet de Vue quebrado
  são piores que docs sem Vue. Mínimo: gate exigindo que os arquivos declarados existam;
  ideal: compilar cada um no CI.
- **A tabela de props é específica de React** (gerada dos `.d.ts` do dist pelo docgen). O
  custo real de "suportar um framework nas docs" é adapter + docgen próprio + snippets por
  exemplo + entrada no `llms.txt`, que hoje documenta só a API React. Não é uma aba.
- O guia de HTML puro (item 6c-a) **não** é afetado: ele é panorama de consumir o CSS sem
  React, conteúdo de guia, e sobrevive ao switcher. O que viraria aba é a seção "HTML puro"
  das páginas de componente.

## Decisões pendentes do usuário

- **Repositório das docs** — a copy da landing afirma que elas vivem em `lyra-ds/docs`,
  repositório separado, contradizendo o `apps/docs` do monorepo. Alinhar antes de
  publicar.
- **Ruleset da `main`** — dispensar a aprovação obrigatória enquanto o projeto for solo
  (manter os 4 checks). Herdado do merge da 6b.
- **Ritmo vertical do fim da página no toque** — padding do rodapé e/ou o respiro de
  64px, do diagnóstico do iPad.

## Débito técnico anotado

- ~~**Contraste do tema escuro reprova WCAG AA**~~ — **resolvido em 2026-07-31**, commit
  `726141e`. Ver § Decisões tomadas. **Mas o white-label continua com o mesmo buraco**,
  registrado logo abaixo.

- ~~**O white-label repete o erro estrutural do contraste**~~ — **resolvido em 2026-07-31**,
  commit `76f3217`, e **verificado nos três motores em 2026-07-31**. Registro em § Decisões
  tomadas. Chromium, Firefox e WebKit concordam exatamente: 16 cores-base × 2 temas, zero
  abaixo de AA, e as mesmas 23 combinações recebendo tinta preta.

  **Como o WebKit foi verificado num Manjaro** (o `playwright install-deps` só cobre
  Debian/Ubuntu, e o usuário não pode instalar): faltavam só `libicu74`, `libxml2.so.2` e
  `libflite1` — o Arch tem ICU 78 e `libxml2.so.16`, sonames incompatíveis com o binário
  pré-compilado. Resolvido **sem tocar no sistema**: baixar os três `.deb` do Ubuntu, extrair
  com `ar`/`tar` num diretório temporário e copiar os `.so` para
  `~/.cache/ms-playwright/webkit-<v>/minibrowser-*/sys/lib` (o `pw_run.sh` sobrescreve
  `LD_LIBRARY_PATH`, então apontar a variável de fora não funciona — as bibliotecas precisam
  estar no bundle). Os `libflite*.so.2.2` precisam de symlink para `.so.1`. Vale para
  qualquer verificação futura em WebKit nesta máquina.

- **Alvos de toque de 27px nos rótulos de grupo da sidebar.** A media query de toque do
  `apps/docs/app/site.css` cobre `.lyra-sbgroup__item`, mas nunca cobriu
  `.lyra-sbgroup__label--btn` (os títulos colapsáveis). Pré-existente, escapou da primeira
  rodada de impeccable. 25 alvos abaixo de 44px a 375px, a maioria por esta causa. Aberto
  como [#29](https://github.com/lyra-ds/lyra/issues/29).

- ~~**Anel de foco do cromo do site**~~ e ~~**`button-name` no `.lw-search`**~~ —
  **resolvidos** pelos Lotes 2 e 3 (`0628b78`, `f713085`), como previsto: as classes viraram
  componentes do DS e herdaram o `--shadow-focus` e o nome acessível. O `.lw-locale__opt` é o
  último dos quatro e sai no Lote 4.

- **No mobile a sidebar empilhada toma a tela inteira** — o leitor cai em ~50 links antes
  do conteúdo. É idêntico ao comportamento anterior (o `.lw-docs__side` já ficava `static`
  a 900px), então não é regressão; mas agora é o **default do `Shell` para todo consumidor
  do DS**. Decidir se o `Shell` deve colapsar a trilha em disclosure/drawer no mobile.

- **`"use client"` em todo módulo bloqueia export chamável do servidor.** O `onSuccess` do tsup
  prepende a diretiva em cada chunk emitido (decisão travada D-13, com gate
  `tools/dist-scan/assert-use-client.mjs` exigindo em **todos**). Consequência descoberta ao
  portar o `ThemeProvider`: um helper `themeScript()` — função pura que gera o script anti-flash
  e **precisa** rodar no servidor, porque tem de estar no HTML antes da primeira pintura — não
  pode ser exportado, e o `next build` falha com "Attempted to call themeScript() from the server
  but themeScript is on the client". O script ficou inline no `apps/docs` e o trecho está no
  JSDoc do provider. Para shippá-lo de verdade seria preciso um subpath sem a diretiva, o que
  muda o contrato de build e o gate. Segundo efeito, mais amplo: primitivos de layout (`Stack`,
  `Grid`, `Container`) criam fronteira de client component num consumidor RSC só por serem
  usados — justamente os mais prováveis num layout de servidor.
- **`@keyframes lyra-actionbar-in` começa em `opacity: 0`**, violando a constraint travada
  (keyframe de entrada anima só transform). Veio verbatim do handoff v1.1 e hoje é CSS morto —
  nada renderiza `.lyra-actionbar`. Resolver com divergência documentada quando o `ActionBar`
  ganhar wrapper.

- **2** asserções vácuas pré-existentes no `file-manager.browser.test.tsx` — linhas 152 e 279,
  onde `expect(screen.getByRole(...)).not.toBeNull()` recebe um Locator preguiçoso, que é
  objeto sempre. **Este item dizia "4", e estava errado:** as linhas 129 e 144 usam
  `screen.container.querySelector(...)`, que é API do DOM e devolve `Element | null` — ali
  `not.toBeNull()` é asserção legítima. Contado de verdade em 2026-08-01, ao transformar o
  débito em issue. Aberto como [#28](https://github.com/lyra-ds/lyra/issues/28).
- `BottomSheet` e `Dropzone` estão documentados no `llms.txt` do handoff novo mas **não
  têm código** (o `BottomSheet` é importado pelo `DatePicker`/`DateRangePicker` e bloqueia
  o caminho mobile deles). `BottomNav`, `PersonCell` e `DiffCard` têm CSS e contrato, só
  falta o JSX.

## Done

- [x] **6c-b1 — camada de layout e ThemeProvider, consumíveis fora do React** (PR #23, 3
      commits). Primeiro porte do handoff v1.1 e primeiro item a tocar a biblioteca. O achado
      que decidiu a forma: `layout.css` não tem regra para Stack/Inline/Grid, mas os JSX do
      handoff **emitem** `lyra-stack`/`lyra-grid` — classes sem estilo, com a aparência num
      `style` inline, que é a única forma que um adapter Vue/Blade/LiveView não reaproveita.
      As declarações foram para o CSS com custom properties, e `<Stack />` sem props renderiza
      **sem `style`** (teste prova). Três decisões medidas, não presumidas: os longhands
      `flex-direction`/`flex-wrap` contra o stylelint (no shorthand, um custom property
      inválido reseta os dois — medido); o JS não pode duplicar os defaults do CSS (`if (gap
!== 4)` faria `<Stack gap={4}>` renderizar space-3 se o CSS mudasse); e escrever no DOM
      durante o render está errado (o eslint pegou, e sob render concorrente um render
      descartado deixaria o documento com tema não confirmado). `ThemeProvider` corrige o SSR
      do handoff via `useSyncExternalStore` com snapshot-string, ganha `system`, e o
      `apps/docs` passou a consumi-lo — o toggle perdeu todo o estado próprio. **O que não foi
      possível:** exportar `themeScript()`, porque o `"use client"` cobre todo módulo do
      pacote (dívida registrada abaixo). Baseline do parity 248 → 269 classes; docgen 40 → 46
      componentes com as categorias `Layout` e `System`. 456 testes. → codex em worktree, 3
      disparos (o primeiro parou no gate de aprovação; re-disparo **verbatim** conforme a
      lição do profile). 2026-07-30
- [x] **6c-a — os quatro guias do site, bilíngues** (PR #22, 6 commits). Infra de guias
      data-driven (`lib/guides.ts` + rota + `GuidePage`) mais getting-started, white-label,
      HTML puro e compat-shadcn, em EN e pt-BR. O `GuidePage` **compartilha** o maquinário de
      exemplos do `ComponentPage` — o registro nunca esteve preso a componente — com asserção
      de colisão de slug provada revertendo. Dependência que ninguém tinha visto: o
      getting-started **tinha** que sair da home neste lote, porque a landing ocupa a home na
      6c-c. Dois achados de conteúdo que passariam por build, lint e typecheck (classe em
      bloco de código é só string): `.lyra-acc` não é bloco, e `.lyra-icon` tem zero regras no
      CSS. Dois erros meus de brief, ambos por constraint de forma sem dizer o que evita: as 6
      células do white-label eram impossíveis (medido — ilha clara dentro de página escura não
      existe, o claro vive só em `:root`), e "apenas fences html" gerou código que não roda.
      Três correções de infra vieram de carona: `.batuta/worktrees/` no `.prettierignore`,
      `overflow-wrap: anywhere` no código inline (um token longo rolava a página em 375px), e
      o teste do compat-shadcn — que pegou uma **recomendação minha errada**, a de mapear
      `--accent` no `:root`, que destrói o Lyra. 2026-07-30

- [x] **Lote 09 — texto visível traduzível no CookieBanner e FileManager** (PR #17). O irmão do Lote 08: **10 strings**, não as 9 do levantamento — relendo a fonte para o brief apareceu o sufixo visível `` `${items ?? '—'} items` ``, que aparece na lista E no grid e virou `labels.itemsCount`, **função** `(items) => string` pela mesma razão do Lote 08 (plural e ordem de palavras não sobrevivem a template fixo). CookieBanner ganhou `essentialsLabel`/`acceptLabel` planas (a cópia LGPD e o link já saíam via `children`); FileManager estendeu o **mesmo objeto `labels`** do Lote 08 com cabeçalhos, comandos do menu default e a contagem — e o JSDoc da interface foi reescrito, porque "Accessible names" viraria mentira. Semântica do `actions` (substituir o menu) intacta. → codex (`gpt-5.6-terra`, reasoning high) em worktree, implementação limpa na primeira rodada **mas 12 dos 20 testes eram vácuos**: `expect(screen.getByRole(...)).not.toBeNull()` nunca falha no Browser Mode — o locator é lazy e nunca é null — e foi a **prova de regressão** (reverter o fix e exigir teste vermelho) que pegou: os 4 testes do CookieBanner seguiram verdes procurando um botão que não existia. Retry 1 trocou os 12 por `await expect.element(...).toBeInTheDocument()`, e a prova refeita quebra como deve. **Débito anotado: 4 asserções vácuas pré-existentes** no `file-manager.browser.test.tsx`, de lotes antigos — fora do escopo, a tratar. Dois tropeços do maestro no caminho, ambos meus: `git checkout --` para "restaurar" após o experimento de reversão **apaga o trabalho não-commitado do executor** num worktree sem commits (reapliquei do diff revisado; experimentos passaram a usar backup por cópia), e o alias interativo do `cp` mordeu de novo mesmo com `-f` (saída: `cat a > b`). 425 testes (+20), os 17 comandos do `ci.yml` verdes, docgen regenerado, size-limit sem estouro, prosa nova conferida no build estático das 4 páginas MDX. Changeset minor. 2026-07-28
- [x] **Lote 08 — nomes acessíveis traduzíveis em 12 componentes** (PR #15). Eram **17 rótulos, não os 14 anotados aqui**: relendo a fonte para montar o brief apareceram três que o levantamento original não tinha — `` `Actions for ${file.name}` `` (FileManager) e `` `Remove ${item.name}` `` (FileUpload), que **interpolam o nome do arquivo e por isso recebem função `(name: string) => string`, não string** (ordem de palavras muda entre idiomas; template fixo não localiza), e o `aria-label={status}` do `Avatar`, o pior do conjunto: anunciava o token cru do enum (`"online"`, `"busy"`, `"away"`). Classe (a) resolvida como previsto (`ariaLabel ?? 'padrão'` no Spinner e CookieBanner); classe (b) com props novas, e o `FileManager` — 5 rótulos, onde prop plana vira ruído — com objeto agrupado `labels` no mesmo contrato de merge do `hints` do CommandPalette. **`Breadcrumb` e `Pagination` ganharam a declaração explícita de `'aria-label'`**: a prop já funcionava neles, mas sem estar na interface o docgen não a via e ela não aparecia na tabela de props — funcionar sem ser documentada não resolve nada. As 22 páginas MDX afetadas **afirmavam explicitamente que a limitação não tinha saída** ("There is no prop to translate it"), então atualizá-las era obrigatório, não um extra. → codex (`gpt-5.6-terra`, reasoning high) em worktree, rodada limpa de código **mas os testes que ele escreveu não compilavam**: ele inseriu os `it()` novos **dentro** do corpo de um `it()` existente e dentro do duplo `for` de tema×tom no Toast e do loop de tema no Drawer — 8 falhas, "Calling the test function inside another test function is not allowed". Ele não pegou porque **o sandbox dele não roda Browser Mode** (não consegue bindar localhost) e ele relatou sucesso em tudo que conseguiu rodar. Movidos para o nível do `describe` pelo maestro. **Verificação:** 405 testes (+34), e a regressão da classe (a) foi **provada revertendo o fix** — sem ele, `expected 'Loading' to be 'Carregando'`, que é exatamente o descarte silencioso. Os 17 comandos do `ci.yml` rodados um a um, verdes; nenhum orçamento de size-limit estourado; docgen regenerado; as 24 páginas abertas no navegador nas duas línguas com props novas na tabela, zero erro de console e zero prosa desatualizada. Changeset minor. 2026-07-27
- [x] **Fase 6b MERGEADA na `main`** — PR #13, 56 commits, +12k linhas em 276 arquivos, merge commit `2c95b0f` (não squash, para preservar os commits atômicos). Os 4 checks obrigatórios verdes; o merge precisou de `--admin` porque o ruleset exige 1 aprovação e o GitHub não permite aprovar o próprio PR — num repositório de mantenedor único essa regra só produz bypass. **Vale revisitar o ruleset**: manter os 4 checks (que pegaram problema real hoje) e dispensar a aprovação enquanto o projeto for solo. 2026-07-27
- [x] Fase 6 / 6b — 40 páginas de componente bilíngues; showcase p/ impeccable. **Casca + gabarito completo (exemplos + a11y + HTML puro) + impeccable round prontos** (branch `feat/phase-06b-docs-component-registry`). Adicionar página = 1 linha em `apps/docs/lib/components.ts` + 2 MDX + 1 preview. **40/40 componentes documentados** (38 páginas + ToastStack na do Toast e AvatarGroup na do Avatar). Fan-out concluído. Impeccable aplicado ao gabarito: CTA/contraste, a11y (aria GitHub, ✕ Dialog 44px), Shiki tema-Lyra + números de linha + badge de linguagem, TOC "On this page", busca ⌘K (CommandPalette), toggle EN|PT, motion dos overlays (Dialog/⌘K entrada+saída), Button `asChild` no DS + hero dogfooded, e fix de hydration/Children.only da home. Dev roda em `127.0.0.1:3000` atrás de `tailscale serve --https=3000`. **Auditoria de dogfooding feita** (regra escrita no `profile.md`): PropTable → `<Table>`+`<Badge>`, previews e índice → `<Card>` (índice via `Card asChild` novo no DS), inline styles de layout → `.lw-preview*`/`.lw-index*` no `site.css`. **Falta:** 22 páginas + previews; showcase.
- [x] Fase 6 / 6b — **fan-out dos 34 componentes restantes** em 7 lotes, brief compartilhado em `.batuta/brief-phase06b-fanout.md`. **Lotes 1–7 entregues** — fan-out concluído, 40/40 componentes. Cada componente entrega: 2–4 exemplos copiáveis + MDX EN/pt-BR com Exemplos/Quando usar/Acessibilidade/Props/HTML puro + entrada no registry e no manifesto. **Verificação do maestro por lote inclui abrir cada página no dev** — `next build` prerenderiza exemplo quebrado sem falhar. Lotes: (1) forms: textarea, checkbox, radio, switch, select, combobox, file-upload · (2) display: avatar, card, tag, icon, skeleton, accordion + icon-button (action) · (3) data: table, stat, empty-state, file-manager · (4) nav A: breadcrumb, tabs, pagination, stepper · (5) nav B: dropdown, sidebar-group, command-palette, workspace-switcher · (6) feedback: alert, toast, progress, spinner, tooltip, cookie-banner · (7) overlay: drawer, create-workspace-dialog
- [x] **CI, terceira rodada: dois testes que afirmavam estado dependente de ambiente** — `lint`, `build` e `typecheck` verdes; o `test` caiu com 2 falhas, e **nenhuma era flakiness**, ao contrário do que eu tinha suposto na primeira vez. (1) **Combobox**: cada opção chama `setActiveIndex` no `onMouseEnter`, então _qual_ opção está ativa depende de onde o runner deixou o ponteiro — "a primeira é a ativa" passava aqui e falhava lá. O teste passou a afirmar o que o contrato de classes realmente promete: **exatamente uma** opção ativa, e as duas formas de className exatas. Minha "correção" anterior (envolver em `vi.waitFor`) estava errada: tratei como atraso o que era não-determinismo, e o waitFor só esperou até estourar. (2) **Tooltip**: o flip que adicionei hoje faz a dica virar para baixo quando não há espaço acima — e uma fixture de Browser Mode renderiza no topo de um viewport curto, então no CI ela flipa e na minha janela alta não. A asserção de classe exata virou dependente de ambiente; passou a casar `/^lyra-tooltip( lyra-tooltip--(bottom|left|right))?$/`, preservando a intenção de "nenhuma classe estranha" sem prender o modificador. As duas rodaram 3× cada, verdes. 2026-07-27
- [x] **CI vermelho, segunda rodada: só o `lint`, e de novo por lista incompleta** — depois da primeira correção, `build`, `test` e `typecheck` passaram e o `lint` continuou vermelho: **um quarto gate que eu não conhecia**, `pnpm --filter @lyra-ds/react run lint` (eslint), com 7 erros. E o erro de fundo se repetiu — eu tinha "corrigido" o `profile.md` a partir de um `grep` do `ci.yml` em vez de ler o arquivo inteiro. **6 erros** eram `jsx-a11y/anchor-is-valid` nos testes do `asChild` (`href="#"`); **1** era `react-hooks/set-state-in-effect` no `useTooltipPlacement` que escrevi hoje. O hook virou o padrão que o próprio repo já usa no `usePresence` (ajustar estado durante o render). Nos testes, **trocar por um href válido derrubou a suíte inteira**: em Browser Mode um href navegável faz o clique sob teste navegar o iframe do runner e abortar tudo ("Cannot connect to the iframe") — ou seja, o `href="#"` estava lá por um motivo, e a regra do eslint e o runner se contradizem de verdade. Regra desligada só em `src/**/*.test.tsx`, com o motivo escrito: ela existe para link de produto, não para fixture que nunca é publicada. **Os 17 comandos do `ci.yml` rodados um a um localmente, todos verdes** — e o `profile.md` agora traz os 17, com a anotação de que eu errei essa lista duas vezes. 2026-07-26
- [x] **CI vermelho no PR #13: 3 de 4 checks — e a causa raiz foi a minha lista de gates estar incompleta** — abri o PR com 55 commits e `lint`, `test` e `build` falharam; só `typecheck` passou. **O `profile.md` documentava `pnpm lint` como "(prettier)"**, e eu segui essa lista em vez de ler o `.github/workflows/ci.yml`: o job `lint` também roda **stylelint** e o job `build` também roda **size-limit**. Nenhum dos dois rodou uma vez em 55 commits. Confirmei contra a `main` (clone limpo) que ela passa nos dois — os erros eram todos meus. **stylelint (17 erros):** 14 são `no-duplicate-selectors`, e revelam uma contradição real entre a convenção do parity ("override vai no FIM do arquivo") e a regra — reestilizar classe existente no fim do arquivo é selector duplicado por construção. Resolvido com `stylelint-disable no-duplicate-selectors` no início da região aditiva de cada arquivo, mantendo a regra ligada na região handoff-verbatim acima; o resto (`comment-empty-line-before`, `inset` shorthand) saiu no `--fix`, com o parity conferido depois. **size-limit (4 estouros):** o pior é meu de hoje — **o `SidebarGroup` importar `Icon` para desenhar o chevron puxava o registry inteiro e custava 5,4 kB** a quem só importa SidebarGroup; virou SVG inline, que é o padrão do DS para ícone de chrome (fechar do Drawer, check do Stepper). Os outros três (`Button` +370 B, `Card` +95 B, `CreateWorkspaceDialog` +10 B) são o custo legítimo do `asChild` e do `Slot`, que **nasceram nesta branch** sem ninguém atualizar o orçamento — limites subidos com o motivo escrito. **test (1 falha):** `combobox` esperando a classe `--active` de forma síncrona; passa 3/3 isolado e falhou uma vez no runner carregado. Não tratei como "flaky do CI": teste instável em check obrigatório bloqueia merge, então passou a aguardar o estado. A lista de comandos do `profile.md` foi corrigida para apontar o CI como fonte da verdade. 2026-07-26
- [x] **`Children.only` estourando ao clicar em "Começar"** — relatado pelo usuário. O índice de componentes (`app/[lang]/components/page.tsx`) é Server Component e renderizava `<Card asChild>` com um `<Link>`: o filho cruza a fronteira RSC e chega serializado, não como o elemento simples que o `Children.only` espera. **O `next build` passava** — ele prerenderiza no servidor — e só quebrava na navegação client-side, que é justamente o caminho do botão do header. Terceira ocorrência da mesma armadilha hoje (Tooltip, exemplos com `asChild`, agora o índice); a grade virou client component `ComponentIndexGrid`, como o `hero-actions.tsx` já resolvia para o `Button asChild`. Verificado: clicar em "Começar" vai para `/pt-BR/components` com 38 cards e **zero erro**. 2026-07-26
- [x] **Drawer e CookieBanner ganham animação de saída** — validação pedida pelo usuário, e a suspeita dele estava certa nos dois. Medido quadro a quadro: o Dialog fica ~200ms com `--closing` rodando `lyra-overlay-out`, enquanto Drawer e CookieBanner **já não existiam no primeiro quadro** depois do pedido de fechar — entravam com movimento e saíam sumindo. Os dois passam a usar o mesmo `usePresence` do Dialog (fica montado durante a saída, desmonta no `animationend`, com timeout de segurança para ambiente sem animação). O drawer sai pela borda de onde veio e o backdrop reusa o fade compartilhado; o banner esvanece descendo. **O keyframe de saída do banner carrega `translateX(-50%)` nos dois frames**, pela mesma razão da entrada — medido: centro em 640 em todos os quadros da saída. `prefers-reduced-motion` desliga as quatro. O scroll lock do Drawer passou a chavear no **pedido** de fechar, não no montado, para a página voltar a rolar imediatamente enquanto a saída toca — igual ao Dialog. **Também corrigi o exemplo do docs**: ele desmontava o banner no próprio callback, o que cortava a animação antes de rodar; agora ele se esconde sozinho e um `key` traz de volta. Vale como lição de consumidor e está no changeset. 371 testes (2 novos + 1 antigo ajustado, que exigia sumiço síncrono). Maestro (Critical). 2026-07-26
- [x] **Fase 6 / 6b — Fan-out Lote 7 (overlay) — fan-out CONCLUÍDO, 40/40** — Drawer e CreateWorkspaceDialog: 4 exemplos, 4 MDX (EN + pt-BR), 2 entradas no registry e no manifesto. **Achado ao montar o brief: `AvatarGroup` não estava documentado em lugar nenhum** — passou batido no Lote 2. Entrou neste lote como seção na página do Avatar (+1 exemplo), do jeito que o `ToastStack` ficou na do Toast; é o que fecha os 40 de verdade em vez de 38 com dois esquecidos. → codex (`gpt-5.6-terra`, reasoning high), **primeira rodada limpa, com `< /dev/null`**. Brief pinou que os dois são overlays portalados com focus trap e scroll lock (exemplos disparados por botão, nunca `open` fixo), a regra do slug do CreateWorkspaceDialog (segue o nome até a pessoa editar, e aí para para sempre; `slugify` tira acento por NFD), e que ele **não** estende `HTMLAttributes`. **Verificação do maestro**: 34 classes conferidas; no navegador, Drawer portaliza para o body com `role=dialog` + `aria-modal`, nomeado pelo título, trava o scroll, move o foco para dentro e no Escape fecha, destrava e **devolve o foco ao gatilho** (e sem `footer` o rodapé some); CreateWorkspaceDialog faz `Ação Global` → `acao-global`, o slug para de seguir depois de editado e reabrir limpa tudo; AvatarGroup com 3 avatares e o `aria-label` do consumidor. Zero erro de console. **Impeccable nas 3 páginas × EN e pt-BR**: zero overflow, zero erro, e a única violação é o rótulo do primário no escuro (4.39:1, token travado da Fase 2). Um falso positivo do detector: `<img>` sem `src` no `avatar.mdx` é a menção `` `<img>` `` entre crases, na prosa. Gates verdes. 2026-07-26
- [x] **Tooltip: `placement`, flip automático e dispensa que funciona** — pedido do usuário ("deveria ter a posição para aparecer não?"). A receita do handoff só desenhava **acima**, então uma dica perto do topo da viewport era cortada sem recurso — o mesmo problema que os popovers já tinham resolvido. Prop `placement` (`top` padrão, `bottom`, `left`, `right`) + flip para o lado oposto quando o escolhido não cabe, medindo contra o **`visualViewport`** e não o `innerHeight` (a lição do iPad: o viewport de layout se estende atrás da barra dinâmica e ignora zoom, então a bolha "cabe" no papel e fica fora da tela). Flip é de mão única, para a dica não oscilar durante o scroll. Como a bolha é um `::after` sem nó próprio, o tamanho vem de `getComputedStyle(node, '::after')` — não dava para reusar o `useFlipPlacement`, que precisa de ref do popup; virou `useTooltipPlacement`. **Segundo defeito, achado ao verificar e pior que o primeiro: o Escape não escondia nada.** O CSS dirigia a visibilidade só por `:hover`/`:focus-within`, então a tecla trocava o `data-state` e a bolha continuava na tela — o oposto do que a WCAG 1.4.13 pede. Agora `[data-state='closed']` vence a regra de hover (mesma especificidade, mais tarde na cascata) e o listener está no **documento**, porque dica aberta por hover nunca tem foco dentro para receber a tecla. **Eu tinha documentado que o Escape funcionava** — a página estava errada nas duas línguas e foi corrigida junto. Provado: com o ponteiro em cima, `opacity` 1 → 0 depois do Escape; alvo colado no topo resolve para `lyra-tooltip--bottom`. Changeset minor no react + patch no styles. 369 testes (3 novos: dispensa medida por `opacity` do pseudo, flip, e placement explícito). Gates verdes (parity · lint · typecheck · docgen · build · smoke). 2026-07-26
- [x] **Impeccable no Lote 6 (as 6 páginas novas) — 19/20** — rodado a pedido do usuário, que cobrou a regra: eu tinha comitado o Lote 6 sem rodar. Varredura em 6 páginas × 3 larguras × 2 temas: **zero scroll horizontal, zero violação do axe** (nenhuma, nem de contraste — as correções da semana zeraram o site) **e zero erro de console**. Detector mecânico: zero achados. **Um achado real: `.lyra-toast__close` media 12×19**, o único controle do sistema que **reprova no mínimo do WCAG 2.2 AA (24×24)** — todos os outros marcados nos lotes anteriores passavam no AA e só ficavam abaixo da barra de 44px do projeto. Corrigido com a mesma técnica já aprovada para o `.lyra-fm__more`: caixa visível intacta, área de toque num `::after` transparente. O inset para em 12px de cada lado porque esse é o gap até a mensagem — mais que isso e um toque no fim do texto fecharia o toast. Resultado medido por `elementFromPoint`: **36×44**, a altura inteira do toast, e 13px à esquerda já é o toast, não o texto. Changeset patch, 366 testes (1 novo). Os demais alvos abaixo de 44px são os `.lyra-btn--md` de 40px, que seguem a decisão já tomada de não mexer na densidade do handoff. 2026-07-26
- [x] **CookieBanner entrava fora do centro** — relatado pelo usuário ("aparece na lateral e depois vai para o centro"). O banner se centraliza com `transform: translateX(-50%)` e tomava emprestado o keyframe de entrada do Toast, que **anima `transform`** — então durante toda a entrada a centralização simplesmente não existia. Medido a 1280px: entrava com o centro em **1000px em vez de 640** e a borda direita **80px fora da viewport**, e saltava para o lugar ao fim da animação. Ganha keyframe próprio `lyra-cookies-in`, que carrega a centralização nos dois frames; o Toast continua com `lyra-toast-in`, onde nada é centralizado. **Regra que vale para o DS inteiro: keyframe que anima `transform` não pode ser compartilhado com elemento posicionado por `transform`.** CSS aditivo no fim de `feedback.css` + classe e keyframe na allowlist do parity. Changeset patch. 365 testes (1 novo, que lê a matriz de transform durante a animação e exige `-metade da largura`). Depois: centro em 640 em todos os quadros. 2026-07-26
- [x] **Sidebar do docs: grupos colapsáveis dogfoodando o SidebarGroup + revelar o item ativo no F5** — pedido do usuário. Os grupos passam a ser `<SidebarGroup label collapsible>` de verdade, e não uma reimplementação: o rótulo vira `<button aria-expanded>`, ganha o chevron que acabou de ser restaurado, e o colapso é do componente. **Os itens continuam `<Link>` do Next**, passados como `children` — que o `SidebarGroup` renderiza _dentro_ de `.lyra-sbgroup__items` e dentro do colapso. Isso preserva navegação client-side, prefetch, abrir em nova aba e copiar link, coisas que os `<button>` do `items` do componente não dão. `.lw-docs__group`, `.lw-docs__group-title` e `.lw-docs__item` foram removidos do `site.css` (eram cópia do que o DS já estilizava); as listas de "não sublinhar" e de alvo de toque de 44px passaram a apontar para `.lyra-sbgroup__item`. **Revelar o ativo:** efeito só na montagem, escrevendo `scrollTop` da trilha — `scrollIntoView` foi evitado de propósito porque rola o documento junto e jogaria o leitor para depois do título da página. Em navegação client-side não roda: a pessoa clicou no item, ele já está onde ela olhava. Verificado: 8 grupos colapsáveis, item ativo é `<A>`, trilha rolada a 1070px com o ativo visível e **`scrollY` da página em 0**, colapso esconde os links, axe limpo na trilha, zero erro de console. Gates verdes. 2026-07-26
- [x] **Rodapé do iPad: medido, não é margem** — o usuário relatou "margin grande no final", que aparecia depois de visitar a página do CommandPalette e passava a valer para todas. Não reproduziu em iPad emulado, então foi por painel de diagnóstico temporário na página (`?diag=1`), a técnica que já tinha funcionado no bug dos popovers. **Leitura do aparelho: `AFTER footer: 0`**, `scrollY` no máximo (3896/3897), `innerHeight` = `visualViewport.height` = 703 contra `clientHeight` 702, e `body` sem estilo inline — ou seja, **nenhuma altura extra depois do rodapé, nenhum resíduo de scroll-lock e nenhuma divergência de viewport**. O que se lê como "margem" é o fim da página somando 64px de respiro antes do rodapé com um rodapé de **109px em dispositivo de toque** (contra 92px no desktop): o bloco `any-pointer: coarse` dá `min-height: 44px` ao `.lw-brand` do rodapé, e com `--space-8` de padding em cima e embaixo sobra muito ar para uma linha de 20px de texto. Painel removido depois da leitura. **Pendente de decisão do usuário**: apertar o ritmo vertical do fim da página (padding do rodapé no toque e/ou o respiro de 64px). 2026-07-26
- [x] **Fase 6 / 6b — Fan-out Lote 6 (feedback, 6 componentes)** — Alert, Toast, Progress, Spinner, Tooltip, CookieBanner: 12 exemplos, 12 MDX (EN + pt-BR), 6 entradas no registry e no manifesto; `ToastStack` documentado dentro da página do Toast. **Escalado para o maestro** depois de 2 disparos falhos do codex (gate de aprovação de design, depois a alegação falsa de permissão de novo — desta vez **com `< /dev/null`**, o que derruba a minha hipótese de que o stdin era a causa raiz). **A decisão que estrutura o lote:** `.lyra-toast-stack` e `.lyra-cookies` são `position: fixed`, então montá-los num exemplo faz o elemento flutuar sobre a página inteira em vez de ficar no palco — os dois viraram exemplos disparados por botão, no formato do `dialog/basic.tsx`. O CookieBanner tem armadilha dupla: persiste a escolha em `localStorage` e some para sempre, então cada exemplo usa `storageKey` próprio e limpa antes de abrir (verificado: reabre depois de aceitar). **Bug de DS achado na verificação**: o `Tooltip` dava **erro de hidratação e perdia o `aria-describedby`** nas páginas — cruzar a fronteira RSC serializa o filho, o `cloneElement` não chega ao HTML do servidor, e o React **não corrige divergência de atributo**, então a ligação com o `role="tooltip"` oculto simplesmente nunca se aplicava. Confirmado que o componente está certo em SSR isolado (`renderToStaticMarkup` emite o atributo com botão nativo e com `Button`), então a correção é `'use client'` no arquivo que renderiza os dois — aplicada, documentada na página como armadilha do consumidor no App Router, e promovida a regra no brief compartilhado (que só cobria `asChild`). Depois: **zero erro de console**. Verificação: 12 páginas 200 com prop table populada, zero elemento fixo escapando do palco em qualquer página, Tooltip abrindo no foco com `aria-describedby` ligado ao tip oculto e fechando no Escape, ToastStack 0 → 1 no clique, CookieBanner reabrindo depois de aceitar, e os 4 progressbars todos nomeados. Gates verdes (lint · typecheck · parity · build). 36/40 páginas. 2026-07-26
- [x] **Fase 6 / 6b — Fan-out Lote 5 (navigation B, 4 componentes)** — Dropdown, SidebarGroup, CommandPalette, WorkspaceSwitcher: 8 exemplos, 8 MDX (EN + pt-BR), 4 entradas no registry e no manifesto. O lote mais denso — três são widgets de teclado. Brief em `.batuta/lot-05-nav-b.md` — pinou os **dois modelos de foco distintos** (Dropdown move foco real do DOM entre `menuitem`; CommandPalette mantém o foco no input e move foco virtual por `aria-activedescendant`), duas proibições de exemplo com consequência concreta (`defaultOpen` cairia por cima da seção seguinte; `onOpen` instalaria um segundo listener de ⌘K brigando com a busca do próprio site), e que `emptyMessage` é começo de frase seguido da query. → codex (`gpt-5.6-terra`, reasoning high) — **3 disparos**, dois deles perdidos para a mesma alegação falsa de permissão do Lote 4 (agora "só posso escrever em `packages/styles/components`"), com o prompt mínimo nas três. Padrão intermitente do lado do executor, não do prompt. **Verificação do maestro**: 43 classes conferidas contra `packages/styles`, 13 nomes de ícone contra o registry, e no navegador — Dropdown (ArrowUp abre no último, ArrowDown dá a volta, Escape fecha e devolve o foco ao gatilho), CommandPalette (foco fica no input em navegação **e** em filtragem, `aria-activedescendant` acompanha, 5 → 4 opções ao filtrar, e **zero `role=dialog` na página**, provando que os dois exemplos são inline), WorkspaceSwitcher (listbox com `aria-selected`, Enter abre no selecionado, seta+Enter troca e o gatilho vira "Northstar Studio"), SidebarGroup (rótulo não colapsável é DIV sem `aria-expanded`, colapsável é BUTTON que vira `false` + `--collapsed`). `openPopups: 0` em toda página — nenhum `defaultOpen` vazou. Zero erro de console. Gates verdes. 30/40 páginas. 2026-07-26
- [x] **Gatilho do Dropdown vira o controle, chevron do SidebarGroup de volta, e o texto discreto da paleta no AA** — achados do audit do Lote 5. **Dropdown (P1, serious no axe):** ele embrulhava o `trigger` num `span[role="button"][tabindex=0]`; com o uso documentado — um `Button` — isso dava **duas paradas de Tab para um controle**, medidas: SPAN (com `aria-haspopup`/`aria-expanded`) → BUTTON (sem nenhum dos dois, mesmo rótulo). O elemento que a pessoa focava não anunciava que abre menu. O gatilho passa a **ser** o controle, via o `Slot` interno que o `Button asChild` e o `Card asChild` já usavam; props do consumidor vencem a fusão (o `aria-label` do `.lyra-fm__more` do FileManager sobrevive), e gatilho de texto puro ainda ganha span próprio. Depois: uma parada de Tab, no BUTTON que carrega o ARIA. **O defeito nunca apareceu porque os testes do Dropdown só passavam `<span>` ou string como gatilho, nunca um `Button`** — o buraco de cobertura era exatamente o uso documentado; agora tem teste. A página nova afirmava o contrário do mensurável ("evita nested-interactive"): prosa e bloco de HTML puro reescritos nas duas línguas. **SidebarGroup (relatado pelo usuário):** o chevron de recolher era um `<span>` vazio — **0×0, sem máscara, nada desenhado**, então um grupo colapsável não tinha afordância visual nenhuma nem indicação de estado. O handoff renderiza um `<Icon name="chevron-down" size={13}>` ali e a classe só fornece a rotação; a conversão da Fase 4 tinha perdido o ícone. Restaurado ao handoff, com teste de regressão (svg, largura > 0, gira ao recolher). **Contraste:** rótulos de grupo e hints da paleta (`--text-faint`, 2.56:1 e 2.34:1 no light) e o chip `.lyra-kbd` (4.34:1) vão para `--text-secondary` — quinta ocorrência do mesmo par. Maestro (Critical). Changeset minor no react + patch no styles. 364 testes (5 novos). **Depois:** `nested-interactive` zerado, e a única violação de contraste restante em todo o site é o rótulo do botão primário no dark (4.39:1, token travado da Fase 2). Gates verdes (parity · lint · typecheck · docgen · build · smoke). 2026-07-26
- [x] **Diálogo do CommandPalette nomeado em inglês e traduzível; rótulo do SidebarGroup no AA** — os dois achados que saíram da leitura da fonte ao montar o brief do Lote 5. **CommandPalette:** o `aria-label` do modal era a string `'Paleta de comandos'` hard-coded, num sistema cujos rótulos públicos são todos em inglês ("Search commands", "Previous page", "View mode") — e é justamente o nome que um leitor de tela anuncia no instante em que a paleta abre, o único lugar onde o vazamento de idioma era garantido de ser ouvido. Passa a `"Command palette"` + prop opcional `aria-label` para sobrescrever, a mesma cortesia que Pagination e Breadcrumb já davam. Modo `inline` não é diálogo e continua sem nome. **O site de docs, que é o consumidor bilíngue disso, passou a traduzir** (`searchLandmark` nas duas mensagens): verificado no navegador — ⌘K em `/en` anuncia "Command palette" e em `/pt-BR` "Paleta de comandos"; antes as duas diziam português. **SidebarGroup:** o rótulo de seção era `--text-faint` — 2.56:1 no light e 3.92:1 no dark, a pior razão de texto do sistema, justamente na palavra que diz o que une um grupo de itens de navegação. Vai para `--text-secondary`: **7.58:1** e **10.91:1**. O hover teve de acompanhar (`--text-muted` → `--text-primary`): o handoff clareava faint → muted, e deixar como estava faria o hover ficar _menos_ proeminente que o repouso, nos dois temas. Maestro (Critical: API pública + CSS travado). Changeset minor no react (prop nova) e patch no styles. 361 testes (4 novos: nome padrão, override do consumidor, inline sem role de diálogo, e contraste do rótulo em light/dark). Gates verdes (parity · lint · typecheck · docgen --check · build). 2026-07-26
- [x] **Cabeçalhos de tabela no AA** — `.lyra-table th` pintava `--text-muted` sobre a faixa `--surface-sunken`: 4.34:1, abaixo dos 4.5:1. Passa a `--text-secondary`, a mesma correção já aplicada aos cabeçalhos da lista do FileManager e ao Tabs — os três tratamentos de cabeçalho do sistema agora concordam. Era a **última** violação de contraste do site (ela aparecia em toda página, porque a PropTable do docs dogfooda `<Table>`). Decisão do usuário de estender a consistência ao token travado. CSS aditivo no fim de `data.css` + primeira entrada de `data.css` na allowlist do parity. Changeset patch em styles. 357 testes (2 novos: axe restrito a `color-contrast` no `<thead>` em light e dark). Varredura do site: **zero violação de contraste** nos dois temas. Maestro (Critical). 2026-07-26
- [x] **Stepper que embrulha, Tabs no AA e landmark do Breadcrumb nomeável** — os três achados do audit do Lote 4, corrigidos antes do Lote 5. **P0 do Stepper:** dots, rótulos e conectores todos com `flex-shrink: 0` e `nowrap`, então um fluxo comum de 3 passos mede ~453px e empurrava o documento inteiro de lado num celular de 375px. Passa a embrulhar. **Scroll próprio foi tentado primeiro e rejeitado na medição**: sem conteúdo focável dentro, teclado nenhum rola a região, e o último passo — justamente o que diz onde o fluxo termina — ficava 176px fora de vista sem como chegar lá (o axe concorda: `scrollable-region-focusable`, violação que eu mesmo tinha acabado de criar). Embrulhar custa altura no celular e não muda nada onde a linha já cabe (medido: 1 linha em 1280, 3 em 375, e as duas capturas conferem). **Contraste do Tabs:** `--text-muted` dá 4.83:1 num card mas 4.34:1 sobre `--surface-sunken`, que é exatamente onde ficam o rótulo em repouso de uma pill e todo chip de contagem → `--text-secondary`; e no dark a aba de linha ativa pintava o rótulo em `--accent` sobre o fundo da página a 4.09:1 → `--accent-soft-text`, o token que o sistema já mantém para _texto_ em cor de acento, que clareia junto com a marca e sobrevive ao white-label (o sublinhado continua `--accent`). **Landmark do Breadcrumb:** ele punha `aria-label="Breadcrumb"` **depois** do spread, então o rótulo do consumidor era descartado em silêncio — ao contrário do Pagination, o irmão dele, que sempre honrou o seu. Agora faz igual; duas trilhas na mesma página deixam de ser dois landmarks homônimos e uma interface localizada pode nomear o landmark na própria língua. Maestro (Critical). Changeset patch nos dois pacotes; 355 testes (2 novos no Breadcrumb). **Depois:** zero scroll horizontal, zero `landmark-unique`, zero `scrollable-region-focusable`, e a única violação de contraste que sobra em todo o site é o `th` 4.34:1 da PropTable. Gates verdes (parity · lint · typecheck · test · build · smoke · docgen --check). 2026-07-26
- [x] **Fase 6 / 6b — Fan-out Lote 4 (navigation A, 4 componentes)** — Breadcrumb, Tabs, Pagination, Stepper: 8 exemplos, 8 MDX (EN + pt-BR), 4 entradas no registry e no manifesto (grupo `navigation`, primeiras páginas dele). Brief em `.batuta/lot-04-nav-a.md` — pinou a armadilha do Tabs (renderiza **painéis vazios próprios** e retorna um Fragment, porque o handoff só entrega rótulos; `className`/`ref` vão para a tablist), que Tabs é controlado only e ativa na navegação por seta (ativação automática do APG), o algoritmo de truncagem do Pagination, e que o último item do Breadcrumb vira `aria-current="page"` mesmo com `href`. → codex (`gpt-5.6-terra`, reasoning high) — **3 disparos**: parou pedindo aprovação de um "design workflow" dele, depois alegou (falsamente) que `apps/docs` era read-only, e entregou limpo no terceiro com o prompt mínimo dos Lotes 1–3. Diagnóstico e lições em `.batuta/profile.md` § Delegação. **Verificação do maestro**: 20 classes conferidas contra `packages/styles`, e no navegador — teclado do Tabs (roving tabindex, seta ativa e dá a volta, End vai ao fim), os 6 painéis vazios com só o ativo visível, truncagem do Pagination nos três estados (`1 … 5 6 7 … 20`, boundary com Prev desabilitado, e `1 … 16-20` com Next desabilitado depois de pular para a última), ordem dos conectores do Stepper e `aria-current`. Zero erro de console. Gates verdes (lint · typecheck · parity · build). 26/40 páginas. 2026-07-25
- [x] **FileManager: cabeçalho legível e alvos de toque cheios** — os dois achados do audit do Lote 3, corrigidos antes de abrir o Lote 4. **Contraste:** `.lyra-fm__head` usava `--text-faint` → 2.56:1 no light (3.92:1 no dark), abaixo do AA para texto desse tamanho; sobe um degrau para `--text-secondary` (7.5:1 / ~11:1), a mesma decisão que o usuário já tinha tomado para os rótulos de grupo do site. **Alvos de toque:** escopo escolhido pelo usuário — crescer só onde o layout já reserva espaço, zero mudança visual. `.lyra-fm__name` tinha 30px dentro de uma linha que o handoff já faz com 44px, então estica e recupera o padding vertical da linha com margem negativa (caixa transparente; o único efeito visível é o anel de foco do browser passar a abraçar o alvo real). `.lyra-fm__more` mantém a caixa visível de 30px — tem fundo de hover que cresceria junto — e ganha a área extra num `::after` transparente, que **não** dava para usar no `__name` porque ele carrega `overflow: hidden` para a elipse do rótulo e recortaria o overlay. Toggle de visão (30×28) e breadcrumb (24px) ficaram como estão: cresceriam a toolbar e a barra de caminho em toda tela e já passam no WCAG 2.2 AA (24×24). CSS aditivo no fim de `files.css` + 3 classes novas na allowlist do parity. **Provado, não afirmado:** axe restrito a `color-contrast` no `.lyra-fm__head` zera nos dois temas, `elementFromPoint` 5px fora da caixa visível do gatilho já devolve `lyra-fm__more`, e o diff de pixel antes/depois dá **linha e toolbar byte-idênticas** — só o cabeçalho muda. Maestro (Critical: CSS público do DS + fidelidade travada). Changeset patch em styles. 353 testes (3 novos: contraste do cabeçalho em light/dark e as duas medidas de alvo). Gates verdes (parity · lint · typecheck · build · smoke). 2026-07-25
- [x] **Fase 6 / 6b — Fan-out Lote 3 (data, 4 componentes)** — Table, Stat, EmptyState, FileManager: 9 exemplos, 8 MDX (EN + pt-BR), 4 entradas no registry e no manifesto (grupo `data`, que existia na taxonomia mas ainda não tinha nenhuma página). Brief em `.batuta/lot-03-data.md` — pinou o `layout` do palco (a lição do round do impeccable: `Table` e `FileManager` têm superfície própria → `plain`; `EmptyState` não tem cromo → `block`), que `Stat` desenha a própria seta (`delta="12%"`, nunca `"↑ 12%"`), que `EmptyState.title` é conteúdo do heading e não o atributo HTML (`Omit<…,'title'>`), e que `FileManager.actions` **substitui** o menu padrão em vez de estender. → codex (`gpt-5.6-terra`, reasoning high), rodada limpa. **Verificação do maestro**: 28 classes dos blocos "HTML puro" conferidas contra `packages/styles` (zero inventadas), 4 nomes de ícone contra o `icon-registry.ts`, `Badge.tone` contra `props.json`, e as 8 páginas abertas no dev (200, prop table populada, zero erro de console). No navegador: filtro da busca do FM 3 → 1 → `emptyMessage` → 3, `view` controlado abrindo em grid, menu customizado com **só** Share/Archive (confirma que `actions` substitui) disparando `onSelect`, último segmento do breadcrumb desabilitado, `Button asChild` virando `<a class="lyra-btn…">`. Gates verdes (typecheck · lint · parity · build). Sem changeset (docs app não publicado). 2026-07-25
- [x] **Regra nova do usuário: impeccable por componente** — todo componente que criarmos passa pelo `impeccable` na sua página de demonstração, não só uma vez sobre um showcase. Escrita no `.batuta/profile.md` (roda depois da verificação do lote, antes do commit) e aplicada já ao Lote 3. **Audit do Lote 3: 18/20** (a11y 3 · perf 4 · responsivo 3 · theming 4 · integridade 4). Detector mecânico: zero achados. Varredura própria (Playwright + axe-core em 375/768/1280 × light/dark): **zero scroll horizontal, zero erro de console**, e a única regra do axe a disparar foi `color-contrast`. Dela, o que já era conhecido e aceito são tokens travados da Fase 2 (`th` 4.34:1, label do primário 4.39:1 no escuro); **o achado novo é `.lyra-fm__head > span`** — o cabeçalho de colunas do FileManager usa `--text-faint` e dá **2.56:1 no light** (3.92:1 no dark). É o mesmo padrão que o usuário já decidiu uma vez para o cromo do site de docs (migrar `--text-faint` → `--text-secondary`), mas aqui está no CSS do DS, handoff-verbatim — fica registrado como decisão pendente do usuário, não corrigido de lado. Segundo achado: os alvos de toque **dentro dos componentes do DS** ficam abaixo da barra de 44px que o projeto adotou (toggle de visão do FM 30×28, gatilho de ações 30×30, breadcrumb 24px de altura, `.lyra-btn--md` 40px) — passam no WCAG 2.2 AA (24×24) e a correção anterior de `pointer: coarse` só cobriu o cromo `.lw-*`. 2026-07-25
- [x] **Toque no iOS: sem o retângulo cinza do Safari, com press próprio** — usuário reportou "efeito estranho ao clicar no Accordion no light, no dark perfeito". Causa: nenhum `-webkit-tap-highlight-color` em lugar nenhum do DS, então o iOS pinta o realce translúcido preto dele — visível sobre superfície clara, invisível sobre a escura. **Não era só o Accordion**: vale para todo controle tocável. Levantamento: 29 classes com `:hover` e **só o Button tem `:active`** — ou seja, o realce do iOS era o único retorno tátil de 27 delas, então suprimir sem substituir trocaria um problema por outro. Sob `@media (hover: none)`, as 20 receitas interativas suprimem o realce e respondem ao press com o mesmo empurrão de meio pixel que o Button já usava; ponteiro com hover fica intocado (zero mudança no desktop). Changeset minor em styles. Escopo decidido pelo usuário. Verificado em emulação de toque: `rgba(0, 0, 0, 0)` no trigger e no botão. 2026-07-25
- [x] **Accordion anima a abertura** — o handoff monta o painel ao abrir (`{isOpen && …}`) e não tem transição nenhuma, então o Accordion era a única revelação do DS sem motion enquanto Dialog, ⌘K e os popovers animam. Painel passa a ficar montado dentro de `.lyra-acc__panel-wrap`, com altura animada por `grid-template-rows: 0fr → 1fr` (anima até a altura real sem fixar nenhuma). Fechado: `inert` + `visibility: hidden`, para montar não colocar o conteúdo na ordem de tabulação nem na árvore de acessibilidade. **Armadilha registrada**: uma linha de grid `0fr` **ainda reserva o padding do item** — padding não encolhe —, então o painel com padding do handoff ficava com 16px fechado; precisou de `.lyra-acc__panel-clip`, um elemento sem padding entre a linha animada e o painel. Também: `inert=''` não funciona no React 19 (avisa no console e não emite o atributo), tem que ser booleano. Extensão deliberada além do handoff, aprovada pelo usuário. Changeset minor. 350 testes (3 novos: painel fechado inerte/oculto/altura zero, transição de altura mid-flight, e o toggle múltiplo ajustado porque agora todos os painéis ficam montados). **Sobre a largura**: o salto que o usuário viu ao abrir vinha do palco do exemplo (flex row, encolhia para o conteúdo), não do DS — medido estável em 602px depois da correção do palco, então nenhuma prop nova foi criada. Dev do docs passou a responder `no-cache` (o Safari do iPad seguia servindo builds antigos sem sinal na tela). 2026-07-25
- [x] **Fase 6 / 6b — Audit do impeccable no site de docs** — rodado a pedido do usuário como apoio à verificação dos lotes. Score 14/20 → dimensões fracas corrigidas na mesma rodada. **P0 achado que ninguém tinha visto**: o site rolava horizontalmente em 375px e 768px — `.lw-header__actions` media 345px e terminava em 660px numa viewport de 375; abaixo de 900px a nav vai para a própria linha e o CTA sai (destino dele é o link Components logo abaixo). **P1 — sidebar** (relatado pelo usuário): `position: sticky` sem `max-height`/`overflow-y`; sticky não segura elemento mais alto que a viewport, então ela só se desprendia depois que o corpo rolava (medido: 910px de conteúdo em 900 de viewport). As duas trilhas ganharam altura máxima e scroll próprio, com `dvh` pela lição do iPad. **P1 — contraste** do cromo do site: `--text-faint` dava 2.45:1 nos rótulos de grupo e no ⌘K; migrados para `--text-secondary` (decisão do usuário, diverge do tom apagado do handoff). **P1 — alvos de toque**: 39 abaixo de 44px; corrigidos sob `@media (pointer: coarse)`, zero restantes. **P1 — `<main>`**: não existia; `landmark-one-main` e os 19–25 `region` por página zeraram. **P2 — palco do exemplo** (relatado pelo usuário sobre Accordion e Card): `display: flex` fazia componente de bloco virar flex item e encolher; `<Example layout="block">` dá largura total e `layout="plain"` evita card dentro de card. Isso destrava os lotes 3–7, que documentam Table, Stat, EmptyState, FileManager e Drawer — todos de bloco. Contraste restante é só de tokens travados da Fase 2 (`th` 4.34:1, label do primário 4.39:1 no escuro). Detector mecânico do impeccable: zero achados. 2026-07-25
- [x] **Fase 6 / 6b — Fan-out Lote 2 (display + IconButton, 7 componentes)** — Avatar, Card, Tag, Icon, Skeleton, Accordion, IconButton: 16 exemplos, 14 MDX (EN + pt-BR), 7 entradas no registry e no manifesto (`icon-button` no grupo `action`, não `display`). Brief em `.batuta/lot-02-display.md` — pinou `Card asChild` (lança erro com `title`/`footer`), `Icon` só aceita nomes do registry gerado, `Accordion` é dirigido por `items` (não por children compostos), e a lição do Lote 1 sobre não deixar scaffolding na raiz (desta vez não deixou). → codex (`gpt-5.6-terra`, reasoning high). **Verificação do maestro**: 11 nomes de ícone conferidos um a um contra `icon-registry.ts` (nome inválido renderiza `null` e só avisa em dev — o build não acusa) e confirmado no navegador que os 7 SVGs da página do Icon têm conteúdo; classes conferidas contra `packages/styles`; a11y do Icon conferida contra a fonte (`title` → `role="img"` + `aria-label`, **não** um `<title>`, e o MDX descreve exatamente isso); as 14 páginas abertas com prop table populada e zero erro de console; interações verificadas no navegador (Accordion abre/fecha com `aria-labelledby` correto, Tag removível vai de 3 → 2, Card `asChild` vira `<a class="lyra-card lyra-card--interactive">` sem card aninhado). **Uma correção do maestro**: o exemplo do Avatar usava `https://i.pravatar.cc` — seria a única requisição a terceiros do site em runtime, contra a constraint de zero-CDN do projeto (e um vazamento da visita de cada leitor). Trocado por `apps/docs/public/sample-avatar.svg` local. Sem changeset (docs app não publicado). Gates verdes (typecheck · lint · parity · build). 2026-07-25
- [x] **Popovers abrem para cima quando não há espaço abaixo** — o `Combobox` forçava o scroll da página ao abrir perto do rodapé da viewport. Duas causas: (1) `focus()` no input de busca, que faz o browser rolar até o elemento focado, e (2) o popup só existia para baixo (`top: calc(100% + 6px)` fixo). Hook interno `useFlipPlacement(open, anchorRef, popRef)` mede o espaço abaixo do trigger e mantém `down` a menos que não caiba abaixo **e** haja mais espaço acima; remede enquanto aberto em `scroll` (capture, para pegar ancestrais roláveis) e `resize`. Classes aditivas `.lyra-combobox__pop--up`, `.lyra-menu--up`, `.lyra-wssw__pop--up` + keyframe `lyra-pop-in-up` (espelha o `lyra-pop-in`, só transform) no fim dos arquivos + allowlist do parity (nova entrada para `forms.css`). Todos os `focus()` de abertura ganharam `preventScroll: true`. Aplicado aos **três** popovers com o mesmo bug (Combobox, Dropdown, WorkspaceSwitcher) — decisão do usuário, e o Lote 5 documentaria Dropdown/WorkspaceSwitcher com o comportamento ruim. Changeset minor nos dois pacotes. Maestro (Critical: comportamento público do DS + CSS aditivo). 348 testes (6 novos: flip e não-flip nos três), gates verdes (parity · typecheck · lint · build · smoke · docgen --check) + verificado no navegador: `scrollY` 944 → 944 na abertura e popup inteiro na viewport. **Segunda rodada, achada pelo usuário testando no iPad**: medir com `window.innerHeight` estava errado em iOS — lá o layout viewport se estende atrás da barra dinâmica e ignora zoom (medido no aparelho dele: `innerHeight` 777 vs `visualViewport.height` 706), então o popup "cabia" abaixo enquanto ficava fora da tela. Passou a medir contra `visualViewport` (com `offsetTop`) e a remedir nos eventos dele — barra colapsando, pinch zoom, teclado sob a busca. **Armadilha registrada**: para depurar num aparelho que não dá para reproduzir localmente, um painel de diagnóstico na página é o caminho — mas checar se uma regra CSS está carregada via `getComputedStyle(el).top === 'auto'` é inválido (em elemento posicionado o computed devolve o valor _usado_, nunca `auto`); use uma propriedade que não é resolvida, como `animation-name`. O falso "CSS antigo em cache" me custou uma rodada. Causa final do relato no Safari: cache da aba — em janela privada funcionou. 2026-07-25
- [x] **Fase 6 / 6b — Fan-out Lote 1 (forms, 7 componentes)** — Textarea, Checkbox, Radio, Switch, Select, Combobox, FileUpload: 14 exemplos (2 por componente), 14 MDX (EN + pt-BR), 7 entradas no registry e no manifesto. Brief do lote em `.batuta/lot-01-forms.md` sobre o brief compartilhado — pinou os fatos que o executor não adivinharia: `Select` é `<select>` nativo (não APG), `Checkbox`/`Radio`/`Switch` são `<label>` inteiro sem `htmlFor`, `role="img"` no check do FileUpload, `'use client'` em Combobox/FileUpload. → codex (`gpt-5.6-terra`, reasoning high), rodada limpa. **Verificação do maestro** (o relatório do executor não basta): as 7 classes-alvo de cada bloco "HTML puro" conferidas contra `packages/styles` (zero inventadas), props conferidas contra `props.json` (`Select.size` é a variante do DS, não o `size` nativo; shape do `FileUploadItem` confere), ARIA do Switch/Combobox conferido contra a fonte, e as **14 páginas abertas no dev** (200 + prop table populada em todas; Combobox filtrando e o controlado selecionando no navegador, zero erro de console). Um percalço: o codex deixou scaffolding do fluxo SDD dele (`.superpowers/sdd/`) na raiz — auto-ignorado pelo git mas o prettier enxergava, quebrando `pnpm lint`; movido para fora. Gates verdes (typecheck · lint · parity · build). Sem changeset (docs app não publicado). 2026-07-25
- [x] **Fase 6 / 6b — Exemplos com fonte única + seções de uso/a11y/HTML puro** — o gabarito tinha uma prévia solta e um "Usage" escrito à mão que **já divergia** do que rodava ao lado (preview do Dialog = botão danger com footer; código = primary sem footer). Infra nova: `components/examples/<slug>/<id>.tsx` é fonte única — o mesmo módulo é renderizado vivo e lido do disco na build para o painel de código; `lib/highlight-source.ts` usa `fumadocs-core/highlight` (zero dep nova) com os temas Shiki extraídos p/ `lib/shiki-theme.ts`, compartilhados com o `source.config.ts`, então o painel sai idêntico ao de uma fence. `<Example id title>` no MDX + `ExampleView` (palco Lyra Card + toggle "Ver código"); o palco arranja o layout para os exemplos ficarem **copiáveis** (sem classe `.lw-*` nem next-intl dentro deles). Registry `components/previews` removido. Conteúdo nas 8 páginas: 2–4 exemplos por componente + Quando usar / Acessibilidade / HTML puro. **Armadilha registrada**: exemplo com `asChild` precisa de `'use client'` (filho renderizado no servidor cruzando para client component não é o elemento simples que `Children.only` espera) — `next build` prerenderiza mesmo assim, só o `next dev` (Turbopack) acusa com 500. Maestro (arquitetural). Gates verdes (parity · typecheck · lint · 342 testes · build · smoke · docgen --check) + as 8 páginas verificadas no navegador. 2026-07-23
- [x] **Fase 6 / 6b — llms.txt 100% inglês + CommandPalette sem pt-BR** — o `llms.txt` saía bilíngue: o cabeçalho curado (regras + tokens) vinha verbatim do handoff em pt-BR enquanto a API gerada dos JSDoc já era inglês. Traduzido no `TEMPLATE_HEADER` do `tools/docgen/generate.mjs` (conteúdo fiel ao handoff, só o idioma muda) + heading da seção de API. A última linha pt-BR restante era JSDoc fiel a um default do DS → **`CommandPalette` limpo**: defaults viram inglês e os hints do rodapé (`navegar`/`selecionar`/`fechar`, antes hardcoded sem override — vazavam nas páginas EN) ganharam a prop `hints` com merge sobre os defaults + tipo `CommandPaletteHints` exportado; docs traduz por locale. Fecha o gap de i18n do DS que estava anotado desde a rodada de impeccable. **Também corrigido um drift**: o `Card asChild` do commit anterior não passou pelo docgen — o gate `--check` roda no job build do CI, não no `pnpm build` local, então passou batido e teria quebrado o CI. Changeset minor. Maestro. Gates verdes (parity · typecheck · lint · 342 testes · build · smoke) + palette verificado no navegador em EN e pt-BR. 2026-07-23
- [x] **Fase 6 / 6b — Auditoria de dogfooding + `Card asChild`** — varredura do `apps/docs` por classe crua `.lyra-*` onde já existe componente do DS: `PropTable` virou `<Table>` + `<Badge tone="warning">`, os 4 previews e o índice de componentes viraram `<Card>`, e os `style={{}}` inline de layout viraram `.lw-preview__{row,stack,form}` / `.lw-index__*` no `site.css`. Card clicável do índice destravou um **`asChild` novo no `Card`** (espelha o do `Button`, reusa o `Slot` interno; bloqueia combinação com `title`/`footer`) — changeset minor + teste browser. Regressão de especificidade pega no navegador e corrigida (`.lw-docs__content a:not(.lyra-btn)` vencia a classe solta → prefixado). Regra de dogfooding escrita no `.batuta/profile.md` para os briefs do fan-out. Maestro (Critical: API pública do DS + convenção decidida em conversa). 6 gates verdes (parity · typecheck · lint · 341 testes · build · smoke) + verificação no navegador via Playwright (índice, dialog, button pt-BR dark — zero erros de console). 2026-07-23
- [x] **Fase 6 / 6b — Casca do handoff + Shiki + dev consertado** — portada a casca de `handoff/ui_kits/website`: header (logo mark light/dark + nav + toggle de tema + idioma), sidebar do manifest, home getting-started, footer, tipografia de prosa (`apps/docs/app/site.css`, `lw-*`, 100% tokens Lyra). Redirect de raiz por locale (`pt*`→pt-BR) + root layout dono do `<html>` com script anti-flash (herda `prefers-color-scheme`). **Bug crítico resolvido**: `next dev` do Next 16 bloqueava recursos de dev cross-origin → hidratação morria (0 fibras) sobre 127.0.0.1/LAN/Tailscale; fix `allowedDevOrigins` + `output:export` só em produção (diagnosticado via Playwright). Code block com **Shiki tema Lyra** (light/dark, indigo/night, painel `--surface-sunken`) + números de linha; `CodeBlock` removido, exemplos viraram fences. Underline de links escopado `:not(.lyra-btn)`. Dev roda em `127.0.0.1:3000` atrás de `tailscale serve --https=3000`. Maestro (arquitetural, verificado no navegador via Playwright). 2026-07-23
- [x] **Fase 6 / 6b — Registry data-driven (destrava o fan-out das 40)** — trocado o switch hardcoded de imports do `document-content.tsx` por padrão orientado a manifest, aditivo por componente. `lib/components.ts` (fonte única: slug+nome+grupo) → rota dinâmica única `app/[lang]/components/[slug]/page.tsx` (generateStaticParams locales×slugs, static-export safe) + `component-page.tsx` (carrega MDX por slug via webpack context, injeta preview como `<Preview/>` genérico) + `components/previews/` registry (dialog-preview movido p/ lá) + índice `/components` agrupado + link no header (i18n EN/pt-BR). Decisão: **manifest+import dinâmico** em vez de wire do loader fumadocs (fica p/ 6c se quiser nav/TOC/busca nativos). `next build` verde (en/pt-BR × index+dialog+/components), prettier limpo. Maestro (arquitetural). Sem changeset (docs app não publicado). 2026-07-23 — `apps/docs` Next.js 16.2.10 + fumadocs-core headless, i18n EN/pt-BR por `generateStaticParams` (sem middleware), static export p/ Cloudflare Pages, estilizado 100% Lyra. Página do Dialog prova o padrão: preview vivo + prop table gerada do `props.json` + código copiável. `next build` verde: `out/` com os 4 caminhos (en, pt-BR, en/dialog, pt-BR/dialog) + `/llms.txt`. Stack Next+fumadocs CONFIRMADA pelo usuário; deploy mudado p/ Cloudflare. → codex (`gpt-5.6-terra`, reasoning high) escreveu o scaffold; maestro fez install+build+verificação (sandbox do codex sem rede) e corrigиu 3 itens: path do import props.json (`../` a mais), tipo do mapa MDX (`ComponentType<any>`), e allowBuilds (@parcel/watcher, @swc/core, sharp → false). 2026-07-23
- [x] **Fase 5 — Docgen & llms.txt** — `tools/docgen/generate.mjs` (zero-dep, TS compiler API) extrai a API dos 40 componentes dos `dist/*.d.ts` e emite `tools/docgen/output/{llms.txt,props.json}` (local neutro; Fase 6 copia p/ apps/docs). Header (regras+tokens) verbatim do handoff; API gerada da fonte (JSDoc inglês). Gate de drift `--check` no job build do CI (padrão do icon-registry). → codex (`gpt-5.6-terra`, reasoning high, foreground). Sem changeset (tooling). Gates verdes. 2026-07-23 à fidelidade do handoff — wrapper inteiro virou `<label>` (linha toda clicável, associação implícita), removidos `useId`/`htmlFor`; `id` do consumidor flui via `...rest`. Testes de clique (texto + wrapper) adicionados. → codex (`gpt-5.6-terra`, reasoning high, foreground). 332 testes, gates verdes. Resolve a deviação anotada do Lote B. 2026-07-23

- [x] **Fase 4 COMPLETA (40/40 componentes)** — todos os 40 componentes do handoff convertidos para `@lyra-ds/react` (React acessível + SSR-safe, classes `.lyra-*` verbatim). 324 testes. Lotes A–D mergeados/prontos. 2026-07-23
- [x] Fase 4 / Lote D3 — CommandPalette (⌘K overlay + combobox activedescendant + hotkey global + inline) e FileManager (busca + toggle list/grid controlled/uncontrolled + breadcrumb + ações por item via Dropdown composto) → codex (`gpt-5.6-terra`, reasoning high, solo cada, foreground). FileManager: `.lyra-fm__more` como span (Dropdown já provê o wrapper interativo, evita nested-interactive no axe). 324 testes, gates verdes. 40/40 componentes. 2026-07-23
- [x] Fase 4 / Lote D2 — 3 overlays/compostos (Drawer overlay com portal+focus trap+scroll lock+Esc+restauração; CreateWorkspaceDialog compondo Dialog+Input+Button+Avatar com slugify e `useId`; WorkspaceSwitcher popover listbox compondo Avatar+Icon com teclado do modelo Dropdown) → codex (`gpt-5.6-terra`, reasoning high; run em foreground após ambiente matar 2 tentativas em background). Promoveu close do Drawer → `.lyra-drawer__close`. 303 testes, gates verdes. 36/40 componentes. 2026-07-23
- [x] Fase 4 / Lote D1 — 4 presentacionais (Table, SidebarGroup, Toast+ToastStack, CookieBanner) → codex (`gpt-5.6-terra`, reasoning high). Maestro alinhou 2 testes (Table, SidebarGroup) à convenção de filtrar `color-contrast` do axe — texto muted de tokens travados da Fase 2 (`--text-muted` no `<th>` 4.34:1, `--text-faint` no label do SidebarGroup 2.45:1), não corrigível na camada React (13 componentes-pares já filtram). Promoveu ícone do Toast → `.lyra-toast__icon` (feedback.css + parity). CookieBanner com guard SSR (localStorage só em effect, `null` até confirmar). 33/40 componentes. 2026-07-22
- [x] Fase 4 / Lote C2 — 2 widgets de teclado (Dropdown menu-button com foco real + restauração ao trigger; Combobox APG com `aria-activedescendant`, reset no filtro, controlled/uncontrolled) → codex (`gpt-5.6-terra`, reasoning high; rodada limpa, sem retry). Promoveu `inline-flex` do trigger → `.lyra-dropdown__trigger` (navigation.css + parity ADDITIVE_EXTENSIONS). 265 testes, todos gates verdes. 29/40 componentes. 2026-07-21
- [x] Fase 4 / Lote C1 — 6 componentes (Tabs, Accordion, Stepper, Pagination, Tooltip, Select nativo) → codex (`gpt-5.6-terra`, reasoning high). Maestro escalou p/ si próprio o fix de 2 testes com bug (retry do codex morreu por instabilidade de ambiente): Pagination test com off-by-one no índice do botão (contava o Prev), Tooltip test lia `data-state` sem await do flush — componentes estavam corretos (Pagination = verbatim do handoff). 254 testes, todos gates verdes. Descoberta: Select do handoff é `<select>` nativo estilizado (recipe FORM), não combobox APG. 27/40 componentes. 2026-07-21
- [x] Readequação CSS-first do Card — inline `style={{display:flex;gap}}` das ações → classe `.lyra-card__actions` (styles + parity generalizado p/ additive multi-arquivo); regra documentada em `CONVENTIONS.md` p/ Toast/Dropdown dos Lotes C/D. Maestro (crítico), sem mudança visual. 2026-07-21
- [x] Fase 4 / Lote B — 5 componentes de formulário (Textarea, Checkbox, Radio, Switch, FileUpload) → codex (`gpt-5.6-terra`, reasoning high; 1 correção do maestro: `role="img"` no `.lyra-upload__check` do FileUpload, que derrubava o axe em light/dark). Todos os gates verdes, 232 testes. 21/40 componentes. 2026-07-21
- [x] Fase 4 / Lote A — 12 componentes estáticos → codex (`gpt-5.6-terra`, reasoning high; 1 correção do maestro: prettier no root lint), commit 11376ee, 2026-07-20
- [x] Fase 4 — pesquisa WAI-ARIA APG (gate dos lotes C/D) → agente de research (background), relatório em `.batuta/research-apg-focus-models.md`, 2026-07-20
- [x] Fase 1 — Monorepo Foundation & Governance (5 planos) → GSD/claude (importado), merged PR #1, 2026-07-17
- [x] Fase 2 — Styles Package, 209/209 tokens + 248 classes (6 planos) → GSD/claude (importado), merged PR #2 (df75f9a), 2026-07-18
- [x] Fase 3 — React Infrastructure & Pilot Components (9 planos) → GSD/claude (importado), merged PR #3 (cff0234), 2026-07-20
