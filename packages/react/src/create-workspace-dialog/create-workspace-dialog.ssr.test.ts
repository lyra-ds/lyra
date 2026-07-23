import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreateWorkspaceDialog } from './index';

describe('CreateWorkspaceDialog — SSR', () => {
  it('is SSR-safe and renders no dialog markup through Dialog’s portal guard', () => {
    const html = renderToString(createElement(CreateWorkspaceDialog, { open: true }));
    expect(html).not.toContain('lyra-dialog');
    expect(html).not.toContain('lyra-wscreate');
  });
});
