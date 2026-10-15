import { StrictMode, createRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { AppSidebar, AppSidebarOffcanvas, AppSidebarTrigger } from './index';
import { Drawer } from '../drawer';
import '@lyra-ds/styles/styles.css';

afterEach(cleanup);

function key(target: Element, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: 'b',
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function Controlled({ id = 'workspace' }: { id?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      <AppSidebarTrigger
        controls={id}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        hotkey
      />
      <AppSidebar
        id={id}
        collapsed={collapsed}
        groups={[{ items: [{ id: 'reports', label: 'Reports' }] }]}
      />
    </>
  );
}

describe('native sidebar controls', () => {
  it('preserves button/ref/ARIA, cancels clicks and keeps 44px targets even at sm', async () => {
    const ref = createRef<HTMLButtonElement>();
    const change = vi.fn();
    const screen = await render(
      <AppSidebarTrigger
        ref={ref}
        controls="nav"
        collapsed={false}
        onCollapsedChange={change}
        size="sm"
        type="submit"
        onClick={(event) => event.preventDefault()}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Toggle sidebar' });
    await trigger.click();
    expect(change).not.toHaveBeenCalled();
    expect(ref.current?.type).toBe('button');
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(ref.current!.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(ref.current!.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });

  it('uses current controlled state and reconciles navigation focus without stealing main focus', async () => {
    const screen = await render(
      <StrictMode>
        <Controlled />
        <button>Main action</button>
      </StrictMode>,
    );
    const report = screen.getByRole('button', { name: 'Reports' });
    report.element().focus();
    await userEvent.keyboard('{Control>}b{/Control}');
    await expect.element(screen.getByRole('button', { name: 'Toggle sidebar' })).toHaveFocus();
    await expect
      .element(screen.getByRole('button', { name: 'Toggle sidebar' }))
      .toHaveAttribute('aria-expanded', 'false');
    screen.getByRole('button', { name: 'Main action' }).element().focus();
    await userEvent.keyboard('{Control>}b{/Control}');
    await expect.element(screen.getByRole('button', { name: 'Main action' })).toHaveFocus();
    await expect
      .element(screen.getByRole('button', { name: 'Toggle sidebar' }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('ignores modifiers, repeats, IME, editable ancestry, cancellation and disabled owners', async () => {
    const change = vi.fn();
    const screen = await render(
      <>
        <AppSidebarTrigger controls="nav" collapsed hotkey onCollapsedChange={change} />
        <div id="nav">
          <input aria-label="Search" />
          <textarea aria-label="Notes" />
          <select aria-label="Choice">
            <option>One</option>
          </select>
          <div contentEditable suppressContentEditableWarning>
            <span>Editable</span>
          </div>
        </div>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Toggle sidebar' }).element();
    for (const init of [
      { altKey: true },
      { shiftKey: true },
      { repeat: true },
      { isComposing: true },
      { keyCode: 229 },
      { ctrlKey: false },
    ]) {
      expect(key(trigger, init).defaultPrevented).toBe(false);
    }
    for (const target of screen.container.querySelectorAll(
      'input, textarea, select, [contenteditable] span',
    ))
      key(target);
    const prevented = new KeyboardEvent('keydown', {
      key: 'b',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    prevented.preventDefault();
    trigger.dispatchEvent(prevented);
    expect(change).not.toHaveBeenCalled();
    await screen.rerender(
      <AppSidebarTrigger controls="nav" collapsed hotkey disabled onCollapsedChange={change} />,
    );
    expect(key(document.body).defaultPrevented).toBe(false);
    expect(change).not.toHaveBeenCalled();
  });

  it('deduplicates logical owners, selects deepest scopes and declines sibling ambiguity', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const sibling = vi.fn();
    const screen = await render(
      <>
        <AppSidebarTrigger
          label="Outer"
          controls="outer"
          collapsed
          hotkey
          onCollapsedChange={outer}
        />
        <AppSidebarTrigger
          label="Duplicate"
          controls="outer"
          collapsed
          hotkey
          onCollapsedChange={outer}
        />
        <div id="outer">
          <button>Outer content</button>
          <AppSidebarTrigger
            label="Inner"
            controls="inner"
            collapsed
            hotkey
            onCollapsedChange={inner}
          />
          <div id="inner">
            <button>Inner content</button>
          </div>
        </div>
        <AppSidebarTrigger
          label="Sibling"
          controls="sibling"
          collapsed
          hotkey
          onCollapsedChange={sibling}
        />
        <div id="sibling">
          <button>Sibling content</button>
        </div>
      </>,
    );
    expect(key(document.body).defaultPrevented).toBe(false);
    key(screen.getByRole('button', { name: 'Inner content' }).element());
    expect(inner).toHaveBeenCalledExactlyOnceWith(false);
    expect(outer).not.toHaveBeenCalled();
    key(screen.getByRole('button', { name: 'Outer content' }).element());
    expect(outer).toHaveBeenCalledExactlyOnceWith(false);
    expect(sibling).not.toHaveBeenCalled();
    await screen.unmount();
    expect(key(document.body).defaultPrevented).toBe(false);
  });

  it('lets the active offcanvas close from its panel while its trigger is inert', async () => {
    const panel = createRef<HTMLDivElement>();
    const nav = createRef<HTMLElement>();
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <AppSidebarTrigger
            controls="panel"
            collapsed={!open}
            hotkey
            onCollapsedChange={(value) => setOpen(!value)}
          />
          <AppSidebarOffcanvas
            ref={panel}
            id="panel"
            title="Workspace"
            open={open}
            onClose={() => setOpen(false)}
          >
            <AppSidebar
              ref={nav}
              aria-label="Application"
              groups={[{ items: [{ id: 'reports', label: 'Reports' }] }]}
            />
          </AppSidebarOffcanvas>
        </>
      );
    }
    const screen = await render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Toggle sidebar' });
    trigger.element().focus();
    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByRole('dialog', { name: 'Workspace' })).toBeInTheDocument();
    expect(panel.current?.contains(nav.current)).toBe(true);
    expect(nav.current?.tagName).toBe('NAV');
    expect(trigger.element().closest('[inert]')).not.toBeNull();
    screen.getByRole('button', { name: 'Reports' }).element().focus();
    await userEvent.keyboard('{Control>}b{/Control}');
    await expect.element(screen.getByRole('dialog', { name: 'Workspace' })).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it('suppresses a background shortcut while an unrelated Drawer owns interaction', async () => {
    const change = vi.fn();
    const screen = await render(
      <>
        <AppSidebarTrigger controls="nav" collapsed hotkey onCollapsedChange={change} />
        <AppSidebar id="nav" />
        <Drawer open title="Other task">
          <button>Modal action</button>
        </Drawer>
      </>,
    );
    key(screen.getByRole('button', { name: 'Modal action' }).element());
    expect(change).not.toHaveBeenCalled();
  });

  it('registers only with the trigger ownerDocument and cleans up its current callback', async () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const doc = iframe.contentDocument!;
    const first = vi.fn();
    const current = vi.fn();
    try {
      const screen = await render(
        createPortal(
          <AppSidebarTrigger controls="iframe-nav" collapsed hotkey onCollapsedChange={first} />,
          doc.body,
        ),
      );
      key(document.body);
      expect(first).not.toHaveBeenCalled();
      expect(key(doc.body).defaultPrevented).toBe(true);
      expect(first).toHaveBeenCalledExactlyOnceWith(false);
      await screen.rerender(
        createPortal(
          <AppSidebarTrigger
            controls="iframe-nav"
            collapsed={false}
            hotkey
            onCollapsedChange={current}
          />,
          doc.body,
        ),
      );
      key(doc.body);
      expect(current).toHaveBeenCalledExactlyOnceWith(true);
      expect(first).toHaveBeenCalledOnce();
      await screen.unmount();
      expect(key(doc.body).defaultPrevented).toBe(false);
    } finally {
      iframe.remove();
    }
  });

  it.each([
    { name: 'default props', props: {} },
    { name: 'expanded with rail hints enabled', props: { collapsed: false, railTooltips: true } },
    { name: 'collapsed without rail hints', props: { collapsed: true, railTooltips: false } },
  ])('preserves legacy router selection with $name', async ({ props }) => {
    const calls: string[] = [];
    const ref = createRef<HTMLAnchorElement>();
    const screen = await render(
      <AppSidebar
        {...props}
        groups={[
          {
            items: [
              {
                id: 'reports',
                label: 'Reports',
                onSelect: () => calls.push('item'),
                asChild: (
                  <a
                    ref={ref}
                    aria-label="Reports"
                    href="/reports"
                    onClick={(event) => {
                      event.preventDefault();
                      calls.push('router');
                    }}
                  />
                ),
              },
            ],
          },
        ]}
        onSelect={(id) => calls.push(`sidebar:${id}`)}
      />,
    );
    const link = screen.getByRole('link', { name: 'Reports' });
    await link.click();
    expect(calls).toEqual(['router', 'item', 'sidebar:reports']);
    expect(ref.current).toBe(link.element());
    await expect.element(link).toHaveAttribute('href', '/reports');
  });

  it('preserves rail router cancellation, names and clipping-safe focus hints', async () => {
    const select = vi.fn();
    const child = vi.fn();
    const ref = createRef<HTMLAnchorElement>();
    const screen = await render(
      <AppSidebar
        collapsed
        railTooltips
        density="compact"
        groups={[
          {
            items: [
              {
                id: 'reports',
                label: 'Reports',
                active: true,
                asChild: (
                  <a
                    ref={ref}
                    aria-label="Reports"
                    href="/reports"
                    onClick={(event) => {
                      event.preventDefault();
                      child();
                    }}
                  />
                ),
              },
            ],
          },
        ]}
        onSelect={select}
      />,
    );
    const link = screen.getByRole('link', { name: 'Reports' });
    await link.click();
    expect(child).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
    expect(ref.current).toBe(link.element());
    await expect.element(link).toHaveAttribute('aria-current', 'page');
    await expect.element(link).not.toHaveAttribute('title');
    await expect.element(page.getByRole('tooltip')).toBeVisible();
  });
});
