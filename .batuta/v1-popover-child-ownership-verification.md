# Popover child ownership — local verification

The existing Popover now composes consumer cancellation before its Escape default, consumes owned child Escape before ancestors, recognizes React portal descendants by weak native-event identity, and attaches document fallbacks to its owning document. Focus returns only after accepted closure, to the current eligible trigger, without taking newer outside focus. No public API, CSS, dependency, modal-owner, Alpine or Blade change.

## Evidence
- Popover23 plus four direct consumer suites17:40/40 each Chromium, WebKit and Firefox. SSR5/5; types, scoped lint/format, diff, build and docgen PASS.
- Compiled51/51 native scenarios across the three engines:27 ownership/cancellation/ordinary portal,21 mixed root/subpath modal family,3 iframe owning-document cases. Zero page/probe errors.450 React files bound to exact hashes;153 declarations/Alpine files and four modal ESM files unchanged.
- Original owner2935cda fails14/23 current source cases; restoring exact source bytes restores23PASS. Initial microtask implementation independently fails the plain React portal action in all three engines. Native capture→microtask→document ordering proves why deleting the marker in capture's microtask loses the action. WeakSet membership now survives until document delivery; stopped events require no timer or strong retention.
- Controller fixtures preserve exact focus, callback and hit-test assertions. WebKit clicked focus destinations receive explicit native tab stops; the runner's portal action is inside its actual viewport. Trigger replacement tests prove DOM disconnection/replacement. Initially-open modal fixtures use existing returnFocusTo. Native BottomSheet fixture provides actual content space; its accessible-name oracle resolves aria-labelledby. All earlier failures remain retained.

## Review and size
Batuta GLM scout/design review, Codex gpt-5.6-terra/high353.55s plus one319.16s retry, then critical/controller completion. Final independent GLM23.29s:3DONE, no behavioral findings,2002-file unchanged guard; Batuta verifierPASS. The informational size observation remains Task10; incidental reviewer wording about shared chunks is corrected in raw disposition because entries are independently bundled.

Popover1289→1755/3000B (+466B). Affected consumers grow255–376B. Twelve React size failures and Alpine23051/21200B remain UNWAIVED, with unchanged limits. Exact rows in size-delta.json; no final packed performance qualification.

The bounded Task38 child-owner correction is locally complete. Broader anchored placement/RTL/resize, sibling arbitration and complete outside-pointer sequence are not qualified here. The constrained BottomSheet fixture observation must remain visible in the final ownership/placement audit before candidate qualification. Task10 measured size resolution and Task39 exact core/Alpine automated qualification remain open; manual evidence must follow the selected release profile and cannot be labeled passed when absent. Blade remains deferred.

Raw evidence: main checkout .batuta/runs/v1-popover-child-layers/ (source/native logs, negative-result,450-file manifest, final-artifact-proof, exact size report, review and verifier). Selected contract: .batuta/specs/2026-09-10-popover-child-ownership-design.md; brief/retry/critical files preserve routing and corrections. No remote or release action.
