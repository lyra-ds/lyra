---
'@lyra-ds/react': minor
'@lyra-ds/styles': patch
---

CommandPalette's dialog is named in English and can be translated; SidebarGroup's label clears AA

**CommandPalette** named its modal dialog with a hard-coded Portuguese string, in a system whose
public labels are otherwise English ("Search commands", "Previous page", "View mode"). That name is
what a screen reader announces the moment the palette opens, so the one place the language leak was
guaranteed to be heard. It is now `"Command palette"`, and a new optional `aria-label` prop overrides
it — the same courtesy Pagination and Breadcrumb already extend — so a localized interface can
announce the palette in its own language. Inline mode is not a dialog and stays unnamed.

**SidebarGroup**'s section label was `--text-faint`: 2.45:1, the worst text ratio in the system, on
the word that tells a person what a group of navigation items has in common. It takes
`--text-secondary`, matching the repair already applied to the table, file-list and tab headings. Its
hover moved with it, from `--text-muted` to `--text-primary`: the handoff brightened faint → muted,
and leaving that alone would have made hover *less* prominent than rest in both themes.
