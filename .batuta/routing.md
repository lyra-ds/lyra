# Routing — lyra-ds (confirmado no onboarding, 2026-07-20)

Cópia local da tabela de roteamento do Batuta. Executores e modelos exatos
confirmados pelo usuário. Nota: `opencode` vive em `~/.opencode/bin` — se
`command -v opencode` falhar num shell não-interativo, prefixe
`export PATH="$HOME/.opencode/bin:$PATH"`.

| Complexity | Examples                                                                                 | Executor                                                    | Cost                |
| ---------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------- |
| Trivial    | rename, config, copy change, simple unit test                                            | opencode + `opencode/kimi-k2.7-code`                        | cents (API)         |
| Medium     | isolated feature, bugfix with clear repro                                                | codex (default model — `gpt-5.6-terra`, assinatura ChatGPT) | flat (subscription) |
| Complex    | multi-file feature/refactor que um brief autossuficiente especifica por completo         | codex `-m gpt-5.6-terra -c model_reasoning_effort="high"`   | flat (subscription) |
| Critical   | arquitetura, trabalho sensível a segurança, tarefas que precisam do contexto da conversa | claude (a própria sessão)                                   | Claude subscription |

## Support lanes

| Role     | Examples                                     | Executor                                                                   | Cost |
| -------- | -------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| Research | map sweep, contexto de brief, "onde vive X?" | opencode + `opencode/deepseek-v4-flash` (read-only por brief + guard) | cents (API) |

Nota (2026-07-21): lane de Research migrada de `deepseek-v4-flash-free` para a
versão paga — o tier free travou duas vezes (map sweep do onboarding e scout do
Lote C, ambos mortos sem output).

## Rules

As regras do `routing.md` global do plugin aplicam-se integralmente
(classificação anunciada em uma linha, override verbal, escalação após 2
falhas, adapters dormentes, Complex vs Critical pelo teste do brief).
