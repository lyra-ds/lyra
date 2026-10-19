---
id: MSG-mobile-preview-controls
area: MSG
title: Use notification previews on a narrow touch screen
persona: Mobile teammate
journey: J-read-notification
expected: Both preview messages remain readable and dismissible by touch at 320px without horizontal document overflow
entry_points: https://docs.lyra-ds.dev/en/components/toast-provider
qa_status: pass
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence: evidence/2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180/toast-real-hit-area-candidate.json
last_report: reports/2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180.md
overlaps:
---

Added before the first touch replay because the docs-local wrap treatment
must also accommodate larger coarse-pointer close controls. No original
mobile failure is claimed; this is a new adjacent layout-risk check.

Historical measurement finding [BUG-20261019-notification-close-touch-target](../bugs/BUG-20261019-notification-close-touch-target.md)
was invalidated by effective-area hit testing. Its visible glyph box is not the
whole target. No product repair or deferred task is associated with that record.
