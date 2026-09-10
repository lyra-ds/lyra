# One high-lane retry: concrete controller failures
You are the implementation worker, not a conductor. Do not delegate, invoke another executor, read routing/skills again, run tests/build/package managers or commit. Directly correct the existing scoped implementation. Prior unneeded nested delegation attempts were outside the worker task; do not repeat them. Preserve all controller/evidence/tool files. Original exact design and original brief remain binding; this feedback adds observed failures, not a new planning request.

## Controller results
Initial source Chromium: 169PASS/16FAIL over nine files/185tests. Fifteen failures are CommandPalette; the six existing mixed compiled Dialog/Drawer cases now pass isolation/return/ancestor-deactivation/scroll cleanup across three engines. SSR14PASS/buildPASS/formatPASS/diffPASS. TypecheckFAIL TS7022 and lintFAIL12. New compiled root/subpath + StrictMode diagnostic: only5/10PASS in Chromium. Custom nested hosts, initially-open ancestry/final restoration, initially-open CP, and nonfinal unmount FAIL. Full reports are copied below. No assertion/callback suppression is acceptable.

## Concrete repairs required
1. use-modal-layer.tsx:259–264 reads overlayRef in the panel's layout effect; CommandPalette's overlay callback ref is attached on a parent node after that child layout effect, so overlay is null, registration returns and never retries. This reproduces15 existing CP test failures (no guards/initialfocus/scroll/Escape/backdrop). Registration must follow actual owned DOM availability, including custom host replacement and CP ordering, and release the exact prior node. Respect pre-paint lifecycle. Do not fix by a generic timer, polling or arbitrary duplicate passive effect.
2. CP root still passes public open into panel and useModalActivity; ancestor effective-open=false therefore does not deactivate CP's retained portal/aria-modal. Propagate logical branch activity consistently. Its scroll claim must be modal&&effectiveOpen, not topmost; suspension does not release a live modal's scroll claim. Inline remains pass-through, with no modal claim or provider that marks an enclosing branch closed.
3. use-modal-layer.tsx:148 TS7022 parent implicit any; lint12 reports refs read/mutated during render at215/218/219/223/226, direct mutation of layer hook argument at259/269, activity26. Cycle ownership is accepted commit state, never speculative render refs. Use valid React-owned stable identity/state and explicit external lifecycle. No eslint suppressions, type-silencing cast or changing configuration. Raw errors appended below.
4. Pre-isolation opener capture is NOT implemented: registration has no panel/capture callback and useInitialFocus still captures only after isolation. Initially-open parent+child fixture focuses a real external button before mount; on final root close focus never returns, warnings emitted. Implement the design's authoritative ancestry capture and contained child-close fallback. Parent resume must not depend on pending mutation recovery or re-run an already completed initialFocusTo. Missing-target warnings for roots with no eligible destination remain as before.
5. Nonfinal unmount currently only removes registry state. The new native fixture removes focused Drawer with parent still open; activeElement never returns inside Parent. Implement explicit safe surviving-modal focus restoration without rerunning initial resolver. Do not invent background focus on last unmount.
6. Native custom container inside the parent: after child close the parent field remains inert, child return emits warning and panel fallback gets focus. Release only the obsolete background claim and preserve the child exit claim; keep active overlay node identity current during container/ref replacement. This affects both Drawer and BottomSheet.
7. Current close buttons and palette item handlers evaluate isTopmost during render (`onClick={... ? handler : undefined}`), contrary to the required live event-time gate. Put the check in the operation itself; backdrop provenance must also belong to the current live topmost branch. Preserve consumer-first Escape/dedupe and canceled/ignored closes.
8. New test at use-modal-layer.browser.test.tsx:59 is logically impossible: the child is nested in the parent's DOM, so parent.closest(inert)!=null implies child.closest(inert)!=null. For a nested custom-host branch, assert surrounding parent controls are inert and child path is not. For body sibling overlays, use real portals and assert parent overlay inert. The harness also never claims closed-overlay inactivity but expects it. Use actual four public components or wire the complete real primitives. Replace this erroneous fixture with meaningful deterministic coverage of design criteria: CP timing/ancestor close, initially-open capture/child return/final external return, custom host restoration, inactive sibling close/no warning, nonfinal unmount, retained reopen/topmost callbacks, inserted/moved background and exact preexisting inert cleanup. One inert-only test is not sufficient for the three acceptance criteria. Preserve all current source tests and exact focus assertions.
9. Audit disconnected overlay handling and ordinary rerender/StrictMode ordering against the design. Registry entries must not keep isolation for a disconnected current node, and ordinary renders must not reorder accepted active cycles. Keep one observer per document and exact owned attribute/style restoration. Keep SSR-safe registration; importing useLayoutEffect unconditionally is not the approved isomorphic pattern for an inline CP that renders on the server.

