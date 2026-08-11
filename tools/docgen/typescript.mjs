/**
 * Leitura de declarações TypeScript compartilhada pelos geradores do docgen.
 * Sem estado e sem I/O: recebe nós do compilador e devolve dados. Quem lê arquivo
 * e renderiza artefato é cada gerador (generate.mjs para React, alpine.mjs para Alpine).
 */
import ts from 'typescript';

export function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

export function pascalFromKebab(value) {
  return value.replace(/(^|-)([a-z])/g, (_, _separator, letter) => letter.toUpperCase());
}

export function rawJSDoc(node, sourceFile) {
  const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
  return docs.at(-1)?.getText(sourceFile).trim() ?? '';
}

export function descriptionFromJSDoc(doc) {
  if (!doc) return '';

  return doc
    .replace(/^\/\*\*\s?/, '')
    .replace(/\s?\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim();
}

export function renderJSDoc(doc, indent = '') {
  if (!doc) return '';
  return doc
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      return `${indent}${trimmed.startsWith('*') && trimmed !== '*/' ? ' ' : ''}${trimmed}`;
    })
    .join('\n');
}

export function membersFromInterface(interfaceNode, sourceFile) {
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

export function membersFromTypeNode(typeNode, sourceFile, declarations, seen = new Set()) {
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeNode.members.map((member) => {
      if (!ts.isPropertySignature(member) || !member.type) {
        throw new Error('Unsupported props type member: expected a typed property signature.');
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

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return membersFromTypeNode(typeNode.type, sourceFile, declarations, seen);
  }

  if (ts.isIntersectionTypeNode(typeNode) || ts.isUnionTypeNode(typeNode)) {
    return typeNode.types.flatMap((type) =>
      membersFromTypeNode(type, sourceFile, declarations, seen),
    );
  }

  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    const name = typeNode.typeName.text;
    if (seen.has(name)) return [];
    const declaration = declarations.get(name);
    if (!declaration) return [];

    const nested = new Set(seen).add(name);
    return membersFromTypeNode(declaration.type, sourceFile, declarations, nested);
  }

  return [];
}

export function membersFromTypeAlias(alias, sourceFile, declarations) {
  const grouped = new Map();
  for (const member of membersFromTypeNode(alias.type, sourceFile, declarations)) {
    const existing = grouped.get(member.name);
    if (existing) existing.push(member);
    else grouped.set(member.name, [member]);
  }

  return [...grouped.values()].map((members) => {
    const types = [...new Set(members.map((member) => member.type))];
    const descriptions = [...new Set(members.map((member) => member.description).filter(Boolean))];
    const docs = [...new Set(members.map((member) => member.jsDoc).filter(Boolean))];
    return {
      name: members[0].name,
      type: types.join(' | '),
      optional: members.some((member) => member.optional),
      description: descriptions.join('\n\n'),
      jsDoc: docs.join('\n'),
    };
  });
}
