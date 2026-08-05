import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
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
          <Combobox
            label="Country"
            hint="Required"
            options={options}
            defaultOpen
            defaultValue="br"
          />,
        );
        expect(container.querySelector('.lyra-field')!.className).toBe('lyra-field');
        expect(container.querySelector('.lyra-combobox')!.className).toBe('lyra-combobox');
        expect(
          container.querySelector<HTMLButtonElement>('.lyra-combobox__trigger')!.className,
        ).toBe('lyra-input lyra-combobox__trigger');
        expect(container.querySelector('.lyra-combobox__pop')!.className).toBe(
          'lyra-combobox__pop',
        );
        expect(container.querySelector('.lyra-combobox__search')!.className).toBe(
          'lyra-combobox__search',
        );
        expect(container.querySelector('[role=listbox]')!.className).toBe('lyra-combobox__list');
        // WHICH option is active is not deterministic here: each option sets the active index on
        // `mouseenter`, so wherever the runner happens to leave the pointer decides it. Asserting
        // "the first one is active" passed locally and failed on CI. What the class contract
        // actually promises is that exactly one option is active and both class shapes are exact.
        const active = container.querySelectorAll('.lyra-combobox__option--active');
        expect(active).toHaveLength(1);
        expect(active[0].className).toBe('lyra-combobox__option lyra-combobox__option--active');
        const inactive = [...container.querySelectorAll('[role=option]')].find(
          (option) => !option.className.includes('--active'),
        )!;
        expect(inactive.className).toBe('lyra-combobox__option');
        expect(container.querySelector('.lyra-combobox__option-label')!.className).toBe(
          'lyra-combobox__option-label',
        );
        expect(container.querySelector('.lyra-combobox__option-hint')!.className).toBe(
          'lyra-combobox__option-hint',
        );
        expect(errorSpy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('maintains aria-activedescendant while filtering and navigating, then picks an uncontrolled value', async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Combobox label="Country" options={options} onChange={onChange} />,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-combobox__trigger')!;
    await userEvent.click(trigger);
    const search = container.querySelector<HTMLInputElement>('[role=combobox]')!;
    expect(document.activeElement).toBe(search);
    expect(search.getAttribute('aria-activedescendant')).toBe(
      container.querySelectorAll('[role=option]')[0].id,
    );
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
      return (
        <Combobox
          label="Country"
          options={options}
          value={value}
          onChange={(next) => setValue(next)}
        />
      );
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
    expect(container.querySelector('.lyra-combobox__empty')!.className).toBe(
      'lyra-combobox__empty',
    );
  });

  it('opens downward when the popup fits below the trigger', async () => {
    const { container } = await render(
      <>
        <Combobox options={options} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    await userEvent.click(container.querySelector<HTMLButtonElement>('.lyra-combobox__trigger')!);
    expect(container.querySelector('.lyra-combobox__pop')!.className).not.toContain(
      'lyra-combobox__pop--up',
    );
  });

  it('flips above the trigger instead of scrolling the page when there is no room below', async () => {
    const { container } = await render(
      <>
        <div style={{ height: 'calc(100vh - 80px)' }} />
        <Combobox options={options} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-combobox__trigger')!;
    const scrollBefore = window.scrollY;
    await userEvent.click(trigger);
    expect(container.querySelector('.lyra-combobox__pop')!.className).toContain(
      'lyra-combobox__pop--up',
    );
    expect(window.scrollY).toBe(scrollBefore);
  });
});