## Proof details
src/internal/use-modal-layer.tsx(148,11): error TS7022: 'parent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.

LINT

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-activity.ts
  26:8  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-activity.ts:26:8
  24 |   const claimKeyRef = useRef<symbol | null>(null);
  25 |   const attachedOverlayRef = useRef<HTMLElement | null>(null);
> 26 |   if (!claimKeyRef.current) claimKeyRef.current = Symbol('lyra-modal-exit');
     |        ^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  27 |
  28 |   const attachOverlay = useCallback(
  29 |     (node: HTMLElement | null) => {

To initialize a ref only once, check that the ref is null with the pattern `if (ref.current == null) { ref.current = ... }`  react-hooks/refs

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx
  215:8   error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:215:8
  213 |   const previousOpenRef = useRef(open && (parent?.effectiveOpen ?? true));
  214 |   const cycleRef = useRef(0);
> 215 |   if (!tokenRef.current) tokenRef.current = Symbol('lyra-modal-layer');
      |        ^^^^^^^^^^^^^^^^ Cannot access ref value during render
  216 |
  217 |   const effectiveOpen = open && (parent?.effectiveOpen ?? true);
  218 |   if (effectiveOpen && !previousOpenRef.current) cycleRef.current += 1;

To initialize a ref only once, check that the ref is null with the pattern `if (ref.current == null) { ref.current = ... }`                                                                                                                                                                                                                                                                                                                                  react-hooks/refs
  218:24  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:218:24
  216 |
  217 |   const effectiveOpen = open && (parent?.effectiveOpen ?? true);
> 218 |   if (effectiveOpen && !previousOpenRef.current) cycleRef.current += 1;
      |                        ^^^^^^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  219 |   previousOpenRef.current = effectiveOpen;
  220 |
  221 |   return useMemo(                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/refs
  218:25  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:218:25
  216 |
  217 |   const effectiveOpen = open && (parent?.effectiveOpen ?? true);
> 218 |   if (effectiveOpen && !previousOpenRef.current) cycleRef.current += 1;
      |                         ^^^^^^^^^^^^^^^^^^^^^^^ Cannot access ref value during render
  219 |   previousOpenRef.current = effectiveOpen;
  220 |
  221 |   return useMemo(

To initialize a ref only once, check that the ref is null with the pattern `if (ref.current == null) { ref.current = ... }`                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/refs
  218:50  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:218:50
  216 |
  217 |   const effectiveOpen = open && (parent?.effectiveOpen ?? true);
> 218 |   if (effectiveOpen && !previousOpenRef.current) cycleRef.current += 1;
      |                                                  ^^^^^^^^^^^^^^^^ Cannot access ref value during render
  219 |   previousOpenRef.current = effectiveOpen;
  220 |
  221 |   return useMemo(                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/refs
  218:50  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:218:50
  216 |
  217 |   const effectiveOpen = open && (parent?.effectiveOpen ?? true);
> 218 |   if (effectiveOpen && !previousOpenRef.current) cycleRef.current += 1;
      |                                                  ^^^^^^^^^^^^^^^^ Cannot update ref during render
  219 |   previousOpenRef.current = effectiveOpen;
  220 |
  221 |   return useMemo(                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/refs
  219:3   error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:219:3
  217 |   const effectiveOpen = open && (parent?.effectiveOpen ?? true);
  218 |   if (effectiveOpen && !previousOpenRef.current) cycleRef.current += 1;
> 219 |   previousOpenRef.current = effectiveOpen;
      |   ^^^^^^^^^^^^^^^^^^^^^^^ Cannot update ref during render
  220 |
  221 |   return useMemo(
  222 |     () => ({                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/refs
  221:10  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:221:10
  219 |   previousOpenRef.current = effectiveOpen;
  220 |
> 221 |   return useMemo(
      |          ^^^^^^^^
> 222 |     () => ({
      | ^^^^^^^^^^^^
> 223 |       token: tokenRef.current as symbol,
      …
      | ^^^^^^^^^^^^
> 230 |     [effectiveOpen, parent],
      | ^^^^^^^^^^^^
> 231 |   );
      | ^^^^ Cannot access ref value during render
  232 | }
  233 |
  234 | export function ModalLayerProvider({                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/refs
  223:14  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:223:14
  221 |   return useMemo(
  222 |     () => ({
> 223 |       token: tokenRef.current as symbol,
      |              ^^^^^^^^^^^^^^^^ Cannot access ref value during render
  224 |       ancestry: parent ? [...parent.ancestry, parent.token] : [],
  225 |       effectiveOpen,
  226 |       cycle: cycleRef.current,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    react-hooks/refs
  226:14  error  Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:226:14
  224 |       ancestry: parent ? [...parent.ancestry, parent.token] : [],
  225 |       effectiveOpen,
> 226 |       cycle: cycleRef.current,
      |              ^^^^^^^^^^^^^^^^ Cannot access ref value during render
  227 |       closeAuthorityRef,
  228 |       topmostRef,
  229 |     }),                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         react-hooks/refs
  259:19  error  Error: Cannot modify local variables after render completes

This argument is a function which may reassign or mutate `layer` after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead.

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:259:19
  257 |   const stateRef = useRef<DocumentState | null>(null);
  258 |
> 259 |   useLayoutEffect(() => {
      |                   ^^^^^^^
> 260 |     const overlay = overlayRef.current;
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 261 |     if (!layer.effectiveOpen || !overlay) {
      …
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 294 |     };
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 295 |   }, [layer, overlayRef]);
      | ^^^^ This function may (indirectly) reassign or modify `layer` after render
  296 |
  297 |   return {
  298 |     topmost,

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:269:5
  267 |     const state = getDocumentState(ownerDocument);
  268 |     stateRef.current = state;
> 269 |     layer.closeAuthorityRef.current = false;
      |     ^^^^^^^^^^^^^^^^^^^^^^^ This modifies `layer`
  270 |     const entry: LayerEntry = {
  271 |       ...layer,
  272 |       overlay,  react-hooks/immutability
  269:5   error  Error: This value cannot be modified

Modifying component props or hook arguments is not allowed. Consider using a local variable instead.

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-modal-layer.tsx:269:5
  267 |     const state = getDocumentState(ownerDocument);
  268 |     stateRef.current = state;
> 269 |     layer.closeAuthorityRef.current = false;
      |     ^^^^^^^^^^^^^^^^^^^^^^^ `layer` cannot be modified
  270 |     const entry: LayerEntry = {
  271 |       ...layer,
  272 |       overlay,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/immutability

✖ 12 problems (12 errors, 0 warnings)


NEW NATIVE DIAGNOSTIC
{
  "cases": [
    {
      "engine": "chromium",
      "mode": "mutation",
      "kind": "drawer",
      "checks": [
        {
          "name": "new background inert",
          "pass": true,
          "actual": {
            "inert": true,
            "blocked": true
          }
        },
        {
          "name": "final opener",
          "pass": true
        },
        {
          "name": "exact final inert and scroll restore",
          "pass": true,
          "actual": {
            "inert": [
              {
                "id": "preserved",
                "value": "application"
              }
            ],
            "overflow": ""
          }
        }
      ],
      "contractPass": true
    },
    {
      "engine": "chromium",
      "mode": "custom",
      "kind": "drawer",
      "checks": [
        {
          "name": "only child branch active",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": true,
            "child": false
          }
        },
        {
          "name": "child close resumes isolated parent",
          "pass": false,
          "actual": {
            "bg": true,
            "parent": true,
            "focus": "",
            "initial": 1
          }
        },
        {
          "name": "root restores captured external opener",
          "pass": true
        },
        {
          "name": "exact final inert and scroll restore",
          "pass": true,
          "actual": {
            "inert": [
              {
                "id": "preserved",
                "value": "application"
              }
            ],
            "overflow": ""
          }
        }
      ],
      "contractPass": false
    },
    {
      "engine": "chromium",
      "mode": "custom",
      "kind": "sheet",
      "checks": [
        {
          "name": "only child branch active",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": true,
            "child": false
          }
        },
        {
          "name": "child close resumes isolated parent",
          "pass": false,
          "actual": {
            "bg": true,
            "parent": true,
            "focus": "",
            "initial": 1
          }
        },
        {
          "name": "root restores captured external opener",
          "pass": true
        },
        {
          "name": "exact final inert and scroll restore",
          "pass": true,
          "actual": {
            "inert": [
              {
                "id": "preserved",
                "value": "application"
              }
            ],
            "overflow": ""
          }
        }
      ],
      "contractPass": false
    },
    {
      "engine": "chromium",
      "mode": "initial",
      "kind": "drawer",
      "checks": [
        {
          "name": "only child branch active",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": true,
            "child": false
          }
        },
        {
          "name": "child close resumes isolated parent",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": false,
            "focus": "inside",
            "initial": 1
          }
        }
      ],
      "error": "page.waitForFunction: Timeout 5000ms exceeded.\n    at /Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:17:65",
      "contractPass": false
    },
    {
      "engine": "chromium",
      "mode": "initial",
      "kind": "command",
      "checks": [],
      "error": "page.waitForFunction: Timeout 5000ms exceeded.\n    at active (/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:3:45)\n    at /Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:11:65",
      "contractPass": false
    },
    {
      "engine": "chromium",
      "mode": "ignored",
      "kind": "drawer",
      "checks": [
        {
          "name": "only child branch active",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": true,
            "child": false
          }
        },
        {
          "name": "ignored close retains active claim",
          "pass": true,
          "actual": {
            "parent": 0,
            "child": 1,
            "initial": 1,
            "return": 0,
            "inline": 0,
            "bg": true
          }
        },
        {
          "name": "child close resumes isolated parent",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": false,
            "focus": "inside",
            "initial": 1
          }
        },
        {
          "name": "root restores captured external opener",
          "pass": true
        },
        {
          "name": "exact final inert and scroll restore",
          "pass": true,
          "actual": {
            "inert": [
              {
                "id": "preserved",
                "value": "application"
              }
            ],
            "overflow": ""
          }
        }
      ],
      "contractPass": true
    },
    {
      "engine": "chromium",
      "mode": "unmount",
      "kind": "drawer",
      "checks": [
        {
          "name": "only child branch active",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": true,
            "child": false
          }
        }
      ],
      "error": "page.waitForFunction: Timeout 5000ms exceeded.\n    at active (/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:3:45)\n    at /Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:14:84",
      "contractPass": false
    },
    {
      "engine": "chromium",
      "mode": "sibling",
      "kind": "sheet",
      "checks": [
        {
          "name": "only child branch active",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": true,
            "child": false
          }
        },
        {
          "name": "lower sibling close preserves child focus",
          "pass": true
        },
        {
          "name": "exact final inert and scroll restore",
          "pass": true,
          "actual": {
            "inert": [
              {
                "id": "preserved",
                "value": "application"
              }
            ],
            "overflow": ""
          }
        }
      ],
      "contractPass": true
    },
    {
      "engine": "chromium",
      "mode": "reopen",
      "kind": "drawer",
      "checks": [
        {
          "name": "only child branch active",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": true,
            "child": false
          }
        },
        {
          "name": "child close resumes isolated parent",
          "pass": true,
          "actual": {
            "bg": true,
            "parent": false,
            "focus": "inside",
            "initial": 1
          }
        },
        {
          "name": "retained reopen hit testing",
          "pass": true,
          "actual": {
            "paint": true,
            "inert": false
          }
        },
        {
          "name": "root restores captured external opener",
          "pass": true
        },
        {
          "name": "exact final inert and scroll restore",
          "pass": true,
          "actual": {
            "inert": [
              {
                "id": "preserved",
                "value": "application"
              }
            ],
            "overflow": ""
          }
        }
      ],
      "contractPass": true
    },
    {
      "engine": "chromium",
      "mode": "inline",
      "kind": "drawer",
      "checks": [
        {
          "name": "inline Escape consumes own operation",
          "pass": true,
          "actual": {
            "parent": 0,
            "child": 0,
            "initial": 1,
            "return": 0,
            "inline": 1,
            "parentOpen": true
          }
        },
        {
          "name": "inline pick preserved",
          "pass": true,
          "actual": {
            "parent": 0,
            "child": 0,
            "initial": 1,
            "return": 0,
            "inline": 3
          }
        },
        {
          "name": "exact final inert and scroll restore",
          "pass": true,
          "actual": {
            "inert": [
              {
                "id": "preserved",
                "value": "application"
              }
            ],
            "overflow": ""
          }
        }
      ],
      "contractPass": true
    }
  ],
  "errors": [
    "warning: Lyra modal could not restore focus after closing. Provide an eligible returnFocusTo target.",
    "warning: Lyra modal could not restore focus after closing. Provide an eligible returnFocusTo target.",
    "warning: Lyra modal could not restore focus after closing. Provide an eligible returnFocusTo target.",
    "warning: Lyra modal could not restore focus after closing. Provide an eligible returnFocusTo target.",
    "page.waitForFunction: Timeout 5000ms exceeded.\n    at /Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:17:65",
    "page.waitForFunction: Timeout 5000ms exceeded.\n    at active (/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:3:45)\n    at /Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:11:65",
    "page.waitForFunction: Timeout 5000ms exceeded.\n    at active (/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:3:45)\n    at /Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-modal-isolation/qualification/run.mjs:14:84"
  ],
  "artifacts": {
    "index": "557d6c109a3e83959e83583326bbd8b17c223d9e883ae9cb0f76f501516403d3",
    "dialog": "0f6f21c8487a71f607d2b6c281daf74830e622077066502e66ae688614535ff2",
    "drawer": "93a4c1c0f9a3de25909733a89df78012b6788c2e079c6605c6528a971f067b0b",
    "bottom-sheet": "8dcebb4d91d737eff01e101d1087fe077f70183144ea4bd320d2cdb451f5edde",
    "command-palette": "08b818ee7b70077c49af984c00b0b16b30e45506a8b0da59854524641ec4dcc2"
  },
  "cleanup": "owned browsers/server closed"
}
SOURCE FAIL NAMES
⎯⎯⎯⎯⎯⎯ Failed Tests 16 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette — declared initial focus > resolves its declared modal destination once in the owned entry frame
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette — declared initial focus > focuses the programmatic panel fallback for an invalid declaration and closes it once on Escape
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette — declared initial focus > contains an input Escape after the combobox has already handled its close request
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > portals, traps focus, locks scroll, and restores its opener after Escape and backdrop close
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > returns explicit mouse focus to its declared target after escape dismissal
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > returns explicit mouse focus to its declared target after backdrop dismissal
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > returns explicit mouse focus to its declared target after selection dismissal
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > returns explicit mouse focus to its declared target after hotkey dismissal
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > does not resolve returnFocusTo when a parent ignores a close request
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > uses a successor after the trigger is removed by the accepted closing commit
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > uses the latest resolver and fresh captured opener once per accepted close during a rapid reopen
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > falls back to the prepared opener when returnFocusTo targets the closing panel
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > falls back to the prepared opener when returnFocusTo targets the closing overlay
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette > dismisses only a complete backdrop gesture, not cross-boundary gestures
 FAIL  |browser (chromium)| src/command-palette/command-palette.browser.test.tsx > CommandPalette — logical close activity > inerts its retained modal scope, revokes a prior gesture, and leaves inline behavior alone
 FAIL  |browser (chromium)| src/internal/use-modal-layer.browser.test.tsx > useModalLayer > keeps only the current nested branch interactive and restores exact prior inert attributes
      Tests  16 failed | 169 passed (185)

# Original implementation brief (all eight sections remain binding)
# Modal branch isolation implementation brief

## Goal
Implement the exact technically reviewed .batuta/specs/2026-09-10-modal-isolation-design.md contract in the incumbent four React modal owners. You are the already delegated high-lane implementation worker. The controller owns coordination/review/tests/build/commit; do not delegate or start another planning workflow.

## Context
Read the design in full and .batuta/scout/2026-09-10-modal-isolation-owners.md for exact source anchors. Base a9c6e3f. The controller reproduced 12 compiled background isolation failures and six nested/sibling mixed-subpath lifetime failures, with zero page errors. Source owners: internal portal, modal-activity, focus-trap, initial-focus, return-focus, scroll-lock; DialogPanel/DrawerPanel/BottomSheetPanel/CommandPalettePanel effects live inside portal timing. Existing body-local Portal, independently bundled entries and one-shot return-focus are material constraints. Preserve Task40 dynamic recovery (35 shared tests each engine), all 121 current four-owner tests, 14 SSR cases, existing 252 compiled native focus scenarios. Current returnFocusTo and initialFocusTo semantics/API are settled. New documentation English. CSS-first classes/ref/rest-spread rules packages/react/CONVENTIONS.md; newer VERSIONING.md 0.x fix=patch supersedes older convention text.

## Conventions
Pinned Node24.18.0/pnpm11.13.1, TypeScript5.9.3, React18/19 peers. Named exports and forwardRef, no CSS imports in shipped React. No new dependency/framework. Existing branch is the authorized isolated worktree. Do not install, build, run tests or package managers: this worker sandbox cannot bind Browser Mode and controller runs all proofs. You may format only scoped files with /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs. Do not change tool configuration or hook caches.

- Follow the project's existing state approach (props drilling, context,
  zustand, redux…).
- Components: PascalCase file and export names, one main component per file,
  colocate with the existing folder pattern (check neighbors before creating).
- Hooks: `use` prefix, rules of hooks respected.
- Styling: match the project's existing method (CSS modules, styled-components,
  Tailwind…).
- Derive state where possible; `useEffect` only for real external
  synchronization, with a complete dependency array.
- Tests: follow the project's runner (vitest/jest + testing-library). Query by
  role/label, not by test-id, unless the project already standardizes test-ids.

Never:

- Class components in new code.
- A second state or styling library alongside the project's existing one.
- Conditional hooks.
- `any` in a TypeScript project — type props and returns explicitly.



- Follow the existing code style of the files you touch — naming, formatting,
  import order.
- Change only what the brief asks. Every changed line must trace directly
  back to the brief.
- Clean up only your own mess: remove imports/variables/functions that YOUR
  change made unused. Leave pre-existing dead code alone — mention it in your
  output instead of deleting it.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what
  a line does.
- If the brief references tests, make them deterministic: no real network, no
  time-dependent assertions.

Never:

- Reformat code you were not asked to change.
- Add a dependency the brief does not explicitly allow; no lockfile changes
  except from an allowed dependency.
- Drive-by refactors or "improvements" outside the brief's scope.
- Touch CI config, license, or anything listed under the brief's Boundaries.
- Silence a signal instead of fixing its source (casts, empty catch blocks,
  sleeps, copy-paste to dodge the real fix) — the method line says how to
  mark an unavoidable workaround.


Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.

## Acceptance criteria
1. Design isolation criterion: single/sibling/nested/custom-container/background mutation/preserved inert/cleanup behavior covered by deterministic native browser tests. Controller reruns three engines and current compiled baseline.
2. Design lifecycle criterion: accepted ancestor close, ignored requests, current topmost defaults, captured/restored focus, initially-open nested portals, StrictMode, retained reopen, nonfinal unmount, inline exclusion and mixed independently compiled entries. Existing behavior preserved. Controller reruns owner/internal source and native suites. Use exact activeElement/real focus/native input. Use expect.element for DOM existence; never assertion on locator object. Stable keys when proving actual node removal. Negative focus assertions must await real observer delivery, not immediately-true polling. No console suppression.
3. Scope/compatibility criterion: no public API/dependency/CSS/build configuration change; scoped source tests, types/lint/format/SSR/build/docgen/declaration parity run by controller, then independent review and measured size growth without cap edits. Report unverified claims honestly.

## Boundaries
No edits to Alpine, Blade, styles, exports/indexes, tsdown configuration, package manifests, lockfiles, generated artifacts, documentation apps, historical evidence, other tools' configuration. No git writes/commit/merge/push, no service/Docker/Colima/resources, no new dependencies, no unapproved external API/provider. Preserve external application state, callback ordering/cancellation and existing public signature. No speculative nonmodal portal API.

## Scope
- packages/react/src/internal/use-modal-layer.tsx OR use-modal-layer.ts, and use-modal-layer.browser.test.tsx
- packages/react/src/internal/{portal,use-modal-activity,use-focus-trap,use-initial-focus,use-return-focus,use-scroll-lock}.tsx or .ts as existing, and their existing direct browser tests; internal.browser.test.tsx only scroll proof
- packages/react/src/{dialog,drawer,bottom-sheet,command-palette}/ corresponding current component .tsx, .browser.test.tsx and .ssr.test.ts
- .changeset/modal-branch-isolation.md (React patch)
Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence
List exact changed files and contract-to-test mapping, chosen minimal ownership/lifecycle and cross-entry sharing, commands actually run, and all unverified behavior. Finish with report; no claim tests/build passed because you do not run them. Controller supplies independent validation.

## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. Do not print DONE for controller-pending proofs.
