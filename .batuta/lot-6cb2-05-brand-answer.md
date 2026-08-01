# Resposta — Lote 5: o nome acessível do `Brand` só-marca

You stopped to ask instead of guessing. That was the right call — the brief did leave it
open, and it is a contract decision, not an implementation detail.

**But your proposed default is wrong**, and the reason is a rule already in the shared brief:

> Every visible string is a translatable prop, never a literal baked into the component.
> There are no English strings shipped inside the rendered output.

`aria-label="Brand"` is exactly that literal. It is not visible on screen, but it **is**
rendered output: a screen reader announces it, in English, on a page whose language is
`pt-BR`. A Brazilian reader would hear "Brand" where the site says "Lyra". Silent, and worse
than a missing name because it looks handled.

## The rule to implement

- **Wordmark present** (`children`): the images are decorative — `alt=""` — and the wordmark
  text is the accessible name. Nothing else needed. This is what you already proposed, and
  it is correct.
- **No wordmark**: the consumer **must** supply the accessible name. Do not invent one, in
  any language.

## How to enforce it

Make it a **type error**, not a runtime surprise. A discriminated union on the props:

- with `children`, the name prop is optional;
- without `children`, the name prop is required.

You are already applying this technique in this lot for the `href` / `asChild` exclusivity —
same tool, same reasoning: put the contract in the types so the consumer finds out at compile
time instead of shipping a nameless link.

If the union turns out to fight `asChild`'s own union in a way you cannot resolve cleanly,
stop and report what conflicts rather than falling back to a string default. Say which shape
you chose and why.

## Acceptance addition

The existing criterion 6 stands, sharpened:

- A mark-only `Brand` without an explicit name is a **compile error**. Prove it — write the
  invalid usage in a type-level check or a `// @ts-expect-error` test and report the output.
- A mark-only `Brand` **with** the name renders it as the accessible name; a `Brand` with a
  wordmark exposes the wordmark once and does not repeat it. Both proven by browser tests.
- Grep the component source for English literals in rendered output and report the result —
  it must be empty.

Everything else in `.batuta/lot-6cb2-05-brand.md` and the shared brief still applies. Do not
commit, branch or push.
