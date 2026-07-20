// FORM-component test template (D-25) — the shape Phase 4 copies for every stateful,
// value-carrying wrapper. Runs in the "browser" vitest project (real chromium) because a
// CSS-first DS needs real rendering: jsdom applies zero CSS, so focus-visible states,
// dark-theme token cascades and axe's color-contrast rule are all untestable there. This
// template adds what Button's SIMPLE template does not: the D-14 controlled/uncontrolled
// contract exercised with real browser typing, and the field-chrome a11y wiring.
//
// The @lyra-ds/styles entry CSS is imported IN THIS TEST (never in src, RCT-03). Vite
// resolves its @import graph and injects it as a <style> — this is the fixture stylesheet.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, cleanup } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Input } from './index';

const SIZES = ['sm', 'md', 'lg'] as const;
const THEMES = ['light', 'dark'] as const;

// Held-out ~120-char label + hint fixtures (backstop): both wrap in the flex-column field
// without overlapping the control.
const LONG_LABEL =
  'Enter the full legal name of the primary account holder exactly as it appears on the government issued identity document';
const LONG_HINT =
  'We use this only to verify your identity during account recovery and never share it with any third party or partner';
// Value longer than the visible box: proves the native single-line horizontal scroll.
const LONG_VALUE =
  'this-is-a-very-long-single-token-value-that-cannot-fit-inside-a-narrow-input-box-and-must-scroll-horizontally';

/** Toggle the dark token cascade on <html>; children rendered into body inherit it. */
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  void document.documentElement.offsetHeight; // force style recalc
}

// Frozen brand tokens (@lyra-ds/styles, Phase 2) carry a known dark-theme color-contrast gap
// tracked in .planning/…/deferred-items.md. The smoke matrix allows ONLY that `color-contrast`
// finding while enforcing every other axe rule at full strength; structural/aria/name
// violations still fail. Dedicated a11y fixtures assert attributes directly.
async function expectNoViolations(
  container: Element,
  opts: { allowFrozenTokenContrast?: boolean } = {},
): Promise<void> {
  const results = await axe.run(container as HTMLElement);
  const violations = opts.allowFrozenTokenContrast
    ? results.violations.filter((v) => v.id !== 'color-contrast')
    : results.violations;
  expect(violations).toEqual([]);
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

// --- Class emission: byte-identical to handoff Input.jsx -------------------------------------

describe('Input — class emission', () => {
  it('bare input emits exactly "lyra-input"', async () => {
    const { container } = await render(<Input aria-label="Bare" />);
    expect(container.querySelector('input')!.className).toBe('lyra-input');
  });

  it('size sm/lg add the modifier; md adds none (default)', async () => {
    const sm = await render(<Input aria-label="Small" size="sm" />);
    expect(sm.container.querySelector('input')!.className).toBe('lyra-input lyra-input--sm');
    await cleanup();
    const lg = await render(<Input aria-label="Large" size="lg" />);
    expect(lg.container.querySelector('input')!.className).toBe('lyra-input lyra-input--lg');
    await cleanup();
    const md = await render(<Input aria-label="Medium" size="md" />);
    expect(md.container.querySelector('input')!.className).toBe('lyra-input');
  });

  it('error adds --error; consumer className is appended LAST (D-09)', async () => {
    const { container } = await render(
      <Input label="Email" error="Required" className="my-field" />,
    );
    expect(container.querySelector('input')!.className).toBe(
      'lyra-input lyra-input--error my-field',
    );
  });
});

// --- D-14 controlled / uncontrolled contract, with real browser typing -----------------------

describe('Input — controlled/uncontrolled (D-14)', () => {
  it('uncontrolled: typing updates the DOM value and fires a real ChangeEvent', async () => {
    const onChange = vi.fn();
    const screen = await render(<Input aria-label="Free" defaultValue="" onChange={onChange} />);
    const input = screen.container.querySelector('input')!;
    await screen.getByRole('textbox').fill('hello');

    expect(input.value).toBe('hello');
    expect(onChange).toHaveBeenCalled();
    const event = onChange.mock.calls.at(-1)![0] as React.ChangeEvent<HTMLInputElement>;
    // A NATIVE ChangeEvent (event.target.value present) — never a bare value.
    expect(event.target).toBeInstanceOf(HTMLInputElement);
    expect(event.target.value).toBe('hello');
  });

  it('controlled (fixed value): typing fires onChange but the DOM value snaps back', async () => {
    const onChange = vi.fn();
    const screen = await render(<Input aria-label="Locked" value="locked" onChange={onChange} />);
    const input = screen.container.querySelector('input')!;
    await screen.getByRole('textbox').fill('typed');

    expect(onChange).toHaveBeenCalled();
    const event = onChange.mock.calls[0]![0] as React.ChangeEvent<HTMLInputElement>;
    expect(event.target).toBeInstanceOf(HTMLInputElement);
    expect(typeof event.target.value).toBe('string');
    // Parent never re-rendered with a new value → the rendered value stays fixed (D-14).
    await expect.poll(() => input.value).toBe('locked');
  });

  it('controlled (stateful parent): value flows through the parent on change', async () => {
    function Controlled(): React.JSX.Element {
      const [v, setV] = useState('');
      return <Input aria-label="Ctrl" value={v} onChange={(e) => setV(e.target.value)} />;
    }
    const screen = await render(<Controlled />);
    const input = screen.container.querySelector('input')!;
    await screen.getByRole('textbox').fill('world');
    await expect.poll(() => input.value).toBe('world');
  });

  it('controlled WITHOUT onChange: re-surfaces the lost React signal as a dev warning (WR-01)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // React normally warns "value without onChange", but the internal handleChange is always
      // attached and suppresses it — so Input must emit its own diagnostic instead.
      await render(<Input aria-label="Frozen" value="locked" />);
      await vi.waitFor(() =>
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('was provided without')),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('controlled WITH onChange: emits no missing-handler warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await render(<Input aria-label="Fine" value="ok" onChange={() => {}} />);
      await new Promise((r) => setTimeout(r, 30));
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('was provided without'));
    } finally {
      warnSpy.mockRestore();
    }
  });
});

