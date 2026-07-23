import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FileManager } from './index';

describe('FileManager SSR', () => {
  it('renders server-safely without throwing', () => {
    expect(renderToString(createElement(FileManager))).toContain('lyra-fm');
  });
});
