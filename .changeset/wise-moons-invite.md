---
'@lyra-ds/react': minor
---

Add `asChild` to `Card`, mirroring `Button`. Renders the single child element with the
Lyra card classes instead of a wrapping `<div>`, so a whole card can be one link:
`<Card asChild interactive><a href="…">…</a></Card>`. Only supported for the plain
surface — combining it with `title` or `footer` throws.
