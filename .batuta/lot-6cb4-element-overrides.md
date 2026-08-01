# Lote — `PageHeader` e `Shell`: escolha do elemento

Sits on top of `.batuta/brief-6cb2-chrome.md` — the project rules, conventions, gates,
evidence contract and test laws in it apply unchanged. Ignore its "What 6c-b2 is" section.

## Goal

Two components hardcode an element that only one instance per page may own, which makes them
unusable in perfectly ordinary situations. Give each a prop to choose, defaulting to today's
behavior so nothing changes for existing consumers.

## The two findings, and why they are real

### `PageHeader` always renders `<h1>`

`packages/react/src/page-header/page-header.tsx` puts `title` in an `<h1>`, always. A page has
one `<h1>`. So `PageHeader` can only ever be the page's top heading, and a consumer who wants
the same composition — eyebrow, title, description, actions row — for a **section** cannot use
it. They copy the classes instead, which is exactly the duplication the component exists to
prevent.

This is not a documentation problem. It was found while documenting, but it bites any consumer
building a page with more than one titled region.

### `Shell` always renders `<main>`

`packages/react/src/shell/shell.tsx` wraps children in `<main>`. The HTML spec forbids `<main>`
inside another `<main>`, so a `Shell` can never be nested or embedded — in a documentation
preview, in a split view, in an app that already owns its `<main>`. Today that produces invalid
markup with no way out.

## The API — implement exactly this

Follow the convention `Shell` already set with `sidebarAs` and `asideAs`: the slot's name plus
`As`, taking element names, defaulting to the semantic choice.

```tsx
<PageHeader titleAs="h2" title="Billing" />      // default: "h1"
<Shell mainAs="div">…</Shell>                    // default: "main"
```

- `PageHeader` — `titleAs?: 'h1' | 'h2' | 'h3'`, default `'h1'`.
- `Shell` — `mainAs?: 'main' | 'div'`, default `'main'`.

Both are **additive and non-breaking**: omitting them must produce byte-identical output to
today. Keep the unions closed — an open `keyof JSX.IntrinsicElements` would let a consumer
render the title as a `<button>`, and the point is to pick among defensible semantics, not to
allow anything.

Redeclare both props in the interface with JSDoc, saying what to choose and when. A prop that
exists but is not in the interface does not appear in the generated table, and this whole lot
exists because a contract was invisible.

## Do not change the CSS

The appearance is attached to `.lyra-pageheader__title` and `.lyra-shell__main`, not to the
tag. Changing the element must not change a single rule — verify that `pnpm parity` passes
untouched and that no class name moves.

## Follow through in the docs

The generated prop table will pick both props up automatically. That is not enough: add a
sentence of guidance where it belongs, in **both locales**, on the pages that shipped in the
docs branch this work is based on:

- `content/docs/{en,pt-BR}/components/page-header.mdx` — when a section header is the right
  call, and why the default stays `h1`.
- `content/docs/{en,pt-BR}/components/shell.mdx` — when a nested or embedded shell needs
  `mainAs="div"`, and that a page must still have exactly one `<main>` somewhere.

Do not restructure those pages; add to them.

## Acceptance criteria

1. Both props exist with the exact names, unions and defaults above, declared in the
   interfaces with JSDoc.
2. **Omitting them produces identical output to today.** Prove it — a test asserting the
   default element for each, plus a note in your report on how you checked nothing else moved.
3. Each override renders the chosen element and keeps every class, ARIA attribute and child
   behavior unchanged. Browser tests for both, using `await expect.element(...)`.
4. A `Shell` with `mainAs="div"` emits **no** `main` landmark; a `PageHeader` with
   `titleAs="h2"` emits an `h2` and no `h1`. Assert the absence, not only the presence.
5. Prove the tests are not vacuous: revert each default in turn, watch the corresponding test
   fail, restore, watch it pass. Report all outputs.
6. `pnpm parity` passes with **no** change to `tools/parity/baseline.json` and no CSS edit.
7. `node tools/docgen/generate.mjs --check` passes with the regenerated output; both props
   appear in `tools/docgen/output/props.json`.
8. The four MDX files carry the guidance, in the voice of the surrounding pages.
9. `size-limit` passes; report the delta for `page-header` and `shell`.
10. A changeset exists, **minor** for `@lyra-ds/react`, written for a consumer: what they can
    now build that they could not before.
11. All four CI jobs' commands run, with real output reported and anything unrunnable named.

## Boundaries

- Only these two components. Do not touch `Navbar` or `Footer` — they render `<header>` and
  `<footer>`, which a page may legitimately have more than one of; there is no bug there.
- No CSS changes anywhere.
- Do not touch `ExampleView` or the isolated preview machinery. The docs keep isolating those
  examples: isolation also gives them theme and layout width, which these props do not.
- Do not commit, branch or push.
