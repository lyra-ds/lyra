import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SegmentedControl } from './index';

describe('SegmentedControl SSR', () => {
  it('renders its controlled radiogroup without browser APIs', () =>
    expect(
      renderToString(
        createElement(SegmentedControl, {
          options: [
            { value: 'en', label: 'EN' },
            { value: 'pt', label: 'PT' },
          ],
          value: 'en',
          onChange: () => {},
          label: 'Language',
        }),
      ),
    ).toContain('role="radiogroup"'));
});
