import { TimeZonePicker } from '@lyra-ds/react';

export function TimeZonePickerDstAndSearch() {
  return (
    <TimeZonePicker
      label="Meeting time zone"
      referenceDate="2026-01-15"
      recentZones={['America/New_York', 'America/New_York', 'Europe/Paris']}
      labels={{ searchPlaceholder: 'Search city, country, or offset…' }}
    />
  );
}