// --- Error a11y wiring: class swap + aria-invalid + aria-describedby (merge) ------------------

describe('Input — error a11y wiring', () => {
  it('error swaps hint, sets aria-invalid, and describes the input by the message node', async () => {
    const { container } = await render(<Input label="Email" error="Email is required" />);
    const input = container.querySelector('input')!;
    const message = container.querySelector('.lyra-hint--error')!;
    // no plain hint node coexists
    expect(container.querySelectorAll('.lyra-hint').length).toBe(1);
    expect(message.textContent).toBe('Email is required');
    expect(input.className).toContain('lyra-input--error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(message.id);
    expect(message.id).not.toBe('');
  });

  it('a consumer-provided aria-describedby is MERGED with the generated id, not replaced', async () => {
    const { container } = await render(
      <Input label="Email" error="Bad" aria-describedby="external-help" />,
    );
    const input = container.querySelector('input')!;
    const message = container.querySelector('.lyra-hint--error')!;
    const tokens = input.getAttribute('aria-describedby')!.split(' ');
    expect(tokens).toContain('external-help');
    expect(tokens).toContain(message.id);
  });

  it('hint (no error) is described but not invalid', async () => {
    const { container } = await render(<Input label="Email" hint="We never share it" />);
    const input = container.querySelector('input')!;
    const message = container.querySelector('.lyra-hint')!;
    expect(message.className).toBe('lyra-hint');
    expect(input.getAttribute('aria-describedby')).toBe(message.id);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });
});

// --- id precedence + uniqueness (the deviation's motivating case) ----------------------------

describe('Input — id wiring', () => {
  it('two same-labeled inputs get DISTINCT ids, each wired to its own label', async () => {
    const { container } = await render(
      <div>
        <Input label="Email" />
        <Input label="Email" />
      </div>,
    );
    const inputs = container.querySelectorAll('input');
    const labels = container.querySelectorAll('label');
    expect(inputs[0].id).not.toBe('');
    expect(inputs[1].id).not.toBe('');
    expect(inputs[0].id).not.toBe(inputs[1].id);
    expect(labels[0].getAttribute('for')).toBe(inputs[0].id);
    expect(labels[1].getAttribute('for')).toBe(inputs[1].id);
  });

  it('a consumer id prop wins over the generated id', async () => {
    const { container } = await render(<Input id="my-email" label="Email" />);
    const input = container.querySelector('input')!;
    expect(input.id).toBe('my-email');
    expect(container.querySelector('label')!.getAttribute('for')).toBe('my-email');
  });
});

// --- Partial props: no empty wrapper nodes ---------------------------------------------------

describe('Input — no empty wrapper nodes', () => {
  it('bare input (no label/hint/error/icon) renders WITHOUT .lyra-field or .lyra-input-wrap', async () => {
    const { container } = await render(<Input aria-label="Bare" />);
    expect(container.querySelector('.lyra-field')).toBeNull();
    expect(container.querySelector('.lyra-input-wrap')).toBeNull();
    expect(container.querySelector('.lyra-hint')).toBeNull();
    expect(container.querySelector('input')).not.toBeNull();
  });

  it('label only → field + label, no wrap, no hint', async () => {
    const { container } = await render(<Input label="Name" />);
    expect(container.querySelector('.lyra-field')).not.toBeNull();
    expect(container.querySelector('.lyra-label')).not.toBeNull();
    expect(container.querySelector('.lyra-input-wrap')).toBeNull();
    expect(container.querySelector('.lyra-hint')).toBeNull();
  });

  it('iconLeft with no label/hint/error → .lyra-input-wrap but NO .lyra-field', async () => {
    const { container } = await render(
      <Input aria-label="Search" iconLeft={<svg aria-hidden="true" width="16" height="16" />} />,
    );
    expect(container.querySelector('.lyra-field')).toBeNull();
    expect(container.querySelector('.lyra-input-wrap')).not.toBeNull();
    expect(container.querySelector('.lyra-input-wrap__icon')).not.toBeNull();
  });
});

// --- Smoke matrix: sizes x states, light + dark, zero axe violations -------------------------

describe('Input — smoke matrix (light + dark)', () => {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      it(`${size} labeled+hint in ${theme}: no console errors, zero axe violations`, async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
          setTheme(theme);
          const { container } = await render(
            <Input label="Email" hint="We never share it" size={size} placeholder="you@ex.dev" />,
          );
          expect(errorSpy).not.toHaveBeenCalled();
          await expectNoViolations(container, { allowFrozenTokenContrast: true });
        } finally {
          errorSpy.mockRestore();
        }
      });
    }

    it(`error state in ${theme}: zero axe violations`, async () => {
      setTheme(theme);
      const { container } = await render(<Input label="Email" error="Email is required" />);
      await expectNoViolations(container, { allowFrozenTokenContrast: true });
    });

    it(`iconLeft in ${theme}: zero axe violations`, async () => {
      setTheme(theme);
      const { container } = await render(
        <Input label="Search" iconLeft={<svg aria-hidden="true" width="16" height="16" />} />,
      );
      await expectNoViolations(container, { allowFrozenTokenContrast: true });
    });
  }
});

