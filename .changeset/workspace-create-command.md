---
'@lyra-ds/react': patch
---

Move actual workspace options into an inner WorkspaceSwitcher listbox and expose Create workspace as a native command beside it. Workspace options retain roving native keyboard navigation while Tab reaches the create command and native forward/backward exits remain available.

Consumers using direct-child selectors such as `.lyra-wssw__pop > button` should target `.lyra-wssw__pop .lyra-wssw__item` to keep matching workspace options and the Create command.
