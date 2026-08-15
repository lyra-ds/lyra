#!/usr/bin/env node
/**
 * @lyra-ds/styles — STY-06 parity validator (zero-dependency Node, ESM).
 *
 * Proves the packaged CSS under packages/styles/** stayed a faithful copy of the
 * canonical design handoff under handoff/** at the DECLARATION level. This is a
 * whitespace- and comment-INSENSITIVE parity check, NOT a byte-for-byte one:
 * whitespace runs are collapsed (normalizeWs) and comments are stripped before
 * comparison, because the package intentionally rewrites the handoff's header and
 * section comments (Portuguese dev notes -> English MIT-tagged headers). What IS
 * asserted exactly: every token value, every declaration value, and each
 * declaration's file + at-rule-ancestry + selector + property placement and order
 * (plus the class inventory and the no-CDN url()/@import guard). A maintainer must
 * therefore NOT read "faithful copy" as license to reflow a token value's internal
 * whitespace on the assumption bytes are checked — they are not; only the parsed
 * declaration is. Four guarantees:
 *
 *   (A) Token check .......... every `--custom-property` declaration across the six
 *                              canonical token files (base+brand+colors+effects+
 *                              spacing+typography, including [data-theme="dark"]
 *                              re-declarations) exists in the package with an identical
 *                              value, and the handoff's own token inventory still
 *                              matches tools/parity/baseline.json. fonts.css (CDN
 *                              divergence, 0 tokens) and compat-shadcn.css (opt-in,
 *                              outside the entry) are excluded.
 *   (B) Placement- + cascade-aware declaration diff ... every declaration is keyed
 *                              by file + at-rule-ancestry + selector + property and
 *                              compared IN ORDER, so a declaration relocated to a
 *                              different selector/file, moved under/out of an
 *                              @media/@container/@keyframes block, OR reordered among
 *                              equal rules fails — even if the raw multiset is
 *                              unchanged. A small intentional-divergence allowlist
 *                              (fonts @import removal handled by exclusion; the
 *                              unpkg→data: chevron mask URLs) keeps the faithful copy
 *                              green.
 *   (C) Class inventory ...... the unique `.lyra-*` class names in handoff/components/**
 *                              match the package set exactly, and the handoff's own set
 *                              still matches the baseline.
 *   (D) External-URL guard ... every `url()` in the shipped package CSS targets a
 *                              `data:` URI or a relative path — any absolute scheme
 *                              (http:, https:, other scheme:) or protocol-relative
 *                              `url(//cdn…)` fails (no-runtime-CDN constraint). The
 *                              SAME scheme check is applied to every `@import`
 *                              target in BOTH string (`@import "https://…"`) and
 *                              url() notation — a string-form CDN import carries no
 *                              url() token, and stylelint pins
 *                              import-notation:"string", so that is the single most
 *                              likely way a runtime CDN dependency re-enters.
 *   (E) Entry cascade order .. styles.css (the aggregate entry, not part of the
 *                              handoff) imports the token layers before the component
 *                              layers, in the order recorded in the baseline, so a
 *                              mis-ordered token layer cannot silently break the
 *                              cascade the whole package depends on.
 *
 * (A), (C) and (E) compare handoff/ against tools/parity/baseline.json — a committed
 * snapshot regenerated with `pnpm parity --update-baseline` when the handoff is
 * intentionally advanced to a new version. It replaces the former EXPECTED_TOKENS /
 * EXPECTED_CLASSES literals, which could only count: renaming a class on BOTH sides
 * kept the count at 248 and the guard stayed silent. See the baseline block below.
 *
 * The parser is a real tokenizer / brace-depth state machine (NOT split(';') or a
 * flat regex): it tracks string state so quoted `data:` URIs with interior `;`/`{`/`}`
 * are opaque, treats url() (quoted OR unquoted) as an opaque token, strips comments,
 * and maintains the ordered stack of enclosing at-rule / selector blocks. Parser
 * fixtures under tools/parity/fixtures/ exercise a nested @media, a nested @container,
 * a @keyframes block, a quoted data: URI with an interior `;`, and an unquoted url()
 * with interior `;`/`{`/`}`/`:`; a self-check runs before the parity checks.
 *
 * On any drift: prints a message naming the drifted token/class/declaration (and points
 * at handoff/ as canonical) and exits non-zero. On full pass:
 *   `parity OK: 209 tokens, 248 classes, placement + at-rule ancestry + no-CDN verified`
 *
 * Flags: `--update-baseline` rewrites baseline.json from the current handoff/ and exits
 * without running the parity checks. It is a deliberate act — the resulting diff is the
 * reviewable record of what a new handoff version changed.
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const HANDOFF = join(REPO, 'handoff');
const PKG = join(REPO, 'packages', 'styles');
const FIXTURES = join(__dirname, 'fixtures');

const TOKEN_FILES = ['base', 'brand', 'colors', 'effects', 'spacing', 'typography']; // fonts + compat EXCLUDED

// ---------------------------------------------------------------------------
// Versioned handoff baseline (supersedes the EXPECTED_TOKENS/EXPECTED_CLASSES literals)
// ---------------------------------------------------------------------------
//
// Checks (A)-(C) prove `handoff ⊆ package`. What they CANNOT notice on their own is
// that handoff/ ITSELF changed: a port that edits the handoff and the package together
// satisfies every value comparison, because both sides move at once. The old guard
// against that was a pair of literals (209 / 248) asserted against the HANDOFF side —
// a tripwire, not a parity check.
//
// Counting is too coarse for that job. Swap one class for another in both trees and the
// count stays 248, so the tripwire never fires; the same holds for a token renamed on
// both sides. This baseline records the token names (with their declaration counts, so
// the dark-theme re-declarations are covered), the class names, and the package entry
// order — so an add, a removal, AND a swap each fail, naming the exact symbol.
//
// It is regenerated deliberately with `pnpm parity --update-baseline` when handoff/ is
// intentionally advanced to a new version. The diff of THAT regeneration is the
// reviewable record of what the new handoff brought — which two magic numbers could
// never be. Same pattern the icon registry already uses (generated artifact + --check).
const BASELINE_PATH = join(__dirname, 'baseline.json');
const UPDATE_BASELINE = process.argv.includes('--update-baseline');
const BASELINE = UPDATE_BASELINE ? null : loadBaseline();

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    console.error(
      `parity FAILED: tools/parity/baseline.json is missing.\n` +
        `  It is a committed artifact, not a cache — regenerate with \`pnpm parity --update-baseline\`\n` +
        `  and review the result before committing.`,
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

/** Snapshot what handoff/ + the package entry contain right now. Sorted, so diffs stay readable. */
function writeBaseline() {
  const byName = tokenNameCounts(collectTokens(HANDOFF));
  const classes = [...collectClasses(HANDOFF)].sort();
  const next = {
    $comment:
      'Generated by `pnpm parity --update-baseline`. Snapshot of the canonical handoff/ — ' +
      'regenerate only when handoff/ is intentionally advanced, and review the diff: it is the ' +
      'record of what the new handoff version added or removed.',
    handoffVersion: BASELINE?.handoffVersion ?? 'v1.0',
    tokens: {
      declarations: Object.values(byName).reduce((a, b) => a + b, 0),
      byName: Object.fromEntries(
        Object.keys(byName)
          .sort()
          .map((n) => [n, byName[n]]),
      ),
    },
    classes: { count: classes.length, names: classes },
    stylesEntryOrder: extractImports(read(join(PKG, 'styles.css'))),
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `baseline updated: ${next.tokens.declarations} token declarations, ${next.classes.count} classes, ` +
      `${next.stylesEntryOrder.length} entry imports (handoff version "${next.handoffVersion}").\n` +
      `Review the diff before committing — bump "handoffVersion" by hand when the handoff version changes.`,
  );
}

