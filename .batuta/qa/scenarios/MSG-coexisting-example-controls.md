---
id: MSG-coexisting-example-controls
area: MSG
title: Dismiss notifications from coexisting public examples
persona: Integrating developer
journey: J-read-notification
expected: Both public example notification stacks retain readable messages and reachable close actions when used together
entry_points: https://docs.lyra-ds.dev/en/components/toast-provider
qa_status: pass
bug_ids: BUG-20261019-notification-examples-cover-actions
fix_status: fixed
retest_status: pass
fix_commits: 68b2e22ef2ff6edf5ee2eea67e7ac7af75ccfbb0
evidence: evidence/2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180/toast-both-examples-separated.json
last_report: reports/2026-10-19-fixes-5e4ed134-2a4c-4cdd-9b1a-9c06df56a180.md
overlaps: MSG-coexisting-example-controls; MSG-confirmation-pause-expire; MSG-persistent-reminder-action
---

Derived during CH-readable-notifications exploration; the immutable charter
mission is unchanged. Both public buttons are available on the same page.
