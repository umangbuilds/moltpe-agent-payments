// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// send-payment.js — Send a payment from one agent to another.

module.exports = {
  name: 'send_payment',
  description: 'Send a payment from one agent to another. Routes to the active payment provider.',
  inputSchema: {
    type: 'object',
    properties: {
      from: { type: 'string', description: 'Sender agent ID' },
      to: { type: 'string', description: 'Recipient agent ID or address' },
      amount: { type: 'number', description: 'Amount to send' },
      currency: { type: 'string', description: 'Currency (USDC for stablecoin, USD/INR/AED for fiat)' },
      chain: { type: 'string', description: 'Chain for stablecoin payments (polygon, base, ethereum)' },
      sessionId: { type: 'string', description: 'Session ID for MPP session payments' },
      paymentMethod: { type: 'string', description: 'For fiat: card or bank_transfer' },
      provider: { type: 'string', description: 'Provider to use: stablecoin, session, or fiat' }
    },
    required: ['from', 'to', 'amount']
  },
  handler(args, router) {
    const { provider, ...params } = args;

    // Auto-detect provider from params
    let providerType = provider;
    if (!providerType) {
      if (params.chain) providerType = 'stablecoin';
      else if (params.sessionId) providerType = 'session';
      else if (params.paymentMethod === 'card' || params.paymentMethod === 'bank_transfer') providerType = 'fiat';
    }

    const p = providerType ? router.requireProvider(providerType) : router.getProvider();
    return p.sendPayment(params);
  }
};
