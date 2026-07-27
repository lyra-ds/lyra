'use client';

import { Button, Tooltip } from '@lyra-ds/react';

export function TooltipButton() {
  return (
    <Tooltip tip="Everyone in the workspace can open this link">
      <Button variant="secondary">Copy share link</Button>
    </Tooltip>
  );
}
