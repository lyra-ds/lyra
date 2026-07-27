---
'@lyra-ds/styles': patch
'@lyra-ds/react': patch
---

Stepper wraps instead of overflowing, Tabs clears AA, and Breadcrumb lets you name its landmark

**Stepper** is a flex row whose dots, labels and connectors all refuse to shrink, so an ordinary
three-step flow measures about 453px and pushed the whole document sideways on a 375px phone. It now
wraps. Giving it its own horizontal scroll was tried first and rejected on measurement: with no
focusable content inside, a keyboard user cannot scroll the region, so the last step stayed 176px out
of view with no way to reach it. Wrapping costs height on a narrow screen and changes nothing where
the row already fits.

**Tabs** had two contrast failures. `--text-muted` reads 4.83:1 on a card but only 4.34:1 on
`--surface-sunken`, which is exactly where a pill tab's resting label and every count chip sit; both
move to `--text-secondary`. In dark, an active line tab painted its label in `--accent` on the page
background at 4.09:1, and now uses `--accent-soft-text`, the token the system already keeps for
accent-colored text, which lightens with the brand and so survives white-labelling. The underline
stays `--accent`.

**Breadcrumb** placed its `aria-label="Breadcrumb"` after the spread props, so a consumer-supplied
label was silently discarded — unlike Pagination, its sibling, which has always honored one. It now
does the same: `aria-label` from the consumer wins, and "Breadcrumb" remains the default. Two trails
on one page can finally be told apart by assistive technology, and a localized interface can name the
landmark in its own language.
