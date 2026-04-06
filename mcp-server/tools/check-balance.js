// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// check-balance.js — Get agent balance across payment rails.

module.exports = {
  name: 'check_balance',
  description: 'Check the balance of an AI agent. Returns balances across all loaded payment providers.',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'The agent ID to check balance for' },
      chain: { type: 'string', description: 'Specific chain for stablecoin balances (polygon, base, ethereum)' },
      currency: { type: 'string', description: 'Specific currency for fiat balances (USD, INR, AED)' },
      provider: { type: 'string', description: 'Specific provider to query: stablecoin, session, or fiat' }
    },
    required: ['agentId']
  },
  handler(args, router) {
    const { agentId, chain, currency, provider } = args;

    if (provider) {
      const p = router.requireProvider(provider);
      return p.getBalance(agentId, { chain, currency });
    }

    // Query all loaded providers
    const results = {};
    for (const [name, p] of Object.entries(router.providers)) {
      try {
        results[name] = p.getBalance(agentId, { chain, currency });
      } catch (err) {
        results[name] = { error: err.message };
      }
    }
    return results;
  }
};
