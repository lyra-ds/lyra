'use client';

import { Icon, Toast } from '@lyra-ds/react';
import { useState } from 'react';

export function ToastBasic() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed)
    return (
      <button type="button" onClick={() => setDismissed(false)}>
        Show the toast again
      </button>
    );

  return (
    <Toast tone="success" icon={<Icon name="check" size={17} />} onClose={() => setDismissed(true)}>
      Project archived
    </Toast>
  );
}
