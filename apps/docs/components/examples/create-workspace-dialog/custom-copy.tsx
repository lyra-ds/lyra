'use client';

import { Button, CreateWorkspaceDialog, type CreateWorkspaceRequest } from '@lyra-ds/react';
import { useRef, useState } from 'react';

export function CreateWorkspaceDialogCustomCopy() {
  const [open, setOpen] = useState(false);
  const [teamSpaces, setTeamSpaces] = useState<Array<{ id: string; name: string; slug: string }>>(
    [],
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const createTeamSpace = (request: CreateWorkspaceRequest) => {
    setTeamSpaces((current) => [...current, { id: request.operationId, ...request.data }]);
    return { operationId: request.operationId, status: 'accepted' as const };
  };

  return (
    <>
      <Button ref={triggerRef} variant="secondary" onClick={() => setOpen(true)}>
        Add a team space
      </Button>
      <CreateWorkspaceDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreate={createTeamSpace}
        title="Create a team space"
        slugPrefix="teams.example/"
        returnFocusTo={() => triggerRef.current}
      />
      <ul aria-label="Created team spaces">
        {teamSpaces.map((teamSpace) => (
          <li key={teamSpace.id}>{teamSpace.name}</li>
        ))}
      </ul>
    </>
  );
}
