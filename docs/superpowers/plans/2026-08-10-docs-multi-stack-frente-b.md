# Documentação multi-stack — Frente B (site) Implementation Plan

> **Nota de execução (2026-08-12):** este plano virou **registro de trabalho feito**, não
> previsão — as tasks 1–10 foram executadas e entregues no PR #176 (mergeado em
> 2026-08-12); as tasks 11–12 dependiam do `api.json` da Frente A, publicado na release
> `v0.10.0` do `lyra-ds/blade`, e seguem pendentes. Três correções de desenho descobertas
> na execução (detalhes na spec, seção corrigida):
>
> 1. O catálogo do Alpine **não** sai das interfaces `Lyra*Options` — sai das chamadas
>    `Alpine.data()`/`Alpine.store()` no `dist/index.js` (o gerador entregue,
>    `tools/docgen/alpine.mjs`, faz assim).
> 2. São **quatro** stacks: HTML e Alpine são a mesma aba em dois estados.
> 3. O pacote exportava 29 linhas de `.d.ts`; **47** interfaces de opções (não 46) foram
>    exportadas, com o scanner `tools/dist-scan/alpine-types.mjs` contra regressão.
>
> E `form-row` nunca foi órfão: é documentado dentro de `fieldset.mdx` — não ganhou página
> própria; a união tem **75** páginas. `toast-stack` tem o binding `lyraToastStack` no
> Alpine, então a página nasceu com HTML + Alpine além do Blade.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o site documentar React e HTML + Alpine na mesma página, com seletor de stack, API gerada nas duas e a terceira aba (Blade) pronta para acender quando o artefato da Frente A chegar.

**Architecture:** O `@lyra-ds/alpine` passa a exportar suas interfaces de opções no entry, e um segundo gerador do docgen as transforma em `alpine-props.json` — mesma máquina que já produz `props.json` do React. O manifesto único de componentes ganha disponibilidade por stack; a página renderiza **todos** os blocos de API e código no HTML e um componente cliente mostra um por vez. Nada de rota nova: a escolha vive em `?stack=` mais `localStorage`, compatível com o export estático.

**Tech Stack:** Node 24, pnpm 11.13.1, TypeScript 5.9.3, Next.js 16.3, next-intl 4.13.5, fumadocs-core/mdx, vitest 4 (novo em `apps/docs`), `node --test` (scripts existentes), tsdown (build do alpine), changesets.

**Escopo:** só o repositório `lyra-ds/lyra`. A Frente A (gerador em `lyra-ds/blade`) e a Frente C (starter Laravel) têm planos próprios. As tasks 11 e 12 são a junção e **dependem do `api.json` produzido pela Frente A** — não comece por elas.

**Spec:** `docs/superpowers/specs/2026-08-10-documentacao-multi-stack-design.md`

## Global Constraints

- **Termo canônico é `stack`**, nunca "sabor"/"flavor". Em TypeScript o tipo é `DocStack` (nunca `Stack` solto — colide com o componente de layout `Stack` e com `toast-stack`).
- **Sem Tailwind em qualquer lugar.** Aparência só via classes `.lyra-*` de `@lyra-ds/styles`.
- **JSDoc e descrições de prop em inglês**, nas duas localidades — regra vigente do repo (`canonical-English-JSDoc`).
- **Locales:** `en` e `pt-BR` (`apps/docs/lib/i18n.ts`). Toda página nova existe nas duas.
- **Export estático:** nada de rota dinâmica; `generateStaticParams` + `dynamicParams = false` como já é hoje.
- **Artefatos gerados são commitados** e verificados por `--check` no CI (padrão de `tools/docgen`, `tools/icon-registry`).
- **Prettier é o lint da raiz** (`pnpm run lint` roda `prettier --check .`). Rode `pnpm run format` antes de commitar.
- **`@lyra-ds/alpine` está em 0.3.0 no `package.json` e 0.4.0 publicado**; qualquer mudança no pacote exige changeset.
- Commits em português, no formato convencional já usado no repo (`feat(alpine):`, `docs(site):`, `chore(docgen):`).

## File Structure

**Novos**

| Arquivo                                                        | Responsabilidade                                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `tools/dist-scan/alpine-types.mjs`                             | Falha se uma `export interface Lyra*` do `src` não chegar em `dist/index.d.ts`         |
| `tools/docgen/typescript.mjs`                                  | Helpers de parsing TS extraídos de `generate.mjs`, compartilhados pelos dois geradores |
| `tools/docgen/alpine.mjs`                                      | Gerador do `alpine-props.json` a partir de `packages/alpine/dist/index.d.ts`           |
| `tools/docgen/output/alpine-props.json`                        | Artefato gerado, commitado                                                             |
| `apps/docs/lib/stacks.ts`                                      | `DocStack`, ordem, rótulos e a função pura de resolução da stack ativa                 |
| `apps/docs/lib/stacks.test.ts`                                 | Testes da resolução (vitest)                                                           |
| `apps/docs/components/stack-tabs.tsx`                          | Componente cliente: seletor + troca de bloco visível                                   |
| `apps/docs/components/stack-api.tsx`                           | Servidor: renderiza a tabela de API de uma stack                                       |
| `apps/docs/vitest.config.ts`                                   | Projeto de teste do app de docs (ambiente node)                                        |
| ~~`form-row.mdx`~~ (não criado)                                | Correção: `form-row` é documentado dentro de `fieldset.mdx`, nunca foi órfão           |
| `apps/docs/content/docs/{en,pt-BR}/components/toast-stack.mdx` | Página órfã (HTML + Alpine + Blade — o binding `lyraToastStack` existe no pacote)      |
| `apps/docs/content/docs/{en,pt-BR}/guides/compatibility.mdx`   | Matriz de compatibilidade                                                              |

**Modificados**

| Arquivo                                   | Mudança                                           |
| ----------------------------------------- | ------------------------------------------------- |
| `packages/alpine/src/index.ts`            | Reexporta as 46 interfaces públicas               |
| `tools/docgen/generate.mjs`               | Passa a importar os helpers de `typescript.mjs`   |
| `package.json` (raiz)                     | Scripts `docgen:alpine`, `dist-scan:alpine-types` |
| `.github/workflows/ci.yml`                | Duas linhas de verificação novas                  |
| `apps/docs/lib/components.ts`             | `stacks` e `absence` por entrada                  |
| `apps/docs/components/prop-table.tsx`     | Aceita `stack`                                    |
| `apps/docs/components/component-page.tsx` | Injeta `StackTabs`/`StackApi` no MDX              |
| `apps/docs/messages/{en,pt-BR}.json`      | Rótulos do seletor e das ausências                |
| `apps/docs/scripts/copy-llms.mjs`         | Passa a copiar os três blocos                     |

---

### Task 1: Os tipos do Alpine chegam ao pacote publicado

Hoje `packages/alpine/dist/index.d.ts` tem 29 linhas e expõe só `lyra` e `LyraAlpine`. As 46 interfaces de opções vivem no `src` e nunca saem — foi assim que o `LyraTimePickerLabels` ficou invisível para o consumidor. O gerador da task 3 lê o `dist`, então isto vem primeiro.

**Files:**

- Create: `tools/dist-scan/alpine-types.mjs`
- Modify: `packages/alpine/src/index.ts` (bloco de reexports no fim do arquivo)
- Modify: `.github/workflows/ci.yml` (job de packaging, junto das outras linhas `dist-scan`)
- Modify: `package.json` (raiz, seção `scripts`)
- Create: `.changeset/alpine-export-option-types.md`

**Interfaces:**

- Consumes: nada.
- Produces: `packages/alpine/dist/index.d.ts` contendo todas as interfaces `Lyra*`. A task 3 depende disso.

