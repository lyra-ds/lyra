/**
 * Switch liga/desliga.
 */
export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rótulo à direita do trilho */
  label?: React.ReactNode;
}
export declare function Switch(props: SwitchProps): JSX.Element;