// Intentional-divergence allowlist: the unpkg.com chevron mask URLs rewritten to
// local data: URIs (forms/display/navigation). fonts.css's dropped Google-Fonts
// @import is handled by excluding fonts.css from the diff entirely (0 tokens).
//
// The allowlist pins the EXACT canonical data: payload per file (down-chevron for
// forms + display, right-chevron for navigation), so a truncated, malformed, or
// swapped chevron SVG fails parity instead of being waved through as "any data:
// SVG" (WR-03). The Browser Mode suite additionally decode-proves both distinct
// payloads (.lyra-acc__chevron = down, .lyra-breadcrumb__sep = right).
const CHEVRON_DOWN_MASK = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>') no-repeat center / 100%`;
const CHEVRON_RIGHT_MASK = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>') no-repeat center / 100%`;
const MASK_DIVERGENCE = new Map([
  ['components/forms/forms.css', { icon: 'chevron-down', payload: CHEVRON_DOWN_MASK }],
  ['components/display/display.css', { icon: 'chevron-down', payload: CHEVRON_DOWN_MASK }],
  ['components/navigation/navigation.css', { icon: 'chevron-right', payload: CHEVRON_RIGHT_MASK }],
]);

// Approved large-overlay entrance refinements. The handoff's shared `lyra-pop-in` remains
// canonical for smaller surfaces; only Dialog and CommandPalette opt into the dedicated motion.
const OVERLAY_ENTRANCE_DIVERGENCE = new Map([
  [
    'components/feedback/feedback.css',
    {
      selector: '.lyra-dialog',
      handoff: 'lyra-pop-in var(--duration-base) var(--ease-out)',
      package: 'lyra-overlay-in var(--duration-slow) var(--ease-out)',
    },
  ],
  [
    'components/navigation/navigation.css',
    {
      selector: '.lyra-cmdk',
      handoff: 'lyra-pop-in var(--duration-fast) var(--ease-out)',
      package: 'lyra-overlay-in var(--duration-slow) var(--ease-out)',
    },
  ],
]);

// Every contrast departure from the handoff is a complete declaration identity: file, selector,
// property, canonical value, and package value. The same token records transform only the named
// token multiset entry and validate its placement, so a matching value on another token layer is
// not accidentally approved. The two pre-existing solid-fill corrections remain explicit here;
// Wave 2 adds the dark interaction ramp and faint-text records.
const APPROVED_TOKEN_DIVERGENCES = [
  {
    file: 'tokens/colors.css',
    selector: '[data-theme="dark"]',
    property: '--accent',
    handoff: 'var(--indigo-500)',
    package: 'var(--indigo-600)',
  },
  {
    file: 'tokens/colors.css',
    selector: '[data-theme="dark"]',
    property: '--accent-hover',
    handoff: 'var(--indigo-400)',
    package: 'var(--indigo-700)',
  },
  {
    file: 'tokens/colors.css',
    selector: '[data-theme="dark"]',
    property: '--accent-active',
    handoff: 'var(--indigo-300)',
    package: 'var(--indigo-800)',
  },
  {
    file: 'tokens/colors.css',
    selector: '[data-theme="dark"]',
    property: '--danger',
    handoff: 'var(--red-500)',
    package: 'var(--red-600)',
  },
  {
    file: 'tokens/colors.css',
    selector: '[data-theme="dark"]',
    property: '--text-faint',
    handoff: '#6C739E',
    package: 'var(--night-300)',
  },
  {
    file: 'tokens/colors.css',
    selector: ':root',
    property: '--text-faint',
    handoff: 'var(--slate-400)',
    package: 'var(--slate-500)',
  },
];

