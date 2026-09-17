# BottomSheet docs verification retry — React / medium
You are the implementation worker. Apply this narrow documentation correction directly in the existing worktree; no delegation, orchestration, pnpm/npm/npx/corepack, services or commit. Read only the original docs brief and two page files.

Controller source review found two omissions against criterion2:
1. Both pages describe an accepted close and ignoring invalid resolver results, but never state that an ignored onClose request does not resolve or move focus. Add that explicit controlled-close condition and no repeated restoration on closed-state rerender.
2. The edited accessibility bullet in the pt-BR page is half Portuguese/half English. The user requires all new or updated prose to be English. Translate that entire edited focus/scroll-lock bullet into English while preserving unrelated historical localized bullets.

Scope only apps/docs/content/docs/en/components/bottom-sheet.mdx and apps/docs/content/docs/pt-BR/components/bottom-sheet.mdx. Do not change anything outside this list; if needed stop/report. Original goal/conventions/test laws and boundaries remain. Keep actual examples/snippets unchanged. Do not touch owner-generated outputs (controller already generated them).

Acceptance: both pages explicitly describe ignored close and closed-state rerender semantics, and the edited bullet is entirely English; proof page review + pinned Node Prettier --check. Use /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node /Volumes/Home/francisross/Projects/lyra/lyra/node_modules/prettier/bin/prettier.cjs. Do not add approval flows or unrelated wording changes. Report actual changed paths/check output. Stop if source contradicts the request, same command fails twice, or scope widening is required.
