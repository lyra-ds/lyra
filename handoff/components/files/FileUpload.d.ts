/**
 * Upload múltiplo — dropzone com drag & drop, lista de arquivos com
 * progresso individual, validação de tamanho e remoção.
 */
export interface FileUploadItem {
  id: string;
  name: string;
  size?: number;
  /** 0–100 */
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}
export interface FileUploadProps {
  /** Texto principal da dropzone */
  label?: string;
  /** Texto auxiliar (sobrepõe o gerado por accept/maxSizeMB) */
  hint?: string;
  /** Ex. ".pdf,.png" — passado ao input e exibido no hint */
  accept?: string;
  /** Arquivos acima disso entram com status "error" */
  maxSizeMB?: number;
  /** Padrão true */
  multiple?: boolean;
  /** Duração da simulação de upload em ms. Padrão 1800 */
  uploadDuration?: number;
  /** Itens pré-existentes (para demos/estado inicial) */
  defaultItems?: FileUploadItem[];
  /** Chamado com os File[] reais ao adicionar */
  onFiles?: (files: File[]) => void;
  /** Chamado com a lista de itens a cada mudança */
  onChange?: (items: FileUploadItem[]) => void;
  className?: string;
}
export declare function FileUpload(props: FileUploadProps): JSX.Element;
