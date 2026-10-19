---
id: MSG-mobile-preview-controls
area: MSG
title: Use notification previews on a narrow touch screen
persona: Mobile teammate
journey: J-read-notification
expected: Both preview messages remain readable and dismissible by touch at320px without horizontal document overflow
entry_points: https://docs.lyra-ds.dev/en/components/toast-provider
qa_status: untested
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence:
last_report:
overlaps:
---

Added before the first touch replay because the docs-local wrap treatment
must also accommodate larger coarse-pointer close controls. No original
mobile failure is claimed; this is a new adjacent layout-risk check.
