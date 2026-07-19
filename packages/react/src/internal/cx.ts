/**
 * Join class-name arguments into a single space-separated string, dropping every
 * falsy value (`false`, `null`, `undefined`, `''`).
 *
 * This is the handoff's own `filter(Boolean).join(' ')` idiom (see the prototype
 * `Button.jsx`), extracted once so no component re-implements it (D-11 — hand-rolled,
 * deliberately not `clsx`).
 *
 * By convention (D-09) the consumer's `className` is always passed LAST so it wins the
 * cascade for equal-specificity utility overrides.
 *
 * @example
 * cx('lyra-btn', isPrimary && 'lyra-btn--primary', className) // → "lyra-btn lyra-btn--primary my-class"
 * cx('a', false, null, undefined, 'b')                        // → "a b"
 * cx()                                                        // → ""
 */
export function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(' ');
}
