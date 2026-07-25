import { Icon } from '@lyra-ds/react';

export function IconSizeAndLabel() {
  return (
    <>
      <Icon name="star" size={16} />
      <Icon name="star" size={20} />
      <Icon name="star" size={24} title="Featured project" />
    </>
  );
}
