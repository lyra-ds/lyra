'use client';

import { useState } from 'react';
import { Button, Icon, IconButton, Tooltip } from '@lyra-ds/react';

export function TooltipOverflow() {
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [selected, setSelected] = useState('Overview');

  return (
    <div
      className="lw-tooltip-overflow-demo"
      data-theme={dark ? 'dark' : 'light'}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div className="lw-tooltip-overflow-demo__controls">
        <Button variant="secondary" aria-pressed={dark} onClick={() => setDark(!dark)}>
          Dark theme
        </Button>
        <Button variant="secondary" aria-pressed={rtl} onClick={() => setRtl(!rtl)}>
          Right to left
        </Button>
      </div>
      <p>Hover or focus an icon, then scroll this clipped navigation.</p>
      <div className="lw-tooltip-overflow-demo__clip">
        {(['Overview', 'Projects', 'Team', 'Reports', 'Activity', 'Settings'] as const).map(
          (label) => (
            <Tooltip
              key={label}
              escapeClipping
              placement="right"
              tip={`Open ${label.toLowerCase()} for everyone in the current workspace`}
            >
              <IconButton
                label={label}
                aria-pressed={selected === label}
                onClick={() => setSelected(label)}
              >
                <Icon name={label === 'Settings' ? 'settings' : 'folder'} size={18} />
              </IconButton>
            </Tooltip>
          ),
        )}
      </div>
      <p aria-live="polite">Selected: {selected}</p>
    </div>
  );
}