- [ ] **Step 1: Escreva o scanner que prova a lacuna**

Create `tools/dist-scan/alpine-types.mjs`:

```js
#!/usr/bin/env node
/**
 * Toda `export interface Lyra*` do src do @lyra-ds/alpine precisa chegar às declarações
 * publicadas. As interfaces de opções são o contrato documentado de cada binding, e o
 * docgen as lê do dist — um tipo que nunca sai do src é invisível para o consumidor e
 * para a documentação ao mesmo tempo.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(REPO, 'packages', 'alpine', 'src');
const DTS = join(REPO, 'packages', 'alpine', 'dist', 'index.d.ts');
const INTERFACE = /^export interface (Lyra\w+)/gm;

function declaredInSource() {
  const names = new Set();

  for (const file of readdirSync(SRC).sort()) {
    if (!file.endsWith('.ts') || file.includes('.test.')) continue;
    const source = readFileSync(join(SRC, file), 'utf8');
    for (const [, name] of source.matchAll(INTERFACE)) names.add(name);
  }

  return names;
}

function main() {
  const declared = declaredInSource();
  const published = readFileSync(DTS, 'utf8');
  const missing = [...declared].filter((name) => !new RegExp(`\\b${name}\\b`).test(published));

  if (missing.length > 0) {
    throw new Error(
      `${missing.length} interface(s) ausente(s) de dist/index.d.ts:\n  ${missing.join('\n  ')}\n` +
        'Reexporte a partir de packages/alpine/src/index.ts e rode o build do pacote.',
    );
  }

  console.log(`alpine-types OK: as ${declared.size} interfaces exportadas chegam ao dist.`);
}

try {
  main();
} catch (error) {
  console.error(`alpine-types FAILED: ${error.message}`);
  process.exit(1);
}
```

- [ ] **Step 2: Rode o scanner e veja falhar**

```bash
pnpm --filter @lyra-ds/alpine run build
node tools/dist-scan/alpine-types.mjs
```

Esperado: `alpine-types FAILED: 45 interface(s) ausente(s)…`, listando `LyraAccordionOptions` e companhia. Só `LyraAlpine` passa. Se ele passar de primeira, pare: alguém já reexportou e este plano precisa ser relido.

- [ ] **Step 3: Reexporte as interfaces no entry**

Append ao fim de `packages/alpine/src/index.ts` (depois da função `lyra`):

```ts
export type { LyraAccordionOptions } from './accordion';
export type { LyraAppSidebarLabels, LyraAppSidebarOptions } from './app-sidebar';
export type { LyraBottomSheetOptions } from './bottom-sheet';
export type { LyraCalendarLabels, LyraCalendarOptions, LyraCalendarRange } from './calendar';
export type { LyraComboboxOption, LyraComboboxOptions } from './combobox';
export type {
  LyraCommandPaletteGroup,
  LyraCommandPaletteHints,
  LyraCommandPaletteItem,
  LyraCommandPaletteOptions,
} from './command-palette';
export type { LyraCookieBannerOptions } from './cookie-banner';
export type { LyraDataTableOptions, LyraDataTableSorting } from './data-table';
export type { LyraDatePickerOptions } from './date-picker';
export type { LyraDateRangePickerOptions } from './date-range-picker';
export type { LyraDialogOptions } from './dialog';
export type { LyraDrawerOptions } from './drawer';
export type { LyraDropdownOptions } from './dropdown';
export type { LyraFileManagerOptions } from './file-manager';
export type { LyraFileUploadItem, LyraFileUploadOptions } from './file-upload';
export type { LyraPopoverOptions } from './popover';
export type { LyraRecurrenceSelectorOptions } from './recurrence-selector';
export type { LyraSegmentedControlOptions } from './segmented-control';
export type { LyraSidebarGroupOptions } from './sidebar-group';
export type { LyraSlot, LyraSlotPickerLabels, LyraSlotPickerOptions } from './slot-picker';
export type { LyraTableOfContentsOptions } from './table-of-contents';
export type { LyraTabsOptions } from './tabs';
export type { LyraThemeStore } from './theme';
export type { LyraTimeInputOptions } from './time-input';
export type { LyraTimePickerLabels, LyraTimePickerOptions } from './time-picker';
export type {
  LyraTimeZonePickerLabels,
  LyraTimeZonePickerOption,
  LyraTimeZonePickerOptions,
} from './time-zone-picker';
export type { LyraToastOptions, LyraToastStackData, LyraToastsStore } from './toasts';
export type { LyraTooltipOptions } from './tooltip';
export type { LyraWeeklyScheduleEditorOptions } from './weekly-schedule-editor';
export type { LyraWorkspaceSwitcherOptions } from './workspace-switcher';
```

- [ ] **Step 4: Rebuild e rode o scanner de novo**

```bash
pnpm --filter @lyra-ds/alpine run build
node tools/dist-scan/alpine-types.mjs
```

Esperado: `alpine-types OK: as 46 interfaces exportadas chegam ao dist.`

- [ ] **Step 5: Confirme que o pacote continua íntegro**

```bash
pnpm --filter @lyra-ds/alpine run test
pnpm --filter @lyra-ds/alpine run typecheck
pnpm --filter @lyra-ds/alpine exec attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm
pnpm --filter @lyra-ds/alpine exec size-limit
```

Esperado: suíte verde, sem erro de tipos, `attw` sem achados. `size-limit` **não pode** subir — reexport de tipo some no runtime; se subir, algo virou valor por engano.

- [ ] **Step 6: Ligue no CI e nos scripts**

Em `package.json` (raiz), na seção `scripts`, depois de `"docgen"`:

```json
    "dist-scan:alpine-types": "node tools/dist-scan/alpine-types.mjs",
```

Em `.github/workflows/ci.yml`, no job de packaging, imediatamente após a linha `- run: pnpm --filter @lyra-ds/alpine exec size-limit`:

```yaml
- name: Interfaces do Alpine chegam às declarações publicadas
  run: node tools/dist-scan/alpine-types.mjs
```

- [ ] **Step 7: Changeset**

Create `.changeset/alpine-export-option-types.md`:

```markdown
---
'@lyra-ds/alpine': minor
---

Exporta as interfaces de opções de cada binding (`LyraDropdownOptions`, `LyraTimePickerLabels`, …) no entry do pacote. Antes elas existiam só no fonte, então o consumidor não conseguia tipar o objeto passado em `x-data` e a documentação não tinha de onde ler o contrato. Nenhuma mudança de runtime.
```

- [ ] **Step 8: Commit**

```bash
pnpm run format
git add packages/alpine/src/index.ts tools/dist-scan/alpine-types.mjs package.json .github/workflows/ci.yml .changeset/alpine-export-option-types.md
git commit -m "feat(alpine): exporta as interfaces de opções no entry do pacote"
```

---

### Task 2: Extrair os helpers de parsing do docgen

`tools/docgen/generate.mjs` tem ~400 linhas e mistura duas coisas: ler declarações TypeScript e renderizar os artefatos do React. O gerador do Alpine precisa da primeira metade. Esta task é **movimentação pura**, e o `--check` existente é a prova: a saída tem que continuar byte a byte idêntica.

**Files:**

- Create: `tools/docgen/typescript.mjs`
- Modify: `tools/docgen/generate.mjs`

**Interfaces:**

- Produces: de `tools/docgen/typescript.mjs`, exporta `rawJSDoc(node, sourceFile)`, `descriptionFromJSDoc(doc)`, `renderJSDoc(doc, indent)`, `membersFromInterface(interfaceNode, sourceFile)`, `membersFromTypeNode(typeNode, sourceFile, declarations, seen)`, `membersFromTypeAlias(alias, sourceFile, declarations)`, `pascalFromKebab(value)`, `titleCase(value)`. Assinaturas idênticas às atuais.

