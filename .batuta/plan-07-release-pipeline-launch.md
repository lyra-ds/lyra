# Plan: Fase 7 — Release Pipeline & Launch

Importado do roadmap GSD em 2026-07-20. Depende da Fase 6. Última fase do v1.

**Goal**: `@lyra-ds/styles` e `@lyra-ds/react` 0.1.0 públicos no npm sob a
org GitHub `lyra-ds` brandada, com releases automatizados provados e2e.

**Requirements**: REL-01, REL-02, OSS-04

## Critérios de sucesso

1. Ambos 0.1.0 instalam de npm público em projetos frescos e renderizam UI —
   publish só depois do gate de dry-run (pnpm pack → inspeção do tarball →
   install em apps scratch Vite e Next.js).
2. Merge de changeset abre Version Packages PR que, ao mergear, publica no
   npm (OIDC trusted publishing OU fallback documentado NPM_TOKEN +
   provenance) e cria GitHub Release com changelog.
3. Org `lyra-ds` com avatar, profile README e social preview de
   `handoff/assets/github/`.
4. Checklist de launch ("Looks Done But Isn't" de
   `.planning/research/PITFALLS.md`) passa como gate final.

## Dependências e riscos herdados

- Org GitHub `lyra-ds` e org npm criadas MANUALMENTE pelo usuário (guiado).
- Re-checar npm/cli#8976 (E404 de OIDC + monorepo escopado via changesets) na
  hora de planejar; fallback NPM_TOKEN pré-aprovado.
- npm trusted publishing exige npm ≥11.5.1 (Node 24 ok); com OIDC a
  provenance é default — sem flag, sem secret.
