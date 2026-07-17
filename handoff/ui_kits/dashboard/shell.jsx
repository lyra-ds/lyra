/* Lyra Dashboard UI kit — shell: Sidebar + Topbar (apresentacional) */
const { Icon, IconButton, Avatar, Badge, Input, Tooltip, Dropdown,
        WorkspaceSwitcher, CreateWorkspaceDialog, SidebarGroup, CommandPalette } = window.LyraDesignSystem_e82d95;

function LyraSidebar({ active, onNavigate }) {
  const [workspaces, setWorkspaces] = React.useState([
    { id: "acme", name: "Acme Inc", plan: "Pro", members: 12 },
    { id: "lab", name: "Lyra Labs", plan: "Free", members: 3 },
  ]);
  const [ws, setWs] = React.useState("acme");
  const [creating, setCreating] = React.useState(false);

  const groups = [
    { label: "Geral", items: [
      { id: "overview", label: "Visão geral", icon: "layout-dashboard" },
      { id: "projects", label: "Projetos", icon: "folder", badge: 8 },
      { id: "files", label: "Arquivos", icon: "hard-drive" },
      { id: "members", label: "Membros", icon: "users" },
    ]},
    { label: "Administração", items: [
      { id: "billing", label: "Cobrança", icon: "credit-card" },
      { id: "settings", label: "Configurações", icon: "settings" },
    ]},
  ];

  return (
    <aside className="ld-sidebar">
      <div className="ld-sidebar__brand">
        <img src="../../assets/lyra-mark.svg" alt="" className="ld-sidebar__mark ld-mark-light" />
        <img src="../../assets/lyra-mark-light.svg" alt="" className="ld-sidebar__mark ld-mark-dark" />
        <span className="ld-sidebar__word">Lyra</span>
        <Badge tone="accent">v1.0</Badge>
      </div>
      <WorkspaceSwitcher
        workspaces={workspaces}
        current={ws}
        onChange={setWs}
        onCreate={() => setCreating(true)}
      />
      <CreateWorkspaceDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={({ name, slug }) => {
          setWorkspaces((prev) => [...prev, { id: slug, name, plan: "Free", members: 1 }]);
          setWs(slug);
        }}
      />
      <nav className="ld-sidebar__nav">
        {groups.map((g) => (
          <SidebarGroup
            key={g.label}
            label={g.label}
            items={g.items.map((n) => ({
              id: n.id,
              label: n.label,
              icon: <Icon name={n.icon} size={17} />,
              badge: n.badge,
              active: active === n.id,
            }))}
            onSelect={(id) => onNavigate(id)}
          />
        ))}
      </nav>
      <div className="ld-sidebar__foot">
        <Avatar name="Ana Souza" status="online" />
        <div className="ld-sidebar__user">
          <span className="ld-sidebar__name">Ana Souza</span>
          <span className="ld-sidebar__mail">ana@lyra.dev</span>
        </div>
        <Tooltip tip="Sair">
          <IconButton label="Sair" variant="ghost" size="sm"><Icon name="log-out" size={16} /></IconButton>
        </Tooltip>
      </div>
    </aside>
  );
}

function LyraTopbar({ title, dark, onToggleTheme, onNavigate, onOpenPalette }) {
  return (
    <header className="ld-topbar">
      <h1 className="ld-topbar__title">{title}</h1>
      <div className="ld-topbar__actions">
        <div className="ld-topbar__search" onMouseDown={(e) => { e.preventDefault(); onOpenPalette && onOpenPalette(); }}>
          <Input iconLeft={<Icon name="search" size={16} />} placeholder="Buscar… (⌘K)" size="sm" readOnly />
        </div>
        <Tooltip tip={dark ? "Tema claro" : "Tema escuro"}>
          <IconButton label="Alternar tema" variant="ghost" onClick={onToggleTheme}>
            <Icon name={dark ? "sun" : "moon"} size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip tip="Notificações">
          <IconButton label="Notificações" variant="ghost"><Icon name="bell" size={18} /></IconButton>
        </Tooltip>
        <Dropdown
          align="end"
          trigger={
            <button type="button" className="ld-topbar__avatar" aria-label="Menu do usuário">
              <Avatar name="Ana Souza" size="md" />
            </button>
          }
          items={[
            { type: "label", label: "ana@lyra.dev" },
            { id: "profile", label: "Perfil", icon: <Icon name="user" size={16} /> },
            { id: "settings", label: "Configurações", icon: <Icon name="settings" size={16} />, onSelect: () => onNavigate && onNavigate("settings") },
            { id: "theme", label: dark ? "Tema claro" : "Tema escuro", icon: <Icon name={dark ? "sun" : "moon"} size={16} />, onSelect: onToggleTheme },
            { type: "separator" },
            { id: "logout", label: "Sair", icon: <Icon name="log-out" size={16} />, danger: true },
          ]}
        />
      </div>
    </header>
  );
}

function LyraCommandPalette({ open, onOpen, onClose, onNavigate }) {
  const go = (screen) => () => onNavigate(screen);
  return (
    <CommandPalette
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      groups={[
        { label: "Ações", items: [
          { id: "new-project", label: "Novo projeto", icon: <Icon name="plus" size={17} />, shortcut: "⌘ N", onSelect: go("projects") },
          { id: "upload", label: "Enviar arquivo", icon: <Icon name="cloud-upload" size={17} />, onSelect: go("files") },
          { id: "invite", label: "Convidar membro", icon: <Icon name="user-plus" size={17} />, onSelect: go("members") },
        ]},
        { label: "Ir para", items: [
          { id: "overview", label: "Visão geral", icon: <Icon name="layout-dashboard" size={17} />, shortcut: "G V", onSelect: go("overview") },
          { id: "projects", label: "Projetos", icon: <Icon name="folder" size={17} />, shortcut: "G P", onSelect: go("projects") },
          { id: "files", label: "Arquivos", icon: <Icon name="hard-drive" size={17} />, shortcut: "G A", onSelect: go("files") },
          { id: "members", label: "Membros", icon: <Icon name="users" size={17} />, shortcut: "G M", onSelect: go("members") },
          { id: "billing", label: "Cobrança", icon: <Icon name="credit-card" size={17} />, onSelect: go("billing") },
          { id: "settings", label: "Configurações", icon: <Icon name="settings" size={17} />, onSelect: go("settings") },
        ]},
      ]}
    />
  );
}

Object.assign(window, { LyraSidebar, LyraTopbar, LyraCommandPalette });
