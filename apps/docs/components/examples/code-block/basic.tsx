import { CodeBlock } from '@lyra-ds/react';

export function CodeBlockBasic() {
  return (
    <CodeBlock language="tsx" copyLabel="Copy" copiedLabel="Copied">
      <code>{`export function greet(name: string) {\n  return \`Hello, \${name}\`;\n}`}</code>
    </CodeBlock>
  );
}
