# Batuta profile — lyra-ds

Criado em 2026-07-20 via /batuta:init. Complementa `.claude/CLAUDE.md` — o que
já está lá (constraints da arquitetura CSS-first, stack travado, decisões
locked) NÃO se repete aqui; briefs devem apontar executores para as
constraints relevantes do CLAUDE.md quando tocarem em estilo/tokens.

## Stack

- Monorepo pnpm 11.13.1 (workspaces + changesets), Node 24, TypeScript 5.9.3.
- `packages/react` (React 19 dev / peer >=18, build tsup) + `packages/styles`
  (CSS puro, sem build). Template de convenções: `templates/react.md` do
  plugin Batuta — com a ressalva de que styling aqui é SEMPRE classes
  `.lyra-*` do pacote styles (nunca CSS novo inline/module no react).

## Metodologia

- Testes depois da implementação (tests-after), runner Vitest (Browser Mode
  para componente/a11y).
- Conventional commits; feature branches com PR para `main` (branch
  protegida — nunca commitar direto na main).

## Comandos

- Test: `pnpm test` · Build: `pnpm build` · Lint: `pnpm lint` (prettier) ·
  Typecheck: `pnpm typecheck` · Parity: `pnpm parity` · Smoke: `pnpm smoke`

## Delegação — o que já funcionou e o que já custou rodada

Lições dos lotes da Fase 6b, cada uma com a evidência que a gerou. Valem para
qualquer executor, não só o codex.

**O trabalho mora no arquivo de brief, não no prompt.** A invocação que entregou
os Lotes 1, 2 e 3 numa rodada limpa cada é literalmente uma linha: `Follow the
instructions in .batuta/lot-NN-<slug>.md, which sits on top of the shared brief
.batuta/brief-phase06b-fanout.md. Read both in full before writing anything. Work
from the repo root; do not commit.` Prompt mínimo, brief rico. Instrução longa
inline é onde os workflows internos do executor se enganCham.

**Sempre redirecione `< /dev/null` para o stdin do codex** (regra do usuário,
2026-07-26). Sem isso ele erra de forma intermitente e **mente sobre a causa**: nos
Lotes 4 e 5 alegou três vezes estar bloqueado por permissão de workspace — "só posso
escrever em `packages/react/src`", depois "só em `packages/styles/components`" — dois
limites diferentes, ambos falsos, com um probe de 10 segundos provando que ele escrevia
em `apps/docs` sem obstáculo. O gasto foi de quatro disparos perdidos e um diagnóstico
meu errado (atribuí ao formato do prompt). Invocação correta:

```bash
codex exec --sandbox workspace-write -m <modelo> -c model_reasoning_effort="high" \
  "Follow the instructions in .batuta/lot-NN.md …" < /dev/null
```

**Ao re-disparar depois de um travamento, repita o prompt original verbatim.** No
Lote 4 o codex parou pedindo aprovação de um "design workflow" dele; re-disparei
com um prompt cheio de "APPROVED", "design approval", "do not ask questions" — e
isso **alimentou** o gate em vez de desarmá-lo: a rodada seguinte inventou uma
parede de permissão. Nomear o gate é invocá-lo. Não discuta com o fluxo interno
do executor; devolva a mesma instrução que já funcionou.

**Relatório de falha do executor é alegação, não fato — verifique antes de
escalar.** O codex afirmou que só podia escrever em `packages/react/src` e que
`apps/docs` era read-only. Um probe de 10 segundos (`codex exec … "crie
apps/docs/PROBE.txt com 'ok'"`) desmentiu na hora, e os `.codex/`/`.agents/` do
repo estão vazios. Escalar para a lane cara em cima de um relatório falso é
desperdício; o probe barato vem primeiro.

**Relatório de sucesso também não basta.** O `next build` prerenderiza exemplo
quebrado sem falhar, e o executor não consegue abrir o dev no sandbox dele. Toda
verificação de lote abre as páginas no navegador e exercita a interação; foi assim
que apareceram o avatar vindo de CDN de terceiro (Lote 2) e o que os gates verdes
não pegam.

**O que faz a rodada sair limpa é pinar o que o executor não tem como derivar.**
Não é o tamanho do brief, é a especificidade: shape exato de tipos, armadilhas de
API (`actions` do FileManager substitui o menu em vez de estender; Tabs renderiza
painéis vazios próprios), qual classe existe de fato, e as lições das rodadas
anteriores. Colete isso lendo a fonte antes de escrever o brief.

**Economia de lote:** Context + Conventions são construídos uma vez e reusados no
lote inteiro; só Goal, critérios e fronteiras variam por item.

## Takeover do GSD (2026-07-20)

