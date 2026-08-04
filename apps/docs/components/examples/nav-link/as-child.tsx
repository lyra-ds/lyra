'use client';

import { NavLink } from '@lyra-ds/react';

export function NavLinkAsChild() {
  return (
    <NavLink asChild active>
      <a href="/projects">Projects</a>
    </NavLink>
  );
}
