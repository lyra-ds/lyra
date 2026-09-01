const LICENSE_IDS = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSL-1.0',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'MIT-0',
  'Python-2.0',
  'Unlicense',
  'Zlib',
]);

const EXCEPTION_IDS = new Set(['LLVM-exception']);
const OPERATORS = new Set(['AND', 'OR', 'WITH']);

function parseExpression(tokens) {
  let index = 0;

  const peek = () => tokens[index];
  const take = () => tokens[index++];
  const fail = (message) => {
    throw new Error(message);
  };

  function parsePrimary() {
    const token = take();
    if (token === undefined) fail('SPDX license expression is missing an operand');
    if (token === '(') {
      const expression = parseOr();
      if (take() !== ')') fail('SPDX license expression has unbalanced parentheses');
      return { kind: 'group', expression };
    }
    if (token === ')' || OPERATORS.has(token)) {
      fail(`SPDX license expression has an unexpected token: ${token}`);
    }
    if (!LICENSE_IDS.has(token)) fail(`SPDX license ID is not approved: ${token}`);
    return { kind: 'license', value: token };
  }

  function parseWith() {
    const left = parsePrimary();
    if (peek() !== 'WITH') return left;
    take();
    if (left.kind !== 'license') {
      fail('SPDX WITH must apply directly to one license ID');
    }
    const exception = take();
    if (!EXCEPTION_IDS.has(exception)) {
      fail(`SPDX license exception is not approved: ${exception ?? '<missing>'}`);
    }
    return { exception, kind: 'with', license: left };
  }

  function parseAnd() {
    let left = parseWith();
    while (peek() === 'AND') {
      take();
      left = { kind: 'and', left, right: parseWith() };
    }
    return left;
  }

  function parseOr() {
    let left = parseAnd();
    while (peek() === 'OR') {
      take();
      left = { kind: 'or', left, right: parseAnd() };
    }
    return left;
  }

  const result = parseOr();
  if (index !== tokens.length) {
    fail(`SPDX license expression has a trailing token: ${peek()}`);
  }
  return result;
}

export function validateSpdxExpression(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return ['SPDX license expression must be a non-empty string'];
  }
  const tokens = value.match(/\(|\)|[^\s()]+/gu) ?? [];
  try {
    parseExpression(tokens);
    return [];
  } catch (error) {
    return [error.message];
  }
}
