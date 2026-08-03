import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Fieldset, FormRow } from './index';

describe('Fieldset SSR', () => {
  it('renders Fieldset and FormRow without throwing', () => {
    const fieldset = renderToString(
      createElement(Fieldset, { legend: 'Contact details', children: 'Fields' }),
    );
    const formRow = renderToString(createElement(FormRow, { children: 'Fields' }));

    expect(fieldset).toContain('lyra-fieldset');
    expect(formRow).toContain('lyra-formrow');
  });
});
