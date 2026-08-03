# Lote 09-5 — Onda 5: ToastProvider + useToast

Sits on top of `.batuta/brief-fase8-waves.md` — read it first, in full,
including the addendum.

<task>
`ToastProvider` (+`useToast` hook) from
handoff/components/system/ToastProvider.{d.ts,jsx,prompt.md}. It is a layer
OVER the existing presentational `Toast`/`ToastStack` — compose them, never
replace them.
</task>

## Pinned traps (all four are from the map — binding)

1. The reference imports `Icon` for the three tone icons — that pulls the
   entire 79-icon registry into any app using the provider. INLINE the three
   SVGs instead (the established pattern: SidebarGroup/Drawer/Stepper chrome
   icons are inline). The icons are circle-check, circle-alert, info — copy
   their lucide paths from the registry source, aria-hidden.
2. The reference uses module-level `let toastSeq = 0` — breaks SSR (shared
   across requests). Use a React-safe id source (useId-derived or a ref
   counter inside the provider).
3. The reference never `clearTimeout`s on unmount — every timer must be
   cleaned up (provider unmount AND per-toast dismiss).
4. The Toast's translated `closeLabel` (Lote 09 of phase 6) must be exposed
   through the provider's API — the provider cannot regress the i18n the
   presentational layer already has.

## Acceptance criteria

1. Contract == the handoff `.d.ts` (api: toast/success/error/info, duration
   default 4000, per-call overrides as declared); provider renders
   ToastStack + Toast composition.
2. Zero Icon imports (grep proof in the report); zero module-level mutable
   state; timers cleaned (test: unmount with pending toasts → no late
   state-update warnings; use vi.useFakeTimers if the suite pattern allows,
   otherwise real short durations).
3. Browser tests: enqueue → auto-dismiss after duration; manual dismiss via
   the × (with the translated closeLabel); multiple toasts stack; light+dark
   axe clean. SSR test (provider renders children on the server without
   touching browser APIs).
4. Wiring complete (docgen 70 → 71); changeset minor. Report the count.

## Stop conditions

Toast/ToastStack lacking an API the provider needs (report, don't fork);
same command failing twice.

<default_follow_through_policy>
Proceed without asking questions. Every decision within this contract is
yours; implement end to end and report per the shared brief's report
contract.
</default_follow_through_policy>
