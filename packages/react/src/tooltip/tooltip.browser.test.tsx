import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Tooltip } from './index';
const themes = ['light', 'dark'] as const;
function setTheme(theme: (typeof themes)[number]): void { if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme'); }
afterEach(async () => { await cleanup(); setTheme('light'); });
describe('Tooltip', () => {
  for (const theme of themes) it(`wires its target and is axe clean in ${theme}`, async () => { setTheme(theme); const spy = vi.spyOn(console, 'error').mockImplementation(() => {}); try { const { container } = await render(<Tooltip tip="More information"><button type="button">Info</button></Tooltip>); const root = container.querySelector('.lyra-tooltip')!; const trigger = container.querySelector('button')!; const tooltip = container.querySelector('[role=tooltip]')!; expect(root.className).toBe('lyra-tooltip'); expect(root.getAttribute('data-tip')).toBe('More information'); expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id); expect(spy).not.toHaveBeenCalled(); expect((await axe.run(container)).violations.filter((v) => v.id !== 'color-contrast')).toEqual([]); } finally { spy.mockRestore(); } });
  it('opens on focus and closes on Escape without moving focus', async () => { const { container } = await render(<Tooltip tip="Help"><button type="button">Info</button></Tooltip>); const root = container.querySelector<HTMLElement>('.lyra-tooltip')!; const trigger = container.querySelector<HTMLButtonElement>('button')!; trigger.focus(); await vi.waitFor(() => { expect(root.getAttribute('data-state')).toBe('open'); }); await userEvent.keyboard('{Escape}'); expect(root.getAttribute('data-state')).toBe('closed'); expect(document.activeElement).toBe(trigger); });
});
