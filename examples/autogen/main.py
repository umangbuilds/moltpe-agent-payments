"""AutoGen multi-agent payment flow over MoltPe MCP tools.

Two AutoGen agents transact through MoltPe without human intervention:

- ``earner`` calls ``create_invoice`` and reports the invoice ID.
- ``payer`` reads the conversation, calls ``check_balance``, then
  ``send_payment`` to settle the invoice.

The MCP tool surface is the same one a LangChain agent would see (#6) —
this example focuses on AutoGen's group-chat orchestration over a shared
tool surface so the multi-agent payment flow is visible end-to-end.

Designed to run against the mock provider — no real funds, no real
settlement. Set ``OPENAI_API_KEY`` (or swap the model client below) and
go.

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

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.tools.mcp import StreamableHttpServerParams, mcp_server_tools

MCP_URL = os.environ.get("MOLTPE_MCP_URL", "http://localhost:3000/")
EARNER_ID = os.environ.get("EARNER_ID", "agent-bob")
PAYER_ID = os.environ.get("PAYER_ID", "agent-alice")
INVOICE_AMOUNT = os.environ.get("INVOICE_AMOUNT", "25")
INVOICE_CURRENCY = os.environ.get("INVOICE_CURRENCY", "USDC")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


EARNER_SYSTEM = (
    f"You are agent `{EARNER_ID}`, a service provider. Your job in this "
    "conversation is to create one invoice for the work you just delivered. "
    "Use the `create_invoice` MCP tool. Bill it to "
    f"`{PAYER_ID}` for {INVOICE_AMOUNT} {INVOICE_CURRENCY} with description "
    "'API access — May 2026'. Once the invoice is created, post the invoice "
    "ID in the chat so the payer can settle it. After that, end your turn "
    "with the literal token DONE_EARNER on its own line."
)

PAYER_SYSTEM = (
    f"You are agent `{PAYER_ID}`, the customer. When the earner posts an "
    "invoice, first call `check_balance` to confirm you can cover it, then "
    "call `send_payment` from your account to the earner via the stablecoin "
    f"provider on the base chain ({INVOICE_AMOUNT} {INVOICE_CURRENCY}). "
    "When the payment goes through, post a one-line summary of the "
    "transaction (amount + recipient + status) and end your turn with the "
    "literal token DONE_PAYER on its own line."
)


async def run() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError(
            "OPENAI_API_KEY is required for the LLM driving the AutoGen "
            "agents. The MoltPe MCP server itself runs in mock mode without "
            "credentials."
        )

    server_params = StreamableHttpServerParams(url=MCP_URL)
    tools = await mcp_server_tools(server_params)
    print(f"Loaded {len(tools)} MoltPe MCP tools for AutoGen agents:")
    for t in tools:
        # AutoGen tool wrappers expose .name and .description
        print(f"  • {t.name} — {t.description[:80]}")
    print()

    model_client = OpenAIChatCompletionClient(model=MODEL)

    earner = AssistantAgent(
        name="earner",
        model_client=model_client,
        tools=tools,
        system_message=EARNER_SYSTEM,
        reflect_on_tool_use=True,
    )

    payer = AssistantAgent(
        name="payer",
        model_client=model_client,
        tools=tools,
        system_message=PAYER_SYSTEM,
        reflect_on_tool_use=True,
    )

    # End once both agents declare done OR after a hard message cap.
    termination = TextMentionTermination("DONE_PAYER") | MaxMessageTermination(20)
    team = RoundRobinGroupChat([earner, payer], termination_condition=termination)

    task = (
        f"Earner ({EARNER_ID}) just delivered API access for May 2026. "
        f"Issue an invoice to {PAYER_ID} for {INVOICE_AMOUNT} {INVOICE_CURRENCY}, "
        f"then have {PAYER_ID} settle it via stablecoin on base."
    )
    await Console(team.run_stream(task=task))


if __name__ == "__main__":
    asyncio.run(run())
