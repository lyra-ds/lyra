import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CompatibilityUpload } from './entry';

describe('packed FileUpload SSR', () => {
  it('renders controlled progress without a DOM', () => {
    const markup = renderToString(<CompatibilityUpload />);

    expect(markup).toContain('compatibility.pdf');
    expect(markup).toContain('value="48"');
    expect(markup).toContain('Cancel compatibility.pdf');
  });
});
