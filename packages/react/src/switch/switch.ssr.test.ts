import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Switch } from './index';

describe('Switch SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Switch, { label: 'Email alerts' }))).toContain(
      'lyra-switch',
    ));
});
