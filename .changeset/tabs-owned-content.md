---
'@lyra-ds/react': minor
---

Replace the unsafe `Tabs` `items` API, which generated empty labelled panels, with owned `TabsList`, `TabsTrigger`, and `TabsContent` parts. This pre-1.0 minor is an explicit project SemVer exception: the old contract cannot safely coexist because it leaves application content outside its tabpanel. Migrate each tab to explicit trigger and content nodes, select a stable nonempty value, and move tablist labels/classes to `TabsList`.

The earliest removal release is 0.6.0 (and the corrected API is required in 1.0.0). Invalid controlled values now render no selected panel until the application supplies a matching `active` value. User interactions request a value through `onChange`; the application still owns selection. The new React contract requires `@lyra-ds/styles` 0.5.1 or a later combined release for native hidden panel behavior.
