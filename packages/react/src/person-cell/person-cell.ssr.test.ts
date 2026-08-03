import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PersonCell } from './index';

describe('PersonCell — SSR', () => {
  it('renders Avatar and person details without throwing', () => {
    const html = renderToString(
      createElement(PersonCell, { name: 'Ada Lovelace', detail: 'ada@example.com' }),
    );
    expect(html).toContain('lyra-personcell');
    expect(html).toContain('lyra-avatar');
  });
});
