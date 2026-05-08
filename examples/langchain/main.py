"""LangChain agent talking to MoltPe MCP tools.

Wires the MoltPe MCP server (Streamable-HTTP transport at localhost:3000)
into a LangGraph ReAct agent so an LLM can autonomously call
``check_balance``, ``send_payment``, and ``create_invoice``.

Designed to run end-to-end against the mock provider — no real funds, no
real x402 settlement. Set ``OPENAI_API_KEY`` (or swap the LLM block below
for a different provider) and the agent is ready.

Usage:
    # 1. Start the MoltPe MCP server in another terminal:
    cd ../../mcp-server
    PROVIDER_MODE=mock npm start -- --provider all

    # 2. Run this example:
    pip install -r requirements.txt
    export OPENAI_API_KEY=...
    python main.py
"""

from __future__ import annotations

import asyncio
import os

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

MCP_URL = os.environ.get("MOLTPE_MCP_URL", "http://localhost:3000/")
# Default to a seeded mock agent so the example runs end-to-end without
# any setup. See mcp-server/providers/seed-data.js for the canonical list
# (alice, bob, charlie).
AGENT_ID = os.environ.get("AGENT_ID", "agent-alice")
COUNTERPARTY_ID = os.environ.get("COUNTERPARTY_ID", "agent-bob")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


SYSTEM_PROMPT = (
    "You are a payment-aware AI agent. You have access to MCP tools that let "
    "you check your balance, send payments to other agents, and create "
    f"invoices. Your agent ID is `{AGENT_ID}`. When asked to perform a "
    "payment task, use the tools rather than guessing. After each tool "
    "call, summarise the result in plain language."
)


async def run() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError(
            "OPENAI_API_KEY is required to run the LangChain agent. "
            "The MoltPe MCP server itself runs in mock mode without "
            "credentials, but the LLM driving the agent does need one."
        )

    client = MultiServerMCPClient(
        {
            "moltpe": {
                "url": MCP_URL,
                "transport": "streamable_http",
            }
        }
    )

    tools = await client.get_tools()
    print(f"Loaded {len(tools)} MoltPe MCP tools:")
    for t in tools:
        print(f"  • {t.name} — {t.description[:80]}")
    print()

    agent = create_react_agent(
        ChatOpenAI(model=MODEL, temperature=0),
        tools,
    )

    prompts = [
        f"What's my current balance across all payment rails? My agent id is {AGENT_ID}.",
        f"Create an invoice for 25 USDC billed to {COUNTERPARTY_ID}. "
        f"Description: 'monthly API access'. I am {AGENT_ID}.",
        f"Send 10 USDC from {AGENT_ID} to {COUNTERPARTY_ID} via the stablecoin "
        f"provider on the base chain.",
    ]

    for i, prompt in enumerate(prompts, start=1):
        print(f"━━━ Demo step {i}/{len(prompts)} ━━━")
        print(f"USER: {prompt}\n")
        result = await agent.ainvoke(
            {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ]
            }
        )
        final = result["messages"][-1]
        content = getattr(final, "content", None) or final.get("content", "")
        print(f"AGENT: {content}\n")


if __name__ == "__main__":
    asyncio.run(run())
