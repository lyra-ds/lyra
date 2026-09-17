# Dialog content scroll review

OpenCode/glm-5.3-flash read-only independent review: all3criteria DONE.

<<<FINDINGS
packages/styles/components/feedback/feedback.css:355 low: max-height uses bare `calc(100dvh - var(--space-12))` with no `100vh` fallback declaration; the pre-existing in-file sibling pattern (feedback.css:527-528) declares `calc(100vh - var(--space-8))` then the dvh override. On a dvh-incapable browser the declaration drops entirely and the unbounded panel returns. Pinned matrix (Chromium 110, Firefox 106, WebKit 106) all support dvh, so this is a convention-consistency nit, not a demonstrated defect.
FINDINGS>>>

Controller adjudication: the optional legacy100vh fallback is deferred outside this demonstrated priority repair. Current supported browser runs resolve the dvh bound; the review itself identifies no observed defect. Its110/106/106 figures are test counts, not browser versions, and were not used as compatibility evidence. Native Chromium was151.0.7922.34. Full current matrix and packed proofs remain the evidence. No browser-support promise is expanded by this disposition.
