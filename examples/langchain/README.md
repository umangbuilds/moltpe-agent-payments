# LangChain × MoltPe — agent payments via MCP

A LangGraph ReAct agent that uses the MoltPe MCP server's payment tools
to check balances, create invoices, and send payments — without
human intervention. Runs end-to-end against the mock provider so no
real funds and no real x402 settlement happen.

Closes [#6](https://github.com/umangbuilds/moltpe-agent-payments/issues/6).

## What it shows

An LLM-driven agent reasoning about three payment tasks back-to-back:

1. **Balance check** — call `check_balance` and report results across providers.
2. **Invoice creation** — call `create_invoice` for a billed party.
3. **Payment send** — route a USDC payment via `send_payment` on the stablecoin provider.

The agent picks the right tool for each task based on the prompt and the
auto-generated tool descriptions, demonstrating that MoltPe's MCP surface
is directly usable from the LangChain stack.

## Setup (under 5 minutes)

### 1. Start the MoltPe MCP server (mock mode)

In one terminal:

```bash
cd ../../mcp-server
npm install
PROVIDER_MODE=mock npm start -- --provider all
```

Server listens on `http://localhost:3000/`. Mock mode means seeded balances,
no real settlement.

### 2. Install Python deps and run the example

In another terminal:

```bash
cd examples/langchain
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...        # for the LLM driving the agent
python main.py
```

That's it. Expected output: three demo turns with tool calls visible and a
final summary from the agent each time.

## Configuration

| Env var            | Default                  | Purpose                                                                     |
| ------------------ | ------------------------ | --------------------------------------------------------------------------- |
| `MOLTPE_MCP_URL`   | `http://localhost:3000/` | MCP server endpoint                                                          |
| `AGENT_ID`         | `agent-alice`            | Sender agent ID (seeded in `mcp-server/providers/seed-data.js`)             |
| `COUNTERPARTY_ID`  | `agent-bob`              | Receiver agent ID (also seeded)                                              |
| `OPENAI_MODEL`     | `gpt-4o-mini`            | LLM model name                                                               |
| `OPENAI_API_KEY`   | (required)               | LLM credentials                                                              |

> Note: the **MoltPe payment side runs without credentials** in mock mode.
> The `OPENAI_API_KEY` is only for the LLM that drives the LangChain agent;
> swap the `langchain_openai` import + `ChatOpenAI` line in `main.py` for
> any other LangChain chat model (Anthropic, Bedrock, local Ollama, etc.)
> if you'd rather not use OpenAI.

## Files

- `main.py` — async ReAct agent wiring `langchain-mcp-adapters` →
  `MultiServerMCPClient` → MoltPe.
- `requirements.txt` — `langchain-mcp-adapters`, `langchain-openai`, `langgraph`.

## Acceptance-criteria mapping (issue #6)

- [x] **Agent can call check_balance, send_payment, and create_invoice** —
      all three exercised in the three demo prompts in `main.py`.
- [x] **Example runs with `python main.py`** — single async entry point.
- [x] **README explains setup in under 5 minutes** — two terminals,
      three commands each.
- [x] **Works with the mock provider (no real credentials needed)** for the
      payment side. LLM credentials are documented separately and the
      adapter pattern lets users swap in any LangChain chat model.

## What's next

The companion [issue #7](https://github.com/umangbuilds/moltpe-agent-payments/issues/7)
covers an AutoGen multi-agent flow — same MCP surface, two cooperating
agents (one earning, one paying). Same `langchain-mcp-adapters` pattern
generalises with AutoGen's tool registration if you want to follow up.
