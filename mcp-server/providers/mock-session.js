// mock-session.js — MPP (Machine Payment Protocol) session-based payment provider.
// Simulates session-based streaming payments: authorize budget, pay within session, close.

const {
  AGENTS,
  createInitialTransactions,
  createInitialInvoices,
  createInitialSessions,
  generateTxId,
  generateInvoiceId,
  generateSessionId
} = require('./seed-data.js');

class MockSessionProvider {
  constructor() {
    this.transactions = createInitialTransactions();
    this.invoices = createInitialInvoices();
    this.sessions = createInitialSessions();
    // Clone session balances
    this.balances = {};
    for (const [agentId, agent] of Object.entries(AGENTS)) {
      this.balances[agentId] = {};
      for (const [curr, bal] of Object.entries(agent.sessionBalances || {})) {
        this.balances[agentId][curr] = { ...bal };
      }
    }
  }

  getBalance(agentId) {
    const agent = AGENTS[agentId];
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    const balances = Object.values(this.balances[agentId] || {});
    return { balances, currency: 'USD' };
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
    // List active sessions for this agent
    const activeSessions = Object.values(this.sessions)
      .filter(s => s.agentId === agentId && s.status === 'active')
      .map(s => ({ sessionId: s.sessionId, budget: s.budget, remaining: s.remaining }));
    return {
      id: agent.id,
      name: agent.name,
      status: agent.status,
      created: agent.created,
      description: agent.description,
      activeSessions
    };
  }

  sendPayment(params) {
    const { from, to, amount, currency, sessionId } = params;
    if (!from || !to || !amount) throw new Error('Required: from, to, amount');

    // If sessionId provided, pay within session
    if (sessionId) {
      return this.payWithinSession(sessionId, { to, amount, currency });
    }

    // Direct payment (deduct from balance)
    const curr = (currency || 'USD').toLowerCase();
    const bal = this.balances[from]?.[curr];
    if (!bal || bal.amount < amount) {
      throw new Error(`Insufficient balance. Available: ${bal?.amount || 0} ${currency || 'USD'}`);
    }

    bal.amount = Math.round((bal.amount - amount) * 100) / 100;

    const txId = generateTxId();
    const tx = {
      id: txId,
      type: 'send',
      from,
      to,
      amount,
      currency: currency || 'USD',
      status: 'settled',
      timestamp: new Date().toISOString()
    };

    if (!this.transactions[from]) this.transactions[from] = [];
    this.transactions[from].push(tx);

    return { txId, status: 'settled', amount, currency: currency || 'USD', from, to };
  }

  createSession(params) {
    const { agentId, budget, currency, description } = params;
    if (!agentId || !budget) throw new Error('Required: agentId, budget');
    if (!AGENTS[agentId]) throw new Error(`Unknown agent: ${agentId}`);
    if (budget <= 0) throw new Error('Budget must be positive');

    // Check agent has enough balance to back the session
    const curr = (currency || 'USD').toLowerCase();
    const bal = this.balances[agentId]?.[curr];
    if (!bal || bal.amount < budget) {
      throw new Error(`Insufficient balance to create session. Available: ${bal?.amount || 0} ${currency || 'USD'}, Requested: ${budget}`);
    }

    // Reserve funds
    bal.amount = Math.round((bal.amount - budget) * 100) / 100;

    const sessionId = generateSessionId();
    const session = {
      sessionId,
      agentId,
      budget,
      spent: 0,
      remaining: budget,
      currency: currency || 'USD',
      description: description || '',
      status: 'active',
      created: new Date().toISOString(),
      expiry: new Date(Date.now() + 3600000).toISOString(),
      payments: []
    };

    this.sessions[sessionId] = session;
    return { sessionId, budget, remaining: budget, currency: currency || 'USD', expiry: session.expiry, status: 'active' };
  }

  getSessionStatus(sessionId) {
    const session = this.sessions[sessionId];
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Check if expired
    if (session.status === 'active' && new Date(session.expiry) < new Date()) {
      session.status = 'expired';
    }

    return {
      sessionId: session.sessionId,
      agentId: session.agentId,
      budget: session.budget,
      spent: session.spent,
      remaining: session.remaining,
      currency: session.currency,
      status: session.status,
      paymentCount: session.payments.length,
      created: session.created,
      expiry: session.expiry,
      description: session.description
    };
  }

  payWithinSession(sessionId, params) {
    const session = this.sessions[sessionId];
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    if (session.status !== 'active') throw new Error(`Session is ${session.status}. Cannot make payments.`);

    // Check expiry
    if (new Date(session.expiry) < new Date()) {
      session.status = 'expired';
      throw new Error(`Session expired at ${session.expiry}`);
    }

    const { to, amount } = params;
    if (!to || !amount) throw new Error('Required: to, amount');
    if (amount <= 0) throw new Error('Amount must be positive');

    if (amount > session.remaining) {
      throw new Error(`Exceeds session budget. Remaining: ${session.remaining} ${session.currency}`);
    }

    session.spent = Math.round((session.spent + amount) * 100) / 100;
    session.remaining = Math.round((session.remaining - amount) * 100) / 100;

    const payment = { amount, to, timestamp: new Date().toISOString() };
    session.payments.push(payment);

    const txId = generateTxId();
    const tx = {
      id: txId,
      type: 'session-payment',
      from: session.agentId,
      to,
      amount,
      currency: session.currency,
      sessionId,
      status: 'settled',
      timestamp: payment.timestamp
    };

    if (!this.transactions[session.agentId]) this.transactions[session.agentId] = [];
    this.transactions[session.agentId].push(tx);

    return { txId, status: 'settled', amount, remaining: session.remaining, currency: session.currency, sessionId };
  }

  closeSession(sessionId) {
    const session = this.sessions[sessionId];
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    if (session.status === 'closed') throw new Error('Session already closed');

    // Refund unused budget
    if (session.remaining > 0) {
      const curr = session.currency.toLowerCase();
      if (this.balances[session.agentId]?.[curr]) {
        this.balances[session.agentId][curr].amount = Math.round((this.balances[session.agentId][curr].amount + session.remaining) * 100) / 100;
      }
    }

    session.status = 'closed';

    return {
      sessionId,
      status: 'closed',
      summary: {
        budget: session.budget,
        spent: session.spent,
        refunded: session.remaining,
        currency: session.currency,
        paymentCount: session.payments.length,
        duration: `${Math.round((Date.now() - new Date(session.created).getTime()) / 1000)}s`
      }
    };
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
      acceptedMethods: ['session', 'stablecoin', 'fiat'],
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
      currency: invoice.currency
    });

    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.paidVia = 'session';
    invoice.paymentTxId = result.txId;

    return { invoiceId, status: 'paid', txId: result.txId, amount: invoice.amount, currency: invoice.currency };
  }
}

module.exports = { MockSessionProvider };
