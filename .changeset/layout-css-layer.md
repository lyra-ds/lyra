---
'@lyra-ds/styles': minor
---

Adiciona a camada de layout (`components/layout/layout.css`) ao entry: AppShell, Container,
PageHeader, Separator e ActionBar vêm do handoff v1.1 verbatim.

Junto vão duas extensões aditivas que o handoff não tem, `.lyra-stack` e `.lyra-grid`. Os
componentes React do handoff emitem essas duas classes mas o CSS não define regra nenhuma para
elas — a aparência inteira mora num `style` inline, que é a única forma que um adapter Vue, Blade
ou LiveView não consegue reaproveitar. As declarações passam a viver no CSS, com custom
properties para o que não pode ser classe modificadora:

- `--lyra-stack-direction`, `--lyra-stack-gap`, `--lyra-stack-align`, `--lyra-stack-justify`,
  `--lyra-stack-wrap`
- `--lyra-grid-columns`, `--lyra-grid-gap`

Os defaults espelham os dos componentes do handoff, então um wrapper só define o que difere.
