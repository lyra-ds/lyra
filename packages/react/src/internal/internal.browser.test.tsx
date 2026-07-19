// Focused browser-mode tests for the internal/ behavior hooks (D-25 review fix): the utility
// contracts get direct unit proof here instead of relying solely on the wave-3 pilot suites.
// Runs in the "browser" vitest project (real chromium) so CSS animations, computed padding,
// and layout actually resolve — none of which jsdom can provide.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, renderHook, cleanup } from 'vitest-browser-react';
import { usePresence } from './use-presence';
import { useScrollLock } from './use-scroll-lock';
import { useControllableState } from './use-controllable-state';

// Real keyframes so onAnimationEnd fires for the presence walk. The panel animation is longer
// than the child so the child's (bubbled) animationend arrives first and must be IGNORED.
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lyra-test-panel-exit { from { opacity: 1; } to { opacity: 0; } }
    @keyframes lyra-test-child-exit { from { opacity: 1; } to { opacity: 0; } }
    .presence-panel--closing { animation: lyra-test-panel-exit 120ms linear forwards; }
    .presence-child--closing { animation: lyra-test-child-exit 20ms linear forwards; }
  `;
  document.head.appendChild(style);
});

afterEach(async () => {
  await cleanup();
});

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- usePresence ---------------------------------------------------------------------------

interface PresenceHarnessProps {
  open: boolean;
  animate: boolean;
}

function PresenceHarness({ open, animate }: PresenceHarnessProps) {
  const { mounted, closing, onAnimationEnd } = usePresence(open);
  if (!mounted) return null;
  return (
    <div
      data-testid="panel"
      className={animate && closing ? 'presence-panel--closing' : undefined}
      onAnimationEnd={onAnimationEnd}
    >
      <span data-testid="child" className={animate && closing ? 'presence-child--closing' : undefined}>
        child
      </span>
      panel body
    </div>
  );
}

describe('usePresence', () => {
  it('walks open → closing → unmounted via the panel animation', async () => {
    const { rerender, container } = await render(<PresenceHarness open animate />);
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    await rerender(<PresenceHarness open={false} animate />);
    // Still mounted while the exit animation runs.
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    // After the panel animation ends, onAnimationEnd finalizes the unmount.
    await vi.waitFor(
      () => expect(container.querySelector('[data-testid="panel"]')).toBeNull(),
      { timeout: 1000 },
    );
  });

  it('ignores a bubbled child animation end (does not unmount early)', async () => {
    const { rerender, container } = await render(<PresenceHarness open animate />);
    await rerender(<PresenceHarness open={false} animate />);

    // The child (20ms) finishes well before the panel (120ms). Right after the child would have
    // ended, the panel must still be mounted — proof the identity check ignores bubbled events.
    await tick(60);
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    // The panel's own animation still finalizes the unmount eventually.
    await vi.waitFor(
      () => expect(container.querySelector('[data-testid="panel"]')).toBeNull(),
      { timeout: 1000 },
    );
  });

  it('falls back to the timeout when animations do not run', async () => {
    // animate=false → no CSS animation, so onAnimationEnd never fires; the ~250ms fallback unmounts.
    const { rerender, container } = await render(<PresenceHarness open animate={false} />);
    await rerender(<PresenceHarness open={false} animate={false} />);
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    await vi.waitFor(
      () => expect(container.querySelector('[data-testid="panel"]')).toBeNull(),
      { timeout: 1000 },
    );
  });

  it('cancels the close when reopened mid-animation', async () => {
    const { rerender, container } = await render(<PresenceHarness open animate />);
    await rerender(<PresenceHarness open={false} animate />);
    // Reopen before the animation / fallback completes.
    await tick(40);
    await rerender(<PresenceHarness open animate />);

    // Wait past the fallback window — the panel must remain mounted (close was cancelled).
    await tick(320);
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();
  });
});

// --- useScrollLock -------------------------------------------------------------------------

function ScrollLockHarness({ active }: { active: boolean }) {
  useScrollLock(active);
  return null;
}

describe('useScrollLock', () => {
  it('adds the scrollbar delta to existing padding and keeps the body locked across nested locks', async () => {
    const priorPadding = '17px';
    document.body.style.paddingRight = priorPadding;
    const existing = parseFloat(getComputedStyle(document.body).paddingRight);

    const first = await render(<ScrollLockHarness active />);
    expect(document.body.style.overflow).toBe('hidden');
    const lockedPadding = parseFloat(getComputedStyle(document.body).paddingRight);
    const delta = window.innerWidth - document.documentElement.clientWidth;
    // padding-right while locked == prior padding + scrollbar delta (additive, never replacing).
    expect(lockedPadding).toBeCloseTo(existing + delta, 1);

    // A second (nested) lock mounts, then the first releases: body must STILL be locked.
    const second = await render(<ScrollLockHarness active />);
    await first.unmount();
    expect(document.body.style.overflow).toBe('hidden');

    // Only the last release restores the exact prior inline values.
    await second.unmount();
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe(priorPadding);

    document.body.style.paddingRight = '';
  });
});


// --- useControllableState ------------------------------------------------------------------

describe('useControllableState', () => {
  it('warns exactly once on a controlled → uncontrolled switch', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { rerender } = await renderHook(
        (props?: { value: string | undefined }) =>
          useControllableState<string>({ value: props?.value, defaultValue: 'd' }),
        { initialProps: { value: 'a' as string | undefined } },
      );
      expect(warn).not.toHaveBeenCalled();

      // controlled ('a') → uncontrolled (undefined): one warning.
      await rerender({ value: undefined });
      await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));

      // A same-controlledness re-render must NOT warn again.
      await rerender({ value: undefined });
      await tick(20);
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('is controlled iff value is defined; the setter always calls onChange', async () => {
    const onChange = vi.fn();
    const { result } = await renderHook(() =>
      useControllableState<number>({ value: 5, onChange }),
    );
    const [value, setValue] = result.current;
    expect(value).toBe(5);

    // Controlled: setter does not change the rendered value by itself, but does call onChange.
    setValue(9);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(9));
    expect(result.current[0]).toBe(5);
  });
});
