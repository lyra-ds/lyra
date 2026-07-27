import { Textarea } from '@lyra-ds/react';

export function TextareaBasic() {
  return (
    <Textarea
      label="Project summary"
      placeholder="Explain what this project is for."
      hint="Visible to everyone in the workspace."
    />
  );
}
