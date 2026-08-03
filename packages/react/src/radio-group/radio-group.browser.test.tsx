import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { RadioGroup } from './index';

const THEMES = ['light', 'dark'] as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('RadioGroup', () => {
  for (const theme of THEMES) {
    it(`renders its composed radio controls and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(
        <RadioGroup
          label="Contact preference"
          hint="Choose one option."
          direction="row"
          options={[
            { value: 'email', label: 'Email', hint: 'Written updates' },
            { value: 'phone', label: 'Phone' },
          ]}
        />,
      );

      const group = container.querySelector<HTMLElement>('[role="radiogroup"]')!;
      expect(group.className).toBe('lyra-field');
      await expect.element(group).toBeInTheDocument();
      expect(container.querySelector<HTMLElement>('.lyra-choicegroup')!.className).toBe(
        'lyra-choicegroup lyra-choicegroup--row',
      );
      expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(2);
      expect(container.querySelector('.lyra-choice')!.className).toBe('lyra-choice');
      expect(container.querySelector('.lyra-choice__hint')!.textContent).toBe('Written updates');
      expect((await axe.run(container)).violations).toEqual([]);
    });
  }

  it('selects a radio with ArrowDown and reports its value', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <RadioGroup
        label="Contact preference"
        defaultValue="email"
        onChange={onChange}
        options={[
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
        ]}
      />,
    );
    const radios = screen.container.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    radios[0].focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(radios[1].checked).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith('phone');
  });

  it('keeps controlled selection owned by the caller', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <RadioGroup
        label="Contact preference"
        value="email"
        onChange={onChange}
        options={[
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
        ]}
      />,
    );
    const radios = screen.container.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    await userEvent.click(radios[1]);

    expect(radios[0].checked).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith('phone');
  });
});
