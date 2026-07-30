# Retry: guia white-label — correção de 2 pontos

Leia primeiro `.batuta/lot-6ca-white-label.md` inteiro. Este arquivo **corrige** aquele em
dois pontos e mantém todo o resto. Seu trabalho anterior está no worktree e a base dele é
boa — não recomece do zero, ajuste.

## 1. Você estava certo, e o critério 4 estava errado — ele muda

Você reportou que, com o site em modo escuro, o seletor ancestral
`[data-theme="dark"] [data-brand]` também atinge os cartões nominalmente claros. **Isso é
verdade, e eu medi para confirmar.** Resultado da medição, com a marca `#0D9488`:

| Cenário                                                | `--accent` resolvido      | `--surface-card`   |
| ------------------------------------------------------ | ------------------------- | ------------------ |
| Página **clara**, célula sem atributo                  | `rgb(13, 148, 136)` (cru) | `rgb(255,255,255)` |
| Página **clara**, célula `data-theme="dark"`           | oklab teal clareado       | `rgb(18,20,48)`    |
| Página **escura**, célula sem atributo                 | oklab teal clareado       | `rgb(18,20,48)`    |
| Página **escura**, célula marcada `data-theme="light"` | oklab teal clareado       | `rgb(18,20,48)`    |

A última linha é o problema: **idêntica à de cima**. A causa é mais funda que o seletor do
`brand.css` — em `packages/styles/tokens/colors.css` o tema claro vive só em `:root`, e
**não existe bloco `[data-theme="light"]`**. Então nada restaura os tokens claros dentro de
um ancestral escuro; eles são herdados.

Consequência: **ilha escura dentro de página clara funciona; ilha clara dentro de página
escura não.** A grade de 6 células simultâneas é impossível sem tocar em
`packages/styles`, que está fora das Boundaries. O critério 4 pedia o impossível; a culpa é
do brief, não sua.

### Critério 4, novo

A demo mostra **as 3 brands lado a lado, no tema em que a página está**. Nada de forçar
tema por célula. Cada cartão continua mostrando componentes reais do DS reagindo à marca
(no mínimo um `Button` primário, algo com `--accent-soft`, e um `Input` para o anel de foco).

O que substitui a metade escura é **prosa + o toggle do próprio site**: o guia diz ao leitor
para usar o alternador de tema no cabeçalho e ver as 3 marcas se re-derivarem na frente
dele. Isso demonstra o "sem rebuild", que é o argumento de venda real, melhor do que uma
grade estática faria.

### Critério 11, novo — a limitação vira conteúdo

O guia ganha uma seção curta sobre ilhas de tema, com o que a medição acima mostra:
um contêiner `data-theme="dark"` dentro de uma página clara funciona (útil para um painel
permanentemente escuro), mas o inverso não, porque o claro é o default de `:root` e não um
bloco de atributo. Diga isso de forma útil para quem for construir com o Lyra, sem
prometer que será resolvido.

Isso vale nos dois idiomas. É informação honesta e é justamente o tipo de coisa que
alguém descobre do jeito difícil.

## 2. Remova o `autoFocus`

Em `apps/docs/components/examples/white-label/brands.tsx` o `Button` recebe
`autoFocus={brand.id === 'harbor' && theme === 'light'}`. Tire.

Um exemplo que rouba o foco ao carregar rola o leitor até a demo no meio da leitura da
página — é hostil, e não rastreia ao brief: o pedido era mostrar o **anel de foco**
derivado da marca, não focar automaticamente. O anel aparece quando o leitor navega por
teclado; se quiser deixá-lo visível na prosa, descreva-o em texto.

## 3. O ambiente já está resolvido

O worktree agora tem `node_modules` instalado, então **rode e reporte com saída real**:

```bash
pnpm --filter @lyra-ds/docs run build
pnpm run lint
```

O build tem de listar `/en/guides/white-label` e `/pt-BR/guides/white-label` entre as
páginas geradas. Continua valendo: você não tem navegador, então não relate como verificado
nada que dependa de renderização — o maestro abre as páginas.

## Mantido do brief original

Tudo o mais: Boundaries (nada em `packages/**`), Conventions, dogfooding, `.lw-*` só para
layout, conferir cada afirmação contra `brand.css` e `brand-theme.test.ts`, e os critérios
1, 2, 3, 5, 6, 7, 8, 9, 10.
