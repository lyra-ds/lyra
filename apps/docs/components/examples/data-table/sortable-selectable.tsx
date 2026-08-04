'use client';

import { DataTable, type DataTableColumn, type DataTableSorting } from '@lyra-ds/react';
import { useState } from 'react';

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'team', label: 'Team', sortable: true },
  { key: 'tasks', label: 'Open tasks', align: 'right', sortable: true },
];

const rows = [
  { id: 'maya', name: 'Maya Chen', team: 'Design', tasks: 4 },
  { id: 'jon', name: 'Jon Bell', team: 'Engineering', tasks: 12 },
  { id: 'priya', name: 'Priya Shah', team: 'Operations', tasks: 7 },
];

export function DataTableSortableSelectable() {
  const [sorting, setSorting] = useState<DataTableSorting | null>(null);
  const [selected, setSelected] = useState<Array<string | number>>([]);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      sorting={sorting}
      onSortChange={setSorting}
      selectable
      selected={selected}
      onSelectionChange={setSelected}
      labels={{ selectRow: (row) => `Select ${String(row.name)}` }}
    />
  );
}
