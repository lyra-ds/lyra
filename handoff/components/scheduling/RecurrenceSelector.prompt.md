# RecurrenceSelector

Recorrência de compromissos — presets primeiro, edição completa só se necessário, resumo em linguagem natural sempre visível.

```jsx
<RecurrenceSelector
  value={rule} onChange={setRule}
  startDate="2026-08-05"          // base dos presets: "Toda semana (qua)"
  defaultEndCount={8}             // pacotes: término padrão "Após 8 vezes"
  conflicts={[{ date: "2026-09-02", reason: "bloqueado" }]} // avisa, não bloqueia
/>
```

- Presets: Não se repete · Toda semana · A cada 2 semanas · Todo mês (n-ésima) · Personalizado…
- Personalizado: frequência + toggles de dia (44px) + término Nunca / Após N / Em data.
- Resumo via `describeRecurrence()` — frase inteira por regra, **nunca concatenada por partes** (i18n-safe); `aria-live` anuncia a cada mudança.
- Edição de série existente (escopos "Somente esta" / "Esta e as próximas") é fluxo do app.

**Don't:** escopo "todas, inclusive passadas"; montar a frase por concatenação.
