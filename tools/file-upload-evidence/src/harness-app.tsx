import type { FileUploadMessages } from '@lyra-ds/react/file-upload';
import { useRef, useState } from 'react';
import '@lyra-ds/styles/styles.css';
import type {
  EnvironmentTelemetry,
  FileUploadManualObservation,
  Locale,
  ManualScenario,
  ScenarioCheckId,
} from './contracts';
import { SCENARIO_CHECK_IDS, validateObservation } from './contracts';
import { MESSAGES } from './messages';
import {
  ReactFileUploadEvidence,
  type EvidenceOperatorMode,
  type ReactFileUploadEvidenceDiagnostics,
  type ReactFileUploadEvidenceHandle,
} from './react-file-upload';
import { captureTelemetry, m03Eligibility } from './telemetry';
import './harness.css';

const SCENARIOS: readonly ManualScenario[] = ['DF-FU-M01', 'DF-FU-M02', 'DF-FU-M03', 'DF-FU-M04'];
const MODES: readonly EvidenceOperatorMode[] = [
  'success',
  'error',
  'delay',
  'indeterminate',
  'stale',
];

interface UiMessages {
  heading: string;
  intro: string;
  buildMetadata: string;
  revision: string;
  buildTime: string;
  deploymentUrl: string;
  executedAt: string;
  javascriptState: string;
  enabled: string;
  alpineDelay: string;
  environment: string;
  userAgent: string;
  timezone: string;
  viewportWidth: string;
  viewportHeight: string;
  devicePixelRatio: string;
  scenario: string;
  controlledLifecycle: string;
  operatorMode: string;
  modes: Record<EvidenceOperatorMode, string>;
  advanceProgress: string;
  deliverStale: string;
  resetInstrument: string;
  uploadLabel: string;
  uploadHint: string;
  diagnostics: string;
  itemId: string;
  attemptId: string;
  lifecycleState: string;
  lifecycleStates: Record<ReactFileUploadEvidenceDiagnostics['lifecycleState'], string>;
  focusTarget: string;
  blankDiagnostic: string;
  checklist: string;
  observation: string;
  osName: string;
  osVersion: string;
  osBuild: string;
  browserName: string;
  browserVersion: string;
  atName: string;
  atVersion: string;
  noAtConfirmation: string;
  inputMethods: string;
  touchUsed: string;
  keyboardUsed: string;
  mouseUsed: string;
  expected: string;
  actual: string;
  result: string;
  choose: string;
  reviewerName: string;
  reviewerApproval: string;
  approved: string;
  changesRequested: string;
  artifactUrls: string;
  findingUrls: string;
  copyJson: string;
  downloadJson: string;
  validationHeading: string;
  exportBlocked: {
    readonly 'viewport-width': string;
    readonly 'coarse-pointer': string;
    readonly 'touch-input': string;
    readonly 'keyboard-input': string;
    readonly 'manual-checks': string;
  };
  longFixture: string;
  downloadFixture: string;
  longFixtureName: string;
  longFixtureBody: string;
  scenarioChecks: Record<ScenarioCheckId, string>;
  fileUpload: Required<FileUploadMessages>;
}

