import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Container } from './index';

describe('Container SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Container, { max: 960 }, 'Content'))).toContain(
      '--container-max:960px',
    ));

  it('maps keywords to pixel widths and drops invalid values', () => {
    expect(renderToString(createElement(Container, { max: 'sm' }, 'C'))).toContain(
      '--container-max:640px',
    );
    expect(renderToString(createElement(Container, { max: '480' }, 'C'))).toContain(
      '--container-max:480px',
    );
    const invalid = renderToString(createElement(Container, { max: 'huge' }, 'C'));
    expect(invalid).not.toContain('--container-max');
    expect(invalid).not.toContain('px');
  });
});
