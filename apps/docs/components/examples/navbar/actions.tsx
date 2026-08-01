import { Button, Navbar, NavLink } from '@lyra-ds/react';

export function NavbarActions() {
  return (
    <Navbar
      brand={<a href="/">Acme</a>}
      nav={<NavLink href="/projects">Projects</NavLink>}
      navLabel="Workspace navigation"
      actions={<Button size="sm">New project</Button>}
      sticky={false}
    />
  );
}