const UI_MESSAGES: Record<Locale, UiMessages> = {
  en: {
    heading: 'File upload evidence recorder',
    intro: 'This instrument records human observations. It cannot pass a scenario automatically.',
    buildMetadata: 'Harness build metadata',
    revision: 'Revision',
    buildTime: 'Built in UTC',
    deploymentUrl: 'Deployment URL',
    executedAt: 'Executed at',
    javascriptState: 'JavaScript state',
    enabled: 'Enabled',
    alpineDelay: 'Requested Alpine delay',
    environment: 'Observed environment',
    userAgent: 'Supporting user agent',
    timezone: 'Timezone',
    viewportWidth: 'Viewport width',
    viewportHeight: 'Viewport height',
    devicePixelRatio: 'Device pixel ratio',
    scenario: 'Manual scenario',
    controlledLifecycle: 'Controlled React lifecycle',
    operatorMode: 'Operator mode',
    modes: {
      success: 'Success',
      error: 'Retryable error',
      delay: 'Delayed response',
      indeterminate: 'Indeterminate progress',
      stale: 'Retained stale result',
    },
    advanceProgress: 'Advance recorded progress',
    deliverStale: 'Deliver retained stale result',
    resetInstrument: 'Reset controlled instrument',
    uploadLabel: 'Controlled evidence file',
    uploadHint: 'Select the evidence fixture or another non-sensitive file.',
    diagnostics: 'Visual lifecycle diagnostics',
    itemId: 'Item ID',
    attemptId: 'Attempt ID',
    lifecycleState: 'Lifecycle state',
    lifecycleStates: {
      idle: 'Idle',
      selected: 'Selected',
      uploading: 'Uploading',
      canceling: 'Canceling',
      success: 'Uploaded',
      error: 'Upload failed',
      canceled: 'Canceled',
    },
    focusTarget: 'Focus target',
    blankDiagnostic: '—',
    checklist: 'Guided manual checklist',
    observation: 'Observation record',
    osName: 'Operating system name',
    osVersion: 'Operating system version',
    osBuild: 'Operating system build',
    browserName: 'Browser name',
    browserVersion: 'Browser version',
    atName: 'Assistive technology name',
    atVersion: 'Assistive technology version',
    noAtConfirmation: 'I confirm that no assistive technology was active',
    inputMethods: 'Physical input methods',
    touchUsed: 'Touch used',
    keyboardUsed: 'Physical keyboard used',
    mouseUsed: 'Mouse used',
    expected: 'Expected announcement or behavior',
    actual: 'Actual announcement or behavior',
    result: 'Result',
    choose: 'Choose',
    reviewerName: 'Reviewer name',
    reviewerApproval: 'Reviewer approval',
    approved: 'Approved',
    changesRequested: 'Changes requested',
    artifactUrls: 'Evidence artifact URLs (one per line)',
    findingUrls: 'Finding URLs (one per line)',
    copyJson: 'Copy JSON',
    downloadJson: 'Download JSON',
    validationHeading: 'Complete these fields before export',
    exportBlocked: {
      'viewport-width': 'M03 is blocked: exact viewport width is not 320 CSS pixels.',
      'coarse-pointer': 'M03 is blocked: no real coarse pointer is reported.',
      'touch-input': 'M03 is blocked: record physical touch input.',
      'keyboard-input': 'M03 is blocked: record physical keyboard input.',
      'manual-checks': 'M03 is blocked: complete every required manual check.',
    },
    longFixture: 'Long localized file-name fixture',
    downloadFixture: 'Download long-name fixture',
    longFixtureName:
      'file-upload-evidence-very-long-localized-name-for-identity-actions-and-320-css-pixel-reflow.txt',
    longFixtureBody: 'Lyra FileUpload manual evidence fixture. Contains no sensitive data.',
    scenarioChecks: {
      'DF-FU-M01-selection-and-indeterminate-announcements':
        'Verify selection and indeterminate upload announcements with NVDA.',
      'DF-FU-M01-determinate-progress-milestones':
        'Record determinate progress at 25, 50, 75, and 100 percent.',
      'DF-FU-M01-lifecycle-recovery-and-stale-result':
        'Exercise cancellation, retry, a stale result, error, success, removal, and focus recovery.',
      'DF-FU-M02-selection-and-indeterminate-announcements':
        'Verify selection and indeterminate upload announcements with VoiceOver and Safari.',
      'DF-FU-M02-determinate-progress-milestones':
        'Record determinate progress at 25, 50, 75, and 100 percent.',
      'DF-FU-M02-lifecycle-recovery-and-stale-result':
        'Exercise cancellation, retry, a stale result, error, success, removal, and focus recovery.',
      'DF-FU-M03-no-horizontal-overflow': 'No horizontal overflow observed',
      'DF-FU-M03-long-file-identity-retained': 'Long file identity retained',
      'DF-FU-M03-actions-reachable': 'All actions remained reachable',
      'DF-FU-M03-active-replacement-rejected-and-announced':
        'Active replacement was rejected and announced',
      'DF-FU-M03-cancel-retry-remove-completed': 'Cancel, retry, and remove completed',
      'DF-FU-M03-focus-recovered': 'Focus recovered',
      'DF-FU-M04-native-js-disabled-form-submitted':
        'Submit the authored native form with JavaScript disabled and retain the response evidence.',
      'DF-FU-M04-delayed-alpine-node-filelist-preserved':
        'Select a file before delayed Alpine initialization and verify the exact node and FileList remain.',
      'DF-FU-M04-single-enhancement-path-removal-focus':
        'Verify one enhanced tree, no replay, one listener path, removal, and focus recovery.',
    },
    fileUpload: {
      label: 'Controlled evidence file',
      hint: 'Select the evidence fixture or another non-sensitive file.',
      browse: 'Browse files',
      retry: (name) => `Retry ${name}`,
      cancel: (name) => `Cancel ${name}`,
      remove: (name) => `Remove ${name}`,
      selectionUnavailable: 'File replacement is unavailable while an upload is active.',
      validationAccept: (name, accept) => `${name} must match ${accept}.`,
      validationMaxSize: (name, maxSizeMB) => `${name} must not exceed ${maxSizeMB} MB.`,
      selected: (name) => `${name} selected.`,
      progress: (name, percent) => `${name} is ${percent}% uploaded.`,
      progressIndeterminate: (name) => `${name} is uploading.`,
      canceling: (name) => `Canceling ${name}.`,
      success: (name) => `${name} uploaded.`,
      error: (name, message) => `${name}: ${message}`,
      canceled: (name) => `${name} canceled.`,
      removed: (name) => `${name} removed.`,
    },
  },
  'pt-BR': {
    heading: 'Registro de evidências de envio de arquivo',
    intro:
      'Este instrumento registra observações humanas. Ele não aprova cenários automaticamente.',
    buildMetadata: 'Metadados da compilação do instrumento',
    revision: 'Revisão',
    buildTime: 'Compilado em UTC',
    deploymentUrl: 'URL da implantação',
    executedAt: 'Executado em',
    javascriptState: 'Estado do JavaScript',
    enabled: 'Ativado',
    alpineDelay: 'Atraso Alpine solicitado',
    environment: 'Ambiente observado',
    userAgent: 'User agent de apoio',
    timezone: 'Fuso horário',
    viewportWidth: 'Largura do viewport',
    viewportHeight: 'Altura do viewport',
    devicePixelRatio: 'Proporção de pixels do dispositivo',
    scenario: 'Cenário manual',
    controlledLifecycle: 'Ciclo de vida React controlado',
    operatorMode: 'Modo do operador',
    modes: {
      success: 'Sucesso',
      error: 'Erro que permite repetição',
      delay: 'Resposta atrasada',
      indeterminate: 'Progresso indeterminado',
      stale: 'Resultado obsoleto retido',
    },
    advanceProgress: 'Avançar progresso registrado',
    deliverStale: 'Entregar resultado obsoleto retido',
    resetInstrument: 'Redefinir instrumento controlado',
    uploadLabel: 'Arquivo de evidência controlado',
    uploadHint: 'Selecione a fixture de evidência ou outro arquivo sem dados sensíveis.',
    diagnostics: 'Diagnósticos visuais do ciclo de vida',
    itemId: 'ID do item',
    attemptId: 'ID da tentativa',
    lifecycleState: 'Estado do ciclo de vida',
    lifecycleStates: {
      idle: 'Inativo',
      selected: 'Selecionado',
      uploading: 'Enviando',
      canceling: 'Cancelando',
      success: 'Enviado',
      error: 'Falha no envio',
      canceled: 'Cancelado',
    },
    focusTarget: 'Destino do foco',
    blankDiagnostic: '—',
    checklist: 'Checklist manual guiado',
    observation: 'Registro da observação',
    osName: 'Nome do sistema operacional',
    osVersion: 'Versão do sistema operacional',
    osBuild: 'Compilação do sistema operacional',
    browserName: 'Nome do navegador',
    browserVersion: 'Versão do navegador',
    atName: 'Nome da tecnologia assistiva',
    atVersion: 'Versão da tecnologia assistiva',
    noAtConfirmation: 'Confirmo que nenhuma tecnologia assistiva estava ativa',
    inputMethods: 'Métodos físicos de entrada',
    touchUsed: 'Toque usado',
    keyboardUsed: 'Teclado físico usado',
    mouseUsed: 'Mouse usado',
    expected: 'Anúncio ou comportamento esperado',
    actual: 'Anúncio ou comportamento real',
    result: 'Resultado',
    choose: 'Escolha',
    reviewerName: 'Nome da pessoa revisora',
    reviewerApproval: 'Aprovação da revisão',
    approved: 'Aprovado',
    changesRequested: 'Alterações solicitadas',
    artifactUrls: 'URLs dos artefatos de evidência (uma por linha)',
    findingUrls: 'URLs dos achados (uma por linha)',
    copyJson: 'Copiar JSON',
    downloadJson: 'Baixar JSON',
    validationHeading: 'Preencha estes campos antes da exportação',
    exportBlocked: {
      'viewport-width': 'M03 está bloqueado: a largura exata do viewport não é 320 pixels CSS.',
      'coarse-pointer': 'M03 está bloqueado: nenhum ponteiro grosseiro real foi informado.',
      'touch-input': 'M03 está bloqueado: registre a entrada física por toque.',
      'keyboard-input': 'M03 está bloqueado: registre a entrada por teclado físico.',
      'manual-checks': 'M03 está bloqueado: conclua todas as verificações manuais obrigatórias.',
    },
    longFixture: 'Fixture com nome de arquivo localizado longo',
    downloadFixture: 'Baixar fixture de nome longo',
    longFixtureName:
      'evidencia-envio-arquivo-nome-localizado-muito-longo-identidade-acoes-reflow-320-pixels-css.txt',
    longFixtureBody: 'Fixture de evidência manual do FileUpload Lyra. Não contém dados sensíveis.',
    scenarioChecks: {
      'DF-FU-M01-selection-and-indeterminate-announcements':
        'Verifique os anúncios de seleção e envio indeterminado com NVDA.',
      'DF-FU-M01-determinate-progress-milestones':
        'Registre o progresso determinado em 25, 50, 75 e 100 por cento.',
      'DF-FU-M01-lifecycle-recovery-and-stale-result':
        'Exercite cancelamento, repetição, resultado obsoleto, erro, sucesso, remoção e recuperação de foco.',
      'DF-FU-M02-selection-and-indeterminate-announcements':
        'Verifique os anúncios de seleção e envio indeterminado com VoiceOver e Safari.',
      'DF-FU-M02-determinate-progress-milestones':
        'Registre o progresso determinado em 25, 50, 75 e 100 por cento.',
      'DF-FU-M02-lifecycle-recovery-and-stale-result':
        'Exercite cancelamento, repetição, resultado obsoleto, erro, sucesso, remoção e recuperação de foco.',
      'DF-FU-M03-no-horizontal-overflow': 'Nenhum overflow horizontal observado',
      'DF-FU-M03-long-file-identity-retained': 'Identidade do arquivo longo mantida',
      'DF-FU-M03-actions-reachable': 'Todas as ações permaneceram acessíveis',
      'DF-FU-M03-active-replacement-rejected-and-announced':
        'Substituição ativa rejeitada e anunciada',
      'DF-FU-M03-cancel-retry-remove-completed': 'Cancelar, repetir e remover concluídos',
      'DF-FU-M03-focus-recovered': 'Foco recuperado',
      'DF-FU-M04-native-js-disabled-form-submitted':
        'Envie o formulário nativo autorado com JavaScript desativado e guarde a evidência da resposta.',
      'DF-FU-M04-delayed-alpine-node-filelist-preserved':
        'Selecione um arquivo antes do Alpine atrasado e verifique que o nó exato e a FileList permanecem.',
      'DF-FU-M04-single-enhancement-path-removal-focus':
        'Verifique uma árvore aprimorada, nenhum replay, um caminho de listener, remoção e recuperação de foco.',
    },
    fileUpload: {
      label: 'Arquivo de evidência controlado',
      hint: 'Selecione a fixture de evidência ou outro arquivo sem dados sensíveis.',
      browse: 'Procurar arquivos',
      retry: (name) => `Repetir ${name}`,
      cancel: (name) => `Cancelar ${name}`,
      remove: (name) => `Remover ${name}`,
      selectionUnavailable: 'A substituição fica indisponível durante um envio ativo.',
      validationAccept: (name, accept) => `${name} deve corresponder a ${accept}.`,
      validationMaxSize: (name, maxSizeMB) => `${name} não deve exceder ${maxSizeMB} MB.`,
      selected: (name) => `${name} selecionado.`,
      progress: (name, percent) => `${name} está com ${percent}% enviado.`,
      progressIndeterminate: (name) => `${name} está sendo enviado.`,
      canceling: (name) => `Cancelando ${name}.`,
      success: (name) => `${name} enviado.`,
      error: (name, message) => `${name}: ${message}`,
      canceled: (name) => `${name} cancelado.`,
      removed: (name) => `${name} removido.`,
    },
  },
};

