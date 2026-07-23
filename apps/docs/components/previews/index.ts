import type { ComponentType } from 'react';
import { BadgePreview } from './badge';
import { ButtonPreview } from './button';
import { DialogPreview } from './dialog';
import { InputPreview } from './input';

/**
 * Slug → live preview component. The renderer injects the matching entry as the
 * generic `<Preview />` tag available inside every component MDX file.
 */
export const previews: Record<string, ComponentType> = {
  badge: BadgePreview,
  button: ButtonPreview,
  dialog: DialogPreview,
  input: InputPreview,
};
