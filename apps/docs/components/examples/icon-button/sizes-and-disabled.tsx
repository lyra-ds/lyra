import { Icon, IconButton } from '@lyra-ds/react';

export function IconButtonSizesAndDisabled() {
  return (
    <>
      <IconButton label="Previous page" size="sm">
        <Icon name="arrow-left" />
      </IconButton>
      <IconButton label="Next page" size="md">
        <Icon name="arrow-right" />
      </IconButton>
      <IconButton label="Open in a new tab" size="lg">
        <Icon name="external-link" />
      </IconButton>
      <IconButton label="Delete project" disabled>
        <Icon name="trash-2" />
      </IconButton>
    </>
  );
}
