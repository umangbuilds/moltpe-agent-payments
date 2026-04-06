// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// list-transactions.js — Get transaction history for an agent.

module.exports = {
  name: 'list_transactions',
  description: 'List recent transactions for an AI agent. Supports pagination.',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'The agent ID' },
      limit: { type: 'number', description: 'Max results to return (default 50)' },
      offset: { type: 'number', description: 'Offset for pagination (default 0)' },
      provider: { type: 'string', description: 'Specific provider: stablecoin, session, or fiat' }
    },
    required: ['agentId']
  },
  handler(args, router) {
    const { agentId, limit, offset, provider } = args;
    const p = provider ? router.requireProvider(provider) : router.getProvider();
    return p.getTransactions(agentId, { limit, offset });
  }
};
