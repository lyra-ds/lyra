import type { FileUploadMessages } from '@lyra-ds/react/file-upload';
import { useRef, useState } from 'react';
import '@lyra-ds/styles/styles.css';

import {
  canonicalArchivePathKey,
  MANUAL_MEDIA_TYPES,
  MAX_MANUAL_FILES,
  MAX_MANUAL_FILE_BYTES,
  MAX_MANUAL_SCENARIO_BYTES,
  SCENARIO_CHECK_IDS,
  type EnvironmentTelemetry,
  type FileUploadManualObservation,
  type Locale,
  type ManualScenario,
  type ScenarioCheckId,
  validateObservation,
} from './contracts';
import {
  createManualEvidenceBundle,
  sanitizeEvidenceFileName,
  type ManualEvidenceAttachments,
  type ManualEvidenceBundle,
} from './evidence-bundle';
import { MESSAGES } from './messages';
import {
  ReactFileUploadEvidence,
  type EvidenceOperatorMode,
  type ReactFileUploadEvidenceDiagnostics,
  type ReactFileUploadEvidenceHandle,
} from './react-file-upload';
import { captureTelemetry } from './telemetry';
import './harness.css';

const SCENARIOS: readonly ManualScenario[] = ['DF-FU-M01', 'DF-FU-M02'];
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
  scenarioChoice: string;
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
  inputMethods: string;
  touchUsed: string;
  keyboardUsed: string;
  mouseUsed: string;
  expectedOutcome: string;
  expectedByScenario: Record<ManualScenario, string>;
  actual: string;
  attachments: string;
  attachmentLabel: string;
  attachmentGuidance: string;
  attachmentAccepted: string;
  attachmentErrors: {
    tooMany: string;
    empty: (name: string) => string;
    tooLarge: (name: string) => string;
    unsupported: (name: string) => string;
    totalTooLarge: string;
  };
  removeAttachment: (name: string) => string;
  review: string;
  result: string;
  choose: string;
  reviewerName: string;
  reviewerApproval: string;
  approved: string;
  changesRequested: string;
  findingUrls: string;
  validationHeading: string;
  downloadZip: string;
  creatingZip: string;
  zipError: string;
  zipIncludes: (scenarios: readonly ManualScenario[]) => string;
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
    environment: 'Revision and observed environment',
    userAgent: 'Supporting user agent',
    timezone: 'Timezone',
    viewportWidth: 'Viewport width',
    viewportHeight: 'Viewport height',
    devicePixelRatio: 'Device pixel ratio',
    scenarioChoice: 'Manual scenario choice',
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
    checklist: 'Assistive technology attestations',
    observation: 'Environment and observation',
    osName: 'Operating system name',
    osVersion: 'Operating system version',
    osBuild: 'Operating system build',
    browserName: 'Browser name',
    browserVersion: 'Browser version',
    atName: 'Assistive technology name',
    atVersion: 'Assistive technology version',
    inputMethods: 'Physical input methods',
    touchUsed: 'Touch used',
    keyboardUsed: 'Physical keyboard used',
    mouseUsed: 'Mouse used',
    expectedOutcome: 'Expected outcome',
    expectedByScenario: {
      'DF-FU-M01':
        'The FileUpload lifecycle, announcements, progress, recovery, and focus match the guided M01 checks.',
      'DF-FU-M02':
        'The FileUpload lifecycle, announcements, progress, recovery, and focus match the guided M02 checks.',
    },
    actual: 'Actual observation',
    attachments: 'Local evidence files',
    attachmentLabel: 'Local evidence files',
    attachmentGuidance:
      'Select 1–4 files. Each file may be up to 50 MiB; combined size may be up to 100 MiB.',
    attachmentAccepted: 'Accepted: PNG, JPEG, WebP, WebM, MP4, and QuickTime.',
    attachmentErrors: {
      tooMany: 'Select no more than 4 evidence files.',
      empty: (name) => `${name} is empty.`,
      tooLarge: (name) => `${name} is larger than 50 MiB.`,
      unsupported: (name) => `${name} has an unsupported media type.`,
      totalTooLarge: 'The selected evidence files exceed 100 MiB.',
    },
    removeAttachment: (name) => `Remove ${name}`,
    review: 'Result, reviewer, and findings',
    result: 'Result',
    choose: 'Choose',
    reviewerName: 'Reviewer name',
    reviewerApproval: 'Reviewer approval',
    approved: 'Approved',
    changesRequested: 'Changes requested',
    findingUrls: 'Finding URLs (one per line)',
    validationHeading: 'Complete these fields before export',
    downloadZip: 'Download evidence ZIP',
    creatingZip: 'Creating evidence ZIP…',
    zipError: 'The local evidence ZIP could not be created. Review the selected files and retry.',
    zipIncludes: (scenarios) =>
      `ZIP includes: ${scenarios.length === 2 ? `${scenarios[0]} and ${scenarios[1]}` : scenarios[0]}.`,
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
    environment: 'Revisão e ambiente observado',
    userAgent: 'User agent de apoio',
    timezone: 'Fuso horário',
    viewportWidth: 'Largura do viewport',
    viewportHeight: 'Altura do viewport',
    devicePixelRatio: 'Proporção de pixels do dispositivo',
    scenarioChoice: 'Escolha do cenário manual',
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
    checklist: 'Atestações de tecnologia assistiva',
    observation: 'Ambiente e observação',
    osName: 'Nome do sistema operacional',
    osVersion: 'Versão do sistema operacional',
    osBuild: 'Compilação do sistema operacional',
    browserName: 'Nome do navegador',
    browserVersion: 'Versão do navegador',
    atName: 'Nome da tecnologia assistiva',
    atVersion: 'Versão da tecnologia assistiva',
    inputMethods: 'Métodos físicos de entrada',
    touchUsed: 'Toque usado',
    keyboardUsed: 'Teclado físico usado',
    mouseUsed: 'Mouse usado',
    expectedOutcome: 'Resultado esperado',
    expectedByScenario: {
      'DF-FU-M01':
        'O ciclo de vida, os anúncios, o progresso, a recuperação e o foco do FileUpload correspondem às verificações guiadas M01.',
      'DF-FU-M02':
        'O ciclo de vida, os anúncios, o progresso, a recuperação e o foco do FileUpload correspondem às verificações guiadas M02.',
    },
    actual: 'Observação real',
    attachments: 'Arquivos locais de evidência',
    attachmentLabel: 'Arquivos locais de evidência',
    attachmentGuidance:
      'Selecione de 1 a 4 arquivos. Cada arquivo pode ter até 50 MiB; o total pode ter até 100 MiB.',
    attachmentAccepted: 'Aceitos: PNG, JPEG, WebP, WebM, MP4 e QuickTime.',
    attachmentErrors: {
      tooMany: 'Selecione no máximo 4 arquivos de evidência.',
      empty: (name) => `${name} está vazio.`,
      tooLarge: (name) => `${name} é maior que 50 MiB.`,
      unsupported: (name) => `${name} tem um tipo de mídia não aceito.`,
      totalTooLarge: 'Os arquivos de evidência selecionados excedem 100 MiB.',
    },
    removeAttachment: (name) => `Remover ${name}`,
    review: 'Resultado, revisão e achados',
    result: 'Resultado',
    choose: 'Escolha',
    reviewerName: 'Nome da pessoa revisora',
    reviewerApproval: 'Aprovação da revisão',
    approved: 'Aprovado',
    changesRequested: 'Alterações solicitadas',
    findingUrls: 'URLs dos achados (uma por linha)',
    validationHeading: 'Preencha estes campos antes da exportação',
    downloadZip: 'Baixar ZIP de evidências',
    creatingZip: 'Criando ZIP de evidências…',
    zipError:
      'Não foi possível criar o ZIP de evidências local. Revise os arquivos selecionados e tente novamente.',
    zipIncludes: (scenarios) =>
      `ZIP inclui: ${scenarios.length === 2 ? `${scenarios[0]} e ${scenarios[1]}` : scenarios[0]}.`,
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
  readonly inputMethods: readonly string[];
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly devicePixelRatio: number;
  };
  readonly mediaQueries: Record<string, boolean>;
  readonly actual: string;
  readonly checkAttestations: Record<string, boolean>;
  readonly result: '' | 'PASS' | 'FAIL';
  readonly reviewer: {
    readonly name: string;
    readonly approval: '' | 'approved' | 'changes-requested';
  };
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
  readonly xhrFactory?: () => XMLHttpRequest;
  readonly createBundle?: typeof createManualEvidenceBundle;
  readonly downloadBundle?: (bundle: ManualEvidenceBundle) => void;
}

