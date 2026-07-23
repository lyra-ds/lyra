import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { CreateWorkspaceDialog } from './index';

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
});

describe('CreateWorkspaceDialog', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`composes its exact classes and is axe clean in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await render(<CreateWorkspaceDialog open onClose={() => {}} />);
        await vi.waitFor(() => expect(document.querySelector('.lyra-wscreate')).not.toBeNull());
        const root = document.querySelector<HTMLElement>('.lyra-wscreate')!;
        expect(root.className).toBe('lyra-wscreate');
        expect(root.querySelector('.lyra-wscreate__preview')!.className).toBe(
          'lyra-wscreate__preview',
        );
        expect(root.querySelector('.lyra-wscreate__preview-hint')!.className).toBe(
          'lyra-wscreate__preview-hint',
        );
        expect(root.querySelector('.lyra-wscreate__slug')!.className).toBe('lyra-wscreate__slug');
        expect(root.querySelector('.lyra-wscreate__slug-prefix')!.className).toBe(
          'lyra-wscreate__slug-prefix',
        );
        expect(root.querySelector('.lyra-wscreate__slug-input')!.className).toBe(
          'lyra-wscreate__slug-input',
        );
        expect(
          (await axe.run(document.body)).violations.filter((item) => item.id !== 'color-contrast'),
        ).toEqual([]);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('auto-generates a slug until manually edited, then submits the trimmed workspace', async () => {
    const onCreate = vi.fn();
    const onClose = vi.fn();
    await render(<CreateWorkspaceDialog open onCreate={onCreate} onClose={onClose} />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-wscreate')).not.toBeNull());
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const slug = document.querySelector<HTMLInputElement>('.lyra-wscreate__slug-input')!;
    const slugLabel = document.querySelectorAll<HTMLLabelElement>('.lyra-wscreate .lyra-label')[1]!;
    expect(slugLabel.htmlFor).toBe(slug.id);
    await userEvent.fill(name, '  Açme & Co  ');
    expect(slug.value).toBe('acme-co');
    await userEvent.fill(slug, 'custom URL');
    await userEvent.fill(name, 'Different Name');
    expect(slug.value).toBe('custom-url');
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;
    await userEvent.click(submit);
    expect(onCreate).toHaveBeenCalledWith({ name: 'Different Name', slug: 'custom-url' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
