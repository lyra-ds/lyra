import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { FileManager } from './index';

const themes = ['light', 'dark'] as const;
const files = [
  { id: 'document', name: 'report.pdf', size: 1536, updated: 'Yesterday' },
  { id: 'folder', name: 'Projects', type: 'folder' as const, items: 3, shared: true },
];

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('FileManager', () => {
  for (const theme of themes) {
    it(`emits exact list classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <FileManager files={files} path={['Drive', 'Projects']} />,
        );
        expect(container.querySelector('.lyra-fm')!.className).toBe('lyra-fm');
        expect(container.querySelector('.lyra-fm__toolbar')!.className).toBe('lyra-fm__toolbar');
        expect(container.querySelector('.lyra-fm__search')!.className).toBe('lyra-fm__search');
        expect(container.querySelector('.lyra-fm__views')!.className).toBe('lyra-fm__views');
        expect(container.querySelector('.lyra-fm__view')!.className).toBe(
          'lyra-fm__view lyra-fm__view--on',
        );
        expect(container.querySelector('.lyra-fm__path')!.className).toBe('lyra-fm__path');
        expect(container.querySelector('.lyra-fm__crumb')!.className).toBe('lyra-fm__crumb');
        expect(container.querySelector('.lyra-fm__list')!.className).toBe('lyra-fm__list');
        expect(container.querySelector('.lyra-fm__head')!.className).toBe('lyra-fm__head');
        expect(container.querySelector('.lyra-fm__row')!.className).toBe('lyra-fm__row');
        expect(container.querySelector('.lyra-fm__name')!.className).toBe('lyra-fm__name');
        expect(container.querySelector('.lyra-fm__icon')!.className).toBe(
          'lyra-fm__icon lyra-fm__icon--folder',
        );
        expect(container.querySelector('.lyra-fm__label')!.className).toBe('lyra-fm__label');
        expect(container.querySelector('.lyra-fm__shared')!.className).toBe('lyra-fm__shared');
        expect(container.querySelector('.lyra-fm__cell')!.className).toBe('lyra-fm__cell');
        expect(container.querySelector('.lyra-fm__actions')!.className).toBe('lyra-fm__actions');
        // Dropdown merges its trigger semantics onto this span instead of wrapping it, so the
        // action affordance is one element and one tab stop rather than two nested ones.
        const more = container.querySelector<HTMLElement>('.lyra-fm__more')!;
        expect(more.className).toBe('lyra-dropdown__trigger lyra-fm__more');
        expect(more.getAttribute('role')).toBe('button');
        expect(more.getAttribute('aria-haspopup')).toBe('menu');
        expect(more.getAttribute('aria-label')).toBe('Actions for Projects');
        expect(errorSpy).not.toHaveBeenCalled();
        expect(
          (await axe.run(container)).violations.filter((item) => item.id !== 'color-contrast'),
        ).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });

    it(`emits exact grid classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(<FileManager files={files} defaultView="grid" />);
      expect(container.querySelector('.lyra-fm__grid')!.className).toBe('lyra-fm__grid');
      expect(container.querySelector('.lyra-fm__card')!.className).toBe('lyra-fm__card');
      expect(container.querySelector('.lyra-fm__card-actions')!.className).toBe(
        'lyra-fm__card-actions',
      );
      expect(container.querySelector('.lyra-fm__card-body')!.className).toBe('lyra-fm__card-body');
      expect(container.querySelector('.lyra-fm__icon')!.className).toBe(
        'lyra-fm__icon lyra-fm__icon--big lyra-fm__icon--folder',
      );
      expect(container.querySelector('.lyra-fm__card-meta')!.className).toBe('lyra-fm__card-meta');
      expect(
        (await axe.run(container)).violations.filter((item) => item.id !== 'color-contrast'),
      ).toEqual([]);
    });
  }

  for (const theme of themes) {
    it(`clears color-contrast on the column headings in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(<FileManager files={files} />);
      const violations = (
        await axe.run(container.querySelector<HTMLElement>('.lyra-fm__head')!, {
          runOnly: ['color-contrast'],
        })
      ).violations;
      expect(violations).toEqual([]);
    });
  }

  it('gives the row name and the action trigger a 44px touch target', async () => {
    const { container } = await render(<FileManager files={files} />);
    const name = container.querySelector<HTMLElement>('.lyra-fm__name')!.getBoundingClientRect();
    expect(name.height).toBeGreaterThanOrEqual(44);

    // The trigger keeps its 30px visible box; the hit area is the transparent ::after.
    const more = container.querySelector<HTMLElement>('.lyra-fm__more')!;
    expect(Math.round(more.getBoundingClientRect().height)).toBe(30);
    const hit = getComputedStyle(more, '::after');
    expect(hit.content).not.toBe('none');
    expect(hit.top).toBe('-7px');
    expect(hit.left).toBe('-7px');
  });

  it('filters by name, keeps folders first, and shows the empty state', async () => {
    const screen = await render(<FileManager files={files} emptyMessage="Nothing here" />);
    const names = Array.from(screen.container.querySelectorAll('.lyra-fm__label')).map(
      (node) => node.textContent,
    );
    expect(names).toEqual(['Projects', 'report.pdf']);
    await screen.getByPlaceholder('Search files…').fill('missing');
    expect(screen.container.querySelector('.lyra-fm__empty')!.textContent).toBe('Nothing here');
  });

  it('changes an uncontrolled view and reports the next value', async () => {
    const onViewChange = vi.fn();
    const screen = await render(<FileManager files={files} onViewChange={onViewChange} />);
    await screen.getByRole('button', { name: 'Grid view' }).click();
    expect(screen.container.querySelector('.lyra-fm__grid')).not.toBeNull();
    expect(onViewChange).toHaveBeenCalledWith('grid');
    expect(
      screen.container
        .querySelector<HTMLButtonElement>('[aria-label="Grid view"]')!
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('honors a controlled view while requesting a change', async () => {
    const onViewChange = vi.fn();
    const screen = await render(
      <FileManager files={files} view="list" onViewChange={onViewChange} />,
    );
    await screen.getByRole('button', { name: 'Grid view' }).click();
    expect(screen.container.querySelector('.lyra-fm__list')).not.toBeNull();
    expect(screen.container.querySelector('.lyra-fm__grid')).toBeNull();
    expect(onViewChange).toHaveBeenCalledWith('grid');
  });

  it('uses the default Dropdown actions when no custom action builder is supplied', async () => {
    const screen = await render(<FileManager files={files} />);
    await userEvent.click(screen.container.querySelector<HTMLElement>('.lyra-dropdown__trigger')!);
    expect(screen.getByRole('menuitem', { name: 'Open' })).not.toBeNull();
  });

  it('opens files, navigates breadcrumbs, and composes the Dropdown action menu', async () => {
    const onOpen = vi.fn();
    const onNavigate = vi.fn();
    const customActions = vi.fn(() => [{ id: 'share', label: 'Share' }]);
    const screen = await render(
      <FileManager
        files={files}
        path={['Drive', 'Projects']}
        onOpen={onOpen}
        onNavigate={onNavigate}
        actions={customActions}
      />,
    );
    await screen.container.querySelector<HTMLButtonElement>('.lyra-fm__name')!.click();
    expect(onOpen).toHaveBeenCalledWith(files[1]);
    await screen.container.querySelector<HTMLButtonElement>('.lyra-fm__crumb')!.click();
    expect(onNavigate).toHaveBeenCalledWith(0);
    expect(
      screen.container.querySelectorAll<HTMLButtonElement>('.lyra-fm__crumb')[1]!.disabled,
    ).toBe(true);

    const actionTrigger = screen.container.querySelector<HTMLElement>('.lyra-dropdown__trigger')!;
    await userEvent.click(actionTrigger);
    expect(screen.getByRole('menuitem', { name: 'Share' })).not.toBeNull();
    expect(customActions).toHaveBeenCalledWith(files[1]);
  });

  it('uses "View mode" as the default accessible name for the view toggle', async () => {
    const { container } = await render(<FileManager files={files} />);
    expect(container.querySelector('.lyra-fm__views')!.getAttribute('aria-label')).toBe(
      'View mode',
    );
  });

  it('uses labels.viewMode as the accessible name for the view toggle', async () => {
    const { container } = await render(
      <FileManager files={files} labels={{ viewMode: 'Modo de visualização' }} />,
    );
    expect(container.querySelector('.lyra-fm__views')!.getAttribute('aria-label')).toBe(
      'Modo de visualização',
    );
  });

  it('uses "List view" as the default accessible name for the list-view button', async () => {
    const { container } = await render(<FileManager files={files} />);
    expect(container.querySelectorAll('.lyra-fm__view')[0]!.getAttribute('aria-label')).toBe(
      'List view',
    );
  });

  it('uses labels.listView as the accessible name for the list-view button', async () => {
    const { container } = await render(
      <FileManager files={files} labels={{ listView: 'Visualização em lista' }} />,
    );
    expect(container.querySelectorAll('.lyra-fm__view')[0]!.getAttribute('aria-label')).toBe(
      'Visualização em lista',
    );
  });

  it('uses "Grid view" as the default accessible name for the grid-view button', async () => {
    const { container } = await render(<FileManager files={files} />);
    expect(container.querySelectorAll('.lyra-fm__view')[1]!.getAttribute('aria-label')).toBe(
      'Grid view',
    );
  });

  it('uses labels.gridView as the accessible name for the grid-view button', async () => {
    const { container } = await render(
      <FileManager files={files} labels={{ gridView: 'Visualização em grade' }} />,
    );
    expect(container.querySelectorAll('.lyra-fm__view')[1]!.getAttribute('aria-label')).toBe(
      'Visualização em grade',
    );
  });

  it('uses "Current folder" as the default accessible name for the breadcrumb', async () => {
    const { container } = await render(<FileManager files={files} path={['Drive']} />);
    expect(container.querySelector('.lyra-fm__path')!.getAttribute('aria-label')).toBe(
      'Current folder',
    );
  });

  it('uses labels.currentFolder as the accessible name for the breadcrumb', async () => {
    const { container } = await render(
      <FileManager files={files} path={['Drive']} labels={{ currentFolder: 'Pasta atual' }} />,
    );
    expect(container.querySelector('.lyra-fm__path')!.getAttribute('aria-label')).toBe(
      'Pasta atual',
    );
  });

  it('uses the file name in the default accessible name for each action trigger', async () => {
    const { container } = await render(<FileManager files={files} />);
    expect(container.querySelector('.lyra-fm__more')!.getAttribute('aria-label')).toBe(
      'Actions for Projects',
    );
  });

  it('passes the file name to labels.itemActions for each action trigger', async () => {
    const { container } = await render(
      <FileManager files={files} labels={{ itemActions: (name) => `Ações para ${name}` }} />,
    );
    expect(container.querySelector('.lyra-fm__more')!.getAttribute('aria-label')).toBe(
      'Ações para Projects',
    );
  });
});
