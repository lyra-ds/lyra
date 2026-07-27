import { Badge, Table } from '@lyra-ds/react';
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
  const component = (props as ComponentDefinition[]).find((entry) => entry.name === name);

  if (!component) {
    return <p role="alert">No generated props found for {name}.</p>;
  }

  return (
    <Table
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'required', label: 'Required' },
        { key: 'description', label: 'Description' },
      ]}
      rows={component.props.map((prop) => ({
        description: prop.description,
        id: prop.name,
        name: <code>{prop.name}</code>,
        required: prop.optional ? (
          <span className="lw-prop-table__optional">—</span>
        ) : (
          <Badge tone="warning">Required</Badge>
        ),
        type: <code>{prop.type}</code>,
      }))}
    />
  );
}
