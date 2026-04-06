// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// agent-info.js — Get agent details and capabilities.

module.exports = {
  name: 'agent_info',
  description: 'Get details about an AI agent including status, wallets, and capabilities.',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'The agent ID to look up' },
      provider: { type: 'string', description: 'Specific provider: stablecoin, session, or fiat' }
    },
    required: ['agentId']
  },
  handler(args, router) {
    const { agentId, provider } = args;

    if (provider) {
      const p = router.requireProvider(provider);
      return p.getAgentInfo(agentId);
    }

    // Return info from all providers
    const results = {};
    for (const [name, p] of Object.entries(router.providers)) {
      try {
        results[name] = p.getAgentInfo(agentId);
      } catch (err) {
        results[name] = { error: err.message };
      }
    }
    return results;
  }
};
