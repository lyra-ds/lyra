/**
 * Anel de progresso segmentado — categorias nomeadas somando um total.
 * Complementa o Progress (barra 0–100): use o anel como bloco herói de
 * uma tela de progresso; na lista/cartão, prefira Progress + legenda.
 * O anel é decorativo (aria-hidden) — o equivalente textual embutido é
 * a fonte da informação; a legenda nunca deve ser omitida em telas.
 */
export interface RingSegment {
  value: number;
  label: string;
  /** Cor semântica do segmento */
  tone?: "success" | "accent" | "danger" | "warning" | "neutral";
  /** Cor CSS custom (sobrepõe tone) */
  color?: string;
}
export interface SegmentedRingProps extends React.HTMLAttributes<HTMLDivElement> {
  segments?: RingSegment[];
  /** Denominador do anel. Padrão: soma dos segmentos */
  total?: number;
  /** Texto grande no centro (ex.: "5 de 8") */
  centerValue?: React.ReactNode;
  /** Rótulo pequeno sob o número (ex.: "Sessão") */
  centerLabel?: React.ReactNode;
  /** "md" 96px · "lg" 160px. Padrão "lg" */
  size?: "md" | "lg";
  /** Legenda abaixo em vez de ao lado (mobile). Padrão false */
  stacked?: boolean;
  /** Padrão true — não omitir em telas (exigência de acessibilidade) */
  showLegend?: boolean;
}
export declare function SegmentedRing(props: SegmentedRingProps): JSX.Element;
