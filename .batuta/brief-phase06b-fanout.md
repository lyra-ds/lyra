# Task brief — Phase 6b fan-out: component documentation pages

You are writing bilingual documentation pages for `@lyra-ds` components in the
docs app at `apps/docs`. Four pages already exist and are the **gabarito** (the
reference template). Your job is to produce more pages that match them exactly in
structure and quality. You have NO access to the conversation that produced this
brief; every fact you need is below or in the cited files.

## Read these first (in order)

1. `apps/docs/content/docs/en/components/button.mdx` and its pt-BR twin — the most
   complete gabarito page. Copy its section order and its voice.
2. `apps/docs/content/docs/en/components/input.mdx` + pt-BR — shows a stateful
   component and an "in a form" example.
3. `apps/docs/components/examples/index.ts` — the example registry and **the rules
   that govern example files**. Read the doc comment in full.
4. `apps/docs/components/examples/button/*.tsx` and `input/*.tsx` — the shape of an
   example file.
5. `apps/docs/lib/components.ts` — the manifest you append to.

## Per component, deliver exactly this

For each component in your lot:

1. **Example files** — 2 to 4, at `apps/docs/components/examples/<slug>/<id>.tsx`.
   One exported function per file, named `<Component><Thing>` (e.g. `TabsBasic`).
2. **Registry entries** in `apps/docs/components/examples/index.ts` — the key MUST
   equal the file name (the page reads `<id>.tsx` from disk to print the source).
3. **Manifest entry** in `apps/docs/lib/components.ts` — `{ slug, name, group }`.
   `name` MUST match the entry in `tools/docgen/output/props.json` exactly, or the
   prop table renders "No generated props found".
4. **Two MDX pages** — `apps/docs/content/docs/{en,pt-BR}/components/<slug>.mdx`,
   with this section order and nothing else:

   ````
   ---
   title: <Name>
   description: <one line, ~90 chars>
   ---

   # <Name>

   <One short paragraph: what it is and the one decision the reader must make.>

   ## Examples            (pt-BR: ## Exemplos)
   <Example id="…" title="…">One or two sentences of guidance.</Example>
   … 2 to 4 of them …

   ## When to use         (pt-BR: ## Quando usar)
   <One paragraph, then a bullet list of "reach for something else when" with the
   specific sibling component named.>

   ## Accessibility       (pt-BR: ## Acessibilidade)
   <Bullets: roles/ARIA actually emitted, keyboard model, focus behavior, and any
   requirement that falls on the consumer.>

   ## Props
   <PropTable name="<Name>" />

   ## Plain HTML          (pt-BR: ## HTML puro)
   <A fenced ```html block composing the real .lyra-* classes.>
   ````

## Rules that are NOT negotiable

- **Example files are consumer code.** No `.lw-*` classes, no `next-intl`, no `@/`
  imports, no docs-only helpers. Whatever the code panel prints must run when
  pasted into a React app that has `@lyra-ds/react` + `@lyra-ds/styles` installed.
- **Layout comes from the example stage** (a flex row with gaps), so most examples
  return bare components in a fragment. If an example genuinely needs its own
  arrangement (a form, a grid), use an inline `style` — that is what a consumer
  would write, and it stays copy-pasteable.
- **`'use client'` is required** when the example holds state/handlers OR uses
  `asChild` OR uses `Tooltip`. All three clone the child element, and a child that
  crosses the RSC boundary arrives serialized: `asChild` throws `Children.only`, and
  `Tooltip` silently loses its `aria-describedby` from the server HTML (React reports a
  hydration mismatch and does not patch attribute mismatches, so it never applies).
  `next build` catches neither: the `asChild` case 500s only in `next dev`, and the
  `Tooltip` case fails silently in both.
- **Never invent an API.** Every prop you use must exist in the component's entry in
  `tools/docgen/output/props.json`. Read it before writing.
- **Never invent a CSS class.** Before writing the Plain HTML block, verify every
  class with `grep -rn '\.lyra-<name>' packages/styles`. A class that does not exist
  there is a documentation bug that ships.
- **Do not touch `packages/`.** No component changes, no CSS. If a component seems to
  be missing something, write it in your final report instead of fixing it.
- English is the source; pt-BR is a real translation, not a gloss. Keep code, prop
  names and class names identical across both.

## Voice

Explain the decision, not the obvious. "Variant is about intent, not decoration.
One `primary` per view" is useful; "Use the variant prop to set the variant" is
noise. Prefer a concrete consequence ("an error that appears while someone is still
typing their first character is noise") over an adjective. No marketing language, no
"simply"/"just". Sentences under ~110 characters where the gabarito wraps at 100.

## Verify before you report done

Run from the repo root and paste the real output in your report:

```
pnpm typecheck
pnpm lint            # prettier --check; run `pnpm exec prettier --write <files>` first
pnpm build
```

`pnpm build` passing is necessary but NOT sufficient — it prerenders broken examples
without failing. State explicitly in your report which components you could not
verify visually, so the reviewer opens them.

## Report

List, per component: the example ids you created, the props.json name you used, and
any prop or class you expected to exist but did not find.
