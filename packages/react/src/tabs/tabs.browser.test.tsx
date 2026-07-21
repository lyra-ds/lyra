import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Tabs } from './index';

const themes = ['light', 'dark'] as const;
const items = [{ id: 'one', label: 'One', count: 2 }, { id: 'two', label: 'Two' }, { id: 'three', label: 'Three' }];
function setTheme(theme: (typeof themes)[number]): void { if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme'); }
async function expectAxe(root: Element): Promise<void> { expect((await axe.run(root as HTMLElement)).violations.filter((v) => v.id !== 'color-contrast')).toEqual([]); }
afterEach(async () => { await cleanup(); setTheme('light'); });

describe('Tabs', () => {
  for (const theme of themes) it(`emits line and pills classes and is axe clean in ${theme}`, async () => {
    setTheme(theme); const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { const { container } = await render(<Tabs items={items} active="one" variant="pills" onChange={() => {}} />);
      expect(container.querySelector('[role=tablist]')!.className).toBe('lyra-tabs lyra-tabs--pills');
      expect(container.querySelector('[role=tab]')!.className).toBe('lyra-tab lyra-tab--active');
      expect(container.querySelector('.lyra-tab__count')!.className).toBe('lyra-tab__count'); expect(spy).not.toHaveBeenCalled(); await expectAxe(container);
    } finally { spy.mockRestore(); }
  });
  it('roves with automatic activation, wrap, Home and End', async () => {
    function Harness(): React.JSX.Element { const [active, setActive] = useState('one'); return <Tabs items={items} active={active} onChange={setActive} />; }
    const { container } = await render(<Harness />); const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    tabs[0].focus(); await userEvent.keyboard('{ArrowRight}'); expect(document.activeElement).toBe(tabs[1]); expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{End}'); expect(document.activeElement).toBe(tabs[2]); await userEvent.keyboard('{ArrowRight}'); expect(document.activeElement).toBe(tabs[0]); await userEvent.keyboard('{Home}'); expect(document.activeElement).toBe(tabs[0]);
  });
});
