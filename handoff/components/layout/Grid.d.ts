/**
 * Grid de layout — colunas fixas ou responsivas.
 */
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nº de colunas iguais ou template CSS (ex. "2fr 1fr"). Padrão 2 */
  columns?: number | string;
  /** Largura mínima por item em px — ativa auto-fit responsivo e ignora columns */
  minItem?: number;
  /** Passo da escala de espaço ou string CSS. Padrão 4 */
  gap?: number | string;
}
export declare function Grid(props: GridProps): JSX.Element;
