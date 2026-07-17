/**
 * Banner de consentimento de cookies (LGPD), com persistência embutida.
 */
export interface CookieBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Chave do localStorage onde a escolha é salva. Padrão "lyra-cookie-consent" */
  storageKey?: string;
  /** Link da política de privacidade */
  policyHref?: string;
  /** Chamado ao aceitar todos */
  onAccept?: () => void;
  /** Chamado ao manter somente essenciais */
  onEssentials?: () => void;
  /** Texto customizado (substitui o padrão LGPD) */
  children?: React.ReactNode;
}
export declare function CookieBanner(props: CookieBannerProps): JSX.Element | null;