- [ ] **Step 1: Fixe a saída atual como referência**

```bash
pnpm --filter @lyra-ds/react run build
node tools/docgen/generate.mjs --check
```

Esperado: `docgen --check OK: both generated artifacts match (N components).` Se já falhar aqui, gere e commite antes de mexer em qualquer coisa — o baseline precisa estar verde.

- [ ] **Step 2: Mova os helpers**

Crie `tools/docgen/typescript.mjs` com o cabeçalho abaixo e, **recortadas sem alteração** de `generate.mjs`, as funções `titleCase`, `pascalFromKebab`, `rawJSDoc`, `descriptionFromJSDoc`, `renderJSDoc`, `membersFromInterface`, `membersFromTypeNode` e `membersFromTypeAlias`, cada uma precedida de `export`:

```js
/**
 * Leitura de declarações TypeScript compartilhada pelos geradores do docgen.
 * Sem estado e sem I/O: recebe nós do compilador e devolve dados. Quem lê arquivo
 * e renderiza artefato é cada gerador (generate.mjs para React, alpine.mjs para Alpine).
 */
import ts from 'typescript';
```

- [ ] **Step 3: Importe em generate.mjs**

Remova de `generate.mjs` as oito funções movidas e adicione, junto dos outros imports:

```js
import {
  descriptionFromJSDoc,
  membersFromInterface,
  membersFromTypeAlias,
  membersFromTypeNode,
  pascalFromKebab,
  rawJSDoc,
  renderJSDoc,
  titleCase,
} from './typescript.mjs';
```

- [ ] **Step 4: Prove que nada mudou**

```bash
node tools/docgen/generate.mjs --check
```

Esperado: o mesmo `docgen --check OK` do Step 1, com o mesmo número de componentes. Qualquer drift aqui significa que a movimentação alterou comportamento — desfaça e refaça o recorte.

- [ ] **Step 5: Commit**

```bash
pnpm run format
git add tools/docgen/typescript.mjs tools/docgen/generate.mjs
git commit -m "chore(docgen): extrai os helpers de parsing TypeScript para um módulo próprio"
```

---

### Task 3: Gerador do `alpine-props.json`

**Files:**

- Create: `tools/docgen/alpine.mjs`
- Create: `tools/docgen/output/alpine-props.json` (gerado)
- Modify: `package.json` (raiz)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `packages/alpine/dist/index.d.ts` (task 1); helpers de `tools/docgen/typescript.mjs` (task 2).
- Produces: `tools/docgen/output/alpine-props.json` — array de objetos

```jsonc
{
  "binding": "lyraDropdown", // nome registrado no Alpine.data()
  "slug": "dropdown", // casa com ComponentEntry.slug do manifesto
  "optionsType": "LyraDropdownOptions",
  "description": "…", // JSDoc da interface
  "props": [{ "name": "…", "type": "…", "optional": true, "description": "…" }],
}
```

O array é ordenado por `slug`. A task 5 consome esse arquivo.

- [ ] **Step 1: Escreva o gerador**

Create `tools/docgen/alpine.mjs`:

```js
#!/usr/bin/env node
/**
 * Gera o catálogo de opções dos bindings do @lyra-ds/alpine a partir das declarações
 * publicadas. Espelha tools/docgen/generate.mjs: mesma fonte (o dist, que é o contrato),
 * mesmo modo --check, mesmo artefato commitado.
 *
 * O slug de cada binding é derivado do nome (lyraDropdown → dropdown) porque o manifesto
 * do site é kebab-case. Onde a derivação não bate com o slug documentado, a exceção fica
 * explícita em SLUG_OVERRIDES — nunca inferida.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { descriptionFromJSDoc, membersFromInterface, rawJSDoc } from './typescript.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DTS = join(REPO, 'packages', 'alpine', 'dist', 'index.d.ts');
const OUTPUT = join(REPO, 'tools', 'docgen', 'output');
const PROPS_FILE = join(OUTPUT, 'alpine-props.json');

// Bindings cujo slug no site não é a forma kebab do nome.
const SLUG_OVERRIDES = new Map([
  ['lyraTheme', 'theme-provider'],
  ['lyraToasts', 'toast'],
  ['lyraToastStack', 'toast-stack'],
]);

function kebab(binding) {
  return binding
    .replace(/^lyra/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function slugFor(binding) {
  return SLUG_OVERRIDES.get(binding) ?? kebab(binding);
}

function extractBindings() {
  const source = ts.createSourceFile(DTS, readFileSync(DTS, 'utf8'), ts.ScriptTarget.Latest, true);
  const interfaces = new Map();

  source.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node);
  });

  const bindings = [];

  for (const [name, node] of interfaces) {
    const match = /^Lyra(\w+)Options$/.exec(name);
    if (!match) continue;

    const binding = `lyra${match[1]}`;
    bindings.push({
      binding,
      slug: slugFor(binding),
      optionsType: name,
      description: descriptionFromJSDoc(rawJSDoc(node, source)),
      props: membersFromInterface(node, source).map(({ jsDoc: _jsDoc, ...prop }) => prop),
    });
  }

  return bindings.sort((a, b) => a.slug.localeCompare(b.slug));
}

function render() {
  return JSON.stringify(extractBindings(), null, 2) + '\n';
}

function main() {
  const mode = process.argv[2];
  if (mode && mode !== '--check') {
    throw new Error(`Argumento desconhecido ${mode}. Use sem argumento ou --check.`);
  }

  const generated = render();

  if (mode === '--check') {
    if (!existsSync(PROPS_FILE)) {
      throw new Error(
        'tools/docgen/output/alpine-props.json ausente — rode `pnpm run docgen:alpine`.',
      );
    }
    if (readFileSync(PROPS_FILE, 'utf8') !== generated) {
      throw new Error(
        'tools/docgen/output/alpine-props.json difere de uma geração fresca. Rode `pnpm run docgen:alpine` e commite.',
      );
    }
    console.log('docgen:alpine --check OK.');
    return;
  }

  mkdirSync(OUTPUT, { recursive: true });
  writeFileSync(PROPS_FILE, generated, 'utf8');
  console.log(
    `docgen:alpine: escreveu alpine-props.json (${JSON.parse(generated).length} bindings).`,
  );
}

try {
  main();
} catch (error) {
  console.error(`docgen:alpine FAILED: ${error.message}`);
  process.exit(1);
}
```

- [ ] **Step 2: Rode e confira a saída**

```bash
pnpm --filter @lyra-ds/alpine run build
node tools/docgen/alpine.mjs
node -e "const b=require('./tools/docgen/output/alpine-props.json'); console.log(b.length); console.log(b.map(x=>x.slug).join(' '))"
```

Esperado: pelo menos 25 bindings, e os slugs devem casar com nomes de arquivo em `apps/docs/content/docs/en/components/`. **Anote qualquer slug que não exista lá** — cada um é uma linha nova em `SLUG_OVERRIDES` ou um componente sem página, e a task 5 vai cobrar isso.

- [ ] **Step 3: Prove o modo --check**

```bash
node tools/docgen/alpine.mjs --check
echo '[]' > tools/docgen/output/alpine-props.json
node tools/docgen/alpine.mjs --check; echo "exit=$?"
node tools/docgen/alpine.mjs
```

Esperado: primeiro OK; depois `FAILED: … difere de uma geração fresca` com `exit=1`; a última linha restaura o arquivo. Sem essa prova, o guard do CI é decorativo.

- [ ] **Step 4: Ligue nos scripts e no CI**

Em `package.json` (raiz), logo após `"docgen"`:

```json
    "docgen:alpine": "node tools/docgen/alpine.mjs",
```

