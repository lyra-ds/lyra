# Lote 09-0 — infra da Fase 8: CSS do delta v1.1+v1.2 + rebaseline do parity

<task>
The maestro already staged the updated design handoff in `handoff/` (76 files
changed — do NOT modify `handoff/` further). Your job: port every new/changed
piece of CSS from `handoff/` into `packages/styles`, register it, and
regenerate the parity baseline, leaving the repo's CI-relevant gates green
with ZERO new React components.
</task>

## The spec is the map

Read `.batuta/handoff-v1.2-map.md` IN FULL before writing anything. The
sections that bind this lot: "Impacto no gate de parity", "Armadilha de porte
do CSS — a mais cara do pacote", "Duas reescritas in-place", "Keyframes que
violam constraint travada", and the `--sm` iOS-zoom bug paragraph. Also read
`tools/parity/parity.mjs` header comments: it has TWO accommodation
mechanisms — the intentional-divergence allowlist (~line 155, pins exact
canonical payloads) and `ADDITIVE_EXTENSIONS` (~line 233).

## Deliverables

1. New CSS files in `packages/styles/components/` for the three new groups
   (layout, scheduling, primitives), mirroring the existing directory
   conventions, imported by `styles.css` in the same order the handoff's
   `styles.css` uses.
2. `data.css`, `forms.css`, `navigation.css`: replace the handoff-verbatim
   region with the new handoff content, then RE-APPEND the repo's existing
   additive blocks after it (the map enumerates what must survive: axe
   contrast fixes, exit animations, 44px touch targets, stepper wrap). The
   two in-place rewrites in forms.css come along verbatim.
3. New token `--border-input` in `packages/styles/tokens/` exactly as the
   handoff defines it (light + dark).
4. Deliberate divergences from handoff verbatim, each registered through the
   parity mechanism that fits (divergence allowlist with exact payload, or
   ADDITIVE_EXTENSIONS), never silently:
   a. `@keyframes lyra-actionbar-in` and `@keyframes lyra-popover-in` must
   NOT start at `opacity: 0` — entry keyframes animate transform only
   (locked constraint in `.claude/CLAUDE.md`).
   b. The handoff's `@media (pointer: coarse)` rule leaves `.lyra-input--sm`
   below 16px (its own stated goal fails — the map documents the bug).
   Correct it so small inputs are covered too.
5. `pnpm parity --update-baseline`, then `pnpm parity` green. The baseline
   diff is part of the delivery — do not hand-edit `baseline.json`.

## Gates you can run (offline, from repo root)

`pnpm parity` · `pnpm --filter @lyra-ds/styles run lint:css` ·
`pnpm run lint` · `node tools/icon-registry/generate.mjs --check` ·
`node tools/docgen/generate.mjs --check` (must stay at 54 components).
Your sandbox cannot run vitest browser tests, publint, pack-smoke or smoke —
the maestro runs those. Do not try.

## Conventions

- `handoff/` is read-only for you. `packages/styles` CSS is handoff-verbatim
  by region; prettier NEVER runs on styles CSS.
- Exact versions; no new dependencies; no React/TSX changes anywhere.
- Do not commit; leave the tree dirty for review. Untracked files under
  `.batuta/` are expected.

## Boundaries

Touch ONLY: `packages/styles/**` (CSS + tokens + styles.css entry),
`tools/parity/parity.mjs` (ONLY the two allowlist data structures),
`tools/parity/baseline.json` (ONLY via --update-baseline). Everything else —
`handoff/`, `packages/react/`, `apps/`, other tools — is out of bounds.

<verification_loop>
After porting, run every gate listed above and fix until green. Then verify
the trap the map calls the most expensive: grep that the repo's additive
blocks survived in the three appended files (e.g. `.lyra-table th` color
fix, exit keyframes, 44px touch-target rules) AND that the new handoff
sections are present. Show both greps in the report.
</verification_loop>

<default_follow_through_policy>
Proceed without questions; decide details yourself within the contract. Any
contract item tsdown— sorry, parity — cannot express is a stop condition, not
an improvisation.
</default_follow_through_policy>

<compact_output_contract>
Report: files touched; each gate command with the tail of its ACTUAL output;
the baseline diff summary (tokens/classes/imports before → after); the two
survival greps; uncertainties declared as such.
</compact_output_contract>

## Stop conditions

Same command failing twice; a parity check that neither allowlist mechanism
can express; anything requiring edits beyond Boundaries; the staged handoff
content contradicting the map (report, don't reinterpret).
