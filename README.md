# MoltPe Agent Payments

Payment infrastructure for AI agents — reference implementation with x402, MPP, and fiat payment paths.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Content: CC BY-SA 4.0](https://img.shields.io/badge/Content-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-CONTENT)
[![MCP Server: 53 tests](https://img.shields.io/badge/MCP%20Server-53%20tests%20passing-brightgreen)]()
[![x402 Client: 34 tests](https://img.shields.io/badge/x402%20Client-34%20tests%20passing-brightgreen)]()
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/umangbuilds/moltpe-agent-payments)

> **Disclaimer:** This is a reference implementation with mock data. For production, implement real PaymentProvider adapters. MoltPe's production server is at moltpe.com/mcp.

## What This Is

This repository contains a reference implementation for handling payments in AI agent systems. It supports three payment paths: stablecoin micropayments (x402), session-based streaming (MPP), and traditional fiat rails. The goal is to show how agents can pay, get paid, and manage money across different protocols.

## Quick Start

```bash
# MCP Server — payment tools for AI agents
cd mcp-server && npm install && npm start
# Server runs on port 3000 with 11 MCP tools
# Connect Claude Desktop with config from examples/claude-desktop-config.json

# x402 Client — stablecoin micropayments
cd x402-client && npm install && npm run build
# Use in your project:
# import { pay } from '@moltpe/x402-client'
```

See [mcp-server/README.md](mcp-server/README.md) and [x402-client/README.md](x402-client/README.md) for full usage.

## Demo

Run `npm start` in the mcp-server directory and open http://localhost:3000 for an interactive demo. The UI lets you explore all 11 payment tools across three provider types.

See [mcp-server/DEMO.md](mcp-server/DEMO.md) for a step-by-step walkthrough.

## What's Inside

| Directory | Description |
|-----------|-------------|
| `research/` | Market research, protocol analysis, competitive landscape |
| `mcp-server/` | MCP payment server with 11 tools, 3 mock providers (x402, MPP, fiat), 53 tests |
| `x402-client/` | TypeScript x402 client SDK with facilitator adapters and interceptors, 34 tests |
| `playbook/` | Build playbook: process, templates, results from building this |
| `docs/` | Architecture docs, protocol landscape, market analysis |

## Tri-Rail Architecture

This implementation supports three parallel payment paths:

- **Path A — Stablecoin (x402):** Per-request micropayments settled on-chain in USDC
- **Path B — Session-based (MPP):** Authorize a budget, stream payments within a session
- **Path C — Fiat:** Traditional card authorization, capture, and settlement

Each path serves different use cases. A collections layer sits above all three to handle agent receivables. See [docs/tri-rail-architecture.md](docs/tri-rail-architecture.md) for the full breakdown.

## Research Highlights

- Verified agent payment volume is $1.6M/month — not the $43M self-reported (48-86% is artificial). See [research/data/verified-volumes.md](research/data/verified-volumes.md).
- Agent collections/receivables is a near-total market gap — only PayPal MCP exists, ecosystem-locked. See [docs/collections-gap.md](docs/collections-gap.md).
- Four protocols (x402, MPP, ACP, AP2) are converging into layers, not competing head-to-head. See [docs/protocol-landscape.md](docs/protocol-landscape.md).

## License

- **Code** (everything outside `research/`, `playbook/`, `docs/`): [Apache License 2.0](LICENSE)
- **Content** (`research/`, `playbook/`, `docs/`): [Creative Commons Attribution-ShareAlike 4.0](LICENSE-CONTENT)

See [NOTICE](NOTICE) for attribution details.

## Citation

```bibtex
@software{moltpe_agent_payments,
  author = {Gupta, Umang},
  title = {MoltPe Agent Payments},
  year = {2026},
  url = {https://github.com/umangbuilds/moltpe-agent-payments},
  license = {Apache-2.0}
}
```

## Author

Created by Umang Gupta. [MoltPe](https://moltpe.com) builds payment infrastructure for AI agents.
