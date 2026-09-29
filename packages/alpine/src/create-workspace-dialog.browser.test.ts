import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import lyra from './index';
import { expectNoAxeViolations } from './internal/test-axe';
import {
  SLUG_SEQUENCES,
  simulateNativePaste,
} from '../../../tools/create-workspace-dialog/slug-sequences';
import type {
  LyraCreateWorkspaceDialogData,
  LyraCreateWorkspaceDetail,
} from './create-workspace-dialog';

Alpine.plugin(lyra);
const hosts: HTMLElement[] = [];

function mount(rootId = '') {
  const host = document.createElement('div');
  host.innerHTML = `<div id="${rootId}" x-data="lyraCreateWorkspaceDialog({ returnFocusTo: () => document.querySelector('[data-test=trigger]') })">
    <button type="button" data-test="trigger" @click="open = true">Open</button>
    <div class="lyra-dialog-overlay" x-bind="overlay" style="display: none">
      <div class="lyra-dialog" x-bind="panel">
        <div class="lyra-dialog__header"><h2 class="lyra-dialog__title" x-bind="title">Create workspace</h2>
          <button class="lyra-dialog__close" x-bind="close">Close</button></div>
        <div class="lyra-dialog__body"><form id="test-ws-form" class="lyra-wscreate" x-bind="form">
          <div class="lyra-wscreate__preview"><span class="lyra-avatar lyra-avatar--lg lyra-avatar--square"><span aria-hidden="true" x-bind="avatar"></span></span></div>
          <div class="lyra-hint lyra-hint--error" data-lyra-wscreate-error x-bind="errorSummary" aria-label="Workspace creation error"></div>
          <div class="lyra-field"><label class="lyra-label" for="ws-name">Workspace name</label>
            <input class="lyra-input" id="ws-name" data-lyra-wscreate-name x-bind="nameInput">
            <span class="lyra-hint lyra-hint--error" x-show="fieldErrors.name" x-text="fieldErrors.name"></span></div>
          <div class="lyra-field"><label class="lyra-label" for="ws-slug">URL</label>
            <span class="lyra-wscreate__slug"><span class="lyra-wscreate__slug-prefix" x-bind="slugPrefixBinding"></span>
            <input class="lyra-wscreate__slug-input" id="ws-slug" data-lyra-wscreate-slug x-bind="slugInput"></span>
            <span class="lyra-hint lyra-hint--error" x-show="fieldErrors.slug" x-text="fieldErrors.slug"></span></div>
        </form></div>
        <div class="lyra-dialog__footer"><button x-bind="cancelButton">Cancel</button><button form="test-ws-form" x-bind="createButton"><span class="lyra-btn__spinner" aria-hidden="true" x-show="pending"></span>Create workspace</button></div>
      </div>
    </div>
  </div>`;
  document.body.appendChild(host);
  Alpine.initTree(host);
  hosts.push(host);
  const root = host.firstElementChild as HTMLElement;
  const data = Alpine.$data(root) as unknown as LyraCreateWorkspaceDialogData;
  const trigger = host.querySelector<HTMLButtonElement>('[data-test=trigger]')!;
  const name = host.querySelector<HTMLInputElement>('[data-lyra-wscreate-name]')!;
  const slug = host.querySelector<HTMLInputElement>('[data-lyra-wscreate-slug]')!;
  const form = host.querySelector<HTMLFormElement>('form')!;
  const submitButton = host.querySelector<HTMLButtonElement>('[form="test-ws-form"]')!;
  return { host, root, data, trigger, name, slug, form, submitButton };
}

const tick = () => Alpine.nextTick();
async function open(fixture: ReturnType<typeof mount>) {
  fixture.trigger.focus();
  await userEvent.click(fixture.trigger);
  await tick();
}
async function submit(fixture: ReturnType<typeof mount>) {
  fixture.form.requestSubmit();
  await tick();
}

