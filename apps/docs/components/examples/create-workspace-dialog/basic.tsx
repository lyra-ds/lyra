'use client';

import { Button, CreateWorkspaceDialog, type CreateWorkspaceRequest } from '@lyra-ds/react';
import { useRef, useState } from 'react';

export function CreateWorkspaceDialogBasic() {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; slug: string }>>(
    [],
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const createWorkspace = (request: CreateWorkspaceRequest) => {
    setWorkspaces((current) => [...current, { id: request.operationId, ...request.data }]);
    return { operationId: request.operationId, status: 'accepted' as const };
  };

  return (
    <>
      <Button ref={triggerRef} onClick={() => setOpen(true)}>
        Create workspace
      </Button>
      <CreateWorkspaceDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreate={createWorkspace}
        returnFocusTo={() => triggerRef.current}
      />
      <ul aria-label="Created workspaces">
        {workspaces.map((workspace) => (
          <li key={workspace.id}>{workspace.name}</li>
        ))}
      </ul>
    </>
  );
}
