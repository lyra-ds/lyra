# PRD — `@lyra-ds/alpine`: sistema de toasts (porte do ToastProvider)

> Para: sessão Batuta do monorepo `lyra`, `packages/alpine`.
> De: sessão Batuta do `lyra-ds/blade`, 2026-08-09.
> Origem: lacuna encontrada pelo usuário — o toast Blade não tem dismiss
> automático porque o `toast-provider` React ficou fora da análise dos 24
> interativos (caiu no filtro junto com index/internal). Fonte da verdade:
> `packages/react/src/toast-provider/toast-provider.tsx` (lido integralmente).

## 1. O que portar

No React, o `Toast`/`ToastStack` são presentacionais; quem dá vida é o
**`ToastProvider`**: fila de notificações, API imperativa via contexto
(`useToast`), auto-dismiss com timer por toast. O equivalente Alpine são
DUAS peças que andam juntas numa release:

1. **`Alpine.store('lyraToasts')`** — o estado e a API imperativa, global
   (o "contexto" do Alpine é o store).
2. **`lyraToastStack`** — `Alpine.data()` que renderiza a fila do store
   dentro do container servido pelo Blade (`x-for` sobre `$store`).

## 2. Contrato exato (do fonte React)

API do store (paridade com `ToastApi`):

- `toast(message, options?) → id` — tone default `'info'`.
- `success(message, options?) → id` / `error(...)` (tone `'danger'`) /
  `info(...)` — açúcares que forçam o tone.
- `dismiss(id)` — limpa o timer do id (clearTimeout + delete no mapa) e
  remove da fila.
- `options`: `{ tone?: 'info'|'success'|'danger', duration?: number }`.
  `duration` default vem da config do store (**4000ms**); **`0` desliga o
  auto-dismiss** daquele toast. Timer só é criado quando `timeout > 0`.
- Ids: contador incremental local (`++nextId`), retornado sempre.
- Config do store (equivalente às props do provider): `duration = 4000`,
  `closeLabel = 'Close notification'`.
- Cleanup: o React limpa todos os timers no unmount e guarda flag
  `unmounted` para push tardio (continuação de promise) virar no-op. No
  Alpine: `destroy()` do binding do stack limpa o mapa inteiro; push com
  o stack ausente ainda enfileira (ou no-op — decidir e documentar; o
  espírito do guard é "nunca vazar timer").

Item da fila (`QueuedToast`): `{ id, message, tone, icon? }`.

## 3. Render (paridade com o JSX do provider)

O stack renderiza cada item como um Toast com:

- `tone` do item;
- ícone: o do item quando dado, senão o **ToneIcon inlinado** — os paths
  Lucide de circle-check / circle-alert / info são deliberadamente
  inlinados no provider React (comentário no fonte: importar o Icon
  puxaria o registry de 79 ícones). Portar os MESMOS SVGs inline no
  template Blade, um por tone, `aria-hidden="true"`, 17×17, stroke 2;
- **botão de fechar SEMPRE presente** (`closeLabel`), com
  `onClose → dismiss(id)` — no Blade estático de hoje o botão é omitido;
  na fila dirigida pelo store ele volta, como no React;
- `message` como conteúdo.

Emissões de classe: as mesmas do `Toast`/`ToastStack` já portados no
Blade (fixtures existentes) — o sistema não inventa classe nova.

## 4. Adaptações declaradas (documentar na doc do pacote)

1. **`message` é texto** (`x-text`) quando vem do store/evento — ReactNode
   não tem equivalente serializável. Conteúdo rico continua possível pelo
   toast estático servido (slot Blade), que segue existindo.
2. **`icon` custom**: aceitar string HTML opcional é tentador mas abre
   XSS por evento; v1 fica só com os tone icons no fluxo dinâmico
   (adaptação declarada; slot no fluxo estático cobre o resto).
3. **Evento global** `lyra:toast` (window): payload
   `{ message, tone?, duration? }` → `store.toast(...)`. É o caminho
   idiomático do Livewire (`$this->dispatch('lyra:toast', ...)`) e de
   qualquer JS vanilla. Documentar no README de interatividade.

## 5. Lado Blade (fica no repo blade, fora deste PRD)

`<lyra:toast-stack>` ganha o wiring opcional do binding + `<template
x-for>` com o markup do toast dinâmico; sem Alpine, degrada para o
estático atual (mesmo padrão honesto dos demais). Toasts estáticos
servidos como filhos continuam funcionando lado a lado com a fila.

## 6. Testes (padrão dos bindings existentes)

Browser tests (vitest) + axe: auto-dismiss no duration default e por
toast; `0` não agenda timer; `dismiss(id)` antes do timer limpa e remove;
açúcares forçam tone; ids incrementais; cleanup no destroy (nenhum timer
vivo); evento `lyra:toast` enfileira; botão de fechar acessível com
`closeLabel`; tone icons corretos por tone.

## 7. Fora de escopo

Posicionamento/animação (CSS do `@lyra-ds/styles`, já existe), toasts
persistentes com ações (não existem no React), e o lado Blade (§5).
