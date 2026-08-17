import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type { EnvironmentTelemetry, Locale } from './contracts';
import { HarnessApp, type HarnessAppProps } from './harness-app';

const REVISION = '1234567890abcdef1234567890abcdef12345678';
const DEPLOYMENT_URL = 'https://12345678.file-upload-evidence.pages.dev/en/file-upload-evidence/';
const EXECUTED_AT = '2026-08-17T15:30:00.000Z';

function telemetry(width = 1280, coarsePointer = false): EnvironmentTelemetry {
  return {
    userAgent: 'Evidence Browser/1.0',
    timezone: 'America/Sao_Paulo',
    viewport: { width, height: 720, devicePixelRatio: 2 },
    mediaQueries: {
      '(pointer: coarse)': coarsePointer,
      '(any-pointer: coarse)': coarsePointer,
      '(hover: none)': coarsePointer,
      '(any-hover: none)': coarsePointer,
    },
    coarsePointer,
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
        : 'https://12345678.file-upload-evidence.pages.dev/pt-BR/file-upload-evidence/',
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

async function fillInput(name: string, value: string): Promise<void> {
  await userEvent.fill(inputByName(name), value);
}

async function fillTextarea(name: string, value: string): Promise<void> {
  await userEvent.fill(textareaByName(name), value);
}

async function choose(name: string, value: string): Promise<void> {
  await userEvent.selectOptions(selectByName(name), value);
}

async function completeObservation(locale: Locale): Promise<void> {
  await fillInput('os.name', locale === 'en' ? 'Windows' : 'Android');
  await fillInput('os.version', '11');
  await fillInput('os.build', '26100.1');
  await fillInput('browser.name', 'Chrome');
  await fillInput('browser.version', '140');
  await fillInput('assistiveTechnology.name', 'NVDA');
  await fillInput('assistiveTechnology.version', '2026.1');
  await page
    .getByLabelText(locale === 'en' ? 'Physical keyboard used' : 'Teclado físico usado')
    .click();
  await fillTextarea('expected', 'The expected announcement and focus behavior.');
  await fillTextarea('actual', 'The observed announcement and focus behavior.');
  await choose('result', 'PASS');
  await fillInput('reviewer.name', 'Alex Reviewer');
  await choose('reviewer.approval', 'approved');
  await fillTextarea('artifactUrls', 'https://evidence.example/video');
}

async function completeM03(locale: Locale): Promise<void> {
  await fillInput('os.name', 'Android');
  await fillInput('os.version', '16');
  await fillInput('os.build', 'BP2A.260817.001');
  await fillInput('browser.name', 'Chrome');
  await fillInput('browser.version', '140');
  await page
    .getByLabelText(
      locale === 'en'
        ? 'I confirm that no assistive technology was active'
        : 'Confirmo que nenhuma tecnologia assistiva estava ativa',
    )
    .click();
  await page.getByLabelText(locale === 'en' ? 'Touch used' : 'Toque usado').click();
  await page
    .getByLabelText(locale === 'en' ? 'Physical keyboard used' : 'Teclado físico usado')
    .click();
  for (const label of locale === 'en'
    ? [
        'No horizontal overflow observed',
        'Long file identity retained',
        'All actions remained reachable',
        'Active replacement was rejected and announced',
        'Cancel, retry, and remove completed',
        'Focus recovered',
      ]
    : [
        'Nenhum overflow horizontal observado',
        'Identidade do arquivo longo mantida',
        'Todas as ações permaneceram acessíveis',
        'Substituição ativa rejeitada e anunciada',
        'Cancelar, repetir e remover concluídos',
        'Foco recuperado',
      ]) {
    await page.getByLabelText(label).click();
  }
  await fillTextarea('expected', 'Expected M03 behavior.');
  await fillTextarea('actual', 'Observed M03 behavior.');
  await choose('result', 'PASS');
  await fillInput('reviewer.name', 'Mobile Reviewer');
  await choose('reviewer.approval', 'approved');
  await fillTextarea('artifactUrls', 'https://evidence.example/mobile-video');
}

function exportedJson(writeText: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const call = writeText.mock.calls[0];
  if (call === undefined || typeof call[0] !== 'string') {
    throw new Error('Expected one serialized clipboard payload.');
  }
  const parsed: unknown = JSON.parse(call[0]);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected one JSON object.');
  }
  return Object.fromEntries(Object.entries(parsed));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('bilingual file upload evidence recorder', () => {
  it.each([
    {
      locale: 'en' as const,
      heading: 'Controlled React lifecycle',
      scenarioLabel: 'Manual scenario',
      uploadLabel: 'Controlled evidence file',
      deploymentLabel: 'Deployment URL',
      executedAtLabel: 'Executed at',
      diagnosticState: 'Idle',
      javascriptState: 'JavaScript state',
      javascriptEnabled: 'Enabled',
      alpineDelay: 'Requested Alpine delay',
    },
    {
      locale: 'pt-BR' as const,
      heading: 'Ciclo de vida React controlado',
      scenarioLabel: 'Cenário manual',
      uploadLabel: 'Arquivo de evidência controlado',
      deploymentLabel: 'URL da implantação',
      executedAtLabel: 'Executado em',
      diagnosticState: 'Inativo',
      javascriptState: 'Estado do JavaScript',
      javascriptEnabled: 'Ativado',
      alpineDelay: 'Atraso Alpine solicitado',
    },
  ])(
    'renders truthful prefilled metadata and isolated accessible boundaries in $locale',
    async ({
      deploymentLabel,
      diagnosticState,
      alpineDelay,
      executedAtLabel,
      heading,
      locale,
      scenarioLabel,
      javascriptEnabled,
      javascriptState,
      uploadLabel,
    }) => {
      await render(<HarnessApp {...appProps(locale)} />);

      expect(page.getByRole('heading', { name: heading })).toBeVisible();
      expect(page.getByText(javascriptState)).toBeVisible();
      expect(page.getByText(javascriptEnabled)).toBeVisible();
      expect(page.getByText(alpineDelay)).toBeVisible();
      expect(page.getByText('5000 ms')).toBeVisible();
      expect(page.getByLabelText(scenarioLabel)).toHaveValue('DF-FU-M01');
      expect(inputByName('revision')).toHaveValue(REVISION);
      expect(inputByName('deploymentUrl')).toHaveValue(appProps(locale).deploymentUrl);
      expect(inputByName('executedAt')).toHaveValue(EXECUTED_AT);
      expect(page.getByLabelText(deploymentLabel)).toHaveValue(appProps(locale).deploymentUrl);
      expect(page.getByLabelText(executedAtLabel)).toHaveValue(EXECUTED_AT);
      expect(inputByName('timezone')).toHaveValue('America/Sao_Paulo');
      expect(inputByName('viewport.width')).toHaveValue('1280');
      expect(inputByName('viewport.height')).toHaveValue('720');
      expect(inputByName('viewport.devicePixelRatio')).toHaveValue('2');
      expect(page.getByText('(pointer: coarse): false')).toBeVisible();
      expect(page.getByText('Evidence Browser/1.0')).toBeVisible();

      const diagnostic = document.querySelector<HTMLElement>(
        '[data-testid="lifecycle-diagnostics"]',
      );
      if (diagnostic === null) throw new Error('Expected the visual diagnostics panel.');
      expect(diagnostic).not.toHaveAttribute('aria-live');
      expect(diagnostic.closest('[aria-live]')).toBeNull();
      expect(page.getByTestId('diagnostic-state')).toHaveTextContent(diagnosticState);

      const fileInput = page.getByLabelText(uploadLabel).element();
      expect(fileInput).toHaveAccessibleName(
        locale === 'en'
          ? `${uploadLabel} Select the evidence fixture or another non-sensitive file.`
          : `${uploadLabel} Selecione a fixture de evidência ou outro arquivo sem dados sensíveis.`,
      );
      expect(fileInput).not.toHaveAttribute(
        'aria-describedby',
        expect.stringContaining('diagnostic'),
      );
      expect(fileInput).not.toHaveAttribute(
        'aria-labelledby',
        expect.stringContaining('diagnostic'),
      );
      expect(
        page.getByRole('button', { name: locale === 'en' ? 'Copy JSON' : 'Copiar JSON' }),
      ).toBeDisabled();
      expect(
        page.getByRole('button', { name: locale === 'en' ? 'Download JSON' : 'Baixar JSON' }),
      ).toBeDisabled();
    },
  );

  it('starts a blank English observation after changing from the Portuguese route', async () => {
    const screen = await render(<HarnessApp {...appProps('pt-BR')} />);
    await fillInput('os.name', 'Android');
    await fillTextarea('actual', 'Observação em português');

    await screen.rerender(<HarnessApp {...appProps('en')} />);

    expect(inputByName('os.name')).toHaveValue('');
    expect(textareaByName('actual')).toHaveValue('');
    expect(inputByName('revision')).toHaveValue(REVISION);
    expect(inputByName('deploymentUrl')).toHaveValue(DEPLOYMENT_URL);
    expect(page.getByLabelText('Manual scenario')).toHaveValue('DF-FU-M01');
  });

  it('rejects contradictory reviewer status and copies only normalized local JSON', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    await render(<HarnessApp {...appProps('en', { clipboard: { writeText } })} />);
    await completeObservation('en');

    await choose('reviewer.approval', 'changes-requested');
    expect(page.getByText('Reviewer approval must agree with the result.')).toBeVisible();
    expect(page.getByRole('button', { name: 'Copy JSON' })).toBeDisabled();
    expect(writeText).not.toHaveBeenCalled();

    await choose('reviewer.approval', 'approved');
    await page.getByRole('button', { name: 'Copy JSON' }).click();

    expect(writeText).toHaveBeenCalledTimes(1);
    const observation = exportedJson(writeText);
    expect(observation).toMatchObject({
      scenario: 'DF-FU-M01',
      locale: 'en',
      revision: REVISION,
      deploymentUrl: DEPLOYMENT_URL,
      executedAt: EXECUTED_AT,
      timezone: 'America/Sao_Paulo',
      os: { name: 'Windows', version: '11', build: '26100.1' },
      browser: { name: 'Chrome', version: '140' },
      assistiveTechnology: { name: 'NVDA', version: '2026.1' },
      inputMethods: ['keyboard'],
      viewport: { width: 1280, height: 720, devicePixelRatio: 2 },
      mediaQueries: {
        '(pointer: coarse)': false,
        '(any-pointer: coarse)': false,
        '(hover: none)': false,
        '(any-hover: none)': false,
      },
      result: 'PASS',
      reviewer: { name: 'Alex Reviewer', approval: 'approved' },
      artifactUrls: ['https://evidence.example/video'],
      findingUrls: [],
    });
    expect(observation).not.toHaveProperty('userAgent');
    expect(observation).not.toHaveProperty('manualChecks');
  });

  it('requires AT metadata for M01 and allows null AT for M03 only after explicit confirmation', async () => {
    await render(
      <HarnessApp {...appProps('en', { captureEnvironment: () => telemetry(320, true) })} />,
    );
    await completeObservation('en');
    await fillInput('assistiveTechnology.name', '');
    await fillInput('assistiveTechnology.version', '');
    expect(page.getByText('Enter the assistive technology name.')).toBeVisible();
    expect(page.getByText('Enter the assistive technology version.')).toBeVisible();
    expect(page.getByRole('button', { name: 'Copy JSON' })).toBeDisabled();

    await userEvent.selectOptions(page.getByLabelText('Manual scenario'), 'DF-FU-M03');
    await completeM03('en');
    expect(page.getByRole('button', { name: 'Copy JSON' })).toBeEnabled();
  });

  it('rechecks the exact M03 environment at export time before calling the clipboard', async () => {
    let currentTelemetry = telemetry(320, true);
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    await render(
      <HarnessApp
        {...appProps('en', {
          captureEnvironment: () => currentTelemetry,
          clipboard: { writeText },
        })}
      />,
    );
    await userEvent.selectOptions(page.getByLabelText('Manual scenario'), 'DF-FU-M03');
    await completeM03('en');
    expect(page.getByRole('button', { name: 'Copy JSON' })).toBeEnabled();

    currentTelemetry = telemetry(321, true);
    await page.getByRole('button', { name: 'Copy JSON' }).click();

    expect(writeText).not.toHaveBeenCalled();
    expect(
      page.getByText('M03 is blocked: exact viewport width is not 320 CSS pixels.'),
    ).toBeVisible();

    currentTelemetry = telemetry(320, true);
    await page.getByRole('button', { name: 'Copy JSON' }).click();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(exportedJson(writeText)).toMatchObject({
      scenario: 'DF-FU-M03',
      assistiveTechnology: null,
      viewport: { width: 320 },
    });
  });

  it('allows a completed M03 draft to become eligible after the viewport is corrected', async () => {
    let currentTelemetry = telemetry(321, true);
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    await render(
      <HarnessApp
        {...appProps('en', {
          captureEnvironment: () => currentTelemetry,
          clipboard: { writeText },
        })}
      />,
    );
    await userEvent.selectOptions(page.getByLabelText('Manual scenario'), 'DF-FU-M03');
    await completeM03('en');

    expect(page.getByRole('button', { name: 'Copy JSON' })).toBeEnabled();
    currentTelemetry = telemetry(320, true);
    await page.getByRole('button', { name: 'Copy JSON' }).click();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(exportedJson(writeText)).toMatchObject({ viewport: { width: 320 } });
  });

  it('downloads validated JSON with a localized revision-pinned filename and revokes its URL', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:evidence-json');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickedDownloads: Array<{ download: string; href: string }> = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clickedDownloads.push({ download: this.download, href: this.href });
    });
    await render(<HarnessApp {...appProps('pt-BR')} />);
    await completeObservation('pt-BR');

    await page.getByRole('button', { name: 'Baixar JSON' }).click();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0]?.[0];
    if (!(blob instanceof Blob)) throw new Error('Expected a local JSON Blob.');
    expect(JSON.parse(await blob.text())).toMatchObject({ locale: 'pt-BR', revision: REVISION });
    expect(clickedDownloads).toEqual([
      { download: `DF-FU-M01-pt-BR-${REVISION}.json`, href: 'blob:evidence-json' },
    ]);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:evidence-json');
  });

  it('provides a real localized long-name fixture and read-only lifecycle diagnostics', async () => {
    vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => undefined);
    vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => undefined);
    vi.spyOn(XMLHttpRequest.prototype, 'setRequestHeader').mockImplementation(() => undefined);
    await render(<HarnessApp {...appProps('en')} />);
    const fixtureName =
      'file-upload-evidence-very-long-localized-name-for-identity-actions-and-320-css-pixel-reflow.txt';
    expect(page.getByText(fixtureName)).toBeVisible();

    const file = new File(['fixture'], fixtureName, { type: 'text/plain' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector<HTMLInputElement>(
      '.lyra-evidence .lyra-upload__input[type="file"]',
    );
    if (input === null) throw new Error('Expected the controlled native file input.');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await expect.element(page.getByTestId('diagnostic-state')).toHaveTextContent('Uploading');
    expect(page.getByTestId('diagnostic-item')).not.toHaveTextContent('—');
    expect(page.getByTestId('diagnostic-attempt')).not.toHaveTextContent('—');
    const cancel = page.getByRole('button', { name: `Cancel ${fixtureName}` }).element();
    if (!(cancel instanceof HTMLButtonElement))
      throw new Error('Expected the public cancel button.');
    cancel.focus();
    await expect.element(page.getByTestId('diagnostic-focus')).toHaveTextContent('Cancel');
    expect(document.querySelector('[data-testid="lifecycle-diagnostics"] [aria-live]')).toBeNull();
  });
});
