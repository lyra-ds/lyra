# CommandPalette forced-color active state — 2026-09-15

The active command now has a2px CanvasText outline inside its bounds under forced colors. The reproduced Chromium failure changed aria-selected through native ArrowDown while active/idle rows both rendered black onwhite without visible distinction. Final screenshots show the outline following the active row; inactive rows remain outline-free. Background, text, descendant colors and normal-mode appearance are unchanged. Negative2px offset stays inside the clipped panel.

One additive CSS rule, two regression cases in the existing Styles hover/state file, Styles-only changeset. Existing parity registration suffices; no checker, runtime or dependency change.

Controller verification:12source cases per engine,36PASS; originalCSS yields one expected forced-color failure and one normal-modePASS. Parity/stylelint/common suitePASS. Packed React two-option consumer:6/6 engine/media casesPASS, active indication follows native ArrowDown, combobox keepsfocus and aria-activedescendant points toselected option. Actual finite parent animations settle before observation; no synthetickeyboard or programmaticfocus. CSS is shared with Alpine, but this packed interaction observation is specifically React.

Styles archive SHA256 `33db42be29415014c4f645c63bd83236c3eccbb40d8ed4fca66820b5ed35e104`; full extracted files match. React/Alpine archives remain unchanged. Browser media emulation does not establish native OS-high-contrast behavior. No complete V1 qualification, pointer/budget promotion or remote action.

Batuta OpenCode/GLM low +one test-fidelity retry (correct option/listbox roles and real parent-animation wait). Controller formatted the test. Independent Codex/Terra review:3DONE/no findings, filesunchanged. Raw MAIN `.batuta/runs/command-forced-state-20260915/` contains complete brief/retry/diff/checks/review/archive/fixture/proof/screenshots. Baseline selection evidence is retained under `.batuta/runs/forced-controls-20260915/command-selection*`.

Next confirmed issue: long-label/count pill Tabs expand a375pxpage to504px. Originalshortexamples and lineTabs pass; DataTable bounds its own overflow. That repair is separate from this active-state change.
