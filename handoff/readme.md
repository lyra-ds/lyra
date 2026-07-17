# Lyra Design System

**Lyra DS** é um design system open source de componentes modernos para produtos SaaS, com implementações planejadas para **React, Vue, Laravel (Blade) e Phoenix LiveView**. O objetivo é fazer diferença para a comunidade open source e acelerar a criação de novos projetos com uma base visual consistente e acessível.

O nome vem da constelação de Lira; a estrela mais brilhante dela, **Vega**, batiza a direção visual escolhida: limpa, neutra e confiável, com **indigo cósmico** como cor primária e um tema escuro "céu noturno" tintado de indigo.

## Fontes e referências dadas pelo usuário

- Referências visuais (inspiração, não recriação): Dribbble "SaaS Dashboard Lookscout Design System" (https://dribbble.com/shots/27102059), Behance "Design System UI/UX Design Library" (https://www.behance.net/gallery/196517557), Behance "EOS Design System UI kit" (https://www.behance.net/gallery/161215951).
- Não há codebase, Figma ou logo existentes — a marca foi criada neste projeto (direção "Vega · Indigo Cósmico" aprovada pelo usuário em `explorations/Direções Lyra DS.html`).

## Arquitetura

CSS-first: toda a aparência vive em classes `.lyra-*` (consumíveis por Vue/Laravel/Phoenix sem JS), e os componentes React são wrappers finos sobre essas classes. `styles.css` na raiz importa tokens + CSS de todos os grupos de componentes.

---

## CONTENT FUNDAMENTALS

- **Idioma**: bilíngue — documentação e copy de UI em **pt-BR**; código, tokens e nomes de API em **inglês** (`--surface-card`, `variant="primary"`).
- **Pessoa**: fala diretamente com **"você"**; o produto fala na primeira pessoa do plural quando age ("Nunca compartilharemos."). Nunca "o usuário deverá".
- **Tom**: direto, caloroso e técnico sem jargão. Frases curtas. Orienta o próximo passo ("Crie seu primeiro projeto para começar.").
- **Casing**: sentence case em tudo — títulos, botões, labels. Nada de Title Case nem CAPS (exceto overlines de 12px com tracking).
- **Botões**: verbo no imperativo + objeto ("Criar projeto", "Convidar"). Destrutivos nomeiam a ação real ("Excluir"), nunca "OK".
- **Erros**: dizem o que aconteceu e como resolver, sem culpa e sem drama ("Mínimo de 8 caracteres.").
- **Emoji**: **não usa**. Estados vazios e sucessos são comunicados com ícones Lucide e copy.
- **Números**: formato brasileiro nos exemplos ("48.210", "12,4%"); datas relativas curtas ("há 2h", "ontem").

## VISUAL FOUNDATIONS

- **Cor**: primária **indigo** (`--indigo-600 #5B5BD6`), usada com parcimônia — uma ação primária por tela. Neutros **slate** frios. Status em pares *soft + texto forte* (`--success-soft` + `--success-text`). Dark mode com superfícies **night** tintadas de indigo (`#0E1023 → #1C1F42`), nunca cinza puro; no dark o accent sobe um passo (500→400) para manter contraste.
- **Tipografia**: **Plus Jakarta Sans** para tudo (display extrabold com tracking -0.03em; UI em 14px/1.5); **JetBrains Mono** para código e tokens. Escala 12→60. Hierarquia por peso e cor, não por tamanho exagerado.
- **Espaçamento**: grade de **4px** (`--space-*`); densidade confortável — paddings de card 24px, controles de 40px (32/48 nos extremos).
- **Raios**: `md` **10px** é o raio padrão (botões, inputs); cards 14px, modais 20px, pills/avatars full. Checkbox 4px.
- **Bordas e sombras**: bordas 1px `--border-default` em toda superfície; sombras slate-tintadas muito sutis (xs/sm em repouso, md em hover, lg em modais). **No dark, elevação vem de cor de superfície + borda, não de sombra.**
- **Fundos**: planos e sólidos (`--surface-page` levemente off-white). **Sem gradientes decorativos**, sem texturas, sem padrões. Imagens não fazem parte da linguagem base; ilustração futura deve ser geométrica e mínima (estrelas/constelações como motivo).
- **Animação**: rápida e discreta — 120–280ms com `--ease-out` (cubic-bezier(0.16,1,0.3,1)). Fades e micro-deslocamentos (4–8px); modais com scale 0.97→1. Nada de bounce ou loops infinitos.
- **Hover**: fundos escurecem um passo (primary 600→700) ou ganham `--surface-sunken`; cards interativos sobem para `--shadow-md` + borda mais forte. **Press**: translateY(0.5px) + cor um passo mais escura. **Focus**: anel de 3px `--focus-ring` (indigo a 22%), sempre visível via `:focus-visible`.
- **Transparência e blur**: apenas no overlay de modal (`--surface-overlay` + blur 3px). Sem glassmorphism em superfícies de conteúdo.
- **Cards**: fundo `--surface-card`, borda 1px, raio 14px, sombra sm, header/footer separados por borda interna.
- **Layout**: container máx. 1200px; sidebar fixa de 260px em apps; gutters de 24px.

## ICONOGRAPHY

- **Sistema**: [Lucide](https://lucide.dev) (open source, ISC) — stroke 2px, geometria 24×24. Nenhum ícone próprio existe ainda; o usuário cogitou criar um set proprietário no futuro — quando isso acontecer, deve seguir a mesma gramática de stroke do Lucide para troca 1:1.
- **Entrega**: o componente `Icon` renderiza o SVG do CDN (`unpkg.com/lucide-static@0.469.0`) via **CSS mask**, então o ícone herda `currentColor` como texto. Sem icon font, sem PNGs.
- **Uso**: tamanhos canônicos 16 (inline), 20 (padrão), 24 (destaque). Cor herdada do contexto; nunca multicolorido.
- **Emoji/unicode como ícone**: não. Únicas exceções unicode: setas de variação em `Stat` (↑ ↓ →) e chevrons ‹ › na paginação.
- **Logo**: estrela de 4 pontas (Vega) em `assets/lyra-mark.svg` (e `lyra-mark-light.svg` para fundos escuros); wordmark "Lyra" composto em Jakarta extrabold (ver `guidelines/brand-logo.html`).

---

## Índice do projeto

| Caminho | O que é |
|---|---|
| `styles.css` | Entrada única de CSS (importa tudo abaixo) |
| `tokens/` | `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css`, `base.css` |
| `assets/` | `lyra-mark.svg`, `lyra-mark-light.svg` |
| `components/buttons/` | Button, IconButton |
| `components/forms/` | Input, Textarea, Select, Combobox, Checkbox, Radio, Switch |
| `components/display/` | Card, Badge, Tag, Avatar, AvatarGroup, Accordion |
| `components/navigation/` | Tabs, Breadcrumb, Pagination, Dropdown, Stepper, CommandPalette (⌘K), WorkspaceSwitcher, CreateWorkspaceDialog, SidebarGroup |
| `components/feedback/` | Alert, Toast, ToastStack, Dialog, Drawer, Tooltip, Progress, Spinner, Skeleton, CookieBanner |
| `components/data/` | Table, Stat, EmptyState |
| `components/files/` | FileUpload (multiupload com progresso), FileManager (gestor de arquivos) |
| `components/icons/` | Icon (Lucide via CSS mask) |
| `guidelines/` | Specimen cards de cores, tipo, espaçamento e marca |
| `ui_kits/dashboard/` | UI kit: dashboard SaaS (overview, projetos, membros, cobrança, configurações) |
| `ui_kits/website/` | UI kit: landing/docs do Lyra (hero, pricing Community/Pro, FAQ, LGPD) |
| `ui_kits/auth/` | UI kit: login, cadastro multi-etapa e recuperação de senha |
| `explorations/` | Direções visuais exploradas (histórico de decisão) |
| `SKILL.md` | Skill para usar este DS no Claude Code |

Cada componente tem `<Name>.jsx` + `<Name>.d.ts` (contrato de props) + `<Name>.prompt.md` (uso). Consuma via `window.LyraDesignSystem_e82d95` no bundle gerado (`_ds_bundle.js`).
