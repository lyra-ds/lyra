# Plan: Fase 5 — Docgen & llms.txt

Importado do roadmap GSD em 2026-07-20. Depende da Fase 4.

**Goal**: um único parse das interfaces TypeScript alimenta prop tables e
`llms.txt` — docs de API nunca driftam da fonte.

**Requirements**: GEN-01, GEN-02

## Critérios de sucesso

1. Build gera `llms.txt` a partir dos contratos `.d.ts` (regras de geração +
   tokens + API dos 40 componentes) no public dir do app de docs, validado
   contra o formato do handoff (`handoff/llms.txt`).
2. Dados de props por componente emitidos da mesma extração — nenhuma prop
   table mantida à mão.
3. Docgen roda no CI depois do typecheck (mudança de interface regenera
   output em vez de driftar).

Notas: extração via TS compiler API / ts-morph (padrão estabelecido); script
Node simples como prebuild do docs.
