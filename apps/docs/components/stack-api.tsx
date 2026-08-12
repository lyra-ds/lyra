import { Badge, Table } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import alpineProps from '../../../tools/docgen/output/alpine-props.json';
import type { DocStack } from '@/lib/stacks';
import { PropTable } from './prop-table';

type AlpineEntry = {
  binding: string;
  kind: 'data' | 'store';
  slug: string;
  optionsType: string | null;
  description: string;
  props: { name: string; type: string; optional: boolean; description: string }[];
};

function AlpineApi({ slug }: { slug: string }) {
  const t = useTranslations();
  const entry = (alpineProps as AlpineEntry[]).find((candidate) => candidate.slug === slug);

  if (!entry) return <p role="alert">{t('apiNoBinding', { slug })}</p>;

  return (
    <>
      <p>
        <code>{entry.kind === 'store' ? entry.binding : `x-data="${entry.binding}({ … })"`}</code>
      </p>

      {entry.props.length === 0 ? (
        <p>{t('apiNoOptions')}</p>
      ) : (
        <Table
          columns={[
            { key: 'name', label: entry.kind === 'store' ? t('apiMember') : t('apiOption') },
            { key: 'type', label: t('apiType') },
            { key: 'required', label: t('required') },
            { key: 'description', label: t('apiDescription') },
          ]}
          rows={entry.props.map((prop) => ({
            description: prop.description,
            id: prop.name,
            name: <code>{prop.name}</code>,
            required: prop.optional ? (
              <span className="lw-prop-table__optional">—</span>
            ) : (
              <Badge tone="warning">{t('required')}</Badge>
            ),
            type: <code>{prop.type}</code>,
          }))}
        />
      )}
    </>
  );
}

/**
 * Tabela de API de uma stack. React vem de `props.json` (via PropTable, que já existia);
 * Alpine vem de `alpine-props.json`. Nenhuma das duas é escrita à mão em MDX — por isso
 * uma prop nova aparece na documentação no mesmo commit em que aparece no pacote.
 */
export function StackApi({ slug, stack, name }: { slug: string; stack: DocStack; name: string }) {
  const t = useTranslations();

  if (stack === 'react') return <PropTable name={name} />;
  if (stack === 'alpine') return <AlpineApi slug={slug} />;
  // HTML puro não tem API a gerar: o contrato é o markup, e ele está no corpo da página.
  if (stack === 'html') return null;

  return <p role="alert">{t('apiBladeSoon')}</p>;
}
