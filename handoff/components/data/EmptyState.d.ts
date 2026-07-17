/**
 * Estado vazio convidativo.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Normalmente <Icon name="…" size={24}/> */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Normalmente um <Button> */
  action?: React.ReactNode;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
