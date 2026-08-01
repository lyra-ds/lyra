import { Footer } from '@lyra-ds/react';

export function FooterLinks() {
  return (
    <Footer
      note="© 2026 Acme"
      links={
        <>
          <a href="/status">Status</a>
          <a href="/privacy">Privacy</a>
        </>
      }
      linksLabel="Resources"
    />
  );
}
