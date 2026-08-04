import { DataTable, PersonCell, type DataTableColumn } from '@lyra-ds/react';

const columns: DataTableColumn[] = [
  { key: 'person', label: 'Person' },
  { key: 'team', label: 'Team' },
];

const rows = [
  {
    id: 'maya',
    person: <PersonCell name="Maya Chen" detail="maya@example.com" />,
    team: 'Design',
  },
  {
    id: 'jon',
    person: <PersonCell name="Jon Bell" detail="jon@example.com" />,
    team: 'Engineering',
  },
];

export function PersonCellInDataTable() {
  return <DataTable columns={columns} rows={rows} />;
}
