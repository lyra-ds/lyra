---
id: J-return-from-overlay
name: Return from transient controls
personas: Keyboard navigator
entry_points: https://docs.lyra-ds.dev/en/components/dialog
crosses: public documentation; component previews
---

# Return from transient controls

```mermaid
flowchart TD
  A[Public component page] --> B[Open the documented dialog]
  B --> C[Cancel, close, or follow a documented overlay action]
  C --> D[Visible outcome]
  B --> X[Cancel or leave]
  X --> A
  D --> E[Independent public reread]
```

## Actions

1. Enter the public page and identify its example and controls.
2. Cancel, close, or follow a documented overlay action.
3. Verify the result through a separate visible read, real destination or revisit.

## True end state

Overlay is absent; original control or deliberate destination owns focus and page interaction works.

## Abandonment

Cancel before taking an action, then reopen and close again; a reload restores the public entry.

## Independent reread

Read the visible destination heading and URL after link navigation; for transient
UI, inspect its absence/presence and the actual focused control, then reopen
through the original public entry. No durable server object is created.
