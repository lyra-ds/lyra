/**
 * Tooltip de hover/focus.
 */
export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Texto do tooltip (uma linha curta) */
  tip: string;
  /** O elemento alvo */
  children: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
