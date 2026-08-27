import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';

import {
  MANUAL_MEDIA_TYPES,
  MAX_MANUAL_FILE_BYTES,
  type EnvironmentTelemetry,
  type Locale,
  type ManualScenario,
} from './contracts';
import {
  createManualEvidenceBundle,
  type ManualEvidenceBundle,
  type ManualEvidenceAttachments,
} from './evidence-bundle';
import { HarnessApp, type HarnessAppProps } from './harness-app';

const REVISION = '1234567890abcdef1234567890abcdef12345678';
const DEPLOYMENT_URL = 'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const NEXT_REVISION = 'abcdef1234567890abcdef1234567890abcdef12';
const NEXT_DEPLOYMENT_URL = 'https://e5f6a7b8.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const EXECUTED_AT = '2026-08-17T15:30:00.000Z';
const BUNDLE: ManualEvidenceBundle = {
  bytes: new Uint8Array([80, 75]),
  fileName: 'lyra-file-upload-evidence-1234567890ab.zip',
  mediaType: 'application/zip',
};

function telemetry(width = 1280): EnvironmentTelemetry {
  return {
    userAgent: 'Evidence Browser/1.0',
    timezone: 'America/Sao_Paulo',
    viewport: { width, height: 720, devicePixelRatio: 2 },
    mediaQueries: {
      '(pointer: coarse)': false,
      '(any-pointer: coarse)': false,
      '(hover: none)': false,
      '(any-hover: none)': false,
    },
    coarsePointer: false,
  };
}

function appProps(locale: Locale, overrides: Partial<HarnessAppProps> = {}): HarnessAppProps {
  return {
    locale,
    revision: REVISION,
    buildTime: '2026-08-17T14:00:00.000Z',
    deploymentUrl:
      locale === 'en'
        ? DEPLOYMENT_URL
        : 'https://a1b2c3d4.lyra-ds-docs.pages.dev/pt-BR/file-upload-evidence/',
    alpineDelayMilliseconds: 5_000,
    captureEnvironment: () => telemetry(),
    now: () => new Date(EXECUTED_AT),
    ...overrides,
  };
}

function inputByName(name: string): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(`.lyra-evidence input[name="${name}"]`);
  if (input === null) throw new Error(`Expected input ${name}.`);
  return input;
}

function textareaByName(name: string): HTMLTextAreaElement {
  const textarea = document.querySelector<HTMLTextAreaElement>(
    `.lyra-evidence textarea[name="${name}"]`,
  );
  if (textarea === null) throw new Error(`Expected textarea ${name}.`);
  return textarea;
}

function selectByName(name: string): HTMLSelectElement {
  const select = document.querySelector<HTMLSelectElement>(`.lyra-evidence select[name="${name}"]`);
  if (select === null) throw new Error(`Expected select ${name}.`);
  return select;
}

function attachmentInput(): HTMLInputElement {
  return inputByName('evidenceAttachments');
}

async function fillInput(name: string, value: string): Promise<void> {
  await userEvent.fill(inputByName(name), value);
}

async function fillTextarea(name: string, value: string): Promise<void> {
  await userEvent.fill(textareaByName(name), value);
}

async function choose(name: string, value: string): Promise<void> {
  await userEvent.selectOptions(selectByName(name), value);
}

async function selectScenario(_locale: Locale, scenario: ManualScenario): Promise<void> {
  await userEvent.selectOptions(selectByName('scenario'), scenario);
}

async function selectFiles(files: readonly File[]): Promise<void> {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  const input = attachmentInput();
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  await Promise.resolve();
}

function evidenceFile(name: string, type = 'image/png'): File {
  return new File([`evidence for ${name}`], name, { type });
}

