import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { PageHeader } from './index';

describe('PageHeader SSR', () => {
  it('renders the title as an h1 without throwing', () =>
    expect(renderToString(createElement(PageHeader, { title: 'Projects' }))).toContain(
      '<h1 class="lyra-pageheader__title">Projects</h1>',
    ));
});
