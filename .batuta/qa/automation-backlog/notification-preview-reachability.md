# Reach actions in coexisting notification previews

- Source: J-read-notification; MSG-coexisting-example-controls;
  BUG-20261019-notification-examples-cover-actions; issue 307.
- Why automate: a stable public example journey failed through real pointer
  interception even though component timing and independent-provider tests passed.
- Suggested layer: a future existing docs E2E browser gate, when one is adopted.
- Spec sketch: load the real component page and CSS, activate Publish project
  and Add reminder, independently inspect both named regions, use ordinary
  pointer clicks on each close control, and verify dismissal does not remove
  the other provider's message. Also confirm the existing public Toast invitation stack retains
  fixed placement. A source selector assertion is not proof of reachability.
- Status: proposed. The bounded current visual correction uses retained
  before/after persona replay; it does not introduce another test harness.
