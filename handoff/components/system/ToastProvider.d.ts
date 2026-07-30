/**
 * Provider de toasts — renderiza a ToastStack e expõe a API via useToast().
 */
export interface ToastProviderProps {
  /** Auto-dismiss em ms; 0 desliga. Padrão 4000 */
  duration?: number;
  children: React.ReactNode;
}
export declare function ToastProvider(props: ToastProviderProps): JSX.Element;

/**
 * Hook de toasts. Requer <ToastProvider>. No bundle do preview,
 * acesse via ToastProvider.useToast.
 */
export interface ToastOptions {
  tone?: "info" | "success" | "danger";
  /** Substitui o ícone padrão do tom */
  icon?: React.ReactNode;
  /** Sobrepõe a duração deste toast */
  duration?: number;
}
export interface ToastApi {
  toast: (message: React.ReactNode, options?: ToastOptions) => number;
  success: (message: React.ReactNode, options?: ToastOptions) => number;
  error: (message: React.ReactNode, options?: ToastOptions) => number;
  info: (message: React.ReactNode, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}
export declare function useToast(): ToastApi;
