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

function waitForMutationDelivery(node: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      observer.disconnect();
      resolve();
    });
    observer.observe(node, { attributes: true });
    node.toggleAttribute('data-focus-recovery-settled');
  });
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

describe('useFocusTrap local dynamic focus recovery', () => {
  it('recovers to the nearest successor, predecessor, new candidate, or panel after removal', async () => {
    const view = await render(
      <FocusTrapPanel label="Recovery panel">
        <button key="first" type="button">
          First action
        </button>
        <button key="second" type="button">
          Second action
        </button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Recovery panel"]')!;
    const first = panel.querySelector<HTMLButtonElement>('button:first-child')!;
    const second = panel.querySelector<HTMLButtonElement>('button:last-child')!;

    first.focus();
    await view.rerender(
      <FocusTrapPanel label="Recovery panel">
        <button key="second" type="button">
          Second action
        </button>
      </FocusTrapPanel>,
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(second));

    second.focus();
    await view.rerender(
      <FocusTrapPanel label="Recovery panel">
        <button key="replacement" type="button">
          New replacement
        </button>
      </FocusTrapPanel>,
    );
    await vi.waitFor(() => expect(document.activeElement).toHaveTextContent('New replacement'));

    const replacement = panel.querySelector<HTMLButtonElement>('button')!;
    replacement.focus();
    await view.rerender(<FocusTrapPanel label="Recovery panel">Plain text</FocusTrapPanel>);
    await vi.waitFor(() => expect(document.activeElement).toBe(panel));
  });

  it('uses the preceding candidate when the focused final control is removed', async () => {
    const view = await render(
      <FocusTrapPanel label="Previous recovery">
        <button key="first" type="button">
          First action
        </button>
        <button key="last" type="button">
          Last action
        </button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Previous recovery"]')!;
    const last = panel.querySelector<HTMLButtonElement>('button:last-child')!;
    const first = panel.querySelector<HTMLButtonElement>('button:first-child')!;

    last.focus();
    await view.rerender(
      <FocusTrapPanel label="Previous recovery">
        <button key="first" type="button">
          First action
        </button>
      </FocusTrapPanel>,
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(first));
  });

  it.each([
    ['disabled', (target: HTMLElement): void => target.setAttribute('disabled', '')],
    [
      'disabled fieldset',
      (target: HTMLElement): void => target.parentElement!.setAttribute('disabled', ''),
    ],
    ['hidden', (target: HTMLElement): void => target.setAttribute('hidden', '')],
    [
      'inline display style',
      (target: HTMLElement): void => {
        target.style.display = 'none';
      },
    ],
    [
      'class-driven visibility',
      (target: HTMLElement): void => target.classList.add('recovery-hidden'),
    ],
    [
      'unknown data-attribute CSS visibility',
      (target: HTMLElement): void => target.setAttribute('data-recovery-hidden', 'true'),
    ],
    ['aria-hidden', (target: HTMLElement): void => target.setAttribute('aria-hidden', 'true')],
    ['inert', (target: HTMLElement): void => target.setAttribute('inert', '')],
  ])('recovers after focused control becomes unavailable through %s', async (_name, invalidate) => {
    await render(
      <FocusTrapPanel label="Invalidation recovery">
        <style>
          {
            '.recovery-hidden, .recovery-data-hidden[data-recovery-hidden="true"] { display: none; }'
          }
        </style>
        {_name === 'disabled fieldset' ? (
          <fieldset>
            <button type="button">Focused action</button>
          </fieldset>
        ) : (
          <button className="recovery-data-hidden" type="button">
            Focused action
          </button>
        )}
        <button type="button">Recovery action</button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Invalidation recovery"]')!;
    const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('button'));
    const focused = buttons[0]!;
    const recovery = buttons.at(-1)!;

    focused.focus();
    invalidate(focused);
    await vi.waitFor(() => expect(document.activeElement).toBe(recovery));
  });

  it.each([
    [
      'a focused link loses href',
      <a href="/focus-recovery">Focused link</a>,
      (target: HTMLElement): void => target.removeAttribute('href'),
    ],
    [
      'a contenteditable target becomes non-editable',
      <div contentEditable aria-label="Editable target" />,
      (target: HTMLElement): void => target.setAttribute('contenteditable', 'false'),
    ],
    [
      'an explicit tabindex is removed',
      <div role="button" tabIndex={0}>
        Explicit target
      </div>,
      (target: HTMLElement): void => target.removeAttribute('tabindex'),
    ],
  ])('recovers when %s', async (_name, target, invalidate) => {
    await render(
      <FocusTrapPanel label="Programmatic recovery">
        {target}
        <button type="button">Recovery action</button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Programmatic recovery"]')!;
    const focused = panel.querySelector<HTMLElement>('a, div')!;
    const recovery = panel.querySelector<HTMLButtonElement>('button')!;

    focused.focus();
    invalidate(focused);
    await vi.waitFor(() => expect(document.activeElement).toBe(recovery));
  });

  it('retains a focused negative-tabindex heading and recovers from its removal', async () => {
    const view = await render(
      <FocusTrapPanel label="Heading recovery">
        <h2 key="heading" tabIndex={-1}>
          Modal heading
        </h2>
        <button key="action" type="button">
          First action
        </button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Heading recovery"]')!;
    const heading = panel.querySelector<HTMLElement>('h2')!;
    const action = panel.querySelector<HTMLButtonElement>('button')!;

    heading.focus();
    action.dataset.visibilityDriver = 'unchanged';
    await vi.waitFor(() => expect(document.activeElement).toBe(heading));

    await view.rerender(
      <FocusTrapPanel label="Heading recovery">
        <button key="action" type="button">
          First action
        </button>
      </FocusTrapPanel>,
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(action));
  });

  it('keeps an eligible focused control through insertion, reordering, and unknown data attributes', async () => {
    await render(
      <FocusTrapPanel label="Stable recovery">
        <button type="button">First action</button>
        <button type="button">Focused action</button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Stable recovery"]')!;
    const focused = panel.querySelector<HTMLButtonElement>('button:last-child')!;
    const inserted = document.createElement('button');
    inserted.type = 'button';
    inserted.textContent = 'Inserted action';

    focused.focus();
    panel.insertBefore(inserted, focused);
    panel.append(focused);
    focused.dataset.cssVisibilityDriver = 'unchanged';
    await vi.waitFor(() => expect(document.activeElement).toBe(focused));

    const focusTransitions = vi.fn();
    panel.addEventListener('focusin', focusTransitions);
    await waitForMutationDelivery(panel);
    expect(focusTransitions).not.toHaveBeenCalled();
    panel.removeEventListener('focusin', focusTransitions);
  });

  it('does not recover to a remembered successor moved outside the panel in the same mutation batch', async () => {
    await render(
      <FocusTrapPanel label="Moved successor recovery">
        <button type="button">Before action</button>
        <button type="button">Focused action</button>
        <button type="button">Moved successor</button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Moved successor recovery"]')!;
    const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('button'));
    const before = buttons[0]!;
    const focused = buttons[1]!;
    const successor = buttons[2]!;
    const externalRoot = document.createElement('div');
    document.body.append(externalRoot);

    focused.focus();
    externalRoot.append(successor);
    focused.remove();

    await vi.waitFor(() => expect(document.activeElement).toBe(before));
    expect(externalRoot.contains(successor)).toBe(true);
    externalRoot.remove();
  });

  it('keeps unobserved negative-tabindex nodes out of recovery destinations', async () => {
    const view = await render(
      <FocusTrapPanel label="Negative target recovery">
        <button key="before" type="button">
          Before action
        </button>
        <button key="focused" type="button">
          Focused action
        </button>
        <h2 key="heading" tabIndex={-1}>
          Unobserved heading
        </h2>
        <button key="after" type="button">
          After action
        </button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Negative target recovery"]')!;
    const focused = Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent === 'Focused action',
    )!;
    const after = Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent === 'After action',
    )!;

    focused.focus();
    await view.rerender(
      <FocusTrapPanel label="Negative target recovery">
        <button key="before" type="button">
          Before action
        </button>
        <h2 key="heading" tabIndex={-1}>
          Unobserved heading
        </h2>
        <button key="after" type="button">
          After action
        </button>
      </FocusTrapPanel>,
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(after));
  });

  it('uses an observed programmatic anchor at its live DOM position', async () => {
    const view = await render(
      <FocusTrapPanel label="Observed anchor recovery">
        <button key="before" type="button">
          Before action
        </button>
        <div key="target" role="button" tabIndex={0}>
          Focused target
        </div>
        <button key="after" type="button">
          After action
        </button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Observed anchor recovery"]')!;
    const target = panel.querySelector<HTMLElement>('[tabindex="0"]')!;
    const after = panel.querySelector<HTMLButtonElement>('button:last-child')!;

    target.focus();
    await view.rerender(
      <FocusTrapPanel label="Observed anchor recovery">
        <button key="inserted" type="button">
          Inserted action
        </button>
        <button key="before" type="button">
          Before action
        </button>
        <div key="target">Focused target</div>
        <button key="after" type="button">
          After action
        </button>
      </FocusTrapPanel>,
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(after));
  });

  it('does not claim body focus without a prior owned focus target', async () => {
    await render(
      <FocusTrapPanel label="No ownership recovery">
        <button type="button">Available action</button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="No ownership recovery"]')!;

    await waitForMutationDelivery(panel);
    expect(document.activeElement).toBe(document.body);
  });

  it('does not steal a valid application destination after owned focus is lost', async () => {
    const view = await render(
      <>
        <button type="button">Application destination</button>
        <FocusTrapPanel label="Application recovery">
          <button type="button">Focused action</button>
          <button type="button">Recovery action</button>
        </FocusTrapPanel>
      </>,
    );
    const destination = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent === 'Application destination',
    )!;
    const panel = document.querySelector<HTMLElement>('[aria-label="Application recovery"]')!;
    const focused = panel.querySelector<HTMLButtonElement>('button:first-child')!;

    focused.focus();
    destination.focus();
    await view.rerender(
      <>
        <button type="button">Application destination</button>
        <FocusTrapPanel label="Application recovery">
          <button type="button">Recovery action</button>
        </FocusTrapPanel>
      </>,
    );
    await waitForMutationDelivery(panel);
    expect(document.activeElement).toBe(destination);
  });

  it('does not treat a nested dialog branch as parent focus ownership', async () => {
    const view = await render(
      <FocusTrapPanel label="Parent recovery">
        <button type="button">Parent action</button>
        <div aria-label="Child branch" role="dialog">
          <button type="button">Child action</button>
        </div>
      </FocusTrapPanel>,
    );
    const parent = document.querySelector<HTMLElement>('[aria-label="Parent recovery"]')!;
    const child = document.querySelector<HTMLButtonElement>('[aria-label="Child branch"] button')!;

    child.focus();
    await view.rerender(
      <FocusTrapPanel label="Parent recovery">
        <button type="button">Parent action</button>
      </FocusTrapPanel>,
    );
    await waitForMutationDelivery(parent);
    expect(document.activeElement).not.toBe(parent.querySelector('button'));
  });

  it('does not recover into an inert panel after an owned control is removed', async () => {
    const view = await render(
      <FocusTrapPanel label="Inert recovery">
        <button key="focused" type="button">
          Focused action
        </button>
        <button key="recovery" type="button">
          Recovery action
        </button>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Inert recovery"]')!;
    const focused = panel.querySelector<HTMLButtonElement>('button:first-child')!;

    focused.focus();
    panel.setAttribute('inert', '');
    await view.rerender(
      <FocusTrapPanel label="Inert recovery">
        <button key="recovery" type="button">
          Recovery action
        </button>
      </FocusTrapPanel>,
    );
    expect(focused.isConnected).toBe(false);
    await waitForMutationDelivery(panel);
    expect(panel.contains(document.activeElement)).toBe(false);
  });

  it('relinquishes parent recovery when focus enters a child portal', async () => {
    const view = await render(
      <FocusTrapPanel label="Parent ownership recovery">
        <button key="parent-target" type="button">
          Parent target
        </button>
        <button key="parent-after" type="button">
          Parent after
        </button>
        <FocusTrapPanel key="child" label="Child ownership recovery">
          <button key="child-target" type="button">
            Child target
          </button>
        </FocusTrapPanel>
      </FocusTrapPanel>,
    );
    const parent = document.querySelector<HTMLElement>('[aria-label="Parent ownership recovery"]')!;
    const child = document.querySelector<HTMLElement>('[aria-label="Child ownership recovery"]')!;
    const parentTarget = Array.from(parent.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent === 'Parent target',
    )!;
    const childTarget = child.querySelector<HTMLButtonElement>('button')!;

    parentTarget.focus();
    childTarget.focus();
    await view.rerender(
      <FocusTrapPanel label="Parent ownership recovery">
        <button key="parent-after" type="button">
          Parent after
        </button>
        <FocusTrapPanel key="child" label="Child ownership recovery">
          Child content
        </FocusTrapPanel>
      </FocusTrapPanel>,
    );

    expect(child.isConnected).toBe(true);
    await vi.waitFor(() => expect(document.activeElement).toBe(child));
    expect(parent.contains(document.activeElement)).toBe(false);
  });

  it('cancels recovery for inactive retained panels and StrictMode cleanup', async () => {
    const view = await render(
      <StrictMode>
        <FocusTrapPanel label="Retained recovery">
          <button key="focused" type="button">
            Focused action
          </button>
          <button key="recovery" type="button">
            Recovery action
          </button>
        </FocusTrapPanel>
      </StrictMode>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Retained recovery"]')!;
    const focused = panel.querySelector<HTMLButtonElement>('button:first-child')!;

    focused.focus();
    await view.rerender(
      <StrictMode>
        <FocusTrapPanel active={false} label="Retained recovery">
          <button key="recovery" type="button">
            Recovery action
          </button>
        </FocusTrapPanel>
      </StrictMode>,
    );
    expect(focused.isConnected).toBe(false);
    await waitForMutationDelivery(panel);
    expect(panel.contains(document.activeElement)).toBe(false);

    await view.rerender(
      <StrictMode>
        <FocusTrapPanel label="Retained recovery">
          <button key="recovery" type="button">
            Recovery action
          </button>
        </FocusTrapPanel>
      </StrictMode>,
    );
    await waitForMutationDelivery(panel);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('useFocusTrap document fallback recovery', () => {
  it.each(['body', 'html'] as const)('recovers from a focusable %s fallback', async (tag) => {
    const fallback = tag === 'body' ? document.body : document.documentElement;
    const previousTabIndex = fallback.getAttribute('tabindex');
    fallback.tabIndex = -1;
    try {
      await render(
        <FocusTrapPanel label="Document fallback recovery">
          <input aria-label="Lost field" />
          <input aria-label="Next field" />
        </FocusTrapPanel>,
      );
      const panel = document.querySelector<HTMLElement>(
        '[aria-label="Document fallback recovery"]',
      )!;
      const lost = panel.querySelector<HTMLInputElement>('[aria-label="Lost field"]')!;
      const next = panel.querySelector<HTMLInputElement>('[aria-label="Next field"]')!;
      lost.focus();
      expect(document.activeElement).toBe(lost);
      lost.remove();
      fallback.focus();
      expect(document.activeElement).toBe(fallback);
      await vi.waitFor(() => expect(document.activeElement).toBe(next));
    } finally {
      if (previousTabIndex === null) fallback.removeAttribute('tabindex');
      else fallback.setAttribute('tabindex', previousTabIndex);
    }
  });
});

describe('useFocusTrap live successor eligibility', () => {
  it('rejects a remembered link successor that loses href in the same mutation batch', async () => {
    await render(
      <FocusTrapPanel label="Successor eligibility">
        <input aria-label="Previous control" />
        <input aria-label="Removed control" />
        <a href="#next-control">Next control</a>
      </FocusTrapPanel>,
    );
    const panel = document.querySelector<HTMLElement>('[aria-label="Successor eligibility"]')!;
    const previous = panel.querySelector<HTMLInputElement>('[aria-label="Previous control"]')!;
    const removed = panel.querySelector<HTMLInputElement>('[aria-label="Removed control"]')!;
    const successor = panel.querySelector<HTMLAnchorElement>('a')!;
    removed.focus();
    expect(document.activeElement).toBe(removed);
    successor.removeAttribute('href');
    removed.remove();
    expect(removed.isConnected).toBe(false);
    await vi.waitFor(() => expect(document.activeElement).toBe(previous));
  });
});

describe('useFocusTrap observed focus transfer', () => {
  it('releases previous ownership when a valid child destination is observed after removal', async () => {
    await render(
      <>
        <FocusTrapPanel label="Previous focus owner">
          <input aria-label="Previous target" />
          <input aria-label="Previous fallback" />
        </FocusTrapPanel>
        <FocusTrapPanel label="Current focus owner">
          <input aria-label="Current target" />
        </FocusTrapPanel>
      </>,
    );
    const previous = document.querySelector<HTMLElement>('[aria-label="Previous focus owner"]')!;
    const current = document.querySelector<HTMLElement>('[aria-label="Current focus owner"]')!;
    const previousTarget = previous.querySelector<HTMLInputElement>('input')!;
    const currentTarget = current.querySelector<HTMLInputElement>('input')!;
    previousTarget.focus();
    expect(document.activeElement).toBe(previousTarget);
    previousTarget.remove();
    currentTarget.focus();
    await waitForMutationDelivery(previous);
    expect(document.activeElement).toBe(currentTarget);
    previous.toggleAttribute('data-later-mutation');
    currentTarget.remove();
    await waitForMutationDelivery(current);
    expect(document.activeElement).toBe(current);
    expect(previous.contains(document.activeElement)).toBe(false);
  });
});
