# Spec — duas pendências do `@lyra-ds/alpine` que travam o lado Blade

> Para: sessão conduzindo este monorepo (`packages/alpine`).
> De: `lyra-ds/blade`, 2026-08-10, ao fechar a fase 2 (catálogo completo, release 0.8.1).
> Original: `lyra-ds/blade:docs/spec-alpine-pendencias-upstream.md` — se divergirem, o
> original é a fonte.
> **Convenção de caminhos neste documento:** caminhos soltos são relativos à raiz **deste**
> monorepo; os do outro repositório vêm prefixados com `lyra-ds/blade:`.
> Estado do lado Blade: **nada bloqueado**; os dois itens abaixo são props que hoje
> **não podem existir** no Blade sem quebrar uma promessa nossa, não features desejáveis.
> Fonte: leitura dos fontes citados, com arquivo e linha, no commit `0.3.0` publicado.

## Por que estes dois viraram spec, e não issue vaga

Ambos caem na mesma regra fechada do projeto Blade: **uma prop que funciona no HTML servido e
é revertida no boot do Alpine é pior que prop nenhuma.** Nos dois casos o Blade consegue
servir o valor certo, o binding sobrescreve com um valor fixo, e o consumidor fica com um
atributo que muda sozinho. Por isso a prop não foi exposta — a decisão está registrada no
`lyra-ds/blade:WORK.md` (tasks 22 e 16, 2026-08-09).

---

## 1. `lyraTimePicker`: `aria-label` da listbox precisa ser traduzível

### Estado atual

`packages/alpine/src/time-picker.ts`, binding `list` (por volta da linha 228):

```ts
    list: {
      role: 'listbox',
      tabindex: '-1',
      [':aria-label']() {
        return 'Time options';
      },
```

O texto é literal e não passa pelas options da factory. `LyraTimePickerOptions` (linha 4) é
plana e já carrega um rótulo — `placeholder` (`"Select time"`) — mas nada para a listbox:

```ts
export interface LyraTimePickerOptions {
  defaultValue?: string;
  step?: number;
  min?: string;
  max?: string;
  locale?: string;
  placeholder?: string;
}
```

### Impacto concreto no Blade

O componente `time-picker` do Blade já tem a prop `labels` e já monta o literal de options
que vai para `lyraTimePicker(...)` (`lyra-ds/blade:resources/views/components/time-picker.blade.php`,
linhas 11, 37 e 94). Ou seja, a fiação existe inteira: falta apenas um lugar para onde
mandar o rótulo. Hoje, uma app em português serve `aria-label="Opções de horário"` e vê o
Alpine trocar para `Time options` no boot — exatamente o anti-padrão que a regra proíbe.
Por isso `labels.timeOptions` **não foi exposta**.

### Mudança proposta

Aceitar o rótulo pelas options, com o texto atual como default:

```ts
export interface LyraTimePickerOptions {
  // ...
  /** Accessible name of the options listbox. Default: `"Time options"`. */
  optionsLabel?: string;
}
```

```ts
    list: {
      role: 'listbox',
      tabindex: '-1',
      [':aria-label']() {
        return this.optionsLabel;   // resolvido no factory, default 'Time options'
      },
```

**Decisão de forma, que é de vocês:** optei por uma option **plana** (`optionsLabel`) por
consistência com o próprio arquivo, onde `placeholder` já é um rótulo plano. O padrão
usado por bindings mais novos (`lyraAppSidebar`, `lyraWeeklyScheduleEditor`) é um objeto
`labels: { ... }`. Se preferirem uniformizar o ecossistema em `labels`, o lado Blade se
adapta sem custo — o que **não** serve é continuar sem caminho nenhum.

### Aceite

- `lyraTimePicker({ optionsLabel: 'Opções de horário' })` faz a listbox expor esse nome.
- Omitir a option mantém `Time options` — nenhum consumidor atual muda de comportamento.
- Teste de browser cobrindo os dois casos (com e sem a option), no estilo de
  `time-picker.browser.test.ts`.

### Depois, no Blade

Expor `labels.timeOptions` mapeando para a option nova, servir o mesmo texto no HTML e
adicionar o caso ao teste de paridade do `time-picker`.

---

## 2. `lyraTheme()`: chave de storage precisa ser configurável

