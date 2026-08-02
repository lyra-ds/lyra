'use client';

import { useEffect } from 'react';
import messages from '../messages/en.json';

/** Static-export-safe locale redirect with an accessible no-JS fallback. */
export default function RootRedirect() {
  useEffect(() => {
    const target = navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
    window.location.replace(`/${target}`);
  }, []);

  return (
    <main>
      <a href="/en">{messages.rootFallback}</a>
    </main>
  );
}
