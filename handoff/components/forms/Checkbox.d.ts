/**
 * Checkbox com rótulo embutido.
 */
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rótulo clicável à direita */
  label?: React.ReactNode;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