Em `.github/workflows/ci.yml`, imediatamente após `- run: node tools/docgen/generate.mjs --check`:

```yaml
- run: node tools/docgen/alpine.mjs --check
```

- [ ] **Step 5: Commit**

```bash
pnpm run format
git add tools/docgen/alpine.mjs tools/docgen/output/alpine-props.json package.json .github/workflows/ci.yml
git commit -m "feat(docgen): gera o catálogo de opções dos bindings do Alpine"
```

---

### Task 4: `DocStack` e a resolução da stack ativa

Lógica pura, testada, antes de qualquer pixel. `apps/docs` não tem test runner hoje (só `node --test` sobre `scripts/*.mjs`), então esta task instala o vitest do app.

**Files:**

- Create: `apps/docs/lib/stacks.ts`
- Create: `apps/docs/lib/stacks.test.ts`
- Create: `apps/docs/vitest.config.ts`
- Modify: `apps/docs/package.json` (script `test`, devDependency)

**Interfaces:**

- Produces:
  - `type DocStack = 'react' | 'alpine' | 'blade'`
  - `const stackOrder: DocStack[]` — `['react', 'alpine', 'blade']`
  - `const stackLabelKey: Record<DocStack, string>` — chave next-intl por stack
  - `function resolveStack(available: DocStack[], requested?: string | null): DocStack`
- A task 5 consome os quatro.

- [ ] **Step 1: Instale o runner**

```bash
pnpm --filter @lyra-ds/docs add -D vitest@4.1.10
```

Create `apps/docs/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'components/**/*.test.ts'],
  },
});
```

Em `apps/docs/package.json`, troque a linha do script `test` por:

```json
    "test": "node --test scripts/consent.test.mjs scripts/analytics.test.mjs scripts/consent-export.test.mjs && vitest run",
```

- [ ] **Step 2: Escreva os testes que falham**

Create `apps/docs/lib/stacks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveStack, stackOrder } from './stacks';

describe('resolveStack', () => {
  it('honra a stack pedida quando ela existe para o componente', () => {
    expect(resolveStack(['react', 'alpine', 'blade'], 'blade')).toBe('blade');
  });

  it('cai na primeira disponível quando a pedida não existe ali', () => {
    expect(resolveStack(['react'], 'blade')).toBe('react');
  });

  it('cai na primeira disponível quando nada é pedido', () => {
    expect(resolveStack(['alpine', 'blade'], null)).toBe('alpine');
  });

  it('ignora valor arbitrário vindo da URL', () => {
    expect(resolveStack(['react', 'blade'], 'javascript')).toBe('react');
  });

  it('respeita a ordem canônica, não a ordem recebida', () => {
    expect(resolveStack(['blade', 'react'], null)).toBe('react');
  });

  it('expõe a ordem canônica das stacks', () => {
    expect(stackOrder).toEqual(['react', 'alpine', 'blade']);
  });
});
```

- [ ] **Step 3: Rode e veja falhar**

```bash
pnpm --filter @lyra-ds/docs exec vitest run
```

Esperado: falha de resolução do módulo — `Failed to resolve import "./stacks"`.

- [ ] **Step 4: Implemente**

Create `apps/docs/lib/stacks.ts`:

```ts
/**
 * As stacks documentadas: um CSS canônico, dois runtimes de comportamento (React e
 * Alpine) e, do lado Alpine, duas formas de emitir o HTML (à mão ou via Blade).
 *
 * O nome do tipo é `DocStack`, e não `Stack`, porque `Stack` já é um componente de
 * layout do próprio design system.
 */
export type DocStack = 'react' | 'alpine' | 'blade';

/** Ordem canônica: do runtime mais usado ao mais específico. Decide o fallback. */
export const stackOrder: DocStack[] = ['react', 'alpine', 'blade'];

/** Stack → chave de mensagem next-intl, para que os rótulos não se dupliquem por aí. */
export const stackLabelKey: Record<DocStack, string> = {
  react: 'stackReact',
  alpine: 'stackAlpine',
  blade: 'stackBlade',
};

function isDocStack(value: unknown): value is DocStack {
  return typeof value === 'string' && (stackOrder as string[]).includes(value);
}

/**
 * Decide qual stack mostrar. `requested` vem de `?stack=` ou do localStorage e é dado
 * não confiável: valor fora do vocabulário, ou de uma stack que o componente não tem,
 * cai na primeira disponível na ordem canônica — nunca numa aba vazia.
 */
export function resolveStack(available: DocStack[], requested?: string | null): DocStack {
  if (isDocStack(requested) && available.includes(requested)) return requested;

  const fallback = stackOrder.find((stack) => available.includes(stack));
  if (!fallback) throw new Error('Um componente precisa de pelo menos uma stack disponível.');

  return fallback;
}
```

- [ ] **Step 5: Rode e veja passar**

```bash
pnpm --filter @lyra-ds/docs exec vitest run
pnpm --filter @lyra-ds/docs run typecheck
```

Esperado: 6 testes verdes, typecheck limpo.

- [ ] **Step 6: Commit**

```bash
pnpm run format
git add apps/docs/lib/stacks.ts apps/docs/lib/stacks.test.ts apps/docs/vitest.config.ts apps/docs/package.json pnpm-lock.yaml
git commit -m "feat(site): tipo DocStack e resolução da stack ativa"
```

---

### Task 5: Disponibilidade por stack no manifesto

O manifesto já é a fonte única de rota, sidebar, índice e prop table. Agora ele também responde "quais stacks este componente tem, e o que dizer quando falta uma".

**Files:**

- Modify: `apps/docs/lib/components.ts`
- Create: `apps/docs/lib/components.test.ts`

**Interfaces:**

- Consumes: `DocStack`, `stackOrder` (task 4); `tools/docgen/output/alpine-props.json` (task 3).
- Produces: `ComponentEntry` ganha `stacks: DocStack[]` e `absence?: Partial<Record<DocStack, string>>` (chave de mensagem next-intl), ambos legíveis pelo `getComponent(slug)` que já existe. As tasks 6 e 7 consomem.

- [ ] **Step 1: Escreva o teste de invariantes**

Create `apps/docs/lib/components.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import alpineProps from '../../../tools/docgen/output/alpine-props.json';
import reactProps from '../../../tools/docgen/output/props.json';
import { components } from './components';
import { stackOrder } from './stacks';

const alpineSlugs = new Set((alpineProps as { slug: string }[]).map((entry) => entry.slug));
const reactNames = new Set((reactProps as { name: string }[]).map((entry) => entry.name));

describe('manifesto de componentes', () => {
  it('declara pelo menos uma stack por componente', () => {
    for (const entry of components) {
      expect(entry.stacks.length, `${entry.slug} sem nenhuma stack`).toBeGreaterThan(0);
    }
  });

  it('só declara stacks do vocabulário canônico', () => {
    for (const entry of components) {
      for (const stack of entry.stacks) expect(stackOrder).toContain(stack);
    }
  });

  it('não declara React sem props geradas correspondentes', () => {
    for (const entry of components.filter((item) => item.stacks.includes('react'))) {
      expect(
        reactNames.has(entry.name),
        `${entry.name} declara react sem entrada em props.json`,
      ).toBe(true);
    }
  });

  it('não declara Alpine sem binding gerado correspondente', () => {
    for (const entry of components.filter((item) => item.stacks.includes('alpine'))) {
      expect(alpineSlugs.has(entry.slug), `${entry.slug} declara alpine sem binding gerado`).toBe(
        true,
      );
    }
  });

  it('não deixa binding gerado sem página que o declare', () => {
    const declared = new Set(
      components.filter((entry) => entry.stacks.includes('alpine')).map((entry) => entry.slug),
    );
    for (const slug of alpineSlugs) {
      expect(declared.has(slug), `binding ${slug} gerado mas nenhuma página o declara`).toBe(true);
    }
  });

  it('explica toda stack ausente', () => {
    for (const entry of components) {
      for (const stack of stackOrder) {
        if (entry.stacks.includes(stack)) continue;
        expect(
          entry.absence?.[stack],
          `${entry.slug} não explica a ausência de ${stack}`,
        ).toBeTruthy();
      }
    }
  });
});
```