interface ObservationDraft {
  readonly scenario: ManualScenario;
  readonly locale: Locale;
  readonly revision: string;
  readonly deploymentUrl: string;
  readonly executedAt: string;
  readonly timezone: string;
  readonly os: { readonly name: string; readonly version: string; readonly build: string };
  readonly browser: { readonly name: string; readonly version: string };
  readonly assistiveTechnology: { readonly name: string; readonly version: string };
  readonly noAssistiveTechnologyConfirmed: boolean;
  readonly inputMethods: readonly string[];
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly devicePixelRatio: number;
  };
  readonly mediaQueries: Record<string, boolean>;
  readonly expected: string;
  readonly actual: string;
  readonly checkAttestations: Record<string, boolean>;
  readonly result: '' | 'PASS' | 'FAIL';
  readonly reviewer: {
    readonly name: string;
    readonly approval: '' | 'approved' | 'changes-requested';
  };
  readonly artifactUrls: string;
  readonly findingUrls: string;
}

export interface HarnessAppProps {
  readonly locale: Locale;
  readonly revision: string;
  readonly buildTime: string;
  readonly deploymentUrl: string;
  readonly alpineDelayMilliseconds: number;
  readonly captureEnvironment?: () => EnvironmentTelemetry;
  readonly now?: () => Date;
  readonly clipboard?: Pick<Clipboard, 'writeText'>;
  readonly xhrFactory?: () => XMLHttpRequest;
}

