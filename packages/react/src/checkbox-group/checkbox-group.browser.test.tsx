import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { CheckboxGroup } from './index';

const THEMES = ['light', 'dark'] as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('CheckboxGroup', () => {
  for (const theme of THEMES) {
    it(`renders its composed checkbox controls and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(
        <CheckboxGroup
          label="Notification channels"
          error="Choose at least one channel."
          direction="row"
          options={[
            { value: 'email', label: 'Email', hint: 'Written updates' },
            { value: 'push', label: 'Push' },
          ]}
        />,
      );

      const group = container.querySelector<HTMLElement>('[role="group"]')!;
      expect(group.className).toBe('lyra-field');
      await expect.element(group).toBeInTheDocument();
      expect(container.querySelector<HTMLElement>('.lyra-choicegroup')!.className).toBe(
        'lyra-choicegroup lyra-choicegroup--row',
      );
      expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
      expect(container.querySelector('.lyra-choice')!.className).toBe('lyra-choice');
      expect(container.querySelector('.lyra-hint--error')!.textContent).toBe(
        'Choose at least one channel.',
      );
      await expectNoAxeViolations(container);
    });
  }

  it('toggles a checkbox with Space and reports the next values', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <CheckboxGroup
        label="Notification channels"
        defaultValue={['email']}
        onChange={onChange}
        options={[
          { value: 'email', label: 'Email' },
          { value: 'push', label: 'Push' },
        ]}
      />,
    );
    const checkboxes =
      screen.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

    checkboxes[1].focus();
    await userEvent.keyboard(' ');

    expect(checkboxes[1].checked).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(['email', 'push']);
  });

  it('keeps controlled values owned by the caller', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <CheckboxGroup
        label="Notification channels"
        value={['email']}
        onChange={onChange}
        options={[
          { value: 'email', label: 'Email' },
          { value: 'push', label: 'Push' },
        ]}
      />,
    );
    const checkboxes =
      screen.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

    await userEvent.click(checkboxes[1]);

    expect(checkboxes[1].checked).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(['email', 'push']);
  });
});
