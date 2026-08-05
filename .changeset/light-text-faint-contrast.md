---
'@lyra-ds/styles': patch
'@lyra-ds/react': patch
---

Accessibility: light-theme `--text-faint` raised from slate-400 to slate-500. At slate-400 the placeholder, group-label, calendar outside-month and hour-rail text it colors measured 2.34–2.56:1 against the light surfaces — below the WCAG AA 4.5:1 floor; it now lands at 4.76:1 on white. Dark theme is unchanged. The browser test suites now enforce axe's `color-contrast` rule with an explicit accepted-pair allowlist instead of filtering the rule out wholesale, so new contrast regressions fail CI.
