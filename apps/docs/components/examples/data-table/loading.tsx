import { DataTable, type DataTableColumn } from '@lyra-ds/react';

const columns: DataTableColumn[] = [
  { key: 'project', label: 'Project' },
  { key: 'owner', label: 'Owner' },
  { key: 'updated', label: 'Updated' },
];

export function DataTableLoading() {
  return <DataTable columns={columns} rows={[]} loading={3} selectable />;
}
