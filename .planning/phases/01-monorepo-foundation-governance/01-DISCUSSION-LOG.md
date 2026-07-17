# Phase 1: Monorepo Foundation & Governance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-16
**Phase:** 1-Monorepo Foundation & Governance
**Areas discussed:** Timing da org GitHub, Idioma do repo/governança, Versionamento dos pacotes, Fluxo de trabalho no repo

---

## Timing da org GitHub

| Option | Description | Selected |
|--------|-------------|----------|
| Criar a org lyra-ds agora | Org criada na fase 1, repo nasce definitivo, sem transferência | ✓ |
| Começar no usuário | franciscpd/lyra-ds → transferir na fase 7 | |
| Só local por enquanto | Sem remoto; critério de CI adiado | |

**User's choice:** Criar a org lyra-ds agora
**Notes:** Usuário levantou (via "Other") a hipótese de org `lyra` + repo `lyra-ds`, ou `lyra-ui`. Verificação ao vivo (2026-07-16): `github.com/lyra` e `github.com/lyra-ui` ocupados; scope npm `@lyra` ocupado (`@lyra/core` existe); `lyra-ds` livre no GitHub e `@lyra-ds/*` livre no npm. Decisão final: org `lyra-ds`.

## Nome do repositório

| Option | Description | Selected |
|--------|-------------|----------|
| lyra-ds/lyra | URL curta; "Lyra" é o produto, a org já diz "ds" | ✓ |
| lyra-ds/lyra-ds | Idêntico à org; redundante mas inequívoco | |
| lyra-ds/monorepo | Descritivo, menos marcável | |

**User's choice:** lyra-ds/lyra

## Idioma do repo/governança

| Option | Description | Selected |
|--------|-------------|----------|
| EN + link pt-BR no README | Governança EN; README.pt-BR.md espelhado e linkado | ✓ |
| Tudo bilíngue | Governança duplicada EN/pt-BR | |
| Só EN | pt-BR apenas no site de docs | |

**User's choice:** EN + link pt-BR no README

## Versionamento dos pacotes

| Option | Description | Selected |
|--------|-------------|----------|
| Lockstep | changesets `fixed`; styles e react sempre na mesma versão | ✓ |
| Independentes | Cada pacote versiona sozinho; exige tabela de compatibilidade | |
| Linked | Independentes mas "pulam juntas" quando ambos mudam | |

**User's choice:** Lockstep

## Fluxo de trabalho no repo

| Option | Description | Selected |
|--------|-------------|----------|
| PRs desde já | Branch protection + toda fase entra por PR com CI verde | ✓ |
| Direto na main até lançar | Commits diretos no bootstrap; proteção só na fase 7 | |
| Híbrido | Direto nas fases 1-2, PRs a partir da 3 | |

**User's choice:** PRs desde já

## Claude's Discretion

- Linter/formatter (ESLint+Prettier vs Biome vs oxlint)
- Layout dos jobs de CI, tsconfig.base, .gitignore/.npmrc, CODEOWNERS
- Config do changesets além do grupo fixed

## Deferred Ideas

None — discussion stayed within phase scope.
