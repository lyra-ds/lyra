# FileUpload runtime responsiveness evidence

- Revision: `aae3e0e1e89ba2f642e5463038d5d3da7d35d4a0`
- Measured at: `2026-09-18T22:44:47.891Z`
- Scenario: `DF-FU-15`
- Exact command: `pnpm evidence:file-upload`
- Chromium: 151.0.7922.34
- Chromium executable: `/Volumes/Home/francisross/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
- Profile: 1280x720 at 1x, en-US, light
- Fixture: 100 controlled items, 20 active attempts
- Iterations: 3 warm-up plus 30 recorded per operation
- Packed React artifact: `lyra-ds-react-1.0.0.tgz` (a86150e8f3c922073abc5e6e835b780e5604537d28b209815b2c1a44b96b99c2)
- Packed Styles artifact: `lyra-ds-styles-1.0.0.tgz` (9deeccbe16a532a8dfb3d60cd41e9a2627802d07cf38d90aebd0b28547a7e6ff)

## Results

| Operation                        | Iterations |   Median |      p95 |    Worst | Longest task | Result |
| -------------------------------- | ---------: | -------: | -------: | -------: | -----------: | ------ |
| selectionIntentDispatch          |         30 | 0.100 ms | 0.300 ms | 0.400 ms |     0.000 ms | PASS   |
| controlledProgressReconciliation |         30 | 0.600 ms | 0.700 ms | 1.200 ms |     0.000 ms | PASS   |
| cancelIntent                     |         30 | 0.400 ms | 0.500 ms | 0.600 ms |     0.000 ms | PASS   |
| retryIntent                      |         30 | 0.400 ms | 0.500 ms | 0.500 ms |     0.000 ms | PASS   |
| confirmedRemovalFocusRecovery    |         30 | 0.800 ms | 1.100 ms | 1.100 ms |     0.000 ms | PASS   |
| teardown                         |         30 | 0.200 ms | 0.300 ms | 0.300 ms |     0.000 ms | PASS   |

Thresholds: p95 <= 100 ms, worst < 250 ms, and longest task < 50 ms. Operations complete on fixture-owned semantic markers; no arbitrary readiness sleep is used.