function captureBrowserEnvironment(): EnvironmentTelemetry {
  return captureTelemetry(window, navigator);
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
    inputMethods: [],
    viewport: environment.viewport,
    mediaQueries: environment.mediaQueries,
    actual: '',
    checkAttestations: Object.fromEntries(SCENARIO_CHECK_IDS[scenario].map((id) => [id, false])),
    result: '',
    reviewer: { name: '', approval: '' },
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
  if (value === 'DF-FU-M01' || value === 'DF-FU-M02') return value;
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

function attachmentPaths(scenario: ManualScenario, files: readonly File[]): string[] {
  const ordinals = new Map<string, number>();
  return files
    .map(({ name }) => sanitizeEvidenceFileName(name))
    .sort((left, right) => left.localeCompare(right, 'en'))
    .map((name) => {
      const key = canonicalArchivePathKey(name);
      const ordinal = (ordinals.get(key) ?? 0) + 1;
      ordinals.set(key, ordinal);
      if (ordinal === 1) return `artifacts/${scenario}/${name}`;
      const extensionAt = name.lastIndexOf('.');
      const suffixed =
        extensionAt > 0
          ? `${name.slice(0, extensionAt)}-${ordinal}${name.slice(extensionAt)}`
          : `${name}-${ordinal}`;
      return `artifacts/${scenario}/${suffixed}`;
    });
}

function observationValue(
  draft: ObservationDraft,
  files: readonly File[],
  expected: string,
): unknown {
  return {
    ...draft,
    inputMethods: [...draft.inputMethods],
    expected,
    artifactPaths: attachmentPaths(draft.scenario, files),
    findingUrls: parseUrlLines(draft.findingUrls),
  };
}

function attachmentError(
  files: readonly File[],
  messages: UiMessages,
): string | undefined {
  if (files.length > MAX_MANUAL_FILES) return messages.attachmentErrors.tooMany;
  for (const file of files) {
    if (file.size < 1) return messages.attachmentErrors.empty(file.name);
    if (file.size > MAX_MANUAL_FILE_BYTES) return messages.attachmentErrors.tooLarge(file.name);
    if (!MANUAL_MEDIA_TYPES.has(file.type)) {
      return messages.attachmentErrors.unsupported(file.name);
    }
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_MANUAL_SCENARIO_BYTES) {
    return messages.attachmentErrors.totalTooLarge;
  }
  return undefined;
}

function downloadBundleInBrowser(bundle: ManualEvidenceBundle): void {
  const bytes = bundle.bytes.slice().buffer as ArrayBuffer;
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: bundle.mediaType }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = bundle.fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
}