- [ ] **Step 2: Rode e veja falhar**

```bash
pnpm --filter @lyra-ds/docs exec vitest run lib/components.test.ts
```

Esperado: erro de tipo/execução em `entry.stacks` — o campo ainda não existe.

- [ ] **Step 3: Estenda o tipo do manifesto**

Em `apps/docs/lib/components.ts`, adicione o import e estenda `ComponentEntry`:

```ts
import type { DocStack } from './stacks';
```

```ts
export type ComponentEntry = {
  /** Kebab-case slug — matches the MDX filename and the example registry key. */
  slug: string;
  /** PascalCase name — matches the entry in `tools/docgen/output/props.json`. */
  name: string;
  group: ComponentGroup;
  /** Stacks documentadas para este componente. Decide quais abas a página mostra. */
  stacks: DocStack[];
  /**
   * Chave de mensagem que explica cada stack ausente. Ausência sem explicação é buraco;
   * com explicação, é documentação — por isso o teste de invariantes cobra as duas.
   */
  absence?: Partial<Record<DocStack, string>>;
};
```

- [ ] **Step 4: Preencha as entradas**

Para cada entrada do `manifest`, acrescente `stacks`. Use estas fontes, nesta ordem:

1. `react`: todo componente que tem entrada em `tools/docgen/output/props.json`.
2. `alpine`: todo slug presente em `tools/docgen/output/alpine-props.json` (lista impressa na task 3, Step 2).
3. `blade`: **ninguém ainda** — a terceira aba acende na task 12.

Exemplos exatos, para não restar dúvida de forma:

```ts
  { slug: 'button', name: 'Button', group: 'action', stacks: ['react'],
    absence: { alpine: 'absenceAlpineStatic', blade: 'absenceBladePending' } },
  { slug: 'dropdown', name: 'Dropdown', group: 'overlay', stacks: ['react', 'alpine'],
    absence: { blade: 'absenceBladePending' } },
  { slug: 'theme-provider', name: 'ThemeProvider', group: 'system', stacks: ['react', 'alpine'],
    absence: { blade: 'absenceBladeThemeProvider' } },
  { slug: 'calendar-view', name: 'CalendarView', group: 'data', stacks: ['react'],
    absence: { alpine: 'absenceAlpineCalendarView', blade: 'absenceBladeCalendarView' } },
```

- [ ] **Step 5: Adicione as mensagens de ausência**

Em `apps/docs/messages/en.json`:

```json
  "stackReact": "React",
  "stackAlpine": "HTML + Alpine",
  "stackBlade": "Blade",
  "absenceAlpineStatic": "This component is static — it needs no Alpine binding. The plain HTML is all there is.",
  "absenceBladePending": "Not documented for Blade yet.",
  "absenceBladeThemeProvider": "Blade has no provider shape. The theme lives in the @lyraThemeScript directive plus the Alpine theme store.",
  "absenceBladeCalendarView": "Deferred by decision — CalendarView has no Blade counterpart yet.",
  "absenceAlpineCalendarView": "Deferred by decision — CalendarView has no Alpine binding yet.",
```

Em `apps/docs/messages/pt-BR.json`, as mesmas chaves:

```json
  "stackReact": "React",
  "stackAlpine": "HTML + Alpine",
  "stackBlade": "Blade",
  "absenceAlpineStatic": "Este componente é estático — não precisa de binding Alpine. O HTML puro é tudo o que existe.",
  "absenceBladePending": "Ainda não documentado para Blade.",
  "absenceBladeThemeProvider": "Blade não tem forma de provider. O tema vive na diretiva @lyraThemeScript e no store de tema do Alpine.",
  "absenceBladeCalendarView": "Adiado por decisão — CalendarView ainda não tem equivalente em Blade.",
  "absenceAlpineCalendarView": "Adiado por decisão — CalendarView ainda não tem binding Alpine.",
```

- [ ] **Step 6: Rode os testes**

`getComponent(slug)` já devolve a entrada inteira, e é dela que a task 7 lê `stacks` e
`absence` — nenhum acessor novo é necessário.

```bash
pnpm --filter @lyra-ds/docs exec vitest run
pnpm --filter @lyra-ds/docs run typecheck
```

Esperado: os 6 testes de manifesto verdes. Se `não deixa binding gerado sem página que o declare` falhar, a saída aponta um binding cujo slug não tem página — resolva agora, adicionando `SLUG_OVERRIDES` na task 3 ou anotando o componente para a task 8.

- [ ] **Step 7: Commit**

```bash
pnpm run format
git add apps/docs/lib/components.ts apps/docs/lib/components.test.ts apps/docs/messages/en.json apps/docs/messages/pt-BR.json
git commit -m "feat(site): disponibilidade por stack e explicação de ausência no manifesto"
```

---

### Task 6: `StackTabs` — o seletor

Todos os blocos vão no HTML; o cliente mostra um. Isso mantém o conteúdo inteiro no export estático (e indexável), e a troca não repinta a página.

**Files:**

- Create: `apps/docs/components/stack-tabs.tsx`
- Create: `apps/docs/components/stack-tabs.test.ts`

**Interfaces:**

- Consumes: `DocStack`, `stackOrder`, `stackLabelKey`, `resolveStack` (task 4).
- Produces:
  - `<StackTabs available={DocStack[]} absence={Partial<Record<DocStack,string>>} children>` — client component.
  - `<StackPanel stack={DocStack} children>` — marca um bloco como pertencente a uma stack; renderiza `<div data-stack="…" hidden={…}>`.
  - `const STACK_STORAGE_KEY = 'lyra-docs-stack'`
  - `function readStoredStack(storage: Pick<Storage,'getItem'>, search: string): string | null`

- [ ] **Step 1: Teste a leitura da preferência**

Create `apps/docs/components/stack-tabs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readStoredStack, STACK_STORAGE_KEY } from './stack-tabs';

const storage = (value: string | null) => ({ getItem: () => value });

describe('readStoredStack', () => {
  it('prefere a query string ao valor guardado', () => {
    expect(readStoredStack(storage('react'), '?stack=blade')).toBe('blade');
  });

  it('usa o valor guardado quando não há query', () => {
    expect(readStoredStack(storage('alpine'), '')).toBe('alpine');
  });

  it('devolve null quando não há nem um nem outro', () => {
    expect(readStoredStack(storage(null), '')).toBeNull();
  });

  it('não valida o vocabulário — isso é trabalho de resolveStack', () => {
    expect(readStoredStack(storage(null), '?stack=perl')).toBe('perl');
  });

  it('usa uma chave de storage estável', () => {
    expect(STACK_STORAGE_KEY).toBe('lyra-docs-stack');
  });
});
```

- [ ] **Step 2: Rode e veja falhar**

```bash
pnpm --filter @lyra-ds/docs exec vitest run components/stack-tabs.test.ts
```

Esperado: `Failed to resolve import "./stack-tabs"` — o `include` da task 4 já cobre `components/**`, então a falha é do módulo que ainda não existe, que é a falha certa.

- [ ] **Step 3: Implemente**

Create `apps/docs/components/stack-tabs.tsx`:

