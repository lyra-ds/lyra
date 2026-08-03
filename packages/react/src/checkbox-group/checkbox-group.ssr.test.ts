import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CheckboxGroup } from './index';

describe('CheckboxGroup SSR', () => {
  it('renders composed checkboxes without throwing', () => {
    expect(
      renderToString(
        createElement(CheckboxGroup, {
          label: 'Notification channels',
          options: [{ value: 'email', label: 'Email' }],
        }),
      ),
    ).toContain('lyra-choicegroup');
  });
});
