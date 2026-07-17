/**
 * Lista de itens expansíveis (FAQ, detalhes).
 */
export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}
export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  /** id do item aberto inicialmente */
  defaultOpen?: string;
  /** Permite vários abertos ao mesmo tempo. Padrão false */
  multiple?: boolean;
}
export declare function Accordion(props: AccordionProps): JSX.Element;
