import { lyraCombobox } from './combobox';
import type { LyraComboboxOption, LyraComboboxOptions } from './combobox';

/** A selectable IANA time zone. */
export interface LyraTimeZonePickerOption {
  /** IANA zone identifier, for example `"America/Sao_Paulo"`. */
  value: string;
  /** Human-readable city or region label. */
  label: string;
  /** Presentational region heading for the option. */
  region: string;
  /** Extra search terms such as abbreviations and covered cities. */
  keywords?: string;
}

/** Translatable labels for {@link lyraTimeZonePicker}, merged over the English defaults. */
export interface LyraTimeZonePickerLabels {
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

const DEFAULT_LABELS: Required<LyraTimeZonePickerLabels> = {
  placeholder: 'Select time zone',
  searchPlaceholder: 'Search city, country, or abbreviation…',
  emptyMessage: 'No time zones found.',
  detectedGroup: 'Detected',
  recentGroup: 'Recent',
};

/** Curated IANA zone list used unless `zones` is supplied to {@link lyraTimeZonePicker}. */
export const TIME_ZONE_PICKER_ZONES: readonly LyraTimeZonePickerOption[] = [
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

/** Initial configuration accepted by `x-data="lyraTimeZonePicker(...)"`. */
export interface LyraTimeZonePickerOptions extends Omit<
  LyraComboboxOptions,
  'options' | 'placeholder' | 'searchPlaceholder' | 'emptyMessage'
> {
  /** IANA zones that replace {@link TIME_ZONE_PICKER_ZONES}. */
  zones?: readonly LyraTimeZonePickerOption[];
  /** IANA zones pinned after the detected zone. Default: `[]`. */
  recentZones?: readonly string[];
  /** IANA zone pinned before recent zones. */
  detectedZone?: string;
  /** Date used to derive GMT offsets. A `YYYY-MM-DD` value becomes local noon. */
  referenceDate?: string | Date;
  /** BCP 47 locale used for each option's live local time. Default: `"en-US"`. */
  locale?: string;
  /** Labels merged over the English defaults. */
  labels?: LyraTimeZonePickerLabels;
  /** Trigger text when no zone is selected; overrides `labels.placeholder`. */
  placeholder?: string;
}

interface DecoratedTimeZoneOption extends LyraComboboxOption {
  trailing: string;
}

interface IndexedTimeZoneOption {
  option: DecoratedTimeZoneOption;
  index: number;
}

/** Alpine factory data returned by {@link lyraTimeZonePicker}. */
export type LyraTimeZonePickerData = ReturnType<typeof lyraCombobox> & {
  /** Reactive minute counter used to refresh live local-time strings. */
  clockTick: number;
  /** Builds grouped, decorated options for the canonical combobox template. */
  options(): DecoratedTimeZoneOption[];
};

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

function fallbackZone(value: string): LyraTimeZonePickerOption {
  return {
    value,
    label: value.split('/').at(-1)?.replaceAll('_', ' ') ?? value,
    region: '',
  };
}

function decorateZone(
  zone: LyraTimeZonePickerOption,
  group: string,
  date: Date,
  locale: string,
): DecoratedTimeZoneOption {
  const offset = gmtOffset(zone.value, date);
  return {
    value: zone.value,
    label: `${zone.label} (${offset})`,
    keywords: `${zone.keywords ?? ''} ${zone.value.replace(/[_/]/g, ' ')} ${offset.toLowerCase()}`,
    group,
    trailing: localTime(zone.value, locale),
  };
}

/**
 * A searchable IANA time-zone picker extending {@link lyraCombobox}.
 *
 * `TIME_ZONE_PICKER_ZONES` is the curated default list. Set `zones` to replace it, and use
 * `detectedZone` or `recentZones` to pin entries ahead of its regional groups. The display offset
 * comes from `referenceDate`; the trailing local clock refreshes every minute until Alpine destroys
 * the component. Selection, APG navigation, `value`/`open` modelability, and `lyra:change` are
 * inherited unchanged from `lyraCombobox`.
 *
 * ```html
 * <div class="lyra-combobox lyra-tzpicker"
 *   x-data="lyraTimeZonePicker({ id: 'time-zone', value: selectedZone })"
 *   x-modelable="value" x-model="selectedZone">
 *   <button class="lyra-input lyra-combobox__trigger" x-bind="trigger">
 *     <span x-bind="triggerValue"></span>
 *   </button>
 *   <div class="lyra-combobox__pop" x-bind="pop">
 *     <div class="lyra-combobox__search"><input x-bind="search" aria-label="Search time zones"></div>
 *     <div class="lyra-combobox__list" x-bind="list">
 *       <span class="lyra-combobox__empty" x-bind="empty" x-text="emptyMessage"></span>
 *       <template x-for="({ option, index }, filteredIndex) in filtered()" :key="option.value">
 *         <div>
 *           <template x-if="showGroup(filteredIndex)">
 *             <span class="lyra-combobox__group" role="presentation" x-text="option.group"></span>
 *           </template>
 *           <button class="lyra-combobox__option" type="button" tabindex="-1" role="option"
 *             :id="optionId(index)" :class="optionClass(filteredIndex)"
 *             :aria-selected="optionSelected(option)" @mouseenter="setActive(filteredIndex)"
 *             @click="pick(option)">
 *             <span class="lyra-combobox__option-label"><span x-text="option.label"></span></span>
 *             <span class="lyra-combobox__trailing" x-show="option.trailing" x-text="option.trailing"></span>
 *           </button>
 *         </div>
 *       </template>
 *     </div>
 *   </div>
 * </div>
 * ```
 */
export function lyraTimeZonePicker({
  value,
  open = false,
  disabled = false,
  id,
  error = false,
  describedBy,
  zones,
  recentZones = [],
  detectedZone,
  referenceDate,
  locale = 'en-US',
  labels: labelsProp,
  placeholder,
}: LyraTimeZonePickerOptions = {}): LyraTimeZonePickerData {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const date = referenceDateFrom(referenceDate);
  const baseZones = zones ?? TIME_ZONE_PICKER_ZONES;
  const base = lyraCombobox({
    options: [],
    value,
    open,
    placeholder: placeholder ?? labels.placeholder,
    searchPlaceholder: labels.searchPlaceholder,
    emptyMessage: labels.emptyMessage,
    disabled,
    id,
    error,
    describedBy,
  });
  let interval: number | null = null;

  const state: LyraTimeZonePickerData & ThisType<LyraTimeZonePickerData> = {
    ...base,
    clockTick: 0,

    init() {
      base.init.call(this);
      interval = window.setInterval(() => {
        this.clockTick += 1;
      }, 60_000);
    },

    destroy() {
      if (interval !== null) window.clearInterval(interval);
      interval = null;
      base.destroy.call(this);
    },

    options() {
      this.clockTick;
      const byValue = (zone: string): LyraTimeZonePickerOption =>
        baseZones.find((candidate) => candidate.value === zone) ?? fallbackZone(zone);
      const pinned: Array<{ zone: LyraTimeZonePickerOption; group: string }> = [];
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
      return [
        ...pinned.map(({ zone, group }) => decorateZone(zone, group, date, locale)),
        ...baseZones
          .filter((zone) => !pinnedValues.has(zone.value))
          .map((zone) => decorateZone(zone, zone.region, date, locale)),
      ];
    },

    filtered() {
      const normalizedQuery = this.query
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase();
      return this.options()
        .map((option, index) => ({ option, index }))
        .filter(
          ({ option }) =>
            !normalizedQuery ||
            option.label
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLocaleLowerCase()
              .includes(normalizedQuery) ||
            (option.keywords ?? '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLocaleLowerCase()
              .includes(normalizedQuery),
        ) as IndexedTimeZoneOption[];
    },

    selected() {
      return this.options().find((option) => option.value === this.value);
    },
  };

  return state;
}
