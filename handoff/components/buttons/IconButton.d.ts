/**
 * Botão quadrado só-ícone com aria-label obrigatório.
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Rótulo acessível (obrigatório) — vira aria-label e title */
  label: string;
  /** Padrão "secondary" */
  variant?: "primary" | "secondary" | "soft" | "ghost" | "danger";
  /** Padrão "md" (40×40) */
  size?: "sm" | "md" | "lg";
  /** O ícone, normalmente <Icon name="…" /> */
  children: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
