import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import { act as reactAct, useRef, useState } from 'react';
import '@lyra-ds/styles/styles.css';
import { CommandPalette, type CommandGroup } from './index';

const themes = ['light', 'dark'] as const;
const groups: CommandGroup[] = [
  {
    label: 'Actions',
    items: [
      {
        id: 'new',
        label: 'New file',
        hint: 'Create a document',
        icon: <span>+</span>,
        shortcut: '⌘ N',
      },
      { id: 'settings', label: 'Settings', hint: 'Configure workspace', shortcut: '⌘ ,' },
    ],
  },
  { label: 'Navigation', items: [{ id: 'home', label: 'Go home', hint: 'Open dashboard' }] },
];

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

function backdropDismiss(overlay: HTMLElement): void {
  overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  overlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

type VitestBrowserRunner = { iframeId: string; sessionId: string };

function setViewport(width: number, height: number) {
  const runner = (window as typeof window & { __vitest_browser_runner__?: VitestBrowserRunner })
    .__vitest_browser_runner__;
  if (!runner) throw new Error('Vitest Browser Mode runner is unavailable.');

  const channel = new BroadcastChannel(`vitest:${runner.sessionId}`);
  channel.postMessage({ event: 'viewport', width, height, iframeId: runner.iframeId });

  return new Promise<void>((resolve, reject) => {
    channel.addEventListener('message', function handler(event) {
      if (event.data.iframeId !== runner.iframeId) return;
      if (event.data.event === 'viewport:done') {
        channel.removeEventListener('message', handler);
        channel.close();
        resolve();
      }
      if (event.data.event === 'viewport:fail') {
        channel.removeEventListener('message', handler);
        channel.close();
        reject(new Error(event.data.error));
      }
    });
  });
}

function OverlayHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button">Background</button>
      <CommandPalette open={open} onClose={() => setOpen(false)} groups={groups} />
    </>
  );
}

function HotkeyHarness({ onOpen, onClose }: { onOpen: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <CommandPalette
      open={open}
      groups={groups}
      onOpen={() => {
        onOpen();
        setOpen(true);
      }}
      onClose={() => {
        onClose();
        setOpen(false);
      }}
    />
  );
}

function ExplicitReturnFocusHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open without focus preparation
      </button>
      <CommandPalette
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        returnFocusTo={() => triggerRef.current}
        groups={groups}
      />
    </>
  );
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  await setViewport(1200, 800);
});

describe('CommandPalette — declared initial focus', () => {
  it('resolves its declared modal destination once in the owned entry frame', async () => {
    const resolver = vi.fn(() => document.querySelector<HTMLInputElement>('.lyra-cmdk input'));

    await render(<CommandPalette open initialFocusTo={resolver} groups={groups} />);

    await vi.waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('.lyra-cmdk input')),
    );
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.lyra-cmdk')!.getAttribute('initialFocusTo')).toBeNull();
  });

  it('never resolves initialFocusTo in inline mode', async () => {
    const resolver = vi.fn(() => null);

    await render(<CommandPalette inline initialFocusTo={resolver} groups={groups} />);

    await vi.waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('.lyra-cmdk input')),
    );
    expect(resolver).not.toHaveBeenCalled();
  });

  it('focuses the programmatic panel fallback for an invalid declaration and closes it once on Escape', async () => {
    const onClose = vi.fn();
    const onParentKeyDown = vi.fn();

    await render(
      <div role="presentation" onKeyDown={onParentKeyDown}>
        <CommandPalette
          open
          initialFocusTo={() => document.body}
          onClose={onClose}
          groups={groups}
        />
      </div>,
    );

    const panel = document.querySelector<HTMLElement>('.lyra-cmdk')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(panel));
    expect(panel.tabIndex).toBe(-1);

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onParentKeyDown).not.toHaveBeenCalled();
  });

  it('contains an input Escape after the combobox has already handled its close request', async () => {
    const onClose = vi.fn();
    const onParentKeyDown = vi.fn();

    await render(
      <div role="presentation" onKeyDown={onParentKeyDown}>
        <CommandPalette open onClose={onClose} groups={groups} />
      </div>,
    );

    const input = document.querySelector<HTMLInputElement>('.lyra-cmdk input')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onParentKeyDown).not.toHaveBeenCalled();
  });
});

