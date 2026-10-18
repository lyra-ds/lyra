# Routing — lyra-ds

<!-- inputs: profile.md@sha256:1254e8495ffe -->

Confirmed by the maintainer on 2026-10-14 after full installed-adapter inventory. OpenCode's Zen
models are catalogued but live GLM/DeepSeek calls returned insufficient-funds
402 errors. Codex routes use the installed ChatGPT subscription. Cursor is
not installed. Agy remains an available unrouted alternative.

| Lane | Domain | Executor | Model | Reasoning / cost |
|---|---|---|---|---|
| low | * | codex | gpt-6-luna | low; subscription |
| medium | * | codex | gpt-6.1-sol | medium; subscription |
| high | * | codex | gpt-6-astra | high; subscription |
| critical | * | self | Current conducting session model | Host session |

## Support lanes

| Role | Lane | Executor | Model | Reasoning / cost |
|---|---|---|---|---|
| research | low | codex | gpt-6-luna | low; read-only |
| research | medium | codex | gpt-6.1-sol | medium; read-only |
| review | — | claude | sonnet | Read-only independent review |

## Rules

Honor user overrides and announce the selected lane, executor, model and effort.
Escalate after two failed verifications or an unavailable executor. External
CLI dispatch is the default; use the installed Batuta core. Close executor
stdin with /dev/null. Use read-only research/review commands and verify the
working tree guard. Research with no available next row falls back to the
conductor. Current exact model IDs were discovered from installed adapters.
Do not infer credentials from catalogue presence. Never add an unrouted CLI
or replace an unavailable model without the routing policy or user override.

## Eligible adapters

Only `agy`, `claude`, `codex`, `cursor-agent` and `opencode` are eligible adapters;
installed executors outside that list are excluded. Run only confirmed installed
executor/model rows. Compozy is a historical runtime outside the adapter set.
Resolve CLIs through PATH; do not assume an obsolete install path. The Claude
review model `sonnet` is the adapter's literal confirmed alias. Historical
profile examples do not override this current routing table.
