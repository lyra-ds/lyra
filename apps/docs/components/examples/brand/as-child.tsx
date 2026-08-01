'use client';

import { Brand } from '@lyra-ds/react';

export function BrandAsChild() {
  return (
    <Brand asChild mark="/lyra-mark.svg" markDark="/lyra-mark-light.svg">
      <a href="/en/components">Lyra components</a>
    </Brand>
  );
}
