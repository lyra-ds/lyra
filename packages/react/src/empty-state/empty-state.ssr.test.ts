import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { EmptyState } from './index';
describe('EmptyState SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(EmptyState, { title: 'No projects' }))).toContain(
      'lyra-empty',
    ));
});
