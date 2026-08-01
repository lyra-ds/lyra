import { TableOfContents } from '@lyra-ds/react';

export function TableOfContentsBasic() {
  return (
    <TableOfContents
      label="Component topics"
      activeId="accessibility"
      items={[
        { id: 'overview', text: 'Overview', level: 2 },
        { id: 'accessibility', text: 'Accessibility', level: 2 },
        { id: 'keyboard', text: 'Keyboard support', level: 3 },
      ]}
    />
  );
}
