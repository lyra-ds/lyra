/**
 * Tag neutra para rótulos e filtros.
 */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Se presente, mostra o × de remoção */
  onRemove?: () => void;
  children: React.ReactNode;
}
export declare function Tag(props: TagProps): JSX.Element;