O usuário aposentou o GSD; o Batuta assumiu a condução. Import feito:
fases 1–3 → `WORK.md` (Done), fases 4–7 → `.batuta/plan-04..07-*.md`,
decisões duráveis → abaixo. `.planning/` ficou intacto como arquivo histórico
(REQUIREMENTS.md, research/PITFALLS.md e os decision-logs das fases seguem
sendo referência de leitura); o usuário arquiva quando quiser.

## Decisões herdadas que briefs devem respeitar

- Fluxo de branch: NUNCA commitar na main (ruleset exige PR + 4 checks
  verdes: lint, typecheck, test, build + 1 aprovação).
- Versões exatas sempre (`save-exact` no .npmrc); engines `>=24 <25`.
- CSS de `@lyra-ds/styles` é handoff-verbatim: sem prettier, stylelint só
  valida namespace `.lyra-*`; extras vão no FIM do arquivo + allowlist
  ADDITIVE_EXTENSIONS do parity (209 tokens / 248 classes são contagens do
  handoff, imutáveis).
- `@lyra-ds/react`: exports map == entries do tsup == basenames do dist;
  `'use client'` via onSuccess do tsup (prepend determinístico); zero import
  de CSS no código shipped; lucide-react é a única dep de runtime, via
  registry gerado (prettier-ignored, gate --check de drift).
- JSDoc canônico em inglês; convenções de conversão em
  `packages/react/CONVENTIONS.md`.
- **Dogfooding do site de docs (jul/2026):** `apps/docs` usa o próprio DS, não
  reimplementa. Onde existe componente em `@lyra-ds/react`, use o componente —
  nunca a classe `.lyra-*` crua (ex.: `<Table>`, `<Card>`, `<Badge>`, e
  `<Button asChild>` para links com cara de botão). Classes `.lw-*` no
  `apps/docs/app/site.css` são só para o **layout do site de docs**
  (header/sidebar/grid/TOC/painel de código/busca/toggle/previews), que o DS não
  provê. Layout de preview também vai para `.lw-*`, nunca `style={{}}` inline.
  Se o componente do DS não cobrir o caso, **estenda o DS** (com changeset e
  teste), como foi feito com `Button asChild` e `Card asChild`. Cuidado de
  especificidade: `.lw-docs__content a:not(.lyra-btn)` e `.lw-docs__content p`
  ganham de uma classe `.lw-*` solta — prefixe quando precisar sobrescrever.
- **Impeccable por componente (regra do usuário, 2026-07-25):** todo componente
  que criarmos passa pelo skill `impeccable` na sua página de demonstração, não
  só uma vez sobre um showcase. Roda no ciclo do Batuta **depois da verificação
  do lote e antes do commit**. Motivo: a primeira rodada (score 14/20) achou o
  que gate verde e relatório de executor não pegam — scroll horizontal em 375px,
  sidebar sticky sem `max-height`, 39 alvos de toque abaixo de 44px, `<main>`
  ausente e o palco achatando componente de bloco. Achado de cromo do site vira
  correção no `apps/docs`; achado de componente vira lote/issue no DS.

## Project map

(sweep de 2026-07-20 — scout gratuito estourou timeout, mapeado pelo maestro;
detalhes ficam com grep e git)

- `packages/styles` — pacote CSS puro, SEM build: `styles.css` é o entry
  (`exports "."`), `tokens/` e `components/` publicados como arquivos,
  `compat-shadcn.css` é subpath opt-in nunca importado pelo entry. Testes em
  `packages/styles/tests/` (Vitest, com screenshots em `__screenshots__/`).
- `packages/react` — wrappers finos sobre as classes `.lyra-*`. Um diretório
  por componente em `src/` (`button/`, `dialog/`, `icon/`, `input/`,
  `internal/`), cada um com `*.browser.test.tsx` (Browser Mode/chromium) e
  `*.ssr.test.ts` colocados junto. Build tsup → `dist/` com entries por
  componente e exports duais ESM+CJS (`.`, `./button`, `./input`, …).
  `src/index.ts` é o barrel.
- `tools/` — scripts Node de gate: `parity/` (fidelidade vs handoff),
  `pack-smoke/`, `smoke/` (fixture Next.js), `dist-scan/`, `icon-registry/`
  (mapa estático de ícones Lucide). Invocados pelos scripts do root
  `package.json`.
- `handoff/` — material de design de referência (tokens, componentes,
  protótipos, `llms.txt`): SOMENTE leitura, é a fonte de verdade pixel-perfect.
- `.github/workflows/ci.yml` — pipeline única (lint → typecheck → test →
  build → smoke). `.changeset/` — versionamento. `.planning/` — artefatos do
  GSD, não tocar via Batuta.
- Não tocar: `node_modules/`, `dist/`, `pnpm-lock.yaml` (só via pnpm),
  `handoff/**`, screenshots de teste gerados.
