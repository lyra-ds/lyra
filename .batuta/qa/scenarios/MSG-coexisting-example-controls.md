---
id: MSG-coexisting-example-controls
area: MSG
title: Dismiss notifications from coexisting public examples
persona: Integrating developer
journey: J-read-notification
expected: Both public example notification stacks retain readable messages and reachable close actions when used together
entry_points: https://docs.lyra-ds.dev/en/components/toast-provider
qa_status: fail
bug_ids: BUG-20261019-notification-examples-cover-actions
fix_status: pending
retest_status:
fix_commits:
evidence: evidence/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93/toast-clean-retry-overlap.json
last_report: reports/2026-10-19-functional-46349ec7-1f2a-456b-923b-f7add5041f93.md
overlaps: MSG-coexisting-example-controls; MSG-confirmation-pause-expire; MSG-persistent-reminder-action
---

Derived during CH-readable-notifications exploration; the immutable charter
mission is unchanged. Both public buttons are available on the same page.
