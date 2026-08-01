import { CodeBlock } from '@lyra-ds/react';

export function CodeBlockLineNumbers() {
  return (
    <CodeBlock language="css" lineNumbers>
      <code>
        <span className="line">.notice {'{'}\n</span>
        <span className="line"> color: rebeccapurple;\n</span>
        <span className="line">{'}'}</span>
      </code>
    </CodeBlock>
  );
}
