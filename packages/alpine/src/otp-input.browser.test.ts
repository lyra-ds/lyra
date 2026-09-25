import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

Alpine.plugin(lyra);
const hosts: HTMLElement[] = [];

function mount(): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `<div class="lyra-field" x-data="lyraOtpInput({ length: 4 })" x-modelable="code">
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
    inputs[2].dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }),
    );
    await Alpine.nextTick();
    expect(inputs.map((input) => input.value).join('')).toBe('9876');
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('9876');
    await userEvent.keyboard('{Backspace}');
    await Alpine.nextTick();
    expect(host.querySelector<HTMLInputElement>('[name="code"]')?.value).toBe('987');
  });

  it('passes axe for the labelled group', async () => {
    const host = mount();
    await expectNoAxeViolations(host);
  });
});
