import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { OtpInput } from './index';

// Firefox ignores `clipboardData` in the ClipboardEvent constructor.
function paste(target: HTMLElement, clipboardData: DataTransfer): void {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: clipboardData });
  target.dispatchEvent(event);
}

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
});

describe('OtpInput', () => {
  it('advances, navigates, deletes and submits one combined value', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <OtpInput label="Verification code" name="code" length={4} onChange={onChange} />,
    );
    const inputs = Array.from(
      screen.container.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'),
    );
    inputs[0].focus();
    await userEvent.keyboard('12');
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(document.activeElement).toBe(inputs[2]);
    await userEvent.keyboard('{ArrowLeft}{Backspace}');
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('');
    expect((screen.container.querySelector('[name="code"]') as HTMLInputElement).value).toBe('1');
    expect(onChange).toHaveBeenLastCalledWith('1');
  });

  it('replaces one digit when typing into a filled box', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <OtpInput label="Verification code" length={4} defaultValue="1234" onChange={onChange} />,
    );
    const inputs = Array.from(
      screen.container.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'),
    );
    inputs[1].focus();
    inputs[1].setSelectionRange(1, 1);
    await userEvent.keyboard('9');
    expect(inputs.map((input) => input.value).join('')).toBe('1934');
    expect(onChange).toHaveBeenLastCalledWith('1934');
    expect(document.activeElement).toBe(inputs[2]);
    inputs[3].focus();
    inputs[3].setSelectionRange(0, 0);
    await userEvent.keyboard('7');
    expect(inputs.map((input) => input.value).join('')).toBe('1937');
  });

  it('ignores an invalid character', async () => {
    const screen = await render(<OtpInput label="Verification code" length={4} />);
    const inputs = Array.from(
      screen.container.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'),
    );
    inputs[0].focus();
    await userEvent.keyboard('a');
    expect(inputs[0].value).toBe('');
  });

  it('splits a full pasted code and rejects nondigits', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <OtpInput label="Verification code" length={4} onChange={onChange} />,
    );
    const inputs = Array.from(
      screen.container.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'),
    );
    const clipboard = new DataTransfer();
    clipboard.setData('text', 'a1 2-34');
    paste(inputs[0], clipboard);
    await expect.poll(() => inputs.map((input) => input.value).join('')).toBe('1234');
    expect(onChange).toHaveBeenLastCalledWith('1234');
  });

  for (const theme of ['light', 'dark'] as const) {
    it('has no axe violations in ' + theme, async () => {
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      const { container } = await render(
        <OtpInput label="Verification code" error="Invalid code" />,
      );
      await expectNoAxeViolations(container);
    });
  }
});
