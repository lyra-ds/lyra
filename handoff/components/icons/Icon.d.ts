/**
 * Ícone Lucide colorido via currentColor.
 * @startingPoint section="Primitives" subtitle="Ícone Lucide com cor herdada" viewport="700x150"
 */
export interface IconProps {
  /** Nome Lucide em kebab-case, ex. "arrow-right", "search", "layout-dashboard" */
  name: string;
  /** Lado em px. Padrão 20 (16 para inline, 24 para destaque) */
  size?: number;
  /** Cor CSS; padrão currentcolor */
  color?: string;
  /** Rótulo acessível; sem ele o ícone é decorativo (aria-hidden) */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
