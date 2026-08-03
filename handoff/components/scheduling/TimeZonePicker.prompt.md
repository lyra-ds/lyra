# TimeZonePicker

Troca explícita de fuso horário — booking público e configurações de agenda. Construído sobre o `Combobox` (busca + grupos + hora ao vivo).

```jsx
<TimeZonePicker
  label="Fuso horário"
  value={tz}
  onChange={setTz}
  detectedZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
  recentZones={["America/New_York"]}
  referenceDate={sessionDate} // offset correto com horário de verão
/>
```

- Sempre IANA (`America/Sao_Paulo`) — nunca offset fixo.
- Busca por cidade, país e sigla ("brt", "pacific", "gmt-3").
- Grupos: Detectado → Recentes → regiões. Cada opção mostra `(GMT±X)` + hora atual ao vivo.
- `zones` sobrepõe a lista curada (`TimeZonePicker.ZONES`).

**Do:** anunciar o fuso detectado, nunca esconder. **Don't:** lista sem busca.
