import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CodeBlock } from './index';

describe('CodeBlock SSR', () => {
  it('renders without accessing clipboard or window APIs', () =>
    expect(
      renderToString(
        createElement(
          CodeBlock,
          { language: 'tsx', lineNumbers: true, copyLabel: 'Copy', copiedLabel: 'Copied' },
          createElement(
            'code',
            null,
            createElement('span', { className: 'line' }, 'const value = 1;'),
          ),
        ),
      ),
    ).toContain('lyra-code--line-numbers'));

  it('makes its own plain-text code region focusable without highlighter props', () =>
    expect(renderToString(createElement(CodeBlock, null, 'const value = 1;'))).toContain(
      '<pre class="lyra-code__pre" tabindex="0">const value = 1;</pre>',
    ));
});
