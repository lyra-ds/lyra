import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import lyra from './index';
import enDocsSource from '../../../apps/docs/content/docs/en/components/create-workspace-dialog.mdx?raw';
import ptBrDocsSource from '../../../apps/docs/content/docs/pt-BR/components/create-workspace-dialog.mdx?raw';

Alpine.plugin(lyra);
const hosts: HTMLElement[] = [];

/** Extracts the literal Alpine `html` fenced block from the component's docs page. */
function extractAlpineSnippet(mdxSource: string): string {
  const alpinePanel = mdxSource.split('<StackPanel stack="alpine">')[1];
  if (!alpinePanel) throw new Error('alpine StackPanel not found in docs source');
  const match = /```html\n([\s\S]*?)\n```/.exec(alpinePanel);
  if (!match) throw new Error('alpine html fence not found in docs source');
  return match[1];
}

function mount(snippet: string) {
  const host = document.createElement('div');
  host.innerHTML = snippet;
  document.body.appendChild(host);
  Alpine.initTree(host);
  hosts.push(host);
  const root = host.firstElementChild as HTMLElement;
  const trigger = host.querySelector<HTMLButtonElement>('#create-workspace-trigger')!;
  const name = host.querySelector<HTMLInputElement>('[data-lyra-wscreate-name]')!;
  const slug = host.querySelector<HTMLInputElement>('[data-lyra-wscreate-slug]')!;
  const form = host.querySelector<HTMLFormElement>('form')!;
  const submitButton = host.querySelector<HTMLButtonElement>('[form="workspace-create-form"]')!;
  const closeButton = host.querySelector<HTMLButtonElement>('.lyra-dialog__close')!;
  return { host, root, trigger, name, slug, form, submitButton, closeButton };
}

const tick = () => Alpine.nextTick();

afterEach(() => {
  for (const host of hosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  delete (window as unknown as Record<string, unknown>).createWorkspace;
  delete (window as unknown as Record<string, unknown>).abortWorkspace;
  delete (window as unknown as Record<string, unknown>).criarWorkspace;
  delete (window as unknown as Record<string, unknown>).cancelarRequisicao;
});

describe('create-workspace-dialog docs markup (en)', () => {
  const snippet = extractAlpineSnippet(enDocsSource);

  it('exposes an accessible form, placeholders and the default slug hint', async () => {
    (window as unknown as Record<string, unknown>).createWorkspace = () => new Promise(() => {});
    (window as unknown as Record<string, unknown>).abortWorkspace = () => {};
    const f = mount(snippet);
    await userEvent.click(f.trigger);
    await tick();
    expect(f.form.getAttribute('aria-label')).toBe('Create workspace');
    expect(f.name.getAttribute('placeholder')).toBe('Acme Inc');
    expect(f.slug.getAttribute('placeholder')).toBe('acme-inc');
    const hint = f.host.querySelector('.lyra-hint:not(.lyra-hint--error)');
    expect(hint?.textContent?.trim()).toBe('Lowercase letters, numbers, and hyphens.');
  });

  it('shows the loading spinner and aria-busy on the submit button while submitting', async () => {
    (window as unknown as Record<string, unknown>).createWorkspace = () => new Promise(() => {});
    (window as unknown as Record<string, unknown>).abortWorkspace = () => {};
    const f = mount(snippet);
    await userEvent.click(f.trigger);
    await tick();
    await userEvent.type(f.name, 'Acme');
    await userEvent.click(f.submitButton);
    await tick();
    expect(f.submitButton.getAttribute('aria-busy')).toBe('true');
    expect(f.submitButton.className).toContain('lyra-btn--loading');
    expect(f.submitButton.querySelector('.lyra-btn__spinner')).not.toBeNull();
  });
});

describe('create-workspace-dialog docs markup (pt-BR)', () => {
  const snippet = extractAlpineSnippet(ptBrDocsSource);

  it('uses translated messages and preserves the translated close label', async () => {
    (window as unknown as Record<string, unknown>).criarWorkspace = () => new Promise(() => {});
    (window as unknown as Record<string, unknown>).cancelarRequisicao = () => {};
    const f = mount(snippet);
    await userEvent.click(f.trigger);
    await tick();
    expect(f.closeButton.getAttribute('aria-label')).toBe('Fechar');
    expect(f.form.getAttribute('aria-label')).toBe('Criar workspace');
    expect(f.name.getAttribute('placeholder')).toBe('Acme Inc');
    expect(f.slug.getAttribute('placeholder')).toBe('acme-inc');
    const hint = f.host.querySelector('.lyra-hint:not(.lyra-hint--error)');
    expect(hint?.textContent?.trim()).toBe('Letras minúsculas, números e hifens.');
    f.form.requestSubmit();
    await tick();
    expect(f.name.getAttribute('aria-invalid')).toBe('true');
    const nameError = f.host.querySelector('#workspace-name-error');
    expect(nameError?.textContent).toBe('Informe o nome do workspace.');
  });

  it('shows the loading spinner and aria-busy on the submit button while submitting', async () => {
    (window as unknown as Record<string, unknown>).criarWorkspace = () => new Promise(() => {});
    (window as unknown as Record<string, unknown>).cancelarRequisicao = () => {};
    const f = mount(snippet);
    await userEvent.click(f.trigger);
    await tick();
    await userEvent.type(f.name, 'Acme');
    await userEvent.click(f.submitButton);
    await tick();
    expect(f.submitButton.getAttribute('aria-busy')).toBe('true');
    expect(f.submitButton.className).toContain('lyra-btn--loading');
    expect(f.submitButton.querySelector('.lyra-btn__spinner')).not.toBeNull();
  });
});
