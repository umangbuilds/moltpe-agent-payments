# MCP Payment Server — Reference Implementation

Part of [moltpe-agent-payments](https://github.com/umangbuilds/moltpe-agent-payments). See also: [x402 Client SDK](../x402-client/) | [Research](../research/)

Payment tools for AI agents via MCP (Model Context Protocol). Supports three payment rails: stablecoin (x402), session-based (MPP), and fiat (card/bank).

> **Disclaimer:** This is a reference implementation with mock data. All balances, transactions, and payments are simulated. For production, implement real PaymentProvider adapters. MoltPe's production server is at moltpe.com/mcp.

## Quick Start

```bash
cd mcp-server
npm install
npm start
```

The server starts on port 3000 with all three providers loaded.

## Provider Flags

```bash
node server.js --provider stablecoin   # x402 USDC micropayments
node server.js --provider session      # MPP session-based payments
node server.js --provider fiat         # Card and bank transfer
node server.js --provider all          # All three (default)
```

## Tools

| Tool | Description | Providers |
|------|-------------|-----------|
| `check_balance` | Get agent balance | All |
| `list_transactions` | Transaction history | All |
| `agent_info` | Agent details and capabilities | All |
| `send_payment` | Send payment to another agent | All |
| `call_x402_endpoint` | Call x402-protected HTTP endpoint | Stablecoin |
| `create_invoice` | Create a payment invoice | All |
| `check_invoice_status` | Check invoice status | All |
| `list_invoices` | List invoices for an agent | All |
| `pay_invoice` | Pay an invoice via any provider | All |
| `create_payment_session` | Create an MPP payment session | Session |
| `get_session_status` | Check session status | Session |

## Architecture

```
┌──────────────────────────────────────┐
│           MCP Server (JSON-RPC)       │
├──────────────────────────────────────┤
│  Auth Middleware  |  Rate Limiter     │
├──────────────────────────────────────┤
│              11 MCP Tools             │
│  (check_balance, send_payment, ...)   │
├──────────────────────────────────────┤
│           Provider Router             │
├────────────┬───────────┬─────────────┤
│ Stablecoin │  Session  │    Fiat     │
│   (x402)   │   (MPP)   │ (card/bank) │
└────────────┴───────────┴─────────────┘
```

## When to Use Which Provider

| Use case | Provider | Why |
|----------|----------|-----|
| Per-request API micropayments | Stablecoin (x402) | Immediate on-chain settlement in USDC |
| Multi-call session with budget cap | Session (MPP) | One authorization, stream payments, refund unused |
| Enterprise billing, existing card setup | Fiat | Standard card/bank rails, 1-3 day settlement |
| Agent invoicing and collections | Any | Collections layer sits above all three rails |

## Test Agents

| Agent | Description | Stablecoin | Session | Fiat |
|-------|-------------|------------|---------|------|
| agent-alice | Active trader | 175 USDC (3 chains) | $200 USD | $500 USD, INR, AED |
| agent-bob | Service provider | 350 USDC (2 chains) | $500 USD | $1,200 USD, INR |
| agent-charlie | New agent | 10 USDC (1 chain) | $25 USD | $50 USD |

Auth tokens: `test-token-alice`, `test-token-bob`, `test-token-charlie`

## Docker

```bash
docker build -t moltpe-mcp .
docker run -p 3000:3000 moltpe-mcp
```

Or with docker-compose:

```bash
docker-compose up
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| AUTH_ENABLED | false | Require bearer token authentication |
| RATE_LIMIT | 60 | Max requests per minute per IP |

## Examples

See the `examples/` directory for:
- Claude Desktop configuration
- Claude Code setup
- Programmatic tool calling
- MPP session workflow
- Protocol comparison (same task, three ways)

## Health Check

```bash
curl http://localhost:3000/health
```

Returns: `{"status":"ok","provider":"all"}`

## Tests

```bash
npm test
```

Runs 53 test cases across all providers.

## Related Docs

- [Tri-Rail Architecture](../docs/tri-rail-architecture.md)
- [Protocol Landscape](../docs/protocol-landscape.md)
- [Collections Gap](../docs/collections-gap.md)

## License

[Apache License 2.0](../LICENSE)
