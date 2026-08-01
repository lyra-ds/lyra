'use client';

import { NavLink } from '@lyra-ds/react';

export function NavbarNavLink() {
  return (
    <>
      <NavLink href="/overview" active>
        Overview
      </NavLink>
      <NavLink asChild>
        <a href="/projects">Projects</a>
      </NavLink>
    </>
  );
}