describe('CommandPalette', () => {
  it('exposes a responsive Trigger with an accessible name after its visible label collapses', async () => {
    await setViewport(375, 800);
    const onClick = vi.fn();
    const { container, ...screen } = await render(
      <CommandPalette.Trigger label="Search" shortcut="⌘K" onClick={onClick} />,
    );
    const trigger = container.querySelector<HTMLButtonElement>('.lyra-cmdk-trigger')!;

    await expect.element(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(trigger.className).toBe('lyra-cmdk-trigger');
    expect(trigger.querySelector('.lyra-kbd')?.textContent).toBe('⌘K');
    expect(getComputedStyle(trigger.querySelector('.lyra-cmdk-trigger__label')!).display).toBe(
      'none',
    );
    expect(getComputedStyle(trigger.querySelector('.lyra-kbd')!).display).toBe('none');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    await expectNoAxeViolations(trigger);
  });

  for (const theme of themes) {
    it(`emits exact inline classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<CommandPalette inline groups={groups} />);
        const panel = container.querySelector<HTMLElement>('.lyra-cmdk')!;
        expect(panel.className).toBe('lyra-cmdk');
        expect(panel.getAttribute('role')).toBeNull();
        expect(panel.querySelector('.lyra-cmdk__search')!.className).toBe('lyra-cmdk__search');
        expect(panel.querySelector('[role=combobox]')!.getAttribute('aria-expanded')).toBe('true');
        expect(panel.querySelector('[role=listbox]')!.className).toBe('lyra-cmdk__body');
        expect(panel.querySelector('.lyra-cmdk__group')!.className).toBe('lyra-cmdk__group');
        expect(panel.querySelector('.lyra-cmdk__group-label')!.className).toBe(
          'lyra-cmdk__group-label',
        );
        expect(panel.querySelector('[role=option]')!.className).toBe(
          'lyra-cmdk__item lyra-cmdk__item--active',
        );
        expect(panel.querySelector('.lyra-cmdk__item-icon')!.className).toBe(
          'lyra-cmdk__item-icon',
        );
        expect(panel.querySelector('.lyra-cmdk__item-label')!.className).toBe(
          'lyra-cmdk__item-label',
        );
        expect(panel.querySelector('.lyra-cmdk__item-hint')!.className).toBe(
          'lyra-cmdk__item-hint',
        );
        expect(panel.querySelector('.lyra-cmdk__shortcut')!.className).toBe('lyra-cmdk__shortcut');
        expect(panel.querySelector('.lyra-cmdk__shortcut .lyra-kbd')!.className).toBe('lyra-kbd');
        expect(panel.querySelector('.lyra-cmdk__footer')!.className).toBe('lyra-cmdk__footer');
        expect(errorSpy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        errorSpy.mockRestore();
      }
    });

    it(`is axe clean as an open overlay in ${theme}`, async () => {
      setTheme(theme);
      await render(<CommandPalette open onClose={() => {}} groups={groups} />);
      await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk-overlay')).not.toBeNull());
      await expectNoAxeViolations(document.body);
    });
  }

  it('names the modal dialog in English by default, and lets a localized app rename it', async () => {
    const { container } = await render(<CommandPalette open onClose={() => {}} groups={groups} />);
    expect(container.querySelector('[role=dialog]')).toBeNull(); // it portals out of the container
    expect(document.querySelector('[role=dialog]')!.getAttribute('aria-label')).toBe(
      'Command palette',
    );
    await cleanup();

    await render(
      <CommandPalette open onClose={() => {}} groups={groups} aria-label="Paleta de comandos" />,
    );
    expect(document.querySelector('[role=dialog]')!.getAttribute('aria-label')).toBe(
      'Paleta de comandos',
    );
  });

  it('does not make the inline panel a dialog', async () => {
    const { container } = await render(<CommandPalette inline groups={groups} />);
    const panel = container.querySelector('.lyra-cmdk')!;
    expect(panel.getAttribute('role')).toBeNull();
    expect(panel.getAttribute('aria-label')).toBeNull();
  });

  it('keeps focus on the input while filtering, navigating, and selecting the active command', async () => {
    const itemSelect = vi.fn();
    const select = vi.fn();
    const localGroups: CommandGroup[] = [
      {
        label: 'Actions',
        items: [{ ...groups[0].items[0], onSelect: itemSelect }, groups[0].items[1]],
      },
      groups[1],
    ];
    const { container } = await render(
      <CommandPalette inline groups={localGroups} onSelect={select} />,
    );
    const input = container.querySelector<HTMLInputElement>('[role=combobox]')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    const first = container.querySelectorAll<HTMLElement>('[role=option]')[0];
    expect(input.getAttribute('aria-activedescendant')).toBe(first.id);
    await userEvent.fill(input, 'workspace');
    const settings = container.querySelector<HTMLElement>('[role=option]')!;
    expect(settings.textContent).toContain('Settings');
    expect(input.getAttribute('aria-activedescendant')).toBe(settings.id);
    expect(document.activeElement).toBe(input);
    await userEvent.clear(input);
    await userEvent.keyboard('{ArrowDown}');
    const second = container.querySelectorAll<HTMLElement>('[role=option]')[1];
    expect(input.getAttribute('aria-activedescendant')).toBe(second.id);
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard('{Enter}');
    expect(select).toHaveBeenCalledWith(groups[0].items[1]);
    expect(itemSelect).not.toHaveBeenCalled();
  });

  it('resets the active descendant to the first result and removes it for an empty filter', async () => {
    const { container } = await render(<CommandPalette inline groups={groups} />);
    const input = container.querySelector<HTMLInputElement>('[role=combobox]')!;
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await userEvent.fill(input, 'dashboard');
    const home = container.querySelector<HTMLElement>('[role=option]')!;
    expect(home.textContent).toContain('Go home');
    expect(input.getAttribute('aria-activedescendant')).toBe(home.id);
    await userEvent.fill(input, 'not found');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    expect(container.querySelector('.lyra-cmdk__empty')!.className).toBe('lyra-cmdk__empty');
  });

  it('portals, traps focus, locks scroll, and restores its opener after Escape and backdrop close', async () => {
    const { container } = await render(<OverlayHarness />);
    const opener = container.querySelector<HTMLButtonElement>('button')!;
    opener.focus();
    expect(document.activeElement).toBe(opener);
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());
    expect(document.body.style.overflow).toBe('hidden');
    const input = document.querySelector<HTMLInputElement>('[role=combobox]')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    const options = document.querySelectorAll<HTMLButtonElement>('[role=option]');
    options[options.length - 1].focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
    expect(document.activeElement).toBe(opener);

    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk-overlay')).not.toBeNull());
    const overlay = document.querySelector<HTMLElement>('.lyra-cmdk-overlay')!;
    backdropDismiss(overlay);
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it.each(['escape', 'backdrop', 'selection', 'hotkey'] as const)(
    'returns explicit mouse focus to its declared target after %s dismissal',
    async (dismissal) => {
      const { container } = await render(<ExplicitReturnFocusHarness />);
      const trigger = container.querySelector<HTMLButtonElement>('button')!;
      await userEvent.click(trigger);
      await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());
      await vi.waitFor(() =>
        expect(document.activeElement).toBe(document.querySelector('[role=combobox]')),
      );
      expect(document.querySelector('.lyra-cmdk')!.getAttribute('returnFocusTo')).toBeNull();

      if (dismissal === 'escape') {
        await userEvent.keyboard('{Escape}');
      } else if (dismissal === 'backdrop') {
        backdropDismiss(document.querySelector<HTMLElement>('.lyra-cmdk-overlay')!);
      } else if (dismissal === 'selection') {
        await userEvent.click(document.querySelector<HTMLButtonElement>('[role=option]')!);
      } else {
        document.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            key: 'k',
          }),
        );
      }

      await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
      expect(document.activeElement).toBe(trigger);
    },
  );

  it('does not resolve returnFocusTo when a parent ignores a close request', async () => {
    const resolver = vi.fn(() => document.createElement('button'));
    function IgnoredCloseHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open ignored close
          </button>
          <CommandPalette open={open} onClose={() => {}} returnFocusTo={resolver} groups={groups} />
        </>
      );
    }

    await render(<IgnoredCloseHarness />);
    await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('[role=combobox]')),
    );
    await userEvent.keyboard('{Escape}');
    expect(resolver).not.toHaveBeenCalled();
    expect(document.querySelector('.lyra-cmdk')!.contains(document.activeElement)).toBe(true);
  });

  it('uses a successor after the trigger is removed by the accepted closing commit', async () => {
    function RemovedTriggerHarness() {
      const [open, setOpen] = useState(false);
      const [showTrigger, setShowTrigger] = useState(true);
      const successorRef = useRef<HTMLHeadingElement>(null);
      return (
        <>
          {showTrigger && (
            <button type="button" onClick={() => setOpen(true)}>
              Remove me on close
            </button>
          )}
          <h2 ref={successorRef} tabIndex={-1}>
            Workflow successor
          </h2>
          <CommandPalette
            open={open}
            onClose={() => {
              setShowTrigger(false);
              setOpen(false);
            }}
            returnFocusTo={() => successorRef.current}
            groups={groups}
          />
        </>
      );
    }

    await render(<RemovedTriggerHarness />);
    await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('[role=combobox]')),
    );
    await userEvent.keyboard('{Escape}');
    const successor = document.querySelector<HTMLHeadingElement>('h2')!;
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
    expect(document.activeElement).toBe(successor);
  });

  it('uses the latest resolver and fresh captured opener once per accepted close during a rapid reopen', async () => {
    const exitStyle = document.createElement('style');
    exitStyle.textContent = `
      .lyra-cmdk--closing {
        animation-play-state: paused !important;
      }
      .lyra-cmdk--closing.lyra-test-cmdk-exit-running {
        animation-play-state: running !important;
      }
    `;

    const staleResolver = vi.fn(() => null);
    const latestResolver = vi.fn(() => null);
    const freshResolver = vi.fn(() => null);
    function ControlledRapidReopen({
      open,
      returnFocusTo,
    }: {
      open: boolean;
      returnFocusTo: () => null;
    }) {
      return (
        <>
          <button type="button">First keyboard opener</button>
          <button type="button">Second keyboard opener</button>
          <CommandPalette open={open} returnFocusTo={returnFocusTo} groups={groups} />
        </>
      );
    }

    async function act(callback: () => void | Promise<void>): Promise<void> {
      const previous = Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
      Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
      try {
        await reactAct(callback);
      } finally {
        Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previous);
      }
    }

    try {
      document.head.appendChild(exitStyle);
      const { rerender } = await render(
        <ControlledRapidReopen open={false} returnFocusTo={staleResolver} />,
      );
      const firstTrigger = document.querySelectorAll<HTMLButtonElement>('button')[0]!;
      const secondTrigger = document.querySelectorAll<HTMLButtonElement>('button')[1]!;
      firstTrigger.focus();
      await rerender(<ControlledRapidReopen open returnFocusTo={staleResolver} />);
      await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());
      const firstPanel = document.querySelector<HTMLElement>('.lyra-cmdk')!;
      await vi.waitFor(() => expect(firstPanel.contains(document.activeElement)).toBe(true));
      expect(firstPanel.isConnected).toBe(true);
      expect(document.querySelector('.lyra-cmdk')).toBe(firstPanel);

      await rerender(<ControlledRapidReopen open returnFocusTo={latestResolver} />);
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      await rerender(<ControlledRapidReopen open={false} returnFocusTo={latestResolver} />);
      expect(firstPanel.classList.contains('lyra-cmdk--closing')).toBe(true);
      expect(getComputedStyle(firstPanel).animationPlayState).toBe('paused');
      expect(latestResolver).toHaveBeenCalledTimes(1);
      expect(staleResolver).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(firstTrigger);
      expect(firstPanel.isConnected).toBe(true);
      expect(document.querySelector('.lyra-cmdk')).toBe(firstPanel);

      await rerender(<ControlledRapidReopen open={false} returnFocusTo={latestResolver} />);
      expect(latestResolver).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(249);
      });
      expect(firstPanel.isConnected).toBe(true);
      expect(document.querySelector('.lyra-cmdk')).toBe(firstPanel);

      secondTrigger.focus();
      await rerender(<ControlledRapidReopen open returnFocusTo={freshResolver} />);
      expect(firstPanel.classList.contains('lyra-cmdk--closing')).toBe(false);
      await act(async () => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      });
      expect(firstPanel.contains(document.activeElement)).toBe(true);
      expect(firstPanel.isConnected).toBe(true);
      expect(document.querySelector('.lyra-cmdk')).toBe(firstPanel);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(firstPanel.isConnected).toBe(true);
      expect(document.querySelector('.lyra-cmdk')).toBe(firstPanel);

      await rerender(<ControlledRapidReopen open={false} returnFocusTo={freshResolver} />);
      expect(freshResolver).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(secondTrigger);

      const exitFinished = new Promise<void>((resolve) => {
        firstPanel.addEventListener(
          'animationend',
          (event) => {
            expect(event).toBeInstanceOf(AnimationEvent);
            expect(event.target).toBe(firstPanel);
            expect(event.currentTarget).toBe(firstPanel);
            expect((event as AnimationEvent).animationName).toBe('lyra-overlay-out');
            resolve();
          },
          { once: true },
        );
      });
      await act(async () => {
        firstPanel.classList.add('lyra-test-cmdk-exit-running');
        await exitFinished;
      });
      expect(firstPanel.isConnected).toBe(false);
    } finally {
      exitStyle.remove();
      vi.useRealTimers();
    }
  });

  it.each(['panel', 'overlay'] as const)(
    'falls back to the prepared opener when returnFocusTo targets the closing %s',
    async (invalidTarget) => {
      function InvalidTargetHarness() {
        const [open, setOpen] = useState(false);
        const panelRef = useRef<HTMLDivElement>(null);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Prepared opener
            </button>
            <CommandPalette
              ref={panelRef}
              open={open}
              onClose={() => setOpen(false)}
              returnFocusTo={() =>
                invalidTarget === 'panel'
                  ? panelRef.current
                  : document.querySelector<HTMLElement>('.lyra-cmdk-overlay')
              }
              groups={groups}
            />
          </>
        );
      }

      const { container } = await render(<InvalidTargetHarness />);
      const opener = container.querySelector<HTMLButtonElement>('button')!;
      opener.focus();
      await userEvent.keyboard('{Enter}');
      await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());
      await vi.waitFor(() =>
        expect(document.activeElement).toBe(document.querySelector('[role=combobox]')),
      );
      await userEvent.keyboard('{Escape}');
      await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
      expect(document.activeElement).toBe(opener);
    },
  );

  it('ignores returnFocusTo across inline open toggles without disturbing input focus', async () => {
    const resolver = vi.fn(() => document.createElement('button'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { container, rerender } = await render(
        <CommandPalette inline open={false} returnFocusTo={resolver} groups={groups} />,
      );
      const input = container.querySelector<HTMLInputElement>('[role=combobox]')!;
      await vi.waitFor(() => expect(document.activeElement).toBe(input));

      await rerender(<CommandPalette inline open returnFocusTo={resolver} groups={groups} />);
      await rerender(
        <CommandPalette inline open={false} returnFocusTo={resolver} groups={groups} />,
      );

      expect(resolver).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(input);
    } finally {
      warn.mockRestore();
    }
  });

  it('dismisses only a complete backdrop gesture, not cross-boundary gestures', async () => {
    const onClose = vi.fn();
    await render(<CommandPalette open onClose={onClose} groups={groups} />);
    const overlay = document.querySelector<HTMLElement>('.lyra-cmdk-overlay')!;
    const panel = document.querySelector<HTMLElement>('.lyra-cmdk')!;
    const input = document.querySelector<HTMLInputElement>('[role=combobox]')!;

    await userEvent.fill(input, 'settings');
    panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
    expect(input.value).toBe('settings');

    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    panel.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
    expect(input.value).toBe('settings');

    backdropDismiss(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays mounted with closing motion until its panel animation ends', async () => {
    const { rerender } = await render(<CommandPalette open groups={groups} />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());

    await rerender(<CommandPalette open={false} groups={groups} />);
    await vi.waitFor(() => {
      expect(document.querySelector('.lyra-cmdk')?.classList.contains('lyra-cmdk--closing')).toBe(
        true,
      );
    });
    const closingPanel = document.querySelector<HTMLElement>('.lyra-cmdk')!;
    expect(
      document
        .querySelector('.lyra-cmdk-overlay')
        ?.classList.contains('lyra-cmdk-overlay--closing'),
    ).toBe(true);
    expect(getComputedStyle(closingPanel).animationName).toBe('lyra-overlay-out');

    closingPanel.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
  });

  it('toggles through the global Command/Ctrl+K listener only when onOpen is provided', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    await render(<HotkeyHarness onOpen={onOpen} onClose={onClose} />);
    const openEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: 'K',
    });
    document.dispatchEvent(openEvent);
    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1));
    expect(openEvent.defaultPrevented).toBe(true);
    const closeEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
      key: 'k',
    });
    document.dispatchEvent(closeEvent);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    await cleanup();
    const closeOnly = vi.fn();
    await render(<CommandPalette open={false} onClose={closeOnly} groups={groups} />);
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, ctrlKey: true, key: 'k' }),
    );
    expect(closeOnly).not.toHaveBeenCalled();
  });

  it('renders English hints by default and merges partial overrides', async () => {
    const { container } = await render(<CommandPalette inline groups={groups} />);
    expect(container.querySelector('.lyra-cmdk__footer')!.textContent).toContain('navigate');
    expect(container.querySelector('.lyra-cmdk__footer')!.textContent).toContain('select');
    expect(container.querySelector('.lyra-cmdk__footer')!.textContent).toContain('close');

    await cleanup();
    const { container: translated } = await render(
      <CommandPalette inline groups={groups} hints={{ navigate: 'navegar' }} />,
    );
    const footer = translated.querySelector('.lyra-cmdk__footer')!.textContent;
    // A partial override keeps the untouched hints on their defaults.
    expect(footer).toContain('navegar');
    expect(footer).toContain('select');
    expect(footer).toContain('close');
  });

  it('uses "Search commands" as the default accessible name for the search field', async () => {
    const { container } = await render(<CommandPalette inline groups={groups} />);
    expect(container.querySelector('[role=combobox]')!.getAttribute('aria-label')).toBe(
      'Search commands',
    );
  });

  it('uses searchLabel as the accessible name for the search field', async () => {
    const { container } = await render(
      <CommandPalette inline groups={groups} searchLabel="Pesquisar comandos" />,
    );
    expect(container.querySelector('[role=combobox]')!.getAttribute('aria-label')).toBe(
      'Pesquisar comandos',
    );
  });
});

describe('CommandPalette — logical close activity', () => {
  it('inerts its retained modal scope, revokes a prior gesture, and leaves inline behavior alone', async () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const initialFocusTo = vi.fn(() => null);
    const returnFocusTo = vi.fn(() => null);
    function LogicalCloseHarness() {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div data-testid="consumer-host">
          <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
            Open logical palette
          </button>
          <button type="button">Outside</button>
          <CommandPalette
            open={open}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
            onSelect={onSelect}
            groups={groups}
            returnFocusTo={() => triggerRef.current}
          />
        </div>
      );
    }

    const { container, rerender } = await render(<LogicalCloseHarness />);
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const outside = container.querySelectorAll<HTMLButtonElement>('button')[1]!;
    await userEvent.click(trigger);
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk-overlay')).not.toBeNull());
    const retainedOverlay = document.querySelector<HTMLElement>('.lyra-cmdk-overlay')!;
    const retainedPanel = document.querySelector<HTMLElement>('.lyra-cmdk')!;
    await vi.waitFor(() =>
      expect(retainedOverlay.querySelectorAll('[data-lyra-focus-trap-boundary]')).toHaveLength(2),
    );
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('.lyra-cmdk input')),
    );
    const retainedGuards = Array.from(
      retainedOverlay.querySelectorAll<HTMLElement>('[data-lyra-focus-trap-boundary]'),
    );
    expect(retainedGuards).toHaveLength(2);
    expect(retainedGuards.every((guard) => retainedOverlay.contains(guard))).toBe(true);
    retainedOverlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(retainedOverlay.hasAttribute('inert')).toBe(true));
    expect(retainedOverlay.hasAttribute('inert')).toBe(true);
    expect(retainedOverlay.isConnected).toBe(true);
    expect(retainedOverlay.contains(retainedPanel)).toBe(true);
    expect(retainedPanel.getAttribute('aria-modal')).toBeNull();
    expect(retainedGuards.every((guard) => !guard.isConnected)).toBe(true);
    expect(container.querySelector('[data-testid="consumer-host"]')!.hasAttribute('inert')).toBe(
      false,
    );
    expect(outside.closest('[inert]')).toBeNull();
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    retainedPanel.focus();
    expect(document.activeElement).not.toBe(retainedPanel);

    await userEvent.click(trigger);
    await vi.waitFor(() =>
      expect(document.querySelector('.lyra-cmdk-overlay')).toBe(retainedOverlay),
    );
    expect(document.querySelector('.lyra-cmdk')).toBe(retainedPanel);
    retainedOverlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    retainedOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await rerender(
      <div data-testid="consumer-host">
        <button type="button">Outside</button>
        <CommandPalette
          inline
          initialFocusTo={initialFocusTo}
          returnFocusTo={returnFocusTo}
          onSelect={onSelect}
          groups={groups}
        />
      </div>,
    );
    const inlineItem = container.querySelector<HTMLButtonElement>('.lyra-cmdk__item')!;
    const inlineOutside = container.querySelector<HTMLButtonElement>('button')!;
    expect(inlineItem.closest('[inert]')).toBeNull();
    expect(inlineItem.closest('[aria-modal="true"]')).toBeNull();
    expect(inlineOutside.closest('[inert]')).toBeNull();
    await userEvent.click(inlineItem);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(initialFocusTo).not.toHaveBeenCalled();
    expect(returnFocusTo).not.toHaveBeenCalled();
  });
});