```tsx
'use client';

import { SegmentedControl } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { resolveStack, stackLabelKey, stackOrder, type DocStack } from '@/lib/stacks';

export const STACK_STORAGE_KEY = 'lyra-docs-stack';

/**
 * Lê a stack pedida: `?stack=` ganha do valor guardado, porque um link colado carrega
 * intenção explícita e a preferência é só um hábito. Não valida o vocabulário — quem
 * decide o que é válido para *este* componente é `resolveStack`.
 */
export function readStoredStack(storage: Pick<Storage, 'getItem'>, search: string): string | null {
  const fromUrl = new URLSearchParams(search).get('stack');
  return fromUrl ?? storage.getItem(STACK_STORAGE_KEY);
}

export function StackPanel({ stack, children }: { stack: DocStack; children: ReactNode }) {
  return <div data-stack={stack}>{children}</div>;
}

export function StackTabs({
  available,
  absence,
  children,
}: {
  available: DocStack[];
  absence?: Partial<Record<DocStack, string>>;
  children: ReactNode;
}) {
  const t = useTranslations();
  const [active, setActive] = useState<DocStack>(() => resolveStack(available));

  useEffect(() => {
    setActive(
      resolveStack(available, readStoredStack(window.localStorage, window.location.search)),
    );
  }, [available]);

  function choose(stack: DocStack) {
    setActive(stack);
    window.localStorage.setItem(STACK_STORAGE_KEY, stack);

    const url = new URL(window.location.href);
    url.searchParams.set('stack', stack);
    window.history.replaceState(null, '', url);
  }

  return (
    <div className="lw-stack-tabs" data-active-stack={active}>
      <SegmentedControl
        aria-label={t('stackSelector')}
        options={stackOrder
          .filter((stack) => available.includes(stack))
          .map((stack) => ({ value: stack, label: t(stackLabelKey[stack]) }))}
        value={active}
        onChange={(value) => choose(value as DocStack)}
      />
      {stackOrder
        .filter((stack) => !available.includes(stack))
        .map((stack) =>
          absence?.[stack] ? (
            <p className="lw-stack-tabs__absence" key={stack}>
              <strong>{t(stackLabelKey[stack])}:</strong> {t(absence[stack] as string)}
            </p>
          ) : null,
        )}
      {children}
    </div>
  );
}
```

Adicione ao CSS do site (o mesmo arquivo global que já define `lw-prop-table__optional`; localize com `grep -rn "lw-prop-table__optional" apps/docs`):

```css
.lw-stack-tabs [data-stack] {
  display: none;
}

.lw-stack-tabs[data-active-stack='react'] [data-stack='react'],
.lw-stack-tabs[data-active-stack='alpine'] [data-stack='alpine'],
.lw-stack-tabs[data-active-stack='blade'] [data-stack='blade'] {
  display: block;
}

.lw-stack-tabs__absence {
  color: var(--text-muted);
  font: var(--caption-font);
  margin-block: var(--space-2) 0;
}
```

E as mensagens do seletor, em `apps/docs/messages/en.json` (`"stackSelector": "Choose a stack"`) e `pt-BR.json` (`"stackSelector": "Escolha uma stack"`).

- [ ] **Step 4: Rode os testes**

```bash
pnpm --filter @lyra-ds/docs exec vitest run
pnpm --filter @lyra-ds/docs run typecheck
```

Esperado: 5 testes novos verdes, typecheck limpo.

- [ ] **Step 5: Commit**

```bash
pnpm run format
git add apps/docs/components/stack-tabs.tsx apps/docs/components/stack-tabs.test.ts apps/docs/messages
git commit -m "feat(site): seletor de stack com persistência em URL e localStorage"
```

---

### Task 7: `StackApi` e a página piloto (Dropdown)

Um componente só, ponta a ponta, antes de tocar em 74 páginas.

**Files:**

- Create: `apps/docs/components/stack-api.tsx`
- Modify: `apps/docs/components/prop-table.tsx`
- Modify: `apps/docs/components/component-page.tsx`
- Modify: `apps/docs/content/docs/en/components/dropdown.mdx`
- Modify: `apps/docs/content/docs/pt-BR/components/dropdown.mdx`

**Interfaces:**

- Consumes: `StackTabs`, `StackPanel` (task 6); `getComponent` (task 5); `alpine-props.json` (task 3).
- Produces: `<StackApi slug={string} stack={DocStack} name={string} />` — tabela de API da stack pedida. O MDX passa a usar `<StackTabs>`/`<StackPanel>`/`<StackApi>` injetados por `ComponentPage`.

- [ ] **Step 1: Escreva a tabela de API do Alpine**

Create `apps/docs/components/stack-api.tsx`:

```tsx
import { Badge, Table } from '@lyra-ds/react';
import alpineProps from '../../../tools/docgen/output/alpine-props.json';
import type { DocStack } from '@/lib/stacks';
import { PropTable } from './prop-table';

type AlpineBinding = {
  binding: string;
  slug: string;
  optionsType: string;
  description: string;
  props: { name: string; type: string; optional: boolean; description: string }[];
};

/**
 * Tabela de API de uma stack. React vem de props.json (via PropTable, que já existia);
 * Alpine vem de alpine-props.json. Nenhuma das duas é escrita à mão em MDX.
 */
export function StackApi({ slug, stack, name }: { slug: string; stack: DocStack; name: string }) {
  if (stack === 'react') return <PropTable name={name} />;

  if (stack === 'alpine') {
    const binding = (alpineProps as AlpineBinding[]).find((entry) => entry.slug === slug);
    if (!binding) return <p role="alert">No generated Alpine binding found for {slug}.</p>;

    return (
      <>
        <p>
          <code>{`x-data="${binding.binding}({ … })"`}</code>
        </p>
        <Table
          columns={[
            { key: 'name', label: 'Option' },
            { key: 'type', label: 'Type' },
            { key: 'required', label: 'Required' },
            { key: 'description', label: 'Description' },
          ]}
          rows={binding.props.map((prop) => ({
            description: prop.description,
            id: prop.name,
            name: <code>{prop.name}</code>,
            required: prop.optional ? (
              <span className="lw-prop-table__optional">—</span>
            ) : (
              <Badge tone="warning">Required</Badge>
            ),
            type: <code>{prop.type}</code>,
          }))}
        />
      </>
    );
  }

  return <p role="alert">Blade API arrives with the Frente A snapshot.</p>;
}
```

- [ ] **Step 2: Injete os três no MDX**

Em `apps/docs/components/component-page.tsx`, importe e passe adiante. Substitua a linha final `return <MDX components={{ Example, PropTable, pre: Pre }} />;` por:

```tsx
const entry = getComponent(slug);
if (!entry) throw new Error(`Unknown component "${slug}".`);

function Api({ stack }: { stack: DocStack }) {
  return <StackApi slug={slug} stack={stack} name={entry!.name} />;
}

function Tabs({ children }: { children: ReactNode }) {
  return (
    <StackTabs available={entry!.stacks} absence={entry!.absence}>
      {children}
    </StackTabs>
  );
}

return (
  <MDX components={{ Example, StackApi: Api, StackPanel, StackTabs: Tabs, PropTable, pre: Pre }} />
);
```

com os imports correspondentes no topo:

```tsx
import { getComponent } from '@/lib/components';
import type { DocStack } from '@/lib/stacks';
import { StackApi } from './stack-api';
import { StackPanel, StackTabs } from './stack-tabs';
```

- [ ] **Step 3: Converta a página do Dropdown (en)**

Em `apps/docs/content/docs/en/components/dropdown.mdx`, substitua as seções `## Props` e `## Plain HTML` inteiras por:

````mdx
## API and code

<StackTabs>
  <StackPanel stack="react">
    <StackApi stack="react" />

