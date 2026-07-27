'use client';

import { Button } from '@lyra-ds/react';

// `asChild` styles the child element instead of rendering a <button>, so a link
// stays a link — real href, middle-click, "open in new tab" — with button looks.
export function ButtonAsLink() {
  return (
    <>
      <Button asChild>
        <a href="https://github.com/lyra-ds">View on GitHub</a>
      </Button>
      <Button asChild variant="ghost">
        <a href="/en/components">Browse components</a>
      </Button>
    </>
  );
}
