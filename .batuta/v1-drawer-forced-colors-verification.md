# Drawer close focus in forced colors

The existing additive system-color focus rule now includes .lyra-drawer__close:focus-visible alongside Dialog. Its2px solid CanvasText outline and2px offset remain identical. This single selector addition fixes the reproduced missing native keyboard indicator in Chromium and Firefox without changing ordinary-mode styling or target geometry.

## Controller verification
Committed8000590 runner unchanged: original Styles produced Drawer16/18PASS with2actualforcedcolorsfocusFAIL; repaired Styles gives18/18PASS in21.89s. Dialog18/18PASS20.91s, plus existing Dialog source2tests perengine (6/6)PASS. All3engines actualDrawerandDialogforcedcolorsnativefocus measurements report focus-visible, solid2px outline,2px offset and systemcolor. No browserconsole/page/fatal/cleanupfailure; contexts,browsers,preview and ownconsumer/store roots cleaned. All report source hashes match current committed tooling. Stylelint,parity,diffchecksPASS.

Fresh Styles SHA256 fbe39e8f0ac94f71df91cf60923e158cd5e69d10652a9b7148d4f4fa517ce05c. Tarball comparison finds only package/components/feedback/feedback.css changed. Existing React SHA658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da reused; no React/source/dependency/lock/package/test/ledger/CI changes. Protected1733trackedfile comparison finds exactly the intendedCSS change. Compressed full-page/scenario measurement is not refreshed or claimed by this selector-only repair; finalcandidate collection remains pending.

## Routing and next
OpenCode GLM5.3Flash/low52.61s, no retry/escalation. Controller exactdiff review and all three acceptancecriteria reproduced; independentreview not required for this one-selector low task. Existing packedtest supplies the native regression; no mirrored test added. Raw MAIN .batuta/runs/v1-focus-closure/drawer-forced-colors-* and {drawer,dialog}-profiles-drawer-fixed/ retain reports,artifacts,sourcechecks and executor log; originalfailures retained.

This closes the boundedhostDrawerprofile slice. Next BottomSheet, then remainingP1profiles,touch/coarse-pointer,exactfinalLinux/artifact/CI,253-cellledger/migration/compatibility,remaininghistoricaldeltas and separateimmutablecorebaseline/runtime-family acceptance. Threecompositiongrowthexceptions stayapproved, unchangedfuture1500/3000B ceilings and no5%compositionallowance. NoV1stable/Alpine-wide/physicaldevice/OSmanualAT orreleaseclaim. NoBlade/remote/release/VM/resource/serviceaction.
