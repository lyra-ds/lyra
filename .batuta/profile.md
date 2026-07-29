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

Execution: sequential
Worktree: medium+
Install: pnpm install

## Comandos

- Test: `pnpm test` · Build: `pnpm build` · Lint: `pnpm lint` (prettier) ·
  Typecheck: `pnpm typecheck` · Parity: `pnpm parity` · Smoke: `pnpm smoke`

**Esta lista não é o gate — o CI é.** Ela ficou incompleta e custou um PR com 3
de 4 checks vermelhos depois de 55 commits. O job `lint` do CI também roda
`pnpm --filter @lyra-ds/styles run lint:css` (stylelint) e o `build` também roda
`pnpm --filter @lyra-ds/react exec size-limit`. Antes de abrir PR, rode **o que
está em `.github/workflows/ci.yml`**, não o que está escrito aqui:

```bash
# job lint
pnpm run lint && pnpm --filter @lyra-ds/styles run lint:css \
  && pnpm --filter @lyra-ds/react run lint
# job typecheck
pnpm --filter @lyra-ds/react run build && pnpm run typecheck
# job test
pnpm run test && pnpm run parity && node tools/icon-registry/generate.mjs --check
# job build
pnpm run build && node tools/docgen/generate.mjs --check \
  && pnpm exec publint packages/styles && node tools/pack-smoke/pack-smoke.mjs \
  && pnpm exec publint packages/react \
  && pnpm --filter @lyra-ds/react exec attw --pack . --profile node16 \
  && pnpm --filter @lyra-ds/react exec size-limit \
  && node tools/dist-scan/assert-use-client.mjs packages/react/dist \
  && node tools/dist-scan/no-cdn-scan.mjs packages/react/dist \
  && node tools/smoke/smoke.mjs
```

São 17 comandos. Eu errei isso **duas vezes seguidas**: na primeira segui a lista
resumida acima em vez do workflow, e na segunda "corrigi" a partir de um `grep`
do `ci.yml`, que também escondeu o eslint. Leia o arquivo inteiro.

Duas armadilhas que esses dois gates escondiam:

- **stylelint x extensão aditiva**: reestilizar uma classe existente no fim do
  arquivo é `no-duplicate-selectors` por construção — a convenção do parity e a
  regra se contradizem. Resolvido com um `stylelint-disable no-duplicate-selectors`
  no início da região aditiva de cada arquivo, mantendo a regra ligada na região
  handoff-verbatim acima.
- **eslint x runner de browser**: `jsx-a11y/anchor-is-valid` reprova `href="#"`,
  mas em fixture do Browser Mode um href **válido** faz o clique sob teste navegar
  o iframe do runner e **abortar a suíte inteira** ("Cannot connect to the iframe").
  A regra vale para produto, não para fixture: desligada só em `src/**/*.test.tsx`.
- **size-limit x import de conveniência**: o `SidebarGroup` importar `Icon` para
  desenhar um chevron puxava o registry inteiro e custou **5,4 kB** a quem só
  importa `SidebarGroup`. SVG inline é o padrão do DS para ícone de chrome
  (fechar do Drawer, check do Stepper). Feature nova que cresce o bundle de
  propósito (`asChild`) precisa do orçamento atualizado no mesmo commit.

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

**O sandbox do codex não roda Browser Mode — então ele nunca executa os testes que
escreve.** Ele não consegue bindar localhost, e o runner do Vitest precisa disso.
No Lote 08 isso custou 8 falhas que ele reportou como sucesso: inseriu os `it()`
novos **dentro** do corpo de um `it()` existente (e dentro do duplo `for` de
tema×tom), o que o Vitest recusa em tempo de execução — "Calling the test function
inside another test function is not allowed". Erro estrutural, invisível para
typecheck, eslint e prettier, que ele rodou e viu passar. Consequência prática: em
qualquer lote com teste, **rodar `pnpm run test` é do maestro, sempre**, e o
relatório dele sobre teste vale zero. O mesmo vale para `pack-smoke`, `smoke` e
`publint`, que também não sobrevivem ao sandbox.

