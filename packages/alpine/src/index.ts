import { lyraDropdown } from './dropdown';
import type { LyraDropdownOptions } from './dropdown';
import { lyraDialog } from './dialog';
import type { LyraDialogOptions } from './dialog';
import { lyraDrawer } from './drawer';
import type { LyraDrawerOptions } from './drawer';
import { lyraBottomSheet } from './bottom-sheet';
import type { LyraBottomSheetOptions } from './bottom-sheet';
import { lyraTabs } from './tabs';
import type { LyraTabsOptions } from './tabs';
import { lyraAccordion } from './accordion';
import type { LyraAccordionOptions } from './accordion';
import { lyraTooltip } from './tooltip';
import type { LyraTooltipOptions } from './tooltip';
import { lyraPopover } from './popover';
import type { LyraPopoverOptions } from './popover';
import { lyraCodeBlock } from './code-block';
import { lyraCookieBanner } from './cookie-banner';
import type { LyraCookieBannerOptions } from './cookie-banner';
import { lyraSidebarGroup } from './sidebar-group';
import type { LyraSidebarGroupOptions } from './sidebar-group';
import { lyraAppSidebar } from './app-sidebar';
import type { LyraAppSidebarOptions } from './app-sidebar';
import { lyraSegmentedControl } from './segmented-control';
import type { LyraSegmentedControlOptions } from './segmented-control';
import { lyraWorkspaceSwitcher } from './workspace-switcher';
import type { LyraWorkspaceSwitcherOptions } from './workspace-switcher';
import { lyraTableOfContents } from './table-of-contents';
import type { LyraTableOfContentsOptions } from './table-of-contents';
import { lyraTimeInput } from './time-input';
import type { LyraTimeInputOptions } from './time-input';
import { lyraTimePicker } from './time-picker';
import type { LyraTimePickerOptions } from './time-picker';
import { lyraFileUpload } from './file-upload';
import type { LyraFileUploadOptions } from './file-upload';
import { lyraFileManager } from './file-manager';
import type { LyraFileManagerOptions } from './file-manager';
import { lyraTheme } from './theme';
import { lyraToastStack, lyraToasts } from './toasts';
import { lyraCalendar } from './calendar';
import type { LyraCalendarOptions } from './calendar';
import { lyraDatePicker } from './date-picker';
import type { LyraDatePickerOptions } from './date-picker';
import { lyraDateRangePicker } from './date-range-picker';
import type { LyraDateRangePickerOptions } from './date-range-picker';
import { lyraCombobox } from './combobox';
import type { LyraComboboxOptions } from './combobox';
import { lyraTimeZonePicker } from './time-zone-picker';
import type { LyraTimeZonePickerOptions } from './time-zone-picker';
import { lyraCommandPalette } from './command-palette';
import type { LyraCommandPaletteOptions } from './command-palette';
import { lyraDataTable } from './data-table';
import type { LyraDataTableOptions } from './data-table';
import { lyraRecurrenceSelector } from './recurrence-selector';
import type { LyraRecurrenceSelectorOptions } from './recurrence-selector';
import { lyraSlotPicker } from './slot-picker';
import type { LyraSlotPickerOptions } from './slot-picker';
import { lyraWeeklyScheduleEditor } from './weekly-schedule-editor';
import type { LyraWeeklyScheduleEditorOptions } from './weekly-schedule-editor';

