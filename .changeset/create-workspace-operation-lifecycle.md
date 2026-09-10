---
'@lyra-ds/react': minor
---

Replace `CreateWorkspaceDialog`'s plain, void `onCreate` callback with an operation request and explicit result acknowledgement. Migrate handlers from `onCreate={({ name, slug }) => { ... }}` to `onCreate={(request) => { ...; return { operationId: request.operationId, status: 'accepted' }; }}`. Use `request.data` for the copied name and slug, honor `request.signal` to observe cancellation, and acknowledge every operation with a matching `accepted`, `rejected`, or `canceled` result. Accepted results request a controlled dialog close; rejected results keep entered values visible for retry.