function captureBrowserEnvironment(): EnvironmentTelemetry {
  return captureTelemetry(window, navigator);
}

function currentTime(): Date {
  return new Date();
}

function createDraft(
  scenario: ManualScenario,
  locale: Locale,
  revision: string,
  deploymentUrl: string,
  environment: EnvironmentTelemetry,
  executedAt: string,
): ObservationDraft {
  return {
    scenario,
    locale,
    revision,
    deploymentUrl,
    executedAt,
    timezone: environment.timezone,
    os: { name: '', version: '', build: '' },
    browser: { name: '', version: '' },
    assistiveTechnology: { name: '', version: '' },
    noAssistiveTechnologyConfirmed: false,
    inputMethods: [],
    viewport: environment.viewport,
    mediaQueries: environment.mediaQueries,
    expected: '',
    actual: '',
    checkAttestations: Object.fromEntries(SCENARIO_CHECK_IDS[scenario].map((id) => [id, false])),
    result: '',
    reviewer: { name: '', approval: '' },
    artifactUrls: '',
    findingUrls: '',
  };
}

function parseUrlLines(value: string): string[] {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function manualScenario(value: string): ManualScenario {
  if (
    value === 'DF-FU-M01' ||
    value === 'DF-FU-M02' ||
    value === 'DF-FU-M03' ||
    value === 'DF-FU-M04'
  ) {
    return value;
  }
  throw new Error(`Unsupported manual scenario: ${value}`);
}

function observationResult(value: string): ObservationDraft['result'] {
  if (value === '' || value === 'PASS' || value === 'FAIL') return value;
  throw new Error(`Unsupported observation result: ${value}`);
}

function reviewerApproval(value: string): ObservationDraft['reviewer']['approval'] {
  if (value === '' || value === 'approved' || value === 'changes-requested') return value;
  throw new Error(`Unsupported reviewer approval: ${value}`);
}

function observationValue(draft: ObservationDraft): unknown {
  return {
    ...draft,
    assistiveTechnology: draft.noAssistiveTechnologyConfirmed ? null : draft.assistiveTechnology,
    inputMethods: [...draft.inputMethods],
    artifactUrls: parseUrlLines(draft.artifactUrls),
    findingUrls: parseUrlLines(draft.findingUrls),
  };
}

function exportBlockerMessage(messages: UiMessages, reason: string | undefined): string {
  switch (reason) {
    case 'viewport-width':
      return messages.exportBlocked['viewport-width'];
    case 'coarse-pointer':
      return messages.exportBlocked['coarse-pointer'];
    case 'touch-input':
      return messages.exportBlocked['touch-input'];
    case 'keyboard-input':
      return messages.exportBlocked['keyboard-input'];
    default:
      return messages.exportBlocked['manual-checks'];
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function checkboxValue(
  current: readonly string[],
  value: string,
  checked: boolean,
): readonly string[] {
  if (checked) return current.includes(value) ? current : [...current, value];
  return current.filter((entry) => entry !== value);
}

function draftWithEnvironment(
  draft: ObservationDraft,
  environment: EnvironmentTelemetry,
): ObservationDraft {
  return {
    ...draft,
    timezone: environment.timezone,
    viewport: environment.viewport,
    mediaQueries: environment.mediaQueries,
  };
}

function requiredDraft(
  drafts: Partial<Record<ManualScenario, ObservationDraft>>,
  scenario: ManualScenario,
): ObservationDraft {
  const draft = drafts[scenario];
  if (draft === undefined) throw new Error(`Missing observation draft for ${scenario}.`);
  return draft;
}

function TextField({
  label,
  name,
  value,
  onChange,
  readOnly = false,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: string | number;
  readonly onChange?: (value: string) => void;
  readonly readOnly?: boolean;
}) {
  return (
    <label className="lyra-field">
      <span className="lyra-label">{label}</span>
      <input
        className="lyra-input"
        name={name}
        value={value}
        readOnly={readOnly}
        onChange={onChange === undefined ? undefined : (event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="lyra-field">
      <span className="lyra-label">{label}</span>
      <textarea
        className="lyra-input lyra-textarea"
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label className="lyra-check-row">
      <input
        className="lyra-checkbox"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function LocaleHarness({
  locale,
  revision,
  buildTime,
  deploymentUrl,
  alpineDelayMilliseconds,
  captureEnvironment,
  now,
  clipboard,
  xhrFactory,
}: Required<
  Pick<
    HarnessAppProps,
    'locale' | 'revision' | 'buildTime' | 'deploymentUrl' | 'alpineDelayMilliseconds'
  >
> &
  Pick<HarnessAppProps, 'captureEnvironment' | 'now' | 'clipboard' | 'xhrFactory'>) {
  const messages = UI_MESSAGES[locale];
  const readEnvironment = captureEnvironment ?? captureBrowserEnvironment;
  const readTime = now ?? currentTime;
  const [initialEnvironment] = useState(readEnvironment);
  const [scenario, setScenario] = useState<ManualScenario>('DF-FU-M01');
  const [drafts, setDrafts] = useState<Partial<Record<ManualScenario, ObservationDraft>>>(() => {
    return {
      'DF-FU-M01': createDraft(
        'DF-FU-M01',
        locale,
        revision,
        deploymentUrl,
        initialEnvironment,
        readTime().toISOString(),
      ),
    };
  });
  const [mode, setMode] = useState<EvidenceOperatorMode>('success');
  const [showValidation, setShowValidation] = useState(false);
  const [exportBlocker, setExportBlocker] = useState<string | null>(null);
  const instrumentRef = useRef<ReactFileUploadEvidenceHandle>(null);
  const draft = requiredDraft(drafts, scenario);
  const validation = validateObservation(observationValue(draft));
  const completedM03Checks = SCENARIO_CHECK_IDS['DF-FU-M03'].filter(
    (id) => draft.checkAttestations[id] === true,
  );
  const m03ManualRecordComplete =
    draft.inputMethods.includes('touch') &&
    draft.inputMethods.includes('keyboard') &&
    completedM03Checks.length === SCENARIO_CHECK_IDS['DF-FU-M03'].length;
  const exportEnabled =
    validation.ok &&
    (scenario !== 'DF-FU-M03' || draft.result !== 'PASS' || m03ManualRecordComplete);

  function updateDraft(update: (current: ObservationDraft) => ObservationDraft): void {
    setShowValidation(true);
    setExportBlocker(null);
    setDrafts((current) => ({
      ...current,
      [scenario]: update(requiredDraft(current, scenario)),
    }));
  }

  function validatedExport(): FileUploadManualObservation | null {
    const currentEnvironment = readEnvironment();
    const synchronizedDraft = draftWithEnvironment(draft, currentEnvironment);
    setDrafts((current) => ({ ...current, [scenario]: synchronizedDraft }));
    const currentValidation = validateObservation(observationValue(synchronizedDraft));
    setShowValidation(true);
    if (!currentValidation.ok) return null;

    if (scenario === 'DF-FU-M03' && currentValidation.value.result === 'PASS') {
      const eligibility = m03Eligibility(
        currentEnvironment,
        currentValidation.value.inputMethods,
        completedM03Checks,
      );
      if (!eligibility.eligible) {
        const reason = eligibility.reasons[0];
        setExportBlocker(exportBlockerMessage(messages, reason));
        return null;
      }
    }

    setExportBlocker(null);
    return currentValidation.value;
  }

  async function copyJson(): Promise<void> {
    const observation = validatedExport();
    if (observation === null) return;
    const targetClipboard = clipboard ?? navigator.clipboard;
    await targetClipboard.writeText(`${JSON.stringify(observation, null, 2)}\n`);
  }

  function downloadJson(): void {
    const observation = validatedExport();
    if (observation === null) return;
    downloadBlob(
      new Blob([`${JSON.stringify(observation, null, 2)}\n`], { type: 'application/json' }),
      `${observation.scenario}-${locale}-${revision}.json`,
    );
  }

  return (
    <div className="lyra-evidence">
      <header className="lyra-evidence__intro">
        <h2>{messages.heading}</h2>
        <p>{messages.intro}</p>
      </header>

      <section className="lyra-evidence__section" aria-labelledby="evidence-build-heading">
        <h3 id="evidence-build-heading">{messages.buildMetadata}</h3>
        <dl className="lyra-evidence__metadata">
          <div>
            <dt>{messages.revision}</dt>
            <dd>
              <code>{revision}</code>
            </dd>
          </div>
          <div>
            <dt>{messages.buildTime}</dt>
            <dd>
              <time dateTime={buildTime}>{buildTime}</time>
            </dd>
          </div>
          <div>
            <dt>{messages.javascriptState}</dt>
            <dd>{messages.enabled}</dd>
          </div>
          <div>
            <dt>{messages.alpineDelay}</dt>
            <dd>{alpineDelayMilliseconds} ms</dd>
          </div>
        </dl>
      </section>

      <section className="lyra-evidence__section" aria-labelledby="evidence-environment-heading">
        <h3 id="evidence-environment-heading">{messages.environment}</h3>
        <div className="lyra-evidence__field-grid">
          <TextField label={messages.revision} name="revision" value={draft.revision} readOnly />
          <TextField
            label={messages.deploymentUrl}
            name="deploymentUrl"
            value={draft.deploymentUrl}
            readOnly
          />
          <TextField
            label={messages.executedAt}
            name="executedAt"
            value={draft.executedAt}
            readOnly
          />
          <TextField label={messages.timezone} name="timezone" value={draft.timezone} readOnly />
          <TextField
            label={messages.viewportWidth}
            name="viewport.width"
            value={draft.viewport.width}
            readOnly
          />
          <TextField
            label={messages.viewportHeight}
            name="viewport.height"
            value={draft.viewport.height}
            readOnly
          />
          <TextField
            label={messages.devicePixelRatio}
            name="viewport.devicePixelRatio"
            value={draft.viewport.devicePixelRatio}
            readOnly
          />
        </div>
        <p className="lyra-evidence__supporting-data">
          <strong>{messages.userAgent}:</strong> {initialEnvironment.userAgent}
        </p>
        <ul className="lyra-evidence__query-list">
          {Object.entries(draft.mediaQueries).map(([query, matches]) => (
            <li key={query}>
              <code>
                {query}: {String(matches)}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section className="lyra-evidence__section" aria-labelledby="react-lifecycle-heading">
        <h3 id="react-lifecycle-heading">{messages.controlledLifecycle}</h3>
        <label className="lyra-field lyra-evidence__scenario">
          <span className="lyra-label">{messages.scenario}</span>
          <select
            className="lyra-input"
            name="scenario"
            value={scenario}
            onChange={(event) => {
              const nextScenario = manualScenario(event.target.value);
              if (drafts[nextScenario] === undefined) {
                const nextDraft = createDraft(
                  nextScenario,
                  locale,
                  revision,
                  deploymentUrl,
                  readEnvironment(),
                  readTime().toISOString(),
                );
                setDrafts((current) =>
                  current[nextScenario] === undefined
                    ? { ...current, [nextScenario]: nextDraft }
                    : current,
                );
              }
              setScenario(nextScenario);
              setShowValidation(false);
              setExportBlocker(null);
            }}
          >
            {SCENARIOS.map((entry) => (
              <option key={entry} value={entry}>
                {MESSAGES[locale].scenarios[entry]}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="lyra-fieldset">
          <legend className="lyra-fieldset__legend">{messages.operatorMode}</legend>
          <div className="lyra-evidence__mode-grid">
            {MODES.map((entry) => (
              <label className="lyra-check-row" key={entry}>
                <input
                  className="lyra-radio"
                  type="radio"
                  name="operatorMode"
                  value={entry}
                  checked={mode === entry}
                  onChange={() => setMode(entry)}
                />
                <span>{messages.modes[entry]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="lyra-evidence__operator-actions">
          <button
            className="lyra-btn lyra-btn--secondary lyra-btn--md"
            type="button"
            onClick={() => instrumentRef.current?.advanceIndeterminate()}
          >
            {messages.advanceProgress}
          </button>
          <button
            className="lyra-btn lyra-btn--secondary lyra-btn--md"
            type="button"
            onClick={() => instrumentRef.current?.deliverStale()}
          >
            {messages.deliverStale}
          </button>
          <button
            className="lyra-btn lyra-btn--ghost lyra-btn--md"
            type="button"
            onClick={() => instrumentRef.current?.reset()}
          >
            {messages.resetInstrument}
          </button>
        </div>
        <div className="lyra-evidence__instrument">
          <ReactFileUploadEvidence
            key={scenario}
            ref={instrumentRef}
            locale={locale}
            mode={mode}
            name="controlled-evidence-file"
            label={messages.uploadLabel}
            hint={messages.uploadHint}
            messages={messages.fileUpload}
            multiple={false}
            renderDiagnostics={(diagnostics: ReactFileUploadEvidenceDiagnostics) => (
              <aside className="lyra-evidence__diagnostics" data-testid="lifecycle-diagnostics">
                <h4>{messages.diagnostics}</h4>
                <dl className="lyra-evidence__metadata">
                  <div>
                    <dt>{messages.itemId}</dt>
                    <dd data-testid="diagnostic-item">
                      {diagnostics.itemId ?? messages.blankDiagnostic}
                    </dd>
                  </div>
                  <div>
                    <dt>{messages.attemptId}</dt>
                    <dd data-testid="diagnostic-attempt">
                      {diagnostics.attemptId ?? messages.blankDiagnostic}
                    </dd>
                  </div>
                  <div>
                    <dt>{messages.lifecycleState}</dt>
                    <dd data-testid="diagnostic-state">
                      {messages.lifecycleStates[diagnostics.lifecycleState]}
                    </dd>
                  </div>
                  <div>
                    <dt>{messages.focusTarget}</dt>
                    <dd data-testid="diagnostic-focus">
                      {diagnostics.focusTarget ?? messages.blankDiagnostic}
                    </dd>
                  </div>
                </dl>
              </aside>
            )}
            {...(xhrFactory === undefined ? {} : { xhrFactory })}
          />
        </div>
      </section>

      <section className="lyra-evidence__section" aria-labelledby="evidence-checklist-heading">
        <h3 id="evidence-checklist-heading">{messages.checklist}</h3>
        <p>{MESSAGES[locale].instructions[scenario === 'DF-FU-M03' ? 'm03' : 'export']}</p>
        <div className="lyra-evidence__checklist">
          {SCENARIO_CHECK_IDS[scenario].map((id) => (
            <CheckRow
              key={id}
              label={messages.scenarioChecks[id]}
              checked={draft.checkAttestations[id] === true}
              onChange={(checked) =>
                updateDraft((current) => ({
                  ...current,
                  checkAttestations: { ...current.checkAttestations, [id]: checked },
                }))
              }
            />
          ))}
        </div>
        <div className="lyra-evidence__fixture">
          <div>
            <h4>{messages.longFixture}</h4>
            <code>{messages.longFixtureName}</code>
          </div>
          <button
            className="lyra-btn lyra-btn--secondary lyra-btn--md"
            type="button"
            onClick={() =>
              downloadBlob(
                new File([messages.longFixtureBody], messages.longFixtureName, {
                  type: 'text/plain',
                }),
                messages.longFixtureName,
              )
            }
          >
            {messages.downloadFixture}
          </button>
        </div>
      </section>

      <section className="lyra-evidence__section" aria-labelledby="evidence-observation-heading">
        <h3 id="evidence-observation-heading">{messages.observation}</h3>
        <div className="lyra-evidence__field-grid">
          <TextField
            label={messages.osName}
            name="os.name"
            value={draft.os.name}
            onChange={(value) =>
              updateDraft((current) => ({ ...current, os: { ...current.os, name: value } }))
            }
          />
          <TextField
            label={messages.osVersion}
            name="os.version"
            value={draft.os.version}
            onChange={(value) =>
              updateDraft((current) => ({ ...current, os: { ...current.os, version: value } }))
            }
          />
          <TextField
            label={messages.osBuild}
            name="os.build"
            value={draft.os.build}
            onChange={(value) =>
              updateDraft((current) => ({ ...current, os: { ...current.os, build: value } }))
            }
          />
          <TextField
            label={messages.browserName}
            name="browser.name"
            value={draft.browser.name}
            onChange={(value) =>
              updateDraft((current) => ({
                ...current,
                browser: { ...current.browser, name: value },
              }))
            }
          />
          <TextField
            label={messages.browserVersion}
            name="browser.version"
            value={draft.browser.version}
            onChange={(value) =>
              updateDraft((current) => ({
                ...current,
                browser: { ...current.browser, version: value },
              }))
            }
          />
          <TextField
            label={messages.atName}
            name="assistiveTechnology.name"
            value={draft.assistiveTechnology.name}
            readOnly={draft.noAssistiveTechnologyConfirmed}
            onChange={(value) =>
              updateDraft((current) => ({
                ...current,
                assistiveTechnology: { ...current.assistiveTechnology, name: value },
              }))
            }
          />
          <TextField
            label={messages.atVersion}
            name="assistiveTechnology.version"
            value={draft.assistiveTechnology.version}
            readOnly={draft.noAssistiveTechnologyConfirmed}
            onChange={(value) =>
              updateDraft((current) => ({
                ...current,
                assistiveTechnology: { ...current.assistiveTechnology, version: value },
              }))
            }
          />
        </div>
        {scenario === 'DF-FU-M03' || scenario === 'DF-FU-M04' ? (
          <CheckRow
            label={messages.noAtConfirmation}
            checked={draft.noAssistiveTechnologyConfirmed}
            onChange={(checked) =>
              updateDraft((current) => ({ ...current, noAssistiveTechnologyConfirmed: checked }))
            }
          />
        ) : null}
        <fieldset className="lyra-fieldset">
          <legend className="lyra-fieldset__legend">{messages.inputMethods}</legend>
          <div className="lyra-evidence__mode-grid">
            {(
              [
                ['touch', messages.touchUsed],
                ['keyboard', messages.keyboardUsed],
                ['mouse', messages.mouseUsed],
              ] satisfies ReadonlyArray<readonly [string, string]>
            ).map(([value, label]) => (
              <CheckRow
                key={value}
                label={label}
                checked={draft.inputMethods.includes(value)}
                onChange={(checked) =>
                  updateDraft((current) => ({
                    ...current,
                    inputMethods: checkboxValue(current.inputMethods, value, checked),
                  }))
                }
              />
            ))}
          </div>
        </fieldset>
        <div className="lyra-evidence__text-grid">
          <TextAreaField
            label={messages.expected}
            name="expected"
            value={draft.expected}
            onChange={(value) => updateDraft((current) => ({ ...current, expected: value }))}
          />
          <TextAreaField
            label={messages.actual}
            name="actual"
            value={draft.actual}
            onChange={(value) => updateDraft((current) => ({ ...current, actual: value }))}
          />
        </div>
        <div className="lyra-evidence__field-grid">
          <label className="lyra-field">
            <span className="lyra-label">{messages.result}</span>
            <select
              className="lyra-input"
              name="result"
              value={draft.result}
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  result: observationResult(event.target.value),
                }))
              }
            >
              <option value="">{messages.choose}</option>
              <option value="PASS">{MESSAGES[locale].status.pass}</option>
              <option value="FAIL">{MESSAGES[locale].status.fail}</option>
            </select>
          </label>
          <TextField
            label={messages.reviewerName}
            name="reviewer.name"
            value={draft.reviewer.name}
            onChange={(value) =>
              updateDraft((current) => ({
                ...current,
                reviewer: { ...current.reviewer, name: value },
              }))
            }
          />
          <label className="lyra-field">
            <span className="lyra-label">{messages.reviewerApproval}</span>
            <select
              className="lyra-input"
              name="reviewer.approval"
              value={draft.reviewer.approval}
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  reviewer: { ...current.reviewer, approval: reviewerApproval(event.target.value) },
                }))
              }
            >
              <option value="">{messages.choose}</option>
              <option value="approved">{messages.approved}</option>
              <option value="changes-requested">{messages.changesRequested}</option>
            </select>
          </label>
        </div>
        <div className="lyra-evidence__text-grid">
          <TextAreaField
            label={messages.artifactUrls}
            name="artifactUrls"
            value={draft.artifactUrls}
            onChange={(value) => updateDraft((current) => ({ ...current, artifactUrls: value }))}
          />
          <TextAreaField
            label={messages.findingUrls}
            name="findingUrls"
            value={draft.findingUrls}
            onChange={(value) => updateDraft((current) => ({ ...current, findingUrls: value }))}
          />
        </div>
        {showValidation && !validation.ok ? (
          <div className="lyra-evidence__validation">
            <h4>{messages.validationHeading}</h4>
            <ul>
              {[...new Set(validation.errors.map(({ message }) => message))].map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {exportBlocker === null ? null : (
          <p className="lyra-evidence__validation">{exportBlocker}</p>
        )}
        <div className="lyra-evidence__export-actions">
          <button
            className="lyra-btn lyra-btn--primary lyra-btn--lg"
            type="button"
            disabled={!exportEnabled}
            onClick={() => void copyJson()}
          >
            {messages.copyJson}
          </button>
          <button
            className="lyra-btn lyra-btn--secondary lyra-btn--lg"
            type="button"
            disabled={!exportEnabled}
            onClick={downloadJson}
          >
            {messages.downloadJson}
          </button>
        </div>
      </section>
    </div>
  );
}

export function HarnessApp(props: HarnessAppProps) {
  return <LocaleHarness key={props.locale} {...props} />;
}
