import { CodeBlock } from '@lyra-ds/react';

export function CodeBlockWrap() {
  return (
    <CodeBlock language="tsx" wrap>
      <code>{`const componentIdentifierThatWouldOtherwiseOverflow = 'CodeBlock';`}</code>
    </CodeBlock>
  );
}
