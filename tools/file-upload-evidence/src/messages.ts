export interface EvidenceMessages {
  scenarios: {
    'DF-FU-M01': string;
    'DF-FU-M02': string;
  };
  endpoint: {
    invalidMode: string;
    invalidRequest: string;
    requestTooLarge: string;
  };
  validation: {
    scenario: string;
    locale: string;
    revision: string;
    deploymentUrl: string;
    executedAt: string;
    timezone: string;
    'os.name': string;
    'os.version': string;
    'os.build': string;
    'browser.name': string;
    'browser.version': string;
    assistiveTechnology: string;
    'assistiveTechnology.name': string;
    'assistiveTechnology.version': string;
    inputMethods: string;
    viewport: string;
    mediaQueries: string;
    expected: string;
    actual: string;
    checkAttestations: string;
    result: string;
    'reviewer.name': string;
    'reviewer.approval': string;
    artifactPaths: string;
    findingUrls: string;
  };
  instructions: { export: string };
  status: { pass: string; fail: string; blocked: string };
  announcements: {
    replacementRejected: string;
    uploadCanceled: string;
    uploadRetried: string;
  };
}

const en: EvidenceMessages = {
  scenarios: {
    'DF-FU-M01': 'DF-FU-M01 — Windows, NVDA, and a current Firefox or Chromium browser',
    'DF-FU-M02': 'DF-FU-M02 — macOS, VoiceOver, and Safari',
  },
  endpoint: {
    invalidMode: 'Choose a valid upload mode.',
    invalidRequest: 'The upload request is invalid.',
    requestTooLarge: 'The selected file is larger than 10 MiB.',
  },
  validation: {
    scenario: 'Choose a manual scenario.',
    locale: 'Choose a supported route locale.',
    revision: 'Enter the full 40-character lowercase Git revision.',
    deploymentUrl: 'Enter an absolute HTTPS deployment URL.',
    executedAt: 'Enter an ISO 8601 timestamp in UTC.',
    timezone: 'Enter the observed time zone.',
    'os.name': 'Enter the operating system name.',
    'os.version': 'Enter the operating system version.',
    'os.build': 'Enter the operating system build.',
    'browser.name': 'Enter the browser name.',
    'browser.version': 'Enter the browser version.',
    assistiveTechnology: 'Assistive technology is required for this scenario.',
    'assistiveTechnology.name': 'Enter the assistive technology name.',
    'assistiveTechnology.version': 'Enter the assistive technology version.',
    inputMethods: 'Record at least one physical input method.',
    viewport: 'Record a valid viewport and device pixel ratio.',
    mediaQueries: 'Record the evaluated media queries.',
    expected: 'Enter the expected announcement or behavior.',
    actual: 'Enter the actual announcement or behavior.',
    checkAttestations: 'Complete the exact guided checklist for this scenario.',
    result: 'Choose PASS or FAIL.',
    'reviewer.name': 'Enter the reviewer name.',
    'reviewer.approval': 'Reviewer approval must agree with the result.',
    artifactPaths: 'Add one to four local evidence attachments for this scenario.',
    findingUrls: 'Finding URLs must be absolute HTTPS URLs.',
  },
  instructions: {
    export:
      'Download the local evidence ZIP only after every required observation field is complete.',
  },
  status: { pass: 'PASS', fail: 'FAIL', blocked: 'Blocked' },
  announcements: {
    replacementRejected: 'Active replacement was rejected.',
    uploadCanceled: 'Upload canceled.',
    uploadRetried: 'Upload retried.',
  },
};

const ptBR: EvidenceMessages = {
  scenarios: {
    'DF-FU-M01': 'DF-FU-M01 — Windows, NVDA e Firefox ou Chromium atual',
    'DF-FU-M02': 'DF-FU-M02 — macOS, VoiceOver e Safari',
  },
  endpoint: {
    invalidMode: 'Escolha um modo de envio válido.',
    invalidRequest: 'A solicitação de envio é inválida.',
    requestTooLarge: 'O arquivo selecionado é maior que 10 MiB.',
  },
  validation: {
    scenario: 'Escolha um cenário manual.',
    locale: 'Escolha uma localidade de rota compatível.',
    revision: 'Informe a revisão Git completa de 40 caracteres minúsculos.',
    deploymentUrl: 'Informe uma URL absoluta HTTPS de implantação.',
    executedAt: 'Informe um registro de data e hora ISO 8601 em UTC.',
    timezone: 'Informe o fuso horário observado.',
    'os.name': 'Informe o nome do sistema operacional.',
    'os.version': 'Informe a versão do sistema operacional.',
    'os.build': 'Informe a compilação do sistema operacional.',
    'browser.name': 'Informe o nome do navegador.',
    'browser.version': 'Informe a versão do navegador.',
    assistiveTechnology: 'A tecnologia assistiva é obrigatória para este cenário.',
    'assistiveTechnology.name': 'Informe o nome da tecnologia assistiva.',
    'assistiveTechnology.version': 'Informe a versão da tecnologia assistiva.',
    inputMethods: 'Registre pelo menos um método de entrada físico.',
    viewport: 'Registre um viewport e uma proporção de pixels válidos.',
    mediaQueries: 'Registre as media queries avaliadas.',
    expected: 'Informe o anúncio ou comportamento esperado.',
    actual: 'Informe o anúncio ou comportamento real.',
    checkAttestations: 'Conclua o checklist guiado exato deste cenário.',
    result: 'Escolha APROVADO ou REPROVADO.',
    'reviewer.name': 'Informe o nome da pessoa revisora.',
    'reviewer.approval': 'A aprovação da revisão deve corresponder ao resultado.',
    artifactPaths: 'Adicione de um a quatro arquivos como anexo local de evidência deste cenário.',
    findingUrls: 'As URLs de achados devem ser URLs HTTPS absolutas.',
  },
  instructions: {
    export:
      'Baixe o ZIP de evidências local somente depois de preencher todos os campos obrigatórios.',
  },
  status: { pass: 'APROVADO', fail: 'REPROVADO', blocked: 'Bloqueado' },
  announcements: {
    replacementRejected: 'A substituição ativa foi rejeitada.',
    uploadCanceled: 'Envio cancelado.',
    uploadRetried: 'Envio repetido.',
  },
};

export const MESSAGES = { en, 'pt-BR': ptBR } as const;
