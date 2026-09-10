---
'@lyra-ds/alpine': minor
---

Correct the pre-1.0 Tabs contract: Tabs now requires native fallback links and
real headed section panels, then enhances only complete paired markup. This
unsafe-markup migration takes effect no earlier than 0.6.0 (and must be present
in stable 1.0.0); it is a project pre-1.0 SemVer exception. Existing Blade Tabs
markup must be migrated manually and is not compatible until its producer emits
the fallback structure. Use a Styles release at or after 0.5.1 that contains
the native hidden correction.
