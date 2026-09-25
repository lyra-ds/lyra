import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

Alpine.plugin(lyra);
const hosts: HTMLElement[] = [];

function mount(length = 4): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `<div class="lyra-field" x-data="lyraOtpInput({ length: ${length} })" x-modelable="code">
    <span id="otp-label" class="lyra-label">Verification code</span>
    <div class="lyra-otp" role="group" aria-labelledby="otp-label">
      <template x-for="index in positions" :key="index">
        <input class="lyra-input lyra-otp__digit" type="text" :data-index="index" inputmode="numeric"
          :autocomplete="index === 0 ? 'one-time-code' : 'off'" x-bind="digit" />
      </template>
    </div>
    <input type="hidden" name="code" x-bind:value="code" />
  </div>`;
  document.body.appendChild(host);
  Alpine.initTree(host);
  hosts.push(host);
  return host;
}

// Firefox ignores `clipboardData` in the ClipboardEvent constructor.
function paste(target: HTMLElement, clipboardData: DataTransfer): void {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: clipboardData });
  target.dispatchEvent(event);
}

afterEach(() => {
  for (const host of hosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraOtpInput', () => {
  it('advances, splits paste, and exposes the combined value', async () => {
    const host = mount();
    const inputs = Array.from(host.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'));
    expect(inputs).toHaveLength(4);
    inputs[0].focus();
    await userEvent.keyboard('12');
    await Alpine.nextTick();
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(document.activeElement).toBe(inputs[2]);
    const clipboard = new DataTransfer();
    clipboard.setData('text', '9-8 76');
    paste(inputs[2], clipboard);
    await Alpine.nextTick();
    expect(inputs.map((input) => input.value).join('')).toBe('9876');
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('9876');
    await userEvent.keyboard('{Backspace}');
    await Alpine.nextTick();
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('987');
  });

  it('replaces one digit when typing into a filled box', async () => {
    const host = mount();
    const inputs = Array.from(host.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'));
    const clipboard = new DataTransfer();
    clipboard.setData('text', '1234');
    paste(inputs[0], clipboard);
    await Alpine.nextTick();
    inputs[1].focus();
    inputs[1].setSelectionRange(1, 1);
    await userEvent.keyboard('9');
    await Alpine.nextTick();
    expect(inputs.map((input) => input.value).join('')).toBe('1934');
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('1934');
  });

  it('distributes a two-digit autofill over two boxes', async () => {
    const host = mount(2);
    const inputs = Array.from(host.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'));
    const clipboard = new DataTransfer();
    clipboard.setData('text', '12');
    paste(inputs[0], clipboard);
    await Alpine.nextTick();
    await userEvent.fill(inputs[0], '98');
    await Alpine.nextTick();
    expect(inputs.map((input) => input.value).join('')).toBe('98');
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('98');
  });

  it('keeps one digit per box when retyping the same digit', async () => {
    const host = mount();
    const inputs = Array.from(host.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'));
    const clipboard = new DataTransfer();
    clipboard.setData('text', '1234');
    paste(inputs[0], clipboard);
    await Alpine.nextTick();
    inputs[1].focus();
    inputs[1].setSelectionRange(1, 1);
    await userEvent.keyboard('2');
    await Alpine.nextTick();
    expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3', '4']);
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('1234');
  });

  it('keeps one digit per box when refilling the same code', async () => {
    const host = mount();
    const inputs = Array.from(host.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'));
    const clipboard = new DataTransfer();
    clipboard.setData('text', '1234');
    paste(inputs[0], clipboard);
    await Alpine.nextTick();
    await userEvent.fill(inputs[0], '1234');
    await Alpine.nextTick();
    expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3', '4']);
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('1234');
  });

  it('restores the box after an invalid character', async () => {
    const host = mount();
    const inputs = Array.from(host.querySelectorAll<HTMLInputElement>('.lyra-otp__digit'));
    inputs[0].focus();
    await userEvent.keyboard('a');
    await Alpine.nextTick();
    expect(inputs[0].value).toBe('');
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('');
  });

  it('passes axe for the labelled group', async () => {
    const host = mount();
    await expectNoAxeViolations(host);
  });
});
