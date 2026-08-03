import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RadioGroup } from './index';

describe('RadioGroup SSR', () => {
  it('renders composed radios without throwing', () => {
    expect(
      renderToString(
        createElement(RadioGroup, {
          label: 'Contact preference',
          options: [{ value: 'email', label: 'Email' }],
        }),
      ),
    ).toContain('lyra-choicegroup');
  });
});
