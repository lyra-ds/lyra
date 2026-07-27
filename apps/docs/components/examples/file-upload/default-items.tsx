'use client';

import { FileUpload } from '@lyra-ds/react';

export function FileUploadDefaultItems() {
  return (
    <FileUpload
      accept=".pdf,.png"
      maxSizeMB={5}
      defaultItems={[
        {
          id: 'brand-guidelines',
          name: 'brand-guidelines.pdf',
          size: 845_000,
          progress: 100,
          status: 'done',
        },
      ]}
    />
  );
}