const APPROVED_DECLARATION_DIVERGENCES = [
  {
    file: 'tokens/brand.css',
    selector: '[data-brand]',
    property: '--accent-hover',
    handoff: 'color-mix(in oklab, var(--brand), black 12%)',
    package: 'color-mix(in srgb, var(--brand), white 8%)',
  },
  {
    file: 'tokens/brand.css',
    selector: '[data-brand]',
    property: '--accent-active',
    handoff: 'color-mix(in oklab, var(--brand), black 22%)',
    package: 'color-mix(in srgb, var(--brand), white 16%)',
  },
  {
    file: 'components/scheduling/scheduling.css',
    selector: '.lyra-calview__evt--session',
    property: 'color',
    handoff: 'var(--accent-soft-text)',
    package: 'var(--text-primary)',
  },
  {
    file: 'components/scheduling/scheduling.css',
    selector: '.lyra-calview__evt--program-session',
    property: 'color',
    handoff: 'var(--success-text)',
    package: 'var(--text-primary)',
  },
  {
    file: 'components/forms/forms.css',
    selector: '.lyra-combobox__option-hint',
    property: 'color',
    handoff: 'var(--text-faint)',
    package: 'var(--text-secondary)',
  },
  {
    file: 'components/forms/forms.css',
    selector: '.lyra-combobox__trailing',
    property: 'color',
    handoff: 'var(--text-muted)',
    package: 'var(--text-secondary)',
  },
  {
    file: 'components/files/files.css',
    selector: '.lyra-fm__view',
    property: 'color',
    handoff: 'var(--text-muted)',
    package: 'var(--text-secondary)',
  },
  {
    file: 'components/navigation/navigation.css',
    selector: '.lyra-wscreate__slug-prefix',
    property: 'color',
    handoff: 'var(--text-muted)',
    package: 'var(--text-secondary)',
  },
];

// Approved white-label ink derivation. The handoff's valid white default must remain outside
// @supports so engines without relative-color syntax do not inherit the page text color. Inside
// the exact support guard, this derivation chooses neutral black or white from the resolved accent
// lightness while `--brand-contrast` remains the consumer override. Pinning both declarations and
// the @supports ancestry keeps any other brand.css drift a parity failure.
const BRAND_ON_ACCENT_CONTRAST_DIVERGENCE = {
  handoff: 'var(--brand-contrast, #FFFFFF)',
  derivation:
    'var(--brand-contrast, oklch(from var(--accent) clamp(0, (l / 0.58 - 1) * -infinity, 1) 0 h))',
  supports: '@supports (color: oklch(from red l c h))',
};

