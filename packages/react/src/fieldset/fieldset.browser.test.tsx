import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Fieldset, FormRow } from './index';

const THEMES = ['light', 'dark'] as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Fieldset and FormRow', () => {
  for (const theme of THEMES) {
    it(`renders their semantic form composition and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(
        <Fieldset legend="Contact details" description="How we can reach you.">
          <FormRow columns={2}>
            <input aria-label="First name" />
            <input aria-label="Last name" />
          </FormRow>
        </Fieldset>,
      );

      const fieldset = container.querySelector('fieldset')!;
      expect(fieldset.className).toBe('lyra-fieldset');
      expect(fieldset.querySelector('legend')!.className).toBe('lyra-fieldset__legend');
      expect(fieldset.querySelector('p')!.className).toBe('lyra-fieldset__desc');
      expect(fieldset.querySelector('.lyra-fieldset__fields')!.className).toBe(
        'lyra-fieldset__fields',
      );
      const formRow = fieldset.querySelector<HTMLElement>('.lyra-formrow')!;
      expect(formRow.style.getPropertyValue('--lyra-formrow-columns')).toBe(
        'repeat(2, minmax(0, 1fr))',
      );
      expect(getComputedStyle(formRow).display).toBe('grid');
      await expect.element(formRow).toBeInTheDocument();
      await expectNoAxeViolations(container);
    });
  }

  it('uses the number of children as the default column count', async () => {
    const { container } = await render(
      <FormRow>
        <input aria-label="First name" />
        <input aria-label="Last name" />
        <input aria-label="Email" />
      </FormRow>,
    );
    const formRow = container.querySelector<HTMLElement>('.lyra-formrow')!;

    expect(formRow.style.getPropertyValue('--lyra-formrow-columns')).toBe(
      'repeat(3, minmax(0, 1fr))',
    );
    expect(getComputedStyle(formRow).display).toBe('grid');
  });
});
