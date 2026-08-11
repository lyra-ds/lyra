'use client';

import { SegmentedControl } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore, type ReactNode } from 'react';
import { resolveStack, stackLabelKey, stackOrder, type DocStack } from '@/lib/stacks';

export const STACK_STORAGE_KEY = 'lyra-docs-stack';

/** Trocar de stack numa página avisa os outros seletores dela na mesma renderização. */
const STACK_EVENT = 'lyra-docs-stack-change';

/**
 * Lê a stack pedida: `?stack=` ganha do valor guardado, porque um link colado carrega
 * intenção explícita e a preferência é só um hábito. Não valida o vocabulário — quem
 * decide o que é válido para *este* componente é `resolveStack`.
 */
export function readStoredStack(storage: Pick<Storage, 'getItem'>, search: string): string | null {
  const fromUrl = new URLSearchParams(search).get('stack');

  return fromUrl ?? storage.getItem(STACK_STORAGE_KEY);
}

function subscribe(onChange: () => void) {
  window.addEventListener(STACK_EVENT, onChange);
  // `storage` cobre a troca feita em outra aba do mesmo site.
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener(STACK_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function clientSnapshot(): string | null {
  return readStoredStack(window.localStorage, window.location.search);
}

/**
 * No servidor não há preferência: a página é gerada uma vez, para todo mundo. Devolver
 * `null` faz o HTML estático nascer na primeira stack disponível, e o cliente reavalia
 * depois de hidratar.
 */
function serverSnapshot(): string | null {
  return null;
}

/**
 * Marca um bloco como pertencente a uma stack. Todos os blocos vão para o HTML — a
 * visibilidade é resolvida em CSS a partir do atributo no contêiner, então a página
 * exportada estaticamente carrega o conteúdo das três e nada depende de JavaScript
 * para ser indexado.
 */
export function StackPanel({ stack, children }: { stack: DocStack; children: ReactNode }) {
  return <div data-stack={stack}>{children}</div>;
}

export function StackTabs({
  available,
  absence,
  children,
}: {
  available: DocStack[];
  absence?: Partial<Record<DocStack, string>>;
  children: ReactNode;
}) {
  const t = useTranslations();

  // A preferência é estado externo (URL e localStorage), não do React: espelhá-la em
  // useState criaria duas fontes de verdade que precisam ser sincronizadas a cada
  // navegação. Aqui ela é lida e a stack ativa é derivada na renderização.
  const requested = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const active = resolveStack(available, requested);

  function choose(stack: DocStack) {
    window.localStorage.setItem(STACK_STORAGE_KEY, stack);

    const url = new URL(window.location.href);
    url.searchParams.set('stack', stack);
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new Event(STACK_EVENT));
  }

  const missing = stackOrder.filter((stack) => !available.includes(stack));

  return (
    <div className="lw-stack-tabs" data-active-stack={active}>
      {available.length > 1 ? (
        <SegmentedControl
          label={t('stackSelector')}
          options={stackOrder
            .filter((stack) => available.includes(stack))
            .map((stack) => ({ value: stack, label: t(stackLabelKey[stack]) }))}
          value={active}
          onChange={(value) => choose(value as DocStack)}
        />
      ) : null}

      {missing.map((stack) =>
        absence?.[stack] ? (
          <p className="lw-stack-tabs__absence" key={stack}>
            <strong>{t(stackLabelKey[stack])}:</strong> {t(absence[stack])}
          </p>
        ) : null,
      )}

      {children}
    </div>
  );
}
