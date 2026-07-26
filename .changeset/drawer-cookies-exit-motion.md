---
'@lyra-ds/react': patch
'@lyra-ds/styles': patch
---

Drawer and CookieBanner animate out instead of vanishing

Both entered with motion and then disappeared on the same frame the close was requested, while
Dialog and the command palette hold a `--closing` class for their exit. Measured: the Dialog stays
mounted for about 200ms of `lyra-overlay-out`, and these two were already gone in the first sample.

Both now use the same `usePresence` state machine: the element stays mounted while its exit
animation runs and leaves on `animationend`, with a timeout fallback so a reduced-motion or
animation-disabled environment can never wedge it. The drawer leaves toward the edge it came from
and its backdrop reuses the shared fade; the banner fades and settles downward.

The banner's exit keyframe carries `translateX(-50%)` in both frames, for the same reason its
entrance does: it is positioned by transform, so a keyframe animating transform without the centring
would throw it sideways on the way out.

`prefers-reduced-motion: reduce` disables all four animations.

Note for consumers: unmounting either component from a parent inside its own callback cuts the exit
short. Let it hide itself.
