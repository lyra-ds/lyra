/**
 * Área de texto multi-linha.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}
export declare function Textarea(props: TextareaProps): JSX.Element;
