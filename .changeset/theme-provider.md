---
'@lyra-ds/react': minor
---

Adiciona `ThemeProvider` e `useTheme`.

Aplica `data-theme` no `<html>`, persiste a escolha em `localStorage` e opcionalmente fixa
`data-brand` para white-label. Diferenças em relação ao protótipo do handoff, todas
deliberadas:

- **Seguro para SSR.** O handoff lia `localStorage` dentro do `useState`, que roda no render do
  servidor e produz divergência de hidratação. Aqui o estado vem de `useSyncExternalStore`, com
  snapshot de servidor fixo no `defaultTheme` — nenhuma API de navegador é tocada durante o
  render.
- **`system` existe.** `theme` pode ser `"light" | "dark" | "system"`, e a API expõe
  `resolvedTheme` com o valor realmente aplicado. Em modo `system` ele acompanha mudanças do
  sistema operacional ao vivo.
- **O atributo é escrito depois do commit**, em layout effect, não durante o render — um render
  descartado não pode deixar o documento com um tema que o React não confirmou.
- `ThemeProvider.useTheme` não é reproduzido: era limitação do bundle de preview do handoff.

O provider **não** evita o flash da primeira pintura e não tem como: React roda depois de o
documento já ter pintado. Isso continua exigindo um script inline bloqueante no `<head>` lendo
a mesma `storageKey` — o JSDoc do componente traz o trecho pronto.
