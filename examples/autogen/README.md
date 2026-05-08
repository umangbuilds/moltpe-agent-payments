# AutoGen × MoltPe — multi-agent payments via MCP

Two Microsoft AutoGen agents (an **earner** and a **payer**) transacting
through the MoltPe MCP server without human intervention. The earner
issues an invoice, the payer checks its balance and settles via stablecoin
USDC on the base chain — all over the same MCP surface a single LangChain
agent uses in [`examples/langchain/`](../langchain/README.md).

Closes [#7](https://github.com/umangbuilds/moltpe-agent-payments/issues/7).

## What it shows

Multi-agent payment flow as a `RoundRobinGroupChat`:

1. **earner** (`agent-bob`) calls `create_invoice` and posts the invoice ID.
2. **payer** (`agent-alice`) reads the invoice from the chat, calls
   `check_balance` to confirm it can cover the amount, then `send_payment`
   on the stablecoin provider (base chain) to settle.
3. Termination triggers on `DONE_PAYER` token (or a 20-message cap).

This is the core "core use case" the issue calls out: two agents
transacting with no human in the loop.

## Setup (under 5 minutes)

### 1. Start the MoltPe MCP server (mock mode)

In one terminal:

```bash
cd ../../mcp-server
npm install
PROVIDER_MODE=mock npm start -- --provider all
```

Listens on `http://localhost:3000/` with seeded mock balances for
`agent-alice`, `agent-bob`, `agent-charlie`.

### 2. Install Python deps and run the example

In another terminal:

```bash
cd examples/autogen
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...
python main.py
```

Console output streams every tool call and chat turn so the multi-agent
payment flow is visible end-to-end.

## Configuration

| Env var            | Default                  | Purpose                                            |
| ------------------ | ------------------------ | -------------------------------------------------- |
| `MOLTPE_MCP_URL`   | `http://localhost:3000/` | MCP server endpoint                                 |
| `EARNER_ID`        | `agent-bob`              | Service provider — issues the invoice              |
| `PAYER_ID`         | `agent-alice`            | Customer — settles the invoice                     |
| `INVOICE_AMOUNT`   | `25`                     | Invoice amount                                     |
| `INVOICE_CURRENCY` | `USDC`                   | Invoice currency                                   |
| `OPENAI_MODEL`     | `gpt-4o-mini`            | LLM model name                                     |
| `OPENAI_API_KEY`   | (required)               | LLM credentials                                    |

> The MoltPe payment side runs without credentials in mock mode. The
> `OPENAI_API_KEY` is only for the model that drives both AutoGen agents.

## Files

- `main.py` — async `RoundRobinGroupChat` between earner and payer,
  tools loaded via `autogen_ext.tools.mcp.mcp_server_tools` over a
  Streamable-HTTP MCP transport.
- `requirements.txt` — `autogen-agentchat`, `autogen-ext[openai,mcp]`.

## Acceptance-criteria mapping (issue #7)

- [x] **Two AutoGen agents: one earning, one paying** — `earner` and
      `payer` AssistantAgents in a RoundRobinGroupChat.
- [x] **Demonstrates agent-to-agent payment flow through MoltPe** —
      invoice creation by earner → balance check + stablecoin send by
      payer, all via MCP.
- [x] **Placed in `examples/autogen/`** — alongside the LangChain example.
- [x] **Works with mock provider** — no real funds, no real settlement.

## See also

- [`examples/langchain/`](../langchain/README.md) — single-agent
  LangChain ReAct over the same MCP tools (closes #6).
- `mcp-server/tools/index.js` — the 11 MCP tools both examples consume.
- `mcp-server/providers/seed-data.js` — the seeded `alice` / `bob` /
  `charlie` agents both examples default to.
