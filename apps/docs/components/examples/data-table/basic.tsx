import { Badge, DataTable, type DataTableColumn } from '@lyra-ds/react';

const columns: DataTableColumn[] = [
  { key: 'project', label: 'Project' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
];

const rows = [
  {
    id: 'atlas',
    project: 'Atlas',
    owner: 'Maya Chen',
    status: <Badge tone="success">Healthy</Badge>,
  },
  {
    id: 'orbit',
    project: 'Orbit',
    owner: 'Jon Bell',
    status: <Badge tone="warning">At risk</Badge>,
  },
  {
    id: 'nova',
    project: 'Nova',
    owner: 'Priya Shah',
    status: <Badge tone="neutral">Planning</Badge>,
  },
];

export function DataTableBasic() {
  return <DataTable columns={columns} rows={rows} hover />;
}
