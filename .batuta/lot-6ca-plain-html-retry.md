# Retry: guia de HTML puro — 3 correções

Leia `.batuta/lot-6ca-plain-html.md` primeiro. Este arquivo corrige três pontos e mantém
todo o resto. Seu trabalho está no worktree e a base é boa — ajuste, não recomece.

## 1. Erro meu no brief: fence de CSS é permitido

Minha regra "apenas fences ```html" queria proibir `<Example>` e JSX, **não** proibir fence
de CSS. Você a seguiu ao pé da letra e o resultado ficou ruim: um `<style>` com
`@import '@lyra-ds/styles/styles.css'` **não funciona no navegador**, e o guia traz um aviso
admitindo isso. Código que não roda, com ressalva, é pior que nenhum código.

Troque aquele bloco por um fence ```css representando o arquivo de entrada de CSS que o
bundler processa, sem `<style>` e sem a ressalva. Algo na forma:

```css
/* app.css — processado pelo seu bundler */
@import '@fontsource/plus-jakarta-sans/400.css';
@import '@lyra-ds/styles/styles.css';
```

E para o caso sem bundler, mostre o que realmente funciona no navegador: um `<link>` para o
CSS já resolvido/servido como asset. Fences ```html seguem válidos para marcação.

## 2. `.lyra-acc` NÃO é o bloco — a afirmação está errada

Conferido: `grep` em `packages/styles/components/` acha `.lyra-accordion` (regra própria, em
`display.css`) e acha `.lyra-acc__chevron`, `__item`, `__item--open`, `__panel`,
`__panel-clip`, `__panel-wrap`, `__trigger` — mas **nenhuma regra `.lyra-acc` sozinha**.

Então:

- A seção de BEM afirma "`lyra-acc` is the block". Isso é falso. Corrija: o contêiner é
  `.lyra-accordion` e as partes usam o prefixo `lyra-acc__`, que **não** coincide com o
  nome do bloco. Isso é um exemplo ainda melhor da armadilha que o guia está ensinando —
  use-o como tal, com a afirmação certa.
- A linha da tabela para Accordion deve dizer isso sem ambiguidade: contêiner
  `.lyra-accordion`, partes com prefixo `lyra-acc__`.

Escolha outro exemplo de BEM completo (bloco + elemento + modificador) que exista de fato
como as três coisas, ou apresente o do Accordion com a distinção explícita. Confira no CSS
antes de escrever.

## 3. `Icon` não pertence à lista de "styling-first"

Conferido: **`lyra-icon` não aparece em nenhum arquivo de `packages/styles/`** — zero
regras. O componente React emite `className="lyra-icon"` como gancho para o consumidor, mas
não existe CSS para ele no pacote.

Consequência para quem escreve HTML: **não há marcação de Icon para copiar.** Tire `Icon` da
lista de componentes "styling-first" e, em vez disso, diga o que é verdade — em HTML puro
você insere o SVG você mesmo (o sistema usa Lucide) e ele herda a cor do texto via
`currentColor`; a classe `.lyra-icon` existe como gancho, sem estilo próprio no pacote.

Confira as outras entradas da mesma lista contra `packages/styles/components/` pelo mesmo
critério: se a classe do componente não tem regra no CSS, ele não pode ser apresentado como
"use a marcação documentada".

## 4. Rode os comandos e reporte a saída real

O worktree tem `node_modules`. `pnpm run lint` vai continuar acusando
`.batuta/lot-6ca-*.md` — **isso é esperado e não é seu problema**, os briefs são meus e eu
os formato. Ignore especificamente esses arquivos ao julgar o lint; qualquer outro arquivo
acusado é seu.

Rode `pnpm --filter @lyra-ds/docs run build` e reporte se `/en/guides/plain-html` e
`/pt-BR/guides/plain-html` aparecem na listagem de rotas. Se a listagem não sair no seu
ambiente, diga isso em vez de afirmar que verificou.

## Mantido

Todo o resto do brief original: Boundaries (nada em `packages/**`, nada em
`components/examples/**`, nada no `site.css`), Conventions, e os critérios 1–11 — com o 11
agora reforçado: **zero classe sem regra no CSS**, não só zero classe inexistente.
