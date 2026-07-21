import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FileUpload } from './index';

describe('FileUpload SSR', () => {
  it('renders its server-safe dropzone without throwing', () => {
    expect(renderToString(createElement(FileUpload))).toContain('lyra-upload');
  });
});
