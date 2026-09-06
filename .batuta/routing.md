# Routing — lyra-ds

<!-- inputs: profile.md@sha256:09a62f4cbe73 -->

Reconfigured on 2026-09-06, preserving approved lane assignments and applying
the user's GLM replacement. Legacy Trivial/Complex names map to low/high.

| Lane     | Domain | Executor | Model                            | Reasoning / cost   |
| -------- | ------ | -------- | -------------------------------- | ------------------ |
| low      | *      | opencode | `opencode/glm-5.3-flash`         | API usage          |
| medium   | *      | codex    | `gpt-5.6-terra`                  | Subscription       |
| high     | *      | codex    | `gpt-5.6-terra`                  | high; subscription |
| critical | *      | self     | Current conducting session model | Host session       |

## Support lane

| Role     | Domain | Executor | Model                    | Contract                         |
| -------- | ------ | -------- | ------------------------ | -------------------------------- |
| research | *      | opencode | `opencode/glm-5.3-flash` | Read-only brief and status guard |

## Inventory and retained choices

`batuta inventory` on 2026-09-06 reports `agy`, `claude`, `codex`,
`cursor-agent`, and `opencode` available. GLM 5.3 Flash and Codex Terra are
listed. Availability is discovery evidence, not proof of every provider's
credentials. GLM execution was verified in this session.

Codex and OpenCode retain the approved active assignments. `agy`, `claude`,
and `cursor-agent` remain available alternatives without assigned lanes;
using one requires a user routing override. Only these five executors are
eligible for this project. Installed executors outside that list are excluded.

The user replaced Kimi with `opencode/glm-5.3-flash` for low and research.
Historical work logs retain the models actually used. `self` means the current
conducting host, including Codex; it is not a background Claude invocation.

## Rules

Apply the plugin routing rules: announce lane/domain/model, honor user overrides,
use explicit model IDs, and escalate one lane after two failed verifications or
an unavailable executor. Research falls back to controller discovery after two
failures. Pass OpenCode briefs inline and redirect executor stdin from
`/dev/null`. Resolve CLIs through PATH; do not assume an obsolete install path.
