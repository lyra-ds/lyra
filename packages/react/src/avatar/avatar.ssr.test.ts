import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Avatar, AvatarGroup } from './index';
describe('Avatar SSR', () => {
  it('renders avatar and group', () => {
    const html = renderToString(
      createElement(AvatarGroup, null, createElement(Avatar, { name: 'Ada Lovelace' })),
    );
    expect(html).toContain('lyra-avatar-group');
  });
});