// --- ref forwarding (D-08) -------------------------------------------------------------------

describe('Input — ref', () => {
  it('ref points at the underlying <input> element, not the wrapper', async () => {
    let node: HTMLInputElement | null = null;
    await render(
      <Input
        label="Email"
        iconLeft={<svg aria-hidden="true" width="16" height="16" />}
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(node).toBeInstanceOf(HTMLInputElement);
    expect(node!.classList.contains('lyra-input')).toBe(true);
  });
});

// --- Overflow backstop: long value scrolls; long label + hint stack without overlap ----------

describe('Input — overflow + long-text backstop', () => {
  it('a value longer than the box scrolls horizontally (native single-line, no wrap)', async () => {
    const { container } = await render(
      <Input aria-label="Long" defaultValue={LONG_VALUE} style={{ width: 120 }} />,
    );
    const input = container.querySelector('input')! as HTMLInputElement;
    expect(input.value).toBe(LONG_VALUE);
    // Content wider than the visible box → the element is horizontally scrollable.
    expect(input.scrollWidth).toBeGreaterThan(input.clientWidth);
  });

  it('~120-char label + hint wrap and stack around the control without overlapping', async () => {
    const { container } = await render(<Input label={LONG_LABEL} hint={LONG_HINT} />);
    const label = container.querySelector('.lyra-label')! as HTMLElement;
    const input = container.querySelector('input')! as HTMLElement;
    const hint = container.querySelector('.lyra-hint')! as HTMLElement;
    const labelRect = label.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const hintRect = hint.getBoundingClientRect();
    // flex-column field: label above the control, hint below it — never overlapping.
    expect(labelRect.bottom).toBeLessThanOrEqual(inputRect.top + 1);
    expect(hintRect.top).toBeGreaterThanOrEqual(inputRect.bottom - 1);
    expect(label.textContent).toBe(LONG_LABEL);
    expect(LONG_LABEL.length).toBeGreaterThanOrEqual(110);
    expect(LONG_LABEL.length).toBeLessThanOrEqual(130);
  });
});