function downloadFixture(file: File): void {
  const objectUrl = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = file.name;
  try {
    anchor.click();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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
  xhrFactory,
  createBundle = createManualEvidenceBundle,
  downloadBundle = downloadBundleInBrowser,
}: HarnessAppProps) {
  const messages = UI_MESSAGES[locale];
  const readEnvironment = captureEnvironment ?? captureBrowserEnvironment;
  const readTime = now ?? (() => new Date());
  const [initialEnvironment] = useState(readEnvironment);
  const [scenario, setScenario] = useState<ManualScenario>('DF-FU-M01');
  const [drafts, setDrafts] = useState<Partial<Record<ManualScenario, ObservationDraft>>>(() => ({
    'DF-FU-M01': createDraft(
      'DF-FU-M01',
      locale,
      revision,
      deploymentUrl,
      initialEnvironment,
      readTime().toISOString(),
    ),
  }));
  const [attachments, setAttachments] = useState<
    Partial<Record<ManualScenario, readonly File[]>>
  >({});
  const [mode, setMode] = useState<EvidenceOperatorMode>('success');
  const [showValidation, setShowValidation] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const [includedScenarios, setIncludedScenarios] = useState<readonly ManualScenario[]>([]);
  const instrumentRef = useRef<ReactFileUploadEvidenceHandle>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const draft = requiredDraft(drafts, scenario);
  const files = attachments[scenario] ?? [];
  const selectedAttachmentError = attachmentError(files, messages);
  const validation = validateObservation(
    observationValue(draft, files, messages.expectedByScenario[scenario]),
  );
  const exportEnabled = validation.ok && selectedAttachmentError === undefined && !exporting;
  const attachmentHelpId = `evidence-attachments-help-${locale}`;
  const attachmentErrorId = `evidence-attachments-error-${locale}`;

  function updateDraft(update: (current: ObservationDraft) => ObservationDraft): void {
    setShowValidation(true);
    setExportError(undefined);
    setIncludedScenarios([]);
    setDrafts((current) => ({
      ...current,
      [scenario]: update(requiredDraft(current, scenario)),
    }));
  }

  function updateFiles(nextFiles: readonly File[]): void {
    setShowValidation(true);
    setExportError(undefined);
    setIncludedScenarios([]);
    setAttachments((current) => ({ ...current, [scenario]: nextFiles }));
  }

  async function downloadEvidence(): Promise<void> {
    const synchronizedDraft = draftWithEnvironment(draft, readEnvironment());
    const synchronizedDrafts = { ...drafts, [scenario]: synchronizedDraft };
    setDrafts(synchronizedDrafts);
    setShowValidation(true);
    setExportError(undefined);

    const selectedValidation = validateObservation(
      observationValue(synchronizedDraft, files, messages.expectedByScenario[scenario]),
    );
    if (!selectedValidation.ok || selectedAttachmentError !== undefined) return;

    const records: FileUploadManualObservation[] = [];
    const selectedAttachments = new Map<ManualScenario, readonly File[]>();
    for (const candidateScenario of SCENARIOS) {
      const candidateDraft = synchronizedDrafts[candidateScenario];
      const candidateFiles = attachments[candidateScenario] ?? [];
      if (
        candidateDraft === undefined ||
        candidateDraft.revision !== synchronizedDraft.revision ||
        candidateDraft.deploymentUrl !== synchronizedDraft.deploymentUrl ||
        attachmentError(candidateFiles, messages) !== undefined
      ) {
        continue;
      }
      const candidateValidation = validateObservation(
        observationValue(
          candidateDraft,
          candidateFiles,
          messages.expectedByScenario[candidateScenario],
        ),
      );
      if (!candidateValidation.ok) continue;
      records.push(candidateValidation.value);
      selectedAttachments.set(candidateScenario, candidateFiles);
    }

    setExporting(true);
    try {
      const bundle = await createBundle(records, selectedAttachments as ManualEvidenceAttachments);
      downloadBundle(bundle);
      setIncludedScenarios(records.map(({ scenario: included }) => included));
    } catch {
      setExportError(messages.zipError);
      setIncludedScenarios([]);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="lyra-evidence">
      <header className="lyra-evidence__intro">
        <h2>{messages.heading}</h2>
        <p>{messages.intro}</p>
      </header>

      <section className="lyra-evidence__section" aria-labelledby="evidence-build-heading">
        <h3 id="evidence-build-heading">{messages.buildMetadata}</h3>
        <dl className="lyra-evidence__metadata lyra-evidence__metadata--compact">
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

      <section className="lyra-evidence__section" aria-labelledby="evidence-scenario-heading">
        <h3 id="evidence-scenario-heading">{messages.scenarioChoice}</h3>
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
              setExportError(undefined);
              setIncludedScenarios([]);
            }}
          >
            {SCENARIOS.map((entry) => (
              <option key={entry} value={entry}>
                {MESSAGES[locale].scenarios[entry]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="lyra-evidence__section" aria-labelledby="react-lifecycle-heading">
        <h3 id="react-lifecycle-heading">{messages.controlledLifecycle}</h3>
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
        <div className="lyra-evidence__fixture">
          <div>
            <h4>{messages.longFixture}</h4>
            <code>{messages.longFixtureName}</code>
          </div>
          <button
            className="lyra-btn lyra-btn--secondary lyra-btn--md"
            type="button"
            onClick={() =>
              downloadFixture(
                new File([messages.longFixtureBody], messages.longFixtureName, {
                  type: 'text/plain',
                }),
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
            onChange={(value) =>
              updateDraft((current) => ({
                ...current,
                assistiveTechnology: { ...current.assistiveTechnology, version: value },
              }))
            }
          />
        </div>
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
        <h4>{messages.checklist}</h4>
        <p>{MESSAGES[locale].instructions.export}</p>
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
        <div className="lyra-evidence__expected">
          <h4>{messages.expectedOutcome}</h4>
          <p>{messages.expectedByScenario[scenario]}</p>
        </div>
        <TextAreaField
          label={messages.actual}
          name="actual"
          value={draft.actual}
          onChange={(value) => updateDraft((current) => ({ ...current, actual: value }))}
        />
      </section>

      <section className="lyra-evidence__section" aria-labelledby="evidence-attachments-heading">
        <h3 id="evidence-attachments-heading">{messages.attachments}</h3>
        <div className="lyra-field lyra-evidence__attachments">
          <label className="lyra-label" htmlFor={`evidence-attachments-${locale}`}>
            {messages.attachmentLabel}
          </label>
          <p id={attachmentHelpId} className="lyra-evidence__attachment-help">
            {messages.attachmentGuidance} {messages.attachmentAccepted}
          </p>
          <input
            key={scenario}
            ref={attachmentInputRef}
            className="lyra-input lyra-evidence__attachment-input"
            id={`evidence-attachments-${locale}`}
            name="evidenceAttachments"
            type="file"
            multiple
            accept={[...MANUAL_MEDIA_TYPES].join(',')}
            aria-invalid={selectedAttachmentError === undefined ? undefined : true}
            aria-describedby={
              selectedAttachmentError === undefined
                ? attachmentHelpId
                : `${attachmentHelpId} ${attachmentErrorId}`
            }
            onChange={(event) => {
              updateFiles(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = '';
            }}
          />
          {selectedAttachmentError === undefined ? null : (
            <p
              className="lyra-evidence__validation lyra-evidence__attachment-error"
              id={attachmentErrorId}
              role="alert"
            >
              {selectedAttachmentError}
            </p>
          )}
          {files.length === 0 ? null : (
            <ul className="lyra-evidence__attachment-list">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                  <span>{file.name}</span>
                  <button
                    className="lyra-btn lyra-btn--ghost lyra-btn--md lyra-evidence__remove-attachment"
                    type="button"
                    onClick={() => {
                      updateFiles(files.filter((_, fileIndex) => fileIndex !== index));
                      attachmentInputRef.current?.focus();
                    }}
                  >
                    {messages.removeAttachment(file.name)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="lyra-evidence__section" aria-labelledby="evidence-review-heading">
        <h3 id="evidence-review-heading">{messages.review}</h3>
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
        <TextAreaField
          label={messages.findingUrls}
          name="findingUrls"
          value={draft.findingUrls}
          onChange={(value) => updateDraft((current) => ({ ...current, findingUrls: value }))}
        />
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
        {exportError === undefined ? null : (
          <p className="lyra-evidence__validation" role="alert">
            {exportError}
          </p>
        )}
        {includedScenarios.length === 0 ? null : (
          <p className="lyra-evidence__export-summary" aria-live="polite">
            {messages.zipIncludes(includedScenarios)}
          </p>
        )}
        <div className="lyra-evidence__export-actions">
          <button
            className="lyra-btn lyra-btn--primary lyra-btn--lg"
            type="button"
            disabled={!exportEnabled}
            onClick={() => void downloadEvidence()}
          >
            {exporting ? messages.creatingZip : messages.downloadZip}
          </button>
        </div>
      </section>
    </div>
  );
}

export function HarnessApp(props: HarnessAppProps) {
  const evidenceIdentity = JSON.stringify([props.locale, props.revision, props.deploymentUrl]);
  return <LocaleHarness key={evidenceIdentity} {...props} />;
}
