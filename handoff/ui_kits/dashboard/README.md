# UI kit · Lyra Dashboard

Dashboard SaaS de exemplo mostrando o Lyra DS em uso real (o "produto" é o próprio painel do projeto open source).

- `index.html` — app interativo: navegação por sidebar agrupada (Visão geral / Projetos / Arquivos / Membros / Cobrança / Configurações), WorkspaceSwitcher com criação de workspace, CommandPalette ⌘K, dropdown de usuário no header, tema claro/escuro persistente.
- `shell.jsx` — `LyraSidebar` (WorkspaceSwitcher + SidebarGroup + CreateWorkspaceDialog), `LyraTopbar` (busca ⌘K, tema, notificações, Dropdown do avatar), `LyraCommandPalette`.
- `screens.jsx` — `OverviewScreen` (stats + gráfico de barras + tabela + metas), `ProjectsScreen` (cards de projeto + dialog), `SettingsScreen` (formulários + zona de perigo).
- `screens-admin.jsx` — `MembersScreen` (tabela + drawer de convite com Combobox de papel), `BillingScreen` (planos + pagamento).
- `screens-files.jsx` — `FilesScreen` (FileManager com navegação em pastas + FileUpload).

Tudo composto com os primitivos de `components/` via `window.LyraDesignSystem_e82d95` — nada de re-implementação de Button/Card aqui. O gráfico de barras é desenhado com divs + tokens (sem lib de chart).
