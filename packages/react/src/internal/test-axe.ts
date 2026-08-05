import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Contrast pairs (axe `fgColor/bgColor`, lowercase hex) that are accepted as
 * design decisions after the 2026-08-04 color-contrast sweep. Every pair is
 * borderline (3.5–4.4:1) muted/decorative text; anything NOT in this list —
 * including any new pair produced by a future style change — fails the suite.
 */
const ACCEPTED_CONTRAST_PAIRS = new Set([
  // CalendarView event-time labels on tinted chips (3.5:1 and 4.16:1).
  '#339357/#dcfce7',
  '#615fc2/#e0e1fb',
  // Dark-theme --text-faint (#6C739E) on night surfaces (3.92–4.2:1).
  '#6c739e/#121430',
  '#6c739e/#0e1023',
  '#6c739e/#0b0d1d',
  // Light --text-faint/--text-muted (slate-500) on --surface-sunken (4.34:1).
  '#64748b/#f1f5f9',
  // White label on the indigo-500 accent (4.39:1) — the primary/danger button
  // HOVER fill (dark --accent-hover ramp). Only measured when the runner's
  // pointer happens to rest on the control (headless CI leaves the mouse at
  // 0,0); the rest-state fills were repaired to AA via the parity dark-fill
  // divergences, and the hover ramp keeps the handoff's frozen accent.
  '#ffffff/#6e6ade',
]);

/** Finish entrance animations, run axe, and assert no unaccepted violations. */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  document.getAnimations().forEach((animation) => {
    try {
      animation.finish();
    } catch {
      // Infinite animations cannot finish.
    }
  });

  const results = await axe.run(container as HTMLElement);
  const violations = results.violations.flatMap((violation) => {
    if (violation.id !== 'color-contrast') return violation;

    const nodes = violation.nodes.filter((node) => {
      const data = node.any[0]?.data;
      if (data === null || typeof data !== 'object') return true;

      const { fgColor, bgColor } = data as { fgColor?: unknown; bgColor?: unknown };
      if (typeof fgColor !== 'string' || typeof bgColor !== 'string') return true;

      return !ACCEPTED_CONTRAST_PAIRS.has(`${fgColor.toLowerCase()}/${bgColor.toLowerCase()}`);
    });

    return nodes.length === 0 ? [] : [{ ...violation, nodes }];
  });

  expect(violations).toEqual([]);
}
