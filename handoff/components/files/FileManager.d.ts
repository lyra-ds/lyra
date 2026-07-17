/**
 * Gestor de arquivos — busca, alternância lista/grade, breadcrumb de pasta
 * e ações por item (abrir, renomear, baixar, excluir) via Dropdown.
 */
export interface ManagedFile {
  id: string;
  name: string;
  /** "folder" agrupa no topo e usa ícone de pasta; omita para arquivo */
  type?: "folder";
  /** Bytes — formatado automaticamente (KB/MB/GB) */
  size?: number;
  /** Nº de itens (pastas) */
  items?: number;
  /** Texto livre, ex. "há 2 dias" */
  updated?: string;
  /** Mostra indicador de compartilhamento */
  shared?: boolean;
}
export interface FileManagerProps {
  files?: ManagedFile[];
  /** Breadcrumb da pasta atual, ex. ["Meu Drive", "Projetos"] */
  path?: string[];
  /** Modo controlado de exibição */
  view?: "list" | "grid";
  /** Padrão "list" */
  defaultView?: "list" | "grid";
  onViewChange?: (view: "list" | "grid") => void;
  /** Clique no nome/card (abrir pasta ou arquivo) */
  onOpen?: (file: ManagedFile) => void;
  /** Clique num segmento do breadcrumb (recebe o índice) */
  onNavigate?: (index: number) => void;
  /** Substitui o menu de ações padrão; retorne itens de Dropdown */
  actions?: (file: ManagedFile) => any[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}
export declare function FileManager(props: FileManagerProps): JSX.Element;
