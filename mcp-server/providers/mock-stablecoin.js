// © 2026 Umang Gupta | Apache-2.0 | github.com/umangbuilds/moltpe-agent-payments
// mock-stablecoin.js — x402 stablecoin payment provider.
// Simulates on-chain USDC micropayments across Polygon, Base, and Ethereum.

const {
  AGENTS,
  createInitialTransactions,
  createInitialInvoices,
  generateTxId,
  generateTxHash,
  generateInvoiceId
} = require('./seed-data.js');

const SUPPORTED_CHAINS = {
  polygon: { chainId: 137, name: 'Polygon PoS' },
  base: { chainId: 8453, name: 'Base' },
  ethereum: { chainId: 1, name: 'Ethereum' }
};

class MockStablecoinProvider {
  constructor() {
    this.transactions = createInitialTransactions();
    this.invoices = createInitialInvoices();
    // Deep-clone balances so mutations don't affect AGENTS constant
    this.balances = {};
    for (const [agentId, agent] of Object.entries(AGENTS)) {
      this.balances[agentId] = {};
      for (const [chain, bal] of Object.entries(agent.stablecoinBalances || {})) {
        this.balances[agentId][chain] = { ...bal };
      }
    }
  }

  getBalance(agentId, options = {}) {
    const agent = AGENTS[agentId];
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);

    const chain = options.chain;
    if (chain) {
      if (!SUPPORTED_CHAINS[chain]) throw new Error(`Unsupported chain: ${chain}. Supported: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`);
      const bal = this.balances[agentId]?.[chain];
      if (!bal) throw new Error(`Agent ${agentId} has no balance on ${chain}`);
      return { ...bal };
    }

    // Return all chain balances
    const allBalances = Object.values(this.balances[agentId] || {});
    const total = allBalances.reduce((sum, b) => sum + b.amount, 0);
    return { total, currency: 'USDC', balances: allBalances };
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
      wallets: agent.wallets,
      supportedChains: Object.keys(agent.stablecoinBalances || {})
    };
  }

  sendPayment(params) {
    const { from, to, amount, currency, chain } = params;
    if (!from || !to || !amount || !chain) {
      throw new Error('Required: from, to, amount, chain');
    }
    if (currency && currency !== 'USDC') {
      throw new Error('Stablecoin provider only supports USDC');
    }
    if (!SUPPORTED_CHAINS[chain]) {
      throw new Error(`Unsupported chain: ${chain}. Supported: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`);
    }
    if (!AGENTS[from]) throw new Error(`Unknown sender: ${from}`);
    if (amount <= 0) throw new Error('Amount must be positive');

    const senderBal = this.balances[from]?.[chain];
    if (!senderBal || senderBal.amount < amount) {
      throw new Error(`Insufficient balance on ${chain}. Available: ${senderBal?.amount || 0} USDC`);
    }

    // Deduct from sender
    senderBal.amount = Math.round((senderBal.amount - amount) * 100) / 100;

    // Credit to recipient if they exist in system
    if (this.balances[to]?.[chain]) {
      this.balances[to][chain].amount = Math.round((this.balances[to][chain].amount + amount) * 100) / 100;
    }

    const txId = generateTxId();
    const txHash = generateTxHash();
    const tx = {
      id: txId,
      txHash,
      type: 'send',
      from,
      to,
      amount,
      currency: 'USDC',
      chain,
      chainId: SUPPORTED_CHAINS[chain].chainId,
      status: 'confirmed',
      timestamp: new Date().toISOString()
    };

    if (!this.transactions[from]) this.transactions[from] = [];
    this.transactions[from].push(tx);
    if (AGENTS[to]) {
      if (!this.transactions[to]) this.transactions[to] = [];
      this.transactions[to].push({ ...tx, type: 'receive' });
    }

    return { txId, txHash, status: 'confirmed', amount, currency: 'USDC', chain, from, to };
  }

  callX402Endpoint(url, params = {}) {
    const agentId = params.agentId;
    const maxAmount = params.maxAmount || 0.10;
    const chain = params.chain || 'base';

    if (!agentId) throw new Error('Required: agentId');
    if (!AGENTS[agentId]) throw new Error(`Unknown agent: ${agentId}`);
    if (!SUPPORTED_CHAINS[chain]) throw new Error(`Unsupported chain: ${chain}`);

    // Simulate: server returns 402 → agent pays → server returns data
    const cost = Math.round((Math.random() * maxAmount * 0.5 + 0.001) * 10000) / 10000;

    const senderBal = this.balances[agentId]?.[chain];
    if (!senderBal || senderBal.amount < cost) {
      throw new Error(`Insufficient balance for x402 payment. Cost: ${cost} USDC, Available: ${senderBal?.amount || 0} USDC`);
    }

    senderBal.amount = Math.round((senderBal.amount - cost) * 10000) / 10000;

    const txId = generateTxId();
    const txHash = generateTxHash();
    const tx = {
      id: txId,
      txHash,
      type: 'x402',
      from: agentId,
      to: url,
      amount: cost,
      currency: 'USDC',
      chain,
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      description: `x402 payment for ${url}`
    };

    if (!this.transactions[agentId]) this.transactions[agentId] = [];
    this.transactions[agentId].push(tx);

    return {
      status: 200,
      x402: { cost, currency: 'USDC', chain, txHash },
      data: { message: `Mock response from ${url}`, timestamp: new Date().toISOString(), requestId: txId }
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
      currency: currency || 'USDC',
      status: 'draft',
      description: description || '',
      dueDate: dueDate || null,
      acceptedMethods: ['stablecoin'],
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

    const payerAgent = params.agentId;
    if (!payerAgent) throw new Error('Required: agentId');

    const chain = params.chain || 'polygon';
    const result = this.sendPayment({
      from: payerAgent,
      to: invoice.createdBy,
      amount: invoice.amount,
      currency: invoice.currency,
      chain
    });

    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.paidVia = 'stablecoin';
    invoice.paymentTxId = result.txId;

    return { invoiceId, status: 'paid', txId: result.txId, amount: invoice.amount, currency: invoice.currency };
  }
}

module.exports = { MockStablecoinProvider };
