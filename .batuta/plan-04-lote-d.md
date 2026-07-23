# Plano — Fase 4 / Lote D (últimos 9 componentes)

Preparado em 2026-07-21. Fecha a Fase 4 (conversão dos 40 componentes).
Progresso ao iniciar: **29/40**. Todos os 9 restantes já têm família de classes
`.lyra-*` completa em `packages/styles` (verificado) — nenhum styling novo,
exceto 2 promoções CSS-first pontuais (Toast, Drawer close).

Regras de sempre nos briefs: `packages/react/CONVENTIONS.md`,
`.batuta/research-apg-focus-models.md`, receita por pilot (Button/Input/Dialog/
Icon), matriz de teste (smoke light/dark + teclado + axe + SSR), exports map ==
tsup entry == dist basename, size-limit, changeset. Bloco compartilhado reusável
já existe no scratchpad da sessão (`brief-shared-block.md`).

## Inventário dos 9 restantes

| Componente            | Arquivo handoff                  | Pilot / receita                                         | Classes `.lyra-*`                                                                                                                                                       | Notas                                                                                                                                                                                                                                        |
| --------------------- | -------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table                 | data/Table                       | Button (simples, div+ref)                               | `.lyra-table`, `--hover`, `__primary`, `-wrap`                                                                                                                          | Colunas declarativas; `hover` → `--hover`; `align` por coluna                                                                                                                                                                                |
| SidebarGroup          | navigation/SidebarGroup          | Input-ish (estado leve)                                 | `.lyra-sbgroup*` (label, `--btn`, `__chev`, `--collapsed`, `__item`, `--active`, `-badge`, `-icon`, `-label`, `__items`)                                                | Colapsável (disclosure) quando `collapsible`; item ativo `aria-current="page"`                                                                                                                                                               |
| Toast + ToastStack    | feedback/Toast                   | Button/Alert (presentacional)                           | `.lyra-toast`, `__close`, `__icon--{info,success,danger}`, `-stack`                                                                                                     | **PROMOÇÃO**: ícone `style inline-flex` → `.lyra-toast__icon` (fim de feedback.css + parity). `role="status"` polite (não mover foco). `onClose` mostra `×`                                                                                  |
| CookieBanner          | feedback/CookieBanner            | Alert + efeito                                          | `.lyra-cookies`, `__text`, `__actions`                                                                                                                                  | Persistência `localStorage[storageKey]`; **retorna `null`** se já consentido; **guard SSR** (sem `localStorage` no server — ler só em effect)                                                                                                |
| Drawer                | feedback/Drawer                  | **Dialog (overlay)**                                    | `.lyra-drawer`, `-overlay`, `__header`, `__title`, `__body`, `__footer`                                                                                                 | Portal + focus trap + scroll lock + Esc + restaura foco. `open`/`onClose`/`title`/`footer`. **PROMOÇÃO**: close button `style width/height 28` (empresta `.lyra-tag__remove`) → `.lyra-drawer__close` (padrão D-19 do `.lyra-dialog__close`) |
| CreateWorkspaceDialog | navigation/CreateWorkspaceDialog | **Dialog + form (composto)**                            | `.lyra-wscreate*` (`__preview`, `-hint`, `__slug`, `-input`, `-prefix`)                                                                                                 | Compõe Dialog + Input; slug auto-gerado do nome (editável); preview de avatar; `onCreate({name,slug})`                                                                                                                                       |
| WorkspaceSwitcher     | navigation/WorkspaceSwitcher     | **Dropdown/popover (composto)**                         | `.lyra-wssw*` (`__trigger`, `__pop`, `-label`, `__item`, `__name`, `__plan`, `__id`, `__meta`, `__sep`, `__plus`, `__create-label`)                                     | Popover com lista de workspaces + ação "Criar" (`onCreate`). Reusar o modelo de foco/teclado do Dropdown já entregue                                                                                                                         |
| CommandPalette        | navigation/CommandPalette        | **Dialog + Combobox activedescendant (o mais difícil)** | `.lyra-cmdk*` (overlay, `__search`, `__body`, `__group`, `-label`, `__item`, `--active`, `-icon`, `-label`, `-hint`, `__shortcut`, `__footer`, `__empty`) + `.lyra-kbd` | Overlay modal (focus trap) + combobox com `aria-activedescendant` sobre lista filtrada agrupada; hotkey global ⌘K/Ctrl+K (`hotkey`, default "k"); modo `inline` (sem overlay). Modelo cmdk do research                                       |
| FileManager           | files/FileManager                | **Composto (Dropdown+Breadcrumb+Input+toggle)**         | `.lyra-fm*` (toolbar, search, views, view/--on, list, row, cell, name, label, icon/--folder/--big, shared, more, actions, grid, card*, crumb, path, empty)              | Busca + toggle lista/grade (controlado/`defaultView`) + breadcrumb de pasta + ações por item via Dropdown (`actions(file)`). Formata bytes KB/MB/GB; pastas agrupam no topo                                                                  |

## Sub-lotes e roteamento (4 rodadas codex)

Dependências: todas satisfeitas (Dialog, Dropdown, Breadcrumb, Input, Combobox já
em `main`). Sem ordem obrigatória entre os 9. Agrupados por receita/risco:

1. **D1 — presentacionais + comportamento leve (4):** Table, SidebarGroup,
   Toast/ToastStack, CookieBanner. → codex `gpt-5.6-terra` reasoning high.
   Promoção do Toast icon aqui.
2. **D2 — overlays + composições (3):** Drawer, CreateWorkspaceDialog,
   WorkspaceSwitcher. → codex `gpt-5.6-terra` reasoning high. Promoção do Drawer
   close aqui. Reusa pilot Dialog + Dropdown já entregues.
3. **D3a — CommandPalette (solo):** o componente mais complexo (overlay+combobox+
   hotkey global+inline). → codex reasoning high, brief dedicado.
4. **D3b — FileManager (solo):** composto grande. → codex reasoning high, brief
   dedicado.

Cada rodada: verificação do maestro (diff + suíte completa + gates + critérios),
commit por rodada, e ao fim do Lote D um único PR para `main` (padrão dos lotes
A–C). Fecha a Fase 4 em 40/40.

## Riscos anotados

- Instabilidade do codex nesta sessão (scout e 1 retry morreram sem output). Se
  uma rodada morrer, re-despachar; se produzir bug pequeno e bem-entendido,
  escalar p/ maestro (como no fix dos testes do C1) em vez de retry cego.
- CommandPalette e FileManager são os de maior blast radius — por isso solo, com
  verificação isolada antes de seguir.
- `role="status"`/polite do Toast: só re-checar se axe reclamar (incerteza
  registrada no research).
