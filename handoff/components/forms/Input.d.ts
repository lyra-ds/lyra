/**
 * Campo de texto com label, hint e erro.
 * @startingPoint section="Primitives" subtitle="Input com label, hint e estado de erro" viewport="700x180"
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rótulo acima do campo */
  label?: string;
  /** Texto auxiliar abaixo do campo */
  hint?: string;
  /** Mensagem de erro — ativa o estilo de erro e substitui o hint */
  error?: string;
  /** Padrão md (40px) */
  size?: "sm" | "md" | "lg";
  /** Ícone à esquerda dentro do campo (ex. <Icon name="search" size={16}/>) */
  iconLeft?: React.ReactNode;
}
export declare function Input(props: InputProps): JSX.Element;
