// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// get-session-status.js — Check status of an MPP payment session.

module.exports = {
  name: 'get_session_status',
  description: 'Check the status of an MPP payment session including budget, spent, remaining, and payment count.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'The session ID to check' }
    },
    required: ['sessionId']
  },
  handler(args, router) {
    const p = router.requireProvider('session');
    return p.getSessionStatus(args.sessionId);
  }
};
