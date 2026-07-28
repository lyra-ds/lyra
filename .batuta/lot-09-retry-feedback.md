# Lote 09 — feedback de verificação (retry 1)

A implementação passou na verificação; **12 dos 20 testes novos falharam nela**.
Só toque nos arquivos de teste listados abaixo.

## O defeito, provado

`screen.getByRole(...)` no Vitest Browser Mode retorna um **Locator** — um
objeto lazy que nunca é `null`. Logo `expect(screen.getByRole('button', {
name: 'X' })).not.toBeNull()` **passa sempre**, exista o elemento ou não.

Prova executada pelo maestro: revertendo o fix do CookieBanner
(`{acceptLabel}` → texto fixo `Accept all`), os 4 testes novos do CookieBanner
continuaram verdes — inclusive o override que procura `'Aceitar todos'`, que
não existe na tela. Um teste de regressão que não quebra com a regressão não
prova nada.

## Testes afetados (12)

- `cookie-banner.browser.test.tsx` — os 4 novos (default + override dos dois
  botões).
- `file-manager.browser.test.tsx` — os 8 novos do menu (default + override de
  Open/Rename/Download/Delete).

Os 6 de cabeçalho e os 2 de `itemsCount` usam `textContent` e são reais — não
mexa neles.

## Correção

Troque a asserção vácua por uma que resolve o locator de verdade:

```tsx
await expect.element(screen.getByRole('button', { name: 'Aceitar todos' })).toBeInTheDocument();
```

`expect.element` é a asserção documentada do Vitest Browser Mode (faz retry e
falha se o elemento não existir). Aplique nos 12.

## Fora de escopo

Os 4 usos **pré-existentes** de `not.toBeNull()` no
`file-manager.browser.test.tsx` (testes que já estavam lá antes do lote) ficam
como estão — débito antigo, tratado fora deste lote.

## Limite do sandbox

Você não roda Browser Mode. Rode typecheck/eslint/prettier no que mudou e
declare o que não rodou; o maestro reexecuta a suíte e refaz a prova de
regressão.

Não comite.
