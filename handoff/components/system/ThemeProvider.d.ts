/**
 * Provider de tema — aplica data-theme no <html> e persiste a escolha.
 */
export interface ThemeProviderProps {
  /** Padrão "light" */
  defaultTheme?: "light" | "dark";
  /** Chave do localStorage. Padrão "lyra-theme" */
  storageKey?: string;
  /** Fixa data-brand (white-label) */
  brand?: string;
  children: React.ReactNode;
}
export declare function ThemeProvider(props: ThemeProviderProps): JSX.Element;

/**
 * Hook do tema. Requer <ThemeProvider>. No bundle do preview,
 * acesse via ThemeProvider.useTheme.
 */
export interface ThemeApi {
  theme: "light" | "dark";
  dark: boolean;
  setTheme: (theme: "light" | "dark") => void;
  toggle: () => void;
}
export declare function useTheme(): ThemeApi;
