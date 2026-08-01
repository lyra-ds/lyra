import { CodeBlock } from '@lyra-ds/react';

export function CodeBlockCopyText() {
  return (
    <CodeBlock
      language="shell"
      copyLabel="Copy command"
      copiedLabel="Command copied"
      copyText="pnpm add @lyra-ds/react @lyra-ds/styles"
    >
      <code>$ pnpm add @lyra-ds/react @lyra-ds/styles</code>
    </CodeBlock>
  );
}
