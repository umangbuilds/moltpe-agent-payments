// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// create-payment-session.js — Create an MPP payment session.
// Only works with the session provider.

module.exports = {
  name: 'create_payment_session',
  description: 'Create an MPP (Machine Payment Protocol) session. Authorize a budget and make streaming payments within the session without per-payment authorization.',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'Agent creating the session' },
      budget: { type: 'number', description: 'Maximum spend for this session' },
      currency: { type: 'string', description: 'Currency (default USD)' },
      description: { type: 'string', description: 'What this session is for' }
    },
    required: ['agentId', 'budget']
  },
  handler(args, router) {
    const p = router.requireProvider('session');
    return p.createSession(args);
  }
};
