# CommandPalette explicit return focus

Status: active bounded task under the maintainer's 2026-09-09 instruction to
continue verifying CommandPalette focus and reuse the existing modal mechanism.
The approved Dialog/Drawer contract remains at
.batuta/specs/2026-09-08-modal-return-focus-design.md. This addendum applies its
existing optional synchronous returnFocusTo resolver, eligibility, accepted-close,
latest-committed callback, successor, warning, SSR and cycle rules to modal React
CommandPalette. It introduces no alternative mechanism or new dependency.

Baseline8d23c3d: native StrictMode Chromium/WebKit, mouse/keyboard/hotkey opening,
and Escape/backdrop/selection/hotkey closing:20/24 pass. All four WebKit mouse
cases land on body after panel removal. Source and proof are retained in the main
checkout .batuta/runs/v1-command-palette-focus/baseline.json. Keyboard capture is
valid; mouse callers need an explicit destination, as for Dialog/Drawer.

CommandPaletteProps gains returnFocusTo?: () => HTMLElement | null, consumed by
the existing shared owner instead of its separate restoration implementation.
Resolve only after accepted modal close, once per cycle. Ignored close requests,
initially closed renders, closed callback rerenders, SSR and permanently inline
palettes must never invoke it. Inline open-prop toggles remain silently ignored.
Capture from the panel's ownerDocument before initial focus; preserve StrictMode
and rapid close/reopen cycle behavior. Exclude the closing panel/overlay and their
children even while exit presence retains them. The shared owner remains unchanged.

Keep keyboard fallback to a valid captured opener, current successor eligibility,
preventScroll and development diagnostics for invalid compositions. No arbitrary
fallback, body/html focus call, global trigger tracking, delayed restoration,
initial-focus change, nested-layer design or unrelated modal migration.

Migrate the docs' trigger example and header CommandMenu to a stable trigger ref
resolver. Header remains the declared return destination for hotkey as well as
pointer invocation; router/command behavior stays intact. Inline examples need
no resolver. Both API pages explain explicit mouse usage, valid captured-keyboard
fallback, current logical successor, once-per-accepted-close timing, eligibility,
invalid-target fallback/diagnostic, and inline no-op. New prose is English,
including changed pt-BR prose, per maintainer. Generated props/llms must come from
the existing docgen owner after a React build. One additive React patch changeset;
no versioning or publication.

This closes only the verified CommandPalette return-focus slice. Other modal/P1
and exact packed Firefox/Linux release requirements remain pending.
