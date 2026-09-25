'use client';

import { useState } from 'react';
import { Badge, Button, DataTable, type DataTableColumn } from '@lyra-ds/react';

const columns: DataTableColumn[] = [
  { key: 'project', label: 'Project', rowHeader: true },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];

const projects = [
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
  const [openedProject, setOpenedProject] = useState<string | null>(null);
  const rows = projects.map((project) => ({
    ...project,
    actions: (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setOpenedProject(project.id)}
        tabIndex={0}
      >
        Open {project.project}
      </Button>
    ),
  }));

  const opened = projects.find((project) => project.id === openedProject);

  return (
    <div>
      <DataTable caption="Projects" columns={columns} rows={rows} hover />
      <p aria-live="polite">
        {opened
          ? `Showing details for ${opened.project}. Owner: ${opened.owner}.`
          : 'Choose a project action to view its details.'}
      </p>
    </div>
  );
}
