# Phase 3: React Infrastructure & Pilot Components - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 3-React Infrastructure & Pilot Components
**Areas discussed:** API do Icon e registry curado, Convenções de API dos wrappers, Comportamento do Dialog (piloto de overlay), Nota de convenções + template de testes

---

## API do Icon e registry curado

| Option | Description | Selected |
|--------|-------------|----------|
| Só os 54 do handoff | Registry gerado do scan do handoff — exatamente os ícones usados | ✓ |
| Set curado ampliado (~100-150) | 54 + ícones comuns de UI | |

| Option | Description | Selected |
|--------|-------------|----------|
| Prop icon aceita componente | `<Icon icon={Rocket}/>` — consumidor importa de lucide-react | ✓ |
| API de registro global | `registerIcons()` com estado global | |
| Sem escape hatch no v0.1.0 | Só os 54 do registry | |

| Option | Description | Selected |
|--------|-------------|----------|
| Union literal dos 54 | `IconName` gerado — autocomplete + erro de compilação | ✓ |
| string livre | Contrato literal do .d.ts | |

| Option | Description | Selected |
|--------|-------------|----------|
| Warning em dev + render null | console.warn dev-only; produção silenciosa | ✓ |
| Throw em dev | Fail fast | |
| Ícone placeholder | Glifo de fallback visível | |

| Option | Description | Selected |
|--------|-------------|----------|
| Gerado + commitado + CI | Script em tools/ + drift check (padrão parity Fase 2) | ✓ |
| Escrito à mão | Lista manual | |

| Option | Description | Selected |
|--------|-------------|----------|
| SVG inline direto | lucide-react como `<svg>` + .lyra-icon | ✓ |
| Manter `<span>` + mask | DOM do protótipo com data URIs | |

| Option | Description | Selected |
|--------|-------------|----------|
| Orçamento por import mínimo | Custo de importar só Button / só Icon; limites apertados | ✓ |
| Orçamento global do pacote | Limite único | |

**User's choice:** Todas as recomendações aceitas nesta área.

---

## Convenções de API dos wrappers

| Option | Description | Selected |
|--------|-------------|----------|
| forwardRef em todos | Único padrão seguro com peer >=18 <20 | ✓ |
| Só onde o piloto precisar | Menos boilerplate, API inconsistente | |

| Option | Description | Selected |
|--------|-------------|----------|
| Merge sempre | .lyra-* sempre + className anexado; style merge raso | ✓ |
| Merge de className, sem style | Sem expor style | |

| Option | Description | Selected |
|--------|-------------|----------|
| Rest-spread no elemento raiz | ...rest no elemento que o .d.ts estende | ✓ |
| Allowlist explícita | Só props documentadas | |

| Option | Description | Selected |
|--------|-------------|----------|
| Zero deps: cx interno | Mini helper em internal/; lucide-react única dependency | ✓ |
| clsx | Dependency micro battle-tested | |

| Option | Description | Selected |
|--------|-------------|----------|
| Named exports apenas | Sem default exports | ✓ |
| Named + default | Duas formas de importar | |

| Option | Description | Selected |
|--------|-------------|----------|
| Raiz + subpaths | Barrel + '@lyra-ds/react/button' no exports map | ✓ |
| Só raiz (barrel) | Exports map mínimo | |

| Option | Description | Selected |
|--------|-------------|----------|
| value/defaultValue + onChange | useControllableState em internal/ | ✓ |
| Só controlado | API menor, contradiz os .d.ts | |

**User's choice:** Todas as recomendações aceitas nesta área.

---

## Comportamento do Dialog (piloto de overlay)

| Option | Description | Selected |
|--------|-------------|----------|
| div + role=dialog | DOM do protótipo + focus trap próprio | ✓ |
| `<dialog>` nativo | Top-layer de graça, briga com o CSS do handoff | |

| Option | Description | Selected |
|--------|-------------|----------|
| 3 caminhos sempre, sem flags | Comportamento fixo, contrato mínimo (recomendado) | |
| Flags opcionais opt-out | closeOnEsc/closeOnOverlayClick default true | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Desmonte imediato | Igual ao protótipo (recomendado) | |
| Manter montado p/ animar saída | Presence helper espera transição | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, via internal/ | useScrollLock com compensação de scrollbar | ✓ |
| Não no v0.1.0 | Fidelidade estrita ao protótipo | |

| Option | Description | Selected |
|--------|-------------|----------|
| Extensão aditiva no styles | .lyra-dialog--closing + parity permite extensões documentadas | ✓ |
| Infra agora, visual depois | usePresence agora, CSS deferido | |
| Inline via React | Viola CSS-first | |

| Option | Description | Selected |
|--------|-------------|----------|
| Classe própria aditiva | .lyra-dialog__close, mesmo visual | ✓ |
| Fidelidade literal | Manter .lyra-tag__remove + inline style | |

| Option | Description | Selected |
|--------|-------------|----------|
| 1º focusável, fallback painel | APG; aria-labelledby + useId | ✓ |
| Sempre o painel | Anuncia título primeiro | |

| Option | Description | Selected |
|--------|-------------|----------|
| document.body fixo | Portal fixo com guarda SSR (recomendado) | |
| Prop container opcional | container?: HTMLElement, default document.body | ✓ |

**User's choice:** Três divergências das recomendações — flags opt-out de fechamento, animação de saída com presence, e prop `container` opcional. A divergência da animação de saída levantou a tensão com a paridade do styles package, resolvida com a política de extensões aditivas documentadas.

---

## Nota de convenções + template de testes

| Option | Description | Selected |
|--------|-------------|----------|
| packages/react/CONVENTIONS.md | Versionada com o código, visível a contribuidores | ✓ |
| .planning/ (interna) | Artefato GSD interno | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pilotos = referência canônica | Testes reais dos 4 pilotos são o template vivo | ✓ |
| Arquivo template separado | component.test.template.tsx com placeholders | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fixtures commitadas no CI | tools/smoke/{vite,next}-app instalam o tarball | ✓ |
| Gerados na hora no CI | create-vite/create-next-app a cada build | |

| Option | Description | Selected |
|--------|-------------|----------|
| Checklist de conversão | Passo-a-passo acionável + tabela de decisões | ✓ |
| Documento em prosa | Narrativa didática | |

| Option | Description | Selected |
|--------|-------------|----------|
| Projeto node separado | renderToString em environment: node | ✓ |
| Tudo no Browser Mode | Um ambiente só | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pasta por componente, co-located | src/button/{button.tsx, *.test.*} | ✓ |
| Arquivos planos + tests/ | Diretório único | |

**User's choice:** Todas as recomendações aceitas nesta área.

## Claude's Discretion

- Números exatos do size-limit (calibrar na execução, ~20% de margem)
- Config do tsup (entries, dts, target), attw, mecânica do exports map
- Detalhes de implementação de focus trap / presence / scroll lock (seguir APG)
- Mecânica do script de scan do registry e onde vive a allowlist de extensões aditivas no parity script
- Matriz axe light+dark (seguir padrões Browser Mode da Fase 2)
- Formato mínimo do app scratch Next.js

## Deferred Ideas

- Set curado ampliado (~100–150 ícones) — se houver demanda real
- API de registro global de ícones — rejeitada por estado global
- Glifo placeholder para ícone desconhecido — rejeitado
- Animações de saída dos demais overlays (Drawer, Toast, CommandPalette) — padrão criado aqui, CSS por componente na Fase 4
