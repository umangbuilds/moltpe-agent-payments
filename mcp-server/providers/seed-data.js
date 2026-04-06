// seed-data.js — Shared test agents and balances for all mock providers.
// All data is in-memory and resets on server restart.

const AGENTS = {
  'agent-alice': {
    id: 'agent-alice',
    name: 'Alice Trading Agent',
    status: 'active',
    created: '2026-01-15T10:00:00Z',
    token: 'test-token-alice',
    description: 'Active trading agent with multi-chain stablecoin balances',
    wallets: {
      polygon: '0x1111111111111111111111111111111111111111',
      base: '0x2222222222222222222222222222222222222222',
      ethereum: '0x3333333333333333333333333333333333333333'
    },
    stablecoinBalances: {
      polygon: { amount: 100, currency: 'USDC', chain: 'polygon', chainId: 137 },
      base: { amount: 50, currency: 'USDC', chain: 'base', chainId: 8453 },
      ethereum: { amount: 25, currency: 'USDC', chain: 'ethereum', chainId: 1 }
    },
    sessionBalances: {
      usd: { amount: 200, currency: 'USD' }
    },
    fiatBalances: {
      usd: { amount: 500, currency: 'USD' },
      inr: { amount: 25000, currency: 'INR' },
      aed: { amount: 1000, currency: 'AED' }
    },
    fiatPaymentMethods: [
      { type: 'card', brand: 'visa', last4: '4242', expiry: '12/27' },
      { type: 'card', brand: 'mastercard', last4: '5555', expiry: '06/28' },
      { type: 'bank_transfer', method: 'ach', bankName: 'Test Bank', last4: '9876' }
    ]
  },
  'agent-bob': {
    id: 'agent-bob',
    name: 'Bob Service Provider',
    status: 'active',
    created: '2026-02-01T14:30:00Z',
    token: 'test-token-bob',
    description: 'Service provider agent that issues invoices and collects payments',
    wallets: {
      polygon: '0x4444444444444444444444444444444444444444',
      base: '0x5555555555555555555555555555555555555555'
    },
    stablecoinBalances: {
      polygon: { amount: 250, currency: 'USDC', chain: 'polygon', chainId: 137 },
      base: { amount: 100, currency: 'USDC', chain: 'base', chainId: 8453 }
    },
    sessionBalances: {
      usd: { amount: 500, currency: 'USD' }
    },
    fiatBalances: {
      usd: { amount: 1200, currency: 'USD' },
      inr: { amount: 50000, currency: 'INR' }
    },
    fiatPaymentMethods: [
      { type: 'card', brand: 'visa', last4: '1234', expiry: '09/27' },
      { type: 'bank_transfer', method: 'neft', bankName: 'India Bank', last4: '4321' }
    ]
  },
  'agent-charlie': {
    id: 'agent-charlie',
    name: 'Charlie New Agent',
    status: 'active',
    created: '2026-03-20T09:00:00Z',
    token: 'test-token-charlie',
    description: 'Newly created agent with minimal balances',
    wallets: {
      base: '0x6666666666666666666666666666666666666666'
    },
    stablecoinBalances: {
      base: { amount: 10, currency: 'USDC', chain: 'base', chainId: 8453 }
    },
    sessionBalances: {
      usd: { amount: 25, currency: 'USD' }
    },
    fiatBalances: {
      usd: { amount: 50, currency: 'USD' }
    },
    fiatPaymentMethods: [
      { type: 'card', brand: 'visa', last4: '7890', expiry: '03/28' }
    ]
  }
};

// Pre-built transaction histories (mutable — payments add to these)
function createInitialTransactions() {
  return {
    'agent-alice': [
      { id: 'tx-001', type: 'receive', from: 'agent-bob', to: 'agent-alice', amount: 15, currency: 'USDC', chain: 'polygon', status: 'confirmed', timestamp: '2026-03-01T12:00:00Z', description: 'Payment for API data access' },
      { id: 'tx-002', type: 'send', from: 'agent-alice', to: 'agent-charlie', amount: 5, currency: 'USDC', chain: 'base', status: 'confirmed', timestamp: '2026-03-05T08:30:00Z', description: 'Tip for verified data' },
      { id: 'tx-003', type: 'x402', from: 'agent-alice', to: 'api.weather.example', amount: 0.01, currency: 'USDC', chain: 'base', status: 'confirmed', timestamp: '2026-03-10T14:15:00Z', description: 'Weather API call via x402' }
    ],
    'agent-bob': [
      { id: 'tx-004', type: 'send', from: 'agent-bob', to: 'agent-alice', amount: 15, currency: 'USDC', chain: 'polygon', status: 'confirmed', timestamp: '2026-03-01T12:00:00Z', description: 'Payment for API data access' },
      { id: 'tx-005', type: 'receive', from: 'external', to: 'agent-bob', amount: 100, currency: 'USD', status: 'settled', timestamp: '2026-03-02T16:00:00Z', description: 'Invoice payment from client' }
    ],
    'agent-charlie': [
      { id: 'tx-006', type: 'receive', from: 'agent-alice', to: 'agent-charlie', amount: 5, currency: 'USDC', chain: 'base', status: 'confirmed', timestamp: '2026-03-05T08:30:00Z', description: 'Tip from alice' }
    ]
  };
}

