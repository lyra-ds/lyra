# TimeInput

Entrada de horário `HH:mm` com digitação mascarada + stepper. Complementa o `TimePicker` (lista rolável): use **TimeInput** quando o usuário digita ou ajusta fino — especialmente pares início–fim lado a lado (disponibilidade, bloqueios, edição de sessão).

```jsx
<TimeInput label="Início" defaultValue="09:00" step={15} />
<TimeInput label="Fim" value={end} onChange={setEnd} min={start} invalid={end <= start} />
```

- Digitação livre: "9" → 09:00, "0930" → 09:30, "9:5" → 09:05 (normaliza no blur/Enter).
- Valor inválido **não é apagado** — borda de erro + `aria-invalid` até correção.
- `↑/↓` = ±`step` min; `Shift+↑/↓` = ±1h; steppers ▲▼ com o mesmo passo.
- `min`/`max` grampeiam o valor; `invalid` para validação cruzada externa.
- Mobile: `inputmode="numeric"`; fonte sobe a 16px em viewports touch (anti-zoom iOS).

**Don't:** usar dropdown de horários para pares início–fim; limpar o campo ao errar a máscara.
