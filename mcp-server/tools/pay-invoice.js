// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// pay-invoice.js — Pay an invoice through any loaded payment provider.
// Demonstrates the collections layer: invoice is payment-method-agnostic.

module.exports = {
  name: 'pay_invoice',
  description: 'Pay an invoice. The payment is routed through the specified provider, demonstrating that collections (invoicing) sits above the payment rail.',
  inputSchema: {
    type: 'object',
    properties: {
      invoiceId: { type: 'string', description: 'The invoice to pay' },
      agentId: { type: 'string', description: 'The agent making the payment' },
      provider: { type: 'string', description: 'Payment provider to use: stablecoin, session, or fiat' },
      chain: { type: 'string', description: 'For stablecoin payments: chain to pay on' },
      paymentMethod: { type: 'string', description: 'For fiat payments: card or bank_transfer' }
    },
    required: ['invoiceId', 'agentId']
  },
  handler(args, router) {
    const { invoiceId, agentId, provider, chain, paymentMethod } = args;

    // Find the invoice first (search all providers)
    let invoiceProvider = null;
    let invoice = null;
    for (const [name, p] of Object.entries(router.providers)) {
      try {
        invoice = p.getInvoiceStatus(invoiceId);
        invoiceProvider = name;
        break;
      } catch {
        continue;
      }
    }
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

    // Use specified provider to pay, or the one that holds the invoice
    const payProvider = provider || invoiceProvider;
    const p = router.requireProvider(payProvider);
    return p.payInvoice(invoiceId, { agentId, chain, paymentMethod });
  }
};
