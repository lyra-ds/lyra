/**
 * Radio com rótulo embutido.
 */
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rótulo clicável à direita */
  label?: React.ReactNode;
  /** Agrupe radios com o mesmo name */
  name?: string;
}
export declare function Radio(props: RadioProps): JSX.Element;
