# Scout — how `apps/docs` is scaffolded

Read-only research. Do not create, edit, delete or move any file. Do not run
builds, installs or anything that writes to the tree.

## Questions

Answer each one separately and concretely, quoting real file content.

1. **Next.js app setup.** What is in `apps/docs/package.json` (every dependency
   and script, with exact versions) and `apps/docs/next.config.ts`? Which
   settings exist only for the static export, and which only for `next dev`?
2. **Locale routing.** How does the EN / pt-BR split work? Name the files that
   define the locale list, the `generateStaticParams`, the root redirect, and
   the next-intl setup (config file, message files, provider). Where do UI
   strings live, and in what format?
3. **Root layout.** What does `apps/docs/app/layout.tsx` and
   `apps/docs/app/[lang]/layout.tsx` render — fonts, `ThemeProvider`, metadata,
   favicon, the stylesheet imports, and in what order?
4. **Fonts and favicon.** Which `@fontsource` packages are imported and where?
   Is there a build step that generates the favicon, and which file runs it?
5. **`site.css`.** List every selector defined in `apps/docs/app/site.css`,
   grouped by prefix, with the line number each one starts at. Do not judge
   them — just inventory.
6. **Chrome components.** Which components from `@lyra-ds/react` does the docs
   app import to build its own header, footer, theme toggle and locale switcher?
   Give file and import line for each.
7. **Deploy config.** Is there any Cloudflare Pages / Vercel / wrangler config
   anywhere in the repo, and any workspace-level script that builds the docs?

## Starting points

- `apps/docs/` — the whole app.
- `pnpm-workspace.yaml` and the root `package.json` for how workspaces and
  scripts are wired.
- `.github/workflows/` for how the docs are built in CI.

## Boundaries

- Ignore `node_modules`, `.next`, `dist`, `out`, and any generated output.
- Do not read `packages/styles/**` — not part of this question.
- Do not write anything, anywhere.

## Report contract — use these four sections, exactly

## Answer

Short prose answering the seven questions in order.

## Files

`path:line — why it matters`, one per line.

## Evidence

Minimal snippets backing the answer.

## Uncertain

What you could not find or what stayed ambiguous. Mandatory section — if
everything was found, say so explicitly.
