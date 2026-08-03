# Stack / Inline

Primitivo de layout que elimina flex escrito à mão nos consumidores — a maior fonte de espaçamento inconsistente. `gap` numérico mapeia direto para a escala `--space-N`, então todo espaçamento vem de token sem o dev pensar nisso. `Inline` é o atalho para a variante mais comum (row + wrap + center). Sem margem em filhos: gap sobrevive a reordenação/remoção de itens.
