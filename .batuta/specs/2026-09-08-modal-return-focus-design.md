# Explicit modal return focus

Status: approved by the maintainer on 2026-09-08. Planning and task documentation
are owned by Batuta under .batuta/. Execute through
.batuta/plans/v1-modal-return-focus.md. Approval covers this contract and its
bounded implementation, not release publication or waiver of existing gates.

## Problem and scope

At source b6a3c6c, local WebKit mouse activation blurs the trigger before React
opens Dialog or Drawer. Both components capture document.activeElement at modal
entry, so they capture body and cannot infer the invoking control. Keyboard
opening restores correctly. Twelve trusted-input cases and the prepared-fixture
correction are recorded in .batuta/v1-webkit-focus-verification.md. Prepared tests
passing do not close the unprepared mouse gap.

This proposal establishes explicit return-target ownership for React Dialog and
Drawer. It implements one slice of the approved modal focus contract. It does
not complete initial-focus policy, nested-modal coordination, inert isolation,
other modal components, Alpine parity or the full V1 release matrix.

## Recommended public contract

Add the same optional prop to DialogProps and DrawerProps:

```ts
returnFocusTo?: () => HTMLElement | null;
```

The invoking composition owns the meaning of the return destination. Lyra owns
when to resolve it, whether it is safe to focus and the focus operation itself.
The function is synchronous and returns a DOM element; no selector, Promise,
external primitive type, new provider or document-wide pointer tracking.

Example of a stable trigger and a logical successor:

```tsx
function Details({ canReturnToTrigger }: { canReturnToTrigger: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const successorRef = useRef<HTMLHeadingElement>(null);

  return (
    <>
      <button ref={triggerRef} disabled={!canReturnToTrigger} onClick={() => setOpen(true)}>
        Open details
      </button>
      <h2 ref={successorRef} tabIndex={-1}>
        Items
      </h2>
      <Drawer
        open={open}
        title="Details"
        onClose={() => setOpen(false)}
        returnFocusTo={() =>
          canReturnToTrigger ? (triggerRef.current ?? successorRef.current) : successorRef.current
        }
      >
        Details
      </Drawer>
    </>
  );
}
```

The successor is a named, meaningful region supplied by the composition. The
canReturnToTrigger value represents current domain availability, including
disabled, hidden or no-longer-meaningful controls; it can change while the modal
is open. The example selects the successor even while a disabled trigger remains
mounted. Mere non-null ref presence does not establish eligibility. A removed
trigger also falls back through its null ref. The function reads current refs
and state at close, so it does not freeze a stale element.

## Resolution and lifecycle

1. At each accepted opening, preserve the existing capture immediately before
   focus enters the panel. Do not evaluate returnFocusTo during render or SSR.
2. On an accepted open=true to open=false transition, call the latest resolver
   once, after the closing React commit's DOM/ref updates. A close request ignored
   by the parent does not resolve or move focus. An initially closed mount and
   later closed-state rerenders do not restore. Rendering a new callback identity
   while closed must not steal focus again.
3. Prefer the eligible resolver result. If the prop is absent, returns null or
   yields an ineligible element, try the captured opener if it is still eligible.
   This fallback preserves existing valid focused-opener usage.
4. Focus only an eligible target in the same document with preventScroll=true.
   Recheck eligibility at resolution time. Do not select an arbitrary background
   control, focus body/html, force focus onto a disabled element, or delay the
   close until an animation ends. Consume the restoration attempt for that cycle.
5. A subsequent accepted reopening creates a fresh cycle. A rapid close/reopen
   during exit must not let the previous cycle restore later or consume the new
   cycle's restoration. Unmount without an accepted close transition retains its
   current semantics; this slice does not add an unmount-restoration API.

Eligibility means connected, in the modal's ownerDocument, visible/rendered,
not disabled (including disabled fieldsets), not hidden/inert/aria-hidden through
an ancestor, and programmatically focusable. Named regions with tabindex=-1 are
valid; tab order alone is not the criterion. body and html are never return
candidates. A target MUST NOT be the closing overlay/panel or a DOM descendant
of either, even if exit presence keeps it connected and visible. The composition
MUST NOT return another element it will dispose as part of that closing workflow.
A target in a separate portaled modal branch is outside this slice; nested/owned
portal restoration requires the separate layer contract and is not qualified here.
Existing focus-trap rules provide a reference, but its Tab-only
selector cannot be reused blindly for programmatic return targets.

