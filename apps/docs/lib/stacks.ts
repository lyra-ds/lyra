/**
 * As stacks documentadas: um CSS canônico, dois runtimes de comportamento (React e
 * Alpine) e, do lado Alpine, duas formas de emitir o HTML (à mão ou via Blade).
 *
 * O nome do tipo é `DocStack`, e não `Stack`, porque `Stack` já é um componente de
 * layout do próprio design system.
 */
export type DocStack = 'react' | 'html' | 'alpine' | 'blade';

/** Ordem canônica: do runtime mais usado ao mais específico. Decide o fallback. */
export const stackOrder: DocStack[] = ['react', 'html', 'alpine', 'blade'];

/**
 * `html` e `alpine` são o mesmo lugar visto de dois estados: todo componente tem HTML
 * canônico, e 31 deles ganham comportamento por um binding. Um componente estático mostra
 * "HTML"; um interativo mostra "HTML + Alpine" — nunca as duas abas, porque seria a mesma
 * aba duas vezes. `SIBLING` registra esse par para quem precisa saber que a ausência de
 * uma é explicada pela presença da outra.
 */
export const SIBLING: Partial<Record<DocStack, DocStack>> = { html: 'alpine', alpine: 'html' };

/** Stack → chave de mensagem next-intl, para que os rótulos não se dupliquem por aí. */
export const stackLabelKey: Record<DocStack, string> = {
  react: 'stackReact',
  html: 'stackHtml',
  alpine: 'stackAlpine',
  blade: 'stackBlade',
};

function isDocStack(value: unknown): value is DocStack {
  return typeof value === 'string' && (stackOrder as string[]).includes(value);
}

/**
 * Decide qual stack mostrar. `requested` vem de `?stack=` ou do localStorage e é dado
 * não confiável: valor fora do vocabulário, ou de uma stack que o componente não tem,
 * cai na primeira disponível na ordem canônica — nunca numa aba vazia.
 */
export function resolveStack(available: DocStack[], requested?: string | null): DocStack {
  if (isDocStack(requested) && available.includes(requested)) return requested;

  const fallback = stackOrder.find((stack) => available.includes(stack));
  if (!fallback) throw new Error('Um componente precisa de pelo menos uma stack disponível.');

  return fallback;
}
