---
'@lyra-ds/react': minor
'@lyra-ds/alpine': minor
'@lyra-ds/styles': patch
---

Add translatable WorkspaceSwitcher labels and native workspace links in a labelled disclosure, with matching Alpine bindings and link styling.

Migration: the recommended markup is a labelled `role="group"` popover (`aria-labelledby`) with `aria-current="true"` marking the selected workspace and plain buttons or links using `data-id`. Existing Alpine markup keeps working: `aria-selected="true"` (used only when no option has `aria-current`), `role="option"` and `role="listbox"` lookups are deprecated and will be removed in a future major, and button options still never submit an enclosing form.

## Migration

`@lyra-ds/react` changes the WorkspaceSwitcher semantics from `listbox`/`option`/`aria-selected` to a disclosure with buttons or links and `aria-current`; internal ids change from `-listbox` to `-popover`. Consumers that locate items or the panel by `role="option"`, `role="listbox"` or `aria-selected` (tests, CSS, scripts) must switch to `.lyra-wssw__item[data-id]` and `.lyra-wssw__pop`, and read the selected item from `aria-current`. In Alpine the legacy markup is still accepted, but deprecated.
