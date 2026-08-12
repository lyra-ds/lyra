/**
 * Valida o snapshot de API do Blade (`tools/blade-api/api.json`) contra o site.
 *
 * O arquivo é copiado da release do `lyra-ds/blade` (asset `api.json`), nunca editado à
 * mão. Este check falha nomeando o item ofensor quando:
 *  (a) `version` falta ou não é semver;
 *  (b) algum componente tem `slug`/`usage` vazios, `props` que não é array, prop com
 *      forma errada, ou um slug repetido;
 *  (c) um slug declarado `blade` no manifesto do site não existe no snapshot — a aba
 *      apontaria para uma API que não há;
 *  (d) um componente do snapshot não tem página no site nem consta das exceções abaixo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/** Componentes do snapshot sem página própria — cada um com o porquê documentado. */
const PAGE_EXCEPTIONS = new Map([
  ['form-row', 'documentado dentro de fieldset.mdx, junto do Fieldset'],
]);

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const failures = [];

const api = JSON.parse(readFileSync(resolve(root, 'tools/blade-api/api.json'), 'utf8'));

if (typeof api.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(api.version)) {
  failures.push(`version ausente ou fora do semver: ${JSON.stringify(api.version)}`);
}

if (!Array.isArray(api.components) || api.components.length === 0) {
  failures.push('components ausente ou vazio');
}

const apiSlugs = new Set();

/**
 * Campo presente não é campo válido: `props: {}` passaria por um teste de nulidade e só
 * quebraria depois, no `.map()` do gerador e do site. O snapshot vem de outro repositório
 * — este check é a fronteira, então valida forma, não só presença.
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

for (const [index, component] of (api.components ?? []).entries()) {
  const label = isNonEmptyString(component?.slug) ? `'${component.slug}'` : `components[${index}]`;

  if (!isNonEmptyString(component?.slug)) failures.push(`${label} tem 'slug' vazio ou não-string`);
  if (!isNonEmptyString(component?.usage))
    failures.push(`${label} tem 'usage' vazio ou não-string`);

  if (!Array.isArray(component?.props)) {
    failures.push(`${label} tem 'props' que não é array`);
  } else {
    for (const [position, prop] of component.props.entries()) {
      const where = `${label}, prop[${position}]`;

      if (!isNonEmptyString(prop?.name)) failures.push(`${where} tem 'name' vazio ou não-string`);
      if (typeof prop?.required !== 'boolean')
        failures.push(`${where} tem 'required' não-booleano`);
      if (!Array.isArray(prop?.values)) failures.push(`${where} tem 'values' que não é array`);
    }
  }

  if (isNonEmptyString(component?.slug)) {
    if (apiSlugs.has(component.slug)) failures.push(`${label} aparece duas vezes no snapshot`);
    apiSlugs.add(component.slug);
  }
}

/**
 * O manifesto é TypeScript; ler pelo compilador (já devDep do docgen) em vez de regex
 * mantém o check imune a reformatação.
 */
function manifestEntries() {
  const path = resolve(root, 'apps/docs/lib/components.ts');
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const entries = [];

  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (declaration.name.getText(source) !== 'manifest') continue;
      if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer))
        continue;

      for (const element of declaration.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue;
        const entry = { slug: null, stacks: [] };

        for (const property of element.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const key = property.name.getText(source);

          if (key === 'slug' && ts.isStringLiteral(property.initializer)) {
            entry.slug = property.initializer.text;
          }
          if (key === 'stacks' && ts.isArrayLiteralExpression(property.initializer)) {
            entry.stacks = property.initializer.elements
              .filter(ts.isStringLiteral)
              .map((stack) => stack.text);
          }
        }

        if (entry.slug) entries.push(entry);
      }
    }
  });

  if (entries.length === 0)
    failures.push('não achei o array `manifest` em apps/docs/lib/components.ts');

  return entries;
}

const manifest = manifestEntries();

for (const entry of manifest) {
  if (entry.stacks.includes('blade') && !apiSlugs.has(entry.slug)) {
    failures.push(`'${entry.slug}' declara a stack blade no manifesto, mas não existe no api.json`);
  }
}

const pageDir = resolve(root, 'apps/docs/content/docs/en/components');

for (const slug of apiSlugs) {
  if (existsSync(resolve(pageDir, `${slug}.mdx`))) continue;
  if (PAGE_EXCEPTIONS.has(slug)) continue;
  failures.push(`'${slug}' está no api.json mas não tem página no site nem exceção declarada`);
}

if (failures.length > 0) {
  console.error('blade-api FALHOU:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `blade-api OK: v${api.version}, ${apiSlugs.size} componentes, ` +
    `${manifest.filter((entry) => entry.stacks.includes('blade')).length} slugs blade no manifesto, ` +
    `${PAGE_EXCEPTIONS.size} exceção de página.`,
);
