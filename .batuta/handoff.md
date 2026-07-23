# Handoff — 2026-07-23

## Cycle point

Fase 6 / 6b em andamento na branch `feat/phase-06b-docs-component-registry`
(~19 commits, **sem PR ainda**, árvore limpa). Parado num ponto **estável e
validado** — o usuário confirmou "ficou tudo certo agora".

O que está pronto e verificado no navegador (via Playwright):
- **Registry data-driven** + **casca do handoff** (header/logo, sidebar do
  manifest, home, footer, TOC "On this page").
- **4/40 páginas** de componente: Badge, Button, Input, Dialog (o gabarito).
- **Rodada de impeccable inteira aplicada ao gabarito**: contraste/CTA, a11y
  (aria GitHub, ✕ Dialog 44px), Shiki tema-Lyra + números de linha + badge de
  linguagem, busca **⌘K** (CommandPalette), toggle **EN|PT**, tema seguindo o
  dispositivo, **motion** dos overlays (Dialog/⌘K entrada+saída via
  `usePresence`), **Button `asChild`** no DS + hero dogfooded.
- **Bugs resolvidos**: dev não hidratava sobre Tailscale (`allowedDevOrigins`
  no `next.config`); hydration `<p>` aninhado + `Children.only` da home.

Todos os gates verdes na última rodada (parity · typecheck · lint · 340 testes
· build · smoke).

## Decisions not yet written

- **Dogfooding (princípio do usuário, jul/2026):** o site do Lyra deve **usar o
  próprio DS**, não criar estilos custom pra contornar. `.lw-*` de *layout do
  site* (header/sidebar/grid/TOC/code-panel/busca/toggle) é aceitável — o DS não
  provê docs-shell. Mas **classe crua `.lyra-*` onde existe componente** deve
  virar componente. Já aplicado ao hero (`<Button asChild>`). **Ainda pendente:
  PropTable usa `<table class="lyra-table">` cru → deveria usar o `<Table>` do
  DS** (auditar outros casos). Não está escrito no CONVENTIONS/profile ainda.
- **Deploy:** Cloudflare Pages (static export), confirmado na 6a.
- **CommandPalette i18n gap (DS):** os hints internos do palette ("navegar/
  selecionar/fechar") são pt-BR fixos no componente do DS — vazam em páginas EN.
  O componente não expõe override de labels. Item de DS para o futuro.

## Background

- **Nenhum executor rodando.** Os dois jobs do codex desta sessão (`Button
  asChild`+✕ Dialog; e o motion dos overlays) já terminaram, foram verificados
  pelo maestro e commitados na branch.
- **Preview parado no pause:** `next dev` foi morto e o `tailscale serve
  --https=3000` foi desligado (senão ficariam órfãos). Para retomar o preview:
  1. `cd apps/docs && pnpm exec next dev -H 127.0.0.1 -p 3000`
     (o `allowedDevOrigins` no `next.config` já cobre 127.0.0.1/LAN/`*.ts.net`).
  2. `tailscale serve --bg --https=3000 http://127.0.0.1:3000`
  3. Acessar `https://dev.lynx-kelvin.ts.net:3000/en` (o `/` faz redirect por
     locale; entrar por `/en` ou `/pt-BR`).
  Nota: ufw ativo bloqueia acesso direto por IP:porta — o `tailscale serve`
  (proxy loopback) é obrigatório para acesso via tailnet.

## Open questions

- **Próximo passo?** Três frentes em aberto (recomendação nesta ordem):
  (a) **auditoria de dogfooding** — trocar usos de classe crua restantes pelos
  componentes do DS (PropTable → `<Table>`, etc.);
  (b) **fan-out das 36 páginas** restantes (mecânico, delegável ao codex em
  lotes por grupo — nascem já com todas as correções do gabarito);
  (c) **showcase** (todos os componentes numa página) → depois **landing de
  marketing** (de `handoff/ui_kits/website`) → **deploy Cloudflare**.
- **Quando abrir o PR** de `feat/phase-06b-docs-component-registry` para `main`?
  (branch grande; pode valer fechar a 6b antes, ou abrir agora para revisão.)
