import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { CodeBlock } from './index';

function ExampleCode(): React.JSX.Element {
  return (
    <code>
      <span className="line">const greeting = 'hello';</span>
      {'\n'}
      <span className="line">console.log(greeting);</span>
    </code>
  );
}

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CodeBlock', () => {
  it('renders highlighter markup with its frame chrome and remains axe clean', async () => {
    const { container } = await render(
      <CodeBlock language="tsx" lineNumbers copyLabel="Copy" copiedLabel="Copied">
        <ExampleCode />
      </CodeBlock>,
    );

    await expect.element(container.querySelector<HTMLElement>('.lyra-code')!).toBeInTheDocument();
    await expect
      .element(container.querySelector<HTMLElement>('.lyra-code__lang')!)
      .toHaveTextContent('tsx');
    await expect
      .element(container.querySelector<HTMLElement>('.lyra-code__copy')!)
      .toHaveTextContent('Copy');
    expect(container.querySelector('.lyra-code')!.className).toBe(
      'lyra-code lyra-code--line-numbers',
    );
    await expectNoAxeViolations(container);
  });

  it('only enables CSS counter line numbers when lineNumbers is set', async () => {
    const withoutNumbers = await render(
      <CodeBlock>
        <ExampleCode />
      </CodeBlock>,
    );
    const noNumberLine = withoutNumbers.container.querySelector<HTMLElement>('.line')!;
    expect(getComputedStyle(noNumberLine, '::before').content).toBe('none');
    await cleanup();

    const withNumbers = await render(
      <CodeBlock lineNumbers>
        <ExampleCode />
      </CodeBlock>,
    );
    const numberedLine = withNumbers.container.querySelector<HTMLElement>('.line')!;
    expect(getComputedStyle(numberedLine, '::before').content).toContain('counter(step)');
  });

  it('makes a plain-text overflowed code region keyboard-reachable with a visible focus ring', async () => {
    const longLine = 'const veryLongIdentifier = "a line that must overflow the code panel";';
    const { container } = await render(<CodeBlock style={{ width: 120 }}>{longLine}</CodeBlock>);
    const pre = container.querySelector<HTMLPreElement>('.lyra-code__pre')!;

    expect(pre.tabIndex).toBe(0);
    expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);

    await userEvent.tab();

    await expect.element(pre).toHaveFocus();
    expect(getComputedStyle(pre).boxShadow).not.toBe('none');
  });

  it('soft-wraps long code only when wrap is enabled', async () => {
    const longLine = 'constverylongidentifierthatmustbreakratherthanoverflowthecodepanel'.repeat(
      20,
    );
    const withWrap = await render(
      <CodeBlock wrap style={{ width: 120 }}>
        {longLine}
      </CodeBlock>,
    );
    const wrappedPre = withWrap.container.querySelector<HTMLPreElement>('.lyra-code__pre')!;

    await expect.element(wrappedPre).toBeInTheDocument();
    expect(getComputedStyle(wrappedPre).whiteSpace).toBe('pre-wrap');
    expect(wrappedPre.scrollWidth).toBeLessThanOrEqual(wrappedPre.clientWidth);
    expect(wrappedPre.hasAttribute('tabindex')).toBe(false);
    await cleanup();

    const withoutWrap = await render(<CodeBlock style={{ width: 120 }}>{longLine}</CodeBlock>);
    const defaultPre = withoutWrap.container.querySelector<HTMLPreElement>('.lyra-code__pre')!;

    await expect.element(defaultPre).toBeInTheDocument();
    expect(getComputedStyle(defaultPre).whiteSpace).toBe('pre');
    expect(defaultPre.scrollWidth).toBeGreaterThan(defaultPre.clientWidth);
  });

  it('copies its rendered pre text and announces the copied label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { container } = await render(
      <CodeBlock copyLabel="Copy code" copiedLabel="Copied code">
        <ExampleCode />
      </CodeBlock>,
    );
    const copyButton = container.querySelector<HTMLButtonElement>('.lyra-code__copy')!;

    await userEvent.click(copyButton);

    expect(writeText).toHaveBeenCalledWith("const greeting = 'hello';\nconsole.log(greeting);");
    await expect.element(copyButton).toHaveTextContent('Copied code');
    await expect
      .element(container.querySelector<HTMLElement>('[role=status]')!)
      .toHaveTextContent('Copied code');
  });

  it('uses copyText instead of rendered text when it is provided', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { container } = await render(
      <CodeBlock copyLabel="Copy" copiedLabel="Copied" copyText="source value">
        <ExampleCode />
      </CodeBlock>,
    );

    await userEvent.click(container.querySelector<HTMLButtonElement>('.lyra-code__copy')!);

    expect(writeText).toHaveBeenCalledWith('source value');
  });

  it('leaves the copy control usable when clipboard access is rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { container } = await render(
      <CodeBlock copyLabel="Copy" copiedLabel="Copied">
        <ExampleCode />
      </CodeBlock>,
    );
    const copyButton = container.querySelector<HTMLButtonElement>('.lyra-code__copy')!;

    await userEvent.click(copyButton);

    await expect.element(copyButton).toHaveTextContent('Copy');
    await expect
      .element(container.querySelector<HTMLElement>('[role=status]')!)
      .toHaveTextContent('');
    expect(copyButton.disabled).toBe(false);
  });

  it('omits the copy affordance when either translated copy label is omitted', async () => {
    const { container } = await render(
      <CodeBlock language="tsx">
        <ExampleCode />
      </CodeBlock>,
    );

    expect(container.querySelector('.lyra-code__copy')).toBeNull();
  });
});
