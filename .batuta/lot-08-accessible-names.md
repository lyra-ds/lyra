# Lote 08 — nomes acessíveis traduzíveis

Lote autossuficiente. Leia este arquivo inteiro antes de escrever qualquer linha.
Ele NÃO fica sobre o `brief-phase06b-fanout.md` — aquele brief é de documentação
de componente; este é de API do pacote React.

## Goal

Todo nome acessível que hoje é uma string inglesa fixa dentro de
`@lyra-ds/react` passa a ser sobrescrevível pelo consumidor, mantendo o inglês
como default. Nenhum comportamento visível muda; nenhum default muda.

## Por que isso é um defeito, e não um capricho

Lyra é um design system **white-label**. Um app em português que instala
`@lyra-ds/react` hoje entrega ao leitor de tela `"Close notification"`,
`"View mode"`, `"Loading"` — e **não tem como consertar**, porque os rótulos
estão escritos no meio do JSX, depois do spread ou em elementos internos.

A gravidade não é uniforme: em quatro componentes o consumidor **passa** um
`aria-label` e ele é descartado em silêncio, o que é pior do que não aceitar —
não há erro, não há aviso, e o código do consumidor parece correto.

As páginas de docs documentam essa limitação com honestidade ("There is no prop
to translate it"). Corrigir o código torna 11 páginas **falsas**; atualizá-las é
parte do lote, não um extra.

## Inventário completo — 17 rótulos em 12 componentes

Coluna "linha" é onde estava em 2026-07-27; ela vai deslizar conforme você edita.
Localize pelo símbolo, não pelo número.

### Classe (a) — `aria-label` no elemento raiz, DEPOIS do `{...rest}`

O consumidor já pode passar `aria-label` (todos estendem `HTMLAttributes`), mas
o atributo escrito depois do spread **vence e descarta o dele**. Correção de uma
linha cada, no padrão que o `Breadcrumb` e o `Pagination` já usam.

| Componente     | arquivo:linha                        | rótulo atual      | role     |
| -------------- | ------------------------------------ | ----------------- | -------- |
| `Spinner`      | `spinner/spinner.tsx:22`             | `"Loading"`       | `status` |
| `CookieBanner` | `cookie-banner/cookie-banner.tsx:70` | `"Cookie notice"` | `region` |

### Classe (b) — rótulo em elemento interno, precisa de prop nova

| Componente       | arquivo:linha                                       | rótulo atual                     | prop nova                                | default                          |
| ---------------- | --------------------------------------------------- | -------------------------------- | ---------------------------------------- | -------------------------------- |
| `Dialog`         | `dialog/dialog.tsx:188`                             | `"Close"`                        | `closeLabel?: string`                    | `'Close'`                        |
| `Drawer`         | `drawer/drawer.tsx:119`                             | `"Close"`                        | `closeLabel?: string`                    | `'Close'`                        |
| `Toast`          | `toast/toast.tsx:36`                                | `"Close notification"`           | `closeLabel?: string`                    | `'Close notification'`           |
| `Tag`            | `tag/tag.tsx:23`                                    | `"Remove"`                       | `removeLabel?: string`                   | `'Remove'`                       |
| `Pagination`     | `pagination/pagination.tsx:46,72`                   | `"Previous page"`, `"Next page"` | `previousLabel?`, `nextLabel?`           | `'Previous page'`, `'Next page'` |
| `CommandPalette` | `command-palette/command-palette.tsx:222`           | `"Search commands"`              | `searchLabel?: string`                   | `'Search commands'`              |
| `Avatar`         | `avatar/avatar.tsx:47`                              | `status` (o valor do enum!)      | `statusLabel?: string`                   | o próprio `status`               |
| `FileUpload`     | `file-upload/file-upload.tsx:245`                   | `"Upload complete"`              | `doneLabel?: string`                     | `'Upload complete'`              |
| `FileUpload`     | `file-upload/file-upload.tsx:252`                   | `` `Remove ${item.name}` ``      | `removeLabel?: (name: string) => string` | `` (name) => `Remove ${name}` `` |
| `FileManager`    | `file-manager/file-manager.tsx:143,148,157,165,124` | 5 rótulos                        | `labels?: FileManagerLabels`             | ver objeto abaixo                |

**Três desses rótulos não estavam no levantamento original e foram achados
relendo a fonte** — `Actions for ${file.name}` e `Remove ${item.name}` (que
interpolam nome de arquivo) e o `aria-label={status}` do `Avatar`. O do Avatar é
o pior do conjunto: anuncia o token cru do enum (`"online"`, `"busy"`, `"away"`),
minúsculo e sem frase.

### Fora de escopo, deliberadamente

- `Combobox` — `aria-label={label ? undefined : searchPlaceholder}`;
  `searchPlaceholder` já é prop do consumidor. Nada a fazer.
- `IconButton.label`, `Icon.title`, `Avatar.alt` (via `name`) — já são props.
- **Texto visível** em inglês fixo (os botões `"Only essentials"` / `"Accept all"`
  do CookieBanner, o cabeçalho `Name/Size/Modified` do FileManager, os itens do
  menu padrão do FileManager). É a mesma lacuna de white-label, mas é **texto
  visível, não nome acessível** — outro lote. NÃO mexa nisso aqui.
- `role="progressbar"`, `role="switch"`, `role="tablist"`, `role="tab"`,
  `role="region"`, `role="status"` escritos depois do spread: ali é **correto**.
  São a identidade do widget e deixar o consumidor sobrescrever quebra o
  componente. Só o `aria-label` sai de trás do spread; o `role` fica onde está.

## Shapes exatos — copie, não invente

### Classe (a): destructure e `??`

```tsx
// spinner/spinner.tsx
function Spinner({ size = 'md', className, 'aria-label': ariaLabel, ...rest }, ref) {
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('lyra-spinner', `lyra-spinner--${size}`, className)}
      role="status"
      aria-label={ariaLabel ?? 'Loading'}
    />
  );
}
```

E **redeclare a prop na interface com JSDoc**, no modelo que o
`CommandPaletteProps` já usa:

```tsx
export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  /**
   * Accessible name for the live region. Default: `"Loading"`. Translate it in a
   * localized interface — it is what a screen reader announces while content loads.
   */
  'aria-label'?: string;
}
```

`HTMLAttributes` já traz `'aria-label'`, então a redeclaração não muda o tipo —
ela existe para o **docgen enxergar e a prop aparecer na tabela**. Sem isso o
consumidor não descobre que pode sobrescrever, e o lote não resolve nada.

**Consequência disso, e é trabalho seu:** `Breadcrumb` e `Pagination` já honram
o `aria-label` do consumidor mas **não o declaram** — a prop existe e não está na
tabela. Adicione a mesma redeclaração com JSDoc nos dois. São duas linhas cada e
fecham a inconsistência em vez de aumentá-la.

### Classe (b), rótulo único: prop plana com default no destructure

```tsx
export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  // …
  /** Accessible name for the close button. Default: `"Close notification"`. */
  closeLabel?: string;
}

function Toast({ tone = 'info', icon, onClose, closeLabel = 'Close notification', className, children, ...rest }, ref) {
  // …
  <button type="button" className="lyra-toast__close" aria-label={closeLabel} onClick={onClose}>
```

### Classe (b), rótulo que interpola: prop de FUNÇÃO

```tsx
/** Accessible name for each remove button. Receives the file name. Default: `` (name) => `Remove ${name}` ``. */
removeLabel?: (name: string) => string;
```

Tem de ser função, não string com placeholder: a ordem das palavras muda entre
idiomas e um template fixo não localiza. Vale para
`FileUpload.removeLabel` e `FileManager.labels.itemActions`.

### `FileManager`: objeto agrupado, no contrato do `hints`

Cinco rótulos num componente é onde prop plana vira ruído. Use o padrão que o
`CommandPalette` já estabeleceu (`DEFAULT_HINTS` + merge), para o lote não
inventar um segundo estilo:

```tsx
/** Accessible names for the FileManager chrome. Merged over the defaults, so partial objects work. */
export interface FileManagerLabels {
  /** Name of the `role="group"` around the view toggle. Default: `"View mode"`. */
  viewMode?: string;
  /** List-view button. Default: `"List view"`. */
  listView?: string;
  /** Grid-view button. Default: `"Grid view"`. */
  gridView?: string;
  /** Breadcrumb landmark for the current folder. Default: `"Current folder"`. */
  currentFolder?: string;
  /** Per-item action trigger. Receives the file name. Default: `` (name) => `Actions for ${name}` ``. */
  itemActions?: (name: string) => string;
}

const DEFAULT_FM_LABELS: Required<FileManagerLabels> = {
  viewMode: 'View mode',
  listView: 'List view',
  gridView: 'Grid view',
  currentFolder: 'Current folder',
  itemActions: (name) => `Actions for ${name}`,
};
```

No corpo: `const labels = { ...DEFAULT_FM_LABELS, ...labelsProp };` — merge raso,
igual ao `hints`. Exporte o tipo em `file-manager/index.ts` **e** no barrel
`src/index.ts`, do jeito que `CommandPaletteHints` é exportado:

```ts
// file-manager/index.ts
export type { FileManagerLabels, FileManagerProps, ManagedFile } from './file-manager';
// src/index.ts (linha 30)
export type { FileManagerLabels, FileManagerProps, ManagedFile } from './file-manager';
```

### `Avatar`: default é outra prop, não uma constante

```tsx
/** Accessible name for the presence dot. Default: the `status` value itself. */
statusLabel?: string;
// …
aria-label={statusLabel ?? status}
```

### Armadilha: `Dialog`, `Drawer` e `CommandPalette` têm subcomponente de painel

Os três renderizam o painel num componente interno separado
(`DialogPanel`, `CommandPalettePanel`) com **interface de props própria**. A prop
nova precisa ser adicionada à interface interna e passada adiante — não basta
destructurar no componente externo, ou o valor não chega ao botão. Procure
`interface DialogPanelProps` e `interface CommandPalettePanelProps`.

## Testes (obrigatórios, tests-after)

Runner: Vitest **Browser Mode** (chromium). Siga o arquivo de teste vizinho de
cada componente — `src/<componente>/<componente>.browser.test.tsx`.

Para **cada** um dos 17 rótulos, dois testes:

1. **Default preservado** — sem passar a prop, o `aria-label` é a string inglesa
   de hoje. É a rede de segurança de que o lote não muda comportamento.
2. **Override aplicado** — passando a prop, o `aria-label` é o valor do
   consumidor.

Para os dois da **classe (a)**, o teste 2 é uma **regressão de bug**: antes o
`aria-label` do consumidor era descartado. Escreva no teste o que ele prova, no
tom que o `breadcrumb.browser.test.tsx` já usa para o mesmo caso.

Para as props de função, teste que o nome do arquivo chega ao rótulo
(ex.: `removeLabel={(name) => \`Excluir ${name}\`}`→`aria-label="Excluir a.pdf"`).

## Docs — 11 arquivos MDX que ficam falsos

Cada página tem uma seção de acessibilidade que hoje **afirma que não há prop**.
Exemplo real, `en/components/toast.mdx:40`:

> its accessible name is the English string "Close notification". There is no prop
> to translate it — a limitation worth knowing before you ship a localized product.

Reescreva essa prosa nas **duas línguas** para dizer o oposto: o default é inglês
e a prop `closeLabel` traduz. Arquivos:

```
en/components/{toast,cookie-banner,pagination,file-upload,file-manager,command-palette}.mdx
pt-BR/components/{toast,cookie-banner,pagination,file-upload,file-manager}.mdx
```

`spinner`, `dialog`, `drawer`, `tag` e `avatar` podem não ter a frase — confira
com grep e, se a seção de acessibilidade mencionar o rótulo, atualize também.

Os blocos "HTML puro" mostram `aria-label="Close notification"` no markup — isso
**continua correto** (é o default) e não muda.

**Não** mexa nas tabelas de props: elas são geradas do `props.json`.

## Gates — rode os 17 comandos do `.github/workflows/ci.yml`

O gate real é o arquivo do CI, não uma lista resumida. Leia
`.github/workflows/ci.yml` inteiro e rode o que está lá. Dois que já foram
esquecidos em rodadas anteriores e voltaram como PR vermelho:

- `pnpm --filter @lyra-ds/react run lint` (eslint, além do prettier do root)
- `pnpm --filter @lyra-ds/react exec size-limit`

Dois específicos deste lote:

- **docgen**: props novas mudam os `.d.ts` do dist, então o `props.json` e o
  `llms.txt` saem de sincronia e o gate `node tools/docgen/generate.mjs --check`
  falha. Rode `pnpm --filter @lyra-ds/react run build` e depois
  `node tools/docgen/generate.mjs` (SEM `--check`) para regenerar, e comite a
  saída. Um commit anterior perdeu exatamente isso porque o `--check` só roda no
  job `build` do CI, não no `pnpm build` local.
- **size-limit**: os rótulos novos custam bytes. Se algum orçamento estourar,
  suba o limite **no mesmo commit**, com o motivo escrito — é crescimento
  deliberado, não regressão.

## Changeset

Um changeset **minor** só em `@lyra-ds/react` (API nova, zero mudança em
`@lyra-ds/styles`, zero breaking change — todo default preserva o
comportamento de hoje). Formato: veja `.changeset/command-palette.md`. Escreva o
corpo em inglês, explicando as duas classes de defeito e listando as props novas.

## Fronteiras — não toque

- `handoff/**` (referência somente leitura), `packages/styles/**` (nenhum CSS
  muda neste lote), `pnpm-lock.yaml`, `dist/`, `node_modules/`,
  `packages/react/src/icon/icon-registry.ts` (gerado).
- Nenhum default novo: toda string default é **exatamente** a de hoje.
- Nenhum `role` sai de trás do spread.
- Texto visível em inglês fica para outro lote.
- Não comite. Deixe a árvore suja para o maestro verificar.

## Convenções do projeto que valem aqui

- JSDoc canônico **em inglês** em toda prop nova; frase completa, e o default
  citado no formato ``Default: `"Close"`.``
- Conventional commits (o maestro comita).
- `packages/react/CONVENTIONS.md` é a referência de conversão.
- Versões exatas, Node 24.
