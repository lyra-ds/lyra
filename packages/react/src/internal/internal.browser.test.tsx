// Focused browser-mode tests for the internal/ behavior hooks (D-25 review fix): the utility
// contracts get direct unit proof here instead of relying solely on the wave-3 pilot suites.
// Runs in the "browser" vitest project (real chromium) so CSS animations, computed padding,
// and layout actually resolve — none of which jsdom can provide.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act as reactAct, useRef } from 'react';
import { render, renderHook, cleanup } from 'vitest-browser-react';
import { usePresence } from './use-presence';
import { Slot } from './slot';
import { useScrollLock } from './use-scroll-lock';
import { useControllableState } from './use-controllable-state';
import { useFlipPlacement } from './use-flip-placement';

// Real keyframes so onAnimationEnd fires for the presence walk. Animations begin paused: each
// test explicitly releases the timeline it is proving, so delayed test scheduling cannot consume
// the observation window. The panel animation is longer than the child so the child's (bubbled)
// animationend arrives first and must be IGNORED.
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lyra-test-panel-exit { from { opacity: 1; } to { opacity: 0; } }
    @keyframes lyra-test-child-exit { from { opacity: 1; } to { opacity: 0; } }
    .presence-panel--closing { animation: lyra-test-panel-exit 120ms linear forwards paused; }
    .presence-child--closing { animation: lyra-test-child-exit 20ms linear forwards paused; }
    .presence-panel--running { animation-play-state: running; }
    .presence-child--running { animation-play-state: running; }
  `;
  document.head.appendChild(style);
});

afterEach(async () => {
  try {
    await cleanup();
  } finally {
    vi.useRealTimers();
  }
});

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function act(callback: () => void | Promise<void>): Promise<void> {
  const previous = Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
  try {
    await reactAct(callback);
  } finally {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previous);
  }
}

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
      <span
        data-testid="child"
        className={animate && closing ? 'presence-child--closing' : undefined}
      >
        child
      </span>
      panel body
    </div>
  );
}

describe('usePresence', () => {
  it('walks open → closing → unmounted via the panel animation', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { rerender, container } = await render(<PresenceHarness open animate />);
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    await rerender(<PresenceHarness open={false} animate />);
    // Still mounted while the deliberately paused exit animation waits to run.
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    const panel = container.querySelector<HTMLElement>('[data-testid="panel"]')!;
    const panelAnimationEnd = new Promise<void>((resolve) => {
      panel.addEventListener(
        'animationend',
        (event) => {
          expect(event).toBeInstanceOf(AnimationEvent);
          expect(event.target).toBe(panel);
          expect(event.currentTarget).toBe(panel);
          expect((event as AnimationEvent).animationName).toBe('lyra-test-panel-exit');
          resolve();
        },
        { once: true },
      );
    });

    // Release the committed CSS timeline inside act so its native event and React update flush
    // together without an outer act waiting for a rerender to begin the animation.
    await act(async () => {
      panel.classList.add('presence-panel--running');
      await panelAnimationEnd;
    });
    expect(container.querySelector('[data-testid="panel"]')).toBeNull();
  });

  it('ignores a bubbled child animation end (does not unmount early)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { rerender, container } = await render(<PresenceHarness open animate />);
    await rerender(<PresenceHarness open={false} animate />);

    const panel = container.querySelector<HTMLElement>('[data-testid="panel"]')!;
    const child = container.querySelector<HTMLElement>('[data-testid="child"]')!;
    const childAnimationEnd = new Promise<void>((resolve) => {
      panel.addEventListener(
        'animationend',
        (event) => {
          expect(event).toBeInstanceOf(AnimationEvent);
          expect(event.target).toBe(child);
          expect(event.currentTarget).toBe(panel);
          expect((event as AnimationEvent).animationName).toBe('lyra-test-child-exit');
          resolve();
        },
        { once: true },
      );
    });

    // The native child event bubbles to the panel handler, but the paused panel remains mounted.
    await act(async () => {
      child.classList.add('presence-child--running');
      await childAnimationEnd;
    });
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    // Its own animation still finalizes the unmount when that timeline is released.
    const panelAnimationEnd = new Promise<void>((resolve) => {
      panel.addEventListener(
        'animationend',
        (event) => {
          expect(event.target).toBe(panel);
          expect(event.currentTarget).toBe(panel);
          resolve();
        },
        { once: true },
      );
    });
    await act(async () => {
      panel.classList.add('presence-panel--running');
      await panelAnimationEnd;
    });
    expect(container.querySelector('[data-testid="panel"]')).toBeNull();
  });

  it('falls back to the timeout when animations do not run', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    // animate=false → no CSS animation, so onAnimationEnd never fires; the 250ms fallback unmounts.
    const { rerender, container } = await render(<PresenceHarness open animate={false} />);
    await rerender(<PresenceHarness open={false} animate={false} />);
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(249);
    });
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(container.querySelector('[data-testid="panel"]')).toBeNull();
  });

  it('cancels the prior fallback when reopened before a new close', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { rerender, container } = await render(<PresenceHarness open animate />);
    await rerender(<PresenceHarness open={false} animate={false} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Reopen before the first fallback, then begin a new close with its own full deadline.
    await rerender(<PresenceHarness open animate />);
    await rerender(<PresenceHarness open={false} animate={false} />);

    // At 250ms, the first close would unmount if reopening had not cancelled its timeout.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(99);
    });
    expect(container.querySelector('[data-testid="panel"]')).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(container.querySelector('[data-testid="panel"]')).toBeNull();
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
    const { result } = await renderHook(() => useControllableState<number>({ value: 5, onChange }));
    const [value, setValue] = result.current;
    expect(value).toBe(5);

    // Controlled: setter does not change the rendered value by itself, but does call onChange.
    setValue(9);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(9));
    expect(result.current[0]).toBe(5);
  });
});

// --- useFlipPlacement ----------------------------------------------------------------------

function FlipPlacementHarness(): React.JSX.Element {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const placement = useFlipPlacement(true, anchorRef, popoverRef);

  return (
    <>
      <button ref={anchorRef} type="button" style={{ position: 'fixed', bottom: 4, right: 4 }}>
        Anchor
      </button>
      <div ref={popoverRef} style={{ position: 'fixed', width: 240, height: 80 }}>
        {placement.side}/{placement.align}
      </div>
    </>
  );
}

function FlipPlacementGapHarness({ gap }: { gap: number }): React.JSX.Element {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const placement = useFlipPlacement(true, anchorRef, popoverRef, gap);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        style={{
          position: 'fixed',
          top: 'calc(100vh - 106px)',
          width: 20,
          height: 20,
          padding: 0,
          border: 0,
        }}
      >
        Anchor
      </button>
      <div ref={popoverRef} style={{ position: 'fixed', width: 80, height: 80 }} data-gap={gap}>
        {placement.side}
      </div>
    </>
  );
}

describe('useFlipPlacement', () => {
  it('returns a vertical side and horizontal alignment that keep a wide popup in the viewport', async () => {
    const { container } = await render(<FlipPlacementHarness />);
    await vi.waitFor(() => {
      expect(container.querySelector('div')!.textContent).toBe('up/end');
    });
  });

  it("accounts for each popup recipe's rendered gap at the placement boundary", async () => {
    const sixPixelGap = await render(<FlipPlacementGapHarness gap={6} />);
    const eightPixelGap = await render(<FlipPlacementGapHarness gap={8} />);

    await vi.waitFor(() => {
      expect(sixPixelGap.container.querySelector('[data-gap="6"]')!.textContent).toBe('down');
      expect(eightPixelGap.container.querySelector('[data-gap="8"]')!.textContent).toBe('up');
    });
  });
  it('does not let an explicitly-undefined child handler erase the slot handler', async () => {
    const onSlotClick = vi.fn();
    const { container } = await render(
      <Slot onClick={onSlotClick}>
        <button type="button" onClick={undefined}>
          Fused
        </button>
      </Slot>,
    );
    container.querySelector('button')!.click();
    expect(onSlotClick).toHaveBeenCalledTimes(1);
  });
});