export { TIME_ZONE_PICKER_ZONES } from './time-zone-picker';
export type {
  LyraTimeZonePickerData,
  LyraTimeZonePickerLabels,
  LyraTimeZonePickerOption,
  LyraTimeZonePickerOptions,
} from './time-zone-picker';
export type { LyraDataTableOptions, LyraDataTableSorting } from './data-table';
export type { LyraAppSidebarLabels, LyraAppSidebarOptions } from './app-sidebar';
export type {
  LyraToastOptions,
  LyraToastStackData,
  LyraToastsStore,
  QueuedToast,
  ToastTone,
} from './toasts';
export { DEFAULT_LABELS, describeRecurrence } from './recurrence-selector';
export type {
  LyraRecurrenceSelectorOptions,
  RecurrenceConflict,
  RecurrenceEnd,
  RecurrenceRule,
  RecurrenceSelectorLabels,
} from './recurrence-selector';
export type { LyraSlot, LyraSlotPickerLabels, LyraSlotPickerOptions } from './slot-picker';
export type {
  DateException,
  LyraWeeklyScheduleEditorOptions,
  TimeRange,
  Weekday,
  WeeklySchedule,
  WeeklyScheduleEditorLabels,
} from './weekly-schedule-editor';
export type { LyraAccordionOptions } from './accordion';
export type { LyraBottomSheetOptions } from './bottom-sheet';
export type { LyraCalendarLabels, LyraCalendarOptions, LyraCalendarRange } from './calendar';
export type {
  LyraCommandPaletteGroup,
  LyraCommandPaletteHints,
  LyraCommandPaletteItem,
  LyraCommandPaletteOptions,
} from './command-palette';
export type { LyraCookieBannerOptions } from './cookie-banner';
export type { LyraDatePickerOptions } from './date-picker';
export type { LyraDateRangePickerOptions } from './date-range-picker';
export type { LyraDialogOptions } from './dialog';
export type { LyraDrawerOptions } from './drawer';
export type { LyraDropdownOptions } from './dropdown';
export type { LyraFileManagerOptions } from './file-manager';
export { lyraFileUpload } from './file-upload';
export type {
  LyraFileUploadAction,
  LyraFileUploadBinding,
  LyraFileUploadCancelDetail,
  LyraFileUploadData,
  LyraFileUploadError,
  LyraFileUploadItem,
  LyraFileUploadMessages,
  LyraFileUploadOptions,
  LyraFileUploadProgress,
  LyraFileUploadRemoveDetail,
  LyraFileUploadRetryDetail,
  LyraFileUploadSelectDetail,
  LyraFileUploadSelection,
} from './file-upload';
export type { LyraPopoverOptions } from './popover';
export type { LyraSegmentedControlOptions } from './segmented-control';
export type { LyraSidebarGroupOptions } from './sidebar-group';
export type { LyraTableOfContentsOptions } from './table-of-contents';
export type { LyraTabsOptions } from './tabs';
export type { LyraThemeStore } from './theme';
export type { LyraTimeInputOptions } from './time-input';
export type { LyraTimePickerLabels, LyraTimePickerOptions } from './time-picker';
export type { LyraTooltipOptions } from './tooltip';
export type { LyraWorkspaceSwitcherOptions } from './workspace-switcher';

/**
 * Structural slice of the Alpine instance that the Lyra plugin actually uses.
 *
 * Deliberately local instead of `import type { Alpine } from 'alpinejs'`: alpinejs
 * ships no types (they live in @types/alpinejs), so referencing them in the public
 * signature would break type resolution for every consumer without that devDep.
 * Structurally compatible with both the real Alpine instance and @types/alpinejs.
 */
export interface LyraAlpine {
  /** Registers a reusable `x-data` component (`Alpine.data(name, factory)`). */
  data(name: string, factory: (...args: unknown[]) => Record<string, unknown>): void;
  /** Registers a global reactive store (`Alpine.store(name, value)`). */
  store(name: string, value: unknown): void;
}

/**
 * Lyra DS plugin for Alpine.js — registers one `Alpine.data()` per interactive
 * component, porting the exact state machine of its `@lyra-ds/react` counterpart
 * (same modifier classes, ARIA, `inert`, focus/scroll-lock/keyboard handling).
 *
 * ```js
 * import Alpine from 'alpinejs';
 * import lyra from '@lyra-ds/alpine';
 *
 * Alpine.plugin(lyra);
 * Alpine.start();
 * ```
 */
