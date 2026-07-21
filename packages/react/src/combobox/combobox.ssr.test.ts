import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Combobox } from './index';

describe('Combobox — SSR', () => {
  it('renders the field and open listbox without accessing browser globals', () => {
    const html = renderToString(
      createElement(Combobox, { label: 'Country', options: [{ value: 'br', label: 'Brazil' }], defaultOpen: true }),
    );
    expect(html).toContain('lyra-combobox');
    expect(html).toContain('role="listbox"');
  });
});
