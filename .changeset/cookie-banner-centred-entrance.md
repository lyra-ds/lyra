---
'@lyra-ds/styles': patch
---

CookieBanner no longer slides in from off-centre

The banner centres itself with `transform: translateX(-50%)` and borrowed the Toast's entrance
keyframe, which animates `transform` — so for the whole entrance the centring was simply gone.
Measured at a 1280px viewport: the banner appeared with its centre at 1000px instead of 640 and its
right edge 80px outside the viewport, then snapped into place when the animation finished.

It now uses a dedicated `lyra-cookies-in` keyframe that carries the centring in both frames. A
keyframe that animates `transform` can never be shared with an element positioned by `transform`;
Toast keeps `lyra-toast-in`, where nothing is centred.
