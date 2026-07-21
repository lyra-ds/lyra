# Research — WAI-ARIA APG focus models (Fase 4, gate dos lotes C/D)

Pesquisa feita em 2026-07-20 (agente de research, fontes APG editor's draft +
precedente React Aria/Radix/Ariakit/cmdk). Decide a escolha silenciosa e cara
de reverter: `aria-activedescendant` vs roving tabindex vs focus trap, por
componente. Briefs dos lotes C/D devem citar este arquivo.

## Decisões por componente (resumo executivo)

| Componente             | Modelo de foco                                                                | Detalhe                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Combobox               | `aria-activedescendant`                                                       | DOM focus fica no input; nunca mover foco real para o listbox                                                                |
| CommandPalette         | Dialog (focus trap) + combobox com `aria-activedescendant`                    | modelo cmdk: dialog modal prende Tab, input mantém foco, activedescendant navega a lista filtrada                            |
| Select                 | Select-only combobox (APG)                                                    | trigger `role="combobox"` mantém foco; `aria-activedescendant` aponta para o `option` no `role="listbox"`; Tab também comita |
| Dropdown (menu button) | Roving tabindex / foco real nos `menuitem`                                    | APG aceita ambos; exemplos APG e Radix usam foco real — mais uniforme entre SRs                                              |
| Tabs                   | Roving tabindex, **ativação automática** no foco                              | APG recomenda automática quando painéis renderizam sem latência                                                              |
| RadioGroup             | Roving tabindex                                                               | setas movem foco E marcam; Tab entra no radio marcado                                                                        |
| Accordion              | SEM roving: todo header no Tab order                                          | Enter/Space alterna; `aria-expanded` + `aria-controls`; evitar `role="region"` com >6 painéis                                |
| Dialog/Drawer          | Focus trap (Tab wrap), Esc fecha, foco restaurado ao invocador                | já implementado no pilot Dialog (D-20)                                                                                       |
| Pagination             | NÃO é widget: `<nav aria-label>` + links no Tab order + `aria-current="page"` | sem navegação por setas                                                                                                      |
| Switch                 | `role="switch"` + `aria-checked`; Space alterna                               | label NUNCA muda com o estado                                                                                                |
| Tooltip                | `role="tooltip"` + `aria-describedby` no trigger; foco fica no trigger        | Esc fecha; hover persiste sobre trigger OU tooltip (WCAG 1.4.13); sem conteúdo interativo                                    |
| Toast                  | `role="status"` (polite) para não-urgente; `role="alert"` só para urgente     | nunca mover foco; auto-dismiss precisa de timeout generoso/pause-on-hover; ações precisam de caminho por teclado             |

## Regras críticas de implementação

### Combobox / Select / CommandPalette (activedescendant)

- Input: `role="combobox"`, `aria-expanded`, `aria-controls`→listbox id,
  `aria-autocomplete`, `aria-activedescendant`→option ativa (removido quando
  nenhuma). Popup: `role="listbox"`, itens `role="option"` +
  `aria-selected="true"` na selecionada (única).
- **Resetar `aria-activedescendant` para o primeiro resultado a cada filtro**
  (re-render invalida o id silenciosamente).
- Scroll-into-view manual da opção ativa (foco DOM não move, não há scroll nativo).
- Mitigações de screen-reader (precedente React Aria): `aria-selected` na
  ativa, limpar foco de opção ao editar texto; VoiceOver/NVDA têm suporte
  imperfeito a activedescendant — seguir essas mitigações, não abandonar o modelo.
- Teclado combobox: ArrowDown abre/próxima; Enter aceita e fecha; Esc fecha e
  devolve foco visual ao input; Tab aceita/fecha e segue; chars imprimíveis
  voltam o foco visual ao input.

### Dropdown (menu)

- Trigger: `aria-haspopup="menu"` + `aria-expanded` (+ `aria-controls`).
  Container `role="menu"`, itens `role="menuitem"`/`menuitemcheckbox`/`menuitemradio`.
- Enter/Space/ArrowDown abre com foco no primeiro item; ArrowUp abre no último;
  setas navegam (wrap opcional); Home/End; typeahead; Esc fecha e devolve foco
  ao trigger; Tab fecha e segue (não navega itens).
- `role="menu"` só para comandos — dropdown de links de navegação usa
  disclosure + lista de links.

### Tabs

- `role="tab"` + `aria-selected` + `aria-controls`; `role="tabpanel"` +
  `aria-labelledby` (+ `tabindex="0"` se painel sem focável). Left/Right
  (ou Up/Down se `aria-orientation="vertical"`), wrap; Tab é uma parada única.

### Dialog (reforço do que o pilot já faz)

- Foco inicial: primeiro focável; conteúdo longo → `tabindex="-1"` num
  elemento estático (heading); ação destrutiva → focar a ação menos destrutiva
  (Cancel). `aria-modal="true"` + inert real no fundo (aria-hidden nos
  siblings) — `aria-modal` sozinho não bloqueia tudo.

## Fontes

Padrões APG (combobox, select-only example, dialog-modal, menu-button, tabs,
accordion, listbox, radio, switch, slider, disclosure, toolbar, alert,
tooltip) — w3.org/WAI/ARIA/apg; react-aria.adobe.com/blog/building-a-combobox;
github.com/pacocoursey/cmdk; radix-ui.com (select, dropdown-menu);
ariakit.com (combobox virtualFocus); sarahmhigley.com/writing/activedescendant.

## Incertezas registradas

- Pagination não tem padrão APG — "nav landmark + aria-current" vem de
  prática W3C Design System/consenso de mercado.
- `role="status"` polite implícito vem da spec ARIA (não re-verificado na sessão).
- Radix Select "roving real focus" inferido da tabela de teclado dos docs,
  não do código-fonte.
