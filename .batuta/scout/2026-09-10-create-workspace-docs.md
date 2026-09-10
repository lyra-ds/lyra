# CreateWorkspaceDialog public documentation scout

GLM5.3Flash67.53s, exit0, unchanged main snapshot; frozen current pages/examples supplied inline.

<<<REPORT

## Answer

Editing scope = the two MDX pages only. No `.tsx` edits, no new Example, no registry/frontmatter change.

**Must update (both locales, new prose in English even in pt-BR):**
1. `custom-copy` Example caption (en 18-21, pt 18-21): only stale contract claim — "`onCreate` still receives the trimmed name and URL-safe slug". Replace with request envelope `{operationId, data:{name,slug}, signal}` + result `accepted | rejected(error) | canceled`, sync or Promise.
2. Accessibility trim bullet (en/pt 42-43): "Submission trims the name before it reaches `onCreate`" → trim now lands in `request.data.name`.
3. Accessibility close/reset bullet (en/pt 46-47): add lifecycle — controlled `onClose` requests closure only after handler returns `accepted` or an acknowledged `canceled`; parent-forced close invalidates the in-flight request; `rejected(error)` keeps dialog open, values preserved for retry; missing/undefined/error-throwing handler rejects submission. Reset-on-open bullet itself stays true.

**Stale synchronous void examples: none.** Both live examples already take `CreateWorkspaceRequest` and return `{operationId, status:'accepted'}` — contract-shaped, and both already append real local records, so no new live example. Void contract survives only in MDX prose and the generated StackApi table (not in these pages).

**Preserve:**
- Frontmatter en/pt 1-4 (route, title, description).
- `<Example id="basic">` / `<Example id="custom-copy">` refs — registry keys unchanged, examples untouched.
- `basic` caption (en/pt 13-16) slug-follows-name claim — still valid.
- Full "When to use" section incl. WorkspaceSwitcher `onCreate` cross-ref (en/pt 23-34).
- slugify bullet (en/pt 44-45).
- StackTabs structure + `stack="html"` (Alpine/non-React) panel with full HTML snippet and "closing behavior are yours to implement" prose (en 56-99, pt 56-95) — carries unsupported-Alpine status.
- Imports: MDX pages declare none (registry components); example imports (`CreateWorkspaceRequest`) already correct.

## Files (path:line)

- apps/docs/content/docs/en/components/create-workspace-dialog.mdx:18-21 — edit caption
- apps/docs/content/docs/en/components/create-workspace-dialog.mdx:42-47 — edit two bullets
- apps/docs/content/docs/pt-BR/components/create-workspace-dialog.mdx:18-21 — edit caption (English prose)
- apps/docs/content/docs/pt-BR/components/create-workspace-dialog.mdx:42-47 — edit two bullets (English prose)
- apps/docs/content/docs/en/components/create-workspace-dialog.mdx:1-4,13-16,23-34,44-45,51-58,60-97 — preserve
- apps/docs/content/docs/pt-BR/components/create-workspace-dialog.mdx:1-4,13-16,23-34,44-45,51-58,60-95 — preserve
- apps/docs/components/examples/create-workspace-dialog/basic.tsx:13-16 — no edit (already request/result)
- apps/docs/components/examples/create-workspace-dialog/custom-copy.tsx:13-16 — no edit (already request/result)

## Evidence

- en:20-21 "They do not change what is submitted: `onCreate` still receives the trimmed name and URL-safe slug." / pt:20-21 "`onCreate` continua recebendo o nome aparado e o slug seguro para URL."
- en:42-43 "Create is disabled until `name` has non-whitespace content. Submission trims the name before it reaches `onCreate`."
- en:46-47 "Every closed-to-open transition resets the name, slug and 'touched' state. Provide `onClose` and change `open` in response so Escape, the close button and Cancel can actually dismiss the dialog."
- basic.tsx:13-15 `const createWorkspace = (request: CreateWorkspaceRequest) => { setWorkspaces(...request.operationId, ...request.data...); return { operationId: request.operationId, status: 'accepted' as const }; }`
- basic.tsx:14 `{ id: request.operationId, ...request.data }`
- en:57-58 "the name-to-slug rule, reset behavior, focus and closing behavior are yours to implement" (html panel)
- en:51-53 `<StackTabs><StackPanel stack="react"><StackApi stack="react" />` — generated API reference, structure preserved

## Uncertain

- StackApi table content generated from component source, not visible in frozen pages — cannot confirm whether it already shows request/result types or still a void signature; may need source-side doc update outside these two pages.
- No literal "Alpine" string in these pages; assumed `stack="html"` panel is the unsupported-Alpine surface meant for preservation.
- Docs validator scripts not visible in frozen material; hooks inferred from page structure only: Example `id` ↔ `apps/docs/components/examples/create-workspace-dialog/<id>.tsx` registry mapping, `stack` values (`react`/`html`), frontmatter keys, en/pt-BR structural parity (same Example ids/headings), examples type-checking against `@lyra-ds/react` in docs build.
- Exact placement of forced-close/invalidation/retry prose (extend reset bullet vs adjacent new bullet vs short block after Examples) — chose existing Accessibility bullets as smallest scope; a dedicated lifecycle section would add a heading.
- pt-BR policy assumption: applied "English prose in both locales" as instructed; did not verify a locale-parity validator permits mixed language.
- Whether `signal` (abort on forced close) warrants one clause in the caption/bullets or none — included minimally; no live example demonstrates it per "no new live example".

REPORT>>>

Controller clarification: the disabled-until-name claim is also stale: valid native submission now performs visible validation, and duplicate controls disable only while pending. Generated API has already been regenerated and typechecked by Task26. HTML is static composition, not evidence of an Alpine implementation; preserve the complete HTML panel byte-for-byte. Idle close can request closure directly; acknowledgment is required only for the pending close handshake. Verify anchors against supplied current pages before briefing.
