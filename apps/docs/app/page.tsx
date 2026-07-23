'use client';

import { useEffect } from 'react';

/**
 * Static-export-safe root redirect. There is no server middleware, so locale is
 * detected on the client: `pt*` navigators land on pt-BR, everyone else on the
 * default `en`. Renders a fallback link for no-JS / crawlers.
 */
export default function RootRedirect() {
  useEffect(() => {
    const target = navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
    window.location.replace(`/${target}`);
  }, []);

  return (
    <main style={{ padding: 'var(--space-8) var(--space-6)' }}>
      <a href="/en">Continue to the Lyra DS docs →</a>
    </main>
  );
}
