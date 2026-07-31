import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Container } from './index';

describe('Container SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Container, { max: 960 }, 'Content'))).toContain(
      '--container-max:960px',
    ));
});