// Documented additive extensions (D-18/D-19): the Dialog pilot's exit-animation and
// close-button visuals live in the CSS package but have NO handoff counterpart, because
// the prototype borrowed .lyra-tag__remove + an inline 28px override (D-19) and had no
// distinct exit keyframes (D-17/D-18). Parity stays a hard gate under the invariant
// handoff ⊆ package: every handoff declaration still matches EXACTLY, and each package
// addition must be enumerated here BY EXACT NAME (no prefixes/wildcards) — any
// un-enumerated class or keyframe still FAILS parity (T-03-03: allowlist scope creep).
// Two check sites consume this: classCheck() (package-class-not-in-handoff branch) and
// diffFile() (extra-declaration branch). EXPECTED_CLASSES (248) is a handoff-side count
// and stays untouched by these package-only additions.
// Keyed by the styles file the extension lives in, so more than one component file
// can carry documented package-only declarations (D-18 Dialog animation, D-19 Dialog
// close button, and the Card actions-group class that replaces the handoff prototype's
// inline flex style — same CSS-first promotion pattern).
// Existing Dialog/CommandPalette class names appear here only to scope their additive
// reduced-motion declarations; the approved baseline animation-value changes stay pinned above.
const ADDITIVE_EXTENSIONS = {
  'components/chrome/chrome.css': {
    // Shell, prose, Navbar, NavLink, Footer, Brand, TableOfContents, CodeBlock, SegmentedControl,
    // and CommandPalette.Trigger are package-native chrome primitives with no handoff peer. Names
    // remain explicit so a stray chrome selector still fails parity.
    classes: [
      'lyra-shell',
      'lyra-shell--page',
      'lyra-shell--has-sidebar',
      'lyra-shell--has-aside',
      'lyra-shell__sidebar',
      'lyra-shell__aside',
      'lyra-shell__main',
      'lyra-shell__content',
      'lyra-shell--content',
      'lyra-shell__topbar',
      'lyra-prose',
      'lyra-navbar',
      'lyra-navbar--static',
      'lyra-navbar__inner',
      'lyra-navbar__brand',
      'lyra-navbar__nav',
      'lyra-navbar__actions',
      'lyra-brand',
      'lyra-brand__mark',
      'lyra-brand__mark--light',
      'lyra-brand__mark--dark',
      'lyra-brand__word',
      'lyra-navlink',
      'lyra-navlink--active',
      'lyra-footer',
      'lyra-footer__inner',
      'lyra-footer__brand',
      'lyra-footer__note',
      'lyra-footer__links',
      'lyra-toc',
      'lyra-toc__title',
      'lyra-toc__list',
      'lyra-toc__link',
      'lyra-toc__link--active',
      'lyra-code',
      'lyra-code--line-numbers',
      'lyra-code--wrap',
      'lyra-code__bar',
      'lyra-code__lang',
      'lyra-code__copy',
      'lyra-code__pre',
      'lyra-code__status',
      'lyra-segmented',
      'lyra-segmented__option',
      'lyra-segmented__option--active',
      'lyra-cmdk-trigger',
      'lyra-cmdk-trigger__icon',
      'lyra-cmdk-trigger__label',
    ],
    keyframes: [],
  },
  'components/layout/layout.css': {
    // The handoff's Stack/Grid emit `lyra-stack` / `lyra-grid` with no rule behind them — the whole
    // appearance is an inline style prop, which no non-React adapter can reuse. These rules move
    // the declarations into the CSS layer, with custom properties for the parts that cannot be
    // modifier classes (gap, direction, alignment, column template).
    classes: ['lyra-stack', 'lyra-grid'],
    keyframes: ['lyra-actionbar-in'],
  },
  'components/primitives/primitives.css': {
    // The handoff's Popover entrance fades from opacity 0; the package deliberately redefines this
    // exact keyframe after the canonical region to meet the transform-only entrance-motion constraint.
    classes: [],
    keyframes: ['lyra-popover-in'],
  },
  'components/feedback/feedback.css': {
    classes: [
      'lyra-dialog__close',
      'lyra-dialog',
      'lyra-dialog-overlay',
      'lyra-dialog--closing',
      'lyra-dialog-overlay--closing',
      'lyra-toast__icon',
      'lyra-drawer__close',
      'lyra-toast__close',
      'lyra-cookies',
      'lyra-tooltip',
      'lyra-tooltip--bottom',
      'lyra-tooltip--left',
      'lyra-tooltip--right',
      'lyra-drawer--closing',
      'lyra-drawer-overlay--closing',
      'lyra-cookies--closing',
      'lyra-bottomsheet-overlay',
      'lyra-bottomsheet',
      'lyra-bottomsheet__header',
      'lyra-bottomsheet__title',
      'lyra-bottomsheet__body',
      'lyra-bottomsheet__close',
      'lyra-bottomsheet--closing',
      'lyra-bottomsheet-overlay--closing',
    ],
    keyframes: [
      'lyra-fade-out',
      'lyra-overlay-in',
      'lyra-overlay-out',
      'lyra-pop-in-up',
      'lyra-cookies-in',
      'lyra-slide-out',
      'lyra-cookies-out',
      'lyra-bottomsheet-in',
      'lyra-bottomsheet-out',
    ],
  },
  'components/display/display.css': {
    // `lyra-acc__panel-wrap` keeps the Accordion panel mounted so its height can animate; the
    // handoff mounts the panel on open and therefore has no opening motion at all.
    classes: [
      'lyra-card__actions',
      'lyra-acc__panel-wrap',
      'lyra-acc__panel-clip',
      'lyra-acc__item--open',
      'lyra-acc__trigger',
      'lyra-card--interactive',
      'lyra-tag__remove',
    ],
    keyframes: [],
  },
  'components/forms/forms.css': {
    // Popup flip modifier: the handoff recipe only opens downward, which forces a page scroll
    // when the trigger sits near the bottom of the viewport.
    classes: [
      'lyra-combobox__pop--up',
      'lyra-combobox__trigger',
      'lyra-combobox__option',
      'lyra-input--sm',
      'lyra-formrow',
      'lyra-cal__day',
    ],
    keyframes: [],
  },
  'components/navigation/navigation.css': {
    classes: [
      'lyra-dropdown__trigger',
      'lyra-cmdk',
      'lyra-kbd',
      'lyra-cmdk__group-label',
      'lyra-cmdk__item-hint',
      'lyra-cmdk-overlay',
      'lyra-cmdk--closing',
      'lyra-cmdk-overlay--closing',
      'lyra-menu--up',
      'lyra-wssw__pop--up',
      'lyra-menu__item',
      'lyra-page',
      'lyra-sbgroup__item',
      // Hover-over-active repair: the idle hover outweighed `--active` on specificity, so the
      // selected item lost its accent surface under the pointer. Same repair as `lyra-tab--active`
      // below.
      'lyra-sbgroup__item--active',
      'lyra-sbgroup__label',
      'lyra-sbgroup__label--btn',
      'lyra-tab',
      // Contrast repairs on Tabs (muted on sunken; accent-as-text in dark) and the stepper's own
      // horizontal scroll, which keeps a three-step flow from scrolling the whole page on a phone.
      'lyra-tab--active',
      'lyra-tab__count',
      'lyra-tabs--pills',
      'lyra-stepper',
      'lyra-wssw__item',
      'lyra-wssw__trigger',
    ],
    keyframes: [],
  },
  'components/buttons/buttons.css': {
    // `.lyra-btn:hover { text-decoration: none }` — button-styled links must not
    // inherit Lyra's base `a:hover` underline. Correctness extension, no handoff peer.
    classes: ['lyra-btn'],
    keyframes: [],
  },
  'components/data/data.css': {
    // Contrast repair: the handoff's column headings sit at 4.34:1 on the sunken header band.
    classes: ['lyra-table'],
    keyframes: [],
  },
  'components/files/files.css': {
    // Touch-feedback extension: suppressing the iOS tap highlight and replacing it with a press.
    // `lyra-fm__head` re-colors the column headings the handoff left at 2.56:1 in light; `lyra-fm__name`
    // and `lyra-fm__more` grow their hit areas into layout space the row already reserves.
    classes: [
      'lyra-fm__card',
      'lyra-fm__crumb',
      'lyra-fm__head',
      'lyra-fm__more',
      'lyra-fm__name',
      'lyra-fm__row',
      'lyra-upload__remove',
      'lyra-upload__zone',
    ],
    keyframes: [],
  },
};

// Package class-selectors (with leading dot) permitted to exist without a handoff peer,
// flattened across every additive-extension file.
const ADDITIVE_CLASS_SELECTORS = new Set(
  Object.values(ADDITIVE_EXTENSIONS)
    .flatMap((ext) => ext.classes)
    .map((c) => `.${c}`),
);

