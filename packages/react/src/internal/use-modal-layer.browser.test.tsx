import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { StrictMode, useCallback, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { userEvent } from 'vitest/browser';
import '@lyra-ds/styles/styles.css';
import { Dialog } from '../dialog';
import { Drawer } from '../drawer';
import { CommandPalette } from '../command-palette';
import { ModalLayerProvider, useModalLayer, useModalLayerRegistration } from './use-modal-layer';

function LayerHarness({
  open,
  label,
  portal = false,
  children,
}: {
  open: boolean;
  label: string;
  portal?: boolean;
  children?: ReactNode;
}): ReactNode {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  const layer = useModalLayer(open, panelRef);
  useModalLayerRegistration(layer, overlay);
  const attachOverlay = useCallback((node: HTMLDivElement | null) => {
    overlayRef.current = node;
    setOverlay(node);
  }, []);

  const content = (
    <div ref={attachOverlay}>
      <div
        ref={panelRef}
        role="dialog"
        aria-label={label}
        aria-modal={layer.effectiveOpen || undefined}
      >
        {children}
      </div>
    </div>
  );

  return (
    <ModalLayerProvider layer={layer}>
      {portal ? createPortal(content, document.body) : content}
    </ModalLayerProvider>
  );
}

afterEach(async () => {
  await cleanup();
});

function PublicBranches({
  parentOpen = true,
  childOpen = false,
  childPresent = true,
  customHost = false,
  onParentClose,
  initialFocusTo,
  childReturnFocusTo,
}: {
  parentOpen?: boolean;
  childOpen?: boolean;
  childPresent?: boolean;
  customHost?: boolean;
  onParentClose?: () => void;
  initialFocusTo?: () => HTMLElement | null;
  childReturnFocusTo?: () => HTMLElement | null;
}): ReactNode {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <button type="button" aria-label="Page opener" tabIndex={0}>
        Open task
      </button>
      <input aria-label="Background field" />
      <Dialog
        open={parentOpen}
        title="Parent modal"
        aria-label="Parent modal"
        onClose={onParentClose}
        initialFocusTo={initialFocusTo}
      >
        <button type="button" aria-label="Parent action" tabIndex={0}>
          Continue task
        </button>
        <input aria-label="Parent field" />
        {customHost && <div ref={setHost} />}
        {childPresent && (!customHost || host) && (
          <Drawer
            open={childOpen}
            title="Child modal"
            aria-label="Child modal"
            container={customHost ? (host ?? undefined) : undefined}
            returnFocusTo={childReturnFocusTo}
          >
            <input aria-label="Child field" />
          </Drawer>
        )}
      </Dialog>
    </>
  );
}

function namedElement<T extends HTMLElement = HTMLElement>(name: string): T {
  const element = document.querySelector<T>(`[aria-label="${name}"]`);
  if (!element) throw new Error(`Missing fixture element: ${name}`);
  return element;
}

async function expectOwnedFocus(name: string): Promise<void> {
  await vi.waitFor(() => {
    const panel = namedElement(name);
    expect(document.activeElement?.closest('[role="dialog"][aria-modal="true"]')).toBe(panel);
    expect(document.activeElement?.closest('[inert]')).toBeNull();
  });
}