**Asserção de existência no Browser Mode exige `expect.element` — locator nunca é
null.** No Lote 09, 12 dos 20 testes novos usavam
`expect(screen.getByRole(...)).not.toBeNull()`: o `getByRole` do Vitest Browser
Mode retorna um Locator lazy, que é objeto sempre — a asserção passa exista o
elemento ou não. Foi a prova de reverter-o-fix que pegou (os testes seguiram
verdes procurando um botão inexistente); typecheck, eslint e a própria suíte
verde não pegam. Forma correta:
`await expect.element(screen.getByRole(...)).toBeInTheDocument()`. Briefs com
teste de existência devem pinar isso. Há 4 usos vácuos pré-existentes no
`file-manager.browser.test.tsx` (débito, anotado no WORK.md).

**Num worktree sem commits, `git checkout -- <arquivo>` apaga o trabalho do
executor.** O executor entrega árvore suja (o brief manda não commitar), então
HEAD ainda é a main — "restaurar" com checkout reverte para a main e destrói a
implementação. No Lote 09 isso apagou os dois `.tsx` depois do experimento de
regressão (recuperados do diff já revisado no contexto). Backup de experimento é
por cópia: `cat arquivo > backup` antes, `cat backup > arquivo` depois — `cat`,
não `cp`, porque o alias interativo do `cp` engole até `-f` e deixa o arquivo
revertido em silêncio (mordeu duas vezes no mesmo lote).

**Teste que passa não é teste que prova.** Ainda no Lote 08: a forma de verificar
que uma regressão está coberta é **reverter o fix e ver o teste quebrar**. Um
`sed` no arquivo, rodar só aquele diretório, restaurar. Levou 30 segundos e
transformou "o teste passa" em `expected 'Loading' to be 'Carregando'` — a prova
de que ele pega o descarte silencioso, e não algo que passaria de qualquer jeito.
(Cuidado com `cp` sem `-f`: um alias interativo pode deixar o arquivo revertido.)

**Prop que funciona mas não está na interface não existe para o consumidor.** O
docgen lê a interface, não o destructure. `Breadcrumb` e `Pagination` honravam
`aria-label` desde sempre e ninguém sabia, porque a prop vinha herdada de
`HTMLAttributes` e não aparecia na tabela. Redeclarar com JSDoc é o que a põe no
`props.json`. Vale para qualquer prop herdada que o componente trate de forma
especial.

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
  ADDITIVE_EXTENSIONS do parity. **O inventário do handoff (209 tokens / 248
  classes / 14 imports da entrada) não é mais literal no código** — desde
  2026-07-28 vive em `tools/parity/baseline.json`, snapshot commitado e
  regenerado com `pnpm parity --update-baseline`. Ele não é imutável, é
  _versionado_: avançar o handoff é atualizar `handoff/`, regenerar e revisar o
  diff, que é o registro do que a versão nova trouxe. Regenerar sem que
  `handoff/` tenha mudado de propósito é apagar o tripwire — o baseline guarda
  nomes justamente porque contagem não pega troca (renomear uma classe nos dois
  lados mantinha 248 e o gate antigo ficava mudo).
- `@lyra-ds/react`: exports map == entries do tsup == basenames do dist;
  `'use client'` via onSuccess do tsup (prepend determinístico); zero import
  de CSS no código shipped; lucide-react é a única dep de runtime, via
  registry gerado (prettier-ignored, gate --check de drift).
- JSDoc canônico em inglês; convenções de conversão em
  `packages/react/CONVENTIONS.md`.
