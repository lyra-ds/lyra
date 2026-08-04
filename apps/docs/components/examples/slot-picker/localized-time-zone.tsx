import { SlotPicker } from '@lyra-ds/react';

export function SlotPickerLocalizedTimeZone() {
  return (
    <div className="lw-example-scroll">
      <SlotPicker
        timezone="America/New_York"
        defaultDate="2026-08-03"
        locale="pt-BR"
        slots={[{ start: '2026-08-03T13:00:00Z', end: '2026-08-03T13:30:00Z' }]}
        labels={{
          changeTimeZone: 'Alterar fuso horário',
          timeZonePicker: { searchPlaceholder: 'Pesquisar uma cidade' },
        }}
      />
    </div>
  );
}
