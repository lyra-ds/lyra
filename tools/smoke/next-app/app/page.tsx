// SERVER component (no "use client" here) that imports Button/Input/Icon from the
// @lyra-ds/react root barrel and renders them, plus the client-boundary DialogDemo.
//
// PROOF FRAMING (do not overclaim): every dist entry carries the "use client" banner, so
// Next treats these imported Lyra components as CLIENT boundaries. `next build` succeeding
// therefore proves (a) package/exports-map resolution under Next's bundler, (b) the directive
// banner survived into dist and is honored — importing hook-using components from a SERVER
// page compiles without the client-hook-in-server-component error precisely because the
// directive marks them — and (c) the prerendered client-boundary output emits the expected
// markup. This is NOT the direct renderToString proof; that lives in the pilots' ssr vitest
// projects (D-26), which remain the authoritative SSR evidence.
import { Button, Input, Icon } from '@lyra-ds/react';
import { DialogDemo } from './dialog-demo';

export default function Page() {
  return (
    <main>
      <h1>Lyra DS — Next.js scratch-app smoke</h1>
      <Button variant="primary" iconLeft={<Icon name="check" size={16} />}>
        Primary action
      </Button>
      <Input label="Email" />
      <DialogDemo />
    </main>
  );
}