// Pre-built invoices (mutable)
function createInitialInvoices() {
  return {
    'inv-001': { invoiceId: 'inv-001', createdBy: 'agent-bob', billedTo: 'agent-alice', amount: 25, currency: 'USDC', status: 'sent', description: 'Data scraping service — March 2026', dueDate: '2026-04-15', acceptedMethods: ['stablecoin', 'fiat'], created: '2026-03-15T10:00:00Z' },
    'inv-002': { invoiceId: 'inv-002', createdBy: 'agent-bob', billedTo: 'agent-charlie', amount: 10, currency: 'USD', status: 'overdue', description: 'API access fee — February 2026', dueDate: '2026-03-01', acceptedMethods: ['stablecoin', 'fiat', 'session'], created: '2026-02-15T10:00:00Z' },
    'inv-003': { invoiceId: 'inv-003', createdBy: 'agent-alice', billedTo: 'agent-bob', amount: 50, currency: 'USDC', status: 'paid', description: 'Research data compilation', dueDate: '2026-03-30', acceptedMethods: ['stablecoin'], created: '2026-03-10T08:00:00Z', paidAt: '2026-03-12T14:00:00Z', paidVia: 'stablecoin' }
  };
}

// Pre-built MPP sessions (mutable)
function createInitialSessions() {
  return {
    'session-001': {
      sessionId: 'session-001',
      agentId: 'agent-alice',
      budget: 25,
      spent: 14.40,
      remaining: 10.60,
      currency: 'USD',
      description: 'Research data gathering session',
      status: 'active',
      created: '2026-04-06T08:00:00Z',
      expiry: new Date(Date.now() + 3600000).toISOString(),
      payments: [
        { amount: 1.20, to: 'data-api-1', timestamp: '2026-04-06T08:05:00Z' },
        { amount: 1.20, to: 'data-api-1', timestamp: '2026-04-06T08:10:00Z' },
        { amount: 1.20, to: 'data-api-2', timestamp: '2026-04-06T08:15:00Z' },
        { amount: 1.20, to: 'data-api-2', timestamp: '2026-04-06T08:20:00Z' },
        { amount: 1.20, to: 'verification-svc', timestamp: '2026-04-06T08:25:00Z' },
        { amount: 1.20, to: 'verification-svc', timestamp: '2026-04-06T08:30:00Z' },
        { amount: 1.20, to: 'data-api-3', timestamp: '2026-04-06T08:35:00Z' },
        { amount: 1.20, to: 'data-api-3', timestamp: '2026-04-06T08:40:00Z' },
        { amount: 1.20, to: 'data-api-1', timestamp: '2026-04-06T08:45:00Z' },
        { amount: 1.20, to: 'summarizer', timestamp: '2026-04-06T08:50:00Z' },
        { amount: 1.20, to: 'summarizer', timestamp: '2026-04-06T08:55:00Z' },
        { amount: 1.20, to: 'formatter', timestamp: '2026-04-06T09:00:00Z' }
      ]
    }
  };
}

// Helper: generate a mock transaction ID
function generateTxId() {
  return 'tx-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Helper: generate a mock on-chain tx hash
function generateTxHash() {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return '0x' + hex;
}

// Helper: generate an invoice ID
function generateInvoiceId() {
  return 'inv-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Helper: generate a session ID
function generateSessionId() {
  return 'session-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

module.exports = {
  AGENTS,
  createInitialTransactions,
  createInitialInvoices,
  createInitialSessions,
  generateTxId,
  generateTxHash,
  generateInvoiceId,
  generateSessionId
};
