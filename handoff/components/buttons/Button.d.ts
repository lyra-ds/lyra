/**
 * Botão padrão do Lyra DS.
 * @startingPoint section="Primitives" subtitle="Botão em 5 variantes e 3 tamanhos" viewport="700x190"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Padrão "primary" */
  variant?: "primary" | "secondary" | "soft" | "ghost" | "danger";
  /** Padrão "md" (40px) */
  size?: "sm" | "md" | "lg";
  /** Ícone à esquerda do rótulo (normalmente <Icon size={16}/>) */
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Mostra spinner e bloqueia interação */
  loading?: boolean;
  /** Ocupa 100% da largura */
  full?: boolean;
}
export declare function Button(props: ButtonProps): JSX.Element;
