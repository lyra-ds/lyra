# PRD — binding `lyraAppSidebar` para o `@lyra-ds/alpine`

> Para: sessão Batuta do monorepo `lyra`, trabalhando em `packages/alpine`.
> De: sessão Batuta do `lyra-ds/blade`, 2026-08-08, durante a onda B.
> Fonte analisada: `lyra/packages/react/src/app-sidebar/app-sidebar.tsx` (fonte de verdade)
> e `packages/styles/components/navigation/navigation.css` (as regras do modo rail).
> Complementa `.batuta/prd-alpine-ondas-b-f.md` (entregue aqui em 2026-08-08, commit
> `ade1488`) e **corrige uma classificação dele**. Autocontido — não precisa do repo
> blade para executar.

## 1. Por que esta spec existe

O PRD das ondas B–F classificou `app-sidebar` como um dos **"3 estáticos (zero
hooks)"**, junto de `checkbox-group` e `radio-group`, e por isso ele entrou na
onda B do Blade como componente fase-1-style, sem dependência upstream.

**A classificação está errada.** O fonte React usa `useControllableState` para o
modo rail (colapsado), com botão de alternância, chevron que inverte de direção e
rótulos localizáveis. Os outros dois realmente são estáticos e já foram entregues;
este não.

O `@lyra-ds/alpine` 0.2.0 registra 28 `Alpine.data()` e **nenhum é `lyraAppSidebar`**
— verificado no `dist/index.js` publicado, no `origin/main` do monorepo e no
CHANGELOG do 0.2.0. Sem binding, o Blade só conseguiria entregar o componente sem
o botão de colapsar.

**Decisão do usuário (2026-08-08): adiar o componente Blade e abrir o binding no
upstream.** A task 7 do plano do blade fica bloqueada
até `lyraAppSidebar` existir; a onda B fecha sem ela.

## 2. O que o React faz (contrato a portar)

Estado: um único booleano `collapsed`, controlável (`collapsed` / `defaultCollapsed`
/ `onCollapsedChange`) via `useControllableState` — o mesmo padrão que os bindings
existentes mapeiam para `x-modelable`.

Efeitos do estado no render:

| Alvo                        | Expandido                                                      | Rail (colapsado)                                     |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| classe da raiz              | `lyra-appsidebar`                                              | `+ lyra-appsidebar--rail`                            |
| `--appsidebar-width`        | `${width}px` (default 260)                                     | `64px`                                               |
| heading de cada grupo       | renderizado                                                    | **omitido** (`label={undefined}`)                    |
| itens em modo dados         | sem `title`                                                    | `title = item.label` (tooltip nativo)                |
| children em modo composição | como vieram                                                    | links ganham `title`/`aria-label` derivados do texto |
| botão de toggle             | `aria-label`/`title` = `labels.collapse ?? 'Collapse sidebar'` | `= labels.expand ?? 'Expand sidebar'`                |
| chevron do toggle           | `<path d="m15 18-6-6 6-6" />`                                  | `<path d="m9 18 6-6-6-6" />`                         |

O SVG do toggle é inline (15×15, viewBox 24, stroke 2, caps/joins redondos),
pelo mesmo motivo do chevron do SidebarGroup: importar o `Icon` puxaria o
registry inteiro de nomes para todo consumidor.

O CSS já faz sozinho a maior parte do rail — `.lyra-appsidebar--rail` esconde
`.lyra-sbgroup__label`, `.lyra-sbgroup__item-label` e `.lyra-sbgroup__item-badge`,
centraliza os itens e o brand. Ou seja: **o binding não precisa mexer nos grupos**,
só na classe da raiz, na largura e nos atributos do toggle.

## 3. Binding proposto — `lyraAppSidebar (S)`

Modelable: `collapsed`. Sem outro estado.

```
lyraAppSidebar({ defaultCollapsed = false, width = 260, labels = { collapse, expand } })
```

x-bind sugeridos:

- **`root`** — `:class` com object syntax (`{ 'lyra-appsidebar--rail': collapsed }`,
  para reconciliar modificador vindo do servidor, como Accordion/Tabs/SidebarGroup)
  e `:style` mantendo `--appsidebar-width` em `collapsed ? '64px' : width + 'px'`.
- **`toggle`** — `type: 'button'`, `:aria-label` e `:title` alternando entre os dois
  rótulos, `@click` invertendo `collapsed`.
- **`chevron`** _(a decidir, ver §4)_ — alguma forma de trocar o `d` do path.

Eventos: seguir o padrão da onda — `$dispatch('lyra:collapse', { collapsed })` no
lugar do `onCollapsedChange`.

## 4. Decisões que o upstream precisa fechar

1. **Chevron que inverte.** Os dois paths diferem. Alternativas: (a) `:d` no path
   via bind, (b) dois `<path>` servidos com `x-show`, (c) só rotacionar por CSS e
   servir um path único — o que divergiria do React mas é o que o
   `.lyra-sbgroup__chev` já faz com `transform: rotate(-90deg)`. Preferência do lado
   Blade: **(b)**, porque mantém o markup servido e não exige `:d`.
2. **`title` dos itens em modo rail.** No React o `app-sidebar` reescreve os itens
   ao colapsar. Em Alpine o markup é servido: ou o binding percorre
   `.lyra-sbgroup__item` copiando o label para `title`, ou o consumidor serve o
   `title` sempre (o CSS já esconde o label visual no rail, e um `title` permanente
   é inofensivo no modo expandido). Preferência do lado Blade: **servir sempre**,
   e o binding não tocar nos itens.
3. **`addRailLinkLabels` para children de composição** — o React clona os filhos
   derivando `title`/`aria-label` do texto. Em Alpine isso seria varredura de DOM.
   Preferência do lado Blade: **não portar**; documentar que quem compõe links
   serve seus próprios `title`/`aria-label`.

## 5. O que o Blade fará quando o binding existir

Um `<lyra:app-sidebar>` com `brand`, `groups` (modo dados, compondo
`<lyra:sidebar-group>`), slot de composição, `footer`, `width`, `collapsible`,
`default-collapsed` e `labels`, servindo o estado inicial completo — incluindo a
classe `--rail` e o `--appsidebar-width` corretos — e delegando a alternância ao
binding, com `x-modelable="collapsed"` na raiz para Livewire.

Nada disso exige mudança no `lyraSidebarGroup`, que já está entregue e funcionando
(o contrato de seleção é o evento `lyra:select` com `{ id }` lido do `data-id`).
