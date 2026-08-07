// Smoke contract for the plugin shell: Alpine.plugin(lyra) must register without
// throwing, and Alpine must stay fully functional afterwards (x-data still evaluates).
// The real @lyra-ds/styles CSS is imported here — same harness contract as the react
// suites — and asserted below, so a broken styles resolution fails THIS suite instead
// of surfacing only when the first component suite lands.
// Component-specific suites (lyraDropdown, lyraDialog, ...) land one per wave-1 task.
import '@lyra-ds/styles/styles.css';
import { describe, expect, it } from 'vitest';
import Alpine from 'alpinejs';
import lyra from './index';

describe('@lyra-ds/alpine plugin shell', () => {
  it('loads the real @lyra-ds/styles CSS (token resolves in the page)', () => {
    const indigo50 = getComputedStyle(document.documentElement).getPropertyValue('--indigo-50');
    expect(indigo50.trim()).toBe('#F1F1FC');
  });

  it('registers via Alpine.plugin() and Alpine still evaluates x-data', async () => {
    expect(() => Alpine.plugin(lyra)).not.toThrow();

    const host = document.createElement('div');
    host.innerHTML = `<div x-data="{ msg: 'lyra-ok' }" x-text="msg"></div>`;
    document.body.appendChild(host);

    Alpine.start();
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

    expect(host.firstElementChild?.textContent).toBe('lyra-ok');
  });
});
