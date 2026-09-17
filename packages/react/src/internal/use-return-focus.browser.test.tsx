import { afterEach, describe, expect, it, vi } from 'vitest';
import { StrictMode, useEffect, useRef, type ReactNode } from 'react';
import { cleanup, render } from 'vitest-browser-react';
import { useReturnFocus } from './use-return-focus';

interface ReturnFocusHarnessProps {
  open: boolean;
  captured: HTMLElement | null;
  returnFocusTo?: () => HTMLElement | null;
}

function ReturnFocusHarness({ open, captured, returnFocusTo }: ReturnFocusHarnessProps): ReactNode {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { captureOpener } = useReturnFocus({ open, returnFocusTo, panelRef, overlayRef });

  useEffect(() => {
    if (open) captureOpener(captured);
  }, [captured, captureOpener, open]);

  return (
    <div ref={overlayRef} data-return-focus-overlay>
      <div ref={panelRef} data-return-focus-panel tabIndex={-1}>
        Closing panel
        <button type="button" data-return-focus-panel-child>
          Closing panel child
        </button>
      </div>
    </div>
  );
}

function focusable(label: string): HTMLButtonElement {
  const target = document.createElement('button');
  target.type = 'button';
  target.textContent = label;
  target.setAttribute('data-return-focus-test', '');
  document.body.appendChild(target);
  return target;
}

afterEach(async () => {
  await cleanup();
  document.querySelectorAll('[data-return-focus-test]').forEach((node) => node.remove());
  vi.restoreAllMocks();
});

