---
'@lyra-ds/react': patch
---

Fix `Container` `max` emitting invalid CSS (`--container-max: smpx`) for size keywords. `max` now accepts `sm`, `md`, `lg` and `xl` (mapped to 640, 768, 1024 and 1280px) as well as numbers and numeric strings in pixels; unrecognised values are ignored instead of collapsing `max-width` to `none`. Fixes lyra-ds/lyra#187.
