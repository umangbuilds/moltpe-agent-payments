// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// call-x402-endpoint.js — Call an x402-protected HTTP endpoint.
// Only works with the stablecoin provider.

module.exports = {
  name: 'call_x402_endpoint',
  description: 'Call an HTTP endpoint protected by the x402 payment protocol. Automatically handles 402 Payment Required, sends USDC, and returns the response.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The x402-protected endpoint URL' },
      agentId: { type: 'string', description: 'Agent making the payment' },
      maxAmount: { type: 'number', description: 'Maximum USDC to pay (default 0.10)' },
      chain: { type: 'string', description: 'Chain to pay on (default: base)' }
    },
    required: ['url', 'agentId']
  },
  handler(args, router) {
    const p = router.requireProvider('stablecoin');
    return p.callX402Endpoint(args.url, {
      agentId: args.agentId,
      maxAmount: args.maxAmount,
      chain: args.chain
    });
  }
};
