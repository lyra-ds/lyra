/** A selectable option in {@link SegmentedControl}. */
export interface SegmentedControlOption {
  /** Stable value reported by `onChange` when this option is selected. */
  value: string;
  /** Visible option content. */
  label: React.ReactNode;
  /** Prevent selection and keyboard focus for this option. */
  disabled?: boolean;
}

/** Props for {@link SegmentedControl}. */
export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Options rendered in keyboard-navigation order. Provide at least two options. */
  options: SegmentedControlOption[];
  /** Currently selected option value. */
  value: string;
  /** Called with the next value after pointer or keyboard selection. */
  onChange: (value: string) => void;
  /** Translated accessible name for the radiogroup. */
  label: string;
}
export declare function SegmentedControl(props: SegmentedControlProps): JSX.Element;
