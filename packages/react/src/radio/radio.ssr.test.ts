import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Radio } from './index';

describe('Radio SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Radio, { label: 'Email', name: 'contact' }))).toContain(
      'lyra-radio',
    ));
});
