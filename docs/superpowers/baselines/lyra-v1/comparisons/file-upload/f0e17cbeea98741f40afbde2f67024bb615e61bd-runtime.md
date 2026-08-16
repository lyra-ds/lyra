# FileUpload runtime responsiveness evidence

- Revision: `f0e17cbeea98741f40afbde2f67024bb615e61bd`
- Measured at: `2026-08-16T19:55:29.679Z`
- Scenario: `DF-FU-15`
- Exact command: `pnpm evidence:file-upload`
- Chromium: 151.0.7922.34
- Chromium executable: `/home/franciscpd/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
- Profile: 1280x720 at 1x, en-US, light
- Fixture: 100 controlled items, 20 active attempts
- Iterations: 3 warm-up plus 30 recorded per operation
- Packed React artifact: `lyra-ds-react-0.4.2.tgz` (1f8ba52827876f3b7719bd4ba13eb6ff0c6257196132c4ff4944952060825c0d)
- Packed Styles artifact: `lyra-ds-styles-0.4.2.tgz` (13b8b9db1be3718b9bf3701e326d7ed7c74129f6e7cf5b32d3cf181161aef352)

## Results

| Operation                        | Iterations |   Median |      p95 |    Worst | Longest task | Result |
| -------------------------------- | ---------: | -------: | -------: | -------: | -----------: | ------ |
| selectionIntentDispatch          |         30 | 0.400 ms | 0.700 ms | 0.700 ms |     0.000 ms | PASS   |
| controlledProgressReconciliation |         30 | 2.200 ms | 3.400 ms | 4.100 ms |     0.000 ms | PASS   |
| cancelIntent                     |         30 | 1.400 ms | 1.900 ms | 2.000 ms |     0.000 ms | PASS   |
| retryIntent                      |         30 | 1.300 ms | 1.700 ms | 1.900 ms |     0.000 ms | PASS   |
| confirmedRemovalFocusRecovery    |         30 | 2.700 ms | 3.000 ms | 3.000 ms |     0.000 ms | PASS   |
| teardown                         |         30 | 0.500 ms | 0.600 ms | 0.700 ms |     0.000 ms | PASS   |

Thresholds: p95 <= 100 ms, worst < 250 ms, and longest task < 50 ms. Operations complete on fixture-owned semantic markers; no arbitrary readiness sleep is used.
