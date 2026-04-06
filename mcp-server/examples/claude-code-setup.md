# Setting Up MoltPe MCP Server with Claude Code

## Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/umangbuilds/moltpe-agent-payments.git
   cd moltpe-agent-payments/mcp-server
   ```

2. Install (no external dependencies):

   ```bash
   npm install
   ```

3. Add to your Claude Code MCP settings:

   ```bash
   claude mcp add moltpe-payments -- node /path/to/mcp-server/server.js --provider all
   ```

4. Start Claude Code. You should see 11 payment tools available.

5. Try it out:

   ```
   Check the balance for agent-alice
   ```

## Provider Options

- `--provider stablecoin` — x402 USDC micropayments only
- `--provider session` — MPP session-based payments only
- `--provider fiat` — Card and bank transfer only
- `--provider all` — All three providers (default)

## Environment Variables

- `PORT` — Server port (default: 3000)
- `AUTH_ENABLED` — Require bearer token auth (default: false)
- `RATE_LIMIT` — Requests per minute per IP (default: 60)
