/**
 * Tabs controladas (line ou pills).
 */
export interface TabItem {
  id: string;
  label: React.ReactNode;
  /** Contador opcional no chip */
  count?: number;
  icon?: React.ReactNode;
}
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TabItem[];
  /** id da tab ativa */
  active: string;
  onChange?: (id: string) => void;
  /** "line" (sublinhado, padrão) ou "pills" (segmentado) */
  variant?: "line" | "pills";
}
export declare function Tabs(props: TabsProps): JSX.Element;
