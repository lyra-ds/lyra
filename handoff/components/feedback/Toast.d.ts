/**
 * Notificação transitória.
 */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Colore o ícone. Padrão "info" */
  tone?: "info" | "success" | "danger";
  icon?: React.ReactNode;
  /** Mostra o × quando presente */
  onClose?: () => void;
  children: React.ReactNode;
}
export declare function Toast(props: ToastProps): JSX.Element;

export interface ToastStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export declare function ToastStack(props: ToastStackProps): JSX.Element;
