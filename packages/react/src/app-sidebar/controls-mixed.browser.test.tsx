import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { AppSidebarTrigger as RootTrigger } from '@lyra-ds/react';
import { AppSidebarTrigger as EntryTrigger } from '@lyra-ds/react/app-sidebar';
import '@lyra-ds/styles/styles.css';

afterEach(cleanup);

it('arbitrates built root/subpath owners together across siblings, duplicates and nesting', async () => {
  const outer = vi.fn();
  const inner = vi.fn();
  const sibling = vi.fn();
  const screen = await render(
    <StrictMode>
      <RootTrigger controls="outer" collapsed hotkey onCollapsedChange={outer} />
      <EntryTrigger controls="outer" collapsed hotkey onCollapsedChange={outer} />
      <div id="outer">
        <button>Outer action</button>
        <EntryTrigger controls="inner" collapsed hotkey onCollapsedChange={inner} />
        <div id="inner">
          <button>Inner action</button>
        </div>
      </div>
      <EntryTrigger controls="sibling" collapsed hotkey onCollapsedChange={sibling} />
      <div id="sibling">
        <button>Sibling action</button>
      </div>
    </StrictMode>,
  );
  const dispatch = (target: Element) => {
    const event = new KeyboardEvent('keydown', {
      key: 'B',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  expect(dispatch(document.body)).toBe(false);
  expect(outer).not.toHaveBeenCalled();
  expect(sibling).not.toHaveBeenCalled();
  expect(dispatch(screen.getByRole('button', { name: 'Inner action' }).element())).toBe(true);
  expect(inner).toHaveBeenCalledExactlyOnceWith(false);
  expect(outer).not.toHaveBeenCalled();
  dispatch(screen.getByRole('button', { name: 'Outer action' }).element());
  expect(outer).toHaveBeenCalledExactlyOnceWith(false);
  await screen.unmount();
  expect(dispatch(document.body)).toBe(false);
});
