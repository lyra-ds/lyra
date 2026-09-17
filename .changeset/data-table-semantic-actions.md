---
'@lyra-ds/react': minor
---

Remove the unsafe `onRowClick` DataTable prop under the project's pre-1.0 compatibility exception
for unsafe contracts. Migrate row commands to named native buttons or links in action cells; the
earliest correction is 0.6.0 before stable release, or stable 1.0.0. Sorting, selection, optional
hover styling, and the Styles and Alpine contracts are unchanged.
