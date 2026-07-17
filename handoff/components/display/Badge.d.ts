/**
 * Badge de status com tons semânticos.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Padrão "neutral" */
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
  /** Ponto de status à esquerda */
  dot?: boolean;
  children: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
