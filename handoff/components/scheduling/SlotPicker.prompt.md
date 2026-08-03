# SlotPicker

O visitante escolhe data e horário numa página pública de agendamento. Calendário com marcadores de disponibilidade + lista de horários no fuso do visitante + confirmação em dois passos.

```jsx
<SlotPicker
  slots={[{ start: "2026-08-03T13:00:00Z", end: "2026-08-03T14:00:00Z" }]}
  timezone={tz} onTimezoneChange={setTz}
  detectedZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
  onConfirm={(slot) => reserve(slot)} // revalidação atômica no servidor
  holdExpiresAt={hold} nextAvailableDate="2026-08-05"
  min={new Date()}
>
  <OfferingSummary /> {/* resumo do que está sendo agendado — slot do app */}
</SlotPicker>
```

- Slots chegam **em UTC**; exibição no fuso ativo (IANA, com TimeZonePicker embutido — nunca escondido).
- Dois passos: slot selecionado divide-se em horário + "Confirmar".
- Loading = 6 pills skeleton (nunca spinner); dia vazio oferece pulo para `nextAvailableDate`; hold com contagem **visível**.
- Ao expirar hold/erro: preserve os dados digitados do visitante (responsabilidade do app).

**Don't:** esconder o fuso; mostrar "agenda cheia" durante loading ou offline.
