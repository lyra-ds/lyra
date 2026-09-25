import { act as reactAct } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server, userEvent } from 'vitest/browser';
import { P1Compatibility } from './p1';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
let container: HTMLDivElement;
let root: Root | null;

async function act(callback: () => Promise<void>): Promise<void> {
  const hadEnvironment = Object.hasOwn(reactActEnvironment, 'IS_REACT_ACT_ENVIRONMENT');
  const previousEnvironment = reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await reactAct(callback);
  } finally {
    if (hadEnvironment) reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = previousEnvironment;
    else delete reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
  }
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = null;
});

afterEach(async () => {
  if (root !== null) await act(async () => root?.unmount());
  container.remove();
});

async function withHydratedP1(assertion: () => Promise<void>): Promise<void> {
  const recoverableErrors: unknown[] = [];
  const consoleErrors: unknown[][] = [];
  const consoleWarnings: unknown[][] = [];
  const previousConsoleError = console.error;
  const previousConsoleWarn = console.warn;
  console.error = (...arguments_: unknown[]) => consoleErrors.push(arguments_);
  console.warn = (...arguments_: unknown[]) => consoleWarnings.push(arguments_);

  try {
    const serverMarkup = await server.commands.readFile('p1-ssr.html');
    expect(serverMarkup).toContain('P1 packed inline markup');
    container.innerHTML = serverMarkup;
    await act(async () => {
      root = hydrateRoot(container, <P1Compatibility />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });
    await assertion();
    expect(recoverableErrors).toEqual([]);
    expect(consoleErrors, JSON.stringify(consoleErrors)).toEqual([]);
    expect(consoleWarnings, JSON.stringify(consoleWarnings)).toEqual([]);
  } finally {
    console.error = previousConsoleError;
    console.warn = previousConsoleWarn;
  }
}

function control(name: string): HTMLButtonElement {
  const element = container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`);
  expect(element).not.toBeNull();
  return element!;
}

function output(name: string): HTMLOutputElement {
  const element = container.querySelector<HTMLOutputElement>(`output[aria-label="${name}"]`);
  expect(element).not.toBeNull();
  return element!;
}

async function closeModal(
  opener: HTMLButtonElement,
  selector: string,
  stateName: string,
): Promise<void> {
  await act(async () => {
    await userEvent.click(opener);
  });
  await vi.waitFor(() => expect(document.querySelector(selector)).not.toBeNull());
  expect(output(stateName).value).toBe('open');
  await act(async () => {
    await userEvent.keyboard('{Escape}');
  });
  await vi.waitFor(() => expect(document.querySelector(selector)).toBeNull());
  expect(output(stateName).value).toBe('closed');
  expect(document.activeElement).toBe(opener);
}

describe('packed P1 browser compatibility', () => {
  it('P1browser: Dialog', async () => {
    await withHydratedP1(() =>
      closeModal(control('Open P1 dialog'), '.lyra-dialog', 'P1 dialog state'),
    );
  });

  it('P1browser: Drawer', async () => {
    await withHydratedP1(() =>
      closeModal(control('Open P1 drawer'), '.lyra-drawer', 'P1 drawer state'),
    );
  });

  it('P1browser: BottomSheet', async () => {
    await withHydratedP1(() =>
      closeModal(control('Open P1 bottom sheet'), '.lyra-bottomsheet', 'P1 bottom sheet state'),
    );
  });

  it('P1browser: Popover', async () => {
    await withHydratedP1(async () => {
      const opener = control('Open P1 popover');
      await act(async () => {
        await userEvent.click(opener);
      });
      await vi.waitFor(() => expect(container.querySelector('[role="dialog"]')).not.toBeNull());
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(opener);
    });
  });

  it('P1browser: Dropdown', async () => {
    await withHydratedP1(async () => {
      await act(async () => {
        await userEvent.click(control('Open P1 dropdown'));
      });
      const option = container.querySelector<HTMLButtonElement>('[role="menuitem"]');
      expect(option?.textContent).toContain('Select P1 option');
      await act(async () => {
        await userEvent.click(option!);
      });
      expect(output('P1 dropdown value').value).toBe('P1 dropdown selected');
    });
  });

  it('P1browser: Tooltip', async () => {
    await withHydratedP1(async () => {
      const target = control('P1 tooltip target');
      await act(async () => {
        await userEvent.hover(target);
      });
      await act(async () => {
        await userEvent.click(target);
      });
      await vi.waitFor(() =>
        expect(container.querySelector<HTMLElement>('.lyra-tooltip')?.dataset.state).toBe('open'),
      );
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });
      expect(container.querySelector<HTMLElement>('.lyra-tooltip')?.dataset.state).toBe('closed');
    });
  });

  it('P1browser: CommandPalette', async () => {
    await withHydratedP1(async () => {
      await act(async () => {
        await userEvent.click(control('Open P1 command palette'));
      });
      const search = document.querySelector<HTMLInputElement>('[role="combobox"]');
      expect(search).not.toBeNull();
      await act(async () => {
        await userEvent.type(search!, 'Choose');
      });
      await act(async () => {
        await userEvent.keyboard('{Enter}');
      });
      expect(output('P1 command result').value).toBe('P1 command selected: Choose P1 command');
      await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
    });
  });

  it('P1browser: WorkspaceSwitcher', async () => {
    await withHydratedP1(async () => {
      const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger');
      expect(trigger).not.toBeNull();
      await act(async () => {
        await userEvent.click(trigger!);
      });
      const south = Array.from(
        container.querySelectorAll<HTMLButtonElement>('button.lyra-wssw__item[data-id]'),
      ).find((option) => option.textContent?.includes('South workspace'));
      expect(south).toBeDefined();
      await act(async () => {
        await userEvent.click(south!);
      });
      expect(output('P1 selected workspace').value).toBe('South workspace');
    });
  });

  it('P1browser: CreateWorkspaceDialog', async () => {
    await withHydratedP1(async () => {
      await act(async () => {
        await userEvent.click(control('Open P1 create workspace dialog'));
      });
      const name = document.querySelector<HTMLInputElement>('.lyra-wscreate .lyra-input');
      expect(name).not.toBeNull();
      await act(async () => {
        await userEvent.type(name!, 'P1 Created Workspace');
      });
      const create = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
      ).find((button) => button.textContent?.includes('Create workspace'));
      expect(create).toBeDefined();
      await act(async () => {
        await userEvent.click(create!);
      });
      expect(output('P1 create workspace requests').value).toBe('1');
      expect(output('P1 create workspace result').value).toBe(
        'P1 workspace created: P1 Created Workspace',
      );
      await vi.waitFor(() => expect(document.querySelector('.lyra-wscreate')).toBeNull());
    });
  });

  it('P1browser: Tabs', async () => {
    await withHydratedP1(async () => {
      const activity = container.querySelector<HTMLButtonElement>(
        '[role="tab"][aria-controls="p1-tabs-panel-activity"]',
      );
      expect(activity).not.toBeNull();
      await act(async () => {
        await userEvent.click(activity!);
      });
      expect(activity?.getAttribute('aria-selected')).toBe('true');
      const panel = container.querySelector<HTMLElement>('#p1-tabs-panel-activity');
      expect(panel?.getAttribute('aria-labelledby')).toBe(activity?.id);
      expect(panel?.hidden).toBe(false);
      expect(panel?.textContent).toContain('P1 activity panel');
    });
  });

  it('P1browser: DataTable', async () => {
    await withHydratedP1(async () => {
      const total = Array.from(
        container.querySelectorAll<HTMLButtonElement>('.lyra-table__sortbtn'),
      ).find((button) => button.textContent?.includes('Total'));
      expect(total).toBeDefined();
      await act(async () => {
        await userEvent.click(total!);
      });
      expect(output('P1 table sorting').value).toBe('total:asc');
      expect(container.querySelector('tbody tr')?.textContent).toContain('South project');
    });
  });
});
