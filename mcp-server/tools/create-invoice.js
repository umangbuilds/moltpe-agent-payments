// create-invoice.js — Create an invoice (collections layer).
// Works with all providers — collections sits above the payment rail.

module.exports = {
  name: 'create_invoice',
  description: 'Create a payment invoice. This is a collections-layer operation that works across all payment providers. The invoice can be paid via any loaded payment method.',
  inputSchema: {
    type: 'object',
    properties: {
      createdBy: { type: 'string', description: 'Agent ID creating the invoice' },
      billedTo: { type: 'string', description: 'Agent ID being billed (optional)' },
      amount: { type: 'number', description: 'Invoice amount' },
      currency: { type: 'string', description: 'Currency (USDC, USD, INR, AED)' },
      description: { type: 'string', description: 'What this invoice is for' },
      dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD format)' },
      provider: { type: 'string', description: 'Provider to create invoice on (default: first available)' }
    },
    required: ['createdBy', 'amount', 'currency']
  },
  handler(args, router) {
    const { provider, ...params } = args;
    const p = provider ? router.requireProvider(provider) : router.getProvider();
    return p.createInvoice(params);
  }
};
