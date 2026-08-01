import { Container } from '@lyra-ds/react';

export function ContainerNested() {
  return (
    <Container max={720}>
      <p>Outer content uses a 720px measure.</p>
      <Container>
        <p>The nested container inherits that measure unless it sets a new one.</p>
      </Container>
    </Container>
  );
}