```tsx
<Dropdown
  align="end"
  trigger={<Button variant="secondary">Project actions</Button>}
  items={[
    { type: 'label', label: 'Project' },
    { label: 'Rename project' },
    { type: 'separator' },
    { label: 'Archive project', danger: true },
  ]}
/>
```

  </StackPanel>
  <StackPanel stack="alpine">
    <StackApi stack="alpine" />

```html
<div class="lyra-dropdown" x-data="lyraDropdown({ align: 'end' })">
  <button class="lyra-btn lyra-btn--secondary lyra-btn--md lyra-dropdown__trigger" x-bind="trigger">
    Project actions
  </button>
  <div class="lyra-menu lyra-menu--end" x-bind="menu">
    <span class="lyra-menu__label">Project</span>
    <button class="lyra-menu__item" x-bind="item" type="button">Rename project</button>
    <hr class="lyra-menu__sep" />
    <button class="lyra-menu__item lyra-menu__item--danger" x-bind="item" type="button">
      Archive project
    </button>
  </div>
</div>
```

  </StackPanel>
</StackTabs>
````

O bloco de HTML puro que já existia na página **não some** — ele passa a viver dentro de `<StackPanel stack="alpine">`, sem os atributos `x-*`, logo acima do exemplo com Alpine, precedido de uma frase curta dizendo que a estrutura funciona inerte antes do boot. Confira o markup contra `packages/alpine/src/dropdown.ts` (nomes dos `x-bind`) antes de commitar; um binding inventado aqui é exatamente o tipo de erro que ninguém pega depois.

- [ ] **Step 4: Traduza para pt-BR**

Faça a mesma substituição em `apps/docs/content/docs/pt-BR/components/dropdown.mdx`, com a prosa em português e **os mesmos blocos de código** (código não se traduz).

- [ ] **Step 5: Veja no navegador**

```bash
pnpm --filter @lyra-ds/docs run dev
```

Abra `http://127.0.0.1:3000/en/components/dropdown` e confirme, um a um:

- as duas abas aparecem, React ativa;
- clicar em "HTML + Alpine" troca API e código, e **não** move os exemplos nem a prosa;
- a URL vira `?stack=alpine`;
- recarregar mantém Alpine;
- abrir `/en/components/button` (que não tem Alpine) mostra só React, com a frase de ausência;
- voltar para o Dropdown restaura Alpine, vindo do localStorage.

- [ ] **Step 6: Build e commit**

```bash
pnpm --filter @lyra-ds/docs run build
pnpm run format
git add apps/docs/components apps/docs/content/docs/en/components/dropdown.mdx apps/docs/content/docs/pt-BR/components/dropdown.mdx
git commit -m "feat(site): abas de stack na página de componente, com Dropdown como piloto"
```

---

### Task 8: Converter as páginas restantes

73 componentes × 2 locales. Trabalho mecânico na estrutura, humano na prosa — faça em lotes por grupo do manifesto (`layout`, `action`, `form`, …), um commit por grupo, para que a revisão caiba na cabeça de alguém.

**Files:**

- Modify: `apps/docs/content/docs/{en,pt-BR}/components/*.mdx` (todos menos `dropdown.mdx`)
- Create: `apps/docs/scripts/check-stack-sections.test.mjs`

**Interfaces:**

- Consumes: os componentes MDX da task 7.
- Produces: nenhuma API nova — um teste que impede regressão.

- [ ] **Step 1: Escreva o teste que cobra a conversão**

Create `apps/docs/scripts/check-stack-sections.test.mjs`:

```js
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const LOCALES = ['en', 'pt-BR'];

for (const locale of LOCALES) {
  const dir = join(import.meta.dirname, '..', 'content', 'docs', locale, 'components');

  for (const file of readdirSync(dir).sort()) {
    const source = readFileSync(join(dir, file), 'utf8');

    test(`${locale}/${file} usa StackTabs em vez de PropTable solto`, () => {
      assert.ok(source.includes('<StackTabs>'), 'faltou <StackTabs>');
      assert.ok(
        !/^<PropTable /m.test(source),
        '<PropTable> solto: a API agora vive dentro de um <StackPanel>',
      );
    });

    test(`${locale}/${file} não tem seção Plain HTML órfã`, () => {
      assert.ok(!/^## Plain HTML/m.test(source), 'seção Plain HTML precisa virar StackPanel');
    });
  }
}
```

Registre-o no script `test` de `apps/docs/package.json`, junto dos outros `node --test`.

- [ ] **Step 2: Rode e veja falhar em massa**

```bash
pnpm --filter @lyra-ds/docs exec node --test scripts/check-stack-sections.test.mjs
```

Esperado: ~146 falhas (todas as páginas menos as duas do Dropdown). Esse número é o seu progresso.

- [ ] **Step 3: Converta grupo a grupo**

Para cada componente, seguindo exatamente a forma da task 7:

1. `## Props` + `## Plain HTML` viram `## API and code` com `<StackTabs>`;
2. o HTML que já existia vai para `<StackPanel stack="alpine">` (ou `stack="react"` se o componente não tem Alpine — nesse caso o painel React carrega o HTML puro logo abaixo do exemplo React);
3. se o manifesto declara `alpine`, adicione o exemplo com `x-data` conferido contra `packages/alpine/src/<slug>.ts`;
4. rode `node --test scripts/check-stack-sections.test.mjs` e veja o contador cair.

Commit por grupo:

```bash
pnpm run format
git add apps/docs/content/docs
git commit -m "docs(site): converte o grupo <grupo> para as abas de stack"
```

- [ ] **Step 4: Feche o ciclo**

```bash
pnpm --filter @lyra-ds/docs run test
pnpm --filter @lyra-ds/docs run build
```

Esperado: zero falhas, build limpo.

---

### Task 9: Páginas órfãs

> **Correção 2026-08-12 (como executado):** `form-row` já tinha casa — é documentado
> dentro de `fieldset.mdx`, junto do Fieldset — e não ganhou página própria. Só
> `toast-stack.mdx` nasceu aqui, com HTML + Alpine (binding `lyraToastStack`) além do Blade.

`form-row` e `toast-stack` existem no Blade e não têm página. Elas nascem agora, mesmo antes da aba Blade acender — com React e/ou Alpine quando houver, e a ausência explicada quando não.

**Files:**

- Create: `apps/docs/content/docs/{en,pt-BR}/components/form-row.mdx`
- Create: `apps/docs/content/docs/{en,pt-BR}/components/toast-stack.mdx`
- Modify: `apps/docs/lib/components.ts`
- Modify: `apps/docs/messages/{en,pt-BR}.json`

**Interfaces:**

- Consumes: manifesto (task 5), abas (tasks 6–7).
- Produces: duas entradas novas no manifesto — `{ slug: 'form-row', name: 'FormRow', group: 'form', stacks: [...] }` e `{ slug: 'toast-stack', name: 'ToastStack', group: 'feedback', stacks: [...] }`.

- [ ] **Step 1: Descubra o que cada uma tem de fato**

```bash
grep -l "FormRow\|ToastStack" packages/react/src/*.tsx 2>/dev/null
node -e "console.log(require('./tools/docgen/output/alpine-props.json').filter(b=>['form-row','toast-stack'].includes(b.slug)))"
sed -n 1,40p /home/franciscpd/Projects/lyra-ds/blade/resources/views/components/form-row.blade.php
```

O resultado decide o campo `stacks` de cada entrada. Não chute: se `FormRow` não existir no React nem no Alpine, a página nasce só com a ausência explicada e a aba Blade chega na task 12.

- [ ] **Step 2: Adicione as entradas ao manifesto**

Com as mensagens de ausência correspondentes nos dois `messages/*.json`, no mesmo formato da task 5.

- [ ] **Step 3: Escreva as páginas**