async function completeObservation(
  locale: Locale,
  file: File,
  result: 'PASS' | 'FAIL' = 'PASS',
): Promise<void> {
  await fillInput('os.name', locale === 'en' ? 'Windows' : 'macOS');
  await fillInput('os.version', '11');
  await fillInput('os.build', '26100.1');
  await fillInput('browser.name', locale === 'en' ? 'Firefox' : 'Safari');
  await fillInput('browser.version', '140');
  await fillInput('assistiveTechnology.name', locale === 'en' ? 'NVDA' : 'VoiceOver');
  await fillInput('assistiveTechnology.version', '2026.1');
  await page
    .getByLabelText(locale === 'en' ? 'Physical keyboard used' : 'Teclado físico usado')
    .click();
  await fillTextarea(
    'actual',
    locale === 'en'
      ? 'The observed announcement and focus behavior.'
      : 'O anúncio e o comportamento de foco observados.',
  );
  await selectFiles([file]);
  await choose('result', result);
  await fillInput('reviewer.name', 'Alex Reviewer');
  await choose('reviewer.approval', result === 'PASS' ? 'approved' : 'changes-requested');
  if (result === 'PASS') {
    for (const check of document.querySelectorAll<HTMLInputElement>(
      '.lyra-evidence__checklist input[type="checkbox"]',
    )) {
      await userEvent.click(check);
    }
  }
}