/**
 * True when an EXTRA package declaration (one with no handoff counterpart in the
 * index-aligned diff) belongs to a documented additive extension — i.e. its file is
 * allowlisted AND its outermost enclosing block is an allowlisted @keyframes name OR a selector
 * in its block path whose .lyra-* class chain exact-matches an allowlisted class name. Exact-name
 * match only: a future un-enumerated addition (e.g. a stray .lyra-zzz rule) is not rooted in the
 * allowlist and still fails.
 */
function isAdditiveExtension(relPath, decl) {
  const ext = ADDITIVE_EXTENSIONS[relPath];
  if (!ext) return false;
  const root = decl.blockPath[0] || '';
  const kf = /^@keyframes\s+([a-zA-Z0-9_-]+)/.exec(root);
  if (kf) return ext.keyframes.includes(kf[1]);
  const classTokens = [...decl.blockPath.join(' ').matchAll(/\.(lyra-[a-zA-Z0-9_-]+)/g)].map(
    (m) => m[1],
  );
  return classTokens.some((t) => ext.classes.includes(t));
}

const errors = [];
const fail = (msg) => errors.push(msg);

// ---------------------------------------------------------------------------
// Tokenizer / brace-depth state machine
// ---------------------------------------------------------------------------

const normalizeWs = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Parse CSS into an ORDERED list of declaration records:
 *   { blockPath: string[], prop: string, val: string }
 * where blockPath is the ordered chain of enclosing block preludes (at-rules AND
 * selectors) from outermost to the declaration's immediate parent. Comments are
 * stripped; strings ('/") are treated as opaque so interior ;/{/} do not segment.
 */
function parse(css) {
  const decls = [];
  const stack = [];
  let buf = '';
  let i = 0;
  const n = css.length;

  const flush = () => {
    const s = normalizeWs(buf);
    buf = '';
    if (!s) return;
    const colon = s.indexOf(':');
    if (colon === -1) return; // not a declaration (e.g. stray prelude)
    const prop = s.slice(0, colon).trim();
    const val = s.slice(colon + 1).trim();
    if (!prop || prop.startsWith('@')) return; // ignore at-statements like @import/@charset
    decls.push({ blockPath: stack.slice(), prop, val });
  };

  while (i < n) {
    const c = css[i];

    // comment
    if (c === '/' && css[i + 1] === '*') {
      i += 2;
      while (i < n && !(css[i] === '*' && css[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // url(...) token — consumed opaquely (mirrors extractUrls), so an UNQUOTED
    // url() whose target contains an interior ;/{/}/: does not mis-segment the
    // declaration (IN-02). Quoted url()s are also covered by the string branch
    // below; handling them here too keeps parse() consistent with the url() guard.
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.slice(i, i + 4))) {
      buf += css.slice(i, i + 4); // "url("
      i += 4;
      while (i < n && /\s/.test(css[i])) {
        buf += css[i];
        i++;
      } // leading whitespace
      if (css[i] === '"' || css[i] === "'") {
        const q = css[i];
        buf += css[i];
        i++;
        while (i < n) {
          const d = css[i];
          if (d === '\\' && i + 1 < n) {
            buf += d + css[i + 1];
            i += 2;
            continue;
          }
          buf += d;
          i++;
          if (d === q) break;
        }
      } else {
        while (i < n && css[i] !== ')') {
          buf += css[i];
          i++;
        } // unquoted target — opaque up to ')'
      }
      if (i < n && css[i] === ')') {
        buf += css[i];
        i++;
      } // closing ')'
      continue;
    }
    // string (opaque)
    if (c === '"' || c === "'") {
      const q = c;
      buf += c;
      i++;
      while (i < n) {
        const d = css[i];
        if (d === '\\' && i + 1 < n) {
          buf += d + css[i + 1];
          i += 2;
          continue;
        }
        buf += d;
        i++;
        if (d === q) break;
      }
      continue;
    }
    if (c === '{') {
      stack.push(normalizeWs(buf));
      buf = '';
      i++;
      continue;
    }
    if (c === '}') {
      flush(); // trailing declaration with no ; before }
      stack.pop();
      i++;
      continue;
    }
    if (c === ';') {
      flush();
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  return decls;
}

const keyOf = (d) => [...d.blockPath, d.prop].join(' >> ');
const describe = (d) => `${d.blockPath.join(' > ')} {${d.prop}}`;

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function listCss(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listCss(full));
    else if (name.endsWith('.css')) out.push(full);
  }
  return out;
}

const read = (p) => readFileSync(p, 'utf8');

// ---------------------------------------------------------------------------
// Fixture self-check (proves the tokenizer segments the hard constructs)
// ---------------------------------------------------------------------------

function fixtureSelfCheck() {
  const cases = [
    {
      file: 'nested-media.css',
      // one decl inside @media > selector
      expect: [{ path: ['@media (min-width: 640px)', '.lyra-x'], prop: 'color', val: 'red' }],
    },
    {
      file: 'nested-container.css',
      expect: [
        { path: ['@container (max-width: 460px)', '.lyra-y'], prop: 'display', val: 'grid' },
      ],
    },
    {
      file: 'keyframes.css',
      expect: [
        { path: ['@keyframes lyra-fade-in', 'from'], prop: 'opacity', val: '0.6' },
        { path: ['@keyframes lyra-fade-in', 'to'], prop: 'opacity', val: '1' },
      ],
    },
    {
      file: 'data-uri.css',
      // the interior `;` inside the quoted data: URI must NOT segment the declaration
      expect: [
        {
          path: ['.lyra-z'],
          prop: 'mask',
          val: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><path d="m6 9 6 6 6-6"/></svg>') no-repeat center / 100%`,
        },
      ],
    },
    {
      file: 'unquoted-url.css',
      // the interior ;/{/}/: inside the UNQUOTED url() must NOT segment the declaration
      expect: [
        {
          path: ['.lyra-u'],
          prop: 'background',
          val: `url(data:image/svg+xml;utf8,<svg><path d="M0;0{1}2:3"/></svg>) no-repeat`,
        },
      ],
    },
  ];

  for (const { file, expect } of cases) {
    const decls = parse(read(join(FIXTURES, file)));
    if (decls.length !== expect.length) {
      fail(
        `Fixture ${file}: tokenizer produced ${decls.length} declarations, expected ${expect.length}`,
      );
      continue;
    }
    for (let k = 0; k < expect.length; k++) {
      const got = decls[k];
      const want = expect[k];
      const gotKey = keyOf(got);
      const wantKey = [...want.path, want.prop].join(' >> ');
      if (gotKey !== wantKey || got.val !== want.val) {
        fail(
          `Fixture ${file} #${k}: got [${gotKey} = ${got.val}], expected [${wantKey} = ${want.val}]`,
        );
      }
    }
  }
}

/**
 * Self-check for the @import scheme guard (WR-01): proves the guard catches an
 * external import written in STRING notation (the form url() cannot see), plus
 * url() and protocol-relative forms, while leaving relative + data: imports and
 * commented-out imports untouched. Meta-test — asserts detection, does not scan
 * the real package.
 */
function importSelfCheck() {
  const targets = extractImports(read(join(FIXTURES, 'import-notation.css')));
  const external = targets.filter(isExternalTarget);
  const expectedExternal = [
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans',
    'http://cdn.example.com/x.css',
    '//cdn.example.com/y.css',
  ];
  const ok =
    external.length === expectedExternal.length &&
    expectedExternal.every((t, k) => external[k] === t);
  if (!ok) {
    fail(
      `Import guard self-check: expected external=[${expectedExternal.join(', ')}] got=[${external.join(', ')}]`,
    );
  }
  if (!targets.includes('./local.css')) {
    fail('Import guard self-check: relative @import "./local.css" was not extracted');
  }
  if (!targets.some((t) => t.startsWith('data:'))) {
    fail('Import guard self-check: data: @import was not extracted');
  }
}

// ---------------------------------------------------------------------------
// (A) Token check — 209 custom properties, identical values
// ---------------------------------------------------------------------------

function collectTokens(baseDir) {
  const pairs = [];
  for (const f of TOKEN_FILES) {
    const p = join(baseDir, 'tokens', `${f}.css`);
    for (const d of parse(read(p))) {
      if (d.prop.startsWith('--')) pairs.push([d.prop, d.val]);
    }
  }
  return pairs;
}

/**
 * Compare what handoff/ contains NOW against the committed baseline, naming every
 * symbol that appeared, vanished, or changed declaration count. Counting alone missed
 * a same-size swap; this does not.
 *
 * The failure message names `--update-baseline` on purpose: an intentional handoff bump
 * should be one obvious command whose diff is the review artifact, not a hunt for which
 * literal to edit.
 */
function baselineDrift(label, actual, expected) {
  const names = [...new Set([...Object.keys(actual), ...Object.keys(expected)])].sort();
  const added = names.filter((n) => !(n in expected));
  const removed = names.filter((n) => !(n in actual));
  const changed = names.filter((n) => n in actual && n in expected && actual[n] !== expected[n]);

  if (!added.length && !removed.length && !changed.length) return;

  const parts = [];
  if (added.length) parts.push(`added: ${added.join(', ')}`);
  if (removed.length) parts.push(`removed: ${removed.join(', ')}`);
  if (changed.length) {
    parts.push(
      `declaration count changed: ${changed.map((n) => `${n} ${expected[n]}→${actual[n]}`).join(', ')}`,
    );
  }
  fail(
    `${label} baseline drift — handoff/ no longer matches tools/parity/baseline.json ` +
      `(handoff version "${BASELINE.handoffVersion}").\n      ${parts.join('\n      ')}\n` +
      `      If handoff/ was advanced on purpose, run \`pnpm parity --update-baseline\` and ` +
      `commit the regenerated baseline alongside the handoff change.`,
  );
}

/** Token name -> number of declarations of it (2 when re-declared under [data-theme="dark"]). */
function tokenNameCounts(pairs) {
  const counts = {};
  for (const [name] of pairs) counts[name] = (counts[name] ?? 0) + 1;
  return counts;
}

/**
 * The token inventory check compares per-name value multisets before the placement-aware diff
 * below runs. It applies only the exact records above; placementCheck() consumes those same
 * records and proves each substitution belongs to its pinned token-layer selector.
 */
function isAllowedTokenDivergence(name, handoffValues, packageValues) {
  if (name === '--on-accent') {
    const expectedPackageValues = [
      ...handoffValues,
      BRAND_ON_ACCENT_CONTRAST_DIVERGENCE.derivation,
    ].sort();
    return (
      handoffValues.includes(BRAND_ON_ACCENT_CONTRAST_DIVERGENCE.handoff) &&
      packageValues.length === expectedPackageValues.length &&
      expectedPackageValues.every((value, index) => value === packageValues[index])
    );
  }

  const expectedPackageValues = [...handoffValues];
  const divergences = [...APPROVED_TOKEN_DIVERGENCES, ...APPROVED_DECLARATION_DIVERGENCES].filter(
    (divergence) => divergence.property === name,
  );
  if (divergences.length === 0) return false;

  for (const divergence of divergences) {
    const index = expectedPackageValues.indexOf(divergence.handoff);
    if (index === -1) return false;
    expectedPackageValues[index] = divergence.package;
  }
  expectedPackageValues.sort();
  return (
    packageValues.length === expectedPackageValues.length &&
    expectedPackageValues.every((value, index) => value === packageValues[index])
  );
}

function tokenCheck(baseline) {
  const handoff = collectTokens(HANDOFF);
  const pkg = collectTokens(PKG);

  baselineDrift('Token', tokenNameCounts(handoff), baseline.tokens.byName);

  // multiset of values per token name
  const toMap = (pairs) => {
    const m = new Map();
    for (const [name, val] of pairs) {
      if (!m.has(name)) m.set(name, []);
      m.get(name).push(val);
    }
    for (const arr of m.values()) arr.sort();
    return m;
  };
  const hMap = toMap(handoff);
  const pMap = toMap(pkg);

  for (const [name, hVals] of hMap) {
    const pVals = pMap.get(name);
    if (!pVals) {
      fail(`Token ${name}: missing from package tokens — handoff/ is canonical`);
      continue;
    }
    const valuesMatch =
      hVals.length === pVals.length && hVals.every((value, index) => value === pVals[index]);
    if (!valuesMatch && !isAllowedTokenDivergence(name, hVals, pVals)) {
      fail(
        `Token ${name}: package=[${pVals.join(', ')}] handoff=[${hVals.join(', ')}] — handoff/ is canonical`,
      );
    }
  }
  for (const name of pMap.keys()) {
    if (!hMap.has(name)) {
      fail(
        `Token ${name}: present in package but not in canonical handoff — handoff/ is canonical`,
      );
    }
  }
  return handoff.length;
}

// ---------------------------------------------------------------------------
// (B) Placement- + cascade-aware declaration diff
// ---------------------------------------------------------------------------

function isAllowedDivergence(relPath, hd, pd) {
  const expected = MASK_DIVERGENCE.get(relPath);
  const allowsMaskDivergence =
    expected !== undefined &&
    (hd.prop === 'mask' || hd.prop === '-webkit-mask') &&
    hd.val.includes('unpkg.com/lucide-static') &&
    hd.val.includes(`icons/${expected.icon}.svg`) &&
    pd.val === expected.payload; // EXACT canonical data: payload — no truncation/swap
  if (allowsMaskDivergence) return true;

  const matchesRecord = (record) =>
    relPath === record.file &&
    hd.blockPath.at(-1) === record.selector &&
    hd.prop === record.property &&
    hd.val === record.handoff &&
    pd.val === record.package;

  if (APPROVED_TOKEN_DIVERGENCES.some(matchesRecord)) return true;
  if (APPROVED_DECLARATION_DIVERGENCES.some(matchesRecord)) return true;

  const overlay = OVERLAY_ENTRANCE_DIVERGENCE.get(relPath);
  return (
    overlay !== undefined &&
    hd.prop === 'animation' &&
    hd.blockPath.at(-1) === overlay.selector &&
    hd.val === overlay.handoff &&
    pd.val === overlay.package
  );
}

function isAllowedPackageAddition(relPath, decl) {
  return (
    relPath === 'tokens/brand.css' &&
    decl.prop === '--on-accent' &&
    decl.val === BRAND_ON_ACCENT_CONTRAST_DIVERGENCE.derivation &&
    decl.blockPath.length === 2 &&
    decl.blockPath[0] === BRAND_ON_ACCENT_CONTRAST_DIVERGENCE.supports &&
    decl.blockPath[1] === '[data-brand]'
  );
}

function diffFile(relPath) {
  const hPath = join(HANDOFF, relPath);
  const pPath = join(PKG, relPath);
  if (!existsSync(pPath)) {
    fail(`Missing package file ${relPath} (present in handoff/) — handoff/ is canonical`);
    return;
  }
  const h = parse(read(hPath));
  const p = parse(read(pPath));
  let hIndex = 0;
  let pIndex = 0;
  while (hIndex < h.length || pIndex < p.length) {
    const hd = h[hIndex];
    const pd = p[pIndex];
    if (pd && isAllowedPackageAddition(relPath, pd)) {
      pIndex++;
      continue;
    }
    if (!hd) {
      if (isAdditiveExtension(relPath, pd)) {
        pIndex++;
        continue;
      }
      fail(
        `Extra declaration ${relPath} #${pIndex}: package has [${describe(pd)}] with no handoff counterpart — handoff/ is canonical`,
      );
      pIndex++;
      continue;
    }
    if (!pd) {
      fail(
        `Dropped declaration ${relPath} #${hIndex}: handoff has [${describe(hd)}] absent from package — handoff/ is canonical`,
      );
      hIndex++;
      continue;
    }
    if (keyOf(hd) !== keyOf(pd)) {
      fail(
        `Decl placement mismatch ${relPath} package #${pIndex}=[${describe(pd)}] handoff #${hIndex}=[${describe(hd)}] — handoff/ is canonical`,
      );
      hIndex++;
      pIndex++;
      continue;
    }
    if (hd.val !== pd.val && !isAllowedDivergence(relPath, hd, pd)) {
      fail(
        `Decl mismatch ${relPath} ${describe(hd)} #${hIndex}: package=${pd.val} handoff=${hd.val} — handoff/ is canonical`,
      );
    }
    hIndex++;
    pIndex++;
  }
}

function placementCheck() {
  const rels = [];
  for (const f of TOKEN_FILES) rels.push(`tokens/${f}.css`);
  for (const abs of listCss(join(HANDOFF, 'components'))) {
    rels.push(
      abs
        .slice(HANDOFF.length + 1)
        .split(/[\\/]/)
        .join('/'),
    );
  }
  for (const rel of rels) diffFile(rel);
}

// ---------------------------------------------------------------------------
// (C) Class inventory — 248 unique .lyra-* names
// ---------------------------------------------------------------------------

function collectClasses(baseDir) {
  const set = new Set();
  for (const f of listCss(join(baseDir, 'components'))) {
    for (const m of read(f).matchAll(/\.lyra-[a-zA-Z0-9_-]+/g)) set.add(m[0]);
  }
  return set;
}

function classCheck(baseline) {
  const handoff = collectClasses(HANDOFF);
  const pkg = collectClasses(PKG);

  const asCounts = (names) => Object.fromEntries([...names].map((n) => [n, 1]));
  baselineDrift('Class', asCounts(handoff), asCounts(baseline.classes.names));
  for (const c of handoff) {
    if (!pkg.has(c)) fail(`Class ${c}: missing from package components — handoff/ is canonical`);
  }
  for (const c of pkg) {
    if (ADDITIVE_CLASS_SELECTORS.has(c)) continue; // documented additive extension (D-18/D-19)
    if (!handoff.has(c))
      fail(`Class ${c}: present in package but not in canonical handoff — handoff/ is canonical`);
  }
  return handoff.size;
}

// ---------------------------------------------------------------------------
// (D) External-URL guard — data: or relative only
// ---------------------------------------------------------------------------

/** Extract every url() target from a stylesheet, respecting comments + quotes. */
function extractUrls(css) {
  const urls = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      i += 2;
      while (i < n && !(css[i] === '*' && css[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < n && css[i] !== q) {
        if (css[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    // match url( case-insensitively at a token boundary
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.slice(i, i + 4))) {
      i += 4;
      // skip leading whitespace
      while (i < n && /\s/.test(css[i])) i++;
      let target = '';
      if (css[i] === '"' || css[i] === "'") {
        const q = css[i];
        i++;
        while (i < n && css[i] !== q) {
          if (css[i] === '\\') {
            target += css[i + 1] || '';
            i += 2;
            continue;
          }
          target += css[i];
          i++;
        }
        i++; // closing quote
      } else {
        while (i < n && css[i] !== ')') {
          target += css[i];
          i++;
        }
      }
      urls.push(target.trim());
      continue;
    }
    i++;
  }
  return urls;
}

function urlGuard() {
  const schemeRe = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;
  for (const abs of listCss(PKG)) {
    const rel = abs
      .slice(PKG.length + 1)
      .split(/[\\/]/)
      .join('/');
    for (const target of extractUrls(read(abs))) {
      if (target.startsWith('data:')) continue; // allowed inline data URI
      if (target.startsWith('//')) {
        fail(
          `External url() ${rel}: protocol-relative "url(${target})" is forbidden (no runtime CDN) — use data: or a relative path`,
        );
        continue;
      }
      const m = schemeRe.exec(target);
      if (m && m[1].toLowerCase() !== 'data') {
        fail(
          `External url() ${rel}: absolute-scheme "url(${target})" is forbidden (no runtime CDN) — use data: or a relative path`,
        );
        continue;
      }
      // otherwise: relative path — allowed
    }
  }
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** True when a url()/@import target is an external CDN reference (not data:, not relative). */
function isExternalTarget(target) {
  if (target.startsWith('data:')) return false; // inline data URI — allowed
  if (target.startsWith('//')) return true; // protocol-relative — external
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(target);
  return Boolean(m) && m[1].toLowerCase() !== 'data'; // absolute non-data scheme — external
}

/**
 * Extract every `@import` target — string ('/") OR url() notation — from a
 * stylesheet, ignoring commented-out imports. The url() guard only sees `url(`
 * tokens, so a string-form CDN import (`@import "https://…";`) slips past it
 * (WR-01). stylelint pins import-notation:"string", making that the likely vector.
 */
function extractImports(css) {
  const targets = [];
  for (const m of stripComments(css).matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'")]+)\1/gi)) {
    const t = m[2].trim();
    if (t) targets.push(t);
  }
  return targets;
}

// (E) styles.css cascade order — the seven token layers must be imported before
// the seven component layers, in the documented order. styles.css is not part of
// the handoff and is otherwise unchecked; a mis-ordered token layer would silently
// break the cascade the whole package depends on (IN-04).
// The expected order now lives in baseline.json, so adding a component layer (the delta
// brings layout/, primitives/ and scheduling/) is a reviewed baseline diff rather than an
// edit to a literal buried in this file.
function stylesEntryOrderCheck(baseline) {
  const expected = baseline.stylesEntryOrder;
  const imports = extractImports(read(join(PKG, 'styles.css')));
  if (imports.length !== expected.length || expected.some((rel, k) => imports[k] !== rel)) {
    fail(
      `styles.css @import order drift: the token layers must precede the component layers ` +
        `in the documented cascade order.\n      expected: ${expected.join(', ')}\n      actual:   ${imports.join(', ')}\n` +
        `      If a layer was added on purpose, run \`pnpm parity --update-baseline\`.`,
    );
  }
}

/** @import scheme guard: no external (CDN) imports in the shipped package CSS. */
function importGuard() {
  for (const abs of listCss(PKG)) {
    const rel = abs
      .slice(PKG.length + 1)
      .split(/[\\/]/)
      .join('/');
    for (const target of extractImports(read(abs))) {
      if (isExternalTarget(target)) {
        fail(
          `External @import ${rel}: "${target}" is forbidden (no runtime CDN) — use a relative path or a peer-installed font package`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

fixtureSelfCheck();
importSelfCheck();

if (UPDATE_BASELINE) {
  writeBaseline();
  process.exit(0);
}

const tokenCount = tokenCheck(BASELINE);
placementCheck();
const classCount = classCheck(BASELINE);
urlGuard();
importGuard();
stylesEntryOrderCheck(BASELINE);

if (errors.length) {
  console.error(
    `parity FAILED (${errors.length} issue${errors.length === 1 ? '' : 's'}) — handoff/ is canonical:\n`,
  );
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log(
  `parity OK: ${tokenCount} tokens, ${classCount} classes, placement + at-rule ancestry + no-CDN (url() + @import) verified`,
);
process.exit(0);
