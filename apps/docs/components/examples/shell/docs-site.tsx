import { Container, Shell, Stack } from '@lyra-ds/react';

export function ShellDocsSite() {
  return (
    <Container>
      <Shell
        sidebar={
          <Stack as="ul" gap={2} style={{ margin: 0, paddingLeft: '1rem' }}>
            <li>
              <a href="/en/components/container">Container</a>
            </li>
            <li>
              <a href="/en/components/shell">Shell</a>
            </li>
          </Stack>
        }
        sidebarAs="nav"
        sidebarLabel="Documentation navigation"
        aside={
          <Stack as="ul" gap={2} style={{ margin: 0, paddingLeft: '1rem' }}>
            <li>
              <a href="#usage-example">When to use</a>
            </li>
            <li>
              <a href="#accessibility-example">Accessibility</a>
            </li>
          </Stack>
        }
        asideAs="nav"
        asideLabel="On this page"
        top={84}
      >
        <article>
          <h2>Container</h2>
          <p id="usage-example">A centered content region with responsive gutters.</p>
          <h2 id="accessibility-example">Accessibility</h2>
          <p>The navigation rails have accessible names.</p>
        </article>
      </Shell>
    </Container>
  );
}
