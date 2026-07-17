/* Lyra Dashboard UI kit — tela Arquivos: FileManager + FileUpload */
const { Card: FilesCard, FileManager: LyraFileManager, FileUpload: LyraFileUpload } = window.LyraDesignSystem_e82d95;

const FILES_ROOT = [
  { id: "f1", name: "Brand", type: "folder", items: 4, updated: "há 2 dias", shared: true },
  { id: "f2", name: "Contratos", type: "folder", items: 2, updated: "há 1 semana" },
  { id: "a1", name: "proposta-v3.pdf", size: 1840000, updated: "ontem" },
  { id: "a2", name: "orçamento-2026.xlsx", size: 96000, updated: "há 3 dias" },
  { id: "a3", name: "capa-site.png", size: 2400000, updated: "há 1 semana", shared: true },
];
const FILES_CHILDREN = {
  f1: [
    { id: "b1", name: "lyra-mark.svg", size: 4200, updated: "há 2 dias" },
    { id: "b2", name: "wordmark.svg", size: 3800, updated: "há 2 dias" },
    { id: "b3", name: "paleta.png", size: 880000, updated: "há 5 dias" },
    { id: "b4", name: "guidelines.pdf", size: 5200000, updated: "há 1 semana" },
  ],
  f2: [
    { id: "c1", name: "contrato-acme.pdf", size: 482000, updated: "há 1 semana" },
    { id: "c2", name: "aditivo-2026.pdf", size: 310000, updated: "há 2 semanas" },
  ],
};

function FilesScreen() {
  const [path, setPath] = React.useState(["Meu Drive"]);
  const [folderId, setFolderId] = React.useState(null);
  const files = folderId ? FILES_CHILDREN[folderId] || [] : FILES_ROOT;

  return (
    <div className="ld-grid-2-1">
      <LyraFileManager
        path={path}
        files={files}
        onOpen={(f) => {
          if (f.type === "folder") {
            setFolderId(f.id);
            setPath((p) => [...p, f.name]);
          }
        }}
        onNavigate={(i) => {
          if (i === 0) { setFolderId(null); setPath(["Meu Drive"]); }
        }}
      />
      <FilesCard title="Enviar arquivos">
        <LyraFileUpload
          accept=".pdf,.png,.svg,.xlsx,.zip"
          maxSizeMB={25}
          label="Arraste ou clique para enviar"
        />
      </FilesCard>
    </div>
  );
}

Object.assign(window, { FilesScreen });
