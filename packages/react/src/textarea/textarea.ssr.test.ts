import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Textarea } from './index';

describe('Textarea SSR', () => {
  it('renders a labeled textarea without throwing', () => {
    const html = renderToString(createElement(Textarea, { label: 'Notes', hint: 'Optional' }));
    expect(html).toContain('lyra-input lyra-textarea');
    expect(html).toContain('lyra-field');
  });
});
