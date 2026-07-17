/**
 * Select nativo estilizado.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  /** <option>s */
  children: React.ReactNode;
}
export declare function Select(props: SelectProps): JSX.Element;
