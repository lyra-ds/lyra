# Sidebar expansion focus — issue 306

The published rail can replace a focused link while expanding. BODY is not a
valid successful result. Reuse the existing visible, enabled controlling
trigger as the focus destination before either accepted desktop toggle when
focus is inside its navigation. Main-content focus stays in place. Dialog-owned
offcanvas navigation retains its modal focus ownership. No new API is needed.

This is a compatible accessibility repair, not an attempt to preserve every
child DOM identity. Current hotkey eligibility, editable-field exclusion,
preventDefault, multiple-owner arbitration, routing, controlled callbacks,
optional defaults, and disabled/hidden/inert guards remain intact.

Acceptance: a focused rail item expands to the eligible controlling trigger
for composed links and data items with and without railTooltips; the reverse
collapse and main-content case remain correct. Browser regression must fail
against the unfixed helper and pass with the repair. Update the existing focus
paragraph in both component locales. Add a React patch changeset; do not bump
versions or publish.

Fix governor: narrow (one helper, its focused tests, two locale paragraphs and
one changeset); understood (demo Tooltip/span remount plus shared collapse-only
focus guard); contained (sidebar controls and modal neighbor tests runnable);
unambiguous (the registered expected result explicitly permits the eligible
trigger, using the existing collapse policy in both directions). All pass.
