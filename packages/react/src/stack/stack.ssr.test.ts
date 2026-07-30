import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Inline, Stack } from './index';

describe('Stack SSR', () => {
  it('renders Stack and Inline without throwing', () => {
    expect(renderToString(createElement(Stack, null, 'Content'))).toContain('lyra-stack');
    expect(renderToString(createElement(Inline, null, 'Content'))).toContain('lyra-stack');
  });
});
