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
    <div className="lyra-table-wrap">
      <table className="lyra-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Required</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {component.props.map((prop) => (
            <tr key={prop.name}>
              <td className="lyra-table__primary">
                <code>{prop.name}</code>
              </td>
              <td>
                <code>{prop.type}</code>
              </td>
              <td>{prop.optional ? 'No' : 'Yes'}</td>
              <td>{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
