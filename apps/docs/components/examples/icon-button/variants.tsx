import { Icon, IconButton } from '@lyra-ds/react';

export function IconButtonVariants() {
  return (
    <>
      <IconButton label="Add project" variant="primary">
        <Icon name="plus" />
      </IconButton>
      <IconButton label="Open settings" variant="secondary">
        <Icon name="settings" />
      </IconButton>
      <IconButton label="Favorite project" variant="soft">
        <Icon name="star" />
      </IconButton>
      <IconButton label="More options" variant="ghost">
        <Icon name="ellipsis" />
      </IconButton>
      <IconButton label="Delete project" variant="danger">
        <Icon name="trash-2" />
      </IconButton>
    </>
  );
}
