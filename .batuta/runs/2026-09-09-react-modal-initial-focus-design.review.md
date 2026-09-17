
## 2026-09-09-modal-initial-design-review
<<<FINDINGS
[medium] packages/react/src/command-palette/command-palette.tsx + EXACTDESIGN "Opening selection": throw contract says resolver throw goes "through normal React error handling", but CP executes shared initial choice inside requestAnimationFrame callback — a throw there is an uncaught global exception, never routed to React error boundaries; only Dialog/Drawer/BottomSheet effect throws reach React handling. "Callback throw exact-object propagation after panel focus" proof still holds for propagation, but mechanism claim false for CP owner. Scope claim per-owner or run CP resolution outside the frame.
FINDINGS>>>

## 2026-09-09-modal-initial-design-final-review
<<<FINDINGS
none
FINDINGS>>>

Controller: accepted the CP RAF exception-context finding. Design now explicitly distinguishes effect→React error handling from CP RAF→uncaught browser error, preserving timing and exact-value propagation after panel focus. Final reviewer confirms correction, no further findings. No source/API implementation yet; no separate human approval claimed, user authorized incumbent completion.
