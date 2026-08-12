/**
 * Gera `tools/docgen/output/blade-llms.txt` a partir do snapshot `tools/blade-api/api.json`
 * (copiado da release do `lyra-ds/blade` — o contrato publicado do pacote PHP).
 *
 * Mesmo desenho de tools/docgen/alpine.mjs: fonte é artefato do pacote, modo `--check`
 * falha no CI se o texto commitado divergir de uma geração fresca. O bloco entra no
 * `llms.txt` público via apps/docs/scripts/copy-llms.mjs.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API_FILE = resolve(REPO, 'tools', 'blade-api', 'api.json');
const OUTPUT = resolve(REPO, 'tools', 'docgen', 'output');
const LLMS_FILE = resolve(OUTPUT, 'blade-llms.txt');

/**
 * `values` é `observedValues` no gerador do pacote PHP: os valores distintos que as
 * fixtures passam naquela prop, não o enum aceito. `hint` do checkbox-group prova a
 * diferença — traz `"Choose one"`, e o próprio usage passa outro texto. Documentar isso
 * como "one of" inventaria uma restrição que não existe, então a redação é ilustrativa.
 */
function renderProp(prop) {
  const details = [];
  if (prop.required) details.push('required');
  if (prop.default != null) details.push(`default \`${prop.default}\``);
  if (prop.values.length)
    details.push(`example values ${prop.values.map((value) => `\`${value}\``).join(', ')}`);

  return `- \`${prop.name}\`${details.length ? ` — ${details.join(', ')}` : ''}`;
}

function renderComponent(component) {
  const heading = `### <lyra:${component.slug}>`;
  const behavior = component.binding
    ? `Behavior comes from the \`${component.binding}()\` Alpine binding (\`@lyra-ds/alpine\`); the tag serves the HTML it animates.`
    : 'Static component: no Alpine binding, the markup is the whole contract.';
  const props = component.props.length
    ? component.props.map(renderProp).join('\n')
    : '_No props — drop the tag in._';

  return [heading, '', behavior, '', props, '', '```blade', component.usage, '```'].join('\n');
}

function renderLlms(api) {
  return [
    `## Blade components (lyra-ds/blade v${api.version})`,
    '',
    'One `<lyra:*>` tag per component, rendered server-side by Laravel. Every tag emits the',
    'same `.lyra-*` classes as the other stacks; interactive ones serve the HTML that an',
    'Alpine binding animates. Never invent a tag or a prop — this list is the whole surface.',
    '',
    ...api.components.map(renderComponent),
    '',
  ].join('\n');
}

function main() {
  const mode = process.argv[2];
  if (mode && mode !== '--check') {
    throw new Error(`Argumento desconhecido ${mode}. Use sem argumento ou --check.`);
  }

  const api = JSON.parse(readFileSync(API_FILE, 'utf8'));
  const expected = renderLlms(api);

  if (mode === '--check') {
    const name = LLMS_FILE.slice(REPO.length + 1);

    if (!existsSync(LLMS_FILE)) {
      throw new Error(`${name} ausente — rode \`pnpm run docgen:blade\`.`);
    }
    if (readFileSync(LLMS_FILE, 'utf8') !== expected) {
      throw new Error(
        `${name} difere de uma geração fresca. Rode \`pnpm run docgen:blade\` e commite.`,
      );
    }

    console.log('docgen:blade --check OK: o artefato gerado bate.');
    return;
  }

  mkdirSync(OUTPUT, { recursive: true });
  writeFileSync(LLMS_FILE, expected, 'utf8');
  console.log(`docgen:blade: escreveu blade-llms.txt (${api.components.length} componentes).`);
}

main();