Nos dois locales, seguindo a estrutura de qualquer página existente: frontmatter (`title`, `description`), parágrafo de abertura, `## When to use`, `## Accessibility`, `## API and code` com `<StackTabs>`. Sem `<Example>` — não há exemplo React registrado para elas.

- [ ] **Step 4: Rode tudo**

```bash
pnpm --filter @lyra-ds/docs run test
pnpm --filter @lyra-ds/docs run build
```

Esperado: os testes de manifesto e de seções cobrem as páginas novas automaticamente; o build gera as duas rotas nos dois locales.

- [ ] **Step 5: Commit**

```bash
pnpm run format
git add apps/docs/content/docs apps/docs/lib/components.ts apps/docs/messages
git commit -m "docs(site): páginas de FormRow e ToastStack"
```

---

### Task 10: Guias por stack, matriz de compatibilidade e llms.txt

**Files:**

- Modify: `apps/docs/content/docs/{en,pt-BR}/guides/getting-started.mdx`
- Create: `apps/docs/content/docs/{en,pt-BR}/guides/compatibility.mdx`
- Modify: `apps/docs/lib/guides.ts`
- Modify: `apps/docs/scripts/copy-llms.mjs`
- Modify: `tools/docgen/alpine.mjs`

**Interfaces:**

- Consumes: `StackTabs`/`StackPanel` (task 6) — precisam ser injetados também na página de guia.
- Produces: `apps/docs/public/llms.txt` cobrindo React e Alpine.

- [ ] **Step 1: Injete as abas no guia**

`apps/docs/components/guide-page.tsx` renderiza o MDX dos guias. Adicione `StackTabs` e `StackPanel` ao mapa de componentes como na task 7, com `available={['react','alpine']}` fixo (guia não é componente; não há disponibilidade a consultar).

- [ ] **Step 2: Converta o getting-started**

A seção `## Install` e a seguinte viram três painéis. O de Alpine:

````mdx
  <StackPanel stack="alpine">

```bash
npm i @lyra-ds/styles alpinejs @lyra-ds/alpine
```

```js
import Alpine from 'alpinejs';
import lyra from '@lyra-ds/alpine';

Alpine.plugin(lyra);
Alpine.start();
```

  </StackPanel>
````

- [ ] **Step 3: Escreva a matriz de compatibilidade**

`compatibility.mdx` nos dois locales, com uma tabela cujas linhas saem de fatos verificáveis — versão de cada pacote e as faixas de peer declaradas. Registre a página em `apps/docs/lib/guides.ts` como as outras.

- [ ] **Step 4: llms.txt cobre as duas stacks**

Em `tools/docgen/alpine.mjs`, adicione ao lado do JSON um bloco de texto no formato do `llms.txt` do React (uma seção por binding: nome, descrição, opções). Escreva-o em `tools/docgen/output/alpine-llms.txt`, cubra-o pelo mesmo `--check`, e em `apps/docs/scripts/copy-llms.mjs` concatene os dois arquivos na saída pública.

- [ ] **Step 5: Rode tudo**

```bash
node tools/docgen/alpine.mjs && node tools/docgen/alpine.mjs --check
pnpm --filter @lyra-ds/docs run build
grep -c "lyraDropdown" apps/docs/public/llms.txt
```

Esperado: `--check` OK, build limpo, e o `grep` achando o binding — prova de que o llms.txt publicado deixou de ser só React.

- [ ] **Step 6: Commit**

```bash
pnpm run format
git add apps/docs tools/docgen
git commit -m "docs(site): guias por stack, matriz de compatibilidade e llms.txt das duas stacks"
```

---

### Task 11: Ingestão do snapshot do Blade

> **Bloqueada pela Frente A.** Só comece quando `lyra-ds/blade` publicar `docs/api.json` com o formato declarado na spec (§5).

**Files:**

- Create: `tools/blade-api/api.json` (copiado da release)
- Create: `tools/blade-api/check.mjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `docs/api.json` da release do `lyra-ds/blade`.
- Produces: `tools/blade-api/api.json` com campo `version`; `node tools/blade-api/check.mjs` falha se o arquivo não casar com o schema esperado ou se um slug declarado `blade` no manifesto não existir nele.

- [ ] **Step 1: Traga o artefato**

```bash
mkdir -p tools/blade-api
gh release download --repo lyra-ds/blade --pattern api.json --output tools/blade-api/api.json
node -e "const a=require('./tools/blade-api/api.json'); console.log(a.version, a.components.length)"
```

Esperado: a versão publicada e 72 componentes.

- [ ] **Step 2: Escreva o validador**

`tools/blade-api/check.mjs` verifica, e falha com mensagem nomeando o item ofensor: (a) `version` presente e no formato semver; (b) todo componente tem `slug`, `usage` e `props`; (c) todo slug com `blade` no manifesto existe no arquivo; (d) todo componente do arquivo tem página no site **ou** está numa lista explícita de exceções no topo do próprio validador.

- [ ] **Step 3: Ligue no CI**

Em `.github/workflows/ci.yml`, junto das outras verificações de artefato:

```yaml
- run: node tools/blade-api/check.mjs
```

- [ ] **Step 4: Commit**

```bash
pnpm run format
git add tools/blade-api .github/workflows/ci.yml
git commit -m "feat(site): ingestão validada do snapshot de API do pacote Blade"
```

---

### Task 12: A terceira aba acende

> **Depende da task 11.**

**Files:**

- Modify: `apps/docs/components/stack-api.tsx`
- Modify: `apps/docs/lib/components.ts`
- Modify: `apps/docs/content/docs/{en,pt-BR}/components/*.mdx`
- Modify: `apps/docs/messages/{en,pt-BR}.json`

- [ ] **Step 1: Renderize a API do Blade**

Em `stack-api.tsx`, troque o `return <p role="alert">Blade API arrives…</p>` por uma tabela lida de `tools/blade-api/api.json`, no mesmo formato das outras duas, seguida do `usage` do arquivo em bloco de código e — quando o componente tiver binding Alpine — da linha de herança: _"O comportamento vem de `lyraDropdown()`"_, com link para a aba irmã. Use uma chave de mensagem nova (`bladeInheritsAlpine`), não texto literal.

- [ ] **Step 2: Declare `blade` no manifesto**

Nos 72 componentes que o `api.json` cobre, acrescente `'blade'` a `stacks` e remova a ausência `absenceBladePending`. O teste da task 5 (`explica toda stack ausente`) cobre quem sobrar.

- [ ] **Step 3: Adicione o painel Blade nas páginas**

Um `<StackPanel stack="blade"><StackApi stack="blade" /></StackPanel>` por página. O código vem do artefato, então não há snippet a escrever à mão.

- [ ] **Step 4: Rode tudo e confira no navegador**

```bash
pnpm --filter @lyra-ds/docs run test
pnpm --filter @lyra-ds/docs run build
pnpm --filter @lyra-ds/docs run dev
```

Confirme em `/en/components/dropdown?stack=blade`: três abas, a tag Blade, a tabela de props, a linha de herança apontando `lyraDropdown`, e a versão do pacote visível.

- [ ] **Step 5: Commit**

```bash
pnpm run format
git add apps/docs
git commit -m "feat(site): acende a aba Blade nas páginas de componente"
```

---

## Notas de execução

- **Ordem obrigatória:** 1 → 2 → 3 → 4 → 5 → 6 → 7. As tasks 8, 9 e 10 podem correr em paralelo depois da 7. As 11 e 12 esperam a Frente A.
- **A task 8 é a única longa.** Se for delegada, delegue por grupo do manifesto, um agente por grupo, com a página do Dropdown como referência no brief.
- **Nunca invente um `x-bind`.** Todo markup Alpine em MDX tem que ser conferido contra `packages/alpine/src/<slug>.ts`. Um binding inventado passa no build, passa no teste, e só falha na cara do leitor.
