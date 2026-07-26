'use client';

import { Icon, IconButton, Tooltip } from '@lyra-ds/react';

export function TooltipIconButton() {
  return (
    <>
      <Tooltip tip="Archive">
        <IconButton label="Archive">
          <Icon name="archive" size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip tip="Duplicate">
        <IconButton label="Duplicate">
          <Icon name="copy" size={18} />
        </IconButton>
      </Tooltip>
    </>
  );
}
