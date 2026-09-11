import { useState } from 'react';
import { BottomSheet } from '@lyra-ds/react/bottom-sheet';
import { CommandPalette, type CommandItem } from '@lyra-ds/react/command-palette';
import {
  CreateWorkspaceDialog,
  type CreateWorkspaceRequest,
} from '@lyra-ds/react/create-workspace-dialog';
import { DataTable, type DataTableColumn, type DataTableSorting } from '@lyra-ds/react/data-table';
import { Dialog } from '@lyra-ds/react/dialog';
import { Drawer } from '@lyra-ds/react/drawer';
import { Dropdown } from '@lyra-ds/react/dropdown';
import { Popover } from '@lyra-ds/react/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lyra-ds/react/tabs';
import { Tooltip } from '@lyra-ds/react/tooltip';
import { WorkspaceSwitcher } from '@lyra-ds/react/workspace-switcher';
import '@lyra-ds/styles';

const workspaces = [
  { id: 'north', name: 'North workspace', plan: 'Pro', members: 3 },
  { id: 'south', name: 'South workspace', plan: 'Team', members: 2 },
];

const tableColumns: DataTableColumn[] = [
  { key: 'name', label: 'Project', sortable: true },
  { key: 'total', label: 'Total', sortable: true },
];

const tableRows = [
  { id: 'north', name: 'North project', total: 240 },
  { id: 'south', name: 'South project', total: 180 },
];

export function P1PortalServerComposition() {
  return (
    <>
      <Dialog open onClose={() => {}} title="P1 server dialog">
        P1 server dialog body
      </Dialog>
      <Drawer open onClose={() => {}} title="P1 server drawer">
        P1 server drawer body
      </Drawer>
      <BottomSheet open onClose={() => {}} title="P1 server bottom sheet">
        P1 server bottom sheet body
      </BottomSheet>
      <CommandPalette
        open
        groups={[
          { label: 'P1 server commands', items: [{ id: 'server', label: 'P1 server command' }] },
        ]}
      />
      <CreateWorkspaceDialog open />
    </>
  );
}

export function P1Compatibility() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dropdownValue, setDropdownValue] = useState('P1 dropdown pending');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandResult, setCommandResult] = useState('P1 command pending');
  const [workspace, setWorkspace] = useState('north');
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createResult, setCreateResult] = useState('P1 workspace pending');
  const [createRequestCount, setCreateRequestCount] = useState(0);
  const [activeTab, setActiveTab] = useState('summary');
  const [sorting, setSorting] = useState<DataTableSorting | null>(null);

  return (
    <main aria-label="P1 packed React compatibility fixture">
      <p data-p1-marker="inline">P1 packed inline markup</p>

      <section aria-label="P1 modal proofs">
        <button type="button" aria-label="Open P1 dialog" onClick={() => setDialogOpen(true)}>
          Open P1 dialog
        </button>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="P1 dialog">
          P1 dialog body
        </Dialog>
        <output aria-label="P1 dialog state">{dialogOpen ? 'open' : 'closed'}</output>

        <button type="button" aria-label="Open P1 drawer" onClick={() => setDrawerOpen(true)}>
          Open P1 drawer
        </button>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="P1 drawer">
          P1 drawer body
        </Drawer>
        <output aria-label="P1 drawer state">{drawerOpen ? 'open' : 'closed'}</output>

        <button
          type="button"
          aria-label="Open P1 bottom sheet"
          onClick={() => setBottomSheetOpen(true)}
        >
          Open P1 bottom sheet
        </button>
        <BottomSheet
          open={bottomSheetOpen}
          onClose={() => setBottomSheetOpen(false)}
          title="P1 bottom sheet"
        >
          P1 bottom sheet body
        </BottomSheet>
        <output aria-label="P1 bottom sheet state">{bottomSheetOpen ? 'open' : 'closed'}</output>
      </section>

      <section aria-label="P1 anchored proofs">
        <Popover
          trigger={
            <button type="button" aria-label="Open P1 popover">
              Open P1 popover
            </button>
          }
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          ariaLabel="P1 popover"
        >
          P1 popover content
        </Popover>

        <Dropdown
          trigger={
            <button type="button" aria-label="Open P1 dropdown">
              Open P1 dropdown
            </button>
          }
          items={[
            {
              id: 'p1-select',
              label: 'Select P1 option',
              onSelect: () => setDropdownValue('P1 dropdown selected'),
            },
          ]}
        />
        <output aria-label="P1 dropdown value">{dropdownValue}</output>

        <Tooltip tip="P1 tooltip content">
          <button type="button" aria-label="P1 tooltip target">
            P1 tooltip target
          </button>
        </Tooltip>
      </section>

      <section aria-label="P1 workflow proofs">
        <button
          type="button"
          aria-label="Open P1 command palette"
          onClick={() => setCommandPaletteOpen(true)}
        >
          Open P1 command palette
        </button>
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelect={(item: CommandItem) => setCommandResult(`P1 command selected: ${item.label}`)}
          groups={[{ label: 'P1 commands', items: [{ id: 'choose', label: 'Choose P1 command' }] }]}
        />
        <output aria-label="P1 command result">{commandResult}</output>

        <WorkspaceSwitcher
          workspaces={workspaces}
          current={workspace}
          onChange={(id: string) => setWorkspace(id)}
        />
        <output aria-label="P1 selected workspace">
          {workspaces.find((candidate) => candidate.id === workspace)?.name}
        </output>

        <button
          type="button"
          aria-label="Open P1 create workspace dialog"
          onClick={() => setCreateWorkspaceOpen(true)}
        >
          Open P1 create workspace dialog
        </button>
        <CreateWorkspaceDialog
          open={createWorkspaceOpen}
          onClose={() => setCreateWorkspaceOpen(false)}
          onCreate={(request: CreateWorkspaceRequest) => {
            setCreateRequestCount((count) => count + 1);
            setCreateResult(`P1 workspace created: ${request.data.name}`);
            return { operationId: request.operationId, status: 'accepted' };
          }}
        />
        <output aria-label="P1 create workspace result">{createResult}</output>
        <output aria-label="P1 create workspace requests">{createRequestCount}</output>
      </section>

      <Tabs id="p1-tabs" active={activeTab} onChange={setActiveTab}>
        <TabsList aria-label="P1 sections">
          <TabsTrigger value="summary">P1 summary</TabsTrigger>
          <TabsTrigger value="activity">P1 activity</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">P1 summary panel</TabsContent>
        <TabsContent value="activity">P1 activity panel</TabsContent>
      </Tabs>

      <DataTable
        columns={tableColumns}
        rows={tableRows}
        sorting={sorting}
        onSortChange={setSorting}
      />
      <output aria-label="P1 table sorting">
        {sorting ? `${sorting.key}:${sorting.dir}` : 'P1 table unsorted'}
      </output>
    </main>
  );
}
