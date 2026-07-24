'use client';

import { Input } from '@lyra-ds/react';
import { useState } from 'react';

export function InputBasic() {
  const [email, setEmail] = useState('');

  return (
    <Input
      label="Work email"
      placeholder="you@example.dev"
      hint="We only use it for deploy notifications."
      value={email}
      onChange={(event) => setEmail(event.target.value)}
    />
  );
}
