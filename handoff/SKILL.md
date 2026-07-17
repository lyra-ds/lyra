---
name: lyra-design
description: Use this skill to generate well-branded interfaces and assets for Lyra DS, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key facts about Lyra DS:
- CSS-first: all styling lives in `.lyra-*` classes loaded from `styles.css` (single entry, imports tokens + component CSS). React components are thin wrappers over those classes — Vue/Laravel/Phoenix consumers can use the classes directly.
- Theme: light + dark via `data-theme="dark"` on `<html>`. Always use semantic tokens (`--surface-card`, `--text-primary`, `--accent`) — never raw hex.
- Primary color is indigo (`--indigo-600 #5B5BD6`); dark surfaces are indigo-tinted "night" tones, never pure gray.
- Type: Plus Jakarta Sans (UI + display), JetBrains Mono (code). UI default is 14px/1.5; sentence case everywhere; pt-BR copy, English code.
- Icons: Lucide only (via the `Icon` component or `lucide-static` CDN). No emoji, no hand-drawn SVGs.
- Component usage examples live in `components/*/<Name>.prompt.md`.
