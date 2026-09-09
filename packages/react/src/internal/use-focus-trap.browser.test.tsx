import { afterEach, describe, expect, it, vi } from 'vitest';
import { StrictMode, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import '@lyra-ds/styles/styles.css';
import { useFocusTrap } from './use-focus-trap';

const BOUNDARY_SELECTOR = '[data-lyra-focus-trap-boundary]';

interface FocusTrapPanelProps {
  active?: boolean;
  children: ReactNode;
  label: string;
}

function FocusTrapPanel({ active = true, children, label }: FocusTrapPanelProps): ReactNode {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, active);

  return createPortal(
    <div ref={panelRef} aria-label={label} role="dialog" tabIndex={-1}>
      {children}
    </div>,
    document.body,
  );
}

function NativeNavigationHarness(): ReactNode {
  return (
    <FocusTrapPanel label="Native navigation">
      <button type="button">First action</button>
      <input aria-label="Work" />
      <button type="button">Last action</button>
    </FocusTrapPanel>
  );
}

function IntermediateNavigationHarness({ active = true }: { active?: boolean }): ReactNode {
  return (
    <FocusTrapPanel active={active} label="Intermediate navigation">
      <input aria-label="Start field" />
      <textarea aria-label="Notes" />
      <input aria-label="Selected option" defaultChecked name="choice" type="radio" />
      <button tabIndex={0} type="button">
        Explicit tab stop
      </button>
    </FocusTrapPanel>
  );
}

function NestedPortalHarness(): ReactNode {
  return (
    <FocusTrapPanel label="Parent panel">
      <button type="button">Parent first</button>
      <input aria-label="Parent work" />
      <button type="button">Parent last</button>
      <FocusTrapPanel label="Child panel">
        <button type="button">Child first</button>
        <input aria-label="Child work" />
        <button type="button">Child last</button>
      </FocusTrapPanel>
    </FocusTrapPanel>
  );
}

function NativeCancellationHarness(): ReactNode {
  const lastRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const last = lastRef.current;
    if (!last) return;
    const cancelTab = (event: KeyboardEvent): void => {
      if (event.key === 'Tab') event.preventDefault();
    };
    last.addEventListener('keydown', cancelTab);
    return () => last.removeEventListener('keydown', cancelTab);
  }, []);

  return (
    <FocusTrapPanel label="Native cancellation">
      <button type="button">First action</button>
      <input aria-label="Work" />
      <button ref={lastRef} type="button">
        Last action
      </button>
    </FocusTrapPanel>
  );
}

function DynamicCandidatesHarness({
  state,
}: {
  state: 'empty' | 'inserted' | 'filtered';
}): ReactNode {
  return (
    <FocusTrapPanel label="Dynamic candidates">
      {state === 'inserted' && <button type="button">Inserted action</button>}
      {state === 'filtered' && (
        <>
          <button disabled type="button">
            Disabled action
          </button>
          <button hidden type="button">
            Hidden action
          </button>
          <input aria-label="Eligible dynamic field" />
        </>
      )}
    </FocusTrapPanel>
  );
}

function ExternalNavigationHarness({
  active = true,
  mounted = true,
}: {
  active?: boolean;
  mounted?: boolean;
}): ReactNode {
  return (
    <>
      <button tabIndex={0} type="button">
        Open
      </button>
      <button tabIndex={0} type="button">
        Next external control
      </button>
      {mounted && (
        <FocusTrapPanel active={active} label="Lifecycle panel">
          <input aria-label="Lifecycle work" />
        </FocusTrapPanel>
      )}
    </>
  );
}

function IncomingTabHarness(): ReactNode {
  return (
    <>
      <button type="button">Open</button>
      <FocusTrapPanel label="Incoming Tab panel">
        <input aria-label="Incoming work" />
      </FocusTrapPanel>
    </>
  );
}

function expectFocusInside(panel: HTMLElement): void {
  expect(panel.contains(document.activeElement)).toBe(true);
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).not.toHaveAttribute('data-lyra-focus-trap-boundary');
}

afterEach(async () => {
  await cleanup();
});

