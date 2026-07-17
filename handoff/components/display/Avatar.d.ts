/**
 * Avatar com imagem ou iniciais.
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** URL da imagem; sem ela, mostra iniciais de `name` */
  src?: string;
  /** Nome completo — gera iniciais e title */
  name?: string;
  /** Padrão "md" (32px) */
  size?: "sm" | "md" | "lg" | "xl";
  /** "square" para workspaces/organizações. Padrão "circle" */
  shape?: "circle" | "square";
  /** Ponto de presença */
  status?: "online" | "busy" | "away";
}
export declare function Avatar(props: AvatarProps): JSX.Element;

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}
export declare function AvatarGroup(props: AvatarGroupProps): JSX.Element;
