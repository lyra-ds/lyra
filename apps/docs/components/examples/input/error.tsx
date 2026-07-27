import { Input } from '@lyra-ds/react';

// `error` replaces `hint`, paints the error styling and sets aria-invalid — so the
// message reaches assistive tech instead of being colour-only feedback.
export function InputError() {
  return (
    <>
      <Input label="Workspace slug" defaultValue="my workspace" error="Use lowercase and dashes." />
      <Input label="Disabled" placeholder="Not editable" disabled />
    </>
  );
}
