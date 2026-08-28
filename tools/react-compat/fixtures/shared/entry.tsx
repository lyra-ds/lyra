import { useState } from 'react';
import type { FileUploadCancelIntent, FileUploadItem } from '@lyra-ds/react/file-upload';
import { FileUpload } from '@lyra-ds/react/file-upload';
import '@lyra-ds/styles';

export const initialItems = [
  {
    id: 'compatibility-upload',
    name: 'compatibility.pdf',
    size: 2048,
    type: 'application/pdf',
    status: 'uploading',
    attemptId: 'compatibility-attempt-1',
    progress: { kind: 'determinate', value: 48 },
  },
] as const satisfies readonly FileUploadItem[];

interface CompatibilityUploadProps {
  onCancelIntent?: (intent: FileUploadCancelIntent) => void;
}

export function CompatibilityUpload({ onCancelIntent }: CompatibilityUploadProps) {
  const [items, setItems] = useState<readonly FileUploadItem[]>(initialItems);

  return (
    <FileUpload
      items={items}
      onSelect={() => {}}
      onRetry={() => {}}
      onCancel={(intent) => {
        onCancelIntent?.(intent);
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === intent.id && item.status === 'uploading'
              ? { ...item, status: 'canceling' }
              : item,
          ),
        );
      }}
      onRemove={() => {}}
    />
  );
}
