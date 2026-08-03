# Lot — OpenPanel init nunca roda: criar o stub `window.op` antes do script

## Goal

Em produção o OpenPanel não recebe NENHUM evento. Causa raiz (provada em browser
real contra https://lyra-ds.dev): `op1.js` **não define** `window.op` — ele expõe
`window.openpanel` e consome a fila do stub `window.op` que o snippet oficial da
OpenPanel cria ANTES do script. Nossa integração pulou o snippet, e o `onLoad`
faz `if (!window.op) return` — o `init` nunca executa, silenciosamente.

Corrigir os DOIS apps (`apps/site` e `apps/docs`): criar o stub oficial antes de
o script executar e enfileirar o `init` nele, mantendo o gate de consentimento
intacto.

## Context

- Arquivos-alvo (quase idênticos entre si; site tem prop `className` extra):
  - `apps/site/components/consent-analytics.tsx`
  - `apps/docs/components/consent-analytics.tsx`
- Testes que pinam o contrato por fonte (mesmo estilo nos dois apps):
  - `apps/site/scripts/analytics.test.mjs` (teste "the consent owner loads
    OpenPanel once after all consent without replay or identification",
    linhas ~51–65)
  - `apps/docs/scripts/analytics.test.mjs` (equivalente)
- Evidência de runtime coletada (não re-derivar, é fato): após consentir e o
  `op1.js` carregar com 200, `typeof window.op === 'undefined'`,
  `typeof window.openpanel === 'object'`, zero requests a `/api/track`.
- Semântica do snippet oficial OpenPanel (o que o op1.js espera encontrar):
  `window.op = window.op || function(...args){(window.op.q = window.op.q || []).push(args);};`
  O script processa `window.op.q` ao carregar. Portanto o `init` NÃO precisa
  (nem deve) depender do `onLoad` do script: enfileirado no stub antes do load,
  a ordem fica garantida pela fila.

## Requirements

1. O stub `window.op` só pode existir depois de consentimento `all`
   (`canLoad === true`) — nada de stub/efeito quando o usuário escolheu
   "apenas o essencial" ou ainda não respondeu. O gate atual
   (`consent === 'all' && mayLoadAnalytics()`) permanece o único dono da decisão.
2. `initialized.current` continua impedindo `init` duplo (re-render, aceitar de
   novo em outra aba etc.).
3. O `init` mantém exatamente as opções atuais: `apiUrl: origem + '/api'`,
   `clientId`, `sessionReplay: { enabled: false }`, `trackScreenViews: true`.
   Nada de `identify`, replay ou novas opções.
4. A declaração TypeScript global de `window.op` deve refletir o stub real
   (função variádica com propriedade `q` opcional de fila), sem `any` solto.
5. Os dois arquivos ficam com a mesma solução (a menos da prop `className` que
   só existe no site).
6. Testes: atualizar o teste de contrato de fonte nos DOIS
   `analytics.test.mjs` para pinar o novo comportamento — o stub é criado
   antes do carregamento do script e o `init` vai pela fila do stub, não por
   callback condicionado a `window.op` já existir. As asserções existentes que
   continuam verdadeiras (id="openpanel", src, apiUrl, sessionReplay,
   trackScreenViews, initialized.current, doesNotMatch identify/replay) devem
   continuar passando. Remover/substituir apenas as que descreviam o
   comportamento bugado.

## Test laws

- Teste o comportamento, nunca o mock. O bug nasceu de um mock de `op1.js` que
  definia `window.op` — o script real não define. Nenhum teste novo pode
  assumir que o script define `window.op`.
- Teste falhando = conserte o código, não o teste.
- Nenhum flag/branch só-de-teste em código de produção.

## Acceptance criteria

- `node --test apps/site/scripts/analytics.test.mjs` verde.
- `node --test apps/docs/scripts/analytics.test.mjs` verde.
- Prova de regressão: revertendo APENAS a criação do stub (voltando o `init` a
  depender de `window.op` pré-existente), o teste atualizado tem que FALHAR.
  Faça essa prova por cópia (`cat arquivo > backup` antes, `cat backup > arquivo`
  depois — nunca `git checkout --` em árvore sem commit) e relate o output.
- `pnpm exec prettier --check` limpo nos arquivos tocados.

## Boundaries

- Tocar SOMENTE nos 4 arquivos citados (2 componentes + 2 testes).
- NÃO tocar: `scripts/generate-headers.mjs`, `_headers.template`, `lib/consent.ts`,
  CookieBanner, qualquer coisa em `packages/`, CSP, outros testes.
- Não commitar.

## Expected evidence

Relatar: arquivos tocados; comandos executados com output real (os dois
`node --test` e a prova de regressão com o erro do teste); qualquer incerteza
declarada como incerteza.

## Stop conditions

Pare e relate (em vez de improvisar) se: a forma do código contradisser este
brief; o mesmo comando falhar duas vezes; o fix parecer exigir mudanças fora
dos Boundaries.