The resolver must be side-effect free except reading the composition's state
and refs: it must not focus, open/close another layer, mutate DOM or start async
work. A resolver exception is a consumer error, not a successful restoration;
it follows normal React error reporting rather than being swallowed or retried.

## Missing targets and the no-body requirement

A valid V1 invoking composition MUST ensure that either its declared result or
the captured opener is an eligible, meaningful destination at close. If the
opener can disappear, the composition MUST provide the logical successor order
already required by overlay-family-design.md: replacement/following control,
then stable workflow control, then named focusable workflow/page region.
The resolver chooses among these based on domain state; Lyra does not guess.

If neither candidate is eligible, Lyra MUST make no invalid focus call and MUST
emit a development diagnostic identifying missing modal return focus, once for
that close cycle. It still honors controlled closing; no trap or random target
is introduced. The browser can consequently land on body after removal. This is
an invalid invoking composition and a failed V1 acceptance case, not a compliant
fallback or a waiver of the normative no-body requirement. No successful-return
claim is allowed for this branch. A diagnostic makes the violation visible; it
does not satisfy the missing successor obligation. Qualified consumers must
exercise their valid successor path instead.

## Compatibility and alternatives

| Approach                                                    | Assessment                                                                                                                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus the invoking button in every consumer's click handler | Demonstrated workaround for prepared compositions, but repeats focus timing work and does not express removal/successor policy. Keep existing usages working; do not prescribe it as the V1 solution. |
| A single return-target element/ref                          | Simple for a stable button, but insufficient alone for a replacement chosen from current workflow state.                                                                                              |
| returnFocusTo resolver                                      | Recommended: one optional prop, current refs/state at close, explicit ownership and no global inference.                                                                                              |

The prop is additive and consumes no new dependency. Omitted prop retains valid
captured-opener behavior. Invalid/body-only restoration becomes diagnosed;
existing focus calls targeting unsafe elements are no longer preserved as a
compatibility guarantee. No HTML attribute forwarding of returnFocusTo is
allowed. SSR must not invoke the resolver or access browser globals.

V1 migration guidance must show mouse-opened compositions passing a trigger
resolver and workflows with removable triggers supplying a logical successor.
Existing bare WebKit mouse usage remains unqualified until migrated. Adding the
prop alone does not magically repair consumers that provide no usable target.
The type definition, public docs and first-party examples must agree before
this slice can be marked delivered. Existing package publication/version policy
remains unchanged; release automation is not authorized here.

## Implementation boundary after approval

Use the existing component close/capture lifecycle and one small internal
return-focus owner shared by Dialog and Drawer so eligibility and cycle rules
cannot diverge. Do not change focus-trap tab ordering or build a layer framework.
Drawer currently captures on mount only; satisfying fresh-cycle semantics
requires keying its capture on every accepted open transition, as Dialog already
does. That adjustment is part of this return-focus lifecycle, not an assumption
that its current mount effect can support rapid reopening unchanged.
The implementation brief must name exact source, test and documentation paths
before dispatch; no broad search-and-replace across the component family.

## Required verification

- Real Chromium/WebKit pointer opening with no pre-focus or activation-time
  focus workaround returns to the declared trigger on Escape, backdrop and
  close-button dismissal. Retain the old unprepared diagnostic as history.
- Keyboard opening and omitted-prop valid captured-opener behavior remain green.
- Closing-panel/overlay targets and their descendants are rejected, including
  while exit animation keeps them mounted. Success checks wait for panel removal
  and then assert focus remains on the valid external destination. This is a
  verification recheck, not a delayed second focus attempt or an animation-driven
  restoration path; user navigation after return must never trigger refocusing.
- Removed trigger resolves a live successor; disabled/hidden/inert/disconnected
  and cross-document targets are rejected. A tabindex=-1 named region works.
- Invalid resolver result falls back to a valid captured opener; both invalid
  produce the stated diagnostic and remain a failed composition, not a PASS
  for no-body restoration. No focus method is called on body/html.
- Ignored close request, initial closed mount, callback identity changes while
  closed, StrictMode effect replay and rapid close/reopen do not duplicate or
  misdirect focus. Latest resolver is used at the accepted close.
- Regression goes RED on current product before the implementation; restored
  behavior is checked with trusted input and callback/focus counts. Existing
  Drawer/Dialog tests, SSR, types, lint and public consumer examples pass.
- Firefox/pinned Linux and other release acceptance cells remain required when
  qualifying release artifacts; local two-engine proof is not the whole gate.

No runtime/API implementation, dependency/configuration change or V1
qualification is made by accepting this document into the working branch.
