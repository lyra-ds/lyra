import { Badge, CodeBlock, Table } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import alpineProps from '../../../tools/docgen/output/alpine-props.json';
import bladeApi from '../../../tools/blade-api/api.json';
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

type BladeEntry = {
  slug: string;
  usage: string;
  html: string;
  binding: string | null;
  props: { name: string; default: string | null; required: boolean; values: string[] }[];
};

type BladeApiFile = { version: string; components: BladeEntry[] };

/**
 * `values` vem de `observedValues` no gerador do pacote PHP — os valores que as fixtures
 * passam naquela prop, não o enum aceito. Por isso a coluna se chama "example values":
 * chamar de "valores aceitos" inventaria uma restrição que o artefato não afirma.
 */

function BladeApi({ slug }: { slug: string }) {
  const t = useTranslations();
  const { version, components } = bladeApi as BladeApiFile;
  const entry = components.find((candidate) => candidate.slug === slug);

  if (!entry) return <p role="alert">{t('apiNoBlade', { slug })}</p>;

  return (
    <>
      <p>
        <code>{`<lyra:${entry.slug}>`}</code>{' '}
        <span className="lw-stack-api__version">{t('bladeVersion', { version })}</span>
      </p>

      {entry.binding ? (
        <p>
          {t.rich('bladeInheritsAlpine', {
            binding: entry.binding,
            code: (chunks) => <code>{chunks}</code>,
            link: (chunks) => <a href="?stack=alpine">{chunks}</a>,
          })}
        </p>
      ) : null}

      {entry.props.length === 0 ? (
        <p>{t('apiBladeNoProps')}</p>
      ) : (
        <Table
          columns={[
            { key: 'name', label: t('apiProp') },
            { key: 'default', label: t('apiDefault') },
            { key: 'required', label: t('required') },
            { key: 'values', label: t('apiExampleValues') },
          ]}
          rows={entry.props.map((prop) => ({
            id: prop.name,
            name: <code>{prop.name}</code>,
            default: prop.default ? <code>{prop.default}</code> : '—',
            required: prop.required ? (
              <Badge tone="warning">{t('required')}</Badge>
            ) : (
              <span className="lw-prop-table__optional">—</span>
            ),
            values: prop.values.length
              ? prop.values.map((value, index) => (
                  <span key={value}>
                    {index > 0 ? ' ' : null}
                    <code>{value}</code>
                  </span>
                ))
              : '—',
          }))}
        />
      )}

      <CodeBlock language="blade" lineNumbers copyLabel={t('copy')} copiedLabel={t('copied')}>
        {entry.usage}
      </CodeBlock>
    </>
  );
}

/**
 * Tabela de API de uma stack. React vem de `props.json` (via PropTable, que já existia);
 * Alpine vem de `alpine-props.json`; Blade vem do snapshot `tools/blade-api/api.json`
 * copiado da release do pacote PHP. Nenhuma das três é escrita à mão em MDX — por isso
 * uma prop nova aparece na documentação no mesmo commit em que aparece no pacote.
 */
export function StackApi({ slug, stack, name }: { slug: string; stack: DocStack; name: string }) {
  if (stack === 'react') return <PropTable name={name} />;
  if (stack === 'alpine') return <AlpineApi slug={slug} />;
  // HTML puro não tem API a gerar: o contrato é o markup, e ele está no corpo da página.
  if (stack === 'html') return null;

  return <BladeApi slug={slug} />;
}
