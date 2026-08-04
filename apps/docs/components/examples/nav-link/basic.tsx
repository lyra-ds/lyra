import { NavLink } from '@lyra-ds/react';

export function NavLinkBasic() {
  return (
    <>
      <NavLink href="/overview" active>
        Overview
      </NavLink>
      <NavLink href="/projects">Projects</NavLink>
    </>
  );
}