describe('useFocusTrap native Tab containment', () => {
  it('contains forward and reverse native navigation from an input without becoming an intermediate stop', async () => {
    await render(<NativeNavigationHarness />);
    const panel = document.querySelector<HTMLElement>('[aria-label="Native navigation"]')!;
    const input = panel.querySelector<HTMLInputElement>('[aria-label="Work"]')!;

    input.focus();
    await userEvent.keyboard('{Tab}');
    expectFocusInside(panel);

    input.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expectFocusInside(panel);
  });

  it('preserves native input, textarea, checked-radio, and explicit-tabindex navigation', async () => {
    const view = await render(<IntermediateNavigationHarness active={false} />);
    const panel = document.querySelector<HTMLElement>('[aria-label="Intermediate navigation"]')!;
    const start = panel.querySelector<HTMLInputElement>('[aria-label="Start field"]')!;
    const notes = panel.querySelector<HTMLTextAreaElement>('[aria-label="Notes"]')!;
    const radio = panel.querySelector<HTMLInputElement>('[aria-label="Selected option"]')!;
    const explicit = panel.querySelector<HTMLButtonElement>('button[tabindex="0"]')!;

    // The browser's native path is the reference: some platforms skip radio stops.
    const nativePath: Element[] = [];
    let leftPanel = false;
    start.focus();
    for (let step = 0; step < 8; step += 1) {
      await userEvent.keyboard('{Tab}');
      const target = document.activeElement;
      if (!target || !panel.contains(target)) {
        leftPanel = true;
        break;
      }
      nativePath.push(target);
    }
    expect(leftPanel).toBe(true);
    expect(nativePath[0]).toBe(notes);
    expect(nativePath.at(-1)).toBe(explicit);
    expect(radio.checked).toBe(true);

    await view.rerender(<IntermediateNavigationHarness active />);
    start.focus();
    for (const target of nativePath) {
      await userEvent.keyboard('{Tab}');
      expect(document.activeElement).toBe(target);
    }
    expect(radio.checked).toBe(true);
  });

  it('keeps nested default-body portal navigation inside the child panel', async () => {
    await render(<NestedPortalHarness />);
    const parent = document.querySelector<HTMLElement>('[aria-label="Parent panel"]')!;
    const child = document.querySelector<HTMLElement>('[aria-label="Child panel"]')!;
    const input = child.querySelector<HTMLInputElement>('[aria-label="Child work"]')!;

    input.focus();
    await userEvent.keyboard('{Tab}');
    expectFocusInside(child);
    expect(parent.contains(document.activeElement)).toBe(false);

    input.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expectFocusInside(child);
    expect(parent.contains(document.activeElement)).toBe(false);
  });

  it('honors a descendant native Tab cancellation at the edge', async () => {
    await render(<NativeCancellationHarness />);
    const last = document.querySelector<HTMLButtonElement>(
      '[aria-label="Native cancellation"] button:last-child',
    )!;

    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(last);
  });

  it('re-reads mounted, removed, hidden, and disabled candidates', async () => {
    const view = await render(<DynamicCandidatesHarness state="empty" />);
    const panel = document.querySelector<HTMLElement>('[aria-label="Dynamic candidates"]')!;

    panel.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(panel);

    await view.rerender(<DynamicCandidatesHarness state="inserted" />);
    panel.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toHaveTextContent('Inserted action');

    await view.rerender(<DynamicCandidatesHarness state="empty" />);
    panel.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(panel);

    await view.rerender(<DynamicCandidatesHarness state="filtered" />);
    panel.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toHaveAttribute('aria-label', 'Eligible dynamic field');
  });

  it('does not leave an inactive boundary in trusted incoming Tab navigation', async () => {
    await render(<IncomingTabHarness />);
    const open = document.querySelector<HTMLButtonElement>('button')!;

    open.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).not.toHaveAttribute('data-lyra-focus-trap-boundary');
  });

  it('keeps trusted incoming Tab on external controls and removes boundaries on deactivation and unmount', async () => {
    const view = await render(
      <StrictMode>
        <ExternalNavigationHarness />
      </StrictMode>,
    );
    const open = document.querySelector<HTMLButtonElement>('button:first-child')!;
    const next = document.querySelector<HTMLButtonElement>('button:nth-child(2)')!;

    open.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(next);
    expect(document.querySelectorAll(BOUNDARY_SELECTOR)).toHaveLength(2);

    await view.rerender(
      <StrictMode>
        <ExternalNavigationHarness active={false} />
      </StrictMode>,
    );
    await vi.waitFor(() => expect(document.querySelectorAll(BOUNDARY_SELECTOR)).toHaveLength(0));

    await view.rerender(
      <StrictMode>
        <ExternalNavigationHarness />
      </StrictMode>,
    );
    await vi.waitFor(() => expect(document.querySelectorAll(BOUNDARY_SELECTOR)).toHaveLength(2));

    await view.rerender(
      <StrictMode>
        <ExternalNavigationHarness mounted={false} />
      </StrictMode>,
    );
    await vi.waitFor(() => expect(document.querySelectorAll(BOUNDARY_SELECTOR)).toHaveLength(0));

    open.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(next);
  });
});
