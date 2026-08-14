import { afterEach } from 'vitest';

afterEach(() => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});
