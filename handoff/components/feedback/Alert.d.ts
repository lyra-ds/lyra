/**
 * Mensagem contextual inline.
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padrão "info" */
  tone?: "info" | "success" | "warning" | "danger";
  /** Linha de título em negrito */
  title?: React.ReactNode;
  /** Normalmente <Icon name="info" size={18}/> */
  icon?: React.ReactNode;
  children: React.ReactNode;
}
export declare function Alert(props: AlertProps): JSX.Element;
