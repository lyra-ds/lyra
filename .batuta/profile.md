# Batuta profile — lyra-ds

Criado em 2026-07-20 via /batuta:init. Complementa `.claude/CLAUDE.md` — o que
já está lá (constraints da arquitetura CSS-first, stack travado, decisões
locked) NÃO se repete aqui; briefs devem apontar executores para as
constraints relevantes do CLAUDE.md quando tocarem em estilo/tokens.

## Stack

- Monorepo pnpm 11.13.1 (workspaces + changesets), Node 24, TypeScript 5.9.3.
- `packages/react` (React 19 dev / peer >=18, build tsup) + `packages/styles`
  (CSS puro, sem build). Template de convenções: `templates/react.md` do
  plugin Batuta — com a ressalva de que styling aqui é SEMPRE classes
  `.lyra-*` do pacote styles (nunca CSS novo inline/module no react).

## Metodologia

- Testes depois da implementação (tests-after), runner Vitest (Browser Mode
  para componente/a11y).
- Conventional commits; feature branches com PR para `main` (branch
  protegida — nunca commitar direto na main).

## Comandos

- Test: `pnpm test` · Build: `pnpm build` · Lint: `pnpm lint` (prettier) ·
  Typecheck: `pnpm typecheck` · Parity: `pnpm parity` · Smoke: `pnpm smoke`

## Takeover do GSD (2026-07-20)

O usuário aposentou o GSD; o Batuta assumiu a condução. Import feito:
fases 1–3 → `WORK.md` (Done), fases 4–7 → `.batuta/plan-04..07-*.md`,
decisões duráveis → abaixo. `.planning/` ficou intacto como arquivo histórico
(REQUIREMENTS.md, research/PITFALLS.md e os decision-logs das fases seguem
sendo referência de leitura); o usuário arquiva quando quiser.

## Decisões herdadas que briefs devem respeitar

- Fluxo de branch: NUNCA commitar na main (ruleset exige PR + 4 checks
  verdes: lint, typecheck, test, build + 1 aprovação).
- Versões exatas sempre (`save-exact` no .npmrc); engines `>=24 <25`.
- CSS de `@lyra-ds/styles` é handoff-verbatim: sem prettier, stylelint só
  valida namespace `.lyra-*`; extras vão no FIM do arquivo + allowlist
  ADDITIVE_EXTENSIONS do parity (209 tokens / 248 classes são contagens do
  handoff, imutáveis).
- `@lyra-ds/react`: exports map == entries do tsup == basenames do dist;
  `'use client'` via onSuccess do tsup (prepend determinístico); zero import
  de CSS no código shipped; lucide-react é a única dep de runtime, via
  registry gerado (prettier-ignored, gate --check de drift).
- JSDoc canônico em inglês; convenções de conversão em
  `packages/react/CONVENTIONS.md`.

## Project map

(sweep de 2026-07-20 — scout gratuito estourou timeout, mapeado pelo maestro;
detalhes ficam com grep e git)

- `packages/styles` — pacote CSS puro, SEM build: `styles.css` é o entry
  (`exports "."`), `tokens/` e `components/` publicados como arquivos,
  `compat-shadcn.css` é subpath opt-in nunca importado pelo entry. Testes em
  `packages/styles/tests/` (Vitest, com screenshots em `__screenshots__/`).
- `packages/react` — wrappers finos sobre as classes `.lyra-*`. Um diretório
  por componente em `src/` (`button/`, `dialog/`, `icon/`, `input/`,
  `internal/`), cada um com `*.browser.test.tsx` (Browser Mode/chromium) e
  `*.ssr.test.ts` colocados junto. Build tsup → `dist/` com entries por
  componente e exports duais ESM+CJS (`.`, `./button`, `./input`, …).
  `src/index.ts` é o barrel.
- `tools/` — scripts Node de gate: `parity/` (fidelidade vs handoff),
  `pack-smoke/`, `smoke/` (fixture Next.js), `dist-scan/`, `icon-registry/`
  (mapa estático de ícones Lucide). Invocados pelos scripts do root
  `package.json`.
- `handoff/` — material de design de referência (tokens, componentes,
  protótipos, `llms.txt`): SOMENTE leitura, é a fonte de verdade pixel-perfect.
- `.github/workflows/ci.yml` — pipeline única (lint → typecheck → test →
  build → smoke). `.changeset/` — versionamento. `.planning/` — artefatos do
  GSD, não tocar via Batuta.
- Não tocar: `node_modules/`, `dist/`, `pnpm-lock.yaml` (só via pnpm),
  `handoff/**`, screenshots de teste gerados.
