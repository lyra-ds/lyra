---
'@lyra-ds/react': minor
'@lyra-ds/styles': minor
---

Add the opt-in `Tooltip` prop `escapeClipping` for hover and focus hints inside scrolling or clipped containers. The visible hint escapes clipping through the native top layer, retains scoped styling, and wraps and positions within the visual viewport. Existing timing, Escape ownership, accessible descriptions and wrapper refs are preserved; the default CSS-drawn mode is unchanged. Use the React and Styles updates together for this new mode. HTML, Alpine and Blade contracts are unchanged.
