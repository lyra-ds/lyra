/**
 * Dialog modal controlado.
 */
export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Controla a visibilidade */
  open: boolean;
  /** Chamado no ×, no clique fora */
  onClose?: () => void;
  title: React.ReactNode;
  /** Botões de ação (alinhados à direita) */
  footer?: React.ReactNode;
  children: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
