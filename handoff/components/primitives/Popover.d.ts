/**
 * Popover primitivo — painel ancorado ao trigger. Base de Dropdown,
 * Combobox, DatePicker e filtros.
 */
export interface PopoverProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Elemento que abre/fecha o painel */
  trigger: React.ReactNode;
  /** Modo controlado */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Lado do painel. Padrão "bottom" */
  side?: "bottom" | "top";
  /** Alinhamento em relação ao trigger. Padrão "start" */
  align?: "start" | "end" | "center";
  /** Largura fixa do painel em px */
  width?: number;
  children: React.ReactNode;
}
export declare function Popover(props: PopoverProps): JSX.Element;

/**
 * Portal para document.body.
 */
export interface PortalProps { children: React.ReactNode; }
export declare function Portal(props: PortalProps): JSX.Element;
