# Lyra Design System

[English](./README.md)

[![Licença: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/lyra-ds/lyra/actions/workflows/ci.yml/badge.svg)](https://github.com/lyra-ds/lyra/actions/workflows/ci.yml)

> Design system open source, CSS-first. Tokens semânticos, temas white-label e wrappers React finos — Vue, Svelte e Web Components sobre o mesmo core em CSS.

O Lyra mantém cada decisão visual em CSS custom properties e classes `.lyra-*` — os
adapters de framework são wrappers finos sobre o mesmo core. Faça o rebrand de um
app inteiro definindo quatro tokens.

- **209 tokens semânticos** — light e dark embutidos, sem estilos de dark manuais.
- **White-label** — as marcas definem `--brand`, `--brand-contrast`,
  `--brand-radius` e `--brand-font`; todo o resto é derivado via `color-mix`.
- **`@lyra-ds/react`** — 40 componentes como wrappers finos; adapters para Vue,
  Svelte e Web Components no roadmap (Zag.js), além de um registry de componentes
  no estilo shadcn.
- **Interoperabilidade com shadcn** — uma camada de compatibilidade opt-in mapeia
  `--background`, `--primary`, `--ring` e afins para os tokens do Lyra.
- **LLM-first** — o `llms.txt` é gerado a partir das fontes `.d.ts` reais, para que
  agentes escrevam código Lyra correto.

## Pacotes

| Pacote            | Descrição                        |
| ----------------- | -------------------------------- |
| `@lyra-ds/styles` | Tokens + CSS dos componentes, zero JS |
| `@lyra-ds/react`  | Componentes para React 18+       |

## Status de pré-lançamento

O Lyra DS está em desenvolvimento ativo e **ainda não foi publicado no npm**. As
instruções de instalação e uso abaixo descrevem o estado-alvo documentado — os
pacotes `@lyra-ds/*` ficam instaláveis quando forem publicados pela primeira vez
(Fase 7). Até lá, trate os comandos abaixo como uma prévia, não como uma
instalação funcional.

## Instalação

Instale os pacotes de estilos e React e depois importe a folha de estilos uma única
vez na raiz do seu app:

```bash
npm i @lyra-ds/styles @lyra-ds/react
```

```ts
// Importe a folha de estilos do Lyra uma única vez, na raiz da aplicação.
import "@lyra-ds/styles";
```

## Uso

```tsx
import { Button } from "@lyra-ds/react";

export function Exemplo() {
  return <Button variant="primary">Começar</Button>;
}
```

## Links

- [Política de versionamento](./VERSIONING.md) — como funcionam a linha `0.x` e as
  mudanças breaking.
- [Como contribuir](./CONTRIBUTING.md) — setup local, changesets e decisões
  travadas.
- [Código de Conduta](./CODE_OF_CONDUCT.md)
- [Política de segurança](./SECURITY.md)

## Licença

[MIT](./LICENSE) © Francisross Soares de Oliveira e contribuidores do Lyra DS.
