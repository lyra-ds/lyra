import { forwardRef, useEffect, useReducer } from 'react';
import { Combobox } from '../combobox';
import type { ComboboxOption } from '../combobox';
import { cx } from '../internal/cx';

/** A selectable IANA time zone. */
export interface TimeZoneOption {
  /** IANA zone identifier, for example `"America/Sao_Paulo"`. */
  value: string;
  /** Human-readable city or region label. */
  label: string;
  /** Presentational region heading for the option. */
  region: string;
  /** Extra search terms such as abbreviations and covered cities. */
  keywords?: string;
}

/** Translatable labels for {@link TimeZonePicker}. Merged over the English defaults. */
export interface TimeZonePickerLabels {
  /** Trigger text when no zone is selected. Default: `"Select time zone"`. */
  placeholder?: string;
  /** Search-field placeholder. Default: `"Search city, country, or abbreviation…"`. */
  searchPlaceholder?: string;
  /** Message shown when no zones match. Default: `"No time zones found."`. */
  emptyMessage?: string;
  /** Heading for the detected zone. Default: `"Detected"`. */
  detectedGroup?: string;
  /** Heading for recently used zones. Default: `"Recent"`. */
  recentGroup?: string;
}

const DEFAULT_LABELS: Required<TimeZonePickerLabels> = {
  placeholder: 'Select time zone',
  searchPlaceholder: 'Search city, country, or abbreviation…',
  emptyMessage: 'No time zones found.',
  detectedGroup: 'Detected',
  recentGroup: 'Recent',
};

const DEFAULT_ZONES: readonly TimeZoneOption[] = [
  {
    value: 'America/Sao_Paulo',
    label: 'São Paulo / Brasília',
    region: 'Americas',
    keywords: 'brazil brasil brt brasilia',
  },
  {
    value: 'America/Manaus',
    label: 'Manaus',
    region: 'Americas',
    keywords: 'brazil brasil amazonas amt',
  },
  {
    value: 'America/Argentina/Buenos_Aires',
    label: 'Buenos Aires',
    region: 'Americas',
    keywords: 'argentina art',
  },
  { value: 'America/Santiago', label: 'Santiago', region: 'Americas', keywords: 'chile clt' },
  { value: 'America/Bogota', label: 'Bogotá', region: 'Americas', keywords: 'colombia cot' },
  { value: 'America/Lima', label: 'Lima', region: 'Americas', keywords: 'peru pet' },
  {
    value: 'America/Mexico_City',
    label: 'Mexico City',
    region: 'Americas',
    keywords: 'mexico ciudad cst',
  },
  {
    value: 'America/New_York',
    label: 'New York',
    region: 'Americas',
    keywords: 'usa united states eua est edt eastern toronto miami',
  },
  {
    value: 'America/Chicago',
    label: 'Chicago',
    region: 'Americas',
    keywords: 'usa united states eua cst central texas',
  },
  {
    value: 'America/Denver',
    label: 'Denver',
    region: 'Americas',
    keywords: 'usa united states eua mst mountain',
  },
  {
    value: 'America/Los_Angeles',
    label: 'Los Angeles',
    region: 'Americas',
    keywords: 'usa united states eua pst pacific san francisco seattle',
  },
  { value: 'Europe/Lisbon', label: 'Lisbon', region: 'Europe', keywords: 'portugal wet lisboa' },
  {
    value: 'Europe/London',
    label: 'London',
    region: 'Europe',
    keywords: 'united kingdom uk reino unido gmt bst',
  },
  { value: 'Europe/Madrid', label: 'Madrid', region: 'Europe', keywords: 'spain espanha cet' },
  { value: 'Europe/Paris', label: 'Paris', region: 'Europe', keywords: 'france franca cet' },
  {
    value: 'Europe/Berlin',
    label: 'Berlin',
    region: 'Europe',
    keywords: 'germany alemanha cet amsterdam rome roma',
  },
  { value: 'Africa/Cairo', label: 'Cairo', region: 'Africa', keywords: 'egypt egito eet' },
  { value: 'Africa/Lagos', label: 'Lagos', region: 'Africa', keywords: 'nigeria wat' },
  {
    value: 'Africa/Johannesburg',
    label: 'Johannesburg',
    region: 'Africa',
    keywords: 'south africa africa do sul sast',
  },
  {
    value: 'Asia/Dubai',
    label: 'Dubai',
    region: 'Asia',
    keywords: 'united arab emirates emirados gst',
  },
  {
    value: 'Asia/Kolkata',
    label: 'Mumbai / New Delhi',
    region: 'Asia',
    keywords: 'india ist nova deli',
  },
  {
    value: 'Asia/Singapore',
    label: 'Singapore',
    region: 'Asia',
    keywords: 'sgt kuala lumpur singapura',
  },
  {
    value: 'Asia/Shanghai',
    label: 'Beijing / Shanghai',
    region: 'Asia',
    keywords: 'china cst hong kong pequim xangai',
  },
  { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia', keywords: 'japan japao jst toquio' },
  { value: 'Asia/Seoul', label: 'Seoul', region: 'Asia', keywords: 'korea coreia kst' },
  {
    value: 'Australia/Sydney',
    label: 'Sydney',
    region: 'Oceania',
    keywords: 'australia aest melbourne',
  },
  {
    value: 'Pacific/Auckland',
    label: 'Auckland',
    region: 'Oceania',
    keywords: 'new zealand nova zelandia nzst',
  },
];

/** Props for {@link TimeZonePicker}. */
export interface TimeZonePickerProps {
  /** Controlled IANA zone identifier, for example `"America/Sao_Paulo"`. */
  value?: string;
  /** Initial IANA zone identifier in uncontrolled mode. */
  defaultValue?: string;
  /** Called with the selected IANA zone identifier. */
  onChange?: (zone: string) => void;
  /** Date used to derive the displayed GMT offset. Defaults to the current time. */
  referenceDate?: string | Date;
  /** IANA zones pinned under the recent-zones heading. */
  recentZones?: string[];
  /** IANA zone pinned under the detected-zone heading. */
  detectedZone?: string;
  /** Replaces the curated default zone list. */
  zones?: TimeZoneOption[];
  /** BCP 47 locale used for each option's live local time. Default: `"en-US"`. */
  locale?: string;
  /** Label rendered above the picker. */
  label?: string;
  /** Helper text rendered below the picker. */
  hint?: string;
  /** Error message that replaces `hint` and enables error styling. */
  error?: string;
  /** Trigger text when no zone is selected. Defaults to `labels.placeholder`. */
  placeholder?: string;
  /** Translatable visible and accessible labels, merged over English defaults. */
  labels?: TimeZonePickerLabels;
  /** Disables the picker trigger. */
  disabled?: boolean;
  /** Additional class name appended to `.lyra-tzpicker`. */
  className?: string;
}

function referenceDateFrom(value: Date | string | undefined): Date {
  if (!value) return new Date();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year!, month! - 1, day!, 12);
  }
  return new Date(value);
}

