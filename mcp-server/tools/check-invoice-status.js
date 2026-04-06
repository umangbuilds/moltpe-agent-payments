// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// check-invoice-status.js — Check the status of an invoice.

module.exports = {
  name: 'check_invoice_status',
  description: 'Check the current status of an invoice (draft, sent, paid, overdue).',
  inputSchema: {
    type: 'object',
    properties: {
      invoiceId: { type: 'string', description: 'The invoice ID to check' },
      provider: { type: 'string', description: 'Provider where invoice was created' }
    },
    required: ['invoiceId']
  },
  handler(args, router) {
    const { invoiceId, provider } = args;

    // Try specified provider, or search all
    if (provider) {
      const p = router.requireProvider(provider);
      return p.getInvoiceStatus(invoiceId);
    }

    for (const p of Object.values(router.providers)) {
      try {
        return p.getInvoiceStatus(invoiceId);
      } catch {
        continue;
      }
    }
    throw new Error(`Invoice not found: ${invoiceId}`);
  }
};
