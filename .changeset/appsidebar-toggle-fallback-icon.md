---
'@lyra-ds/styles': patch
---

Draw a fallback chevron on the AppSidebar collapse toggle for CSS-only consumers. The glyph was previously supplied only by the React/Alpine/Blade wrappers, so a stylesheet-only page rendered the toggle as an empty bordered box. The fallback appears only when no icon was injected (`:not(:has(svg))`), so wrapper-rendered toggles never show a duplicate mark.
