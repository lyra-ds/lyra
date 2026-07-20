// Root layout imports the full @lyra-ds/styles entry (App Router allows a global CSS
// import in the root layout) — the same install path a real Next consumer uses.
import type { ReactNode } from 'react';
import '@lyra-ds/styles';

export const metadata = {
  title: 'Lyra DS — Next.js scratch-app smoke',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