afterEach(() => {
  for (const host of hosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraCreateWorkspaceDialog', () => {
  it('has no axe violations while open', async () => {
    const f = mount();
    await open(f);
    await expectNoAxeViolations(f.host);
  });

  it('generates the slug until it is edited and previews initials', async () => {
    const f = mount();
    await open(f);
    expect(document.activeElement).toBe(f.name);
    await userEvent.type(f.name, 'Ação Global');
    await tick();
    expect(f.slug.value).toBe('acao-global');
    expect(f.host.querySelector('.lyra-avatar span')?.textContent).toBe('AG');
    await userEvent.clear(f.slug);
    // Typed character-by-character (not filled), the DOM is reset to the slugified
    // value after every keystroke — mirroring React's controlled input — so the space
    // in "my|url" is a trailing separator at the instant it lands and is discarded
    // before "u" arrives. This is NOT slugify("my url"); see
    // tools/create-workspace-dialog/slug-sequences.ts (sequence "my-url-keyed").
    await userEvent.type(f.slug, 'my url');
    await userEvent.type(f.name, ' Team');
    await tick();
    expect(f.slug.value).toBe('myurl');
  });

  it('validates and focuses the first invalid field', async () => {
    const f = mount();
    await open(f);
    await submit(f);
    expect(f.data.phase).toBe('error');
    expect(document.activeElement).toBe(f.name);
    expect(f.name.getAttribute('aria-invalid')).toBe('true');
    await userEvent.type(f.name, 'Acme');
    await userEvent.clear(f.slug);
    await submit(f);
    expect(document.activeElement).toBe(f.slug);
    expect(f.slug.getAttribute('aria-invalid')).toBe('true');
  });

  it('deduplicates submit and accepts the matching operation', async () => {
    const f = mount();
    const requests: LyraCreateWorkspaceDetail[] = [];
    f.root.addEventListener('lyra:create-workspace', (e) =>
      requests.push((e as CustomEvent).detail),
    );
    await open(f);
    await userEvent.type(f.name, 'Acme Inc');
    await submit(f);
    await submit(f);
    expect(requests).toHaveLength(1);
    expect(requests[0].name).toBe('Acme Inc');
    expect(requests[0].slug).toBe('acme-inc');
    expect(f.data.phase).toBe('submitting');
    expect(f.form.getAttribute('aria-busy')).toBe('true');
    f.data.accept(requests[0].operationId);
    await tick();
    expect(f.data.open).toBe(false);
    expect(document.activeElement).toBe(f.trigger);
  });

  it('rejects with field errors and focuses the alert, then ignores a stale reply', async () => {
    const f = mount();
    const ids: string[] = [];
    f.root.addEventListener('lyra:create-workspace', (e) =>
      ids.push((e as CustomEvent).detail.operationId),
    );
    await open(f);
    await userEvent.type(f.name, 'Acme');
    await submit(f);
    f.data.reject(ids[0], {
      fieldErrors: { slug: 'Already taken' },
      message: 'Choose another URL.',
    });
    await tick();
    expect(f.data.phase).toBe('error');
    expect(f.data.fieldErrors.slug).toBe('Already taken');
    expect(document.activeElement).toBe(f.host.querySelector('[data-lyra-wscreate-error]'));
    expect(f.host.querySelector('[role=alert]')?.textContent).toBe('Choose another URL.');
    await submit(f);
    expect(ids).toHaveLength(2);
    f.data.accept(ids[0]);
    expect(f.data.phase).toBe('submitting');
    f.data.accept(ids[1]);
    await tick();
    expect(f.data.open).toBe(false);
  });

  it('requests cancellation once, ignores an old outcome, and returns focus after Esc', async () => {
    const f = mount();
    const ids: string[] = [];
    const cancels: string[] = [];
    f.root.addEventListener('lyra:create-workspace', (e) =>
      ids.push((e as CustomEvent).detail.operationId),
    );
    f.root.addEventListener('lyra:create-workspace:cancel', (e) =>
      cancels.push((e as CustomEvent).detail.operationId),
    );
    await open(f);
    await userEvent.type(f.name, 'Acme');
    await submit(f);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await tick();
    expect(f.data.phase).toBe('canceling');
    expect(cancels).toEqual([ids[0]]);
    f.data.cancel(ids[0]);
    await tick();
    expect(f.data.open).toBe(false);
    expect(document.activeElement).toBe(f.trigger);
    await open(f);
    expect(f.name.value).toBe('');
    f.data.reject(ids[0], { message: 'Late' });
    expect(f.data.phase).toBe('editing');
    await userEvent.click(f.host.querySelector<HTMLButtonElement>('.lyra-dialog__close')!);
    await tick();
    expect(document.activeElement).toBe(f.trigger);
  });

  it('cancels a pending operation when visibility is changed externally or the root is destroyed', async () => {
    const f = mount();
    const cancels: string[] = [];
    f.root.addEventListener('lyra:create-workspace:cancel', (e) =>
      cancels.push((e as CustomEvent).detail.operationId),
    );
    await open(f);
    await userEvent.type(f.name, 'Acme');
    await submit(f);
    const firstId = f.data.operationId!;
    f.data.open = false;
    await tick();
    expect(cancels).toEqual([firstId]);
    f.data.accept(firstId);
    await open(f);
    await userEvent.type(f.name, 'Acme');
    await submit(f);
    const secondId = f.data.operationId!;
    Alpine.destroyTree(f.host);
    expect(cancels).toEqual([firstId, secondId]);
  });

  it('does not reuse operation IDs across remounts with the same root ID', async () => {
    const first = mount('workspace-dialog');
    await open(first);
    await userEvent.type(first.name, 'Acme');
    await submit(first);
    const oldId = first.data.operationId!;
    Alpine.destroyTree(first.host);
    first.host.remove();

    const second = mount('workspace-dialog');
    await open(second);
    await userEvent.type(second.name, 'Acme');
    await submit(second);
    expect(second.data.operationId).not.toBe(oldId);
    second.data.accept(oldId);
    expect(second.data.phase).toBe('submitting');
  });

  it('moves focus into the panel on a real submit-button click so Escape still cancels', async () => {
    const f = mount();
    await open(f);
    await userEvent.type(f.name, 'Acme');
    await userEvent.click(f.submitButton);
    await tick();
    expect(f.data.phase).toBe('submitting');
    expect(document.activeElement).toBe(f.name);
    await userEvent.keyboard('{Escape}');
    await tick();
    expect(f.data.phase).toBe('canceling');
  });

  it('shows the loading spinner and aria-busy on the submit button while submitting and canceling', async () => {
    const f = mount();
    await open(f);
    await userEvent.type(f.name, 'Acme');
    await userEvent.click(f.submitButton);
    await tick();
    expect(f.submitButton.getAttribute('aria-busy')).toBe('true');
    expect(f.submitButton.className).toContain('lyra-btn--loading');
    await expect
      .poll(() => getComputedStyle(f.submitButton.querySelector('.lyra-btn__spinner')!).display)
      .not.toBe('none');
    await userEvent.keyboard('{Escape}');
    await tick();
    expect(f.data.phase).toBe('canceling');
    expect(f.submitButton.getAttribute('aria-busy')).toBe('true');
    expect(f.submitButton.className).toContain('lyra-btn--loading');
  });

  it('resyncs the slug input DOM value on every keystroke, not just on blur', async () => {
    const f = mount();
    await open(f);
    await userEvent.type(f.name, 'Acme');
    f.slug.focus();
    await userEvent.type(f.slug, '!');
    await tick();
    // A discarded trailing separator must disappear immediately — matching React's
    // controlled re-render — not linger until blur (DF-CWD-SLUG regression).
    expect(f.data.slug).toBe('acme');
    expect(f.slug.value).toBe('acme');
    await userEvent.click(f.name);
    await tick();
    expect(f.slug.value).toBe('acme');
  });

  // DF-CWD-SLUG — matches the React reference model keystroke-for-keystroke. See each
  // sequence's `description` in tools/create-workspace-dialog/slug-sequences.ts (kept
  // out of the test title — filenames derived from long titles overflow macOS path
  // limits for the Playwright trace/screenshot artifacts).
  describe('DF-CWD-SLUG slug sequences', () => {
    for (const sequence of SLUG_SEQUENCES) {
      it(sequence.id, async () => {
        const f = mount();
        await open(f);
        f.slug.focus();
        for (const [index, step] of sequence.steps.entries()) {
          if (step.type === 'key') {
            await userEvent.type(f.slug, step.char);
          } else {
            simulateNativePaste(f.slug, step.text);
          }
          await tick();
          expect(f.slug.value).toBe(sequence.expectedDisplayed[index]);
          expect(f.data.slug).toBe(sequence.expectedDisplayed[index]);
        }
        await userEvent.type(f.name, 'Acme');
        const requests: LyraCreateWorkspaceDetail[] = [];
        f.root.addEventListener('lyra:create-workspace', (e) =>
          requests.push((e as CustomEvent).detail),
        );
        await submit(f);
        expect(requests[0]?.slug).toBe(sequence.expectedFinal);
      });
    }
  });
});