export default function lyra(alpine: LyraAlpine): void {
  alpine.store('theme', lyraTheme());
  alpine.store('lyraToasts', lyraToasts());
  alpine.data('lyraToastStack', () => lyraToastStack() as unknown as Record<string, unknown>);
  alpine.data(
    'lyraDialog',
    (...args) =>
      lyraDialog((args[0] ?? {}) as LyraDialogOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraDropdown',
    (...args) =>
      lyraDropdown((args[0] ?? {}) as LyraDropdownOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraDrawer',
    (...args) =>
      lyraDrawer((args[0] ?? {}) as LyraDrawerOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraBottomSheet',
    (...args) =>
      lyraBottomSheet((args[0] ?? {}) as LyraBottomSheetOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraTabs',
    (...args) => lyraTabs((args[0] ?? {}) as LyraTabsOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraAccordion',
    (...args) =>
      lyraAccordion((args[0] ?? {}) as LyraAccordionOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraTooltip',
    (...args) =>
      lyraTooltip((args[0] ?? {}) as LyraTooltipOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraPopover',
    (...args) =>
      lyraPopover((args[0] ?? {}) as LyraPopoverOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraSidebarGroup',
    (...args) =>
      lyraSidebarGroup((args[0] ?? {}) as LyraSidebarGroupOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraAppSidebar',
    (...args) =>
      lyraAppSidebar((args[0] ?? {}) as LyraAppSidebarOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraWorkspaceSwitcher',
    (...args) =>
      lyraWorkspaceSwitcher((args[0] ?? {}) as LyraWorkspaceSwitcherOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data('lyraCodeBlock', () => lyraCodeBlock() as unknown as Record<string, unknown>);
  alpine.data(
    'lyraCookieBanner',
    (...args) =>
      lyraCookieBanner((args[0] ?? {}) as LyraCookieBannerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraSegmentedControl',
    (...args) =>
      lyraSegmentedControl((args[0] ?? {}) as LyraSegmentedControlOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraTableOfContents',
    (...args) =>
      lyraTableOfContents((args[0] ?? {}) as LyraTableOfContentsOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraTimeInput',
    (...args) =>
      lyraTimeInput((args[0] ?? {}) as LyraTimeInputOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraTimePicker',
    (...args) =>
      lyraTimePicker((args[0] ?? {}) as LyraTimePickerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraFileUpload',
    (...args) =>
      lyraFileUpload((args[0] ?? {}) as LyraFileUploadOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraFileManager',
    (...args) =>
      lyraFileManager((args[0] ?? {}) as LyraFileManagerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraCalendar',
    (...args) =>
      lyraCalendar((args[0] ?? {}) as LyraCalendarOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraDatePicker',
    (...args) =>
      lyraDatePicker((args[0] ?? {}) as LyraDatePickerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraDateRangePicker',
    (...args) =>
      lyraDateRangePicker((args[0] ?? {}) as LyraDateRangePickerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraCombobox',
    (...args) =>
      lyraCombobox((args[0] ?? {}) as LyraComboboxOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraTimeZonePicker',
    (...args) =>
      lyraTimeZonePicker((args[0] ?? {}) as LyraTimeZonePickerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraCommandPalette',
    (...args) =>
      lyraCommandPalette((args[0] ?? {}) as LyraCommandPaletteOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraDataTable',
    (...args) =>
      lyraDataTable((args[0] ?? {}) as LyraDataTableOptions) as unknown as Record<string, unknown>,
  );
  alpine.data(
    'lyraRecurrenceSelector',
    (...args) =>
      lyraRecurrenceSelector((args[0] ?? {}) as LyraRecurrenceSelectorOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraSlotPicker',
    (...args) =>
      lyraSlotPicker((args[0] ?? {}) as LyraSlotPickerOptions) as unknown as Record<
        string,
        unknown
      >,
  );
  alpine.data(
    'lyraWeeklyScheduleEditor',
    (...args) =>
      lyraWeeklyScheduleEditor(
        (args[0] ?? {}) as LyraWeeklyScheduleEditorOptions,
      ) as unknown as Record<string, unknown>,
  );
}