function gmtOffset(timeZone: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
    return offset.replace('UTC', 'GMT') || 'GMT';
  } catch {
    return '';
  }
}

function localTime(timeZone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(
      new Date(),
    );
  } catch {
    return '';
  }
}

function fallbackZone(value: string): TimeZoneOption {
  return {
    value,
    label: value.split('/').at(-1)?.replaceAll('_', ' ') ?? value,
    region: '',
  };
}

function decorateZone(
  zone: TimeZoneOption,
  group: string,
  date: Date,
  locale: string,
): ComboboxOption {
  const offset = gmtOffset(zone.value, date);
  return {
    value: zone.value,
    label: `${zone.label} (${offset})`,
    keywords: `${zone.keywords ?? ''} ${zone.value.replace(/[_/]/g, ' ')} ${offset.toLowerCase()}`,
    group,
    trailing: localTime(zone.value, locale),
  };
}

/** A searchable IANA time-zone picker composed from {@link Combobox}. */
const TimeZonePickerBase = /*#__PURE__*/ forwardRef<HTMLButtonElement, TimeZonePickerProps>(
  function TimeZonePicker(
    {
      value,
      defaultValue,
      onChange,
      referenceDate,
      recentZones = [],
      detectedZone,
      zones,
      locale = 'en-US',
      label,
      hint,
      error,
      placeholder,
      labels: labelsProp,
      disabled = false,
      className,
    },
    ref,
  ) {
    const [, refreshClock] = useReducer((count: number) => count + 1, 0);
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const date = referenceDateFrom(referenceDate);
    const baseZones = zones ?? DEFAULT_ZONES;

    useEffect(() => {
      const interval = window.setInterval(refreshClock, 60_000);
      return () => window.clearInterval(interval);
    }, []);

    const byValue = (zone: string): TimeZoneOption =>
      baseZones.find((candidate) => candidate.value === zone) ?? fallbackZone(zone);
    const pinned: Array<{ zone: TimeZoneOption; group: string }> = [];
    const pinnedValues = new Set<string>();
    if (detectedZone) {
      pinned.push({ zone: byValue(detectedZone), group: labels.detectedGroup });
      pinnedValues.add(detectedZone);
    }
    for (const zone of recentZones) {
      if (!pinnedValues.has(zone)) {
        pinned.push({ zone: byValue(zone), group: labels.recentGroup });
        pinnedValues.add(zone);
      }
    }
    const options = [
      ...pinned.map(({ zone, group }) => decorateZone(zone, group, date, locale)),
      ...baseZones
        .filter((zone) => !pinnedValues.has(zone.value))
        .map((zone) => decorateZone(zone, zone.region, date, locale)),
    ];

    return (
      <Combobox
        ref={ref}
        className={cx('lyra-tzpicker', className)}
        label={label}
        hint={hint}
        error={error}
        options={options}
        value={value}
        defaultValue={defaultValue}
        // Combobox reports option metadata too; TimeZonePicker deliberately preserves its
        // one-argument public contract and exposes IANA identifiers only.
        onChange={(zone) => onChange?.(zone)}
        placeholder={placeholder ?? labels.placeholder}
        searchPlaceholder={labels.searchPlaceholder}
        emptyMessage={labels.emptyMessage}
        disabled={disabled}
      />
    );
  },
);

/** Curated IANA zone list used unless {@link TimeZonePickerProps.zones} is supplied. */
export const TimeZonePicker = /*#__PURE__*/ Object.assign(TimeZonePickerBase, {
  ZONES: DEFAULT_ZONES,
});
