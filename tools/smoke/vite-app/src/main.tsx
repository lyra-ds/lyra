// Vite scratch-app entry for the D-27 packed-tarball smoke test.
//
// Import matrix (deliberate — exercises both exports-map resolution paths, D-13):
//   - Button via the `@lyra-ds/react/button` SUBPATH export
//   - Input + Icon via the `@lyra-ds/react` ROOT BARREL
// Icon is imported and rendered so the production build carries icon.js — that is what
// makes the two JS-asset assertions in smoke.mjs meaningful: the bundled Lucide glyph
// bakes in the `xmlns="http://www.w3.org/2000/svg"` namespace (allowlist positive
// assertion), and the Icon dev-warning literal must be ABSENT (production NODE_ENV
// strip). Dialog is intentionally NOT imported — its `.lyra-dialog-overlay` runtime
// marker must be absent from the JS bundle (tree-shaking / isolation proof).
//
// The full `@lyra-ds/styles` entry is imported: its emitted CSS legitimately contains
// the `.lyra-dialog-overlay` rule (the whole stylesheet ships by design), which is why
// smoke.mjs scopes the Dialog-exclusion scan to *.js assets only.
import { createRoot } from 'react-dom/client';
import { Button } from '@lyra-ds/react/button';
import { Input, Icon } from '@lyra-ds/react';
import '@lyra-ds/styles';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <main>
      <Button variant="primary">Save changes</Button>
      <Input label="Email" />
      <Icon name="check" title="Done" />
    </main>,
  );
}
