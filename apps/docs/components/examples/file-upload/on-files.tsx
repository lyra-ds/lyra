'use client';

import { FileUpload } from '@lyra-ds/react';
import { useState } from 'react';

export function FileUploadOnFiles() {
  const [fileCount, setFileCount] = useState(0);

  return (
    <>
      <FileUpload
        label="Upload one logo"
        hint="PNG, JPG or SVG up to 2 MB."
        accept="image/png,image/jpeg,image/svg+xml"
        maxSizeMB={2}
        multiple={false}
        onFiles={(files) => setFileCount(files.length)}
      />
      {fileCount > 0 && <span>{fileCount} file ready to upload.</span>}
    </>
  );
}
