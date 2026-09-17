# Site header fixture isolation

PR223 Windows job105048400742 on00504ed failed because metadata-deploy.test.mjs read an empty public/_headers. analytics.test.mjs concurrently invokes the generator, whose writeFile truncates that shared file. This is a shared fixture race, not the initially suspected CRLF parser issue; that attempt was stopped without changes.

OpenCode opencode/glm-5.3-flash isolated the real generator and template in a temporary app directory. Existing default, configured, invalid-origin and reset assertions remain; production files are no longer modified by analytics tests. Only analytics.test.mjs changed. No product, dependency or gate changes.

Controller verification: pnpm --filter @lyra-ds/site test exited0 (20/20); prettier check and git diff --check passed. Production headers have no diff. Native Windows verification remains pending the new push. Linux and macOS passed on the preceding head.

Raw evidence: controller .batuta/runs/pr223-followup/windows-current.log, site-isolation-fix.log and site-isolation-tests.log.
