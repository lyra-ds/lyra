---
'@lyra-ds/react': minor
---

Every hard-coded English accessible name can now be translated

Lyra is a white-label design system, but seventeen accessible names were written as fixed English
strings inside the JSX. An app shipping in another language handed its screen-reader users
"Close notification", "View mode" and "Loading" with no way to change them. Every English default is
preserved, so nothing changes unless you pass the new prop.

Two different defects were behind it.

`Spinner` and `CookieBanner` wrote `aria-label` **after** the props spread, so a consumer who passed
one had it dropped in silence — no error, no warning, and calling code that looked correct. They now
honour it, the way `Breadcrumb` and `Pagination` already did. Those two also gained an explicit
`'aria-label'` declaration so the prop finally shows up in their documented API.

The rest live on internal elements that no consumer prop could reach, and gained one:

- `Dialog`, `Drawer` and `Toast`: `closeLabel`
- `Tag`: `removeLabel`
- `Pagination`: `previousLabel` and `nextLabel`
- `CommandPalette`: `searchLabel` for the search field
- `Avatar`: `statusLabel` for the presence dot, which until now announced the raw enum token
  (`"online"`, `"busy"`, `"away"`)
- `FileUpload`: `doneLabel`, plus `removeLabel` as a `(name: string) => string` callback
- `FileManager`: a grouped `labels` object (`viewMode`, `listView`, `gridView`, `currentFolder`,
  `itemActions`) merged over the defaults, so partial objects work — the same contract as
  `CommandPalette`'s `hints`. The exported type is `FileManagerLabels`.

The two labels that interpolate a file name take a function rather than a template string, because
word order moves between languages and a fixed template cannot localize.
