import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Dropdown } from './index';
import { Button } from '../button';

const themes = ['light', 'dark'] as const;
const items = [
  { type: 'label' as const, label: 'Actions' },
  { id: 'edit', label: 'Edit' },
  { type: 'separator' as const },
  { id: 'archive', label: 'Archive', danger: true },
];

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

async function waitForEntryAnimation(element: HTMLElement): Promise<void> {
  await Promise.all(element.getAnimations().map((animation) => animation.finished));
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Dropdown', () => {
  for (const theme of themes) {
    it(`emits exact navigation classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Dropdown trigger={<span>More actions</span>} items={items} align="end" defaultOpen />,
        );
        expect(container.querySelector('.lyra-dropdown')!.className).toBe('lyra-dropdown');
        expect(container.querySelector('[role=button]')!.className).toBe('lyra-dropdown__trigger');
        expect(container.querySelector('[role=menu]')!.className).toBe('lyra-menu lyra-menu--end');
        expect(container.querySelector('[role=menuitem]')!.className).toBe('lyra-menu__item');
        expect(container.querySelector('.lyra-menu__item--danger')!.className).toBe(
          'lyra-menu__item lyra-menu__item--danger',
        );
        expect(container.querySelector('.lyra-menu__label')!.className).toBe('lyra-menu__label');
        expect(container.querySelector('.lyra-menu__sep')!.className).toBe('lyra-menu__sep');
        expect(errorSpy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it.each([
    { name: 'inherited LTR default start', direction: 'ltr', edge: 'left' },
    { name: 'inherited RTL default start', direction: 'rtl', edge: 'right' },
    { name: 'inherited LTR explicit start', direction: 'ltr', align: 'start', edge: 'left' },
    { name: 'inherited LTR explicit end', direction: 'ltr', align: 'end', edge: 'right' },
    { name: 'inherited RTL explicit start', direction: 'rtl', align: 'start', edge: 'right' },
    { name: 'inherited RTL explicit end', direction: 'rtl', align: 'end', edge: 'left' },
    {
      name: 'nested LTR default start within RTL',
      direction: 'rtl',
      nestedDirection: 'ltr',
      edge: 'left',
    },
  ] as const)(
    'aligns $name logically after its entry animation',
    async ({ direction, nestedDirection, align, edge }) => {
      const { container } = await render(
        <div dir={direction}>
          <div dir={nestedDirection}>
            <Dropdown
              defaultOpen
              align={align}
              items={items}
              style={{ left: 300, position: 'fixed', top: 160 }}
              trigger={
                <button type="button" style={{ height: 32, width: 120 }}>
                  Actions
                </button>
              }
            />
          </div>
        </div>,
      );
      const anchor = container.querySelector<HTMLElement>('.lyra-dropdown')!;
      const popup = container.querySelector<HTMLElement>('[role="menu"]')!;

      await waitForEntryAnimation(popup);

      expect(popup.getBoundingClientRect()[edge]).toBeCloseTo(anchor.getBoundingClientRect()[edge]);
    },
  );

  it('makes a Button trigger the control itself: one tab stop, the ARIA on the focused element', async () => {
    const { container } = await render(
      <Dropdown trigger={<Button variant="secondary">Project actions</Button>} items={items} />,
    );

    // No wrapper element around the button: the button IS the trigger.
    const trigger = container.querySelector<HTMLElement>('.lyra-dropdown__trigger')!;
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.className).toContain('lyra-btn');
    expect(trigger.querySelector('button')).toBeNull();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // Exactly one focusable node for the control, and it is the one carrying the menu semantics.
    const focusable = container.querySelectorAll('button, [tabindex="0"], [role="button"]');
    expect(focusable).toHaveLength(1);
    expect(focusable[0]).toBe(trigger);

    // It still opens, and axe sees no nested-interactive.
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(container.querySelector('[role=menu]')).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await expectNoAxeViolations(container);
  });

  it('still wraps a bare string trigger in its own button-role span', async () => {
    const { container } = await render(<Dropdown trigger="Actions" items={items} />);
    const trigger = container.querySelector<HTMLElement>('.lyra-dropdown__trigger')!;
    expect(trigger.tagName).toBe('SPAN');
    expect(trigger.getAttribute('role')).toBe('button');
    expect(trigger.tabIndex).toBe(0);
  });

  it('opens on trigger keys and moves real DOM focus through menu commands', async () => {
    const { container } = await render(<Dropdown trigger="Actions" items={items} />);
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.keyboard('{Escape}');
    expect(container.querySelector('[role=menu]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{ArrowUp}');
    const reopened = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    expect(document.activeElement).toBe(reopened[1]);
  });

  it('keeps one roving command tab stop and updates it for keyboard and direct focus', async () => {
    const { container } = await render(<Dropdown trigger="Actions" items={items} defaultOpen />);
    const commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');

    expect([...commands].filter((command) => command.tabIndex === 0)).toHaveLength(1);
    expect(commands[0].tabIndex).toBe(0);
    expect(commands[1].tabIndex).toBe(-1);

    commands[1].focus();
    await vi.waitFor(() => expect(commands[1].tabIndex).toBe(0));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(commands[0]);
    expect(commands[0].tabIndex).toBe(0);
    expect(commands[1].tabIndex).toBe(-1);
  });

  it('finds command labels with typeahead without searching icons or group labels', async () => {
    const { container } = await render(
      <Dropdown
        trigger="Actions"
        defaultOpen
        items={[
          { type: 'label', label: 'Archive group' },
          { id: 'edit', icon: <span>Archive icon</span>, label: <span>Edit</span> },
          { id: 'archive', label: <strong>Archive</strong> },
          { id: 'add', label: 'Add' },
          { id: 'apply', label: 'Apply' },
          { id: 'angstrom', label: 'Ångström' },
        ]}
      />,
    );
    let commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    commands[0].focus();

    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('p');
    expect(document.activeElement).toBe(commands[3]);

    await userEvent.keyboard('{Escape}{Enter}');
    commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    commands[3].focus();
    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[2]);
  });

  it('resets the typeahead prefix after 500ms', async () => {
    vi.useFakeTimers();
    try {
      const { container } = await render(
        <Dropdown
          trigger="Actions"
          defaultOpen
          items={[
            { id: 'edit', label: 'Edit' },
            { id: 'archive', label: 'Archive' },
          ]}
        />,
      );
      const commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
      commands[0].focus();

      commands[0].dispatchEvent(
        new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'a' }),
      );
      await Promise.resolve();
      expect(document.activeElement).toBe(commands[1]);

      await vi.advanceTimersByTimeAsync(500);
      commands[1].dispatchEvent(
        new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'e' }),
      );
      await Promise.resolve();
      expect(document.activeElement).toBe(commands[0]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps an unmatched prefix local to the current menu session', async () => {
    const { container } = await render(
      <Dropdown
        trigger="Actions"
        defaultOpen
        items={[
          { id: 'edit', label: 'Edit' },
          { id: 'archive', label: 'Archive' },
        ]}
      />,
    );
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    let commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');

    commands[0].focus();
    await userEvent.keyboard('z');
    expect(document.activeElement).toBe(commands[0]);

    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.click(trigger);
    await userEvent.click(trigger);
    commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    commands[0].focus();
    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[1]);
  });

  it('clears a partial prefix on reopen and matches synthetic Unicode on the live menu', async () => {
    const { container } = await render(
      <Dropdown
        trigger="Actions"
        defaultOpen
        items={[
          { id: 'edit', label: 'Edit' },
          { id: 'archive', label: 'Archive' },
          { id: 'angstrom', label: 'Ångström' },
        ]}
      />,
    );
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    let commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');

    commands[0].focus();
    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Enter}');
    commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    commands[0].focus();
    await userEvent.keyboard('r');
    expect(document.activeElement).toBe(commands[0]);

    await userEvent.keyboard('{Escape}{Enter}');
    commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    commands[0].focus();
    // Synthetic: Playwright's keyboard API does not emit Unicode `å` keydown events.
    commands[0].dispatchEvent(
      new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'å' }),
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(commands[2]));
    expect(document.activeElement).not.toBe(trigger);
  });

  it('does not typeahead on modifier or composition input', async () => {
    const { container } = await render(
      <Dropdown
        trigger="Actions"
        defaultOpen
        items={[
          { id: 'edit', label: 'Edit' },
          { id: 'archive', label: 'Archive' },
        ]}
      />,
    );
    const command = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    command.focus();

    for (const options of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { isComposing: true },
    ]) {
      command.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'a',
          ...options,
        }),
      );
      expect(document.activeElement).toBe(command);
    }
  });

  it('maintains exactly one roving owner through empty and changed command collections', async () => {
    const { container, rerender } = await render(
      <Dropdown
        trigger="Actions"
        defaultOpen
        items={[
          { id: 'edit', label: 'Edit' },
          { type: 'separator' },
          { id: 'archive', label: 'Archive' },
        ]}
      />,
    );
    let commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    commands[1].focus();
    await vi.waitFor(() =>
      expect([...commands].map((command) => command.tabIndex)).toEqual([-1, 0]),
    );

    await rerender(<Dropdown trigger="Actions" defaultOpen items={[]} />);
    expect(container.querySelectorAll('[role=menuitem]')).toHaveLength(0);
    await rerender(
      <Dropdown
        trigger="Actions"
        defaultOpen
        items={[
          { id: 'archive', label: 'Archive' },
          { type: 'label', label: 'Actions' },
          { id: 'edit', label: 'Edit' },
        ]}
      />,
    );
    commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    expect([...commands].filter((command) => command.tabIndex === 0)).toHaveLength(1);
    expect([...commands].map((command) => command.tabIndex)).toEqual([-1, 0]);
  });

  it('keeps capture, child cancellation, and root bubble callbacks in native order', async () => {
    const calls: string[] = [];
    const onSelect = vi.fn();
    const onClickCapture = vi.fn(() => calls.push('capture-click'));
    const onClick = vi.fn((event: MouseEvent<HTMLSpanElement>) => {
      calls.push('bubble-click');
      expect(event.currentTarget).toBe(document.querySelector('.lyra-dropdown'));
      expect(event.eventPhase).toBe(Event.BUBBLING_PHASE);
      expect(event.defaultPrevented).toBe(true);
    });
    const { container } = await render(
      <Dropdown
        trigger="Actions"
        items={[
          {
            id: 'edit',
            label: 'Edit',
            onSelect,
          },
        ]}
        defaultOpen
        onClickCapture={onClickCapture}
        onClick={onClick}
      />,
    );
    const command = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    command.addEventListener('click', (event) => {
      calls.push('child-click');
      event.preventDefault();
    });
    await userEvent.click(command);
    expect(calls).toEqual(['capture-click', 'child-click', 'bubble-click']);
    expect(onClickCapture).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
    expect(container.querySelector('[role=menu]')).not.toBeNull();
  });

  it('lets the root cancel navigation, Tab, Escape, and keyboard activation once', async () => {
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLSpanElement>) => {
      expect(event.currentTarget).toBe(document.querySelector('.lyra-dropdown'));
      expect(event.eventPhase).toBe(Event.BUBBLING_PHASE);
      event.preventDefault();
    });
    const onClick = vi.fn((event: MouseEvent<HTMLSpanElement>) => event.preventDefault());
    const onSelect = vi.fn();
    const { container } = await render(
      <Dropdown
        trigger="Actions"
        items={[
          { id: 'edit', label: 'Edit', onSelect },
          { id: 'archive', label: 'Archive' },
        ]}
        defaultOpen
        onKeyDown={onKeyDown}
        onClick={onClick}
      />,
    );
    const command = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    command.focus();

    await userEvent.keyboard('{ArrowDown}{Tab}{Escape}{Enter}');
    expect(onKeyDown).toHaveBeenCalledTimes(4);
    expect(onClick).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(container.querySelector('[role=menu]')).not.toBeNull();
    expect(document.activeElement).toBe(command);

    await userEvent.click(command);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
    expect(container.querySelector('[role=menu]')).not.toBeNull();
  });

  it('selects the clicked command when the consumer synchronously reorders the items', async () => {
    const onAlpha = vi.fn();
    const onBeta = vi.fn();
    function Example() {
      const [commands, setCommands] = useState([
        { id: 'alpha', label: 'Alpha', onSelect: onAlpha },
        { id: 'beta', label: 'Beta', onSelect: onBeta },
      ]);
      return (
        <Dropdown
          defaultOpen
          trigger="Actions"
          items={commands}
          onClick={() => flushSync(() => setCommands((current) => [...current].reverse()))}
        />
      );
    }
    const { container } = await render(<Example />);
    await userEvent.click(container.querySelectorAll<HTMLButtonElement>('[role=menuitem]')[1]);
    expect(onBeta).toHaveBeenCalledOnce();
    expect(onAlpha).not.toHaveBeenCalled();
    expect(container.querySelector('[role=menu]')).toBeNull();
  });

  it.each(['{Enter}', ' '])('activates a command once with %s and closes normally', async (key) => {
    const onSelect = vi.fn();
    const { container } = await render(
      <Dropdown defaultOpen trigger="Actions" items={[{ id: 'edit', label: 'Edit', onSelect }]} />,
    );
    container.querySelector<HTMLButtonElement>('[role=menuitem]')!.focus();
    await userEvent.keyboard(key);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(container.querySelector('[role=menu]')).toBeNull();
    expect(document.activeElement).toBe(container.querySelector('[role=button]'));
  });

  it('cancels the pending typeahead timer when unmounted', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    try {
      const { container, unmount } = await render(
        <Dropdown trigger="Actions" defaultOpen items={[{ id: 'archive', label: 'Archive' }]} />,
      );
      const command = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
      command.focus();
      command.dispatchEvent(
        new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'a' }),
      );
      const timerIndex = setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === 500);
      expect(timerIndex).toBeGreaterThanOrEqual(0);
      const timer = setTimeoutSpy.mock.results[timerIndex].value;
      await unmount();
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timer);
      await vi.advanceTimersByTimeAsync(500);
    } finally {
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('selects commands, restores trigger focus, and lets Tab leave the menu', async () => {
    const onSelect = vi.fn();
    const { container } = await render(
      <>
        <Dropdown trigger="Actions" items={[{ id: 'edit', label: 'Edit', onSelect }]} />
        {/* WebKit skips implicit button tab stops; declare the native destination explicitly. */}
        <button type="button" tabIndex={0}>
          After
        </button>
      </>,
    );
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    await userEvent.click(trigger);
    const command = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    await userEvent.click(command);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(container.querySelector('[role=menu]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Enter}');
    const reopened = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    await userEvent.keyboard('{Tab}');
    expect(container.querySelector('[role=menu]')).toBeNull();
    expect(document.activeElement).not.toBe(reopened);
  });

  it('lets Tab and Shift+Tab continue to their native adjacent controls after closing', async () => {
    const { container } = await render(
      <>
        <button type="button">Before</button>
        <Dropdown trigger="Actions" items={[{ id: 'edit', label: 'Edit' }]} />
        {/* WebKit skips implicit button tab stops; declare the native destination explicitly. */}
        <button type="button" tabIndex={0}>
          After
        </button>
      </>,
    );
    const buttons = container.querySelectorAll<HTMLButtonElement>('button');
    const before = buttons[0]!;
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    const after = buttons[1]!;

    await userEvent.click(trigger);
    let command = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    command.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(after);

    await userEvent.click(trigger);
    command = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    command.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(trigger);
    expect(document.activeElement).not.toBe(before);
  });

  it('flips the menu above the trigger instead of scrolling the page when there is no room below', async () => {
    const { container } = await render(
      <>
        <div style={{ height: 'calc(100vh - 80px)' }} />
        <Dropdown trigger="Actions" items={items} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    const scrollBefore = window.scrollY;
    await userEvent.click(trigger);
    expect(container.querySelector('[role=menu]')!.className).toContain('lyra-menu--up');
    expect(window.scrollY).toBe(scrollBefore);
  });

  it('keeps the menu below the trigger when it fits', async () => {
    const { container } = await render(
      <>
        <Dropdown trigger="Actions" items={items} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    await userEvent.click(container.querySelector<HTMLElement>('[role=button]')!);
    expect(container.querySelector('[role=menu]')!.className).not.toContain('lyra-menu--up');
  });
});
