import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import '@lyra-ds/styles/styles.css';
import { Combobox } from './index';

afterEach(async () => {
  await cleanup();
});

describe('Combobox v1.2 options', () => {
  it('renders group headings and trailing content while keyboard navigation skips headings', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <Combobox
        label="Region"
        defaultOpen
        onChange={onChange}
        options={[
          { value: 'br', label: 'Brazil', group: 'Americas', trailing: '09:30' },
          { value: 'jp', label: 'Japan', group: 'Asia', trailing: '21:30' },
        ]}
      />,
    );

    await expect.element(screen.getByText('Americas')).toBeInTheDocument();
    await expect.element(screen.getByText('Asia')).toBeInTheDocument();
    expect(screen.container.querySelector('.lyra-combobox__group')!.getAttribute('role')).toBe(
      'presentation',
    );
    await expect.element(screen.getByText('09:30')).toBeInTheDocument();
    expect(screen.container.querySelector('.lyra-combobox__trailing')!.className).toBe(
      'lyra-combobox__trailing',
    );

    const search = screen.getByRole('combobox', { name: 'Region' });
    await expect.element(search).toBeInTheDocument();
    search.element().focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('jp', expect.objectContaining({ label: 'Japan' }));
  });

  it('matches invisible keywords without rendering them', async () => {
    const screen = await render(
      <Combobox
        label="Region"
        defaultOpen
        options={[{ value: 'br', label: 'Brazil', keywords: 'south america brasil' }]}
      />,
    );
    const search = screen.getByRole('combobox', { name: 'Region' });

    await userEvent.fill(search, 'brasil');
    await expect.element(screen.getByRole('option', { name: 'Brazil' })).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain('south america brasil');
  });

  it('moves Home and End across selectable options in a grouped, filtered list', async () => {
    const screen = await render(
      <Combobox
        label="Region"
        defaultOpen
        options={[
          { value: 'br', label: 'Brazil', group: 'Americas' },
          { value: 'jp', label: 'Japan', group: 'Asia' },
          { value: 'ng', label: 'Nigeria', group: 'Africa' },
        ]}
      />,
    );
    const search = screen.getByRole('combobox', { name: 'Region' });

    await userEvent.fill(search, 'a');
    const options = screen
      .getByRole('listbox')
      .element()
      .querySelectorAll<HTMLElement>('[role=option]');
    await userEvent.keyboard('{End}');
    expect(search.element().getAttribute('aria-activedescendant')).toBe(options[2]!.id);
    await userEvent.keyboard('{Home}');
    expect(search.element().getAttribute('aria-activedescendant')).toBe(options[0]!.id);
  });

  it('matches diacritic-free queries against labels and invisible keywords', async () => {
    const screen = await render(
      <Combobox
        label="Region"
        defaultOpen
        options={[
          { value: 'cafe', label: 'Café', group: 'Americas' },
          { value: 'tea', label: 'Tea', group: 'Europe', keywords: 'café bistro' },
        ]}
      />,
    );
    const search = screen.getByRole('combobox', { name: 'Region' });

    await userEvent.fill(search, 'cafe');
    await expect.element(screen.getByRole('option', { name: 'Café' })).toBeInTheDocument();
    await expect.element(screen.getByRole('option', { name: 'Tea' })).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain('café bistro');
  });
});
