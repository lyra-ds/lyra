import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];
const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

Alpine.plugin(lyra);

function mountCodeBlock({ copyText }: { copyText?: string } = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div x-data="lyraCodeBlock()" class="lyra-code" ${copyText ? `data-copy-text="${copyText}"` : ''}>
      <div class="lyra-code__bar">
        <button class="lyra-code__copy" x-bind="copyButton" x-text="copied ? 'Copied' : 'Copy'"></button>
      </div>
      <pre class="lyra-code__pre">const greeting = 'hello';\nconsole.log(greeting);</pre>
      <span class="lyra-code__status" x-bind="status" x-text="copied ? 'Copied' : ''"></span>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function codeBlock(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-code');
  if (!element) throw new Error('Expected code block root');
  return element;
}

function copyButton(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-code__copy');
  if (!element) throw new Error('Expected copy button');
  return element;
}

function stubClipboard(writeText: ReturnType<typeof vi.fn>): void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  vi.restoreAllMocks();
  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
  } else {
    Reflect.deleteProperty(navigator, 'clipboard');
  }
});

describe('lyraCodeBlock', () => {
  it('copies the rendered pre text when its copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const host = mountCodeBlock();

    copyButton(host).click();

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("const greeting = 'hello';\nconsole.log(greeting);");
    });
  });

  it('uses data-copy-text instead of the rendered pre text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const host = mountCodeBlock({ copyText: 'source value' });

    copyButton(host).click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('source value'));
  });

  it('sets copied while feedback is visible and resets it after 1500 ms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const host = mountCodeBlock();

    copyButton(host).click();

    await vi.waitFor(() => expect(copyButton(host).textContent).toBe('Copied'));
    await vi.waitFor(() => expect(copyButton(host).textContent).toBe('Copy'), { timeout: 3000 });
  });

  it('leaves copied false when clipboard writing is rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    stubClipboard(writeText);
    const host = mountCodeBlock();

    copyButton(host).click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(copyButton(host).textContent).toBe('Copy');
  });

  it('re-arms copy feedback when clicked again before its reset timer expires', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const host = mountCodeBlock();

    copyButton(host).click();
    await vi.waitFor(() => expect(copyButton(host).textContent).toBe('Copied'));
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    copyButton(host).click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    await new Promise<void>((resolve) => setTimeout(resolve, 700));

    expect(copyButton(host).textContent).toBe('Copied');
    await vi.waitFor(() => expect(copyButton(host).textContent).toBe('Copy'), { timeout: 3000 });
  });

  it('binds its copy button and polite status region and remains axe clean while idle and copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const host = mountCodeBlock();
    const status = host.querySelector<HTMLElement>('.lyra-code__status');

    expect(copyButton(host).type).toBe('button');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.getAttribute('aria-atomic')).toBe('true');
    await expectNoAxeViolations(codeBlock(host));

    copyButton(host).click();
    await vi.waitFor(() => expect(copyButton(host).textContent).toBe('Copied'));
    expect(status?.textContent).toBe('Copied');
    await expectNoAxeViolations(codeBlock(host));
  });
});
