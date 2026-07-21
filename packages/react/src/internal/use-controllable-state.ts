import { useCallback, useEffect, useRef, useState } from 'react';

// Module-scoped ambient for the dev-only warning below. `@lyra-ds/react` is a browser
// package with no `@types/node`; declaring `process` narrowly here keeps typecheck strict
// without pulling Node globals into the whole package. tsup/esbuild still statically
// replaces `process.env.NODE_ENV` at build, so the warning is dropped from production output.
declare const process: { env: { NODE_ENV?: string } };

export interface UseControllableStateOptions<T> {
  /** The controlled value. When defined (`!== undefined`), the hook is controlled. */
  value?: T;
  /** The initial value used only while uncontrolled. */
  defaultValue?: T;
  /**
   * VALUE callback invoked on every `setValue`. This is a value-shaped callback
   * `(next: T) => void`, NOT a native DOM event handler — see the contract note below.
   */
  onChange?: (next: T) => void;
}

/**
 * Controlled/uncontrolled state hook — the RCT-09 pattern locked for every Phase 4
 * component whose public API is value-shaped (Tabs, Accordion, Switch, …). Hand-rolled
 * per D-14; no external state library.
 *
 * The hook is **controlled iff `value !== undefined`** (D-14). While controlled the
 * returned setter never mutates internal state (the parent owns the value) but always
 * calls `onChange`; while uncontrolled the setter updates internal state and calls
 * `onChange`. Flipping controlled-ness between renders emits a dev-only warning.
 *
 * CONTRACT — value callback, not event handler: `onChange` here receives the next VALUE
 * `(next: T) => void`. Components whose public contract is a native DOM event handler
 * (e.g. Input's `onChange: ChangeEventHandler<HTMLInputElement>`) must NOT pass that
 * handler into this hook. Instead they call the returned setter with the extracted value
 * inside their own DOM event handler and forward the original DOM event to the consumer
 * separately (see plan 03-06 for the Input wiring). Conflating the two is the review-flagged
 * bug this note prevents.
 *
 * @returns `[value, setValue]` — the current value and a stable value-setter.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T | undefined>(defaultValue);
  const isControlled = value !== undefined;

  // Dev-only guard: warn once per switch when a component flips between controlled and
  // uncontrolled, which silently breaks React's state ownership model. Runs in an effect
  // (not during render) so ref reads/writes stay lint-clean under the React 19 hooks rules.
  const wasControlledRef = useRef(isControlled);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (wasControlledRef.current !== isControlled) {
        console.warn(
          `[lyra] A component changed from ${
            wasControlledRef.current ? 'controlled' : 'uncontrolled'
          } to ${
            isControlled ? 'controlled' : 'uncontrolled'
          }. Decide between controlled (always pass \`value\`) or uncontrolled (only pass \`defaultValue\`) for the component's lifetime.`,
        );
      }
      wasControlledRef.current = isControlled;
    }
  }, [isControlled]);

  const current = (isControlled ? value : internal) as T;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}