- **Dogfooding do site — docs E landing (jul/2026; ampliado em 2026-07-28):** o motivo
  não é estética interna. O usuário decidiu que landing e docs usam componentes do Lyra
  **porque eles podem ser reaproveitados por outros usuários** — o site é a primeira
  prova de que o DS serve para construir um produto real. Consequência prática: quando
  o site precisa de algo que o DS não tem, a pergunta é "um consumidor do Lyra ia querer
  isto?". Se sim, **vira componente do DS** (com changeset e teste), não classe `.lw-*`.
  Foi por essa regra que `ThemeProvider` e `PageHeader` entraram na Fase 6 em vez de
  ficarem para o porte do delta. `.lw-*` fica só para o que é genuinamente específico
  deste site: composição de página, hero, CTA, cromo de marketing.
  `apps/docs` usa o próprio DS, não
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

(sweep de 2026-07-27 pelo scout da lane Research — kimi-k2.7-code; detalhes
ficam com grep e git)

- Monorepo pnpm com três workspaces (`pnpm-workspace.yaml`): `packages/*`,
  `apps/*` e `tools/*`. Node 24 obrigatório.
- `packages/styles` — core CSS puro, SEM build: `styles.css` é o entry e
  importa `tokens/` (base, brand, colors, effects, fonts, spacing, typography)
  e `components/` (buttons, data, display, feedback, files, forms,
  navigation). `compat-shadcn.css` é subpath opt-in nunca importado pelo
  entry. Validado por stylelint + testes em `tests/` (Vitest Browser Mode).
- `packages/react` — wrappers finos sobre as classes `.lyra-*`. Um diretório
  por componente em `src/<componente>/` (~35 componentes + `internal/`), cada
  um com `index.ts`, `*.tsx`, `*.browser.test.tsx` (chromium),
  `*.ssr.test.ts` e `__screenshots__/` quando aplicável. `src/index.ts` é o
  barrel. Build tsup → `dist/` com exports duais ESM+CJS por componente.
  Única dep de runtime: `lucide-react`, via
  `src/icon/icon-registry.ts` (GERADO por `tools/icon-registry`, não editar).
- `apps/docs` — site de docs Next.js 16 + fumadocs-core/fumadocs-mdx.
  `app/layout.tsx` carrega fontes e `@lyra-ds/styles/styles.css`;
  `app/[lang]/layout.tsx` faz i18n via next-intl (locales em `lib/i18n.ts`,
  strings em `messages/{en,pt-BR}.json`). `app/site.css` define as classes
  `.lw-*` (só chrome do site). Conteúdo MDX em `content/docs/{en,pt-BR}/`
  (index + 1 página por componente), exemplos vivos em
  `components/examples/<componente>/`, chrome do site em `components/`
  (site-header, docs-sidebar, command-menu, toc, theme-toggle, …).
  Build estático → `out/` (inclui `llms.txt` copiado por
  `scripts/copy-llms.mjs`).
- `tools/` — gates Node invocados pelos scripts do root: `parity/` (tokens e
  classes vs handoff), `icon-registry/` (gera o registry do Icon),
  `docgen/` (gera `output/llms.txt` + `props.json` a partir dos tipos do
  dist), `pack-smoke/` (pack + build Vite real), `smoke/` (consumidores Vite
  e Next.js reais), `dist-scan/` (`use client` + zero CDN no dist).
- `handoff/` — referência de design SOMENTE leitura, fonte pixel-perfect
  (tokens, componentes, ui_kits, guidelines, llms.txt).
- `.github/workflows/ci.yml` — 4 jobs (lint, typecheck, test, build); o gate
  real é este arquivo (ver seção Comandos). `.changeset/` — versionamento
  (styles + react fixados, publicados juntos). `.planning/` — arquivo
  histórico do GSD, não tocar via Batuta.
- Não tocar: `node_modules/`, `dist/`, `apps/docs/.next/` e `apps/docs/out/`,
  `pnpm-lock.yaml` (só via pnpm), `handoff/**`, `__screenshots__/`,
  `.vitest-attachments/`, `tools/docgen/output/*`,
  `packages/react/src/icon/icon-registry.ts` (gerados — mude a fonte e rode o
  gerador).
