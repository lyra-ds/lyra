import type { ComponentType } from 'react';
import { DialogPreview } from './dialog';

/**
 * Slug → live preview component. The renderer injects the matching entry as the
 * generic `<Preview />` tag available inside every component MDX file.
 */
export const previews: Record<string, ComponentType> = {
  dialog: DialogPreview,
};
