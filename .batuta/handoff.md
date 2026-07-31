# Handoff — 2026-07-30

## Cycle point

**Nenhum ciclo em voo.** O último item entregue foi o 6c-b1, mergeado no PR #23; a `main`
está em `013acc8`, árvore limpa, sem worktrees e sem branches além da `main` (as mergeadas
foram apagadas a pedido do usuário). Parity em 269 classes, docgen em 46 componentes, 478
testes verdes.

A Fase 6 fechou dois itens nesta sessão: **6c-a** (os quatro guias bilíngues, PR #22) e
**6c-b1** (camada de layout e ThemeProvider, PR #23). Ambos estão registrados em `WORK.md`
na seção Done, com o que foi aprendido.

O próximo item é o **6c-b2** — as 8 adições de cromo (`Shell`, `Navbar`, `Footer`,
`TableOfContents`, `CodeBlock`, `SegmentedControl`, trigger do `CommandPalette` e a camada
CSS `.lyra-prose`). Nada foi começado dele: sem brief, sem worktree, sem delegação.

Ele é diferente de tudo que veio antes e vale saber disso antes de abrir o ciclo: **essas 8
não têm handoff**. São design nosso a partir do CSS já validado em produção no `apps/docs`.
Pelo padrão desta sessão, isso provavelmente pede que o maestro decida as APIs antes de
delegar — foi o que aconteceu com o `Shell` (slots + `scroll`) e com as custom properties do
`Stack`/`Grid`, onde a decisão de contrato era o trabalho e a implementação foi o resto.

## Decisions not yet written

Nenhuma. Tudo o que foi decidido nesta sessão já está em código, em `WORK.md` ou no
`.batuta/profile.md`:

- Baseline versionado do parity (PR #20) e a decisão do `Popover` sobre o `useFlipPlacement`
  (PR #21) — em `WORK.md` § Decisões tomadas.
- Dogfooding ampliado (landing e docs usam componentes do Lyra porque são reaproveitáveis
  por terceiros) e a regra de terminologia pt-BR — em `.batuta/profile.md`.
- Switcher de framework por página de componente — em `WORK.md` como alvo arquitetural
  adiado, com as quatro constraints de quando for construído.
- Status dos frameworks na landing (React pronto; Vue, Blade e LiveView como "Em breve") —
  em `WORK.md`, dentro do item 6c-c.

## Background

**Nada deste projeto rodando.** Os dois servidores que a sessão subiu foram encerrados: o
estático da porta 4173 (usado para verificar o build) e o `next dev` do docs. Nenhum
executor pendente, nenhum worktree.

Atenção ao inspecionar processos: **há um `codex exec` vivo que é de OUTRO projeto**
(`chico.ai`, worktree `automation-memory`). Não é desta sessão e não deve ser parado.

Para revisar as páginas ao voltar, o dev precisa ser reiniciado — e vale lembrar a
armadilha que custou dois 404 falsos nesta sessão: **o `next dev` não recarrega rota nova
registrada no manifesto**. Ao adicionar um guia ou componente, reinicie. A verificação final
foi feita contra o build estático (`apps/docs/out` servido), que é o artefato que publica.

## Open questions

Duas decisões pendentes do usuário, ambas mordendo no **6c-c** (landing) e nenhuma
bloqueando o 6c-b2:

1. **Repositório das docs.** A copy da landing afirma que elas vivem em `lyra-ds/docs`,
   repositório separado, contradizendo o `apps/docs` do monorepo. Vira promessa pública no
   dia em que a landing subir.
2. **Rótulo do React na landing.** A 6c-c vem **antes** da Fase 7, que é quando o pacote vai
   para o npm — então, na janela entre as duas, nem `@lyra-ds/react` é instalável e
   "Estável" seria falso. Ou a landing sobe depois do release, ou o rótulo reflete o
   pré-lançamento. Decidir junto com a ordem entre 6c-e (deploy) e Fase 7.

Herdadas, sem prazo:

3. **Ruleset da `main`** — a exigência de 1 aprovação só produz bypass num projeto solo, e
   foram **cinco merges com `--admin`** nesta sessão. Manter os 4 checks (que pegaram
   problema real) e dispensar a aprovação deixaria o registro honesto.
4. **Ritmo vertical do fim da página no toque** — padding do rodapé e/ou o respiro de 64px,
   do diagnóstico do iPad.
