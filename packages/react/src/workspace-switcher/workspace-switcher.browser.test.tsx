import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { WorkspaceSwitcher } from './index';

const workspaces = [
  { id: 'acme', name: 'Acme', plan: 'Pro', members: 5 },
  { id: 'lyra', name: 'Lyra', plan: 'Free', members: 2 },
];

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
});

describe('WorkspaceSwitcher', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`emits exact classes and is axe clean in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <WorkspaceSwitcher workspaces={workspaces} onCreate={() => {}} defaultOpen />,
        );
        const root = container.querySelector<HTMLElement>('.lyra-wssw')!;
        expect(root.className).toBe('lyra-wssw');
        expect(root.querySelector('.lyra-wssw__trigger')!.className).toBe('lyra-wssw__trigger');
        expect(root.querySelector('.lyra-wssw__id')!.className).toBe('lyra-wssw__id');
        expect(root.querySelector('.lyra-wssw__name')!.className).toBe('lyra-wssw__name');
        expect(root.querySelector('.lyra-wssw__plan')!.className).toBe('lyra-wssw__plan');
        expect(root.querySelector('.lyra-wssw__pop')!.className).toBe('lyra-wssw__pop');
        expect(root.querySelector('.lyra-wssw__pop-label')!.className).toBe('lyra-wssw__pop-label');
        expect(root.querySelector('.lyra-wssw__item')!.className).toBe('lyra-wssw__item');
        expect(root.querySelector('.lyra-wssw__meta')!.className).toBe('lyra-wssw__meta');
        expect(root.querySelector('.lyra-wssw__sep')!.className).toBe('lyra-wssw__sep');
        expect(root.querySelector('.lyra-wssw__create')!.className).toBe(
          'lyra-wssw__item lyra-wssw__create',
        );
        expect(root.querySelector('.lyra-wssw__plus')!.className).toBe('lyra-wssw__plus');
        expect(root.querySelector('.lyra-wssw__create-label')!.className).toBe(
          'lyra-wssw__create-label',
        );
        await expectNoAxeViolations(container);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('opens, roves real focus, escapes, selects, and creates from the popover', async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn();
    const { container } = await render(
      <WorkspaceSwitcher workspaces={workspaces} onChange={onChange} onCreate={onCreate} />,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    let options = container.querySelectorAll<HTMLButtonElement>('[role=option]');
    expect(document.activeElement).toBe(options[0]);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(options[1]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(options[0]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(options[2]);
    await userEvent.keyboard('{Escape}');
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Enter}');
    options = container.querySelectorAll<HTMLButtonElement>('[role=option]');
    await userEvent.click(options[1]);
    expect(onChange).toHaveBeenCalledWith('lyra', workspaces[1]);
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Space}');
    const create = container.querySelector<HTMLButtonElement>('.lyra-wssw__create')!;
    await userEvent.click(create);
    expect(onCreate).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
  });

  it('flips the popover above the trigger instead of scrolling the page when there is no room below', async () => {
    const { container } = await render(
      <>
        <div style={{ height: 'calc(100vh - 80px)' }} />
        <WorkspaceSwitcher workspaces={workspaces} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;
    const scrollBefore = window.scrollY;
    await userEvent.click(trigger);
    expect(container.querySelector('.lyra-wssw__pop')!.className).toContain('lyra-wssw__pop--up');
    expect(window.scrollY).toBe(scrollBefore);
  });

  it('keeps the popover below the trigger when it fits', async () => {
    const { container } = await render(
      <>
        <WorkspaceSwitcher workspaces={workspaces} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    await userEvent.click(container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!);
    expect(container.querySelector('.lyra-wssw__pop')!.className).not.toContain(
      'lyra-wssw__pop--up',
    );
  });
});
