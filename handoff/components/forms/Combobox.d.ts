/**
 * Select com busca — abre popover com campo de filtro e lista navegável
 * por teclado (↑ ↓ ↵ esc). Fecha ao clicar fora ou selecionar.
 */
export interface ComboboxOption {
  value: string;
  label: string;
  /** Ícone à esquerda da opção (ex. <Icon name="circle" size={15}/>) */
  icon?: React.ReactNode;
  /** Texto secundário à direita do label */
  hint?: string;
  /** Cabeçalho de grupo — opções contíguas com o mesmo group ganham um título */
  group?: string;
  /** Conteúdo alinhado à direita (ex.: hora atual do fuso) */
  trailing?: React.ReactNode;
  /** Termos extras de busca invisíveis (ex.: "gmt-3 brasilia sao paulo") */
  keywords?: string;
}
export interface ComboboxProps {
  /** Rótulo acima do campo */
  label?: string;
  /** Texto auxiliar abaixo do campo */
  hint?: string;
  /** Mensagem de erro — ativa o estilo de erro e substitui o hint */
  error?: string;
  options?: ComboboxOption[];
  /** Valor controlado */
  value?: string;
  /** Valor inicial (não controlado) */
  defaultValue?: string;
  onChange?: (value: string, option: ComboboxOption) => void;
  /** Padrão "Selecionar…" */
  placeholder?: string;
  /** Padrão "Buscar…" */
  searchPlaceholder?: string;
  /** Padrão "Nenhum resultado." */
  emptyMessage?: string;
  disabled?: boolean;
  /** Começa aberto (útil em demos) */
  defaultOpen?: boolean;
  id?: string;
  className?: string;
}
export declare function Combobox(props: ComboboxProps): JSX.Element;
