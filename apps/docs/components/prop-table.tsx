import { Badge, Table } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import props from '../../../tools/docgen/output/props.json';

type Prop = {
  description: string;
  name: string;
  optional: boolean;
  type: string;
};

type ComponentDefinition = {
  name: string;
  props: Prop[];
};

export function PropTable({ name }: { name: string }) {
  const t = useTranslations();
  const component = (props as ComponentDefinition[]).find((entry) => entry.name === name);

  if (!component) {
    return <p role="alert">{t('apiNoProps', { name })}</p>;
  }

  return (
    <Table
      columns={[
        { key: 'name', label: t('apiName') },
        { key: 'type', label: t('apiType') },
        { key: 'required', label: t('required') },
        { key: 'description', label: t('apiDescription') },
      ]}
      rows={component.props.map((prop) => ({
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
  );
}
