/**
 * Placeholder de carregamento com shimmer.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Padrão "100%" */
  width?: number | string;
  /** Padrão 14 */
  height?: number | string;
  /** Círculo (para avatares) — usa height como diâmetro */
  circle?: boolean;
}
export declare function Skeleton(props: SkeletonProps): JSX.Element;
