/**
 * Slide-over lateral para formulários e detalhes.
 */
export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  /** Ações fixas no rodapé */
  footer?: React.ReactNode;
  children: React.ReactNode;
}
export declare function Drawer(props: DrawerProps): JSX.Element | null;
