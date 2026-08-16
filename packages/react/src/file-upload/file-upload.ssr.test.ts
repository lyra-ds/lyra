import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FileUpload } from './index';

describe('FileUpload SSR', () => {
  it('renders its server-safe dropzone without throwing', () => {
    const html = renderToString(
      createElement(FileUpload, {
        items: [
          {
            id: 'uploading',
            name: 'uploading.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'uploading',
            attemptId: 'uploading-1',
            progress: { kind: 'determinate', value: 48 },
          },
        ],
        onSelect: () => {},
        onRetry: () => {},
        onCancel: () => {},
        onRemove: () => {},
      }),
    );

    expect(html).toContain('<label');
    expect(html).toContain('type="file"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-state="active"');
    expect(html).toContain('<progress');
  });
});
