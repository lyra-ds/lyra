#!/usr/bin/env node
/**
 * Generate the checked-in LLM API reference and machine-readable props catalog from
 * @lyra-ds/react's built declarations. The declarations are the published contract;
 * handoff/components supplies only each component's documentation category.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const DIST = join(REPO, 'packages', 'react', 'dist');
const HANDOFF_COMPONENTS = join(REPO, 'handoff', 'components');
const OUTPUT = join(__dirname, 'output');
const LLMS_FILE = join(OUTPUT, 'llms.txt');
const PROPS_FILE = join(OUTPUT, 'props.json');

const CATEGORY_ORDER = [
  'Buttons',
  'Data',
  'Display',
  'Feedback',
  'Files',
  'Forms',
  'Icons',
  'Layout',
  'Navigation',
];

// This curated guidance is deliberately independent from component declarations.
// It is the English translation of handoff/llms.txt through the API heading — the file
// ships in English only, matching the canonical-English-JSDoc rule. Content stays
// faithful to the handoff; only the prose language differs.
const TEMPLATE_HEADER = `# Lyra Design System — llms.txt

> Lyra is an open source, CSS-first, white-label design system. A pure CSS core
> (custom properties + \`.lyra-*\` classes) with thin React wrappers on top.
> This file is the canonical reference for agents/LLMs generating UI with Lyra.

## Rules for generating Lyra code

1. NEVER hardcode a color, radius, shadow, font or spacing value — always use semantic tokens.
2. Components consume ONLY the semantic layer (\`--accent\`, \`--surface-card\`, \`--text-muted\`…),
   never the primitives (\`--indigo-600\`, \`--slate-200\`).
3. Dark mode: automatic via \`[data-theme="dark"]\` on \`<html>\` — do not write manual dark styles.
4. White-label: brands define \`--brand\`, \`--brand-contrast\`, \`--brand-radius\`, \`--brand-font\`
   under \`[data-brand="x"]\` (see tokens/brand.css); the whole accent group is derived via color-mix.
5. In plain HTML use the classes: \`.lyra-btn .lyra-btn--{primary|secondary|soft|ghost|danger} .lyra-btn--{sm|md|lg}\`.
   In React use the components below — they emit the classes for you.
6. Focus: \`box-shadow: var(--shadow-focus)\` on \`:focus-visible\`; never a custom \`outline\`.
7. shadcn interop: import \`tokens/compat-shadcn.css\` AFTER styles.css (--background, --primary, --ring… are mapped).

## Semantic tokens (the layer you use)

Colors: --accent, --accent-hover, --accent-active, --accent-soft, --accent-soft-text, --on-accent, --focus-ring, --surface-page, --surface-card, --surface-raised, --surface-sunken, --surface-overlay, --text-primary, --text-secondary, --text-muted, --text-faint, --text-inverse, --text-link, --border-default, --border-strong, --border-accent, --success, --success-soft, --success-text, --warning, --warning-soft, --warning-text, --danger, --danger-soft, --danger-text, --info, --info-soft, --info-text

Spacing/radius/controls:
--space-0, --space-1, --space-2, --space-3, --space-4, --space-5, --space-6, --space-8, --space-10, --space-12, --space-16, --space-20, --space-24, --radius-xs, --radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-full, --control-sm, --control-md, --control-lg, --container-max, --sidebar-width, --content-gutter

Typography: families --font-{sans,display,mono}; weights --weight-{regular..extrabold};
sizes --text-{xs..6xl} (UI default 14px = --text-base);
composed styles for the \`font\` shorthand: --display-font, --h1-font, --h2-font, --h3-font, --body-font, --body-strong-font, --caption-font, --overline-font, --code-font

Effects: --shadow-{xs,sm,md,lg,focus}; --duration-{fast,base,slow}; --ease-{out,in-out};
z-index --z-{dropdown,sticky,overlay,dialog,toast,tooltip}.
`;

function read(file) {
  return readFileSync(file, 'utf8');
}

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function pascalFromKebab(value) {
  return value.replace(/(^|-)([a-z])/g, (_, _separator, letter) => letter.toUpperCase());
}

function rawJSDoc(node, sourceFile) {
  const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
  return docs.at(-1)?.getText(sourceFile).trim() ?? '';
}

function descriptionFromJSDoc(doc) {
  if (!doc) return '';

  return doc
    .replace(/^\/\*\*\s?/, '')
    .replace(/\s?\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim();
}

function renderJSDoc(doc, indent = '') {
  if (!doc) return '';
  return doc
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      return `${indent}${trimmed.startsWith('*') && trimmed !== '*/' ? ' ' : ''}${trimmed}`;
    })
    .join('\n');
}

