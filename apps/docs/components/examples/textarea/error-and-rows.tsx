import { Textarea } from '@lyra-ds/react';

export function TextareaErrorAndRows() {
  return (
    <>
      <Textarea
        label="Release notes"
        defaultValue="A short note"
        error="Add enough detail for people who were not in the meeting."
        rows={5}
      />
      <Textarea label="Archived note" defaultValue="This record is locked." disabled rows={3} />
    </>
  );
}
