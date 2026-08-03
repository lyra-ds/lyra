import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { TimeInput } from './index';

const THEMES = ['light', 'dark'] as const;

function setTheme(theme: (typeof THEMES)[number]): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('TimeInput', () => {
  it('clears and commits null when an empty value blurs', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <TimeInput label="Start time" defaultValue="09:00" onChange={onChange} />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Start time' });
    const element = input.element() as HTMLInputElement;
    await input.fill('');
    element.blur();

    await expect.poll(() => element.value).toBe('');
    expect(onChange).toHaveBeenCalledWith(null);
    expect(element.getAttribute('aria-invalid')).toBeNull();
  });

  it('preserves invalid text after blur and does not commit it', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <TimeInput label="Start time" defaultValue="09:00" onChange={onChange} />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Start time' });
    const element = input.element() as HTMLInputElement;
    await input.fill('25:99');
    element.blur();

    await expect.poll(() => element.value).toBe('25:99');
    expect(onChange).not.toHaveBeenCalled();
    expect(element.getAttribute('aria-invalid')).toBe('true');
    expect(element.className).toContain('lyra-input--error');
  });

  it('rejects extra separators, preserves the text, and does not commit it', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <TimeInput label="Start time" defaultValue="09:00" onChange={onChange} />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Start time' });
    const element = input.element() as HTMLInputElement;
    await input.fill('9:5:99');
    element.blur();

    await expect.poll(() => element.value).toBe('9:5:99');
    expect(onChange).not.toHaveBeenCalled();
    expect(element.getAttribute('aria-invalid')).toBe('true');
  });

  it('normalizes valid text and commits it on blur and Enter', async () => {
    const onChange = vi.fn();
    const screen = await render(<TimeInput label="Start time" onChange={onChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Start time' });
    const element = input.element() as HTMLInputElement;
    await input.fill('9:5');
    element.blur();

    await expect.poll(() => element.value).toBe('09:05');
    expect(onChange).toHaveBeenLastCalledWith('09:05');

    element.focus();
    await input.fill('0930');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => element.value).toBe('09:30');
    expect(onChange).toHaveBeenLastCalledWith('09:30');
  });

  it('supports keyboard and stepper adjustments, including Shift for one hour', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <TimeInput label="Start time" defaultValue="09:00" step={15} onChange={onChange} />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Start time' });
    const element = input.element() as HTMLInputElement;
    element.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect.poll(() => element.value).toBe('09:15');
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await expect.poll(() => element.value).toBe('08:15');
    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    await expect.poll(() => element.value).toBe('08:30');
    expect(onChange).toHaveBeenLastCalledWith('08:30');
  });

  it('merges labels over English defaults and exposes a translatable aria-valuetext', async () => {
    const screen = await render(
      <TimeInput
        label="Start time"
        defaultValue="09:30"
        labels={{
          later: 'Increase time',
          valueText: (hours, minutes) => String(hours) + 'h ' + String(minutes) + 'm',
        }}
      />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Start time' });
    expect((input.element() as HTMLInputElement).getAttribute('aria-valuetext')).toBe('9h 30m');
    await expect.element(screen.getByRole('button', { name: 'Increase time' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Earlier' })).toBeInTheDocument();
  });

  for (const theme of THEMES) {
    it('is axe clean in ' + theme, async () => {
      setTheme(theme);
      const { container } = await render(
        <TimeInput label="Start time" hint="Use a 24-hour time" defaultValue="09:00" />,
      );
      expect(
        (await axe.run(container)).violations.filter((item) => item.id !== 'color-contrast'),
      ).toEqual([]);
    });
  }
});
