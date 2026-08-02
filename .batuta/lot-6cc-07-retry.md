# Lot 7 — retry

The lot is right almost everywhere, and I verified it against the built docs export served with
`_headers` applied: the banner appears once and stays away after a choice, storage holds only
`lyra-docs-*` keys, `document.cookie` is empty, no third-party origin is contacted on any route,
`axe.run` is clean with the banner visible and after dismissal, the consent key is declared
exactly once, the policy link resolves to `https://lyra-ds.dev/en/privacy`, and — the one I was
most worried about — **`frame-src 'self'` works: the isolated preview iframe still renders.**

**Two defects.**

## 1. `style-src 'self'` blocks the docs' inline styles

Every route logs this, on all four I tested:

```
Applying inline style violates the following Content Security Policy directive: "style-src 'self'".
```

`apps/site` has **zero** inline styles, so its policy never exercised this. `apps/docs` has
legitimate ones, and they are legitimate precisely because the project's conventions allow the
single case they use: **passing a custom property value**.

- `app/[lang]/layout.tsx` sets `--prose-scroll-offset` on the prose wrapper.
- `components/example-view.tsx` sets the iframe's height from a `ResizeObserver`, and the
  preview's scale — both dynamic numbers that cannot be a static class.

Fix: `style-src 'self' 'unsafe-inline'`.

This is the same shape as the `img-src` defect in lot 6: a policy that was correct for the app
it was written in, copied into an app whose needs differ. Note in `apps/docs/DEPLOY.md` **why**
this app needs it and the site does not, so nobody "hardens" it back later and blanks the
previews and the prose offset.

No external origin is being added. The no-third-party guarantee is untouched.

## 2. `_headers` carries a stanza for a file that does not exist

The file ends with:

```
/opengraph-image
  Content-Type: image/png
```

That route exists in `apps/site`, which generates an OG image. **`apps/docs` does not have
one.** It was copied along with the rest. Remove it — a rule for a path that never resolves is
noise that reads like a promise.

If you think the docs _should_ have an OG image, that is a real idea and a separate lot; say so
in your report instead of building it here.

## Re-verify the way I did

Serve `apps/docs/out` with `_headers` actually applied — not a plain static server — and confirm
zero CSP violations on at least these four routes:

- `/en`
- `/en/components/button`
- `/en/guides/getting-started`
- `/en/components/shell` — and confirm its **preview iframe still renders content**, because
  that is what a wrong `frame-src` would silently break.

## Acceptance

1. Zero CSP violations on those four routes, served with the policy applied.
2. The `shell` page's preview iframe still renders non-empty content.
3. `_headers` has no `/opengraph-image` stanza, still allows no external origin, and keeps
   `frame-src 'self'` and `img-src 'self' data:`.
4. `DEPLOY.md` explains why this app needs `'unsafe-inline'` in `style-src`.
5. `pnpm run lint`, `run typecheck` and the docs build pass; report output.

## Do not change

The banner copy, the consent reader, the shared policy edits, the deploy-order note, or
anything under `packages/`, `apps/site` beyond what is already there.

Do not commit, branch or push.
