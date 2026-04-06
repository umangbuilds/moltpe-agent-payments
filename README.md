# MoltPe Agent Payments

Payment infrastructure for AI agents — reference implementation with x402, MPP, and fiat payment paths.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Content: CC BY-SA 4.0](https://img.shields.io/badge/Content-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-CONTENT)
[![npm: coming soon](https://img.shields.io/badge/npm-coming%20soon-inactive)]()
[![tests: coming soon](https://img.shields.io/badge/tests-coming%20soon-inactive)]()

> **Disclaimer:** This is a reference implementation with mock data. For production, implement real PaymentProvider adapters. MoltPe's production server is at moltpe.com/mcp.

## What This Is

This repository contains a reference implementation for handling payments in AI agent systems. It supports three payment paths: stablecoin micropayments (x402), session-based streaming (MPP), and traditional fiat rails. The goal is to show how agents can pay, get paid, and manage money across different protocols.

## Quick Start

The MCP server and x402 client ship in a future release. Once available:

```bash
# Install the MCP server
npm install @moltpe/mcp-payments

# Install the x402 client
npm install @moltpe/x402-client
```

Configuration and usage docs will accompany each package release.

## What's Inside

| Directory | Description |
|-----------|-------------|
| `research/` | Market research, protocol analysis, competitive landscape |
| `mcp-server/` | MCP server for agent payment operations (coming soon) |
| `x402-client/` | x402 protocol client for stablecoin micropayments (coming soon) |
| `playbook/` | Build playbook: process, templates, results from building this |
| `docs/` | Architecture docs, protocol landscape, market analysis |

## Tri-Rail Architecture

This implementation supports three parallel payment paths:

- **Path A — Stablecoin (x402):** Per-request micropayments settled on-chain in USDC
- **Path B — Session-based (MPP):** Authorize a budget, stream payments within a session
- **Path C — Fiat:** Traditional card authorization, capture, and settlement

Each path serves different use cases. A collections layer sits above all three to handle agent receivables. See [docs/tri-rail-architecture.md](docs/tri-rail-architecture.md) for the full breakdown.

## Research Highlights

- Protocol landscape analysis covering x402, MPP, ACP, and AP2 (coming soon)
- Competitive review of existing agent payment solutions (coming soon)
- Market gap analysis for agent collections and receivables (coming soon)

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
