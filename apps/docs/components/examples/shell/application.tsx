import { Button, Shell, Stack } from '@lyra-ds/react';

export function ShellApplication() {
  return (
    <Shell
      scroll="content"
      style={{ height: '28rem' }}
      sidebar={
        <Stack as="ul" gap={2} style={{ margin: 0, paddingLeft: '1rem' }}>
          <li>
            <a href="/projects">Projects</a>
          </li>
          <li>
            <a href="/settings">Settings</a>
          </li>
        </Stack>
      }
      sidebarAs="nav"
      sidebarLabel="Application navigation"
      topbar={<Button size="sm">Create project</Button>}
    >
      <Stack gap={4}>
        <h2>Projects</h2>
        <p>Choose a project to review its activity and settings.</p>
        <p>Only the main region scrolls; navigation and the top bar stay in place.</p>
      </Stack>
    </Shell>
  );
}
