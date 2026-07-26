'use client';

import { Card } from '@lyra-ds/react';
import Link from 'next/link';
import type { ComponentEntry } from '@/lib/components';

/**
 * The component index's card grid, as a client component.
 *
 * `Card asChild` clones its single child, and a child handed to it from a Server Component arrives
 * serialized rather than as the plain element `Children.only` expects — so the page threw
 * "React.Children.only expected to receive a single React element child" the moment it rendered on
 * the client. It survived `next build`, which prerendered it on the server, and only broke on
 * client-side navigation. Keeping the Card and its Link in one client component is the fix, the
 * same reason `hero-actions.tsx` and the Tooltip examples are client components.
 */
export function ComponentIndexGrid({ entries, lang }: { entries: ComponentEntry[]; lang: string }) {
  return (
    <ul className="lw-index__grid">
      {entries.map((entry) => (
        <li key={entry.slug}>
          <Card asChild interactive>
            <Link className="lw-index__card" href={`/${lang}/components/${entry.slug}`}>
              {entry.name}
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}
