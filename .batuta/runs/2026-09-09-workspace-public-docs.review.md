<<<FINDINGS
apps/docs/content/docs/en/components/workspace-switcher.mdx:43 · low · Accessibility bullet says Enter/Space/ArrowDown/ArrowUp "all open the list onto the selected workspace, falling back to the first option" — with workspaces=[] and onCreate set, openWithFocus targets the create button (workspace-switcher.tsx:79,92-95), so no option is focused; empty-list+create edge is undocumented and the sentence overreaches there. Same text at pt-BR:42.
apps/docs/content/docs/en/components/workspace-switcher.mdx:51 · low · `onChange` bullet is not stack-scoped while its siblings now say "In React"; Alpine consumers get `lyra:change {id}` only (workspace-switcher.ts alpine:243), no onChange/record. Mitigated by the Alpine subsection below, but an Alpine reader hitting the shared bullet first could expect an onChange callback. Same claim at pt-BR:50.
FINDINGS>>>

Controller: accepted both low wording observations; correct empty-workspace fallback and explicitly scope onChange to React. Initial review ended without report due evidence access; report retry completed unchanged, 3/3 DONE. No runtime defect alleged.

## Final bounded wording review
<<<FINDINGS
low: apps/docs/content/docs/pt-BR/components/workspace-switcher.mdx — onChange bullet in "## API e código" ends at "next render." without en's "`onCreate` is a separate callback; activating the create action never fires `onChange`" sentence. Core (id, record) contract intact in pt-BR; asymmetry either pre-existing drift accepted by prior 3/3 review or partial propagation of the fix. Non-blocking; optional pt-BR backfill.
FINDINGS>>>

Controller: optional additional callback sentence declined; the pt-BR page already explains the separate React creation callback in its creation section, and review confirms the corrected callback scope. No false statement or required behavior omitted. Final3/3 DONE unchanged guard, MDX/format PASS.