function bundleBoundary() {
  const createBundle = vi.fn<typeof createManualEvidenceBundle>().mockResolvedValue(BUNDLE);
  const downloadBundle = vi.fn<(bundle: ManualEvidenceBundle) => void>();
  return { createBundle, downloadBundle };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('two-scenario local evidence recorder', () => {
  it.each([
    {
      locale: 'en' as const,
      label: 'Manual scenario',
      options: [
        'DF-FU-M01 — Windows, NVDA, and a current Firefox or Chromium browser',
        'DF-FU-M02 — macOS, VoiceOver, and Safari',
      ],
    },
    {
      locale: 'pt-BR' as const,
      label: 'Cenário manual',
      options: [
        'DF-FU-M01 — Windows, NVDA e Firefox ou Chromium atual',
        'DF-FU-M02 — macOS, VoiceOver e Safari',
      ],
    },
  ])('exposes only M01 and M02 and immutable environment fields in $locale', async (fixture) => {
    await render(<HarnessApp {...appProps(fixture.locale)} />);

    const scenario = selectByName('scenario');
    expect(scenario).toHaveAccessibleName(fixture.label);
    expect([...scenario.options].map(({ value, text }) => ({ value, text }))).toEqual([
      { value: 'DF-FU-M01', text: fixture.options[0] },
      { value: 'DF-FU-M02', text: fixture.options[1] },
    ]);
    expect(page.getByText(/DF-FU-M0[34]/u)).not.toBeInTheDocument();

    for (const name of [
      'revision',
      'deploymentUrl',
      'executedAt',
      'timezone',
      'viewport.width',
      'viewport.height',
      'viewport.devicePixelRatio',
    ]) {
      expect(inputByName(name)).toHaveAttribute('readonly');
    }
    expect(inputByName('revision')).toHaveValue(REVISION);
    expect(inputByName('deploymentUrl')).toHaveValue(appProps(fixture.locale).deploymentUrl);
    expect(document.querySelector('[name="artifactUrls"]')).toBeNull();
    expect(page.getByRole('button', { name: /Copy JSON|Copiar JSON/u })).not.toBeInTheDocument();
    expect(
      page.getByRole('button', { name: /Download JSON|Baixar JSON/u }),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      locale: 'en' as const,
      label: 'Local evidence files',
      guidance:
        'Select 1–4 files. Each file may be up to 50 MiB; combined size may be up to 100 MiB.',
    },
    {
      locale: 'pt-BR' as const,
      label: 'Arquivos locais de evidência',
      guidance:
        'Selecione de 1 a 4 arquivos. Cada arquivo pode ter até 50 MiB; o total pode ter até 100 MiB.',
    },
  ])('offers a bounded native attachment picker in $locale', async (fixture) => {
    await render(<HarnessApp {...appProps(fixture.locale)} />);

    const input = attachmentInput();
    expect(input).toHaveAccessibleName(fixture.label);
    expect(input.type).toBe('file');
    expect(input.multiple).toBe(true);
    expect(input.accept.split(',')).toEqual([...MANUAL_MEDIA_TYPES]);
    expect(page.getByText(fixture.guidance, { exact: false })).toBeVisible();
    expect(document.querySelector('textarea[name="expected"]')).toBeNull();
    expect(page.getByText(/Expected outcome|Resultado esperado/u)).toBeVisible();
  });

  it.each([
    {
      locale: 'en' as const,
      file: new File(['unsafe'], 'evidence.txt', { type: 'text/plain' }),
      error: 'evidence.txt has an unsupported media type.',
      download: 'Download evidence ZIP',
    },
    {
      locale: 'pt-BR' as const,
      file: new File([new Uint8Array(MAX_MANUAL_FILE_BYTES + 1)], 'grande.mp4', {
        type: 'video/mp4',
      }),
      error: 'grande.mp4 é maior que 50 MiB.',
      download: 'Baixar ZIP de evidências',
    },
  ])('announces invalid attachment selection and blocks export in $locale', async (fixture) => {
    await render(<HarnessApp {...appProps(fixture.locale)} />);
    await selectFiles([fixture.file]);

    const error = page.getByRole('alert');
    expect(error).toHaveTextContent(fixture.error);
    expect(attachmentInput()).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(error.element().id),
    );
    expect(page.getByRole('button', { name: fixture.download })).toBeDisabled();
  });

  it('downloads one valid record with its real local File and no endpoint request', async () => {
    const boundary = bundleBoundary();
    const opened = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const file = evidenceFile('m01-screen.png');
    await render(<HarnessApp {...appProps('en', boundary)} />);
    await completeObservation('en', file);

    await page.getByRole('button', { name: 'Download evidence ZIP' }).click();

    expect(boundary.createBundle).toHaveBeenCalledTimes(1);
    const [records, attachments] = boundary.createBundle.mock.calls[0] ?? [];
    expect(records).toHaveLength(1);
    expect(records?.[0]).toMatchObject({
      scenario: 'DF-FU-M01',
      locale: 'en',
      revision: REVISION,
      expected:
        'The FileUpload lifecycle, announcements, progress, recovery, and focus match the guided M01 checks.',
      actual: 'The observed announcement and focus behavior.',
      artifactPaths: ['artifacts/DF-FU-M01/m01-screen.png'],
      result: 'PASS',
      reviewer: { name: 'Alex Reviewer', approval: 'approved' },
    });
    expect(attachments).toBeInstanceOf(Map);
    expect((attachments as ManualEvidenceAttachments).get('DF-FU-M01')?.[0]).toBe(file);
    expect(boundary.downloadBundle).toHaveBeenCalledExactlyOnceWith(BUNDLE);
    expect(opened.mock.calls.some(([, url]) => url === '/api/file-upload-evidence')).toBe(false);
    expect(page.getByText('ZIP includes: DF-FU-M01.')).toBeVisible();
  });

  it('preserves both drafts and their File objects and downloads two completed records', async () => {
    const boundary = bundleBoundary();
    const m01File = evidenceFile('m01.png');
    const m02File = evidenceFile('m02.webp', 'image/webp');
    await render(<HarnessApp {...appProps('en', boundary)} />);
    await completeObservation('en', m01File);
    await selectScenario('en', 'DF-FU-M02');
    await completeObservation('en', m02File);

    await selectScenario('en', 'DF-FU-M01');
    expect(page.getByText('m01.png', { exact: true })).toBeVisible();
    expect(inputByName('os.name')).toHaveValue('Windows');
    await selectScenario('en', 'DF-FU-M02');
    expect(page.getByText('m02.webp', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Download evidence ZIP' }).click();

    const [records, attachments] = boundary.createBundle.mock.calls[0] ?? [];
    expect(records?.map(({ scenario }) => scenario)).toEqual(['DF-FU-M01', 'DF-FU-M02']);
    expect((attachments as ManualEvidenceAttachments).get('DF-FU-M01')).toEqual([m01File]);
    expect((attachments as ManualEvidenceAttachments).get('DF-FU-M02')).toEqual([m02File]);
    expect(page.getByText('ZIP includes: DF-FU-M01 and DF-FU-M02.')).toBeVisible();
  });

  it('resets drafts for a new evidence identity without mixing an older valid sibling', async () => {
    const createBundle = vi.fn(createManualEvidenceBundle);
    const downloadBundle = vi.fn<(bundle: ManualEvidenceBundle) => void>();
    const firstFile = evidenceFile('first-revision.png');
    const firstProps = appProps('en', { createBundle, downloadBundle });
    const view = await render(<HarnessApp {...firstProps} />);
    await completeObservation('en', firstFile);

    await view.rerender(<HarnessApp {...firstProps} buildTime="2026-08-17T14:30:00.000Z" />);
    expect(page.getByText('first-revision.png', { exact: true })).toBeVisible();
    expect(inputByName('os.name')).toHaveValue('Windows');

    await view.rerender(
      <HarnessApp
        {...appProps('en', {
          revision: NEXT_REVISION,
          deploymentUrl: NEXT_DEPLOYMENT_URL,
          createBundle,
          downloadBundle,
        })}
      />,
    );
    await selectScenario('en', 'DF-FU-M02');
    const secondFile = evidenceFile('next-revision.webp', 'image/webp');
    await completeObservation('en', secondFile);
    await page.getByRole('button', { name: 'Download evidence ZIP' }).click();

    await vi.waitFor(() => expect(createBundle).toHaveBeenCalledTimes(1));
    const [records, attachments] = createBundle.mock.calls[0] ?? [];
    expect(records).toMatchObject([
      {
        scenario: 'DF-FU-M02',
        revision: NEXT_REVISION,
        deploymentUrl: NEXT_DEPLOYMENT_URL,
      },
    ]);
    expect((attachments as ManualEvidenceAttachments).has('DF-FU-M01')).toBe(false);
    expect((attachments as ManualEvidenceAttachments).get('DF-FU-M02')).toEqual([secondFile]);
    await vi.waitFor(() => expect(downloadBundle).toHaveBeenCalledTimes(1));
    expect(page.getByText('ZIP includes: DF-FU-M02.')).toBeVisible();
  });

  it('excludes an incomplete other draft without blocking the valid selected scenario', async () => {
    const boundary = bundleBoundary();
    await render(<HarnessApp {...appProps('en', boundary)} />);
    await completeObservation('en', evidenceFile('m01.png'));
    await selectScenario('en', 'DF-FU-M02');
    await fillInput('os.name', 'macOS');
    await selectScenario('en', 'DF-FU-M01');

    expect(page.getByRole('button', { name: 'Download evidence ZIP' })).toBeEnabled();
    await page.getByRole('button', { name: 'Download evidence ZIP' }).click();

    const [records] = boundary.createBundle.mock.calls[0] ?? [];
    expect(records?.map(({ scenario }) => scenario)).toEqual(['DF-FU-M01']);
    expect(page.getByText('ZIP includes: DF-FU-M01.')).toBeVisible();
  });

  it('allows an incomplete-checklist FAIL for diagnosis while PASS requires all attestations', async () => {
    const boundary = bundleBoundary();
    await render(<HarnessApp {...appProps('en', boundary)} />);
    await completeObservation('en', evidenceFile('failure.png'), 'FAIL');

    expect(page.getByRole('button', { name: 'Download evidence ZIP' })).toBeEnabled();
    await page.getByRole('button', { name: 'Download evidence ZIP' }).click();
    expect(boundary.createBundle.mock.calls[0]?.[0]?.[0]).toMatchObject({
      result: 'FAIL',
      reviewer: { approval: 'changes-requested' },
      checkAttestations: {
        'DF-FU-M01-selection-and-indeterminate-announcements': false,
        'DF-FU-M01-determinate-progress-milestones': false,
        'DF-FU-M01-lifecycle-recovery-and-stale-result': false,
      },
    });

    await choose('result', 'PASS');
    await choose('reviewer.approval', 'approved');
    expect(page.getByRole('button', { name: 'Download evidence ZIP' })).toBeDisabled();
    for (const check of document.querySelectorAll<HTMLInputElement>(
      '.lyra-evidence__checklist input[type="checkbox"]',
    )) {
      await userEvent.click(check);
    }
    expect(page.getByRole('button', { name: 'Download evidence ZIP' })).toBeEnabled();
  });

  it('removes an attachment with a keyboard-focusable localized control', async () => {
    await render(<HarnessApp {...appProps('pt-BR')} />);
    await selectFiles([evidenceFile('evidência.png')]);

    const remove = page.getByRole('button', { name: 'Remover evidência.png' });
    remove.element().focus();
    expect(remove).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(page.getByText('evidência.png')).not.toBeInTheDocument();
    expect(attachmentInput()).toHaveFocus();
  });
});
