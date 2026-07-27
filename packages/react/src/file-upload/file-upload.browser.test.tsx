import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { FileUpload } from './index';

const THEMES = ['light', 'dark'] as const;
const DONE_ITEM = {
  id: 'report',
  name: 'report.pdf',
  size: 1024,
  progress: 100,
  status: 'done',
} as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('FileUpload', () => {
  for (const theme of THEMES) {
    it(`emits its exact classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<FileUpload defaultItems={[DONE_ITEM]} />);
        expect(container.querySelector('.lyra-upload')!.className).toBe('lyra-upload');
        expect(container.querySelector('.lyra-upload__zone')!.className).toBe('lyra-upload__zone');
        expect(container.querySelector('.lyra-upload__list')!.className).toBe('lyra-upload__list');
        expect(container.querySelector('.lyra-upload__item')!.className).toBe('lyra-upload__item');
        expect(errorSpy).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('activates browsing from its keyboard-operable dropzone and removes an item', async () => {
    const onChange = vi.fn();
    const screen = await render(<FileUpload defaultItems={[DONE_ITEM]} onChange={onChange} />);
    const zone = screen.container.querySelector('.lyra-upload__zone')!;
    const input = screen.container.querySelector('input[type="file"]')!;
    const inputClick = vi.fn();
    input.addEventListener('click', inputClick);
    (zone as HTMLButtonElement).focus();
    await userEvent.keyboard('{Enter}');
    expect(inputClick).toHaveBeenCalledOnce();
    await screen.getByRole('button', { name: 'Remove report.pdf' }).click();
    expect(screen.container.querySelector('.lyra-upload__item')).toBeNull();
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('adds real File objects and flags files that exceed maxSizeMB', async () => {
    const onFiles = vi.fn();
    const onChange = vi.fn();
    const { container } = await render(
      <FileUpload maxSizeMB={1} onFiles={onFiles} onChange={onChange} />,
    );
    const zone = container.querySelector('.lyra-upload__zone')!;
    const dataTransfer = new DataTransfer();
    const file = new File([new Uint8Array(1024 * 1024 + 1)], 'large.pdf', {
      type: 'application/pdf',
    });
    dataTransfer.items.add(file);
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
    await vi.waitFor(() =>
      expect(container.querySelector('.lyra-upload__item--error')).not.toBeNull(),
    );
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(onChange.mock.calls.at(-1)![0][0]).toMatchObject({ name: 'large.pdf', status: 'error' });
  });

  it('uses "Upload complete" as the default accessible name for completed uploads', async () => {
    const { container } = await render(<FileUpload defaultItems={[DONE_ITEM]} />);
    expect(container.querySelector('.lyra-upload__check')!.getAttribute('aria-label')).toBe(
      'Upload complete',
    );
  });

  it('uses doneLabel as the accessible name for completed uploads', async () => {
    const { container } = await render(
      <FileUpload defaultItems={[DONE_ITEM]} doneLabel="Upload concluído" />,
    );
    expect(container.querySelector('.lyra-upload__check')!.getAttribute('aria-label')).toBe(
      'Upload concluído',
    );
  });

  it('uses the file name in the default accessible name for each remove button', async () => {
    const { container } = await render(<FileUpload defaultItems={[DONE_ITEM]} />);
    expect(container.querySelector('.lyra-upload__remove')!.getAttribute('aria-label')).toBe(
      'Remove report.pdf',
    );
  });

  it('passes the file name to removeLabel for each remove button', async () => {
    const { container } = await render(
      <FileUpload defaultItems={[DONE_ITEM]} removeLabel={(name) => `Excluir ${name}`} />,
    );
    expect(container.querySelector('.lyra-upload__remove')!.getAttribute('aria-label')).toBe(
      'Excluir report.pdf',
    );
  });
});
