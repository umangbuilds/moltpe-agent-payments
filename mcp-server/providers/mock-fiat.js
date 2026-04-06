// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// mock-fiat.js — Fiat payment provider (card + bank transfer).
// Supports USD, INR, AED. NO UPI (requires PSP license from NPCI).

const {
  AGENTS,
  createInitialTransactions,
  createInitialInvoices,
  generateTxId,
  generateInvoiceId
} = require('./seed-data.js');

// Mock currency conversion rates
const FX_RATES = {
  'USD/INR': 83.5,
  'USD/AED': 3.67,
  'INR/USD': 1 / 83.5,
  'AED/USD': 1 / 3.67,
  'INR/AED': 3.67 / 83.5,
  'AED/INR': 83.5 / 3.67
};

const SUPPORTED_CURRENCIES = ['USD', 'INR', 'AED'];

class MockFiatProvider {
  constructor() {
    this.transactions = createInitialTransactions();
    this.invoices = createInitialInvoices();
    // Clone fiat balances
    this.balances = {};
    for (const [agentId, agent] of Object.entries(AGENTS)) {
      this.balances[agentId] = {};
      for (const [curr, bal] of Object.entries(agent.fiatBalances || {})) {
        this.balances[agentId][curr] = { ...bal };
      }
    }
  }

  getBalance(agentId, options = {}) {
    const agent = AGENTS[agentId];
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    const currency = options.currency?.toLowerCase();
    if (currency) {
      const bal = this.balances[agentId]?.[currency];
      if (!bal) throw new Error(`Agent ${agentId} has no ${currency.toUpperCase()} balance`);
      return { ...bal };
    }
    const allBalances = Object.values(this.balances[agentId] || {});
    return { balances: allBalances };
  }

  getTransactions(agentId, options = {}) {
    if (!AGENTS[agentId]) throw new Error(`Unknown agent: ${agentId}`);
    const txs = this.transactions[agentId] || [];
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    return txs.slice(offset, offset + limit);
  }

  getAgentInfo(agentId) {
    const agent = AGENTS[agentId];
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    return {
      id: agent.id,
      name: agent.name,
      status: agent.status,
      created: agent.created,
      description: agent.description,
      paymentMethods: agent.fiatPaymentMethods,
      supportedCurrencies: SUPPORTED_CURRENCIES
    };
  }

  sendPayment(params) {
    const { from, to, amount, currency, paymentMethod } = params;
    if (!from || !to || !amount) throw new Error('Required: from, to, amount');
    if (!AGENTS[from]) throw new Error(`Unknown sender: ${from}`);
    if (amount <= 0) throw new Error('Amount must be positive');

    const curr = (currency || 'USD').toLowerCase();
    if (!SUPPORTED_CURRENCIES.includes(curr.toUpperCase())) {
      throw new Error(`Unsupported currency: ${currency}. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`);
    }

    const bal = this.balances[from]?.[curr];
    if (!bal || bal.amount < amount) {
      throw new Error(`Insufficient ${curr.toUpperCase()} balance. Available: ${bal?.amount || 0}`);
    }

    // Simulate card authorization or bank transfer
    const method = paymentMethod || 'card';
    // Note: UPI is not supported. It requires a PSP license from NPCI.
    if (method === 'upi') {
      throw new Error('UPI is not supported. UPI integration requires a PSP license from NPCI.');
    }

    bal.amount = Math.round((bal.amount - amount) * 100) / 100;

    // Credit recipient if they exist
    if (this.balances[to]?.[curr]) {
      this.balances[to][curr].amount = Math.round((this.balances[to][curr].amount + amount) * 100) / 100;
    }

    const txId = generateTxId();
    const status = method === 'bank_transfer' ? 'processing' : 'authorized';
    const tx = {
      id: txId,
      type: 'send',
      from,
      to,
      amount,
      currency: curr.toUpperCase(),
      paymentMethod: method,
      status,
      timestamp: new Date().toISOString(),
      settlementEstimate: method === 'bank_transfer' ? '1-3 business days' : '1-2 business days'
    };

    if (!this.transactions[from]) this.transactions[from] = [];
    this.transactions[from].push(tx);

    return { txId, status, amount, currency: curr.toUpperCase(), from, to, paymentMethod: method, settlementEstimate: tx.settlementEstimate };
  }

  convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const key = `${fromCurrency.toUpperCase()}/${toCurrency.toUpperCase()}`;
    const rate = FX_RATES[key];
    if (!rate) throw new Error(`No exchange rate for ${key}`);
    return Math.round(amount * rate * 100) / 100;
  }

  createInvoice(params) {
    const { createdBy, billedTo, amount, currency, description, dueDate } = params;
    if (!createdBy || !amount || !currency) throw new Error('Required: createdBy, amount, currency');
    if (amount <= 0) throw new Error('Amount must be positive');

    const invoiceId = generateInvoiceId();
    const invoice = {
      invoiceId,
      createdBy,
      billedTo: billedTo || null,
      amount,
      currency: currency || 'USD',
      status: 'draft',
      description: description || '',
      dueDate: dueDate || null,
      acceptedMethods: ['card', 'bank_transfer'],
      created: new Date().toISOString()
    };

    this.invoices[invoiceId] = invoice;
    return invoice;
  }

  getInvoiceStatus(invoiceId) {
    const invoice = this.invoices[invoiceId];
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
    return { ...invoice };
  }

  listInvoices(agentId, options = {}) {
    const status = options.status;
    return Object.values(this.invoices)
      .filter(inv => inv.createdBy === agentId || inv.billedTo === agentId)
      .filter(inv => !status || inv.status === status);
  }

  payInvoice(invoiceId, params = {}) {
    const invoice = this.invoices[invoiceId];
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
    if (invoice.status === 'paid') throw new Error('Invoice already paid');

    const agentId = params.agentId;
    if (!agentId) throw new Error('Required: agentId');

    const result = this.sendPayment({
      from: agentId,
      to: invoice.createdBy,
      amount: invoice.amount,
      currency: invoice.currency,
      paymentMethod: params.paymentMethod || 'card'
    });

    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.paidVia = 'fiat';
    invoice.paymentTxId = result.txId;

    return { invoiceId, status: 'paid', txId: result.txId, amount: invoice.amount, currency: invoice.currency };
  }
}

module.exports = { MockFiatProvider };
