# Preview build test deadline

After PR223 merged, main Windows run35236923814 failed only the absent-evidence-gate integration case at5000ms. The real Vite subprocess already had a120000ms deadline; five preview integration cases accidentally retained Vitest's5000ms default. File serialization alone did not fix this mismatch.

OpenCode/opencode/glm-5.3-flash research and low implementation, no implementation retry or escalation. A shared120000ms value now applies to the subprocess and its four rejection cases plus valid build case. The existing ordinary-docs300000ms limit, authored-content defaults, production config and every assertion remain unchanged. Controller formatted the file.

Verification: temporary5500ms startup delay makes original absent-gate test fail and corrected test pass; fixed bytes restored. Complete evidence suite349/349 in17.57s, exit0. Raw controller evidence: .batuta/runs/pr223-followup/preview-delay-{old,fixed}.log, preview-delay-verdict.json, preview-budget-full.log. Windows confirmation awaits PR CI.
