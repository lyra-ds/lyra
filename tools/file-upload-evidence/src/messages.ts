export interface EvidenceMessages {
  scenarios: {
    'DF-FU-M01': string;
    'DF-FU-M02': string;
    'DF-FU-M03': string;
    'DF-FU-M04': string;
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
    noAssistiveTechnologyConfirmation: string;
    inputMethods: string;
    viewport: string;
    mediaQueries: string;
    expected: string;
    actual: string;
    result: string;
    'reviewer.name': string;
    'reviewer.approval': string;
    artifactUrls: string;
    findingUrls: string;
  };
  instructions: {
    m03: string;
    export: string;
  };
  status: {
    pass: string;
    fail: string;
    blocked: string;
  };
  announcements: {
    replacementRejected: string;
    uploadCanceled: string;
    uploadRetried: string;
  };
}

const en: EvidenceMessages = {
  scenarios: {
    'DF-FU-M01': 'DF-FU-M01 — Windows, NVDA, and a current browser',
    'DF-FU-M02': 'DF-FU-M02 — macOS, VoiceOver, and Safari',
    'DF-FU-M03': 'DF-FU-M03 — keyboard, touch, and a 320 CSS pixel viewport',
    'DF-FU-M04': 'DF-FU-M04 — native form and delayed Alpine initialization',
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
    noAssistiveTechnologyConfirmation: 'Confirm that no assistive technology was active.',
    inputMethods: 'Record at least one physical input method.',
    viewport: 'Record a valid viewport and device pixel ratio.',
    mediaQueries: 'Record the evaluated media queries.',
    expected: 'Enter the expected announcement or behavior.',
    actual: 'Enter the actual announcement or behavior.',
    result: 'Choose PASS or FAIL.',
    'reviewer.name': 'Enter the reviewer name.',
    'reviewer.approval': 'Reviewer approval must agree with the result.',
    artifactUrls: 'Add at least one HTTPS evidence artifact URL.',
    findingUrls: 'Finding URLs must be absolute HTTPS URLs.',
  },
  instructions: {
    m03: 'M03 can pass only at 320 CSS pixels with real coarse pointer and physical touch and keyboard input.',
    export: 'Copy or download JSON only after every required observation field is complete.',
  },
  status: {
    pass: 'PASS',
    fail: 'FAIL',
    blocked: 'Blocked',
  },
  announcements: {
    replacementRejected: 'Active replacement was rejected.',
    uploadCanceled: 'Upload canceled.',
    uploadRetried: 'Upload retried.',
  },
};

const ptBR: EvidenceMessages = {
  scenarios: {
    'DF-FU-M01': 'DF-FU-M01 — Windows, NVDA e navegador atual',
    'DF-FU-M02': 'DF-FU-M02 — macOS, VoiceOver e Safari',
    'DF-FU-M03': 'DF-FU-M03 — teclado, toque e viewport de 320 pixels CSS',
    'DF-FU-M04': 'DF-FU-M04 — formulário nativo e inicialização Alpine atrasada',
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
    noAssistiveTechnologyConfirmation: 'Confirme que nenhuma tecnologia assistiva estava ativa.',
    inputMethods: 'Registre pelo menos um método de entrada físico.',
    viewport: 'Registre um viewport e uma proporção de pixels válidos.',
    mediaQueries: 'Registre as media queries avaliadas.',
    expected: 'Informe o anúncio ou comportamento esperado.',
    actual: 'Informe o anúncio ou comportamento real.',
    result: 'Escolha APROVADO ou REPROVADO.',
    'reviewer.name': 'Informe o nome da pessoa revisora.',
    'reviewer.approval': 'A aprovação da revisão deve corresponder ao resultado.',
    artifactUrls: 'Adicione pelo menos uma URL HTTPS de artefato de evidência.',
    findingUrls: 'As URLs de achados devem ser URLs HTTPS absolutas.',
  },
  instructions: {
    m03: 'M03 só pode ser aprovado em 320 pixels CSS com ponteiro grosseiro real e entrada física por toque e teclado.',
    export:
      'Copie ou baixe o JSON somente depois de preencher todos os campos obrigatórios da observação.',
  },
  status: {
    pass: 'APROVADO',
    fail: 'REPROVADO',
    blocked: 'Bloqueado',
  },
  announcements: {
    replacementRejected: 'A substituição ativa foi rejeitada.',
    uploadCanceled: 'Envio cancelado.',
    uploadRetried: 'Envio repetido.',
  },
};

export const MESSAGES = { en, 'pt-BR': ptBR } as const;
