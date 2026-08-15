import axe from 'axe-core';
import { expect } from 'vitest';

/** Finish entrance animations, run axe, and assert no violations. */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  document.getAnimations().forEach((animation) => {
    try {
      animation.finish();
    } catch {
      // Infinite animations cannot finish.
    }
  });

  const results = await axe.run(container as HTMLElement);
  expect(results.violations).toEqual([]);
}