describe('public modal branch lifetime', () => {
  it('returns directly to the accepted child successor without intermediate parent focus', async () => {
    const successor = () => namedElement('Parent field');
    const screen = await render(<PublicBranches childReturnFocusTo={successor} />);
    await expectOwnedFocus('Parent modal');
    namedElement('Parent action').focus();
    await screen.rerender(<PublicBranches childOpen childReturnFocusTo={successor} />);
    await expectOwnedFocus('Child modal');
    const focused: EventTarget[] = [];
    const parent = namedElement('Parent modal');
    const record = (event: FocusEvent): void => {
      if (event.target) focused.push(event.target);
    };
    parent.addEventListener('focusin', record);
    try {
      await screen.rerender(<PublicBranches childReturnFocusTo={successor} />);
      await vi.waitFor(() => expect(document.activeElement).toBe(successor()));
      expect(focused).toEqual([successor()]);
    } finally {
      parent.removeEventListener('focusin', record);
    }
  });

  it('silently closes a suspended sibling without a resolver call or focus theft', async () => {
    const resolve = vi.fn(() => null);
    function Fixture({ lower, front }: { lower: boolean; front: boolean }): ReactNode {
      return (
        <>
          <Drawer open={lower} title="Lower modal" returnFocusTo={resolve}>
            <input aria-label="Lower field" />
          </Drawer>
          <Dialog open={front} title="Front modal" aria-label="Front modal">
            <input aria-label="Front field" />
          </Dialog>
        </>
      );
    }
    const screen = await render(<Fixture lower front={false} />);
    await screen.rerender(<Fixture lower front />);
    await expectOwnedFocus('Front modal');
    const focused = document.activeElement;
    const warn = vi.spyOn(console, 'warn');
    try {
      await screen.rerender(<Fixture lower={false} front />);
      await expectOwnedFocus('Front modal');
      expect(document.activeElement).toBe(focused);
      expect(resolve).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('preserves an application inert value throughout isolation and final release', async () => {
    const existing = document.createElement('section');
    existing.setAttribute('inert', 'application-owned');
    document.body.append(existing);
    const screen = await render(<PublicBranches />);
    try {
      await expectOwnedFocus('Parent modal');
      expect(existing.getAttribute('inert')).toBe('application-owned');
      await screen.unmount();
      expect(existing.getAttribute('inert')).toBe('application-owned');
    } finally {
      await screen.unmount();
      existing.remove();
    }
  });

  it('revokes backdrop provenance when a child suspends and then releases its parent', async () => {
    const onClose = vi.fn();
    const screen = await render(<PublicBranches onParentClose={onClose} />);
    await expectOwnedFocus('Parent modal');
    const overlay = namedElement('Parent modal').parentElement!;
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await screen.rerender(<PublicBranches childOpen onParentClose={onClose} />);
    await expectOwnedFocus('Child modal');
    await screen.rerender(<PublicBranches onParentClose={onClose} />);
    await expectOwnedFocus('Parent modal');
    overlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('preserves a suspended palette query and ignores its global shortcut', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    function Fixture({ front }: { front: boolean }): ReactNode {
      return (
        <>
          <CommandPalette open aria-label="Palette modal" onOpen={onOpen} onClose={onClose} />
          <Dialog open={front} title="Front modal" aria-label="Front modal">
            <input aria-label="Front field" />
          </Dialog>
        </>
      );
    }
    const screen = await render(<Fixture front={false} />);
    await expectOwnedFocus('Palette modal');
    const input = namedElement<HTMLInputElement>('Search commands');
    await userEvent.fill(input, 'billing');
    await screen.rerender(<Fixture front />);
    await expectOwnedFocus('Front modal');
    expect(input.value).toBe('billing');
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    await expectOwnedFocus('Front modal');
    await screen.rerender(<Fixture front={false} />);
    await expectOwnedFocus('Palette modal');
    expect(input.value).toBe('billing');
  });

  it('restores the last safe parent task control when the focused child unmounts', async () => {
    const initial = vi.fn(() => namedElement('Parent action'));
    const screen = await render(<PublicBranches initialFocusTo={initial} />);
    await expectOwnedFocus('Parent modal');
    const action = namedElement('Parent action');
    expect(document.activeElement).toBe(action);
    await screen.rerender(<PublicBranches childOpen initialFocusTo={initial} />);
    await expectOwnedFocus('Child modal');
    await screen.rerender(<PublicBranches childPresent={false} initialFocusTo={initial} />);
    await vi.waitFor(() => expect(document.activeElement).toBe(action));
    expect(initial).toHaveBeenCalledTimes(1);
    expect(namedElement('Background field').closest('[inert]')).not.toBeNull();
  });

  it('releases surrounding parent controls before restoring from a nested DOM portal', async () => {
    const screen = await render(<PublicBranches customHost />);
    await expectOwnedFocus('Parent modal');
    const action = namedElement('Parent action');
    action.focus();
    await screen.rerender(<PublicBranches customHost childOpen />);
    await expectOwnedFocus('Child modal');
    expect(action.closest('[inert]')).not.toBeNull();
    expect(namedElement('Child modal').closest('[inert]')).toBeNull();
    await screen.rerender(<PublicBranches customHost />);
    await vi.waitFor(() => expect(document.activeElement).toBe(action));
    expect(action.closest('[inert]')).toBeNull();
    expect(namedElement('Background field').closest('[inert]')).not.toBeNull();
  });

  it('restores the surviving task when the application removes the active portal host', async () => {
    const screen = await render(<PublicBranches customHost />);
    await expectOwnedFocus('Parent modal');
    const action = namedElement('Parent action');
    action.focus();
    await screen.rerender(<PublicBranches customHost childOpen />);
    await expectOwnedFocus('Child modal');
    const host = namedElement('Child modal').closest('.lyra-drawer-overlay')!.parentElement!;
    host.remove();
    await vi.waitFor(() => expect(document.activeElement).toBe(action));
    expect(namedElement('Background field').closest('[inert]')).not.toBeNull();
    await screen.unmount();
  });

  it('keeps initial ancestry restoration and the external opener through StrictMode', async () => {
    const external = document.createElement('button');
    external.textContent = 'Existing page task';
    document.body.append(external);
    external.focus();
    const screen = await render(
      <StrictMode>
        <PublicBranches childOpen />
      </StrictMode>,
    );
    try {
      await expectOwnedFocus('Child modal');
      await screen.rerender(
        <StrictMode>
          <PublicBranches />
        </StrictMode>,
      );
      await expectOwnedFocus('Parent modal');
      await screen.rerender(
        <StrictMode>
          <PublicBranches parentOpen={false} />
        </StrictMode>,
      );
      await vi.waitFor(() => expect(document.activeElement).toBe(external));
    } finally {
      await screen.unmount();
      external.remove();
    }
  });

  it('deactivates a still-controlled-open descendant when its ancestor accepts close', async () => {
    const screen = await render(<PublicBranches parentOpen={false} childOpen />);
    const opener = namedElement('Page opener');
    opener.focus();
    await screen.rerender(<PublicBranches childOpen />);
    await expectOwnedFocus('Child modal');
    const child = namedElement('Child modal');
    await screen.rerender(<PublicBranches parentOpen={false} childOpen />);
    expect(child.hasAttribute('aria-modal')).toBe(false);
    expect(child.closest('[inert]')).not.toBeNull();
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('isolates inserted background and releases its claim when content enters the active branch', async () => {
    const screen = await render(<PublicBranches />);
    await expectOwnedFocus('Parent modal');
    const added = document.createElement('input');
    added.setAttribute('aria-label', 'Inserted workflow field');
    document.body.append(added);
    try {
      await vi.waitFor(() => expect(added.closest('[inert]')).not.toBeNull());
      added.focus();
      expect(document.activeElement).not.toBe(added);
      namedElement('Parent modal').append(added);
      await vi.waitFor(() => expect(added.closest('[inert]')).toBeNull());
      added.focus();
      expect(document.activeElement).toBe(added);
    } finally {
      await screen.unmount();
      added.remove();
    }
  });

  it('raises the entire nested portal branch above a sibling and resumes its parent on close', async () => {
    function Fixture({ child, sibling }: { child: boolean; sibling: boolean }): ReactNode {
      return (
        <>
          <PublicBranches customHost childOpen={child} />
          <Dialog open={sibling} title="Sibling modal" aria-label="Sibling modal">
            <input aria-label="Sibling field" />
          </Dialog>
        </>
      );
    }
    const screen = await render(<Fixture child={false} sibling={false} />);
    await expectOwnedFocus('Parent modal');
    await screen.rerender(<Fixture child={false} sibling />);
    await expectOwnedFocus('Sibling modal');
    await screen.rerender(<Fixture child sibling />);
    await expectOwnedFocus('Child modal');
    const parentOverlay = namedElement('Parent modal').parentElement!;
    const siblingOverlay = namedElement('Sibling modal').parentElement!;
    expect(Number(getComputedStyle(parentOverlay).zIndex)).toBeGreaterThan(
      Number(getComputedStyle(siblingOverlay).zIndex),
    );
    await screen.rerender(<Fixture child={false} sibling />);
    await expectOwnedFocus('Parent modal');
    expect(namedElement('Sibling field').closest('[inert]')).not.toBeNull();
  });

  it('keeps the resumed modal above an inactive exit with a higher CSS stacking base', async () => {
    function Fixture({ child }: { child: boolean }): ReactNode {
      return (
        <>
          <style>{'.lyra-drawer-overlay { z-index: 9000; }'}</style>
          <PublicBranches childOpen={child} />
        </>
      );
    }
    const screen = await render(<Fixture child={false} />);
    await expectOwnedFocus('Parent modal');
    await screen.rerender(<Fixture child />);
    await expectOwnedFocus('Child modal');
    const exiting = namedElement('Child modal').parentElement!;
    await screen.rerender(<Fixture child={false} />);
    await expectOwnedFocus('Parent modal');
    expect(exiting.isConnected).toBe(true);
    expect(exiting.hasAttribute('inert')).toBe(true);
    expect(
      Number(getComputedStyle(namedElement('Parent modal').parentElement!).zIndex),
    ).toBeGreaterThan(Number(getComputedStyle(exiting).zIndex));
  });

  it('captures an opener in a portalled sibling within the same parent branch', async () => {
    function Fixture({ last }: { last: boolean }): ReactNode {
      return (
        <Dialog open title="Common parent" aria-label="Common parent">
          <Drawer open title="Previous child" aria-label="Previous child">
            <input aria-label="Previous first field" />
            <button type="button" aria-label="Previous task action" tabIndex={0}>
              Open next step
            </button>
          </Drawer>
          <Drawer open={last} title="Last child" aria-label="Last child">
            <input aria-label="Last field" />
          </Drawer>
        </Dialog>
      );
    }
    const screen = await render(<Fixture last={false} />);
    await expectOwnedFocus('Previous child');
    const action = namedElement('Previous task action');
    action.focus();
    await screen.rerender(<Fixture last />);
    await expectOwnedFocus('Last child');
    await screen.rerender(<Fixture last={false} />);
    await vi.waitFor(() => expect(document.activeElement).toBe(action));
  });

  it('keeps accepted activation order when an open portal changes its container', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    function Fixture({ moved, front }: { moved: boolean; front: boolean }): ReactNode {
      return (
        <StrictMode>
          <Drawer
            open
            title="Moved modal"
            aria-label="Moved modal"
            container={moved ? host : undefined}
          >
            <input aria-label="Moved field" />
          </Drawer>
          <Dialog open={front} title="Stable front" aria-label="Stable front">
            <input aria-label="Stable front field" />
          </Dialog>
        </StrictMode>
      );
    }
    const screen = await render(<Fixture moved={false} front={false} />);
    try {
      await expectOwnedFocus('Moved modal');
      await screen.rerender(<Fixture moved={false} front />);
      await expectOwnedFocus('Stable front');
      const focused = document.activeElement;
      await screen.rerender(<Fixture moved front />);
      await vi.waitFor(() => expect(document.activeElement).toBe(focused));
      expect(namedElement('Moved field').closest('[inert]')).not.toBeNull();
    } finally {
      await screen.unmount();
      host.remove();
    }
  });

  it('isolates and locks the portal document without locking the invoking document', async () => {
    const outerOverflow = document.body.style.overflow;
    const frame = document.createElement('iframe');
    frame.title = 'Independent workflow document';
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const background = frameDocument.createElement('input');
    frameDocument.body.append(background);
    background.focus();
    const screen = await render(
      <Dialog open title="Frame modal" container={frameDocument.body}>
        <input aria-label="Frame task" />
      </Dialog>,
    );
    try {
      await vi.waitFor(() => {
        expect(frameDocument.activeElement?.getAttribute('aria-label')).toBe('Frame task');
      });
      expect({
        backgroundInert: Boolean(background.closest('[inert]')),
        frameOverflow: frameDocument.body.style.overflow,
        outerOverflow: document.body.style.overflow,
      }).toEqual({ backgroundInert: true, frameOverflow: 'hidden', outerOverflow });
      await screen.unmount();
      expect(frameDocument.body.style.overflow).toBe('');
      expect(document.body.style.overflow).toBe(outerOverflow);
    } finally {
      await screen.unmount();
      frame.remove();
    }
  });
});

describe('useModalLayer', () => {
  it('keeps only the current nested branch interactive and restores exact prior inert attributes', async () => {
    function Harness({ childOpen }: { childOpen: boolean }): ReactNode {
      return (
        <>
          <button type="button" inert>
            Background
          </button>
          <LayerHarness open label="Parent modal">
            <button type="button">Parent control</button>
            <LayerHarness open={childOpen} label="Child modal" portal>
              <button type="button">Child control</button>
            </LayerHarness>
          </LayerHarness>
        </>
      );
    }

    const screen = await render(<Harness childOpen />);
    const background = screen.container.querySelector<HTMLButtonElement>('button')!;
    await expect.element(screen.getByRole('dialog', { name: 'Parent modal' })).toBeInTheDocument();
    await expect.element(screen.getByRole('dialog', { name: 'Child modal' })).toBeInTheDocument();
    await vi.waitFor(() => {
      const parent = screen.container.querySelector<HTMLElement>('[aria-label="Parent modal"]')!;
      const child = document.querySelector<HTMLElement>('[aria-label="Child modal"]')!;
      expect(parent.closest('[inert]')).not.toBeNull();
      expect(child.closest('[inert]')).toBeNull();
    });

    await screen.rerender(<Harness childOpen={false} />);
    await vi.waitFor(() => {
      const parent = screen.container.querySelector<HTMLElement>('[aria-label="Parent modal"]')!;
      const child = document.querySelector<HTMLElement>('[aria-label="Child modal"]')!;
      expect(parent.closest('[inert]')).toBeNull();
      expect(child.closest('[inert]')).not.toBeNull();
    });

    await screen.unmount();
    expect(background.getAttribute('inert')).toBe('');
  });
});
