# WeeklyScheduleEditor

O dono da agenda define quando atende — janelas por dia da semana + exceções por data. Parte crítica de onboarding ("setup em minutos").

```jsx
<WeeklyScheduleEditor
  value={schedule} onChange={setSchedule}            // { 1: [{ start: "09:00", end: "17:00" }], … }
  exceptions={excs} onExceptionsChange={setExcs}     // [{ date: "2026-12-25", ranges: [] }]
  defaultRange={{ start: "09:00", end: "17:00" }}
/>
```

- Toggle por dia; dia desligado = "Indisponível". Vários intervalos por dia ("+ Adicionar intervalo").
- **"Copiar para…"** copia os intervalos de um dia para os marcados — destaque, é o que acelera o setup.
- Validação inline: fim ≤ início marca o campo (`invalid`) com mensagem.
- Exceções sobrescrevem o dia da semana; vazio = fechado o dia todo. Feriados: **sugerir, nunca aplicar automaticamente**.
- Impacto em compromissos existentes (ex.: sessões fora da nova janela) é decisão do app — mostre um modal, nunca cancele automaticamente.

**Don't:** grade de "pintar horários"; mover compromissos existentes ao salvar.
