import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Combobox } from './index';

const themes = ['light', 'dark'] as const;
const options = [
  { value: 'br', label: 'Brazil', hint: 'South America' },
  { value: 'ca', label: 'Canada' },
  { value: 'jp', label: 'Japan' },
];

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Combobox', () => {
  for (const theme of themes) {
    it(`emits exact form classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Combobox label="Country" hint="Required" options={options} defaultOpen defaultValue="br" />,
        );
        expect(container.querySelector('.lyra-field')!.className).toBe('lyra-field');
        expect(container.querySelector('.lyra-combobox')!.className).toBe('lyra-combobox');
        expect(container.querySelector<HTMLButtonElement>('.lyra-combobox__trigger')!.className).toBe(
          'lyra-input lyra-combobox__trigger',
        );
        expect(container.querySelector('.lyra-combobox__pop')!.className).toBe('lyra-combobox__pop');
        expect(container.querySelector('.lyra-combobox__search')!.className).toBe('lyra-combobox__search');
        expect(container.querySelector('[role=listbox]')!.className).toBe('lyra-combobox__list');
        expect(container.querySelector('[role=option]')!.className).toBe(
          'lyra-combobox__option lyra-combobox__option--active',
        );
        expect(container.querySelector('.lyra-combobox__option-label')!.className).toBe(
          'lyra-combobox__option-label',
        );
        expect(container.querySelector('.lyra-combobox__option-hint')!.className).toBe(
          'lyra-combobox__option-hint',
        );
        expect(errorSpy).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations.filter((item) => item.id !== 'color-contrast')).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('maintains aria-activedescendant while filtering and navigating, then picks an uncontrolled value', async () => {
    const onChange = vi.fn();
    const { container } = await render(<Combobox label="Country" options={options} onChange={onChange} />);
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-combobox__trigger')!;
    await userEvent.click(trigger);
    const search = container.querySelector<HTMLInputElement>('[role=combobox]')!;
    expect(document.activeElement).toBe(search);
    expect(search.getAttribute('aria-activedescendant')).toBe(container.querySelectorAll('[role=option]')[0].id);
    await userEvent.fill(search, 'j');
    const japan = container.querySelector<HTMLButtonElement>('[role=option]')!;
    expect(search.getAttribute('aria-activedescendant')).toBe(japan.id);
    await userEvent.keyboard('{ArrowDown}');
    expect(search.getAttribute('aria-activedescendant')).toBe(japan.id);
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('jp', options[2]);
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(trigger.textContent).toContain('Japan');
    expect(document.activeElement).toBe(trigger);
  });

  it('clamps arrow navigation, restores the trigger on Escape, and supports controlled values', async () => {
    function Harness(): React.JSX.Element {
      const [value, setValue] = useState('br');
      return <Combobox label="Country" options={options} value={value} onChange={(next) => setValue(next)} />;
    }
    const { container } = await render(<Harness />);
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-combobox__trigger')!;
    await userEvent.click(trigger);
    const search = container.querySelector<HTMLInputElement>('[role=combobox]')!;
    await userEvent.keyboard('{ArrowUp}');
    const first = container.querySelectorAll<HTMLElement>('[role=option]')[0];
    expect(search.getAttribute('aria-activedescendant')).toBe(first.id);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const last = container.querySelectorAll<HTMLElement>('[role=option]')[2];
    expect(search.getAttribute('aria-activedescendant')).toBe(last.id);
    await userEvent.keyboard('{Escape}');
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await userEvent.click(trigger);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(trigger.textContent).toContain('Canada');
  });

  it('removes aria-activedescendant when filtering leaves no active option', async () => {
    const { container } = await render(<Combobox options={options} defaultOpen />);
    const search = container.querySelector<HTMLInputElement>('[role=combobox]')!;
    await userEvent.fill(search, 'not-found');
    expect(search.hasAttribute('aria-activedescendant')).toBe(false);
    expect(container.querySelector('.lyra-combobox__empty')!.className).toBe('lyra-combobox__empty');
  });
});