function collectCategoryMap() {
  const categoryByName = new Map();

  for (const entry of readdirSync(HANDOFF_COMPONENTS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const category = titleCase(entry.name);
    for (const file of readdirSync(join(HANDOFF_COMPONENTS, entry.name)).sort()) {
      if (!file.endsWith('.d.ts')) continue;
      categoryByName.set(file.slice(0, -'.d.ts'.length), category);
    }
  }

  return categoryByName;
}

function exportedNames(sourceFile) {
  const names = new Set();

  for (const statement of sourceFile.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const specifier of statement.exportClause.elements) names.add(specifier.name.text);
    }

    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isVariableStatement(statement) ||
        ts.isInterfaceDeclaration(statement)) &&
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if ('name' in statement && statement.name) names.add(statement.name.text);
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
        }
      }
    }
  }

  return names;
}

function membersFromInterface(interfaceNode, sourceFile) {
  return interfaceNode.members.map((member) => {
    if (!ts.isPropertySignature(member) || !member.type) {
      throw new Error(
        `Unsupported member in ${interfaceNode.name.text}: expected a typed property signature.`,
      );
    }

    return {
      name: member.name.getText(sourceFile),
      type: member.type.getText(sourceFile),
      optional: Boolean(member.questionToken),
      description: descriptionFromJSDoc(rawJSDoc(member, sourceFile)),
      jsDoc: rawJSDoc(member, sourceFile),
    };
  });
}

function extractComponents() {
  const categoryByName = collectCategoryMap();
  const components = [];

  for (const file of readdirSync(DIST).sort()) {
    if (!file.endsWith('.d.ts') || file === 'index.d.ts') continue;

    const sourceFile = ts.createSourceFile(
      file,
      read(join(DIST, file)),
      ts.ScriptTarget.Latest,
      true,
    );
    const exported = exportedNames(sourceFile);
    const ownerName = pascalFromKebab(file.slice(0, -'.d.ts'.length));
    const ownerCategory = categoryByName.get(ownerName);

    for (const statement of sourceFile.statements) {
      if (!ts.isInterfaceDeclaration(statement)) continue;
      const propsName = statement.name.text;
      if (!propsName.endsWith('Props') || !exported.has(propsName)) continue;

      const name = propsName.slice(0, -'Props'.length);
      if (!exported.has(name)) {
        throw new Error(`${file}: ${propsName} is exported, but ${name} is not.`);
      }

      const category = categoryByName.get(name) ?? ownerCategory;
      if (!category || !CATEGORY_ORDER.includes(category)) {
        throw new Error(`${file}: no handoff category for ${name}.`);
      }

      const extensions = (statement.heritageClauses ?? [])
        .filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
        .flatMap((clause) => clause.types.map((type) => type.getText(sourceFile)));

      components.push({
        name,
        category,
        extends: extensions.join(', '),
        description: descriptionFromJSDoc(rawJSDoc(statement, sourceFile)),
        jsDoc: rawJSDoc(statement, sourceFile),
        signature: `export declare function ${name}(props: ${propsName}): JSX.Element;`,
        propsName,
        props: membersFromInterface(statement, sourceFile),
      });
    }
  }

  components.sort(
    (left, right) =>
      CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category) ||
      left.name.localeCompare(right.name),
  );

  // Counts exported `*Props` INTERFACES in the dist, not component directories and not exports-map
  // subpaths — the three differ. `src/stack/` alone contributes two (Stack and Inline), which is why
  // the four layout wrappers moved this from 40 to 45. The guard's job is catching a stale or partial
  // dist (which yields FEWER), so it is maintained by hand: bump it in the same commit that adds a
  // component, and the mismatch message tells you the number it actually found.
  const EXPECTED_COMPONENTS = 45;
  if (components.length !== EXPECTED_COMPONENTS) {
    throw new Error(
      `Expected exactly ${EXPECTED_COMPONENTS} exported component Props interfaces from packages/react/dist; extracted ${components.length}. Rebuild @lyra-ds/react or fix the declaration exports.`,
    );
  }

  return components;
}

