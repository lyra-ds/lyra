.changeset/workspace-create-command.md:1 · low · design Structure section requires documenting that consumers using direct-child DOM selectors (e.g. `.lyra-wssw__pop > button`) must target the unchanged `.lyra-wssw__item`; changeset omits this note, so such consumers silently lose workspace options/Create after upgrade.
packages/react/src/workspace-switcher/workspace-switcher.tsx:1 · medium · measured bundle 8326B exceeds unchanged 8250B budget by 76B (11th standalone overage); size gate FAILED, no waiver applied, Task10 owns packed resolution.

Controller dispositions: accept the missing direct-child selector migration note; Create itself remains a direct child, so only the workspace-option portion moves, but a descendant .lyra-wssw__item selector preserves both. Critical/controller documentation-only completion follows after the exhausted high retry. Accept measured size overage as explicit Task10 release work, not a scoped waiver. First review3/3 DONE, unchanged guard; documentation rereview pending.

Documentation follow-up findings, verbatim:
none

Final GLM3/3 DONE and unchanged guard. The critical/controller changeset-only correction accurately explains the direct-child selector migration; runtime/browser/SSR hashes unchanged and formatter PASS. Public-page correction follows immediately as Task23.
