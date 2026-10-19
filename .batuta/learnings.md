- 2026-10-19: Measure a control's effective hit area before reporting a small
  touch target. Existing pseudo-elements can extend beyond the visible button
  box; await real entry animations and hit-test/tap the perimeter. The toast
  close observation 308 was invalidated this way without a product edit.

- The QA scenario schema lists the canonical owner first in `overlaps`.
  A canonical scenario may therefore name itself before related scenarios;
  do not remove that owner reference based on a hypothetical graph consumer.
