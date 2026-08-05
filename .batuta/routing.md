# Routing — lyra-ds (confirmed during onboarding, 2026-07-20)

Local copy of the Batuta routing table. Exact executors and models confirmed by
the user. Note: `opencode` lives in `~/.opencode/bin` — if `command -v opencode`
fails in a non-interactive shell, prefix
`export PATH="$HOME/.opencode/bin:$PATH"`.

| Complexity | Examples                                                                    | Executor                                                      | Cost                |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------- |
| Trivial    | rename, config, copy change, simple unit test                               | opencode + `opencode/kimi-k2.7-code`                          | cents (API)         |
| Medium     | isolated feature, bugfix with clear repro                                   | codex (default model — `gpt-5.6-terra`, ChatGPT subscription) | flat (subscription) |
| Complex    | multi-file feature/refactor that a self-contained brief fully specifies     | codex `-m gpt-5.6-terra -c model_reasoning_effort="high"`     | flat (subscription) |
| Critical   | architecture, security-sensitive work, tasks that need conversation context | claude (this session itself)                                  | Claude subscription |

## Support lanes

| Role     | Examples                                       | Executor                                                               | Cost        |
| -------- | ---------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| Research | map sweep, brief context, "where does X live?" | opencode + `opencode/kimi-k2.7-code` (read-only through brief + guard) | cents (API) |

Note (2026-07-21): the Research lane moved from `deepseek-v4-flash-free` to the
paid version — the free tier hung twice (the onboarding map sweep and the Lot C
scout, both dead without output).

Note (2026-07-27): Research moved from `deepseek-v4-flash` to
`kimi-k2.7-code` (the same model as the Trivial lane — one account only, with
behavior already known in the project), confirmed in the reconfiguration
`/batuta:init`.

## Rules

The rules in the plugin's global `routing.md` apply in full (classification
announced in one line, verbal override, escalation after 2 failures, dormant
adapters, Complex vs. Critical by the brief test).