### Estado atual

`packages/alpine/src/theme.ts`:

```ts
const STORAGE_KEY = 'lyra-theme';      // linha 22, constante de módulo
// ...
export function lyraTheme(): LyraThemeStore {   // linha 61, sem parâmetros
```

E o registro é automático no plugin — `packages/alpine/src/index.ts`, linha 124:

```ts
export default function lyra(alpine: LyraAlpine): void {
  alpine.store('theme', lyraTheme());
```

### Impacto concreto no Blade

O Blade emite um script bloqueante no `<head>` que aplica o tema antes do primeiro paint,
lendo a **mesma** chave — `lyra-ds/blade:src/ThemeScript.php`, linha 15:

```js
var s = localStorage.getItem('lyra-theme');
```

Os dois lados precisam concordar na chave. Como o binding não aceita configuração, o
`@lyraThemeScript` nasceu **zero-config** na v1 e o argumento opcional de chave ficou
travado: aceitar um argumento no Blade que o store ignora produziria uma aplicação que lê
uma chave e persiste em outra — pior que não ter o argumento.

Isto importa de verdade para: duas apps Lyra no mesmo domínio (temas independentes),
convivência com um tema legado que já usa `localStorage`, e ambientes multi-tenant.

### O problema de design, que é o miolo desta spec

Parametrizar `lyraTheme(options)` **não basta sozinho**: o plugin já registra o store por
conta própria em `index.ts:124`, e `Alpine.plugin(lyra)` só recebe a instância do Alpine —
não há hoje por onde o consumidor passar opção nenhuma. Três caminhos, do mais simples ao
mais correto:

**A. Só parametrizar a factory.** `lyraTheme(options?: { storageKey?: string })`, e o
consumidor re-registra o store depois do plugin:

```js
Alpine.plugin(lyra);
Alpine.store('theme', lyraTheme({ storageKey: 'app-theme' }));
```

Barato, mas depende de ordem de registro e de o `Alpine.store` aceitar sobrescrita — quem
implementar precisa confirmar essa semântica antes de documentar.

**B. Plugin configurável.** Manter `Alpine.plugin(lyra)` e acrescentar uma forma com
opções (`Alpine.plugin(lyra.withOptions({ theme: { storageKey } }))` ou um export nomeado).
Ergonômico e explícito, mas amplia a superfície pública do plugin.

**C. Chave declarada no DOM.** O store e o script bloqueante leem a chave do mesmo lugar,
por exemplo `<html data-lyra-theme-key="app-theme">`, com fallback para `lyra-theme`.

**Recomendação: C**, e a razão é o defeito que estamos tentando evitar, não elegância. Em
A e B a chave passa a existir em dois lugares — o script bloqueante do Blade e a config do
JS — e nada impede que divirjam; quando divergirem, o sintoma é tema piscando ou
preferência perdida, que é caro de diagnosticar. Em C existe **uma** fonte, no HTML, e o
Blade a emite junto com o script bloqueante: fica impossível estarem em desacordo. Se
preferirem A ou B, o lado Blade acompanha, mas então a documentação precisa dizer, com
todas as letras, que quem muda a chave tem de mudá-la nos dois lugares.

### Aceite

- Um consumidor consegue trocar a chave sem editar o pacote.
- Sem configuração, a chave segue `lyra-theme` — nenhuma app existente perde a preferência
  salva.
- O caminho escolhido garante (ou documenta explicitamente) que o script bloqueante e o
  store usam a mesma chave.
- Teste de browser: chave custom persiste e é relida; chave ausente cai no default.

### Depois, no Blade

Destrava o argumento opcional do `@lyraThemeScript`, que passa a emitir a chave escolhida —
e, se o caminho for C, a emitir também o atributo no `<html>`, fechando o contrato de uma
ponta a outra.

---

## Nota de método

Estes dois itens ficaram abertos por meses porque cada um foi encontrado no meio de outra
task e registrado como "prop não exposta, decisão do dia". Nenhum é urgente — o catálogo
Blade fechou em 72 componentes sem eles. Ambos são, porém, buracos de **acessibilidade
traduzível** e de **isolamento entre apps**, que é o tipo de coisa que só aparece quando um
consumidor real esbarra.
