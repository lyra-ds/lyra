import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Select } from './index';
const themes = ['light', 'dark'] as const;
function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});
describe('Select', () => {
  for (const theme of themes)
    it(`uses the form recipe and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Select label="Country" hint="Required" size="lg">
            <option value="br">Brazil</option>
          </Select>,
        );
        const select = container.querySelector('select')!;
        expect(container.querySelector('.lyra-select-wrap')!.className).toBe('lyra-select-wrap');
        expect(select.className).toBe('lyra-input lyra-input--lg');
        expect(container.querySelector('label')!.htmlFor).toBe(select.id);
        expect(select.getAttribute('aria-describedby')).toBe(
          container.querySelector('.lyra-hint')!.id,
        );
        expect(spy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        spy.mockRestore();
      }
    });
  it('composes native change events and error wiring', async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select label="Country" error="Choose one" onChange={onChange}>
        <option value="">Choose</option>
        <option value="br">Brazil</option>
      </Select>,
    );
    const select = container.querySelector<HTMLSelectElement>('select')!;
    select.value = 'br';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.className).toBe('lyra-input lyra-input--error');
  });
});
