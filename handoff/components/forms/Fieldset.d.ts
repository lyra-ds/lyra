/**
 * Fieldset semântico — legenda, descrição e pilha de campos.
 */
export interface FieldsetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}
export declare function Fieldset(props: FieldsetProps): JSX.Element;

/**
 * Linha de formulário — campos lado a lado, colapsa no mobile.
 */
export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nº de colunas. Padrão: nº de filhos */
  columns?: number;
  children: React.ReactNode;
}
export declare function FormRow(props: FormRowProps): JSX.Element;
