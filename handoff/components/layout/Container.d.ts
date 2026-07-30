/**
 * Container central de conteúdo — max-width tokenizada + gutter lateral.
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sobrepõe var(--container-max), em px */
  max?: number;
}
export declare function Container(props: ContainerProps): JSX.Element;
