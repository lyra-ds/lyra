---
'@lyra-ds/styles': patch
---

Table column headings clear WCAG AA

`.lyra-table th` painted `--text-muted` on the `--surface-sunken` header band: 4.34:1, under AA's
4.5:1. It takes `--text-secondary`, the same repair already applied to the file list's headings and
to Tabs, so the three heading treatments in the system now agree.

Headings are what a person reads to know what a column means, and at 12px uppercase they are the
smallest text the table has — the ratio matters more here than anywhere else in the component.
