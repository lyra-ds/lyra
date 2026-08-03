import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Separator } from './index';

describe('Separator SSR', () => {
  it('renders every semantic variant without throwing', () => {
    expect(renderToString(createElement(Separator))).toContain('<hr');
    expect(renderToString(createElement(Separator, { orientation: 'vertical' }))).toContain(
      'lyra-separator--vertical',
    );
    expect(renderToString(createElement(Separator, { label: 'or' }))).toContain(
      'lyra-separator--label',
    );
  });
});
