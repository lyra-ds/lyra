import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { SegmentedControl, type SegmentedControlOption } from './index';

const options: SegmentedControlOption[] = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT', disabled: true },
  { value: 'fr', label: 'FR' },
  { value: 'es', label: 'ES' },
];

function Harness({ initial = 'en' }: { initial?: string }): React.JSX.Element {
  const [value, setValue] = useState(initial);
  return <SegmentedControl options={options} value={value} onChange={setValue} label="Language" />;
}

function radio(container: Element, name: string): HTMLButtonElement {
  return (
    container.querySelector<HTMLButtonElement>(`[role=radio][aria-label="${name}"]`) ??
    Array.from(container.querySelectorAll<HTMLButtonElement>('[role=radio]')).find(
      (option) => option.textContent === name,
    )!
  );
}

afterEach(cleanup);

describe('SegmentedControl', () => {
  it('exposes radiogroup semantics, a single Tab stop, and focus styling', async () => {
    const { container } = await render(<Harness />);
    const group = container.querySelector<HTMLElement>('[role=radiogroup]')!;
    const radios = container.querySelectorAll<HTMLButtonElement>('[role=radio]');

    await expect.element(group).toHaveAttribute('aria-label', 'Language');
    await expect.element(radios[0]).toHaveAttribute('aria-checked', 'true');
    await expect.element(radios[1]).toHaveAttribute('aria-checked', 'false');
    expect(Array.from(radios).filter((option) => option.tabIndex === 0)).toHaveLength(1);
    await userEvent.tab();
    await expect.element(radios[0]).toHaveFocus();
    expect(getComputedStyle(radios[0]).boxShadow).not.toBe('none');
  });

  it('enters the radiogroup at the checked non-first option', async () => {
    const { container } = await render(<Harness initial="fr" />);
    const fr = radio(container, 'FR');

    await userEvent.tab();

    await expect.element(fr).toHaveFocus();
  });

  it('moves right with selection, wrapping and disabled-option skipping', async () => {
    const { container } = await render(<Harness initial="es" />);
    const es = radio(container, 'ES');
    const en = radio(container, 'EN');
    es.focus();
    await userEvent.keyboard('{ArrowRight}');

    await expect.element(en).toHaveFocus();
    await expect.element(en).toHaveAttribute('aria-checked', 'true');
  });

  it('moves left with selection, wrapping and disabled-option skipping', async () => {
    const { container } = await render(<Harness />);
    const en = radio(container, 'EN');
    const es = radio(container, 'ES');
    en.focus();
    await userEvent.keyboard('{ArrowLeft}');

    await expect.element(es).toHaveFocus();
    await expect.element(es).toHaveAttribute('aria-checked', 'true');
  });

  it('moves up with selection and skips disabled options', async () => {
    const { container } = await render(<Harness initial="fr" />);
    const fr = radio(container, 'FR');
    const en = radio(container, 'EN');
    fr.focus();
    await userEvent.keyboard('{ArrowUp}');

    await expect.element(en).toHaveFocus();
    await expect.element(en).toHaveAttribute('aria-checked', 'true');
  });

  it('moves down with selection and skips disabled options', async () => {
    const { container } = await render(<Harness />);
    const en = radio(container, 'EN');
    const fr = radio(container, 'FR');
    en.focus();
    await userEvent.keyboard('{ArrowDown}');

    await expect.element(fr).toHaveFocus();
    await expect.element(fr).toHaveAttribute('aria-checked', 'true');
  });

  it('moves Home to the first enabled option and selects it', async () => {
    const { container } = await render(<Harness initial="es" />);
    const es = radio(container, 'ES');
    const en = radio(container, 'EN');
    es.focus();
    await userEvent.keyboard('{Home}');

    await expect.element(en).toHaveFocus();
    await expect.element(en).toHaveAttribute('aria-checked', 'true');
  });

  it('moves End to the last enabled option and selects it', async () => {
    const { container } = await render(<Harness />);
    const en = radio(container, 'EN');
    const es = radio(container, 'ES');
    en.focus();
    await userEvent.keyboard('{End}');

    await expect.element(es).toHaveFocus();
    await expect.element(es).toHaveAttribute('aria-checked', 'true');
  });

  it('is axe clean', async () => {
    const { container } = await render(<Harness />);
    await expectNoAxeViolations(container);
  });
});
