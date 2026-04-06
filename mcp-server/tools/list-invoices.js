// list-invoices.js — List invoices for an agent.

module.exports = {
  name: 'list_invoices',
  description: 'List invoices created by or billed to an agent. Optional status filter.',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'The agent ID' },
      status: { type: 'string', description: 'Filter by status: draft, sent, paid, overdue' },
      provider: { type: 'string', description: 'Provider to query' }
    },
    required: ['agentId']
  },
  handler(args, router) {
    const { agentId, status, provider } = args;
    const p = provider ? router.requireProvider(provider) : router.getProvider();
    return p.listInvoices(agentId, { status });
  }
};
