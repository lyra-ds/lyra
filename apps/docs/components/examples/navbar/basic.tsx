import { Navbar, NavLink } from '@lyra-ds/react';

export function NavbarBasic() {
  return (
    <Navbar
      brand={<a href="/">Acme</a>}
      nav={
        <>
          <NavLink href="/overview" active>
            Overview
          </NavLink>
          <NavLink href="/projects">Projects</NavLink>
        </>
      }
      navLabel="Main navigation"
      sticky={false}
    />
  );
}
