/**
 * Valida o snapshot de API do Blade (`tools/blade-api/api.json`) contra o site.
 *
 * O arquivo é copiado da release do `lyra-ds/blade` (asset `api.json`), nunca editado à
 * mão. Este check falha nomeando o item ofensor quando:
 *  (a) `version` falta ou não é semver;
 *  (b) algum componente vem sem `slug`, `usage` ou `props`;
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

for (const [index, component] of (api.components ?? []).entries()) {
  const label = component?.slug ? `'${component.slug}'` : `components[${index}]`;

  for (const field of ['slug', 'usage', 'props']) {
    if (component?.[field] == null) failures.push(`${label} veio sem o campo '${field}'`);
  }

  if (component?.slug) apiSlugs.add(component.slug);
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