function renderComponent(component) {
  const extendsClause = component.extends ? ` extends ${component.extends}` : '';
  const lines = [];

  if (component.jsDoc) lines.push(renderJSDoc(component.jsDoc));
  lines.push(`export interface ${component.propsName}${extendsClause} {`);
  for (const prop of component.props) {
    if (prop.jsDoc) lines.push(renderJSDoc(prop.jsDoc, '  '));
    lines.push(`  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`);
  }
  lines.push('}');
  lines.push(component.signature);

  return `### ${component.name}\n\`\`\`ts\n${lines.join('\n')}\n\`\`\``;
}

function renderLlms(components) {
  const categories = CATEGORY_ORDER.map((category) => {
    const entries = components.filter((component) => component.category === category);
    return entries.length ? `## ${category}\n\n${entries.map(renderComponent).join('\n\n')}` : '';
  }).filter(Boolean);

  return (
    [TEMPLATE_HEADER.trimEnd(), '## React component API (@lyra-ds/react)', ...categories].join(
      '\n\n',
    ) + '\n'
  );
}

function renderPropsJson(components) {
  return (
    JSON.stringify(
      components.map(({ jsDoc, propsName, props, ...component }) => ({
        ...component,
        props: props.map(({ jsDoc: _jsDoc, ...prop }) => prop),
      })),
      null,
      2,
    ) + '\n'
  );
}

function generate() {
  const components = extractComponents();
  return {
    llms: renderLlms(components),
    props: renderPropsJson(components),
    componentCount: components.length,
  };
}

function checkFile(file, expected) {
  if (!existsSync(file)) {
    throw new Error(
      `Generated output missing: ${file.slice(REPO.length + 1)} — run \`pnpm run docgen\`.`,
    );
  }
  if (read(file) !== expected) {
    throw new Error(
      `Generated output drift: ${file.slice(REPO.length + 1)} differs from a fresh generation. Run \`pnpm run docgen\` and commit the result.`,
    );
  }
}

function main() {
  const mode = process.argv[2];
  if (mode && mode !== '--check') {
    throw new Error(`Unknown argument ${mode}. Use no argument or --check.`);
  }

  const generated = generate();
  if (mode === '--check') {
    checkFile(LLMS_FILE, generated.llms);
    checkFile(PROPS_FILE, generated.props);
    console.log(
      `docgen --check OK: both generated artifacts match (${generated.componentCount} components).`,
    );
    return;
  }

  mkdirSync(OUTPUT, { recursive: true });
  writeFileSync(LLMS_FILE, generated.llms, 'utf8');
  writeFileSync(PROPS_FILE, generated.props, 'utf8');
  console.log(
    `docgen: wrote tools/docgen/output/{llms.txt, props.json} (${generated.componentCount} components).`,
  );
}

try {
  main();
} catch (error) {
  console.error(`docgen FAILED: ${error.message}`);
  process.exit(1);
}
