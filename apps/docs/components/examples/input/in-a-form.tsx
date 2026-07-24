'use client';

import { Button, Input } from '@lyra-ds/react';
import { useState, type FormEvent } from 'react';

export function InputInAForm() {
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Validate on submit, not on every keystroke: an error that appears while
    // someone is still typing their first character is noise, not help.
    setError(/^[a-z0-9-]+$/.test(slug) ? undefined : 'Use lowercase letters, numbers and dashes.');
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ display: 'grid', gap: '1rem', width: '20rem' }}
    >
      <Input
        label="Workspace slug"
        name="slug"
        placeholder="acme-team"
        hint="Lowercase letters, numbers and dashes."
        autoComplete="off"
        required
        value={slug}
        error={error}
        onChange={(event) => {
          setSlug(event.target.value);
          if (error) setError(undefined);
        }}
      />
      <Button type="submit">Create workspace</Button>
    </form>
  );
}
