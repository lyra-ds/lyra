/**
 * DF-CWD-SLUG — shared truth table for slug-input normalization, consumed by both
 * `@lyra-ds/react`'s and `@lyra-ds/alpine`'s CreateWorkspaceDialog browser suites.
 *
 * BACKGROUND: React's slug `<input>` is controlled — every keystroke commits a
 * synchronous re-render, so the DOM always mirrors `slugify(value)` before the next
 * keystroke lands. That means a keystroke's "raw" value is `slugify(lastDisplayed) +
 * newChar`, NOT the full string the user intended: a trailing separator gets stripped
 * before the following character is typed, so it never resurfaces as a hyphen (e.g.
 * typing "my url" character-by-character yields "myurl", not "my-url" — the space is a
 * trailing separator at the instant it's typed and is discarded before "u" arrives).
 * `@lyra-ds/alpine`'s slug input must reproduce this exactly by writing the slugified
 * value back onto the DOM node on every `input` event (see create-workspace-dialog.ts).
 *
 * A single `input` event carrying a whole string at once (paste, or a programmatic
 * fill) is NOT eroded this way, because there is no intermediate re-render between
 * characters — the whole raw string is slugified in one shot.
 *
 * `simulateSlugSequence` below is the reference model: it feeds each step's raw text
 * against the DOM value left by the previous step (mirroring the controlled-input
 * reset), and slugifies. Both browser suites replay the same `SLUG_SEQUENCES` steps via
 * real keyboard/paste events and assert their engine's displayed value matches
 * `expectedDisplayed` after every step, and the Enter-time payload matches `expectedFinal`.
 */

export type SlugStep = { type: 'key'; char: string } | { type: 'paste'; text: string };

export interface SlugSequence {
  id: string;
  description: string;
  steps: SlugStep[];
  expectedDisplayed: string[];
  expectedFinal: string;
}

/** Identical algorithm to the one duplicated in both packages' create-workspace-dialog. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Reference model: a controlled input whose DOM is reset to the slug after every step. */
export function simulateSlugSequence(steps: SlugStep[]): { displayed: string[]; final: string } {
  let dom = '';
  const displayed: string[] = [];
  for (const step of steps) {
    const raw = step.type === 'key' ? dom + step.char : dom + step.text;
    const next = slugify(raw);
    displayed.push(next);
    dom = next;
  }
  return { displayed, final: dom };
}

function keys(text: string): SlugStep[] {
  return [...text].map((char) => ({ type: 'key', char }));
}

const rawSequences: Array<{ id: string; description: string; steps: SlugStep[] }> = [
  {
    id: 'acme-bang-b',
    description: 'acme + ! + b + Enter — a discarded trailing separator must not resurface',
    steps: keys('acme!b'),
  },
  {
    id: 'my-url-keyed',
    description:
      '"my url" typed key by key — the space is a trailing separator at the instant it is ' +
      'typed and is discarded before "u" arrives, so this does NOT equal slugify("my url")',
    steps: keys('my url'),
  },
  {
    id: 'spaces-and-double-hyphens',
    description: 'repeated separators (spaces, then double hyphens) never emit a hyphen',
    steps: keys('a  b--c'),
  },
  {
    id: 'trailing-separator',
    description: 'a trailing hyphen is discarded and does not appear in the Enter payload',
    steps: keys('acme-'),
  },
  {
    id: 'paste-whole-string',
    description: 'a single paste event slugifies the whole string in one shot (no erosion)',
    steps: [{ type: 'paste', text: '  Acme   Team!! ' }],
  },
];

export const SLUG_SEQUENCES: SlugSequence[] = rawSequences.map((sequence) => {
  const { displayed, final } = simulateSlugSequence(sequence.steps);
  return { ...sequence, expectedDisplayed: displayed, expectedFinal: final };
});

/**
 * Simulates a native browser paste: one `input` event carrying the whole inserted
 * string, as opposed to `userEvent.type`'s one-event-per-character. Real
 * `userEvent.paste()` round-trips through the OS clipboard (needs a prior `copy()`
 * from in-page content), which cannot deliver arbitrary text reliably across
 * browsers/CI; this reproduces the DOM contract a real paste produces instead.
 */
export function simulateNativePaste(element: HTMLInputElement, text: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? element.value.length;
  setter.call(element, element.value.slice(0, start) + text + element.value.slice(end));
  element.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertFromPaste',
      data: text,
    }),
  );
}
