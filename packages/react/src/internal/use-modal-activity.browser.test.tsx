import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { StrictMode, type ReactNode } from 'react';
import { useModalActivity } from './use-modal-activity';

function ActivityHarness({
  open,
  onDeactivate,
  overlayRef,
}: {
  open: boolean;
  onDeactivate: () => void;
  overlayRef: { current: HTMLDivElement | null };
}): ReactNode {
  const { attachOverlay } = useModalActivity({ open, overlayRef, revokeGesture: onDeactivate });
  return <div ref={attachOverlay}>Overlay</div>;
}

afterEach(async () => {
  await cleanup();
});

describe('useModalActivity', () => {
  it('keeps activity attached to only the current retained overlay through StrictMode and teardown', async () => {
    const revokeGesture = vi.fn();
    const overlayRef = { current: null as HTMLDivElement | null };
    const renderHarness = (open: boolean): ReactNode => (
      <StrictMode>
        <div data-testid="consumer-host">
          <button type="button">Outside</button>
          <ActivityHarness open={open} onDeactivate={revokeGesture} overlayRef={overlayRef} />
          <div data-testid="sibling">Sibling</div>
        </div>
      </StrictMode>
    );
    const { container, rerender, unmount } = await render(renderHarness(true));
    const overlay = overlayRef.current!;
    const host = container.querySelector('[data-testid="consumer-host"]')!;
    const outside = container.querySelector<HTMLButtonElement>('button')!;
    const sibling = container.querySelector('[data-testid="sibling"]')!;

    expect(overlayRef.current).toBe(overlay);
    expect(overlay.isConnected).toBe(true);
    expect(overlay.hasAttribute('inert')).toBe(false);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(outside.closest('[inert]')).toBeNull();
    expect(sibling.closest('[inert]')).toBeNull();

    await rerender(renderHarness(false));
    expect(overlayRef.current).toBe(overlay);
    expect(overlay.isConnected).toBe(true);
    expect(overlay.hasAttribute('inert')).toBe(true);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(outside.closest('[inert]')).toBeNull();
    expect(sibling.closest('[inert]')).toBeNull();

    await rerender(renderHarness(true));
    expect(overlayRef.current).toBe(overlay);
    expect(overlay.hasAttribute('inert')).toBe(false);
    expect(container.querySelectorAll('[inert]')).toHaveLength(0);

    await unmount();
    expect(overlayRef.current).toBeNull();
    expect(overlay.isConnected).toBe(false);
  });
});
