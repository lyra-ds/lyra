# Lote 6c-d — favicon theme-aware (2 arquivos)

## Goal

Replace the content of the two favicon SVGs so the favicon follows the device
color scheme: Lyra star mark, indigo on light scheme, light indigo on dark
scheme, via a `@media (prefers-color-scheme: dark)` rule embedded in the SVG.

## Context

- `apps/docs/public/favicon.svg` and `apps/site/public/favicon.svg` — today an
  indigo rounded tile + white star. Both layouts already reference
  `/favicon.svg`; no TSX change is needed.
- The target geometry/colors mirror the existing brand marks
  `public/lyra-mark.svg` (light scheme) and `public/lyra-mark-light.svg`
  (dark scheme) that both apps already ship.

## Task (exact content)

Write EXACTLY this content into BOTH files, byte-identical, WITH a trailing
newline at the end of file:

```svg
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <style>
    .lyra-favicon-star { fill: #5B5BD6; }
    .lyra-favicon-dot { fill: #A5A7EE; }
    @media (prefers-color-scheme: dark) {
      .lyra-favicon-star { fill: #EEF0FE; }
      .lyra-favicon-dot { fill: #8285E4; }
    }
  </style>
  <path class="lyra-favicon-star" d="M32 4C36.2 21.4 42.6 27.8 60 32C42.6 36.2 36.2 42.6 32 60C27.8 42.6 21.4 36.2 4 32C21.4 27.8 27.8 21.4 32 4Z"></path>
  <circle class="lyra-favicon-star" cx="52" cy="12" r="3"></circle>
  <circle class="lyra-favicon-dot" cx="12" cy="52" r="2"></circle>
</svg>
```

## Conventions

- Do NOT run prettier on these files; write the content verbatim.
- Do NOT commit. Leave the working tree dirty for review.

## Acceptance criteria

1. `diff apps/docs/public/favicon.svg apps/site/public/favicon.svg` → no output.
2. Both files end with a newline.
3. `git status --porcelain` shows exactly these two files modified, nothing else.

## Boundaries

Touch ONLY the two favicon.svg files. Do not touch layouts, `_headers`,
`lyra-mark*.svg`, the unreferenced `favicon-*.png` files, or anything else.

## Expected evidence

Report: the two file paths written, the output of the diff command from
criterion 1, and the output of `git status --porcelain`.

## Stop conditions

If either file does not exist at the stated path, stop and report.
Untracked files under `.batuta/` (including this brief) are expected and are
NOT a stop condition; criterion 3 refers to MODIFIED (M) entries only.