describe('useReturnFocus', () => {
  it.each(['negative tabindex', 'native button', 'first summary'])(
    'accepts the browser-focusable %s destination',
    async (kind) => {
      const captured = focusable('captured');
      const host = document.createElement('div');
      host.setAttribute('data-return-focus-test', '');
      host.innerHTML =
        kind === 'negative tabindex'
          ? '<h2 tabindex="-2">Named region</h2>'
          : kind === 'native button'
            ? '<button tabindex="bad">Native action</button>'
            : '<details open><div>Context</div><summary>Details</summary></details>';
      document.body.appendChild(host);
      const target = host.querySelector<HTMLElement>('h2, button, summary')!;
      target.focus();
      expect(document.activeElement).toBe(target);
      captured.focus();
      const { rerender } = await render(
        <ReturnFocusHarness open captured={captured} returnFocusTo={() => target} />,
      );
      await rerender(
        <ReturnFocusHarness open={false} captured={captured} returnFocusTo={() => target} />,
      );
      expect(document.activeElement).toBe(target);
    },
  );

  it('uses a valid tabindex=-1 resolver result with preventScroll after an accepted close', async () => {
    const captured = focusable('captured');
    const target = document.createElement('h2');
    target.tabIndex = -1;
    target.textContent = 'Named region';
    target.setAttribute('data-return-focus-test', '');
    document.body.appendChild(target);
    const focus = vi.spyOn(target, 'focus');

    const { rerender } = await render(
      <ReturnFocusHarness open captured={captured} returnFocusTo={() => target} />,
    );
    await rerender(
      <ReturnFocusHarness open={false} captured={captured} returnFocusTo={() => target} />,
    );

    await vi.waitFor(() => expect(document.activeElement).toBe(target));
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('rejects unsafe resolver targets and falls back to a valid captured opener', async () => {
    const captured = focusable('captured fallback');
    const targets: HTMLElement[] = [
      document.body,
      document.documentElement,
      Object.assign(focusable('disabled'), { disabled: true }),
      Object.assign(focusable('hidden'), { hidden: true }),
      Object.assign(focusable('inert'), { inert: true }),
      Object.assign(focusable('aria hidden'), { ariaHidden: 'true' }),
    ];
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.tabIndex = -1;
    hiddenInput.setAttribute('data-return-focus-test', '');
    document.body.appendChild(hiddenInput);
    targets.push(hiddenInput);
    const invalidTabIndex = document.createElement('div');
    invalidTabIndex.setAttribute('data-return-focus-test', '');
    invalidTabIndex.setAttribute('tabindex', 'bad');
    invalidTabIndex.textContent = 'Unfocusable region';
    document.body.appendChild(invalidTabIndex);
    targets.push(invalidTabIndex);
    const collapsed = focusable('collapsed');
    collapsed.style.visibility = 'collapse';
    targets.push(collapsed);
    const noninteractiveSummary = document.createElement('summary');
    noninteractiveSummary.setAttribute('data-return-focus-test', '');
    document.body.appendChild(noninteractiveSummary);
    targets.push(noninteractiveSummary);
    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    fieldset.setAttribute('data-return-focus-test', '');
    const inDisabledFieldset = document.createElement('button');
    inDisabledFieldset.type = 'button';
    fieldset.appendChild(inDisabledFieldset);
    document.body.appendChild(fieldset);
    targets.push(inDisabledFieldset);
    const hiddenAncestor = document.createElement('div');
    hiddenAncestor.hidden = true;
    hiddenAncestor.setAttribute('data-return-focus-test', '');
    const inHiddenAncestor = document.createElement('button');
    hiddenAncestor.appendChild(inHiddenAncestor);
    document.body.appendChild(hiddenAncestor);
    targets.push(inHiddenAncestor);

    for (const target of targets) {
      const focus = vi.spyOn(target, 'focus');
      const { rerender, unmount } = await render(
        <ReturnFocusHarness open captured={captured} returnFocusTo={() => target} />,
      );
      await rerender(
        <ReturnFocusHarness open={false} captured={captured} returnFocusTo={() => target} />,
      );
      await vi.waitFor(() => expect(document.activeElement).toBe(captured));
      expect(focus).not.toHaveBeenCalled();
      await unmount();
      focus.mockRestore();
    }
  });

  it('rejects disconnected, connected cross-document and unfocusable targets', async () => {
    const captured = focusable('captured fallback');
    const disconnected = document.createElement('button');
    const frame = document.createElement('iframe');
    frame.setAttribute('data-return-focus-test', '');
    document.body.appendChild(frame);
    const foreign = frame.contentDocument!.createElement('button');
    frame.contentDocument!.body.appendChild(foreign);
    const unfocusable = document.createElement('div');
    unfocusable.setAttribute('data-return-focus-test', '');
    document.body.appendChild(unfocusable);

    for (const target of [disconnected, foreign, unfocusable]) {
      const { rerender, unmount } = await render(
        <ReturnFocusHarness open captured={captured} returnFocusTo={() => target} />,
      );
      await rerender(
        <ReturnFocusHarness open={false} captured={captured} returnFocusTo={() => target} />,
      );
      await vi.waitFor(() => expect(document.activeElement).toBe(captured));
      await unmount();
    }
  });

  it('rejects the closing overlay, panel and their descendants without calling their focus methods', async () => {
    const captured = focusable('captured fallback');
    let target: HTMLElement | null = null;
    const { rerender } = await render(
      <ReturnFocusHarness open captured={captured} returnFocusTo={() => target} />,
    );
    const candidates = [
      document.querySelector<HTMLElement>('[data-return-focus-overlay]')!,
      document.querySelector<HTMLElement>('[data-return-focus-panel]')!,
      document.querySelector<HTMLElement>('[data-return-focus-panel-child]')!,
    ];

    for (const candidate of candidates) {
      target = candidate;
      const focus = vi.spyOn(candidate, 'focus');
      await rerender(
        <ReturnFocusHarness open={false} captured={captured} returnFocusTo={() => target} />,
      );
      await vi.waitFor(() => expect(document.activeElement).toBe(captured));
      expect(focus).not.toHaveBeenCalled();
      focus.mockRestore();
      await rerender(<ReturnFocusHarness open captured={captured} returnFocusTo={() => target} />);
    }
  });

  it('uses the latest resolver exactly once per accepted close and never resolves while closed', async () => {
    const captured = focusable('captured');
    const first = focusable('first');
    const latest = focusable('latest');
    const initialClosed = vi.fn(() => first);
    const stale = vi.fn(() => first);
    const current = vi.fn(() => latest);
    const { rerender } = await render(
      <ReturnFocusHarness open={false} captured={captured} returnFocusTo={initialClosed} />,
    );
    await rerender(<ReturnFocusHarness open={false} captured={captured} returnFocusTo={stale} />);
    expect(initialClosed).not.toHaveBeenCalled();
    expect(stale).not.toHaveBeenCalled();

    await rerender(<ReturnFocusHarness open captured={captured} returnFocusTo={stale} />);
    await rerender(<ReturnFocusHarness open captured={captured} returnFocusTo={current} />);
    await rerender(<ReturnFocusHarness open={false} captured={captured} returnFocusTo={current} />);
    await vi.waitFor(() => expect(document.activeElement).toBe(latest));
    expect(stale).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledTimes(1);

    const nextCycleCaptured = focusable('fresh captured opener');
    await rerender(
      <ReturnFocusHarness open captured={nextCycleCaptured} returnFocusTo={current} />,
    );
    await rerender(
      <ReturnFocusHarness open={false} captured={nextCycleCaptured} returnFocusTo={current} />,
    );
    expect(current).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(latest);
  });

  it('does not duplicate restoration in StrictMode or refocus after a rapid reopen', async () => {
    const captured = focusable('captured');
    const target = focusable('target');
    const resolver = vi.fn(() => target);
    const { rerender } = await render(
      <StrictMode>
        <ReturnFocusHarness open captured={captured} returnFocusTo={resolver} />
      </StrictMode>,
    );
    await rerender(
      <StrictMode>
        <ReturnFocusHarness open={false} captured={captured} returnFocusTo={resolver} />
      </StrictMode>,
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(target));
    expect(resolver).toHaveBeenCalledTimes(1);

    await rerender(
      <StrictMode>
        <ReturnFocusHarness open captured={captured} returnFocusTo={resolver} />
      </StrictMode>,
    );
    const userDestination = focusable('user destination');
    userDestination.focus();
    await vi.waitFor(() => expect(document.activeElement).toBe(userDestination));
    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it('captures a fresh omitted-prop opener after a rapid close and reopen', async () => {
    const firstOpener = focusable('first opener');
    const nextOpener = focusable('next opener');
    const { rerender } = await render(<ReturnFocusHarness open captured={firstOpener} />);
    await rerender(<ReturnFocusHarness open={false} captured={firstOpener} />);
    await vi.waitFor(() => expect(document.activeElement).toBe(firstOpener));

    await rerender(<ReturnFocusHarness open captured={nextOpener} />);
    await rerender(<ReturnFocusHarness open={false} captured={nextOpener} />);
    await vi.waitFor(() => expect(document.activeElement).toBe(nextOpener));
  });

  it('diagnoses once and does not focus when neither candidate is eligible', async () => {
    const captured = Object.assign(focusable('disabled captured'), { disabled: true });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const focus = vi.spyOn(document.body, 'focus');
    const capturedFocus = vi.spyOn(captured, 'focus');
    const { rerender } = await render(
      <ReturnFocusHarness open captured={captured} returnFocusTo={() => document.body} />,
    );
    await rerender(
      <ReturnFocusHarness open={false} captured={captured} returnFocusTo={() => document.body} />,
    );
    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(focus).not.toHaveBeenCalled();
    expect(capturedFocus).not.toHaveBeenCalled();
  });

  it('uses a successor after the captured trigger is removed in the closing commit', async () => {
    const trigger = focusable('removed trigger');
    const successor = focusable('logical successor');
    const { rerender } = await render(
      <ReturnFocusHarness open captured={trigger} returnFocusTo={() => successor} />,
    );
    trigger.remove();
    await rerender(
      <ReturnFocusHarness open={false} captured={trigger} returnFocusTo={() => successor} />,
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(successor));
  });
});
