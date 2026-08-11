#!/usr/bin/env node
/**
 * Gera o catálogo de bindings do @lyra-ds/alpine a partir do pacote publicado. Espelha
 * tools/docgen/generate.mjs: mesma fonte (o dist, que é o contrato), mesmo modo --check,
 * mesmo artefato commitado.
 *
 * Quais bindings existem sai das chamadas `Alpine.data()` no dist/index.js, não das
 * interfaces `Lyra*Options` do dist/index.d.ts. A diferença não é cosmética: derivar das
 * interfaces inventa `lyraToast` (LyraToastOptions descreve um toast, não as opções de um
 * binding) e perde `lyraCodeBlock` (não tem opções) e `lyraToastStack` (sua interface se
 * chama LyraToastStackData). O registro é a lista de verdade; a interface, quando existe,
 * apenas descreve as opções daquele registro.
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
const DIST_JS = join(REPO, 'packages', 'alpine', 'dist', 'index.js');
const DATA_REGISTRATION = /\.data\(\s*['"]([A-Za-z]+)['"]/g;
const STORE_REGISTRATION = /\.store\(\s*['"]([A-Za-z]+)['"]/g;
const OUTPUT = join(REPO, 'tools', 'docgen', 'output');
const PROPS_FILE = join(OUTPUT, 'alpine-props.json');
const LLMS_FILE = join(OUTPUT, 'alpine-llms.txt');

// Bindings cujo slug no site não é a forma kebab do nome.
const SLUG_OVERRIDES = new Map();

/**
 * Os dois stores globais do plugin. Ao contrário dos bindings, o nome do store não deriva
 * do nome da interface (`theme` → `LyraThemeStore`), então o par fica declarado aqui — e a
 * geração falha se algum deles sumir do dist, em vez de silenciosamente documentar menos.
 */
const STORES = new Map([
  ['theme', { slug: 'theme-provider', type: 'LyraThemeStore' }],
  ['lyraToasts', { slug: 'toast', type: 'LyraToastsStore' }],
]);

function kebab(binding) {
  return binding
    .replace(/^lyra/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function registered(pattern, kind) {
  const names = new Set();

  for (const [, name] of readFileSync(DIST_JS, 'utf8').matchAll(pattern)) names.add(name);

  if (names.size === 0) {
    throw new Error(`Nenhum registro de ${kind} encontrado no dist — o pacote foi buildado?`);
  }

  return [...names];
}

function optionsInterfaces() {
  const source = ts.createSourceFile(DTS, readFileSync(DTS, 'utf8'), ts.ScriptTarget.Latest, true);
  const interfaces = new Map();

  source.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, { node, source });
  });

  return interfaces;
}

function entryFor(interfaces, { binding, kind, slug, optionsType }) {
  const declaration = optionsType ? interfaces.get(optionsType) : undefined;

  if (optionsType && !declaration) {
    throw new Error(`${optionsType} não está nas declarações publicadas de @lyra-ds/alpine.`);
  }

  return {
    binding,
    kind,
    slug,
    optionsType: declaration ? optionsType : null,
    description: declaration
      ? descriptionFromJSDoc(rawJSDoc(declaration.node, declaration.source))
      : '',
    props: declaration
      ? membersFromInterface(declaration.node, declaration.source).map(
          ({ jsDoc: _jsDoc, ...prop }) => prop,
        )
      : [],
  };
}

function extractBindings() {
  const interfaces = optionsInterfaces();

  const bindings = registered(DATA_REGISTRATION, 'Alpine.data()').map((binding) => {
    const optionsType = `Lyra${binding.slice('lyra'.length)}Options`;

    return entryFor(interfaces, {
      binding,
      kind: 'data',
      slug: SLUG_OVERRIDES.get(binding) ?? kebab(binding),
      optionsType: interfaces.has(optionsType) ? optionsType : null,
    });
  });

  const stores = registered(STORE_REGISTRATION, 'Alpine.store()').map((name) => {
    const store = STORES.get(name);

    if (!store) {
      throw new Error(`Store "${name}" registrado no dist e ausente do mapa STORES.`);
    }

    return entryFor(interfaces, {
      binding: `$store.${name}`,
      kind: 'store',
      slug: store.slug,
      optionsType: store.type,
    });
  });

  return [...bindings, ...stores].sort((a, b) => a.slug.localeCompare(b.slug));
}

function renderProps(bindings) {
  return JSON.stringify(bindings, null, 2) + '\n';
}

/**
 * Bloco do Alpine para o llms.txt publicado. Mesmo formato do bloco do React: cada entrada
 * declara como se monta e o que aceita, para que um agente escreva markup válido sem ter
 * lido o pacote.
 */
function renderLlms(bindings) {
  const section = (entry) => {
    const head =
      entry.kind === 'store'
        ? `Global store, read as \`${entry.binding}\`.`
        : `Mount with \`x-data="${entry.binding}({ … })"\`.`;
    const options =
      entry.props.length === 0
        ? 'Takes no options.'
        : entry.props
            .map(
              (prop) =>
                `- \`${prop.name}${prop.optional ? '?' : ''}: ${prop.type}\`${prop.description ? ` — ${prop.description.split('\n')[0]}` : ''}`,
            )
            .join('\n');

    return [
      `### ${entry.binding}`,
      '',
      `Documented as \`${entry.slug}\`. ${head}`,
      '',
      options,
    ].join('\n');
  };

  return [
    '## Alpine bindings and stores (@lyra-ds/alpine)',
    '',
    'One `Alpine.data()` per interactive component, plus two global stores. The plugin ships no',
    'CSS: markup uses the same `.lyra-*` classes as every other stack, and the binding only adds',
    'behavior. Never invent a binding name or an option — this list is the whole surface.',
    '',
    ...bindings.map(section),
    '',
  ].join('\n');
}

function main() {
  const mode = process.argv[2];
  if (mode && mode !== '--check') {
    throw new Error(`Argumento desconhecido ${mode}. Use sem argumento ou --check.`);
  }

  const bindings = extractBindings();
  const artifacts = [
    [PROPS_FILE, renderProps(bindings)],
    [LLMS_FILE, renderLlms(bindings)],
  ];

  if (mode === '--check') {
    for (const [file, expected] of artifacts) {
      const name = file.slice(REPO.length + 1);

      if (!existsSync(file)) {
        throw new Error(`${name} ausente — rode \`pnpm run docgen:alpine\`.`);
      }
      if (readFileSync(file, 'utf8') !== expected) {
        throw new Error(
          `${name} difere de uma geração fresca. Rode \`pnpm run docgen:alpine\` e commite.`,
        );
      }
    }

    console.log('docgen:alpine --check OK: os dois artefatos gerados batem.');
    return;
  }

  mkdirSync(OUTPUT, { recursive: true });
  for (const [file, contents] of artifacts) writeFileSync(file, contents, 'utf8');
  console.log(
    `docgen:alpine: escreveu alpine-props.json e alpine-llms.txt (${bindings.length} entradas).`,
  );
}

try {
  main();
} catch (error) {
  console.error(`docgen:alpine FAILED: ${error.message}`);
  process.exit(1);
}
